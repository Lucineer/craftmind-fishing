/**
 * @module craftmind-fishing/stuck-detector
 * @description Detects when the fishing bot is stuck and provides recovery levels.
 * Tracks position changes, fish count, and chat patterns to identify stuck states.
 */

export class StuckDetector {
  constructor() {
    // Position tracking
    this.positionHistory = [];
    this.recordInterval = 30000; // 30 seconds

    // Fish tracking
    this.fishHistory = [];
    this.fishCheckInterval = 2 * 60 * 1000; // 2 minutes (bot should catch fish within 2 min at dock)
    this.consecutiveNoFishChecks = 0;

    // Chat tracking (for loop detection)
    this.chatHistory = [];

    // Level 3 tracking
    this.level2Active = false;
  }

  /**
   * Record current bot position
   * @param {Object} pos - {x, y, z} position object
   */
  recordPosition(pos) {
    const now = Date.now();
    this.positionHistory.push({ ...pos, timestamp: now });

    // Keep only 3 minutes of history
    const cutoff = now - (3 * 60 * 1000);
    this.positionHistory = this.positionHistory.filter(p => p.timestamp > cutoff);
  }

  /**
   * Record a fish catch
   * @param {number} count - Cumulative fish count
   */
  recordFish(count) {
    const now = Date.now();
    this.fishHistory.push({ count, timestamp: now });

    // Keep only 10 minutes of history
    const cutoff = now - (10 * 60 * 1000);
    this.fishHistory = this.fishHistory.filter(f => f.timestamp > cutoff);
  }

  /**
   * Record a chat message
   * @param {string} msg - Chat message content
   */
  recordChat(msg) {
    const now = Date.now();
    this.chatHistory.push({ message: msg, timestamp: now });

    // Keep only 2 minutes of history
    const cutoff = now - (2 * 60 * 1000);
    this.chatHistory = this.chatHistory.filter(c => c.timestamp > cutoff);
  }

  /**
   * Calculate distance between two positions
   * @param {Object} pos1 - First position
   * @param {Object} pos2 - Second position
   * @returns {number} Distance in blocks
   */
  _distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Check for Level 1: No position change OR chat loop
   * @returns {Object|null} Stuck info or null
   */
  _checkLevel1() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Check position stuck (no movement < 2 blocks in 60s)
    const recentPositions = this.positionHistory.filter(p => p.timestamp > oneMinuteAgo);
    if (recentPositions.length >= 2) {
      const oldest = recentPositions[0];
      const newest = recentPositions[recentPositions.length - 1];
      const dist = this._distance(oldest, newest);
      if (dist < 2) {
        return { level: 1, reason: 'No position change in 60s (stuck in place)' };
      }
    }

    // Check chat loop (same message 3x in 60s)
    const recentChats = this.chatHistory.filter(c => c.timestamp > oneMinuteAgo);
    if (recentChats.length >= 3) {
      const messageCounts = {};
      for (const chat of recentChats) {
        messageCounts[chat.message] = (messageCounts[chat.message] || 0) + 1;
      }
      for (const [msg, count] of Object.entries(messageCounts)) {
        if (count >= 3) {
          return { level: 1, reason: `Chat loop detected: "${msg}" repeated 3x in 60s` };
        }
      }
    }

    return null;
  }

  /**
   * Check for Level 2: No fish caught in 5 minutes
   * @returns {Object|null} Stuck info or null
   */
  _checkLevel2() {
    const now = Date.now();
    const fiveMinutesAgo = now - this.fishCheckInterval;

    const recentFish = this.fishHistory.filter(f => f.timestamp > fiveMinutesAgo);

    if (recentFish.length === 0) {
      // No fish recorded at all in check period
      return { level: 2, reason: '0 fish caught in 5 minutes' };
    }

    // Check if fish count actually increased
    if (recentFish.length >= 2) {
      const oldestFish = recentFish[0];
      const newestFish = recentFish[recentFish.length - 1];
      if (oldestFish.count === newestFish.count) {
        return { level: 2, reason: '0 fish caught in 5 minutes (count unchanged)' };
      }
    }

    return null;
  }

  /**
   * Check if bot is stuck and return stuck level info
   * @returns {Object|null} { level: 1|2|3, reason: string } or null if not stuck
   */
  isStuck() {
    // Check Level 1 conditions
    const level1 = this._checkLevel1();
    if (level1) {
      return level1;
    }

    // Check Level 2 conditions
    const level2 = this._checkLevel2();
    if (level2) {
      if (this.level2Active) {
        // Level 2 happened second consecutive time -> Level 3
        this.level2Active = false;
        return { level: 3, reason: 'Second consecutive check with 0 fish in 5 minutes' };
      }
      this.level2Active = true;
      return level2;
    }

    // Reset level 2 flag if conditions cleared
    this.level2Active = false;

    return null;
  }

  /**
   * Reset the stuck detector state (e.g., after recovery)
   */
  reset() {
    this.positionHistory = [];
    this.fishHistory = [];
    this.chatHistory = [];
    this.level2Active = false;
  }
}
