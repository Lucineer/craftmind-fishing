// CraftMind Fishing — Crab Pot Fishing (Dungeness & King)
// Dungeness in winter, king crab in deep water. Set, soak, pull, sort.

import { FishingMethod } from '../fishing-methods.js';

export const CRAB_TYPES = {
  dungeness: {
    name: 'Dungeness Crab',
    potLimit: 50,
    soakOptimal: 86400000,   // 24 hours
    soakMin: 43200000,
    depth: { min: 50, max: 120 },
    bottom: 'sandy',
    sizeMin: 6.5,  // inches
    keepMale: true,
    emoji: '🦀',
    value: 8,       // per pound
  },
  king: {
    name: 'King Crab',
    potLimit: 25,
    soakOptimal: 72000000,   // 20 hours
    soakMin: 64800000,
    depth: { min: 200, max: 600 },
    bottom: 'rocky',
    sizeMin: 7.0,
    keepMale: true,
    emoji: '🦀',
    value: 25,
  },
};

export class PotOperation extends FishingMethod {
  constructor(config = {}) {
    const potType = config.pots?.type ?? 'dungeness';
    super({
      id: `pot_${potType}`,
      name: `${potType === 'king' ? 'King' : 'Dungeness'} Crab Pot Fishing`,
      icon: '🦀',
      description: potType === 'king'
        ? 'Drop pots in deep rocky water for king crab. Expensive gear, big rewards, strict regulations.'
        : 'Winter Dungeness crabbing. Shallow sandy bottom, herring bait, and the satisfaction of a full pot.',
      unlockLevel: potType === 'king' ? 12 : 4,
      gearRequired: ['crab_pot', 'bait', 'pot_puller'],
      targetSpecies: [potType === 'king' ? 'king_crab' : 'dungeness_crab'],
      difficulty: potType === 'king' ? 3 : 1,
      risk: potType === 'king' ? 2 : 1,
      yield: potType === 'king' ? 3.0 : 1.5,
      tags: ['passive', 'team', 'boat'],
      flavor: potType === 'king'
        ? 'The pot puller screams as 600 feet of line comes up. The pot breaks the surface and — LORD — it\'s full of red. King crab, legal males, beautiful.'
        : 'Pull a pot. Count the keepers. Throw back the females, throw back the shorts, rebait. Repeat until your hands freeze.',
    });
    this.boat = config.boat ?? 'FV Crabby';
    this.captain = config.captain ?? 'Iris';
    this.potConfig = { ...config.pots, type: potType };
    this.crabType = CRAB_TYPES[potType];
  }

  weatherModifier(weather) {
    if (weather.isThundering) return 0.3;
    if (weather.currentWeather === 'storm') return 0.4;
    return 1.0; // underwater — mostly weather independent
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      phase: 'baiting', // baiting → setting → soaking → pulling → sorting → resetting
      captain: this.captain,
      boat: this.boat,
      potType: this.potConfig.type,
      potCount: Math.min(this.potConfig.count ?? 50, this.crabType.potLimit),
      pots: [],
      currentPot: 0,
      soakStart: null,
      soakElapsed: 0,
      baitQuality: this.potConfig.baitQuality ?? 'fresh',
      keepers: [],
      throwbacks: [],
      bycatch: [],
      femalesReleased: 0,
      shortsReleased: 0,
      totalPounds: 0,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    switch (state.phase) {
      case 'baiting': {
        if (ctx.doneBaiting || state.pots.length >= state.potCount) {
          state.phase = 'setting';
          events.push({ type: 'baiting_done', message: `${state.potCount} pots baited. Setting string.` });
          break;
        }
        // Auto-bait pots
        const pot = {
          id: state.pots.length,
          baitType: this.potConfig.bait ?? 'herring carcass',
          baitQuality: state.baitQuality,
          position: { depth: this.crabType.depth.min + Math.random() * (this.crabType.depth.max - this.crabType.depth.min) },
          contents: [],
          checked: false,
        };
        state.pots.push(pot);
        if (state.pots.length % 10 === 0) {
          events.push({ type: 'bait_progress', count: state.pots.length, total: state.potCount });
        }
        break;
      }

      case 'setting': {
        if (ctx.doneSetting || state.pots.length > 0 && !state.soakStart) {
          state.soakStart = Date.now();
          state.phase = 'soaking';
          const hours = Math.round(this.crabType.soakOptimal / 3600000);
          events.push({ type: 'pots_set', message: `All pots set. Soaking for ~${hours} hours.` });
        }
        break;
      }

      case 'soaking': {
        state.soakElapsed += dt;
        const progress = state.soakElapsed / this.crabType.soakOptimal;
        const baitMod = state.baitQuality === 'fresh' ? 1.0 : state.baitQuality === 'old' ? 0.5 : 0.3;

        // Fill pots
        for (const pot of state.pots) {
          if (!pot.checked && Math.random() < 0.005 * baitMod * progress) {
            const roll = Math.random();
            if (roll < 0.35) {
              // Legal male
              const size = this.crabType.sizeMin + 0.5 + Math.random() * 3;
              const weight = 1.5 + Math.random() * 4;
              pot.contents.push({ type: 'keeper', sex: 'male', size, weight });
            } else if (roll < 0.55) {
              // Female (shaker) — must release
              pot.contents.push({ type: 'female', sex: 'female', hasEggs: Math.random() < 0.6, size: this.crabType.sizeMin + Math.random() * 2, weight: 1 + Math.random() * 3 });
            } else if (roll < 0.70) {
              // Undersized
              pot.contents.push({ type: 'short', sex: 'male', size: this.crabType.sizeMin - Math.random() * 2, weight: 0.5 + Math.random() * 1.5 });
            } else if (roll < 0.80) {
              // Bycatch
              const bycatchTypes = ['octopus', 'starfish', 'snail', 'small_fish'];
              pot.contents.push({ type: 'bycatch', species: bycatchTypes[Math.floor(Math.random() * bycatchTypes.length)] });
            } else if (state.baitQuality === 'old' && roll < 0.90) {
              // Hermit crabs and worms in old bait
              pot.contents.push({ type: 'bycatch', species: 'hermit_crab' });
            }
          }
        }

        if (ctx.startPulling || progress >= 1) {
          state.phase = 'pulling';
          state.currentPot = 0;
          events.push({ type: 'pull_start', message: 'Running the string. Pot puller is grinding!' });
        }
        break;
      }

      case 'pulling': {
        const pot = state.pots[state.currentPot];
        if (!pot) {
          state.phase = 'sorting';
          break;
        }

        pot.checked = true;
        const keepers = pot.contents.filter(c => c.type === 'keeper');
        const females = pot.contents.filter(c => c.type === 'female');
        const shorts = pot.contents.filter(c => c.type === 'short');
        const bycatch = pot.contents.filter(c => c.type === 'bycatch');

        for (const k of keepers) {
          catches.push({
            id: state.potType === 'king' ? 'king_crab' : 'dungeness_crab',
            name: this.crabType.name,
            emoji: this.crabType.emoji,
            weight: k.weight,
          });
          state.totalPounds += k.weight;
          state.keepers.push(k);
        }
        state.femalesReleased += females.length;
        state.shortsReleased += shorts.length;
        state.bycatch.push(...bycatch);

        events.push({
          type: 'pot_result',
          pot: state.currentPot,
          keepers: keepers.length,
          females: females.length,
          shorts: shorts.length,
          bycatch: bycatch.length,
          message: `Pot #${state.currentPot}: ${keepers.length} keepers, ${females.length} females released, ${shorts.length} shorts thrown back.${bycatch.length > 0 ? ` ${bycatch.length} bycatch.` : ''}`,
        });

        state.currentPot++;
        break;
      }

      case 'sorting': {
        state.phase = 'done';
        events.push({
          type: 'string_complete',
          keepers: state.keepers.length,
          pounds: Math.round(state.totalPounds),
          femalesReleased: state.femalesReleased,
          shortsReleased: state.shortsReleased,
          bycatch: state.bycatch.length,
          value: Math.round(state.totalPounds * this.crabType.value),
          message: `String complete! ${state.keepers.length} keepers (${Math.round(state.totalPounds)}lb), worth ~$${Math.round(state.totalPounds * this.crabType.value)}. ${state.femalesReleased} females and ${state.shortsReleased} shorts released. ${state.bycatch.length} bycatch.`,
        });
        break;
      }
    }

    return { catches, events, state };
  }
}
