// CraftMind Fishing — Novelty Detector
// Watches for events that deviate from expected patterns → triggers model attention.

/**
 * A tracked metric with running statistics.
 */
class TrackedMetric {
  constructor(name, options = {}) {
    this.name = name;
    this.values = [];           // recent values
    this.maxSamples = options.maxSamples ?? 50;
    this.stdDevThreshold = options.stdDevThreshold ?? 2.0;
    this.lastValue = null;
    this.expected = null;       // current expected (mean)
    this.stdDev = 0;
  }

  push(value) {
    this.lastValue = value;
    this.values.push(value);
    if (this.values.length > this.maxSamples) this.values.shift();
    this._recalcStats();
  }

  _recalcStats() {
    if (this.values.length < 3) return;
    const n = this.values.length;
    this.expected = this.values.reduce((a, b) => a + b, 0) / n;
    const variance = this.values.reduce((sum, v) => sum + (v - this.expected) ** 2, 0) / n;
    this.stdDev = Math.sqrt(variance);
  }

  /** Check if the latest value is novel (>N std devs from expected) */
  isNovel() {
    if (this.values.length < 5 || this.stdDev < 0.001) return false;
    return Math.abs(this.lastValue - this.expected) > this.stdDevThreshold * this.stdDev;
  }

  /** Get novelty magnitude (how many std devs away) */
  noveltyMagnitude() {
    if (this.stdDev < 0.001) return 0;
    return Math.abs(this.lastValue - this.expected) / this.stdDev;
  }
}

/**
 * Novelty event with priority and context.
 * @typedef {Object} NoveltyEvent
 * @property {string} id
 * @property {'critical'|'important'|'interesting'} priority
 * @property {string} category - e.g. "catch_rate", "population", "behavior", "weather"
 * @property {string} description - Human-readable
 * @property {Object} context - Data for model consumption
 * @property {number} timestamp
 * @property {boolean} processed - Whether model has handled this
 */

export class NoveltyDetector {
  constructor(options = {}) {
    this.metrics = new Map();
    this.eventHistory = [];
    this.maxHistory = options.maxHistory ?? 200;
    this.callbacks = [];  // (event) => void — called when novelty detected

    this._initMetrics();
  }

  /** Initialize all tracked metrics */
  _initMetrics() {
    // Catch rates per technique
    for (const technique of ['surface', 'deep', 'night', 'lure', 'net', 'traps']) {
      this.addMetric(`catch_rate_${technique}`);
    }
    // Population levels per rarity
    for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
      this.addMetric(`population_${rarity}`);
    }
    // Global metrics
    this.addMetric('total_catches_per_minute');
    this.addMetric('fish_behavior_change_rate');
    this.addMetric('predator_activity');
    this.addMetric('water_quality_avg');
    this.addMetric('player_activity');
    this.addMetric('bait_effectiveness_avg');
    this.addMetric('school_size_avg');
    this.addMetric('fishing_pressure');
  }

  /** Add a custom metric */
  addMetric(name, options = {}) {
    this.metrics.set(name, new TrackedMetric(name, options));
  }

  /** Push a value for a metric and check for novelty */
  observe(metricName, value) {
    const metric = this.metrics.get(metricName);
    if (!metric) {
      this.addMetric(metricName);
      this.observe(metricName, value);
      return null;
    }

    metric.push(value);

    if (metric.isNovel()) {
      const event = this._createEvent(metric, metricName, value);
      this._fireEvent(event);
      return event;
    }
    return null;
  }

  /** Observe a discrete event (counts occurrences) */
  observeEvent(category, eventData = {}) {
    // Convert discrete events into metric observations
    // E.g., "new_catch_technique" → bump novelty
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      priority: eventData.priority ?? 'interesting',
      category,
      description: eventData.description ?? `Unexpected event: ${category}`,
      context: eventData.context ?? {},
      timestamp: Date.now(),
      processed: false,
    };
    this._fireEvent(event);
    return event;
  }

  /** Force a novelty event (e.g., legendary fish spawn) */
  forceEvent(priority, category, description, context = {}) {
    const event = {
      id: `force_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      priority, category, description, context,
      timestamp: Date.now(), processed: false,
    };
    this._fireEvent(event);
    return event;
  }

  /** Get all unprocessed events */
  getUnprocessed() {
    return this.eventHistory.filter(e => !e.processed);
  }

  /** Mark events as processed */
  markProcessed(eventIds) {
    const idSet = new Set(eventIds);
    for (const e of this.eventHistory) {
      if (idSet.has(e.id)) e.processed = true;
    }
  }

  /** Get events by priority */
  getByPriority(priority) {
    return this.eventHistory.filter(e => e.priority === priority && !e.processed);
  }

  /** Get summary of all metrics */
  getMetricsSummary() {
    const summary = {};
    for (const [name, metric] of this.metrics) {
      summary[name] = {
        expected: Math.round(metric.expected * 100) / 100,
        last: Math.round(metric.lastValue * 100) / 100,
        stdDev: Math.round(metric.stdDev * 100) / 100,
        samples: metric.values.length,
      };
    }
    return summary;
  }

  /** Register a callback for novelty events */
  onNovelty(callback) {
    this.callbacks.push(callback);
  }

  /** Reset all metrics (for new game/reset) */
  reset() {
    for (const metric of this.metrics.values()) {
      metric.values = [];
      metric.lastValue = null;
      metric.expected = null;
      metric.stdDev = 0;
    }
    this.eventHistory = [];
  }

  // --- Internal ---

  _createEvent(metric, metricName, value) {
    const magnitude = metric.noveltyMagnitude();
    let priority = 'interesting';
    if (magnitude > 4) priority = 'critical';
    else if (magnitude > 2.5) priority = 'important';

    return {
      id: `novelty_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      priority,
      category: metricName,
      description: `${metricName}: ${value.toFixed(2)} (expected ${metric.expected.toFixed(2)} ± ${metric.stdDev.toFixed(2)})`,
      context: {
        metric: metricName,
        actual: value,
        expected: metric.expected,
        stdDev: metric.stdDev,
        magnitude: Math.round(magnitude * 100) / 100,
        history: metric.values.slice(-10),
      },
      timestamp: Date.now(),
      processed: false,
    };
  }

  _fireEvent(event) {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistory);
    }
    for (const cb of this.callbacks) {
      try { cb(event); } catch (err) { /* swallow callback errors */ }
    }
  }
}

export default NoveltyDetector;
