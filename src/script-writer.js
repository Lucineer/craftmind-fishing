// CraftMind Fishing — Script Writer
// Model-driven behavior script generation using glm-4.7-flash.
// Generates script diffs (add/remove/modify) from compressed context.

const API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const MODEL = 'glm-4.7-flash';

/**
 * Generate script modifications via LLM.
 * @param {Object} params
 * @param {string} params.entityType - "fish_school" | "fisherman"
 * @param {string} params.speciesId - Species or fisherman name
 * @param {Array} params.currentRules - Current behavior script rules
 * @param {string} params.contextSummary - What happened recently (compressed)
 * @param {Object} params.metrics - Key metrics (catch rates, population, etc.)
 * @param {string} params.noveltyDescription - If triggered by novelty, what was surprising
 * @returns {Promise<Object|null>} Script diff or null on failure
 */
export async function generateScriptModification(params) {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    console.warn('[ScriptWriter] No ZAI_API_KEY set — running in reflex-only mode');
    return null;
  }

  const systemPrompt = `You are the behavioral instincts of a ${params.entityType === 'fish_school' ? 'fish school' : 'fisherman'} in a Minecraft fishing simulation.

You receive a summary of recent events and must output a JSON script modification.

RULES:
1. You can ADD new behavior rules, REMOVE existing ones, or MODIFY existing ones.
2. Each rule has: id (unique short name), condition, action, priority (0-100), explanation.
3. Conditions use: predator_near, hook_sensed, bait_near, player_near, hungry, spooked, near_surface, near_bottom, is_dawn, is_dusk, is_night, is_day, school_scattered, low_on_bait, spot_depleted, water_dirty, etc. Combine with AND/OR/NOT. Also support comparisons like "depth < 5".
4. Fish actions: dive_deep, surface, flee, school_up, scatter, hide_coral, hide_kelp, drift_current, approach_bait, ignore_bait, investigate.
5. Fisherman actions: change_bait_deep, change_bait_surface, change_bait_night, move_spot, wait_longer, cast_again, rest, share_knowledge, hoard_spot.
6. Be MINIMAL — change 1-3 rules maximum. Don't rewrite everything.
7. Be SURVIVAL-ORIENTED — fish should avoid being caught, fishermen should maximize catch rate.
8. Explain each change briefly.

Output ONLY valid JSON, no markdown:
{
  "diff": {
    "add": [...],
    "remove": ["rule_id_to_remove"],
    "modify": [{"id": "rule_id", "changes": {...}}]
  },
  "reasoning": "Brief explanation of why these changes were made",
  "expectedOutcome": "What should change after applying these rules"
}`;

  const userPrompt = `## Current Behavior Rules
${JSON.stringify(params.currentRules, null, 2)}

## Recent Events
${params.contextSummary}

## Current Metrics
${JSON.stringify(params.metrics, null, 2)}

${params.noveltyDescription ? `## Novelty Event\n${params.noveltyDescription}` : ''}

## Task
Generate a script modification for this ${params.entityType}. Remember: minimal changes, survival-focused.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown');
      console.warn(`[ScriptWriter] API error ${response.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.diff) return null;

    // Validate the diff structure
    const validated = { add: [], remove: [], modify: [], reasoning: parsed.reasoning, expectedOutcome: parsed.expectedOutcome };

    if (Array.isArray(parsed.diff.add)) {
      validated.add = parsed.diff.add.filter(r => r.condition && r.action);
    }
    if (Array.isArray(parsed.diff.remove)) {
      validated.remove = parsed.diff.remove.filter(id => typeof id === 'string');
    }
    if (Array.isArray(parsed.diff.modify)) {
      validated.modify = parsed.diff.modify.filter(m => m.id && m.changes);
    }

    // Only return if there are actual changes
    if (validated.add.length === 0 && validated.remove.length === 0 && validated.modify.length === 0) {
      return null;
    }

    return validated;
  } catch (err) {
    console.warn(`[ScriptWriter] Error: ${err.message}`);
    return null;
  }
}

/**
 * Generate a compressed context summary for model consumption.
 * Takes recent events and produces a short narrative.
 */
export function compressContext(eventLog, maxEvents = 10) {
  if (!eventLog || eventLog.length === 0) return 'No recent events.';

  const recent = eventLog.slice(-maxEvents);
  const summaries = recent.map(e => {
    if (typeof e === 'string') return e;
    return e.summary ?? e.description ?? JSON.stringify(e).slice(0, 100);
  });

  return summaries.join('\n');
}

/**
 * Score a script modification's effectiveness after testing.
 * Called after a diff is applied and enough time has passed.
 * @param {Object} metrics - { before: {...}, after: {...} }
 * @returns {number} Score from -1 (worse) to +1 (better)
 */
export function scoreModification(metrics) {
  if (!metrics.before || !metrics.after) return 0;

  let score = 0;
  let factors = 0;

  // For fish: lower catch rate = better (survival)
  if (metrics.before.catchRate !== undefined && metrics.after.catchRate !== undefined) {
    const delta = metrics.before.catchRate - metrics.after.catchRate;
    score += Math.max(-1, Math.min(1, delta / 0.2)); // normalize
    factors++;
  }

  // For fishermen: higher catch rate = better
  if (metrics.before.successRate !== undefined && metrics.after.successRate !== undefined) {
    const delta = metrics.after.successRate - metrics.before.successRate;
    score += Math.max(-1, Math.min(1, delta / 0.2));
    factors++;
  }

  // Population health
  if (metrics.before.population !== undefined && metrics.after.population !== undefined) {
    const delta = metrics.after.population - metrics.before.population;
    score += Math.max(-1, Math.min(1, delta / 10));
    factors++;
  }

  return factors > 0 ? score / factors : 0;
}

export default { generateScriptModification, compressContext, scoreModification };
