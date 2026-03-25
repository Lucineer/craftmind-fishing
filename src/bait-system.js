// CraftMind Fishing — Bait & Lure System
// 20 bait types with freshness, effectiveness, and special lures.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baitData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'bait.json'), 'utf-8'));

const SPECIAL_LURES = {
  attraction_lure: {
    name: 'Attraction Lure',
    emoji: '🧲',
    description: 'Draws fish from far away, increasing bite radius',
    effect: 'bite_radius_mult',
    value: 2.0,
  },
  camouflage_lure: {
    name: 'Camouflage Lure',
    emoji: '🫥',
    description: 'Reduces spook chance by 50%',
    effect: 'spook_reduction',
    value: 0.5,
  },
  trophy_lure: {
    name: 'Trophy Lure',
    emoji: '🏆',
    description: 'Increases rare fish chance significantly',
    effect: 'rarity_boost',
    value: 30,
  },
  patience_lure: {
    name: 'Patience Lure',
    emoji: '⏳',
    description: 'Fish bite less often but commit harder',
    effect: 'commitment_boost',
    value: 20,
  },
};

export class Bait {
  constructor(baitId, options = {}) {
    const template = baitData.find(b => b.id === baitId);
    if (!template) throw new Error(`Unknown bait: ${baitId}`);
    Object.assign(this, { ...template });
    this.id = baitId;
    this.createdAt = Date.now();
    this.stackSize = options.stackSize ?? 1;
    this.attachedLure = options.attachedLure ?? null;
  }

  /** Get freshness multiplier (1.0 = fresh, 0.0 = expired) */
  getFreshness() {
    const age = (Date.now() - this.createdAt) / (1000 * 60 * 60);
    if (age >= this.freshnessHours) return 0;
    return Math.max(0, 1 - (age / this.freshnessHours) * 0.5);
  }

  /** Get effectiveness against a species, considering freshness */
  getEffectiveness(speciesId) {
    const base = this.effectiveness?.[speciesId] ?? this.effectiveness?.default ?? 0.2;
    return base * (0.5 + this.getFreshness() * 0.5);
  }

  /** Check if bait is expired */
  isExpired() {
    return this.getFreshness() <= 0;
  }

  /** Attach a special lure */
  attachLure(lureId) {
    if (!SPECIAL_LURES[lureId]) throw new Error(`Unknown lure: ${lureId}`);
    this.attachedLure = lureId;
    return this;
  }

  /** Get lure data if attached */
  getLure() {
    return this.attachedLure ? SPECIAL_LURES[this.attachedLure] : null;
  }

  useOne() {
    this.stackSize--;
    return this.stackSize > 0;
  }

  toString() {
    const fresh = this.getFreshness();
    const lureStr = this.attachedLure ? ` + ${SPECIAL_LURES[this.attachedLure]?.name}` : '';
    const freshEmoji = fresh > 0.7 ? '✨' : fresh > 0.3 ? '⚠️' : '💀';
    return `${this.emoji} ${this.name} x${this.stackSize} ${freshEmoji}${lureStr}`;
  }
}

export class BaitRegistry {
  static get(id) { return baitData.find(b => b.id === id) ?? null; }
  static all() { return [...baitData]; }
  static get lures() { return SPECIAL_LURES; }
}

export default Bait;
