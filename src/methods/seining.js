// CraftMind Fishing — Purse Seine Salmon Fishing
// THE most iconic Alaska fishery. A crew of 4-5 works a 60-foot seiner.
// Team coordination, timing, and the thrill of the set.

import { FishingMethod } from '../fishing-methods.js';

/** Crew roles on a seiner */
export const SEINE_CREW_ROLES = {
  skipper:    { name: 'Skipper',        desc: 'Drives boat, spots fish, calls the set', critical: true },
  skiff_man:  { name: 'Skiff Man',      desc: 'Drives skiff, holds net end — CRITICAL role', critical: true },
  deck_boss:  { name: 'Deck Boss',      desc: 'Manages deck crew, operates power block', critical: true },
  deckhand:   { name: 'Deckhand',       desc: 'Brails fish, handles net, watches for holes', critical: false },
  cook:       { name: 'Cook/Engineer',  desc: 'Keeps boat running, feeds crew (morale)', critical: false },
};

/** Species by season */
export const SEINE_SEASONS = {
  kings:   { months: [6, 7], name: 'King Salmon', species: 'king_salmon', peak: 'June-July' },
  pinks:   { months: [7, 8], name: 'Pink Salmon', species: 'pink_salmon', peak: 'July-August' },
  silvers: { months: [8, 9], name: 'Silver Salmon', species: 'silver_salmon', peak: 'Aug-Sep' },
  chums:   { months: [7, 8], name: 'Chum Salmon', species: 'chum_salmon', peak: 'July-August' },
  reds:    { months: [6, 7], name: 'Sockeye', species: 'sockeye_salmon', peak: 'June-July' },
};

export class SeineOperation extends FishingMethod {
  constructor(config = {}) {
    super({
      id: 'seining',
      name: 'Purse Seining',
      icon: '🥅',
      description: 'Circle a school of salmon with an enormous net, purse the bottom, and brail thousands of fish aboard. Requires a full crew.',
      unlockLevel: 10,
      gearRequired: ['seine_net', 'power_block', 'skiff'],
      targetSpecies: ['king_salmon', 'pink_salmon', 'silver_salmon', 'chum_salmon', 'sockeye_salmon'],
      difficulty: 4,
      risk: 3,
      yield: 8.0,
      tags: ['active', 'team', 'boat', 'seasonal'],
      flavor: 'The skipper yells "SET!" and the boat turns hard. The net pays out in a massive arc while the skiff holds the other end. Somewhere under all that webbing, ten thousand salmon are about to learn about the purse.',
    });
    this.boat = config.boat ?? 'FV Northwestern';
    this.captain = config.captain ?? 'Cody';
    this.crew = config.crew ?? ['Nova', 'Rex', 'Iris', 'Sam'];
    this.assignedRoles = {};
    this._assignRoles();
  }

  _assignRoles() {
    const roles = ['skiff_man', 'deck_boss', 'deckhand', 'cook'];
    for (let i = 0; i < this.crew.length; i++) {
      this.assignedRoles[this.crew[i]] = roles[i] ?? 'deckhand';
    }
  }

  /** Spotting difficulty based on conditions */
  _spottingDifficulty(ctx = {}) {
    let base = 0.4;
    const weather = ctx.weather ?? {};
    if (weather.currentWeather === 'fog') base += 0.3;
    if (weather.currentWeather === 'rain') base += 0.15;
    if (weather.currentWeather === 'clear') base -= 0.1;
    const skillMod = (ctx.captainSkill ?? 5) * 0.04;
    return Math.max(0.1, Math.min(0.95, base - skillMod));
  }

  weatherModifier(weather) {
    if (weather.currentWeather === 'fog') return 0.3; // can't see schools
    if (weather.currentWeather === 'rain') return 0.6;
    if (weather.isThundering) return 0.1; // too dangerous
    if (weather.currentWeather === 'clear') return 1.2;
    return 1.0;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      phase: 'searching', // searching → setting → pursing → brailing → soak_check → retrieving → done
      captain: this.captain,
      crew: this.crew,
      boat: this.boat,
      schoolSpotted: false,
      schoolSize: 0,        // 0-100 score
      setProgress: 0,       // 0-100%
      purseProgress: 0,
      brailCount: 0,
      totalCatch: 0,
      netHealth: 100,
      fishEscaped: 0,
      skiffReleased: false,
      rivalBoat: false,
      morale: 80,
      seasonCatch: {},      // species → count
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    switch (state.phase) {
      case 'searching': {
        // Captain looks for signs of salmon
        const spotChance = (1 - this._spottingDifficulty(ctx)) * 0.02;
        if (Math.random() < spotChance) {
          // Sign of fish — jumpers, birds, sonar
          const signs = ['jumpers', 'bird_activity', 'sonar_mark', 'color_change'];
          const sign = signs[Math.floor(Math.random() * signs.length)];
          events.push({ type: 'sign', sign, message: `${state.captain}: "I see ${sign.replace('_', ' ')} off the starboard bow!"` });

          // Chance to spot actual school
          if (Math.random() < 0.4) {
            state.schoolSpotted = true;
            state.schoolSize = 20 + Math.floor(Math.random() * 80);
            events.push({
              type: 'school_spotted',
              size: state.schoolSize,
              message: `${state.captain}: "SCHOOL! ${state.schoolSize > 60 ? 'BIG one!' : 'Looks decent.'} Skiff man, get ready!"`,
              urgent: true,
            });

            // Rival boat might try to steal
            if (Math.random() < 0.15) {
              state.rivalBoat = true;
              events.push({ type: 'rival', message: '⚠️ Another seiner is heading for the same school!' });
            }
          }
        }

        // Player triggers the set
        if (ctx.callSet && state.schoolSpotted) {
          state.phase = 'setting';
          events.push({ type: 'set_called', message: `${state.captain}: "SET SET SET! Skiff away!"` });
        }
        break;
      }

      case 'setting': {
        // Net circles the school (takes 10-15 min simulated)
        state.setProgress += dt * 0.008; // ~2 min real time
        const skiffReady = ctx.skiffReady ?? true;

        if (state.setProgress < 30 && !skiffReady) {
          events.push({ type: 'waiting_skiff', message: 'Waiting for skiff to get in position...' });
        }

        if (state.rivalBoat && state.setProgress > 40 && Math.random() < 0.1) {
          events.push({ type: 'rival_close', message: 'The other boat is cutting our circle!' });
        }

        if (state.setProgress >= 100) {
          state.phase = 'pursing';
          events.push({ type: 'set_complete', message: 'Net is set! Start pursing!' });
        }

        // Net snag risk
        if (Math.random() < 0.002) {
          state.netHealth -= 10;
          events.push({ type: 'net_snag', message: '⚠️ Net caught on the bottom! Deck boss, watch it!', netHealth: state.netHealth });
          if (state.netHealth <= 0) {
            state.phase = 'done';
            events.push({ type: 'net_lost', message: '💀 The net is shredded. We lost everything.' });
          }
        }
        break;
      }

      case 'pursing': {
        // Pull the purse line — closes the bottom
        state.purseProgress += dt * 0.012;
        if (Math.random() < 0.03) {
          events.push({ type: 'purse_update', progress: Math.round(state.purseProgress), message: 'Pulling the purse line...' });
        }

        // Fish escaping through holes
        if (state.netHealth < 70 && Math.random() < 0.02) {
          const escaped = Math.floor(state.schoolSize * 0.05);
          state.fishEscaped += escaped;
          events.push({ type: 'hole_out', escaped, message: `🐟 ${escaped} fish found a hole and escaped!` });
        }

        if (state.purseProgress >= 100) {
          state.phase = 'brailing';
          events.push({ type: 'purse_complete', message: 'Purse is closed! Time to brail!' });
        }
        break;
      }

      case 'brailing': {
        // Scoop fish from net
        const brailSpeed = 0.5 + (state.morale / 200); // morale affects speed
        state.brailCount += dt * brailSpeed * 0.01;

        const remainingFish = Math.max(0, state.schoolSize - state.fishEscaped - state.totalCatch);
        const brailBatch = Math.min(remainingFish, 3 + Math.floor(Math.random() * 8));

        if (state.brailCount >= 1 && remainingFish > 0) {
          state.brailCount = 0;
          state.totalCatch += brailBatch;

          // Determine species mix
          const month = new Date().getMonth() + 1;
          const activeSeasons = Object.values(SEINE_SEASONS).filter(s => s.months.includes(month));
          const season = activeSeasons[Math.floor(Math.random() * activeSeasons.length)] ?? SEINE_SEASONS.pinks;

          catches.push({
            id: season.species,
            name: season.name,
            emoji: '🐟',
            weight: 3 + Math.random() * 8,
            count: brailBatch,
          });

          state.seasonCatch[season.species] = (state.seasonCatch[season.species] ?? 0) + brailBatch;
          events.push({ type: 'brail', count: brailBatch, total: state.totalCatch, species: season.name });
        }

        // Morale events
        if (Math.random() < 0.005) {
          state.morale = Math.min(100, state.morale + 10);
          events.push({ type: 'morale_boost', message: `${[...state.crew][Math.floor(Math.random() * state.crew.length)]}: "Great haul, captain!"` });
        }

        if (remainingFish <= 0) {
          state.phase = 'soak_check';
        }
        break;
      }

      case 'soak_check': {
        events.push({ type: 'soak_check', message: 'Checking for escapees and holes...' });
        if (state.netHealth < 50) {
          const holes = 1 + Math.floor(Math.random() * 3);
          events.push({ type: 'holes_found', count: holes, message: `Found ${holes} holes in the net. We'll need to patch those.` });
        }
        state.phase = 'retrieving';
        break;
      }

      case 'retrieving': {
        state.phase = 'done';
        events.push({
          type: 'set_complete',
          totalCatch: state.totalCatch,
          escaped: state.fishEscaped,
          netHealth: state.netHealth,
          catchBreakdown: state.seasonCatch,
          message: `Set complete! ${state.totalCatch} fish aboard. ${state.fishEscaped > 0 ? state.fishEscaped + ' escaped. ' : ''}Net at ${state.netHealth}%.`,
        });
        break;
      }
    }

    return { catches, events, state };
  }

  /** Get crew role assignments */
  getCrewRoles() {
    return {
      [this.captain]: 'skipper',
      ...this.assignedRoles,
    };
  }
}
