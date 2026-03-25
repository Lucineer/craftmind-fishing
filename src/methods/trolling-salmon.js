// CraftMind Fishing — Salmon Trolling
// The classic Sitka sport fishing method. Downriggers and herring behind a boat.
// Peaceful trolling with bursts of adrenaline when a rod goes down.

import { FishingMethod } from '../fishing-methods.js';

export const TROLL_SPREAD = {
  downrigger_1: { name: 'Downrigger #1', type: 'downrigger', depth: 40, gear: 'herring + flasher', species: 'king_salmon' },
  downrigger_2: { name: 'Downrigger #2', type: 'downrigger', depth: 80, gear: 'herring + flasher', species: 'king_salmon' },
  diver_1:      { name: 'Diver #1',      type: 'diver',      depth: 20, gear: 'hoochie + diver',  species: 'coho_salmon' },
  diver_2:      { name: 'Diver #2',      type: 'diver',      depth: 60, gear: 'spoon + diver',     species: 'coho_salmon' },
  flat_line:    { name: 'Flat Line',      type: 'flat',        depth: 5,  gear: 'cut-plug herring', species: 'pink_salmon' },
};

export const TROLL_SPECIES = {
  king_salmon:  { name: 'King Salmon',  emoji: '👑', weight: [15, 50],  speed: '2-3 knots', depth: '40-100ft', fightStyle: 'deep_powerful' },
  coho_salmon:  { name: 'Coho Salmon',  emoji: '🐟', weight: [6, 20],   speed: '3-4 knots', depth: '20-60ft',  fightStyle: 'acrobatic' },
  pink_salmon:  { name: 'Pink Salmon',  emoji: '🐟', weight: [3, 8],    speed: '3-4 knots', depth: 'surface',   fightStyle: 'easy' },
  chum_salmon:  { name: 'Chum Salmon',  emoji: '🐟', weight: [8, 15],   speed: '2-3 knots', depth: '30-60ft',  fightStyle: 'stubborn' },
};

export class TrollingOperation extends FishingMethod {
  constructor(config = {}) {
    super({
      id: 'salmon_trolling',
      name: 'Salmon Trolling',
      icon: '🚤',
      description: 'Set a spread of lines at different depths and troll herring through Southeast Alaska waters. Kings hit deep and hard. Coho go airborne.',
      unlockLevel: 5,
      gearRequired: ['boat', 'trolling_rod', 'downrigger'],
      targetSpecies: ['king_salmon', 'coho_salmon', 'pink_salmon', 'chum_salmon'],
      difficulty: 3,
      risk: 1,
      yield: 2.0,
      tags: ['active', 'solo', 'boat'],
      flavor: 'The rods sit in their holders. The boat hums at 2.5 knots. You\'re watching the scenery — mountains, eagles, the occasional whale — when the downrigger rod BURIES itself in the holder. FISH ON.',
    });
    this.boat = config.boat ?? 'FV Silver Streak';
    this.captain = config.captain ?? 'Cody';
    this.spreadCount = config.spread ?? 4;
    this.gear = config.gear ?? { downriggers: 2, divers: 2, bait: 'cut-plug herring' };
  }

  weatherModifier(weather) {
    if (weather.isThundering) return 0.4;
    if (weather.currentWeather === 'storm') return 0.3;
    if (weather.currentWeather === 'rain') return 1.1; // rain pushes fish shallow
    if (weather.currentWeather === 'cloudy') return 1.2; // overcast = active
    if (weather.currentWeather === 'clear') return 1.0;
    return 1.0;
  }

  setup(world, position) {
    const spreadKeys = Object.keys(TROLL_SPREAD).slice(0, this.spreadCount);
    const lines = spreadKeys.map(key => ({
      ...TROLL_SPREAD[key],
      id: key,
      active: true,
      hasFish: false,
      fish: null,
      baitFresh: true,
    }));

    return {
      ...super.setup(world, position),
      phase: 'rigging', // rigging → trolling → fish_on → clearing → playing → landed → rerig
      captain: this.captain,
      boat: this.boat,
      speed: 2.5,           // knots
      distanceTraveled: 0,
      lines,
      activeLine: null,
      linesCleared: false,
      totalCatch: [],
      rodsDown: 0,          // total strikes
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    switch (state.phase) {
      case 'rigging': {
        state.phase = 'trolling';
        events.push({
          type: 'spread_set',
          message: `Spread set! ${state.lines.length} lines in the water. Trolling at ${state.speed} knots. Watching the rods...`,
          lines: state.lines.map(l => `${l.name}: ${l.depth}ft (${l.gear})`),
        });
        break;
      }

      case 'trolling': {
        state.speed = ctx.speed ?? state.speed;
        state.distanceTraveled += state.speed * dt * 0.001;

        // Fish strikes on active lines
        for (const line of state.lines) {
          if (!line.active || line.hasFish) continue;

          // Speed affects which species bite
          const speciesKey = line.species;
          const speciesInfo = TROLL_SPECIES[speciesKey];
          if (!speciesInfo) continue;

          // Ideal speed match
          const [minSpd, maxSpd] = speciesInfo.speed.split('-').map(Number);
          const speedMod = state.speed >= minSpd && state.speed <= maxSpd ? 1.5 : 0.5;

          // Bait freshness matters
          const baitMod = line.baitFresh ? 1.0 : 0.4;

          const strikeChance = 0.001 * speedMod * baitMod;
          if (Math.random() < strikeChance) {
            const [minW, maxW] = speciesInfo.weight;
            const weight = minW + Math.random() * (maxW - minW);
            line.hasFish = true;
            line.fish = {
              species: speciesKey,
              name: speciesInfo.name,
              emoji: speciesInfo.emoji,
              weight,
              fightStyle: speciesInfo.fightStyle,
            };
            state.activeLine = line.id;
            state.rodsDown++;

            events.push({
              type: 'fish_on',
              line: line.name,
              fish: `${speciesInfo.name} (${Math.round(weight)}lb)`,
              message: `🎣 ${line.name} goes DOWN! ${speciesInfo.name} on! CLEAR THE OTHER LINES!`,
              urgent: true,
            });

            state.phase = 'fish_on';
            break; // only one fish at a time
          }
        }

        // Bait degrades over time
        if (Math.random() < 0.0005) {
          const staleLine = state.lines.find(l => l.active && l.baitFresh);
          if (staleLine) {
            staleLine.baitFresh = false;
            events.push({ type: 'bait_stale', line: staleLine.name, message: `${staleLine.name}: bait is getting stale. Should rerig.` });
          }
        }

        // Ambient events
        if (Math.random() < 0.003) {
          const sights = ['eagle overhead', 'whale spout in the distance', 'seal watching from a kelp bed', 'mountains reflecting in calm water'];
          events.push({ type: 'sighting', message: `🔍 ${sights[Math.floor(Math.random() * sights.length)]}` });
        }
        break;
      }

      case 'fish_on': {
        // Player must clear other lines
        if (!state.linesCleared) {
          const clearedCount = state.lines.filter(l => l.id !== state.activeLine && !l.active).length;
          const toClear = state.lines.filter(l => l.id !== state.activeLine && l.active).length;

          if (ctx.clearLines) {
            for (const l of state.lines) {
              if (l.id !== state.activeLine) l.active = false;
            }
            state.linesCleared = true;
            state.phase = 'playing';
            const fish = state.lines.find(l => l.id === state.activeLine)?.fish;
            events.push({ type: 'lines_cleared', message: `Lines cleared! Fighting the ${fish?.name ?? 'fish'}!` });
          } else if (toClear > 0) {
            events.push({ type: 'tangle_warning', message: `⚠️ ${toClear} other lines still in! Clear them or risk a tangle!` });
          }
        }
        break;
      }

      case 'playing': {
        const line = state.lines.find(l => l.id === state.activeLine);
        if (!line || !line.fish) { state.phase = 'trolling'; break; }

        const fish = line.fish;
        const action = ctx.reelAction ?? 'hold';

        // Fight behavior varies by species
        let staminaDrain = 0;
        switch (fish.fightStyle) {
          case 'deep_powerful': // King
            if (Math.random() < 0.1) events.push({ type: 'deep_dive', message: `${fish.name} sounds deep! Don't let it go under the boat!` });
            staminaDrain = action === 'reel' ? 4 : 1;
            break;
          case 'acrobatic': // Coho
            if (Math.random() < 0.15) events.push({ type: 'jump', message: `🐟 ${fish.name} goes AIRBORNE! Spectacular!` });
            staminaDrain = action === 'reel' ? 3 : 1;
            break;
          case 'easy': // Pink
            staminaDrain = action === 'reel' ? 6 : 1;
            break;
          case 'stubborn': // Chum
            staminaDrain = action === 'reel' ? 2 : 0.5;
            break;
        }

        if (!fish.stamina) fish.stamina = 50 + fish.weight;
        fish.stamina -= staminaDrain * (dt * 0.01);
        fish.stamina -= dt * 0.002;

        events.push({ type: 'fight', stamina: Math.max(0, Math.round(fish.stamina)), fish: fish.name });

        if (fish.stamina <= 0) {
          state.phase = 'landed';
          catches.push({ id: fish.species, name: fish.name, emoji: fish.emoji, weight: fish.weight });
          state.totalCatch.push(fish);
          events.push({ type: 'landed', fish: `${fish.name} (${Math.round(fish.weight)}lb)`, message: `✅ ${fish.name} in the boat! Beautiful fish.` });
        }

        // Line break risk
        if (fish.fightStyle === 'deep_powerful' && Math.random() < 0.003) {
          state.phase = 'trolling';
          line.hasFish = false;
          line.fish = null;
          events.push({ type: 'line_break', message: `💔 Line snapped! ${fish.name} got away...` });
        }
        break;
      }

      case 'landed': {
        // Rerig the line
        const line = state.lines.find(l => l.id === state.activeLine);
        if (line) {
          line.hasFish = false;
          line.fish = null;
          line.baitFresh = true;
          line.active = true;
        }
        // Reactivate all lines
        for (const l of state.lines) l.active = true;
        state.activeLine = null;
        state.linesCleared = false;
        state.phase = 'trolling';
        events.push({ type: 'rerigged', message: 'Line rerigged with fresh bait. Back to trolling.' });
        break;
      }
    }

    return { catches, events, state };
  }
}
