// CraftMind Fishing — Bear System
// Coastal brown and black bears at salmon runs in Southeast Alaska.
// Fishing near bears = huge risk/reward. Best fishing, most danger.

import { EventEmitter } from 'node:events';

// ═══════════════════════════════════════════════════════════════
// BEAR SPECIES
// ═══════════════════════════════════════════════════════════════

export const BEAR_TYPES = {
  brown_bear: {
    id: 'brown_bear',
    name: 'Brown Bear (Grizzly)',
    scientific: 'Ursus arctos',
    emoji: '🐻',
    sizeRange: [400, 1200],      // lbs — big boars are enormous
    aggression: 0.7,
    speed: 30,                    // mph — faster than you. Always.
    territoryRadius: 80,
    toleranceZones: {
      safe: 60,                   // yards — won't charge if you stay here
      alert: 30,                  // ears up, watching
      warning: 15,                // woofing, jaw popping
      charge: 8,                  // CHARGE
    },
    personality: 'The boss. Biggest bear gets the best spot. Do not test this.',
    fishingSkill: 0.85,           // 85% catch rate at river mouth
    salmonPreference: ['pink_salmon', 'chum_salmon', 'sockeye_salmon'],
    notes: 'Peak salmon run = peak bear activity. July-September. Hierarchy at popular spots.',
  },
  black_bear: {
    id: 'black_bear',
    name: 'Black Bear',
    scientific: 'Ursus americanus',
    emoji: '🐻',
    sizeRange: [150, 400],
    aggression: 0.4,
    speed: 25,
    territoryRadius: 40,
    toleranceZones: {
      safe: 40,
      alert: 20,
      warning: 10,
      charge: 5,
    },
    personality: 'Smaller, more skittish, but still a bear. Will climb trees. Won\'t usually charge.',
    fishingSkill: 0.6,
    salmonPreference: ['pink_salmon', 'chum_salmon'],
    notes: 'More common than browns. Can be scared off by noise. But a surprised black bear is a dangerous black bear.',
  },
};

// ═══════════════════════════════════════════════════════════════
// ACTIVE BEAR
// ═══════════════════════════════════════════════════════════════

export class Bear {
  constructor(speciesId, location, options = {}) {
    const def = BEAR_TYPES[speciesId];
    if (!def) throw new Error(`Unknown bear species: ${speciesId}`);

    this.id = `bear_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.speciesId = speciesId;
    this.species = def;
    this.location = { ...location };
    this.weight = options.weight ?? def.sizeRange[0] + Math.random() * (def.sizeRange[1] - def.sizeRange[0]);
    this.state = 'idle';           // idle, fishing, patrolling, eating, charging, retreating
    this.aggression = def.aggression + (Math.random() - 0.5) * 0.2;
    this.hunger = options.hunger ?? 0.5 + Math.random() * 0.5;
    this.active = true;
    this.spawnedAt = Date.now();
    this.lastCatch = 0;
    this.catches = 0;

    // Is this bear aware of the player?
    this.playerAwareness = 0;      // 0-1, increases when player is visible/loud
    this.lastCharge = 0;
    this.chargeCooldown = 60_000;  // Can't charge again for 60s

    // Rank in hierarchy (for brown bears at popular spots)
    this.rank = speciesId === 'brown_bear'
      ? Math.floor(Math.random() * 5) // 0=biggest, 4=smallest
      : 5; // Black bears always lowest rank at brown bear spots
  }

  /** Distance to player */
  distanceTo(playerLocation) {
    const dx = this.location.x - (playerLocation?.x ?? 0);
    const dz = this.location.z - (playerLocation?.z ?? 0);
    return Math.sqrt(dx * dx + dz * dz) * 3; // Game units to "yards" conversion
  }

  /** Get tolerance zone based on distance */
  getToleranceZone(playerLocation) {
    const dist = this.distanceTo(playerLocation);
    const zones = this.species.toleranceZones;

    if (dist > zones.safe) return 'safe';
    if (dist > zones.alert) return 'alert';
    if (dist > zones.warning) return 'warning';
    if (dist > zones.charge) return 'pre_charge';
    return 'charge_zone';
  }

  /** Check if bear should charge */
  shouldCharge(playerLocation, context) {
    const zone = this.getToleranceZone(playerLocation);
    if (zone === 'safe' || zone === 'alert') return false;

    const timeSinceLastCharge = Date.now() - this.lastCharge;
    if (timeSinceLastCharge < this.chargeCooldown) return false;

    // Warning zone: chance to charge based on aggression
    if (zone === 'warning') {
      const chargeChance = this.aggression * 0.3 * this.hunger;
      if (context.isRunning) chargeChance *= 2;   // Running triggers chase instinct!
      if (context.hasBearSpray) chargeChance *= 0.3;
      if (context.hasDog) chargeChance *= 2.5;     // Dogs + bears = BAD
      if (context.isDownwind) chargeChance *= 1.5; // Can't smell you
      if (context.isLoud) chargeChance *= 1.3;     // Startled
      return Math.random() < chargeChance;
    }

    // Charge zone: very likely unless deterrent
    if (zone === 'pre_charge' || zone === 'charge_zone') {
      if (context.hasBearSpray && !Math.random() < 0.2) return false;
      return Math.random() < 0.7 * this.aggression;
    }

    return false;
  }

  /** Bear catches a salmon (visual event) */
  catchSalmon() {
    if (Date.now() - this.lastCatch < 10_000) return null;
    if (Math.random() > this.species.fishingSkill) return null;

    this.lastCatch = Date.now();
    this.catches++;
    this.hunger = Math.max(0, this.hunger - 0.3);

    const salmon = this.species.salmonPreference[
      Math.floor(Math.random() * this.species.salmonPreference.length)
    ];

    return {
      bearId: this.id,
      speciesId: this.speciesId,
      salmon,
      description: `The ${this.speciesId === 'brown_bear' ? 'brown' : 'black'} bear lunges into the current and comes up with a ${salmon.replace('_', ' ')} in its jaws. It carries it to the bank and starts eating.`,
    };
  }

  /** Bear charges the player */
  charge(playerLocation) {
    this.state = 'charging';
    this.lastCharge = Date.now();

    const dist = this.distanceTo(playerLocation);
    const isBluff = Math.random() < 0.4 && dist > this.species.toleranceZones.charge;

    return {
      bearId: this.id,
      speciesId: this.speciesId,
      isBluffCharge: isBluff,
      distance: dist,
      description: isBluff
        ? `The ${this.speciesId === 'brown_bear' ? 'brown' : 'black'} bear charges — then stops! It was a bluff charge. It woofs loudly and turns back to the river. Your heart won't stop racing.`
        : `THE BEAR IS CHARGING. ${this.speciesId === 'brown_bear' ? 'A full-sized grizzly' : 'The black bear'} is coming at you at ${this.species.speed}mph. You have seconds to react.`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// BEAR SAFETY ITEMS
// ═══════════════════════════════════════════════════════════════

export const BEAR_SAFETY = {
  bear_spray: {
    id: 'bear_spray',
    name: 'Bear Spray',
    description: 'Capstun pepper spray. 30 feet, 7 seconds. THE most effective bear deterrent.',
    effectiveness: 0.85,
    range: 30, // feet
    duration: 7, // seconds of spray
    craftable: true,
    craftTier: 1,
  },
  bear_banger: {
    id: 'bear_banger',
    name: 'Bear Banger (Screamers)',
    description: 'Pen-launched noisemaker. Startles bears. Single use.',
    effectiveness: 0.5,
    range: 0, // Area effect
    craftable: true,
    craftTier: 1,
  },
  air_horn: {
    id: 'air_horn',
    name: 'Air Horn',
    description: 'Loud horn. Good for preventing surprise encounters. Annoying to everyone.',
    effectiveness: 0.3,
    range: 0,
    craftable: true,
    craftTier: 1,
  },
};

// ═══════════════════════════════════════════════════════════════
// BEAR SYSTEM
// ═══════════════════════════════════════════════════════════════

export class BearSystem extends EventEmitter {
  constructor(world) {
    super();
    this.world = world;
    this.activeBears = new Map();
    this.maxBears = 8;
    this.spawnTimer = 0;

    // River salmon run locations
    this.salmonRunLocations = [
      { id: 'indian_river', name: 'Indian River', x: 140, z: 225, bearCapacity: 4, runStrength: 0.8 },
      { id: 'sitka_river', name: 'Sitka River Mouth', x: 135, z: 240, bearCapacity: 3, runStrength: 0.6 },
      { id: 'kruzof_creek', name: 'Kruzof Creek', x: 310, z: 155, bearCapacity: 2, runStrength: 0.4 },
    ];
  }

  /** Check if salmon run is active */
  isSalmonRunActive(month) {
    return [7, 8, 9].includes(month);
  }

  /** Get salmon run strength at a location */
  getRunStrength(locationId, month) {
    const loc = this.salmonRunLocations.find(l => l.id === locationId);
    if (!loc) return 0;
    if (!this.isSalmonRunActive(month)) return 0;

    // Peak in August
    const monthMultiplier = month === 8 ? 1.0 : month === 7 ? 0.7 : 0.5;
    return loc.runStrength * monthMultiplier;
  }

  /** Spawn bears at salmon run locations */
  spawnAtRuns(month) {
    if (!this.isSalmonRunActive(month)) return [];

    const events = [];

    for (const loc of this.salmonRunLocations) {
      const runStrength = this.getRunStrength(loc.id, month);
      if (runStrength < 0.3) continue;

      // Count existing bears
      const existing = [...this.activeBears.values()].filter(b =>
        Math.abs(b.location.x - loc.x) < 50 && Math.abs(b.location.z - loc.z) < 50
      );

      if (existing.length >= loc.bearCapacity) continue;

      // Spawn chance based on run strength
      if (Math.random() > runStrength * 0.3) continue;

      const speciesId = Math.random() < 0.6 ? 'brown_bear' : 'black_bear';
      const bear = new Bear(speciesId, {
        x: loc.x + (Math.random() - 0.5) * 60,
        z: loc.z + (Math.random() - 0.5) * 60,
      });

      this.activeBears.set(bear.id, bear);
      events.push({ type: 'bear_spawned', bear, location: loc });
      this.emit('spawned', { bear, location: loc });
    }

    return events;
  }

  /** Tick the system */
  tick(dt, playerLocation, month, playerContext = {}) {
    const events = [];

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 30_000;
      events.push(...this.spawnAtRuns(month));
    }

    // Tick bears
    for (const [id, bear] of this.activeBears) {
      // Bear catches salmon
      const salmonCatch = bear.catchSalmon();
      if (salmonCatch) {
        events.push({ type: 'bear_catches_salmon', ...salmonCatch });
        this.emit('bear_catch', salmonCatch);
      }

      // Check player proximity (only at river biomes)
      if (playerLocation && playerContext.biome === 'freshwater_river') {
        const zone = bear.getToleranceZone(playerLocation);

        if (zone === 'alert') {
          events.push({
            type: 'bear_alert',
            bearId: bear.id,
            speciesId: bear.speciesId,
            distance: bear.distanceTo(playerLocation),
            message: `A ${bear.speciesId === 'brown_bear' ? 'brown' : 'black'} bear has noticed you. It's watching. Stay calm. Don't run.`,
          });
        }

        if (zone === 'warning') {
          events.push({
            type: 'bear_warning',
            bearId: bear.id,
            speciesId: bear.speciesId,
            distance: bear.distanceTo(playerLocation),
            message: `The bear woofs — a sharp, explosive sound. Jaw popping. You're too close. Back away slowly. NOW.`,
          });
        }

        if (bear.shouldCharge(playerLocation, playerContext)) {
          const chargeEvent = bear.charge(playerLocation);
          events.push({ type: 'bear_charge', ...chargeEvent });
          this.emit('charge', chargeEvent);
        }

        // Bear finishes charging
        if (bear.state === 'charging' && Date.now() - bear.lastCharge > 5000) {
          bear.state = 'retreating';
          setTimeout(() => {
            bear.state = 'idle';
            this.emit('bear_calm', { bearId: bear.id });
          }, 15_000);
        }
      }

      // Despawn bears that aren't at run locations in off-season
      if (!this.isSalmonRunActive(month)) {
        bear.active = false;
      }
    }

    // Clean inactive bears
    for (const [id, bear] of this.activeBears) {
      if (!bear.active) this.activeBears.delete(id);
    }

    return events;
  }

  /** Get bears near player */
  getNearbyBears(playerLocation, radius = 100) {
    return [...this.activeBears.values()].filter(b => b.distanceTo(playerLocation) < radius);
  }

  /** Use bear spray during a charge */
  useBearSpray(bearId, hasSpray) {
    const bear = this.activeBears.get(bearId);
    if (!bear || bear.state !== 'charging') return null;

    if (!hasSpray) {
      return {
        success: false,
        outcome: 'no_spray',
        message: 'You reach for your bear spray and remember — you don\'t have any. This is going to hurt.',
      };
    }

    if (Math.random() < BEAR_SAFETY.bear_spray.effectiveness) {
      bear.state = 'retreating';
      bear.aggression = Math.max(0, bear.aggression - 0.2);
      return {
        success: true,
        outcome: 'spray_worked',
        message: 'You deploy the bear spray in a wide arc. The bear hits the cloud at full speed, rears up, and BOLTS. It crashes through the brush, rubbing its face, and is gone. Your hands are shaking but you\'re alive.',
        sprayUsed: true,
      };
    }

    return {
      success: false,
      outcome: 'spray_failed',
      message: 'The wind. THE WIND. You sprayed into it and got it in your own face. The bear is still coming.',
      sprayUsed: true,
      selfDamage: 10,
    };
  }

  /** Get safety assessment */
  getSafetyReport(playerLocation, month, playerContext) {
    const nearbyBears = this.getNearbyBears(playerLocation);
    const closestBear = nearbyBears.sort((a, b) => a.distanceTo(playerLocation) - b.distanceTo(playerLocation))[0];

    const runActive = this.isSalmonRunActive(month);
    const riskLevel = runActive
      ? closestBear
        ? closestBear.getToleranceZone(playerLocation) === 'safe' ? 'moderate' : 'high'
        : 'low'
      : 'none';

    return {
      riskLevel,
      bearCount: nearbyBears.length,
      closestBear: closestBear ? {
        species: closestBear.species.name,
        distance: Math.round(closestBear.distanceTo(playerLocation)),
        zone: closestBear.getToleranceZone(playerLocation),
        rank: closestBear.rank,
        state: closestBear.state,
      } : null,
      salmonRun: runActive,
      hasBearSpray: playerContext.hasBearSpray ?? false,
      tips: riskLevel === 'high'
        ? ['Back away slowly. DO NOT RUN.', 'Make yourself look big.', 'Deploy bear spray if it charges.']
        : runActive
          ? ['Make noise while hiking — don\'t surprise bears.', 'Carry bear spray.', 'Watch for bear sign: tracks, scat, fresh diggings.']
          : [],
    };
  }
}

export default BearSystem;
