// CraftMind Fishing — Gear Durability & Wear System
// Saltwater corrodes. Big fish break gear. Maintain your stuff or lose it.

export const ENVIRONMENT = {
  freshwater: { corrosionRate: 0.5,  name: 'Freshwater', emoji: '🏞️' },
  brackish:   { corrosionRate: 0.8,  name: 'Brackish',   emoji: '🌊' },
  saltwater:  { corrosionRate: 1.5,  name: 'Saltwater',  emoji: '🧂' },
  deep_water: { corrosionRate: 2.0,  name: 'Deep Water',  emoji: '🕳️' },
};

export const WEAR_EVENTS = {
  // Fish-specific damage
  halibut_bite:      { damage: 15, message: 'That halibut bent the hook!', category: 'fish' },
  lingcod_bite:      { damage: 12, message: 'Lingcod shredded your leader!', category: 'fish' },
  shark_bite:        { damage: 25, message: 'Shark bit clean through the line!', category: 'fish' },
  rockfish_abrasion: { damage: 5,  message: 'Rockfish dorsal spine frayed the line.', category: 'fish' },
  salmon_run:        { damage: 8,  message: 'That king salmon put a beating on your gear.', category: 'fish' },

  // Environmental damage
  salt_corrosion:    { damage: 3,  message: 'Saltwater is eating your gear.', category: 'environment' },
  barnacle_fouling:  { damage: 2,  message: 'Barnacles fouled your line.', category: 'environment' },
  kelp_tangle:       { damage: 4,  message: 'Kelp tangled around your gear.', category: 'environment' },
  rock_snag:         { damage: 10, message: 'Your gear snagged on the bottom!', category: 'environment' },
  current_strain:    { damage: 3,  message: 'Heavy current strained your gear.', category: 'environment' },
  storm_damage:      { damage: 8,  message: 'The storm battered your gear.', category: 'environment' },

  // General wear
  normal_use:        { damage: 1,  message: 'Normal wear and tear.', category: 'wear' },
  heavy_use:         { damage: 3,  message: 'Heavy use today.', category: 'wear' },
  dropped:           { damage: 5,  message: 'You dropped your gear on the deck. Again.', category: 'wear' },
};

export const QUALITY_TIERS = {
  common:    { name: 'Common',    emoji: '⬜', durabilityMult: 1.0, effectiveness: 1.0 },
  uncommon:  { name: 'Uncommon',  emoji: '🟩', durabilityMult: 1.3, effectiveness: 1.15 },
  rare:      { name: 'Rare',      emoji: '🟦', durabilityMult: 1.6, effectiveness: 1.3 },
  epic:      { name: 'Epic',      emoji: '🟪', durabilityMult: 2.0, effectiveness: 1.5 },
  legendary: { name: 'Legendary', emoji: '🟨', durabilityMult: 3.0, effectiveness: 2.0 },
};

export class GearInstance {
  /**
   * @param {string} gearId - ID from alaska-gear.js
   * @param {object} gearData - Gear data from alaska-gear.js
   * @param {string} quality - Quality tier
   */
  constructor(gearId, gearData, quality = 'common') {
    this.id = gearId;
    this.name = gearData.name;
    this.emoji = gearData.emoji;
    this.category = gearData.category;
    this.description = gearData.description;

    const q = QUALITY_TIERS[quality] ?? QUALITY_TIERS.common;
    this.quality = quality;
    this.qualityName = q.name;
    this.qualityEmoji = q.emoji;

    this.baseMaxDurability = gearData.durability ?? 100;
    this.maxDurability = Math.round(this.baseMaxDurability * q.durabilityMult);
    this.durability = this.maxDurability;
    this.effectiveness = q.effectiveness;

    this.wellMaintained = true; // bonus flag
    this.totalDamage = 0;
    this.repairs = 0;
    this.breaks = 0;
  }

  /** Get durability as percentage */
  get durabilityPct() {
    return Math.round((this.durability / this.maxDurability) * 100);
  }

  /** Is the gear broken? */
  get isBroken() {
    return this.durability <= 0;
  }

  /** Get durability status emoji */
  get statusEmoji() {
    const pct = this.durabilityPct;
    if (pct > 80) return '✨';
    if (pct > 50) return '👍';
    if (pct > 25) return '⚠️';
    if (pct > 0) return '💀';
    return '🗑️';
  }

  /** Apply damage to gear */
  applyDamage(amount, environment = 'saltwater') {
    if (this.isBroken) return false;

    const envMultiplier = ENVIRONMENT[environment]?.corrosionRate ?? 1.0;
    const actualDamage = Math.round(amount * envMultiplier);

    this.durability = Math.max(0, this.durability - actualDamage);
    this.totalDamage += actualDamage;
    this.wellMaintained = this.durabilityPct > 20;

    if (this.isBroken) {
      this.breaks++;
      return true; // broke!
    }
    return false;
  }

  /** Apply a wear event */
  applyWearEvent(eventKey, environment = 'saltwater') {
    const event = WEAR_EVENTS[eventKey];
    if (!event) return { broke: false, message: '' };
    const broke = this.applyDamage(event.damage, environment);
    return { broke, message: event.message, damage: event.damage };
  }

  /** Repair gear */
  repair(amount, materials = {}) {
    if (amount <= 0) return false;
    this.durability = Math.min(this.maxDurability, this.durability + amount);
    this.repairs++;
    if (this.durabilityPct > 20) this.wellMaintained = true;
    return true;
  }

  /** Full repair */
  fullRepair() {
    this.durability = this.maxDurability;
    this.wellMaintained = true;
    this.repairs++;
  }

  /** Get the well-maintained effectiveness bonus */
  get effectivenessBonus() {
    return this.wellMaintained ? 1.1 : 1.0; // 10% bonus if maintained above 20%
  }

  /** Get total effectiveness (quality + maintenance) */
  get totalEffectiveness() {
    return this.effectiveness * this.effectivenessBonus;
  }

  /** Get repair cost estimate */
  get repairCost() {
    const pct = this.durabilityPct;
    if (pct >= 100) return 0;
    const missing = this.maxDurability - this.durability;
    return Math.ceil(missing * 0.1); // 10% of missing durability in material cost
  }

  /** String representation */
  toString() {
    return `${this.qualityEmoji}${this.emoji} ${this.qualityName} ${this.name} [${this.durabilityPct}%] ${this.statusEmoji}`;
  }

  /** Serialize for saving */
  toJSON() {
    return {
      id: this.id,
      quality: this.quality,
      durability: this.durability,
      wellMaintained: this.wellMaintained,
      totalDamage: this.totalDamage,
      repairs: this.repairs,
      breaks: this.breaks,
    };
  }
}

export class GearDurabilityManager {
  constructor() {
    this.gear = new Map(); // instanceId -> GearInstance
    this.nextId = 1;
  }

  /** Create a new gear instance */
  create(gearId, gearData, quality = 'common') {
    const instance = new GearInstance(gearId, gearData, quality);
    const instanceId = `${gearId}_${this.nextId++}`;
    this.gear.set(instanceId, instance);
    return { instanceId, instance };
  }

  /** Get a gear instance */
  get(instanceId) {
    return this.gear.get(instanceId) ?? null;
  }

  /** Remove a gear instance */
  remove(instanceId) {
    return this.gear.delete(instanceId);
  }

  /** Get all gear summary */
  getAllSummary() {
    const items = [];
    for (const [id, g] of this.gear) {
      items.push({ instanceId: id, ...g.toJSON(), toString: g.toString() });
    }
    return items;
  }

  /** Get gear that needs repair */
  getNeedsRepair() {
    return [...this.gear.entries()].filter(([, g]) => !g.isBroken && g.durabilityPct < 50);
  }

  /** Get broken gear */
  getBroken() {
    return [...this.gear.entries()].filter(([, g]) => g.isBroken);
  }

  /** Apply passive saltwater corrosion to all equipped gear */
  tickCorrosion(environment, dt) {
    const events = [];
    for (const [id, gear] of this.gear) {
      if (gear.isBroken) continue;
      const envData = ENVIRONMENT[environment] ?? ENVIRONMENT.saltwater;
      // Very slow passive corrosion per tick
      const passiveDamage = envData.corrosionRate * dt * 0.001;
      if (Math.random() < passiveDamage * 0.01) {
        gear.applyDamage(1, environment);
        if (gear.isBroken) {
          events.push({ type: 'gear_broke', instanceId: id, gear: gear.name, message: `${gear.emoji} ${gear.name} broke from corrosion!` });
        }
      }
    }
    return events;
  }
}

export { ENVIRONMENT, WEAR_EVENTS, QUALITY_TIERS };
export default GearDurabilityManager;
