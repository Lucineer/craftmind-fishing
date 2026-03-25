// CraftMind Fishing — Dive Fisheries
// Sea cucumbers (easy) and geoducks (hard). Quiet, methodical, underwater.

import { FishingMethod } from '../fishing-methods.js';

export const DIVE_TARGETS = {
  sea_cucumber: {
    name: 'Sea Cucumber',
    emoji: '🥒',
    difficulty: 1,
    depth: { min: 10, max: 30 },
    technique: 'raking',
    value: 5,       // per pound
    description: 'Walk along bottom, rake them up. Slow and steady money.',
  },
  geoduck: {
    name: 'Geoduck',
    emoji: '🐚',
    difficulty: 5,
    depth: { min: 3, max: 15 },  // shallow — tidal flats
    technique: 'digging',
    value: 20,     // per clam
    sizeMin: 3,    // inches across siphon
    description: 'Find the siphon hole. Liquefy the sand. Reach in BEFORE it retracts. Good luck.',
    noSCUBA: true, // regulation — breath hold only
  },
};

export class DiveOperation extends FishingMethod {
  constructor(config = {}) {
    const target = config.target ?? 'sea_cucumber';
    const targetInfo = DIVE_TARGETS[target];

    super({
      id: `dive_${target}`,
      name: target === 'geoduck' ? 'Geoduck Diving' : 'Sea Cucumber Diving',
      icon: '🤿',
      description: targetInfo.description,
      unlockLevel: target === 'geoduck' ? 10 : 3,
      gearRequired: target === 'geoduck'
        ? ['dry_suit', 'water_wand', 'catch_bag']
        : ['wetsuit', 'rake', 'catch_bag'],
      targetSpecies: [target === 'geoduck' ? 'geoduck' : 'sea_cucumber'],
      difficulty: targetInfo.difficulty,
      risk: target === 'geoduck' ? 3 : 2,
      yield: target === 'geoduck' ? 1.5 : 2.0,
      tags: ['active', 'solo', 'dangerous', 'diving'],
      flavor: target === 'geoduck'
        ? 'You find the siphon hole — two tiny tubes in the mud. The water wand hisses. Sand turns to soup. Your arm goes in up to the shoulder, fingers searching, and then you feel it — the neck. GRAB IT NOW. It\'s retracting. PULL!'
        : 'The bottom is quiet. Your bubbles rise lazily. Sea cucumbers everywhere, fat and slow. You rake them into your bag one by one. It\'s almost meditative.',
    });
    this.diver = config.diver ?? 'Nova';
    this.buddy = config.buddy ?? 'Rex';
    this.target = target;
    this.targetInfo = targetInfo;
    this.gear = config.gear ?? {};
    this.noSCUBA = targetInfo.noSCUBA ?? false;
  }

  weatherModifier(weather) {
    if (weather.isThundering) return 0.2;
    if (weather.currentWeather === 'storm') return 0.1;
    if (weather.currentWeather === 'clear') return 1.2; // visibility matters
    if (weather.currentWeather === 'rain') return 0.7; // runoff = murky
    return 1.0;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      phase: 'descending',
      diver: this.diver,
      buddy: this.buddy,
      target: this.target,
      oxygen: this.noSCUBA ? 45 : 300, // seconds (breath hold) or 5 min
      maxOxygen: this.noSCUBA ? 45 : 300,
      depth: 0,
      targetDepth: this.targetInfo.depth.min + Math.floor(Math.random() * (this.targetInfo.depth.max - this.targetInfo.depth.min)),
      temperature: 42 + Math.random() * 8, // °F — Alaska cold
      catchBag: [],
      totalWeight: 0,
      totalValue: 0,
      buddyPresent: true,
      approachProgress: 0,
      currentTarget: null,
      diggingProgress: 0,
      visibility: 15 + Math.floor(Math.random() * 20), // feet
      currentStrength: 0.5 + Math.random() * 1.5,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];
    const dtSec = dt / 1000;

    // Oxygen consumption
    if (this.noSCUBA) {
      // Breath hold — holding breath while working
      if (state.phase === 'working') {
        state.oxygen -= dtSec * 1.5; // working = faster breath consumption
      } else {
        state.oxygen -= dtSec * 0.8;
      }
    } else {
      state.oxygen -= dtSec * 0.8;
    }

    // Current
    if (Math.random() < 0.01 * state.currentStrength) {
      events.push({
        type: 'current',
        strength: state.currentStrength.toFixed(1),
        message: `🌊 Current pushing! Hold your position.`,
      });
    }

    // Temperature warning
    if (Math.random() < 0.005 && state.temperature < 45) {
      events.push({ type: 'cold', message: `🥶 Water temp is ${Math.round(state.temperature)}°F. Your hands are going numb.` });
    }

    switch (state.phase) {
      case 'descending': {
        state.depth += dtSec * 2;
        if (state.depth >= state.targetDepth) {
          state.depth = state.targetDepth;
          state.phase = 'searching';
          events.push({
            type: 'on_bottom',
            depth: state.depth,
            message: `On the bottom at ${state.depth}ft. Visibility: ${state.visibility}ft. ${this.noSCUBA ? 'Remember — no SCUBA for geoducks. Breath hold only.' : ''}`,
          });
        }
        break;
      }

      case 'searching': {
        // Find a target
        const findChance = this.target === 'sea_cucumber' ? 0.05 : 0.02;
        if (Math.random() < findChance) {
          state.currentTarget = {
            species: this.target,
            distance: 3 + Math.random() * 10,
          };
          state.phase = 'approaching';
          events.push({ type: 'target_found', message: `Siphon show spotted! ${Math.round(state.currentTarget.distance)}ft away.` });
        }

        // Buddy check
        if (Math.random() < 0.01) {
          events.push({ type: 'buddy_check', message: `${state.buddy} gives you the OK signal. 👌` });
        }
        break;
      }

      case 'approaching': {
        state.approachProgress += dtSec * 0.5;
        if (state.approachProgress >= 1) {
          state.phase = 'working';
          state.diggingProgress = 0;
          events.push({ type: 'at_target', message: this.target === 'geoduck'
            ? 'At the siphon hole. Get the water wand ready!'
            : 'At the cucumber. Rake it up.'
          });
        }
        break;
      }

      case 'working': {
        if (this.target === 'geoduck') {
          // Geoduck: dig with water wand, then grab
          state.diggingProgress += dtSec * (ctx.digging ? 0.4 : 0.05);

          if (state.diggingProgress < 0.5) {
            // Digging phase — liquefying sand
            if (Math.random() < 0.1) {
              events.push({ type: 'digging', message: 'Sand liquefying around the siphon...' });
            }
          } else if (state.diggingProgress < 0.8) {
            // Grab window!
            if (ctx.grab && Math.random() < 0.6) {
              // Success!
              const size = this.targetInfo.sizeMin + Math.random() * 3;
              if (size >= this.targetInfo.sizeMin) {
                const weight = 1.5 + size * 0.3;
                catches.push({ id: 'geoduck', name: 'Geoduck', emoji: '🐚', weight });
                state.catchBag.push(weight);
                state.totalWeight += weight;
                state.totalValue += this.targetInfo.value;
                events.push({
                  type: 'caught',
                  fish: `Geoduck (${size.toFixed(1)}")`,
                  message: `🐚 GOT IT! ${size.toFixed(1)} inches — legal size! Beautiful geoduck!`,
                });
              } else {
                events.push({ type: 'undersized', message: `Undersized (${size.toFixed(1)}"). Let it go — it'll grow.` });
              }
              state.phase = 'searching';
              state.currentTarget = null;
            } else if (Math.random() < 0.15) {
              // Geoduck retracts!
              events.push({ type: 'retracted', message: 'It retracted! Gone. Move on to the next one.' });
              state.phase = 'searching';
              state.currentTarget = null;
            }
          } else {
            // Too slow — retracted
            events.push({ type: 'too_slow', message: 'Too slow — the geoduck pulled itself deep into the sand. Impossible now.' });
            state.phase = 'searching';
            state.currentTarget = null;
          }
        } else {
          // Sea cucumber: just rake it up
          if (ctx.rake && Math.random() < 0.3) {
            const weight = 0.5 + Math.random() * 2;
            catches.push({ id: 'sea_cucumber', name: 'Sea Cucumber', emoji: '🥒', weight });
            state.catchBag.push(weight);
            state.totalWeight += weight;
            state.totalValue += weight * this.targetInfo.value;
            events.push({ type: 'caught', fish: `Sea Cucumber (${weight.toFixed(1)}lb)`, message: `🥒 Raked up a cucumber. Easy.` });
            state.phase = 'searching';
            state.currentTarget = null;
          }
        }
        break;
      }
    }

    // Low oxygen warning
    if (state.oxygen < 10 && state.oxygen > 0) {
      events.push({ type: 'low_air', message: this.noSCUBA ? '🫁 Running out of breath! Surface NOW!' : '⚠️ Low air! Ascend!', urgent: true });
    }

    // Out of oxygen
    if (state.oxygen <= 0) {
      state.phase = 'surfacing';
      events.push({ type: 'out_of_air', message: this.noSCUBA ? '💥 Can\'t hold breath anymore! Emergency surface!' : '💥 Out of air!', urgent: true });
    }

    // Player surfaces
    if (ctx.surface || state.phase === 'surfacing') {
      state.phase = 'done';
      events.push({
        type: 'dive_complete',
        catchCount: state.catchBag.length,
        totalWeight: Math.round(state.totalWeight * 10) / 10,
        totalValue: Math.round(state.totalValue),
        message: `Dive over! ${state.catchBag.length} ${this.target === 'geoduck' ? 'geoducks' : 'cucumbers'}, ${Math.round(state.totalWeight)}lb total, worth ~$${state.totalValue}.`,
      });
    }

    return { catches, events, state };
  }
}
