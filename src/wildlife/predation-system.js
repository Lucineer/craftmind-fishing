// CraftMind Fishing — Marine Predation System
// Sea lions, seals, sharks, and orcas that STEAL YOUR CATCH.
// This is the core gameplay system: predation events during fishing.

import { EventEmitter } from 'node:events';

// ═══════════════════════════════════════════════════════════════
// PREDATION COUNTERMEASURES
// ═══════════════════════════════════════════════════════════════

export const COUNTERMEASURES = {
  acoustic_deterrent: {
    id: 'acoustic_deterrent',
    name: 'Acoustic Deterrent Device (ADD)',
    description: 'Emits sounds sea lions dislike. Moderate effectiveness.',
    craftTier: 2,
    slot: 'hull',
    effects: {
      seaLionDepredation: -0.4,
      sealTheft: -0.2,
    },
    durability: 100,
    drainPerHour: 5,
  },
  wire_leader: {
    id: 'wire_leader',
    name: 'Wire Leader',
    description: 'Prevents shark bite-offs. Standard gear upgrade for longliners.',
    craftTier: 1,
    slot: 'line',
    effects: {
      sharkBiteoff: -0.6,
      sleeperSharkDamage: -0.3,
    },
    durability: 80,
    drainPerHour: 2,
  },
  hook_shield: {
    id: 'hook_shield',
    name: 'Hook Shield',
    description: 'Covers bait until deep, prevents seal theft. Tier 3 craft.',
    craftTier: 3,
    slot: 'hook',
    effects: {
      sealTheft: -0.7,
      seaLionDepredation: -0.2,
    },
    durability: 60,
    drainPerHour: 3,
  },
  double_hook_rig: {
    id: 'double_hook_rig',
    name: 'Double Hook Rig',
    description: 'If first fish is stolen, second hook still has bait.',
    craftTier: 2,
    slot: 'hook',
    effects: {
      catchRetention: 0.5, // 50% chance second hook catches after theft
    },
    durability: 50,
    drainPerHour: 1,
  },
  faster_haul: {
    id: 'faster_haul',
    name: 'Upgraded Pot Puller',
    description: 'Minimize gear exposure time during haul-back. Less time for sea lions.',
    craftTier: 3,
    slot: 'boat',
    effects: {
      seaLionDepredation: -0.5,
      sealTheft: -0.3,
      haulSpeed: 0.4, // 40% faster
    },
    durability: 120,
    drainPerHour: 8,
  },
  decoy_buoys: {
    id: 'decoy_buoys',
    name: 'Decoy Buoys',
    description: 'Place baited buoys away from gear to distract sea lions.',
    craftTier: 2,
    slot: 'consumable',
    effects: {
      seaLionDepredation: -0.6,
    },
    durability: 1, // Single use per trip
    drainPerHour: 0,
  },
};

// ═══════════════════════════════════════════════════════════════
// PREDATION EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export const PREDATION_TYPES = {
  sea_lion_depredation: {
    id: 'sea_lion_depredation',
    name: 'Sea Lion Depredation',
    description: 'Steller sea lions pull fish off your longline during haul-back.',
    severity: 'high',
    baseProbability: 0.15,   // 15% per haul cycle
    catchLossRange: [0.10, 0.30], // 10-30% of catch
    affectedMethods: ['longline', 'halibut_longlining'],
    affectedSpecies: ['halibut', 'sablefish', 'rockfish', 'pacific_cod'],
    message: (lost, species) => `A Steller sea lion ripped a ${lost}lb ${species} off your longline! They're getting bold.`,
    gearDamage: true,
    adaptive: true,           // Gets worse over time
  },
  seal_hook_stealing: {
    id: 'seal_hook_stealing',
    name: 'Seal Hook Stealing',
    description: 'Harbor seals pluck fish off hooks and steal bait.',
    severity: 'low',
    baseProbability: 0.12,
    catchLossRange: [0.05, 0.15],
    affectedMethods: ['longline', 'trolling', 'jigging', 'bait_casting'],
    affectedSpecies: ['salmon', 'rockfish', 'greenling'],
    message: (lost, species) => `A harbor seal just stole a ${lost}lb ${species} right off your hook. The little thief.`,
    gearDamage: false,
    adaptive: false,
  },
  shark_biteoff: {
    id: 'shark_biteoff',
    description: 'Salmon sharks and dogfish bite through line or take fish.',
    severity: 'medium',
    baseProbability: 0.08,
    catchLossRange: [0.05, 0.20],
    affectedMethods: ['longline', 'trolling', 'halibut_longlining'],
    affectedSpecies: ['halibut', 'salmon', 'sablefish'],
    message: (lost, species) => `Something hit hard and cut the line. Shark bite-off — you lost a ${lost}lb ${species}.`,
    gearDamage: true,
    adaptive: false,
  },
  sleeper_shark_head: {
    id: 'sleeper_shark_head',
    name: 'Sleeper Shark — Just a Head',
    description: 'Sleeper sharks eat halibut on the longline. You pull up heads only.',
    severity: 'medium',
    baseProbability: 0.06,
    catchLossRange: [0.10, 0.25],
    affectedMethods: ['longline', 'halibut_longlining'],
    affectedSpecies: ['halibut'],
    message: (lost) => `You pull up the hook and... it's just a head. A sleeper shark ate the rest of your ${lost}lb halibut on the line.`,
    gearDamage: false,
    adaptive: false,
  },
  orca_fish_scare: {
    id: 'orca_fish_scare',
    name: 'Orca Fish Scare',
    description: 'Transient orca pod arrives — all fish in the area flee.',
    severity: 'high',
    baseProbability: 0.03,
    catchLossRange: [0.50, 1.00], // ALL fishing goes dead
    affectedMethods: ['all'],
    affectedSpecies: ['all'],
    duration: [15_000, 30_000],    // 15-30 minutes
    message: () => 'Transient orcas are hunting through the area. Every fish in the sound has gone deep. Fishing is dead for now.',
    gearDamage: false,
    adaptive: false,
    scareEffect: true,
  },
  whale_net_tangle: {
    id: 'whale_net_tangle',
    name: 'Whale Net Interaction',
    description: 'Humpback tangled in seine net — must release immediately.',
    severity: 'emergency',
    baseProbability: 0.01,
    catchLossRange: [0, 0],        // No catch loss, but operation delay
    affectedMethods: ['seine', 'purse_seine'],
    affectedSpecies: [],
    duration: [30_000, 60_000],
    message: () => '⚠️ EMERGENCY: A humpback whale is tangled in your net! You MUST stop hauling and release it immediately. It\'s the law.',
    gearDamage: true,
    adaptive: false,
    requiresResponse: true,
  },
  eagle_steal: {
    id: 'eagle_steal',
    name: 'Bald Eagle Steal',
    description: 'A bald eagle swoops and steals fish off your line near the surface.',
    severity: 'low',
    baseProbability: 0.05,
    catchLossRange: [0.03, 0.10],
    affectedMethods: ['trolling', 'bait_casting', 'river_fishing'],
    affectedSpecies: ['salmon', 'dolly_varden', 'cutthroat_trout'],
    message: (lost, species) => `A bald eagle just swooped down and snatched a ${lost}lb ${species} right out of the water! Magnificent bastard.`,
    gearDamage: false,
    adaptive: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// PREDATION SYSTEM
// ═══════════════════════════════════════════════════════════════

export class PredationSystem extends EventEmitter {
  constructor(world) {
    super();
    this.world = world;

    // Tracking for adaptive behavior
    this.seaLionBoldness = 0;       // Increases with each haul at same spot
    this.fishingSpotHistory = new Map(); // locationKey → { haulCount, lastDepredation }
    this.activeEffects = new Map(); // effectId → { type, endsAt, data }

    // Stats
    this.stats = {
      totalFishStolen: 0,
      totalWeightLost: 0,
      totalGearDamage: 0,
      seaLionEncounters: 0,
      sharkBiteoffs: 0,
      orcaScares: 0,
      whaleTangles: 0,
      eagleSteals: 0,
    };
  }

  /** Get active countermeasures from player gear */
  getActiveCountermeasures(playerGear) {
    if (!playerGear) return [];
    return playerGear.filter(g => COUNTERMEASURES[g.id]);
  }

  /** Calculate modified probability accounting for countermeasures */
  _calculateProbability(predationType, context) {
    let prob = predationType.baseProbability;

    // Time of day: dawn/dusk = less marine mammal activity
    const hour = context.hour ?? 12;
    if (hour >= 5 && hour <= 7) prob *= 0.5;   // Dawn
    if (hour >= 20 && hour <= 22) prob *= 0.6;  // Dusk
    if (hour >= 23 || hour <= 3) prob *= 0.3;   // Night

    // Adaptive sea lion behavior
    if (predationType.adaptive) {
      const spotKey = `${Math.round(context.location?.x ?? 0)},${Math.round(context.location?.z ?? 0)}`;
      const history = this.fishingSpotHistory.get(spotKey) ?? { haulCount: 0, lastDepredation: 0 };
      prob += history.haulCount * 0.01; // Each haul at same spot increases risk
      this.seaLionBoldness = Math.min(0.8, history.haulCount * 0.05);
    }

    // Season boost (more mammals in summer)
    const month = context.month ?? 7;
    if ([6, 7, 8].includes(month)) prob *= 1.3;
    if ([11, 12, 1, 2].includes(month)) prob *= 0.5;

    // Countermeasures reduce probability
    const countermeasures = this.getActiveCountermeasures(context.gear);
    for (const cm of countermeasures) {
      const def = COUNTERMEASURES[cm.id];
      if (def.effects[predationType.id] || def.effects[`${predationType.id}`]) {
        prob *= (1 + (def.effects[Object.keys(def.effects).find(k => k.includes(predationType.id.replace(/_/g, '').slice(0, 8)))] ?? 0));
      }
      // Simpler approach: check for matching effect keys
      for (const [effectKey, value] of Object.entries(def.effects)) {
        if (predationType.id.includes(effectKey.replace(/([A-Z])/g, '_$1').toLowerCase()) || effectKey.includes(predationType.id.split('_')[0])) {
          prob += value; // Negative values reduce probability
        }
      }
    }

    return Math.max(0, Math.min(1, prob));
  }

  /** Process a haul cycle — check for all predation events */
  processHaul(context) {
    // context: { method, location, catch: [{species, weight}], gear, hour, month }
    const events = [];
    const catchLosses = [];

    // Track fishing spot
    const spotKey = `${Math.round(context.location?.x ?? 0)},${Math.round(context.location?.z ?? 0)}`;
    const history = this.fishingSpotHistory.get(spotKey) ?? { haulCount: 0, lastDepredation: 0 };
    history.haulCount++;
    this.fishingSpotHistory.set(spotKey, history);

    // Check each predation type
    for (const [key, predType] of Object.entries(PREDATION_TYPES)) {
      // Method filter
      if (predType.affectedMethods[0] !== 'all' &&
          !predType.affectedMethods.some(m => context.method?.toLowerCase().includes(m))) {
        continue;
      }

      // Skip whale tangle for non-seine
      if (key === 'whale_net_tangle' && !context.method?.includes('seine')) continue;

      const prob = this._calculateProbability(predType, context);
      if (Math.random() > prob) continue;

      // Predation event fires!
      const event = this._generatePredationEvent(key, predType, context);
      events.push(event);
      this.emit('steal', event);
      this.emit(event.type, event);

      if (event.catchLoss > 0) catchLosses.push(event);
    }

    return { events, catchLosses };
  }

  /** Generate a specific predation event */
  _generatePredationEvent(key, predType, context) {
    const catchWeight = context.catch?.reduce((sum, f) => sum + (f.weight ?? 0), 0) ?? 0;
    const lossFraction = predType.catchLossRange[0] + Math.random() * (predType.catchLossRange[1] - predType.catchLossRange[0]);
    const lostWeight = Math.round(catchWeight * lossFraction);

    // Pick a victim species
    const lostSpecies = context.catch?.[Math.floor(Math.random() * (context.catch?.length ?? 1))]?.species ?? 'fish';

    const event = {
      id: `pred_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: key,
      name: predType.name,
      severity: predType.severity,
      catchLoss: lostWeight,
      lostSpecies,
      message: predType.message(lostWeight, lostSpecies),
      timestamp: Date.now(),
      location: { ...context.location },
      method: context.method,
      gearDamage: predType.gearDamage ? Math.round(5 + Math.random() * 15) : 0,
    };

    // Duration-based effects (orca scare, whale tangle)
    if (predType.duration) {
      event.effectDuration = predType.duration[0] + Math.random() * (predType.duration[1] - predType.duration[0]);
      event.effectEndsAt = Date.now() + event.effectDuration;
      this.activeEffects.set(event.id, { type: key, endsAt: event.effectEndsAt, data: event });
    }

    // Update stats
    this.stats.totalFishStolen++;
    this.stats.totalWeightLost += lostWeight;
    this.stats.totalGearDamage += event.gearDamage;

    if (key === 'sea_lion_depredation') this.stats.seaLionEncounters++;
    if (key === 'shark_biteoff' || key === 'sleeper_shark_head') this.stats.sharkBiteoffs++;
    if (key === 'orca_fish_scare') this.stats.orcaScares++;
    if (key === 'whale_net_tangle') this.stats.whaleTangles++;
    if (key === 'eagle_steal') this.stats.eagleSteals++;

    return event;
  }

  /** Check if any active effects are blocking fishing */
  isFishingBlocked(location) {
    const now = Date.now();
    for (const [id, effect] of this.activeEffects) {
      if (now < effect.endsAt) {
        if (effect.type === 'orca_fish_scare') {
          return {
            blocked: true,
            reason: 'Transient orcas are hunting nearby. Fish are hiding.',
            remaining: effect.endsAt - now,
          };
        }
        if (effect.type === 'whale_net_tangle') {
          return {
            blocked: true,
            reason: 'You must release the tangled whale before resuming operations.',
            remaining: effect.endsAt - now,
          };
        }
      } else {
        this.activeEffects.delete(id);
      }
    }
    return { blocked: false };
  }

  /** Resolve a whale tangle event based on player response */
  resolveWhaleTangle(eventId, response) {
    // response: 'release' (correct), 'ignore', 'help'
    const effect = this.activeEffects.get(eventId);
    if (!effect || effect.type !== 'whale_net_tangle') return null;

    this.activeEffects.delete(eventId);

    if (response === 'release' || response === 'help') {
      return {
        outcome: 'success',
        karma: response === 'help' ? 25 : 10,
        message: response === 'help'
          ? 'You carefully cut the net and free the whale. It pauses, looking at you with one enormous eye, then dives. Other boats in the area saw it — word spreads about the fisherman who helped a whale.'
          : 'You release the whale as required by law. The net is damaged but you did the right thing.',
        netDamage: 20 + Math.round(Math.random() * 30),
        delay: 60_000 + Math.round(Math.random() * 60_000),
      };
    }

    return {
      outcome: 'violation',
      karma: -50,
      message: '⚠️ You cannot keep fishing with a tangled whale. NMFS has been notified. Heavy fines and license suspension are possible.',
      fine: 5000 + Math.round(Math.random() * 20000),
      reputation: -25,
    };
  }

  /** Tick — clean expired effects */
  tick() {
    const now = Date.now();
    const cleaned = [];
    for (const [id, effect] of this.activeEffects) {
      if (now >= effect.endsAt) {
        this.activeEffects.delete(id);
        cleaned.push(id);
        this.emit('effect_expired', { type: effect.type, id });
      }
    }
    return cleaned;
  }

  /** Get predation risk assessment for a location */
  getRiskReport(context) {
    const risks = {};
    for (const [key, predType] of Object.entries(PREDATION_TYPES)) {
      if (predType.affectedMethods[0] === 'all' ||
          predType.affectedMethods.some(m => context.method?.toLowerCase().includes(m))) {
        risks[key] = {
          name: predType.name,
          probability: Math.round(this._calculateProbability(predType, context) * 100),
          severity: predType.severity,
          catchLossRange: predType.catchLossRange,
        };
      }
    }

    // Active effects
    const activeEffects = [];
    for (const [, effect] of this.activeEffects) {
      activeEffects.push({ type: effect.type, remaining: effect.endsAt - Date.now() });
    }

    return { risks, activeEffects, seaLionBoldness: Math.round(this.seaLionBoldness * 100) };
  }
}

export default PredationSystem;
