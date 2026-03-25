// CraftMind Fishing — Behavior Script Engine
// Tiny condition→action scripting language for fish and fishermen instincts.
// Scripts are JSON-serializable, model-writable, and versioned with rollback.

/**
 * A single behavior rule.
 * @typedef {Object} BehaviorRule
 * @property {string} id - Unique rule ID (e.g. "avoid_surface_dawn")
 * @property {string} condition - Condition expression (see evaluateCondition)
 * @property {string} action - Action to execute
 * @property {number} priority - Higher = checked first (0-100)
 * @property {number|null} expiresAfterMs - Auto-remove after N ms, null = permanent
 * @property {number} createdAt - Timestamp when rule was created
 * @property {string} source - "default" | "model" | "novelty" | "manual"
 * @property {string} explanation - Human-readable description
 */

/** Valid condition tokens and their evaluation */
const VALID_CONDITIONS = [
  // Entity state
  'predator_near', 'hook_sensed', 'bait_near', 'player_near',
  'hungry', 'injured', 'spooked', 'tired',
  // Environment
  'near_surface', 'near_bottom', 'near_coral', 'near_kelp',
  'in_current', 'water_warm', 'water_cold', 'water_dirty',
  // Time
  'is_dawn', 'is_dusk', 'is_night', 'is_day',
  // Social
  'school_nearby', 'school_scattered', 'lonely', 'crowded',
  // Fisherman-specific
  'low_on_bait', 'rod_damaged', 'good_weather', 'bad_weather',
  'spot_depleted', 'rare_fish_seen',
];

/** Valid actions */
const VALID_ACTIONS = [
  // Fish actions
  'dive_deep', 'surface', 'flee', 'school_up', 'scatter',
  'hide_coral', 'hide_kelp', 'drift_current', 'circle_predator',
  'approach_bait', 'ignore_bait', 'investigate',
  // Fisherman actions
  'change_bait_deep', 'change_bait_surface', 'change_bait_night',
  'move_spot', 'wait_longer', 'cast_again', 'rest',
  'share_knowledge', 'hoard_spot',
];

/** Logical operators */
const VALID_OPS = ['AND', 'OR', 'NOT'];

export class BehaviorScript {
  constructor(options = {}) {
    this.rules = options.rules ?? [];
    this.version = options.version ?? 1;
    this.versionHistory = [];
    this.performanceScore = options.performanceScore ?? 0; // running score
    this.performanceSamples = options.performanceSamples ?? 0;
    this.lastEvaluated = 0;
  }

  /**
   * Add a rule. Returns the rule.
   */
  addRule(rule) {
    const full = {
      id: rule.id ?? `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority ?? 50,
      expiresAfterMs: rule.expiresAfterMs ?? null,
      createdAt: Date.now(),
      source: rule.source ?? 'default',
      explanation: rule.explanation ?? '',
    };
    this._validate(full);
    this.rules.push(full);
    this._sortRules();
    return full;
  }

  /**
   * Remove a rule by ID.
   */
  removeRule(ruleId) {
    const idx = this.rules.findIndex(r => r.id === ruleId);
    if (idx === -1) return false;
    const removed = this.rules.splice(idx, 1)[0];
    return removed;
  }

  /**
   * Apply a diff (add/remove/modify) — used by the model layer.
   * Returns { added, removed, modified }.
   */
  applyDiff(diff) {
    const result = { added: [], removed: [], modified: [] };

    if (diff.add) {
      for (const rule of diff.add) {
        result.added.push(this.addRule({ ...rule, source: 'model' }));
      }
    }

    if (diff.remove) {
      for (const ruleId of diff.remove) {
        const removed = this.removeRule(ruleId);
        if (removed) result.removed.push(removed);
      }
    }

    if (diff.modify) {
      for (const mod of diff.modify) {
        const idx = this.rules.findIndex(r => r.id === mod.id);
        if (idx !== -1) {
          const old = { ...this.rules[idx] };
          Object.assign(this.rules[idx], mod.changes, { source: 'model' });
          result.modified.push({ before: old, after: this.rules[idx] });
        }
      }
    }

    this._sortRules();
    return result;
  }

  /**
   * Evaluate all rules against a context and return the highest-priority matching action.
   * @param {Object} ctx - { predatorNear, hookSensed, depth, maxDepth, ..., schoolSize, ... }
   * @returns {string|null} Action to take, or null
   */
  evaluate(ctx) {
    this.lastEvaluated = Date.now();
    const now = Date.now();

    // Remove expired rules
    this.rules = this.rules.filter(r =>
      r.expiresAfterMs === null || (now - r.createdAt) < r.expiresAfterMs
    );

    for (const rule of this.rules) {
      if (this._evalCondition(rule.condition, ctx)) {
        return rule.action;
      }
    }
    return null;
  }

  /**
   * Get a snapshot of current rules (for serialization/model input).
   */
  toSnapshot() {
    return {
      rules: this.rules.map(r => ({
        id: r.id, condition: r.condition, action: r.action,
        priority: r.priority, source: r.source, explanation: r.explanation,
      })),
      version: this.version,
      performanceScore: this.performanceScore,
    };
  }

  /**
   * Create a version checkpoint (before model modifications).
   */
  checkpoint() {
    this.versionHistory.push({
      version: this.version,
      rules: this.rules.map(r => ({ ...r })),
      performanceScore: this.performanceScore,
      performanceSamples: this.performanceSamples,
    });
    // Keep last 5 versions
    if (this.versionHistory.length > 5) this.versionHistory.shift();
  }

  /**
   * Commit current state as new version.
   */
  commit() {
    this.version++;
    return this.version;
  }

  /**
   * Rollback to previous version if performance degraded.
   * Returns true if rolled back.
   */
  rollback() {
    if (this.versionHistory.length === 0) return false;
    const prev = this.versionHistory.pop();
    this.rules = prev.rules;
    this.version = prev.version;
    this.performanceScore = prev.performanceScore;
    this.performanceSamples = prev.performanceSamples;
    return true;
  }

  /**
   * Track performance outcome. Positive = good, negative = bad.
   */
  trackOutcome(value) {
    this.performanceSamples++;
    // Exponential moving average
    const alpha = 2 / (this.performanceSamples + 1);
    this.performanceScore = this.performanceScore * (1 - alpha) + value * alpha;
  }

  /**
   * Get human-readable summary of all rules.
   */
  describe() {
    if (this.rules.length === 0) return 'No behavior rules defined.';
    return this.rules
      .sort((a, b) => b.priority - a.priority)
      .map(r => `[${r.source}] IF ${r.condition} THEN ${r.action}${r.explanation ? ' — ' + r.explanation : ''}`)
      .join('\n');
  }

  /**
   * Export for model consumption (compact format).
   */
  toModelFormat() {
    return this.rules.map(r => ({
      condition: r.condition,
      action: r.action,
      priority: r.priority,
      source: r.source,
      explanation: r.explanation,
    }));
  }

  // --- Internal ---

  _validate(rule) {
    if (!rule.condition || typeof rule.condition !== 'string')
      throw new Error(`Invalid condition: ${rule.condition}`);
    if (!rule.action || typeof rule.action !== 'string')
      throw new Error(`Invalid action: ${rule.action}`);
    // Don't throw on unknown conditions/actions — the model might invent useful ones
    // Just warn in non-production
  }

  _sortRules() {
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate a condition string against context.
   * Supports: "predator_near", "predator_near AND hungry", "NOT spooked",
   * "predator_near OR hook_sensed", "depth < 3"
   */
  _evalCondition(cond, ctx) {
    // Handle NOT
    if (cond.startsWith('NOT ')) {
      return !this._evalCondition(cond.slice(4).trim(), ctx);
    }

    // Handle AND/OR
    for (const op of ['AND', 'OR']) {
      const idx = cond.indexOf(` ${op} `);
      if (idx !== -1) {
        const left = cond.slice(0, idx).trim();
        const right = cond.slice(idx + op.length + 2).trim();
        if (op === 'AND') return this._evalCondition(left, ctx) && this._evalCondition(right, ctx);
        return this._evalCondition(left, ctx) || this._evalCondition(right, ctx);
      }
    }

    // Handle comparisons: "depth < 3", "school_size > 10"
    const compMatch = cond.match(/^(\w+)\s*(<|>|<=|>=|==|!=)\s*(\d+(?:\.\d+)?)$/);
    if (compMatch) {
      const [, key, op, val] = compMatch;
      const ctxVal = this._resolveContextValue(key, ctx);
      if (ctxVal === undefined) return false;
      const numVal = parseFloat(val);
      switch (op) {
        case '<':  return ctxVal < numVal;
        case '>':  return ctxVal > numVal;
        case '<=': return ctxVal <= numVal;
        case '>=': return ctxVal >= numVal;
        case '==': return ctxVal === numVal;
        case '!=': return ctxVal !== numVal;
        default:   return false;
      }
    }

    // Simple boolean condition
    return this._resolveContextValue(cond, ctx) === true;
  }

  _resolveContextValue(token, ctx) {
    // Convert snake_case condition to camelCase context
    const camelKey = token.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (camelKey in ctx) return ctx[camelKey];
    if (token in ctx) return ctx[token];
    // Falsy for unrecognized
    return false;
  }
}

/**
 * Create default behavior scripts for different species archetypes.
 */
export const DefaultScripts = {
  /** Timid surface fish — flee everything, school tightly */
  timid: () => new BehaviorScript({
    rules: [
      { id: 'flee_predator', condition: 'predator_near', action: 'flee', priority: 95, explanation: 'Instinctive predator avoidance' },
      { id: 'flee_hook', condition: 'hook_sensed', action: 'scatter', priority: 90, explanation: 'Spooked by hooks' },
      { id: 'school_up', condition: 'school_scattered', action: 'school_up', priority: 70, explanation: 'Regroup with school' },
      { id: 'avoid_surface_dawn', condition: 'is_dawn AND near_surface', action: 'dive_deep', priority: 60, explanation: 'Dawn fishing pressure avoidance' },
      { id: 'hide_kelp', condition: 'near_kelp AND spooked', action: 'hide_kelp', priority: 80, explanation: 'Seek cover when scared' },
      { id: 'curious_bait', condition: 'bait_near AND hungry AND NOT spooked', action: 'approach_bait', priority: 40, explanation: 'Feed when hungry and safe' },
    ],
  }),

  /** Aggressive deep fish — bold, territorial */
  aggressive: () => new BehaviorScript({
    rules: [
      { id: 'attack_hook', condition: 'bait_near AND hungry', action: 'approach_bait', priority: 80, explanation: 'Aggressive feeding' },
      { id: 'chase_prey', condition: 'hook_sensed AND hungry', action: 'approach_bait', priority: 75, explanation: 'Mistakes hook for prey' },
      { id: 'avoid_prey', condition: 'predator_near AND near_bottom', action: 'dive_deep', priority: 60, explanation: 'Retreat to depth' },
      { id: 'hunt_surface', condition: 'is_dusk AND hungry', action: 'surface', priority: 50, explanation: 'Night hunting' },
      { id: 'rest_deep', condition: 'is_day AND NOT hungry', action: 'dive_deep', priority: 45, explanation: 'Daytime resting' },
    ],
  }),

  /** Curious midwater fish — exploratory, smart */
  curious: () => new BehaviorScript({
    rules: [
      { id: 'investigate_bait', condition: 'bait_near', action: 'investigate', priority: 65, explanation: 'Investigate novel objects' },
      { id: 'flee_predator', condition: 'predator_near', action: 'dive_deep', priority: 90, explanation: 'Predator avoidance' },
      { id: 'avoid_hooks', condition: 'hook_sensed AND near_surface', action: 'dive_deep', priority: 70, explanation: 'Learned hook avoidance' },
      { id: 'school_follow', condition: 'school_nearby AND NOT hungry', action: 'school_up', priority: 55, explanation: 'Follow school movement' },
      { id: 'feed_night', condition: 'is_night AND hungry', action: 'approach_bait', priority: 60, explanation: 'Night feeding pattern' },
      { id: 'current_drift', condition: 'in_current AND NOT bait_near', action: 'drift_current', priority: 30, explanation: 'Energy-efficient travel' },
    ],
  }),

  /** Fisherman default script */
  fisherman: () => new BehaviorScript({
    rules: [
      { id: 'switch_bait_depleted', condition: 'low_on_bait AND spot_depleted', action: 'move_spot', priority: 80, explanation: 'Move when spot is fished out' },
      { id: 'fish_good_weather', condition: 'good_weather AND NOT low_on_bait', action: 'cast_again', priority: 70, explanation: 'Fish when conditions are good' },
      { id: 'wait_bad_weather', condition: 'bad_weather', action: 'wait_longer', priority: 60, explanation: 'Patience during poor conditions' },
      { id: 'change_bait_time', condition: 'is_night', action: 'change_bait_night', priority: 55, explanation: 'Night fishing bait switch' },
      { id: 'rest_damaged', condition: 'rod_damaged', action: 'rest', priority: 90, explanation: 'Repair rod before continuing' },
    ],
  }),
};

export default BehaviorScript;
