/**
 * @module craftmind-fishing/ai/relationships
 * @description Per-player relationship tracking with familiarity, trust, and tags.
 * Trust gates behavior — won't share secrets until trust > 0.6. Persists to JSON.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DEFAULT_RELATIONSHIP = {
  familiarity: 0,
  trust: 0.3,
  tag: 'new kid',
  firstMet: null,
  lastSeen: null,
  interactions: 0,
  notes: [],
};

const FAMILIARITY_DECAY = 0.98; // per day
const TRUST_THRESHOLDS = {
  casual_chat: 0.2,
  fishing_tips: 0.4,
  good_spots: 0.6,
  secret_spots: 0.8,
  best_friend: 0.9,
};

export class Relationships {
  constructor(dataDir = './data/memory') {
    this.dataDir = dataDir;
    this._filePath = join(dataDir, 'relationships.json');
    this.players = {}; // playerName -> relationship
    this._load();
  }

  /**
   * Get or create a relationship for a player.
   * @param {string} playerName
   * @returns {object}
   */
  get(playerName) {
    if (!this.players[playerName]) {
      this.players[playerName] = {
        ...DEFAULT_RELATIONSHIP,
        firstMet: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };
    }
    return this.players[playerName];
  }

  /**
   * Record an interaction with a player.
   * @param {string} playerName
   * @param {'asked_for_help'|'gave_gift'|'stole_spot'|'shared_catch'|'chat'|'fished_together'|'rude'|'friendly'} type
   * @param {object} [context]
   */
  interact(playerName, type, context = {}) {
    const rel = this.get(playerName);
    rel.interactions++;
    rel.lastSeen = new Date().toISOString();

    switch (type) {
      case 'asked_for_help':
        if (rel.familiarity > 0.5) {
          rel.trust = clamp(0, 1, rel.trust + 0.05);
          rel.familiarity = clamp(0, 1, rel.familiarity + 0.02);
        } else {
          rel.trust = clamp(0, 1, rel.trust - 0.02);
          rel.familiarity = clamp(0, 1, rel.familiarity + 0.03);
        }
        break;
      case 'gave_gift':
        rel.trust = clamp(0, 1, rel.trust + 0.1);
        rel.familiarity = clamp(0, 1, rel.familiarity + 0.05);
        if (rel.trust > 0.7) rel.tag = 'fishing buddy';
        break;
      case 'stole_spot':
        rel.trust = clamp(0, 1, rel.trust - 0.2);
        rel.familiarity = clamp(0, 1, rel.familiarity + 0.1);
        rel.tag = rel.trust < 0.2 ? 'spot thief' : 'rival';
        rel.notes.push(`Stole my spot at ${context.location || 'unknown'}`);
        break;
      case 'shared_catch':
        rel.trust = clamp(0, 1, rel.trust + 0.08);
        rel.familiarity = clamp(0, 1, rel.familiarity + 0.05);
        if (rel.trust > 0.6) rel.tag = 'fishing buddy';
        break;
      case 'chat':
        rel.familiarity = clamp(0, 1, rel.familiarity + 0.01);
        break;
      case 'fished_together':
        rel.familiarity = clamp(0, 1, rel.familiarity + 0.03);
        rel.trust = clamp(0, 1, rel.trust + 0.02);
        if (rel.familiarity > 0.4 && rel.tag === 'new kid') rel.tag = 'acquaintance';
        break;
      case 'rude':
        rel.trust = clamp(0, 1, rel.trust - 0.05);
        break;
      case 'friendly':
        rel.trust = clamp(0, 1, rel.trust + 0.03);
        rel.familiarity = clamp(0, 1, rel.familiarity + 0.02);
        break;
    }

    this._dirty = true;
  }

  /**
   * Check if Cody would share something based on trust level.
   * @param {string} playerName
   * @param {'casual_chat'|'fishing_tips'|'good_spots'|'secret_spots'} what
   * @returns {boolean}
   */
  wouldShare(playerName, what) {
    const rel = this.get(playerName);
    const threshold = TRUST_THRESHOLDS[what] || 0.5;
    return rel.trust >= threshold;
  }

  /**
   * Get the tag for a player.
   * @param {string} playerName
   * @returns {string}
   */
  getTag(playerName) {
    return this.get(playerName).tag;
  }

  /**
   * Get all players sorted by familiarity.
   * @returns {Array<{name: string, relationship: object}>}
   */
  getAll() {
    return Object.entries(this.players)
      .map(([name, rel]) => ({ name, relationship: rel }))
      .sort((a, b) => b.relationship.familiarity - a.relationship.familiarity);
  }

  /**
   * Apply daily familiarity decay (call once per game day).
   */
  decay() {
    for (const rel of Object.values(this.players)) {
      rel.familiarity = clamp(0, 1, rel.familiarity * FAMILIARITY_DECAY);
      // Update tags based on decay
      if (rel.familiarity < 0.1 && rel.tag !== 'new kid') {
        rel.tag = 'stranger';
      }
    }
    this._dirty = true;
  }

  // ── Persistence ──────────────────────────────────────────────

  _dirty = false;

  save() {
    try {
      mkdirSync(this.dataDir, { recursive: true });
      writeFileSync(this._filePath, JSON.stringify(this.players, null, 2));
      this._dirty = false;
    } catch (err) {
      console.error('[Relationships] Save failed:', err.message);
    }
  }

  _load() {
    try {
      if (!existsSync(this._filePath)) return;
      const data = JSON.parse(readFileSync(this._filePath, 'utf-8'));
      this.players = data;
    } catch (err) {
      console.error('[Relationships] Load failed:', err.message);
    }
  }
}

function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

export default Relationships;
