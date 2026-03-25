// CraftMind Fishing — Attention System
// Cognitive attention allocation for model calls.
// Models have limited budget — attention is allocated by novelty > heartbeat > random.

/**
 * An attention item — something a model should think about.
 * @typedef {Object} AttentionItem
 * @property {string} id
 * @property {string} type - "novelty" | "heartbeat" | "exploration" | "scheduled"
 * @property {string} target - Which entity needs attention (schoolId, fishermanId)
 * @property {number} urgency - 0-1, higher = more urgent
 * @property {number} importance - 0-1, overall importance score
 * @property {Object} context - Data for the model
 * @property {number} timestamp
 * @property {boolean} processed
 */

export class AttentionSystem {
  constructor(options = {}) {
    this.queue = [];                // pending attention items
    this.processedHistory = [];     // recently processed items
    this.maxQueueSize = options.maxQueueSize ?? 100;
    this.maxHistory = options.maxHistory ?? 500;

    // Attention budget per tick
    this.budgetPerTick = options.budgetPerTick ?? 3;
    this.budgetRemaining = this.budgetPerTick;

    // Cooldowns per target to prevent attention spam
    this.cooldowns = new Map();     // targetId → nextAllowedTimestamp
    this.defaultCooldown = options.defaultCooldown ?? 15000; // 15s minimum between attention for same target
    this.noveltyCooldown = options.noveltyCooldown ?? 5000;  // 5s for novelty events
    this.heartbeatInterval = options.heartbeatInterval ?? 45000; // 45s between heartbeats per target

    // Track last heartbeat per target
    this.lastHeartbeat = new Map();

    // Priority weights
    this.priorityWeights = {
      novelty: 1.0,
      heartbeat: 0.5,
      exploration: 0.2,
      scheduled: 0.3,
    };

    // Stats
    this.totalProcessed = 0;
    this.totalDropped = 0;
    this.totalNovelty = 0;
    this.totalHeartbeats = 0;
    this.totalExploration = 0;
  }

  /**
   * Add a novelty-triggered attention item (highest priority).
   */
  addNovelty(target, context, urgency = 0.8) {
    const item = this._createItem('novelty', target, urgency, context);
    if (item) {
      this.totalNovelty++;
      return item;
    }
    this.totalDropped++;
    return null;
  }

  /**
   * Add a heartbeat attention item (periodic review).
   */
  addHeartbeat(target, context) {
    // Check if heartbeat is due
    const last = this.lastHeartbeat.get(target) ?? 0;
    if (Date.now() - last < this.heartbeatInterval) return null;

    const item = this._createItem('heartbeat', target, 0.3, context);
    if (item) {
      this.lastHeartbeat.set(target, Date.now());
      this.totalHeartbeats++;
      return item;
    }
    return null;
  }

  /**
   * Add an exploration attention item (random curiosity).
   */
  addExploration(target, context) {
    const item = this._createItem('exploration', target, 0.15, context);
    if (item) {
      this.totalExploration++;
      return item;
    }
    return null;
  }

  /**
   * Add a scheduled attention item.
   */
  addScheduled(target, context, urgency = 0.4) {
    return this._createItem('scheduled', target, urgency, context);
  }

  /**
   * Get the next batch of attention items to process.
   * Returns items sorted by importance, respecting budget and cooldowns.
   */
  getNextBatch(maxItems) {
    const count = maxItems ?? this.budgetPerTick;
    this.budgetRemaining = count;

    // Filter out items on cooldown
    const now = Date.now();
    const ready = this.queue.filter(item => {
      const cooldown = this.cooldowns.get(item.target) ?? 0;
      return now >= cooldown && !item.processed;
    });

    // Sort by importance (weighted by type priority)
    ready.sort((a, b) => {
      const scoreA = a.urgency * this.priorityWeights[a.type];
      const scoreB = b.urgency * this.priorityWeights[b.type];
      return scoreB - scoreA;
    });

    const batch = [];
    for (const item of ready) {
      if (batch.length >= count) break;
      item.processed = true;
      batch.push(item);
      this.totalProcessed++;

      // Set cooldown
      const cooldown = item.type === 'novelty'
        ? this.noveltyCooldown
        : this.defaultCooldown;
      this.cooldowns.set(item.target, Date.now() + cooldown);
    }

    // Move processed items to history
    this.queue = this.queue.filter(item => !item.processed);
    for (const item of batch) {
      this.processedHistory.push(item);
    }
    if (this.processedHistory.length > this.maxHistory) {
      this.processedHistory = this.processedHistory.slice(-this.maxHistory);
    }

    return batch;
  }

  /**
   * Get current queue status.
   */
  getStatus() {
    return {
      queueLength: this.queue.filter(i => !i.processed).length,
      totalProcessed: this.totalProcessed,
      totalDropped: this.totalDropped,
      totalNovelty: this.totalNovelty,
      totalHeartbeats: this.totalHeartbeats,
      totalExploration: this.totalExploration,
      budgetPerTick: this.budgetPerTick,
    };
  }

  /**
   * Check if a target is on cooldown.
   */
  isOnCooldown(targetId) {
    const cooldown = this.cooldowns.get(targetId) ?? 0;
    return Date.now() < cooldown;
  }

  /**
   * Clear all pending items.
   */
  clearQueue() {
    this.totalDropped += this.queue.filter(i => !i.processed).length;
    this.queue = [];
  }

  /**
   * Reset the system.
   */
  reset() {
    this.queue = [];
    this.processedHistory = [];
    this.cooldowns.clear();
    this.lastHeartbeat.clear();
    this.totalProcessed = 0;
    this.totalDropped = 0;
    this.totalNovelty = 0;
    this.totalHeartbeats = 0;
    this.totalExploration = 0;
  }

  // --- Internal ---

  _createItem(type, target, urgency, context) {
    if (this.queue.length >= this.maxQueueSize) {
      // Drop lowest-priority item
      const lowest = this.queue.reduce((min, item, idx) =>
        (item.urgency * this.priorityWeights[item.type]) < (min.val * this.priorityWeights[min.item.type])
          ? { item, idx, val: item.urgency } : min,
        { item: this.queue[0], idx: 0, val: this.queue[0]?.urgency ?? 0 }
      );
      if (urgency * this.priorityWeights[type] > lowest.val * this.priorityWeights[lowest.item.type]) {
        this.queue.splice(lowest.idx, 1);
        this.totalDropped++;
      } else {
        this.totalDropped++;
        return null;
      }
    }

    const item = {
      id: `att_${type}_${target}_${Date.now()}`,
      type, target, urgency,
      importance: urgency * this.priorityWeights[type],
      context,
      timestamp: Date.now(),
      processed: false,
    };

    this.queue.push(item);
    return item;
  }
}

export default AttentionSystem;
