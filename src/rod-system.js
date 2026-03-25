// CraftMind Fishing — Rod System
// Tiered rods with enchantments and durability.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rodData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'rods.json'), 'utf-8'));

const ENCHANTMENTS = {
  luck_of_the_sea: { name: 'Luck of the Sea', maxLevel: 3, description: 'Increases rare fish chance' },
  lure:            { name: 'Lure', maxLevel: 5, description: 'Fish bite faster' },
  unbreaking:      { name: 'Unbreaking', maxLevel: 3, description: 'Rod lasts longer' },
  mending:         { name: 'Mending', maxLevel: 1, description: 'XP repairs the rod' },
  silk_touch:      { name: 'Silk Touch', maxLevel: 1, description: 'Catch fish at full health' },
};

export class FishingRod {
  constructor(rodId, enchantments = {}) {
    const template = rodData.find(r => r.id === rodId) ?? rodData[0];
    Object.assign(this, { ...template });
    this.id = rodId;
    this.enchantments = { ...enchantments };
    this.currentDurability = template.durability;
    this.broken = false;
  }

  /** Apply damage to the rod. Returns true if it breaks. */
  applyDamage(amount = 1) {
    if (this.broken) return true;

    let dmg = amount;
    if (this.enchantments.unbreaking) {
      const chance = 1 / (this.enchantments.unbreaking + 1);
      if (Math.random() > chance) dmg = 0;
    }

    this.currentDurability -= dmg;
    if (this.currentDurability <= 0) {
      this.currentDurability = 0;
      this.broken = true;
      return true;
    }
    return false;
  }

  /** Check if rod can handle a fish of given weight */
  canHandleFish(weight) {
    return weight <= this.maxFishWeight;
  }

  /** Get rarity boost from Luck of the Sea */
  getRarityBoost() {
    return (this.enchantments.luck_of_the_sea ?? 0) * 15; // +15% per level
  }

  /** Get bite speed multiplier from Lure */
  getBiteSpeedMult() {
    return 1 + (this.enchantments.lure ?? 0) * 0.2; // +20% per level
  }

  /** Calculate cast efficiency score (0-1) for given conditions */
  castEfficiency({ depth, distance }) {
    let eff = 1.0;
    if (distance > this.castDistance) eff *= 0.3;
    if (depth > this.maxDepth) eff *= 0.5;
    return Math.max(0.1, Math.min(1.0, eff));
  }

  /** Get reel success chance against a fish */
  reelSuccessChance(fightStrength) {
    const diff = this.lineStrength - fightStrength;
    if (diff >= 5) return 0.95;
    if (diff >= 0) return 0.8;
    if (diff >= -3) return 0.5;
    return 0.25;
  }

  /** Repair the rod */
  repair(amount) {
    this.currentDurability = Math.min(this.durability, this.currentDurability + amount);
    this.broken = false;
  }

  /** Get a display string */
  toString() {
    const enchants = Object.entries(this.enchantments)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${ENCHANTMENTS[k]?.name ?? k} ${v}`)
      .join(', ');
    const enchStr = enchants ? ` [${enchants}]` : '';
    const durPct = Math.round((this.currentDurability / this.durability) * 100);
    return `${this.emoji} ${this.name}${enchStr} (${durPct}% dur)`;
  }
}

export class RodRegistry {
  static get(id) { return rodData.find(r => r.id === id) ?? null; }
  static all() { return [...rodData]; }
  static byTier(tier) { return rodData.filter(r => r.tier === tier); }
  static get enchantments() { return ENCHANTMENTS; }
}

export default FishingRod;
