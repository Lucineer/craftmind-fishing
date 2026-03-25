// CraftMind Fishing — King Crab Fishing (Deadliest Catch style)
// BIG boat, BIG seas, BIG danger. This is the extreme fishery.
// Weather windows, crew fatigue, pot strategy, and the constant tension of "what's in the pot?"

import { FishingMethod } from '../fishing-methods.js';

export const CRAB_SEASONS = {
  red_king: { name: 'Red King Crab', months: [9, 10, 11], peak: 'October', value: 35, sizeMin: 7, potLimit: 100, soakOptimal: 72000000 },
  opilio:   { name: 'Opilio (Snow) Crab', months: [1, 2, 3], peak: 'January', value: 20, sizeMin: 5, potLimit: 100, soakOptimal: 79200000 },
};

export const HAZARD_EVENTS = {
  big_seas:        { severity: 'high',    message: '🌊 25-foot swells! Boat rolling hard! HOLD ON!', damage: 15, probability: 0.01 },
  freezing_spray:  { severity: 'medium',  message: '🧊 Freezing spray! Ice building up on the superstructure!', damage: 5, probability: 0.02 },
  man_overboard:   { severity: 'extreme', message: '🚨 MAN OVERBOARD! Launch the rescue boat!', damage: 0, probability: 0.002 },
  pot_entanglement:{ severity: 'high',    message: '⚠️ Pot line wrapped around the propeller!', damage: 25, probability: 0.005 },
  pot_crush:       { severity: 'high',    message: '💥 Pot swinging on the crane — LOOK OUT!', damage: 20, probability: 0.003 },
  engine_failure:  { severity: 'extreme', message: '🔧 Engine died! We\'re drifting!', damage: 0, probability: 0.002 },
};

export class KingCrabOperation extends FishingMethod {
  constructor(config = {}) {
    const season = config.season ?? 'opilio';
    const seasonInfo = CRAB_SEASONS[season];

    super({
      id: `king_crab_${season}`,
      name: `King Crab Fishing — ${seasonInfo.name}`,
      icon: '🦀',
      description: 'The Deadliest Catch. Steam to the Bering Sea, drop 100 pots, haul in the king. 30-hour shifts, 30-foot seas, and the constant question: what\'s in the pot?',
      unlockLevel: 15,
      gearRequired: ['crab_boat', 'crab_pot', 'pot_puller', 'survival_gear'],
      targetSpecies: [season === 'red_king' ? 'red_king_crab' : 'opilio_crab'],
      difficulty: 5,
      risk: 5,
      yield: season === 'red_king' ? 8.0 : 5.0,
      tags: ['active', 'team', 'boat', 'dangerous'],
      flavor: 'The pot breaks the surface and the crew goes silent. The coiler swings it aboard, the lid opens, and — COUNT. Ten. Fifteen. TWENTY LEGAL males. The captain grins. "Stack \'em and reset. We\'re going back out." The Bering Sea doesn\'t forgive, but today, she paid.',
    });

    this.boat = config.boat ?? 'FV Cornelia Marie';
    this.captain = config.captain ?? 'Cody';
    this.crew = config.crew ?? ['Rex', 'Nova', 'Iris', 'Sam'];
    this.potConfig = config.pots ?? { count: 100, type: season, bait: 'cod carcass' };
    this.season = season;
    this.seasonInfo = seasonInfo;
  }

  weatherModifier(weather) {
    if (weather.isThundering) return 0.1;
    if (weather.currentWeather === 'storm') return 0.2;
    if (weather.currentWeather === 'rain') return 0.7;
    if (weather.currentWeather === 'clear') return 1.0;
    return 0.8;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      phase: 'steaming', // steaming → setting → waiting → hauling → sorting → resetting → heading_home
      captain: this.captain,
      crew: this.crew,
      boat: this.boat,
      season: this.season,
      seasonInfo: this.seasonInfo,
      potCount: Math.min(this.potConfig.count ?? 100, this.seasonInfo.potLimit),
      potsSet: 0,
      soakStart: null,
      soakElapsed: 0,
      currentPot: 0,
      totalPounds: 0,
      totalKeepers: 0,
      femalesReleased: 0,
      shortsReleased: 0,
      crewMorale: 80,
      crewFatigue: 0,       // 0-100, higher = more fatigued
      shiftHours: 0,
      iceAccumulation: 0,   // 0-100, dangerous above 60
      boatDamage: 0,
      quota: this.season === 'red_king' ? 50000 : 30000, // pounds
      otherBoats: Math.floor(Math.random() * 8) + 3,  // competition
      weatherWindow: true,
      pots: [],
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];
    const dtHours = dt / 3600000;

    // Crew fatigue increases over time
    state.crewFatigue = Math.min(100, state.crewFatigue + dtHours * 3);
    state.shiftHours += dtHours;

    // Fatigue effects
    if (state.crewFatigue > 70 && Math.random() < 0.01) {
      const fatiguedCrew = state.crew[Math.floor(Math.random() * state.crew.length)];
      events.push({ type: 'fatigue_mistake', message: `😴 ${fatiguedCrew} is exhausted. Making mistakes.`, crew: fatiguedCrew });
    }

    // Random hazard events
    for (const [key, hazard] of Object.entries(HAZARD_EVENTS)) {
      if (Math.random() < hazard.probability) {
        events.push({ type: `hazard_${key}`, message: hazard.message, severity: hazard.severity, urgent: true });
        if (hazard.damage > 0) {
          state.boatDamage += hazard.damage;
        }
        if (key === 'freezing_spray') {
          state.iceAccumulation = Math.min(100, state.iceAccumulation + 10);
        }
        if (key === 'man_overboard') {
          state.crewMorale -= 20;
          events.push({ type: 'rescue_attempt', message: 'Launching rescue boat! EVERYONE MAN THEIR STATIONS!' });
        }
        if (key === 'engine_failure') {
          state.phase = 'steaming'; // stuck until repaired
          events.push({ type: 'repair_needed', message: 'Engineer working on the engine... ETA unknown.' });
        }
      }
    }

    // Ice accumulation
    if (state.iceAccumulation > 60) {
      events.push({ type: 'ice_danger', message: `🧊 CRITICAL: ${Math.round(state.iceAccumulation)}% ice buildup. Stability compromised!`, urgent: true });
    }

    switch (state.phase) {
      case 'steaming': {
        state.steamProgress = (state.steamProgress ?? 0) + dt * 0.001;
        if (state.steamProgress >= 1) {
          state.phase = 'setting';
          state.weatherWindow = true;
          events.push({
            type: 'arrived',
            message: `${state.captain}: "We're on the grounds. ${state.otherBoats} other boats working. Let's set pots."`,
          });
        } else if (Math.random() < 0.02) {
          events.push({ type: 'steam_update', progress: Math.round(state.steamProgress * 100), message: `Steaming to grounds... ${Math.round(state.steamProgress * 100)}%` });
        }
        break;
      }

      case 'setting': {
        // Drop pots
        const setRate = Math.max(1, 5 - Math.floor(state.crewFatigue / 25));
        state.potsSet += setRate;

        if (state.potsSet % 20 === 0) {
          events.push({ type: 'set_progress', count: state.potsSet, total: state.potCount });
        }

        if (state.potsSet >= state.potCount) {
          state.phase = 'waiting';
          state.soakStart = Date.now();
          const hours = Math.round(this.seasonInfo.soakOptimal / 3600000);
          events.push({ type: 'all_set', message: `All ${state.potCount} pots set. Soaking for ~${hours} hours. Try to get some sleep.` });
        }
        break;
      }

      case 'waiting': {
        state.soakElapsed += dt;

        // Tension and atmosphere
        if (Math.random() < 0.01) {
          const waits = [
            `${state.captain} paces the wheelhouse, checking the charts.`,
            `${state.crew[0]} makes coffee. Nobody talks much.`,
            `The radio crackles — another boat reporting numbers.`,
            `${state.crew[1]} stares at the radar. "Weather coming in?"`,
            `The pot buoys bob in the swell. Waiting...`,
          ];
          events.push({ type: 'atmosphere', message: waits[Math.floor(Math.random() * waits.length)] });
        }

        if (ctx.startHauling || state.soakElapsed >= this.seasonInfo.soakOptimal) {
          state.phase = 'hauling';
          state.currentPot = 0;
          events.push({ type: 'haul_start', message: `${state.captain}: "Start hauling! Let's see what we got!"` });
        }
        break;
      }

      case 'hauling': {
        const haulRate = Math.max(1, 4 - Math.floor(state.crewFatigue / 30));
        for (let i = 0; i < haulRate; i++) {
          if (state.currentPot >= state.potCount) break;
          state.currentPot++;

          // THE COUNT — what's in the pot?
          const roll = Math.random();
          let potCount = 0;

          if (roll < 0.25) {
            // Empty or nearly empty
            events.push({ type: 'pot_empty', pot: state.currentPot, message: `Pot #${state.currentPot}: Empty. ${state.captain}: "Move on."` });
          } else if (roll < 0.50) {
            potCount = 1 + Math.floor(Math.random() * 5);
            events.push({ type: 'pot_light', pot: state.currentPot, count: potCount, message: `Pot #${state.currentPot}: ${potCount} keepers. Light.` });
          } else if (roll < 0.80) {
            potCount = 5 + Math.floor(Math.random() * 10);
            events.push({ type: 'pot_decent', pot: state.currentPot, count: potCount, message: `Pot #${state.currentPot}: ${potCount} keepers! Solid pot!` });
            state.crewMorale = Math.min(100, state.crewMorale + 2);
          } else if (roll < 0.95) {
            potCount = 15 + Math.floor(Math.random() * 20);
            events.push({ type: 'pot_full', pot: state.currentPot, count: potCount, message: `🎉 Pot #${state.currentPot}: ${potCount} KEEPERS! FULL POT! ${state.captain}: "YES! Look at that!"` });
            state.crewMorale = Math.min(100, state.crewMorale + 5);
          } else {
            // BONANZA pot
            potCount = 30 + Math.floor(Math.random() * 20);
            events.push({ type: 'pot_bonanza', pot: state.currentPot, count: potCount, message: `🤯💎 POT #${state.currentPot}: ${potCount} KEEPERS! BONANZA! The crew CHEERS! ${state.captain}: "THIS IS WHY WE DO THIS!"`, urgent: true });
            state.crewMorale = Math.min(100, state.crewMorale + 15);
          }

          // Females and shorts
          const females = Math.floor(potCount * 0.2);
          const shorts = Math.floor(potCount * 0.1);
          const keepers = potCount - females - shorts;
          state.femalesReleased += females;
          state.shortsReleased += shorts;

          if (potCount > 0) {
            const weight = keepers * (3 + Math.random() * 5);
            state.totalPounds += weight;
            state.totalKeepers += keepers;
            catches.push({
              id: state.season === 'red_king' ? 'red_king_crab' : 'opilio_crab',
              name: this.seasonInfo.name,
              emoji: '🦀',
              weight: weight / keepers,
              count: keepers,
            });
          }
        }

        if (state.currentPot >= state.potCount) {
          state.phase = 'resetting';
          events.push({
            type: 'string_done',
            totalPounds: Math.round(state.totalPounds),
            keepers: state.totalKeepers,
            quotaProgress: Math.round((state.totalPounds / state.quota) * 100),
            message: `String hauled! ${state.totalKeepers} keepers, ${Math.round(state.totalPounds)}lb total. ${Math.round((state.totalPounds / state.quota) * 100)}% of quota.`,
          });
        }
        break;
      }

      case 'resetting': {
        if (state.totalPounds >= state.quota) {
          state.phase = 'heading_home';
          events.push({ type: 'quota_met', message: `${state.captain}: "WE HIT QUOTA! Head home! WE'RE DONE!"`, urgent: true });
        } else if (ctx.goAgain) {
          state.potsSet = 0;
          state.currentPot = 0;
          state.phase = 'setting';
          events.push({ type: 'reset', message: 'Pots rebaited. Setting again. Back at it.' });
          state.crewFatigue += 10;
        } else if (ctx.headHome) {
          state.phase = 'heading_home';
          events.push({ type: 'heading_home', message: `${state.captain}: "That's enough. We're heading in."` });
        }
        break;
      }

      case 'heading_home': {
        state.homeProgress = (state.homeProgress ?? 0) + dt * 0.001;
        if (state.homeProgress >= 1) {
          state.phase = 'done';
          const totalValue = Math.round(state.totalPounds * this.seasonInfo.value);
          events.push({
            type: 'home',
            totalPounds: Math.round(state.totalPounds),
            totalValue,
            message: `⚓ HOME. ${Math.round(state.totalPounds)}lb of ${this.seasonInfo.name}. Worth $${totalValue.toLocaleString()}. ${state.shiftHours > 24 ? `${Math.round(state.shiftHours)} hours. Dead tired but rich.` : ''}`,
          });
        }
        break;
      }
    }

    return { catches, events, state };
  }
}
