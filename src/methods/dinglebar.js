// CraftMind Fishing — Lingcod Dinglebar Jigging
// THE most exciting bottom fishing. Heavy jig on pinnacles. Lingcod are AGGRESSIVE.
// Violent, fast, dangerous. This is why people come to Alaska.

import { FishingMethod } from '../fishing-methods.js';

export class DinglebarOperation extends FishingMethod {
  constructor(config = {}) {
    super({
      id: 'dinglebar',
      name: 'Lingcod Dinglebar Jigging',
      icon: '🔥',
      description: 'Drop a heavy jig to the bottom of a rocky pinnacle and JIG. Lingcod hit like a truck on the fall. Double headers are real. Line breaks are real.',
      unlockLevel: 9,
      gearRequired: ['jig_rod', 'heavy_jig', 'wire_leader'],
      targetSpecies: ['lingcod', 'rockfish', 'yelloweye'],
      difficulty: 5,
      risk: 2,
      yield: 2.5,
      tags: ['active', 'solo', 'boat', 'rhythmic'],
      flavor: 'You feel the bottom at 180 feet. One sweep up. The jig flutters down — and something hits it so hard the rod almost tears from your hands. LINGCOD. Twenty-five pounds of pure aggression headed for the rocks.',
    });
    this.boat = config.boat ?? 'FV Bottom Dweller';
    this.captain = config.captain ?? 'Nova';
    this.gear = config.gear ?? { jig_weight: '24oz', line: '80lb braid', leader: 'wire' };
  }

  weatherModifier(weather) {
    if (weather.isThundering) return 0.3;
    if (weather.currentWeather === 'storm') return 0.2;
    if (weather.currentWeather === 'rain') return 0.9;
    if (weather.currentWeather === 'clear') return 1.1;
    return 1.0;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      phase: 'positioning', // positioning → drifting → dropping → jigging → hooked → fighting → boat_side → done
      captain: this.captain,
      boat: this.boat,
      driftPosition: 0,      // 0-100, progress across pinnacle
      driftSpeed: 0.3 + Math.random() * 0.4,
      depth: 100 + Math.floor(Math.random() * 150),  // 100-250ft
      onBottom: false,
      jigCount: 0,
      rhythmScore: 0,        // 0-100
      hookedFish: null,
      secondaryFish: null,    // lingcod biting the hooked fish!
      lineStrength: parseInt(this.gear.line) ?? 80,
      depthFound: false,
      driftTimer: 0,
      maxDriftTime: 60000,   // 1 min before need to reposition
      totalCatch: [],
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    switch (state.phase) {
      case 'positioning': {
        events.push({
          type: 'approach_pinnacle',
          message: `${state.captain}: "Coming up on the pinnacle. ${state.depth}ft of water. Get ready."`,
          depth: state.depth,
        });
        state.phase = 'drifting';
        state.driftTimer = 0;
        break;
      }

      case 'drifting': {
        state.driftTimer += dt;
        state.driftPosition += state.driftSpeed * dt * 0.001;

        if (ctx.dropJig && !state.onBottom) {
          state.phase = 'dropping';
          events.push({ type: 'jig_dropped', message: 'Free-spooling to bottom...' });
        }

        // Time pressure
        if (state.driftTimer > state.maxDriftTime * 0.8) {
          events.push({ type: 'drift_warning', message: '⚠️ Running out of drift window! Need to reposition soon!' });
        }

        if (state.driftTimer > state.maxDriftTime) {
          state.phase = 'positioning';
          events.push({ type: 'reposition', message: 'Off the pinnacle. Repositioning for another drift.' });
          state.driftPosition = 0;
          state.onBottom = false;
        }
        break;
      }

      case 'dropping': {
        // Let jig sink to bottom
        state.depthFound = ctx.foundBottom ?? false;
        if (state.depthFound || Math.random() < 0.1) {
          state.onBottom = true;
          state.phase = 'jigging';
          events.push({ type: 'on_bottom', message: 'BOTTOM. Now JIG.' });
        }
        break;
      }

      case 'jigging': {
        // Player jigs — rhythm matters
        if (ctx.jigInput) {
          state.jigCount++;
          const timing = ctx.jigTiming ?? 0;
          const target = 400; // ideal ms between jigs
          const diff = Math.abs(timing - target);

          if (diff < 100) {
            state.rhythmScore = Math.min(100, state.rhythmScore + 12);
            events.push({ type: 'good_jig', rhythmScore: state.rhythmScore });
          } else {
            state.rhythmScore = Math.max(0, state.rhythmScore - 8);
          }
        }

        // Lingcod hit on the fall — high rhythm score = better bite chance
        const biteChance = state.rhythmScore * 0.008;
        if (Math.random() < biteChance) {
          const roll = Math.random();
          if (roll < 0.5) {
            // Lingcod!
            const weight = 10 + Math.random() * 35;
            state.hookedFish = { species: 'lingcod', weight, emoji: '🔥', name: `Lingcod (${Math.round(weight)}lb)` };
            state.phase = 'hooked';
            events.push({ type: 'slam', fish: state.hookedFish.name, message: `💥 SLAM! ${state.hookedFish.name} on! Set HARD!`, urgent: true });
          } else {
            // Rockfish
            const weight = 2 + Math.random() * 6;
            state.hookedFish = { species: 'rockfish', weight, emoji: '🐟', name: `Rockfish (${Math.round(weight)}lb)` };
            state.phase = 'hooked';
            events.push({ type: 'bite', fish: state.hookedFish.name, message: `Tap tap — ${state.hookedFish.name}` });
          }
        }

        // Must stay on bottom
        if (!state.onBottom && Math.random() < 0.05) {
          events.push({ type: 'off_bottom', message: 'Lost bottom! Let out more line!' });
        }
        break;
      }

      case 'hooked': {
        if (ctx.setHook) {
          state.phase = 'fighting';
          state.hookedFish.stamina = 60 + state.hookedFish.weight;
          events.push({ type: 'hook_set', message: `HOOK SET! ${state.hookedFish.name} is screaming for the bottom!` });
        }
        break;
      }

      case 'fighting': {
        const fish = state.hookedFish;
        const reelAction = ctx.reelAction ?? 'hold';

        // Lingcod behavior: runs for rocks
        if (fish.species === 'lingcod') {
          if (Math.random() < 0.15) {
            events.push({ type: 'rock_run', message: `💥 ${fish.name} heads for the rocks! REEL!` });
            fish.stamina -= 5;
          }
        }

        // THE LINGCOD PROBLEM: other lingcod bite the hooked fish
        if (fish.species === 'lingcod' && !state.secondaryFish && Math.random() < 0.08) {
          state.secondaryFish = { species: 'lingcod', weight: 5 + Math.random() * 15 };
          events.push({
            type: 'double_header',
            message: `🔥 ANOTHER lingcod is biting the one on your line! DOUBLE HEADER!`,
            urgent: true,
          });
        }

        // Lingcod eats your rockfish
        if (fish.species === 'rockfish' && !state.secondaryFish && Math.random() < 0.15) {
          state.secondaryFish = { species: 'lingcod', weight: fish.weight + 5 + Math.random() * 10 };
          events.push({
            type: 'lingcod_attack',
            message: `🔥 A lingcod just ate your rockfish! It's on the line now!`,
            fish: state.secondaryFish,
          });
          state.hookedFish = { ...state.secondaryFish, name: `Lingcod (${Math.round(state.secondaryFish.weight)}lb)`, emoji: '🔥' };
          state.secondaryFish = null;
        }

        // Fight progress
        switch (reelAction) {
          case 'reel': fish.stamina -= 3 + (ctx.skillLevel ?? 5) * 0.3; break;
          case 'hold': fish.stamina -= 1; break;
          case 'release': fish.stamina -= 0.5; break; // let them tire
        }
        fish.stamina -= dt * 0.005;

        events.push({ type: 'fight_update', stamina: Math.max(0, fish.stamina), weight: fish.weight });

        // Rock break-off
        if (Math.random() < 0.02 && fish.species === 'lingcod') {
          state.phase = 'done';
          events.push({ type: 'broken_off', message: `💔 ${fish.name} broke off in the rocks! LINE SNAPPED!` });
          break;
        }

        if (fish.stamina <= 0) {
          state.phase = 'boat_side';
          events.push({ type: 'fish_surfaced', message: `📍 ${fish.name} is at the boat! Gaff or net!` });
        }
        break;
      }

      case 'boat_side': {
        if (ctx.gaff || ctx.net) {
          catches.push({
            id: state.hookedFish.species,
            name: state.hookedFish.species === 'lingcod' ? 'Lingcod' : 'Rockfish',
            emoji: state.hookedFish.emoji,
            weight: state.hookedFish.weight,
          });
          state.totalCatch.push(state.hookedFish);

          // Lingcod berserk at surface
          if (state.hookedFish.species === 'lingcod' && Math.random() < 0.2) {
            events.push({ type: 'berserk', message: 'The lingcod goes CRAZY at the surface!' });
          }

          events.push({
            type: 'landed',
            fish: state.hookedFish.name,
            message: `✅ ${state.hookedFish.name} is in the boat! ${state.totalCatch.length} fish so far.`,
          });

          state.hookedFish = null;
          state.onBottom = false;
          state.phase = 'drifting';
          state.rhythmScore = 0;
          state.jigCount = 0;
        }
        break;
      }
    }

    return { catches, events, state };
  }
}
