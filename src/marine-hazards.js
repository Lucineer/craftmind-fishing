// CraftMind Fishing — Marine Hazards System
// Ocean dangers that create emergent drama: sharks, guardians, riptides, leviathans.

export const HAZARD_TYPES = {
  shark_pack:      { name: 'Shark Pack',       severity: 'high',   damage: 25, duration: 60000,  affectsFish: true,  affectsFishermen: true,  rarity: 0.15 },
  elder_guardian:  { name: 'Elder Guardian',    severity: 'extreme', damage: 60, duration: 90000, affectsFish: true,  affectsFishermen: true,  rarity: 0.03 },
  squid_ink:       { name: 'Squid Ink Cloud',   severity: 'low',    damage: 0,  duration: 45000,  affectsFish: true,  affectsFishermen: false, rarity: 0.12 },
  whale_breach:    { name: 'Whale Breaching',   severity: 'medium', damage: 15, duration: 10000, affectsFish: true,  affectsFishermen: true,  rarity: 0.08 },
  riptide:         { name: 'Riptide',           severity: 'medium', damage: 20, duration: 30000, affectsFish: false, affectsFishermen: true,  rarity: 0.10 },
  phantom_diver:   { name: 'Phantom Diver',     severity: 'medium', damage: 0,  duration: 40000, affectsFish: false, affectsFishermen: true,  rarity: 0.06 },
  coral_storm:     { name: 'Coral Storm',       severity: 'high',   damage: 35, duration: 50000, affectsFish: true,  affectsFishermen: true,  rarity: 0.05 },
  leviathan:       { name: 'Leviathan',         severity: 'extreme', damage: 100, duration: 180000, affectsFish: true, affectsFishermen: true, rarity: 0.01 },
  bioluminescent:  { name: 'Bioluminescent Night', severity: 'beneficial', damage: 0, duration: 120000, affectsFish: true, affectsFishermen: false, rarity: 0.04 },
};

export class MarineHazard {
  constructor(type, location, options = {}) {
    const typeDef = HAZARD_TYPES[type];
    if (!typeDef) throw new Error(`Unknown hazard type: ${type}`);

    this.id = `hazard_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.type = type;
    this.name = typeDef.name;
    this.severity = typeDef.severity;
    this.damage = typeDef.damage;
    this.duration = options.duration ?? typeDef.duration;
    this.affectsFish = typeDef.affectsFish;
    this.affectsFishermen = typeDef.affectsFishermen;
    this.location = { ...location };
    this.radius = options.radius ?? this._defaultRadius();
    this.spawnedAt = Date.now();
    this.active = true;
    this.damageDealt = 0;
    this.fishScattered = 0;
    this.fishStunned = 0;
  }

  _defaultRadius() {
    const radii = { shark_pack: 30, elder_guardian: 40, squid_ink: 20, whale_breach: 25,
      riptide: 15, phantom_diver: 20, coral_storm: 35, leviathan: 80, bioluminescent: 50 };
    return radii[this.type] ?? 20;
  }

  /** Check if hazard is still active based on duration. */
  isActive() {
    if (!this.active) return false;
    if (Date.now() - this.spawnedAt >= this.duration) {
      this.active = false;
      return false;
    }
    return true;
  }

  /** Check if a location is within hazard range. */
  isInRange(location, margin = 0) {
    const dx = location.x - this.location.x;
    const dz = (location.z ?? location.y) - (this.location.z ?? this.location.y);
    return Math.sqrt(dx * dx + dz * dz) < this.radius + margin;
  }

  /** Get time remaining. */
  getTimeRemaining() {
    return Math.max(0, this.duration - (Date.now() - this.spawnedAt));
  }

  /** Tick the hazard — return events. */
  tick(nearbyFishermen = [], nearbyFish = []) {
    if (!this.isActive()) return [];

    const events = [];

    // Damage fishermen in range
    if (this.affectsFishermen) {
      for (const fisherman of nearbyFishermen) {
        if (this.isInRange(fisherman.location ?? fisherman)) {
          const dmg = this.damage * (0.5 + Math.random() * 0.5);
          events.push({ type: 'damage_fisherman', target: fisherman.name, damage: Math.round(dmg), hazard: this.name });
          this.damageDealt += dmg;
        }
      }
    }

    // Scatter or stun fish
    if (this.affectsFish) {
      if (this.type === 'whale_breach') {
        // Stuns fish near impact
        const stunned = Math.floor(nearbyFish.length * 0.6);
        this.fishStunned += stunned;
        events.push({ type: 'fish_stunned', count: stunned, hazard: this.name, opportunity: true });
      } else if (this.type !== 'bioluminescent') {
        // Scatter fish
        const scattered = Math.floor(nearbyFish.length * 0.8);
        this.fishScattered += scattered;
        events.push({ type: 'fish_scattered', count: scattered, hazard: this.name });
      } else {
        // Bioluminescent: attracts rare fish
        events.push({ type: 'rare_fish_attracted', hazard: this.name, opportunity: true });
      }
    }

    // Special: phantom diver steals fish
    if (this.type === 'phantom_diver') {
      events.push({ type: 'fish_stolen', hazard: this.name });
    }

    return events;
  }

  toJSON() {
    return {
      id: this.id, type: this.type, name: this.name,
      severity: this.severity, location: this.location, radius: this.radius,
      timeRemaining: this.getTimeRemaining(), active: this.isActive(),
      damageDealt: Math.round(this.damageDealt),
      fishScattered: this.fishScattered, fishStunned: this.fishStunned,
    };
  }
}

export class MarineHazardSystem {
  constructor(options = {}) {
    this.activeHazards = new Map();
    this.hazardHistory = [];
    this.maxHistory = options.maxHistory ?? 200;
    this.spawnRate = options.spawnRate ?? 0.02; // per tick probability
    this.callbacks = []; // (event) => void
    this.totalSpawned = 0;
    this.totalDamageDealt = 0;
  }

  /** Spawn a hazard. Returns the hazard. */
  spawn(type, options = {}) {
    const hazard = new MarineHazard(type, options.location ?? { x: 0, z: 0 }, options);
    this.activeHazards.set(hazard.id, hazard);
    this.totalSpawned++;
    this._fireCallback({ type: 'hazard_spawned', hazard: hazard.toJSON() });
    return hazard;
  }

  /** Random spawn based on probability. */
  randomSpawn(location = { x: 0, z: 0 }) {
    if (Math.random() > this.spawnRate) return null;
    const types = Object.keys(HAZARD_TYPES);
    const weights = types.map(t => HAZARD_TYPES[t].rarity);
    const type = this._weightedRandom(types, weights);
    return this.spawn(type, { location });
  }

  /** Tick all active hazards. Returns all events. */
  tick(nearbyFishermen = [], nearbyFish = []) {
    const allEvents = [];
    const toRemove = [];

    for (const [id, hazard] of this.activeHazards) {
      if (!hazard.isActive()) {
        toRemove.push(id);
        this._recordToHistory(hazard);
        continue;
      }

      const events = hazard.tick(nearbyFishermen, nearbyFish);
      allEvents.push(...events);
      this.totalDamageDealt += events
        .filter(e => e.type === 'damage_fisherman')
        .reduce((s, e) => s + e.damage, 0);
    }

    for (const id of toRemove) {
      this.activeHazards.delete(id);
      this._fireCallback({ type: 'hazard_expired', hazardId: id });
    }

    if (allEvents.length > 0) {
      this._fireCallback({ type: 'hazard_events', events: allEvents });
    }

    return allEvents;
  }

  /** Get all active hazards. */
  getActive() {
    return [...this.activeHazards.values()].filter(h => h.isActive());
  }

  /** Get hazards at a location. */
  getHazardsAt(location, margin = 0) {
    return this.getActive().filter(h => h.isInRange(location, margin));
  }

  /** Dispel a hazard (by defeating it or through support action). */
  dispel(hazardId) {
    const hazard = this.activeHazards.get(hazardId);
    if (!hazard) return false;
    hazard.active = false;
    this.activeHazards.delete(hazardId);
    this._recordToHistory(hazard);
    this._fireCallback({ type: 'hazard_dispelled', hazard: hazard.toJSON() });
    return true;
  }

  /** Register callback for hazard events. */
  onEvent(callback) { this.callbacks.push(callback); }

  /** Get hazard statistics. */
  getStats() {
    return {
      activeHazards: this.activeHazards.size,
      totalSpawned: this.totalSpawned,
      totalDamageDealt: Math.round(this.totalDamageDealt),
      historySize: this.hazardHistory.length,
    };
  }

  _weightedRandom(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  _recordToHistory(hazard) {
    this.hazardHistory.push(hazard.toJSON());
    if (this.hazardHistory.length > this.maxHistory) this.hazardHistory.shift();
  }

  _fireCallback(event) {
    for (const cb of this.callbacks) try { cb(event); } catch {}
  }
}

export default MarineHazardSystem;
