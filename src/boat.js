// CraftMind Fishing — Boat System
// Physical boats with HP, upgrades, equipment, and Minecraft-world representation.

export const BOAT_TIERS = {
  skiff:      { name: 'Wooden Skiff',       hp: 100, speed: 1.0, capacity: 8,  radar: 10, durability: 0, medical: 0, slots: 0, cost: 0 },
  fishing:    { name: 'Fishing Boat',       hp: 200, speed: 1.5, capacity: 16, radar: 20, durability: 1, medical: 0, slots: 1, cost: 500 },
  trawler:    { name: 'Trawler',            hp: 400, speed: 2.0, capacity: 32, radar: 40, durability: 2, medical: 1, slots: 2, cost: 2000 },
  ironclad:   { name: 'Ironclad',           hp: 800, speed: 1.8, capacity: 48, radar: 60, durability: 3, medical: 2, slots: 3, cost: 5000 },
  leviathan:  { name: 'Leviathan Hunter',   hp: 1500, speed: 2.5, capacity: 64, radar: 100, durability: 4, medical: 3, slots: 4, cost: 15000 },
};

export const EQUIPMENT_TYPES = {
  sonar:    { name: 'Deep Sonar',        effect: 'radar', value: 30, desc: 'Reveals fish schools at extreme range' },
  nets:     { name: 'Trawl Nets',        effect: 'catch_area', value: 2, desc: 'Catches fish in a wider area' },
  harpoons: { name: 'Harpoon Launcher',  effect: 'big_game', value: 1.5, desc: 'Bonus damage to large fish' },
  decoys:   { name: 'Decoy Dispenser',   effect: 'hazard_deflect', value: 0.5, desc: 'Reduces hazard damage by 50%' },
  lights:   { name: 'Underwater Lights', effect: 'night_boost', value: 1.3, desc: '30% better night fishing' },
};

export class Boat {
  constructor(name, tier = 'skiff', options = {}) {
    this.name = name;
    this.tier = tier;
    this.baseStats = { ...BOAT_TIERS[tier] };

    this.hp = options.hp ?? this.baseStats.hp;
    this.maxHp = this.baseStats.hp;
    this.speed = this.baseStats.speed;
    this.capacity = this.baseStats.capacity;
    this.radarRange = this.baseStats.radar;
    this.durability = this.baseStats.durability;
    this.medical = this.baseStats.medical;
    this.equipmentSlots = this.baseStats.slots;
    this.equipment = options.equipment ?? [];

    this.upgrades = { radar: 0, capacity: 0, speed: 0, durability: 0, medical: 0 };
    this.cargo = []; // stored fish
    this.owner = options.owner ?? null;
    this.damaged = false;
  }

  /** Upgrade a stat. Each level adds a bonus. Returns true if upgrade succeeded. */
  upgrade(stat, levels = 1) {
    if (this.upgrades[stat] === undefined) return false;
    const maxLevel = this.tier === 'skiff' ? 2 : this.tier === 'fishing' ? 4 : 6;
    if (this.upgrades[stat] + levels > maxLevel) return false;
    this.upgrades[stat] += levels;
    this._recalcStats();
    return true;
  }

  /** Install equipment into a slot. */
  installEquipment(equipType) {
    const equip = EQUIPMENT_TYPES[equipType];
    if (!equip) return false;
    if (this.equipment.length >= this.equipmentSlots) return false;
    if (this.equipment.find(e => e.type === equipType)) return false;
    this.equipment.push({ type: equipType, ...equip, installedAt: Date.now() });
    return true;
  }

  /** Remove equipment. */
  removeEquipment(equipType) {
    const idx = this.equipment.findIndex(e => e.type === equipType);
    if (idx === -1) return false;
    this.equipment.splice(idx, 1);
    return true;
  }

  /** Take damage from hazards. Durability reduces incoming damage. */
  takeDamage(amount) {
    const mitigated = amount * (1 - this.durability * 0.1);
    const actual = Math.max(1, Math.round(mitigated));
    this.hp -= actual;
    this.damaged = true;
    if (this.hp <= 0) this.hp = 0;
    return { damage: actual, mitigated: amount - actual, destroyed: this.hp <= 0 };
  }

  /** Heal at port or from support bot. */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (this.hp >= this.maxHp) this.damaged = false;
    return this.hp;
  }

  /** Store a fish in cargo. Returns false if full. */
  storeFish(caughtFish) {
    if (this.cargo.length >= this.capacity) return false;
    this.cargo.push(caughtFish);
    return true;
  }

  /** Remove all cargo for selling. */
  unloadCargo() {
    const cargo = [...this.cargo];
    this.cargo = [];
    return cargo;
  }

  /** Check if boat is seaworthy. */
  isSeaworthy() {
    return this.hp > 0;
  }

  /** Repair at port (full). */
  repair() {
    this.hp = this.maxHp;
    this.damaged = false;
  }

  /** Get effective stat including upgrades and equipment. */
  getEffectiveStat(stat) {
    let val = this[stat] ?? 0;
    val += (this.upgrades[stat] ?? 0) * this._upgradeBonus(stat);
    for (const eq of this.equipment) {
      if (eq.effect === stat) val += eq.value;
    }
    return Math.round(val * 100) / 100;
  }

  _upgradeBonus(stat) {
    const bonuses = {
      radar: 10, capacity: 4, speed: 0.2, durability: 1, medical: 1,
    };
    return bonuses[stat] ?? 0;
  }

  _recalcStats() {
    this.radarRange = this.baseStats.radar + this.upgrades.radar * 10;
    this.capacity = this.baseStats.capacity + this.upgrades.capacity * 4;
    this.speed = this.baseStats.speed + this.upgrades.speed * 0.2;
    this.durability = this.baseStats.durability + this.upgrades.durability;
    this.medical = this.baseStats.medical + this.upgrades.medical;
    this.maxHp = this.baseStats.hp + this.upgrades.durability * 50;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    this.equipmentSlots = this.baseStats.slots;
  }

  /** Upgrade to next tier. Returns cost or false if max tier. */
  upgradeTier() {
    const tiers = Object.keys(BOAT_TIERS);
    const idx = tiers.indexOf(this.tier);
    if (idx >= tiers.length - 1) return false;
    const nextTier = tiers[idx + 1];
    const cost = BOAT_TIERS[nextTier].cost;
    this.tier = nextTier;
    this.baseStats = { ...BOAT_TIERS[nextTier] };
    this._recalcStats();
    this.hp = this.maxHp;
    return { tier: nextTier, cost };
  }

  /** Serialize for persistence. */
  toJSON() {
    return {
      name: this.name, tier: this.tier, hp: this.hp,
      upgrades: { ...this.upgrades },
      equipment: this.equipment.map(e => e.type),
    };
  }

  toString() {
    return `${this.baseStats.name} "${this.name}" — HP: ${this.hp}/${this.maxHp} | Cap: ${this.capacity} | Radar: ${this.radarRange} | Speed: ${this.speed.toFixed(1)}`;
  }
}

export default Boat;
