// CraftMind Fishing — Fish AI (Layered Cognition Rewrite)
// Layer 1: Reflex (Boids + Behavior Scripts) — every tick, NO LLM
// Layer 2: Model (Tiny LLM on Heartbeat) — every 30-60 seconds
// Layer 3: Novelty (Surprise Triggers Attention) — interrupt-driven

import { FishSpeciesRegistry, RARITY } from './fish-species.js';
import { BehaviorScript, DefaultScripts } from './behavior-script.js';
import { BoidsEngine, FishEntity } from './boids-engine.js';
import { NoveltyDetector } from './novelty-detector.js';
import { AttentionSystem } from './attention-system.js';
import { generateScriptModification, compressContext, scoreModification } from './script-writer.js';

/**
 * A school of fish with shared cognition.
 * Each school has its own behavior script that the model can modify.
 */
export class FishSchool {
  constructor(schoolId, speciesId, options = {}) {
    this.schoolId = schoolId;
    this.speciesId = speciesId;
    this.species = FishSpeciesRegistry.get(speciesId);
    this.size = options.size ?? 20;
    this.waterBodyId = options.waterBodyId ?? 'default';
    this.createdAt = Date.now();

    // Behavior script (the school's "instincts")
    const archetypes = {
      timid: 'timid', aggressive: 'aggressive', curious: 'curious',
    };
    const archetype = this.species?.intelligence > 7 ? 'curious'
      : this.species?.fightStrength > 6 ? 'aggressive' : 'timid';
    this.script = DefaultScripts[archetype]?.() ?? DefaultScripts.timid();

    // Model layer state
    this.lastModelCall = 0;
    this.modelInterval = options.modelInterval ?? 45000; // 45s
    this.eventLog = [];           // recent events for context
    this.maxEventLog = 30;
    this.scriptPerformance = { catches: 0, escapes: 0, startTime: Date.now() };

    // State for context building
    this.avgDepth = 10;
    this.spreadRadius = 5;
    this.hunger = 5;
    this.stressLevel = 0;        // 0-1, increases with fishing pressure
  }

  /** Log an event for model context */
  logEvent(summary, data = {}) {
    this.eventLog.push({ summary, data, timestamp: Date.now() });
    if (this.eventLog.length > this.maxEventLog) this.eventLog.shift();
  }

  /** Update stress level based on fishing pressure */
  updateStress(catches, timeWindow = 60000) {
    const recentCatches = this.eventLog.filter(
      e => e.data?.type === 'caught' && Date.now() - e.timestamp < timeWindow
    ).length;
    this.stressLevel = Math.min(1, recentCatches / 10);
  }

  /** Get context for model consumption */
  getModelContext() {
    const performance = this.scriptPerformance;
    const total = performance.catches + performance.escapes;
    return {
      schoolId: this.schoolId,
      species: this.species?.name ?? this.speciesId,
      size: this.size,
      avgDepth: Math.round(this.avgDepth * 10) / 10,
      stressLevel: Math.round(this.stressLevel * 100) + '%',
      catchRate: total > 0 ? Math.round((performance.catches / total) * 100) + '%' : 'unknown',
      ruleCount: this.script.rules.length,
      events: this.eventLog.slice(-10).map(e => e.summary),
    };
  }

  /** Get compressed context for LLM prompt */
  getCompressedContext() {
    return compressContext(this.eventLog, 15);
  }

  /** Check if model should be called (heartbeat) */
  needsModelUpdate() {
    return Date.now() - this.lastModelCall >= this.modelInterval;
  }

  /** Record that model was called */
  markModelCalled() {
    this.lastModelCall = Date.now();
  }

  /** Track catch/escape for performance scoring */
  trackOutcome(caught) {
    if (caught) {
      this.scriptPerformance.catches++;
      this.script.trackOutcome(-1); // bad for fish
    } else {
      this.scriptPerformance.escapes++;
      this.script.trackOutcome(1); // good for fish
    }
  }
}

/**
 * Layered Fish AI — combines reflex, model, and novelty layers.
 */
export class FishAI {
  /**
   * @param {FishSchool} school
   * @param {Object} options
   */
  constructor(school, options = {}) {
    this.school = school;

    // Sub-systems
    this.boids = options.boids ?? new BoidsEngine({
      bounds: options.bounds ?? { minX: -50, maxX: 50, minY: 0, maxY: 30, minZ: -50, maxZ: 50 },
    });
    this.noveltyDetector = options.noveltyDetector ?? new NoveltyDetector();
    this.attentionSystem = options.attentionSystem ?? new AttentionSystem();

    // State
    this.lastTick = Date.now();
    this.tickAccumulator = 0;
    this.modelTaskRunning = false;

    // Wire novelty events to attention system
    this.noveltyDetector.onNovelty((event) => {
      if (event.priority === 'critical' || event.priority === 'important') {
        this.attentionSystem.addNovelty(this.school.schoolId, {
          event, context: this.school.getModelContext(),
        }, event.priority === 'critical' ? 1.0 : 0.7);
      }
    });
  }

  /**
   * Layer 1: REFLEX — Run every tick. Zero LLM.
   * Evaluates behavior scripts for each fish and applies boid forces.
   */
  reflexTick(dt = 50) {
    const schoolId = this.school.schoolId;

    // Build context from boids state for script evaluation
    const schoolCenter = this.boids.getSchoolCenter(schoolId);

    for (const [id, entity] of this.boids.entities) {
      if (entity.schoolId !== schoolId || !entity.alive) continue;

      // Build per-fish context for behavior script
      const nearby = this._getNearbyTypes(entity);
      const ctx = {
        predatorNear: nearby.predators > 0,
        hookSensed: nearby.hooks > 0,
        baitNear: nearby.bait > 0,
        playerNear: nearby.players > 0,
        hungry: this.school.hunger > 5,
        spooked: entity.fleeing,
        nearSurface: entity.y < 3,
        nearBottom: entity.y > this.boids.bounds.maxY * 0.8,
        isDawn: this._getTimeOfDay() === 'dawn',
        isDusk: this._getTimeOfDay() === 'dusk',
        isNight: this._getTimeOfDay() === 'night',
        isDay: this._getTimeOfDay() === 'day',
        schoolScattered: schoolCenter && this._schoolSpread(schoolId, schoolCenter) > 15,
        schoolNearby: true, // school fish are always near their school
        depth: entity.y,
        maxDepth: this.boids.bounds.maxY,
      };

      // Evaluate behavior script
      const action = this.school.script.evaluate(ctx);

      if (action && !entity.actionOverride) {
        entity.actionOverride = action;
        entity.actionTimer = 1000 + Math.random() * 2000;
      }
    }

    // Run boids simulation
    this.boids.tick(dt);

    // Update school state
    if (schoolCenter) {
      this.school.avgDepth = schoolCenter.y;
      this.school.spreadRadius = this._schoolSpread(schoolId, schoolCenter);
    }
  }

  /**
   * Layer 2: MODEL — Heartbeat-driven script modification.
   * Called when attention system grants attention to this school.
   * Returns true if a modification was applied.
   */
  async modelUpdate(extraContext = '') {
    if (this.modelTaskRunning) return false;

    const context = this.school.getModelContext();
    const compressedCtx = this.school.getCompressedContext();
    const metrics = this.noveltyDetector.getMetricsSummary();

    this.modelTaskRunning = true;

    try {
      const diff = await generateScriptModification({
        entityType: 'fish_school',
        speciesId: this.school.speciesId,
        currentRules: this.school.script.toModelFormat(),
        contextSummary: compressedCtx,
        metrics,
        noveltyDescription: extraContext,
      });

      if (!diff) {
        this.modelTaskRunning = false;
        return false;
      }

      // Apply with checkpoint for potential rollback
      this.school.script.checkpoint();
      const result = this.school.script.applyDiff(diff);
      this.school.script.commit();

      // Log the modification
      if (result.added.length > 0 || result.modified.length > 0) {
        const changes = result.added.map(r => `+ ${r.condition} → ${r.action}`).join('; ');
        this.school.logEvent(`Script modified: ${diff.reasoning ?? changes}`, {
          type: 'script_change',
          diff: result,
        });
      }
      if (result.removed.length > 0) {
        this.school.logEvent(`Rules removed: ${result.removed.join(', ')}`, {
          type: 'script_change',
        });
      }

      this.school.markModelCalled();
      this.modelTaskRunning = false;
      return true;
    } catch (err) {
      console.warn(`[FishAI] Model update error for ${this.school.schoolId}: ${err.message}`);
      // Rollback on error
      this.school.script.rollback();
      this.modelTaskRunning = false;
      return false;
    }
  }

  /**
   * Layer 3: NOVELTY — Process pending attention items.
   * Called periodically to check if model attention is needed.
   */
  processAttention() {
    // Add heartbeat if due
    if (this.school.needsModelUpdate()) {
      this.attentionSystem.addHeartbeat(this.school.schoolId, {
        context: this.school.getModelContext(),
      });
    }

    // Get next batch of attention items
    const batch = this.attentionSystem.getNextBatch();

    // Process critical items immediately, defer others
    const immediateItems = batch.filter(i => i.type === 'novelty' && i.urgency > 0.7);
    const deferredItems = batch.filter(i => i !== immediateItems.find(ii => ii.id === i.id));

    return { immediateItems, deferredItems, batch };
  }

  /**
   * Full tick — runs all three layers.
   */
  async tick(dt = 50) {
    // Layer 1: Reflex (every tick)
    this.reflexTick(dt);

    // Layer 3: Novelty (check for attention needs)
    const { immediateItems } = this.processAttention();

    // Layer 2: Model (if attention was granted)
    for (const item of immediateItems) {
      const noveltyDesc = item.context?.event?.description ?? '';
      await this.modelUpdate(noveltyDesc);
    }
  }

  // --- Utility ---

  _getNearbyTypes(entity) {
    const result = { predators: 0, hooks: 0, bait: 0, players: 0 };
    const neighbors = this.boids._getNeighbors(entity, 15);
    for (const other of neighbors) {
      if (other._type === 'predator') result.predators++;
      if (other._type === 'hook') result.hooks++;
      if (other._type === 'bait') result.bait++;
      if (other._type === 'player') result.players++;
    }
    return result;
  }

  _schoolSpread(schoolId, center) {
    const ids = this.boids.schools.get(schoolId);
    if (!ids || ids.size === 0) return 0;
    let maxDist = 0;
    for (const id of ids) {
      const e = this.boids.entities.get(id);
      if (!e?.alive) continue;
      const dx = e.x - center.x;
      const dz = e.z - center.z;
      maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dz * dz));
    }
    return maxDist;
  }

  _getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  }

  /**
   * Legacy API compatibility — create a single-fish AI instance.
   */
  static createLegacy(species, ctx = {}) {
    const schoolId = `legacy_${Date.now()}`;
    const school = new FishSchool(schoolId, species.id ?? species, { size: 1 });
    return { school, ai: new FishAI(school) };
  }

  /** Legacy: evaluate bait for a single fish */
  evaluateBait(baitId, baitData) {
    const effectiveness = baitData.effectiveness?.[this.school.speciesId]
      ?? baitData.effectiveness?.default ?? 0.2;
    return effectiveness * 60 + this.school.hunger * 3;
  }

  /** Legacy: get bite probability */
  getBiteProbability() {
    if (this.school.stressLevel > 0.8) return 0.01;
    return Math.max(0.01, 0.5 - this.school.stressLevel * 0.4);
  }

  /** Legacy: tick for compatibility */
  tickLegacy(dt = 1000) {
    // Simplified tick for old API
  }

  /** React to a marine hazard. */
  reactToHazard(hazard) {
    const type = hazard.type;

    // Scatter schools near hazards
    if (type === 'shark_pack' || type === 'elder_guardian' || type === 'coral_storm') {
      this.spook(type, hazard.duration * 0.8);
      this.school.logEvent(`School scattered by ${hazard.name}`);
      return 'scattered';
    }

    // Squid ink reduces predictability
    if (type === 'squid_ink') {
      this.school.script.addRule({
        id: 'ink_confusion', condition: 'bait_near',
        action: ['investigate', 'ignore_bait', 'flee'][Math.floor(Math.random() * 3)],
        priority: 85, expiresAfterMs: hazard.duration,
        explanation: 'Confused by ink cloud',
      });
      return 'confused';
    }

    // Whale breach stuns fish near impact
    if (type === 'whale_breach') {
      this.spook('whale_breach', 5000);
      this.school.logEvent('School stunned by whale breach');
      return 'stunned';
    }

    // Bioluminescent attracts rare species behavior
    if (type === 'bioluminescent') {
      this.school.script.addRule({
        id: 'bio_surfacing', condition: 'is_night',
        action: 'surface', priority: 75, expiresAfterMs: hazard.duration,
        explanation: 'Attracted to bioluminescent light',
      });
      return 'attracted';
    }

    // Riptide displaces fish
    if (type === 'riptide') {
      this.spook('riptide', 3000);
      return 'displaced';
    }

    // Phantom diver scares but doesn't scatter
    if (type === 'phantom_diver') {
      this.school.script.addRule({
        id: 'phantom_fear', condition: 'player_near',
        action: 'dive_deep', priority: 80, expiresAfterMs: hazard.duration,
        explanation: 'Avoiding phantom presence',
      });
      return 'spooked';
    }

    // Leviathan — extreme reaction
    if (type === 'leviathan') {
      this.spook('leviathan', hazard.duration);
      this.school.logEvent(`Leviathan detected! School fleeing deep!`);
      return 'fleeing';
    }

    return 'unaffected';
  }

  /** Spook all fish in the school — they flee from a common threat point */
  spook(reason = 'noise', duration = 8000) {
    const center = this.boids.getSchoolCenter(this.school.schoolId);
    if (!center) return;

    // All fish flee from the school center (where the threat is)
    for (const [id, entity] of this.boids.entities) {
      if (entity.schoolId !== this.school.schoolId) continue;
      this.boids.triggerFear(id, center.x, center.z, 1.0);
      // Override the hardcoded flee timer with the passed duration
      entity.fleeTimer = duration + Math.random() * duration * 0.25;
    }
    this.school.logEvent(`School spooked: ${reason}`);
  }
}

export default FishAI;
