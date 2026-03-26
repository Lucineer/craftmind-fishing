/**
 * @module craftmind-fishing/ai/conversation-memory
 * @description Tracks conversation history and provides context for LLM prompts.
 */

export class ConversationMemory {
  constructor(maxMessages = 50) {
    this.maxMessages = maxMessages;
    /** @type {Array<{role: string, message: string, time: number, metadata?: Object}>} */
    this.history = [];
  }

  /**
   * Add a message to history.
   * @param {'player'|'cody'|'system'} role
   * @param {string} message
   * @param {Object} [metadata]
   */
  add(role, message, metadata) {
    this.history.push({ role, message, time: Date.now(), metadata });
    if (this.history.length > this.maxMessages) {
      this.history.shift();
    }
  }

  /**
   * Get the most recent N messages.
   * @param {number} [n=10]
   * @returns {Array}
   */
  getRecent(n = 10) {
    return this.history.slice(-n);
  }

  /**
   * Get messages from a specific player.
   * @param {string} playerName
   * @param {number} [n=10]
   * @returns {Array}
   */
  getFromPlayer(playerName, n = 10) {
    return this.history
      .filter(m => m.role === 'player' && m.metadata?.player === playerName)
      .slice(-n);
  }

  /**
   * Extract recurring topics from recent messages.
   * @returns {string[]}
   */
  extractTopics() {
    const recent = this.getRecent(20);
    const keywords = ['fish', 'salmon', 'halibut', 'crab', 'weather', 'tide',
      'gear', 'rod', 'bait', 'lure', 'king', 'silver', 'cod', 'boat',
      'sell', 'buy', 'permit', 'teach', 'help', 'catch'];
    const counts = {};
    for (const msg of recent) {
      const lower = msg.message.toLowerCase();
      for (const kw of keywords) {
        if (lower.includes(kw)) counts[kw] = (counts[kw] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Detect the player's likely intent from recent messages.
   * @returns {string}
   */
  detectIntent() {
    const recent = this.getRecent(3);
    if (recent.length === 0) return 'greeting';
    const last = recent[recent.length - 1].message.toLowerCase();
    if (/weather|rain|wind|storm|clear|sun/i.test(last)) return 'check_weather';
    if (/how are|how do you feel|you okay|what's up/i.test(last)) return 'small_talk';
    if (/teach|show me|how to|learn/i.test(last)) return 'learn';
    if (/let's go|come on|follow|let's fish/i.test(last)) return 'go_fishing';
    if (/sell|buy|shop|gear|buy/i.test(last)) return 'trade';
    if (/^(hi|hello|hey|sup|yo|greetings|morning|evening)/i.test(last)) return 'greeting';
    if (/!\w/.test(last)) return 'command';
    if (/thank|thanks/i.test(last)) return 'gratitude';
    if (/\?/.test(last)) return 'question';
    return 'general';
  }

  /**
   * Build a context summary for the LLM prompt.
   * @returns {Object}
   */
  getContext() {
    return {
      recentMessages: this.getRecent(10).map(m => `${m.role}: ${m.message}`),
      topics: this.extractTopics(),
      playerIntent: this.detectIntent(),
      messageCount: this.history.length,
    };
  }

  /**
   * Clear history.
   */
  clear() {
    this.history = [];
  }

  /**
   * Serialize for persistence.
   * @returns {string}
   */
  serialize() {
    return JSON.stringify(this.history);
  }

  /**
   * Deserialize from persistence.
   * @param {string} data
   */
  deserialize(data) {
    try {
      this.history = JSON.parse(data);
    } catch {
      this.history = [];
    }
  }
}
