// CraftMind Fishing — Fleet Captain AI
// Strategic decision-making layer that uses LLM for high-level fleet management.

import { BehaviorScript, DefaultScripts } from './behavior-script.js';
import { generateScriptModification, compressContext } from './script-writer.js';

const CAPTAIN_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const CAPTAIN_MODEL = 'glm-4.7-flash';

export class FleetCaptain {
  constructor(options = {}) {
    this.fleet = options.fleet;
    this.model = options.model ?? CAPTAIN_MODEL;
    this.apiKey = options.apiKey ?? process.env.ZAI_API_KEY;

    // Fleet-level behavior script (higher abstraction than individual scripts)
    this.script = options.script ?? new BehaviorScript({
      rules: [
        { id: 'recall_storm', condition: 'storm_approaching AND fleet_spread', action: 'recall_fleet', priority: 90 },
        { id: 'redirect_profit', condition: 'market_price > 2x_average', action: 'redirect_fleet_to_species', priority: 70 },
        { id: 'heal_damaged', condition: 'member_damaged', action: 'support_heal_member', priority: 80 },
        { id: 'scout_unknown', condition: 'arrived_unknown_area', action: 'deploy_scout', priority: 60 },
        { id: 'rescue_member', condition: 'member_critical', action: 'dispatch_rescue', priority: 85 },
        { id: 'return_full', condition: 'fleet_full_cargo', action: 'return_to_port', priority: 75 },
        { id: 'explore_day', condition: 'is_day AND good_weather AND NOT on_expedition', action: 'plan_expedition', priority: 50 },
      ],
    });

    // Strategic state
    this.lastReview = 0;
    this.reviewInterval = options.reviewInterval ?? 120000; // 2 minutes
    this.eventLog = [];
    this.maxEventLog = 100;
    this.strategicDecisions = [];

    // Voyage memory
    this.voyageHistory = []; // summaries of past voyages for learning
    this.unprofitableSpots = new Set();

    // Task lock
    this.reviewInProgress = false;
  }

  /** Log a strategic event. */
  logEvent(summary, data = {}) {
    this.eventLog.push({ summary, data, timestamp: Date.now() });
    if (this.eventLog.length > this.maxEventLog) this.eventLog.shift();
  }

  /** Check if captain should review (slower heartbeat than individual bots). */
  needsReview() {
    return !this.reviewInProgress && Date.now() - this.lastReview >= this.reviewInterval;
  }

  /** Build strategic context from fleet state. */
  _buildContext() {
    const fleet = this.fleet;
    const members = [...fleet.members.values()];
    const captain = fleet.getCaptain();
    const voyage = fleet.currentVoyage;

    return {
      fleetName: fleet.name,
      fleetLevel: fleet.level,
      reputation: fleet.reputation,
      treasury: fleet.treasury,
      status: fleet.status,
      memberCount: members.length,
      onlineCount: members.filter(m => m.isOnline).length,
      membersByRole: Object.fromEntries(
        ['captain', 'scout', 'tanker', 'support', 'specialist'].map(r => [
          r, members.filter(m => m.role === r).map(m => ({
            name: m.name, status: m.status, hp: m.hp,
            catches: m.catches.length, skill: m.skill,
          })),
        ])
      ),
      voyageStatus: voyage ? {
        duration: Date.now() - voyage.startedAt,
        catches: voyage.catches.length,
        hazards: voyage.hazardsEncountered,
        target: voyage.target,
      } : null,
      recentEvents: this.eventLog.slice(-15).map(e => e.summary),
      unprofitableSpots: [...this.unprofitableSpots],
    };
  }

  /** Evaluate fleet-level script against current state. */
  evaluateFleetScript(context = null) {
    const ctx = context ?? this._buildContext();
    return this.script.evaluate({
      storm_approaching: ctx.recentEvents?.some(e => e.includes('storm') || e.includes('thunder')),
      fleet_spread: ctx.onlineCount > 0 && ctx.membersByRole?.scout?.some(s => s.status === 'fishing'),
      market_price: 1.0, // would be filled by market system
      member_damaged: ctx.membersByRole?.scout?.some(s => s.hp < s.maxHp * 0.5) ??
                     ctx.membersByRole?.tanker?.some(s => s.hp < s.maxHp * 0.5),
      member_critical: ctx.membersByRole?.scout?.some(s => s.hp < 20) ??
                       ctx.membersByRole?.tanker?.some(s => s.hp < 20),
      arrived_unknown_area: false,
      fleet_full_cargo: fleet?.currentVoyage?.catches?.length > (fleet.size * 8) ? true : false,
      is_day: true,
      good_weather: !ctx.recentEvents?.some(e => e.includes('storm')),
      on_expedition: ctx.status === 'expedition',
    });
  }

  /** Main review — captain thinks strategically via LLM. */
  async review(extraContext = {}) {
    if (this.reviewInProgress || !this.needsReview()) return null;
    this.reviewInProgress = true;

    try {
      const context = this._buildContext();
      const compressed = compressContext(this.eventLog, 20);

      let decision = null;

      if (this.apiKey) {
        decision = await this._llmReview(context, compressed, extraContext);
      } else {
        decision = this._ruleBasedReview(context);
      }

      if (decision) {
        this.strategicDecisions.push({ ...decision, timestamp: Date.now() });
        this.logEvent(`Captain decided: ${decision.action} — ${decision.reasoning ?? ''}`);
        this.lastReview = Date.now();
      } else {
        this.lastReview = Date.now();
      }

      this.reviewInProgress = false;
      return decision;
    } catch (err) {
      console.warn(`[FleetCaptain] Review error: ${err.message}`);
      this.reviewInProgress = false;
      return null;
    }
  }

  /** LLM-based strategic review. */
  async _llmReview(context, compressed, extra) {
    const systemPrompt = `You are a fleet captain managing AI fishing bots in a Minecraft world. You make HIGH-LEVEL strategic decisions, not individual fishing choices.

Your fleet has roles: captain (you), scout (exploration), tanker (big fish/protection), support (healing/bait), specialist (species expert).

Decide ONE action from: plan_expedition, redirect_fleet, recall_fleet, return_to_port, deploy_scout, support_heal_member, dispatch_rescue, recruit_crew, upgrade_boat, wait, change_target_species.

Consider: weather, market prices, fleet health, member roles, past voyage profitability, hazard risk.

Output JSON only:
{
  "action": "action_name",
  "target": "optional_target_name_or_location",
  "reasoning": "why this decision",
  "priority": 1-10,
  "data": {}
}`;

    const userPrompt = `## Fleet: ${context.fleetName} (Level ${context.fleetLevel})
Status: ${context.status} | Treasury: ${context.treasury}g | Rep: ${context.reputation}
Members: ${context.memberCount} (${context.onlineCount} online)

${Object.entries(context.membersByRole).filter(([, m]) => m.length > 0).map(([role, members]) =>
      `${role}: ${members.map(m => `${m.name} (${m.status}, ${m.hp}HP, ${m.catches} catches)`).join(', ')}`
    ).join('\n')}

${context.voyageStatus ? `## Current Voyage\nTarget: ${JSON.stringify(context.voyageStatus.target)}\nDuration: ${Math.round(context.voyageStatus.duration / 60000)} min\nCatches: ${context.voyageStatus.catches}\nHazards: ${context.voyageStatus.hazards}` : '## No active voyage'}

## Recent Events
${compressed}

${Object.keys(extra).length > 0 ? `## Extra Context\n${JSON.stringify(extra, null, 2)}` : ''}`;

    try {
      const response = await fetch(CAPTAIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 400,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) return this._ruleBasedReview(context);
      const data = await response.json();
      return JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    } catch {
      return this._ruleBasedReview(context);
    }
  }

  /** Rule-based fallback when no LLM available. */
  _ruleBasedReview(context) {
    const events = context.recentEvents ?? [];
    const voyage = context.voyageStatus;

    // Emergency: member critical
    if (events.some(e => e.includes('critical') || e.includes('HELP'))) {
      return { action: 'dispatch_rescue', reasoning: 'Fleet member in critical danger', priority: 9 };
    }

    // Storm
    if (events.some(e => e.toLowerCase().includes('storm'))) {
      return { action: 'recall_fleet', reasoning: 'Storm approaching — recall fleet to port', priority: 10 };
    }

    // Voyage full
    if (voyage && voyage.catches > context.memberCount * 10) {
      return { action: 'return_to_port', reasoning: 'Fleet cargo near capacity', priority: 7 };
    }

    // No voyage — plan one
    if (!voyage) {
      return { action: 'plan_expedition', reasoning: 'Fleet idle — plan fishing expedition', priority: 5 };
    }

    // Low members
    if (context.onlineCount < 2 && context.memberCount >= 4) {
      return { action: 'wait', reasoning: 'Waiting for more crew to come online', priority: 3 };
    }

    return null;
  }

  /** Record voyage outcome for learning. */
  recordVoyageOutcome(voyage) {
    const summary = {
      target: voyage.target,
      success: voyage.success,
      catches: voyage.catches?.length ?? 0,
      goldEarned: voyage.goldEarned ?? 0,
      duration: voyage.duration ?? 0,
      profitRate: voyage.duration > 0 ? (voyage.goldEarned ?? 0) / (voyage.duration / 60000) : 0,
    };

    this.voyageHistory.push(summary);
    if (this.voyageHistory.length > 50) this.voyageHistory.shift();

    // Learn from unprofitable voyages
    if (summary.profitRate < 5 && summary.target?.name) {
      this.unprofitableSpots.add(summary.target.name);
    }
  }

  /** Get captain's strategic status. */
  getStatus() {
    return {
      lastReview: this.lastReview ? new Date(this.lastReview).toISOString() : 'never',
      decisionsCount: this.strategicDecisions.length,
      lastDecision: this.strategicDecisions[this.strategicDecisions.length - 1] ?? null,
      voyageHistorySize: this.voyageHistory.length,
      unprofitableSpots: [...this.unprofitableSpots],
      scriptRules: this.script.rules.length,
    };
  }
}

export default FleetCaptain;
