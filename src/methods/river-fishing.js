// CraftMind Fishing — River & Lake Fishing (Sitka Area)
// Freshwater methods for Southeast Alaska rivers and lakes.
// Fly fishing, spin casting, drift fishing. Salmon runs and bear danger.

import { FishingMethod } from '../fishing-methods.js';

export const RIVER_LOCATIONS = {
  indian_river: {
    name: 'Indian River',
    type: 'river',
    species: ['dolly_varden', 'cutthroat_trout', 'pink_salmon', 'coho_salmon'],
    description: 'Runs through Sitka. Easy access, Dolly Varden and cutthroat year-round. Pink salmon run in summer.',
    salmonRun: { months: [7, 8], species: 'pink_salmon', peak: 'August' },
  },
  blue_lake: {
    name: 'Blue Lake',
    type: 'lake',
    species: ['rainbow_trout', 'kokanee', 'cutthroat_trout'],
    description: 'Reservoir above Sitka. Stocked trout and kokanee (landlocked sockeye). Road accessible.',
    salmonRun: null,
  },
  deer_lake: {
    name: 'Deer Lake',
    type: 'lake',
    species: ['king_salmon', 'dolly_varden'],
    description: 'Above waterfall, helicopter-stocked with king salmon fry. They grow HUGE. Hike-in or helicopter only.',
    salmonRun: null,
    access: 'hike_heli',
  },
  hidden_lake: {
    name: 'Hidden Lake',
    type: 'lake',
    species: ['rainbow_trout', 'dolly_varden'],
    description: 'Wilderness lake, hike-in only. Trophy trout. No roads, no people, pure Alaska.',
    salmonRun: null,
    access: 'hike',
  },
};

export const RIVER_METHODS = {
  fly_fishing: {
    name: 'Fly Fishing',
    difficulty: 4,
    technique: 'Cast fly, drift, mend line, set hook on strike',
    tags: ['active', 'solo', 'skill'],
  },
  spin_casting: {
    name: 'Spin Casting',
    difficulty: 2,
    technique: 'Small lures, cast and retrieve',
    tags: ['active', 'solo'],
  },
  drift_fishing: {
    name: 'Drift Fishing',
    difficulty: 2,
    technique: 'Float bait down river, let it drift naturally',
    tags: ['passive', 'solo'],
  },
  plunking: {
    name: 'Plunking',
    difficulty: 1,
    technique: 'Anchor, cast out, and wait',
    tags: ['passive', 'solo'],
  },
};

export const FRESHWATER_SPECIES = {
  dolly_varden:     { name: 'Dolly Varden',     emoji: '🐟', weight: [1, 8],    fightStyle: 'scrappy' },
  cutthroat_trout:  { name: 'Cutthroat Trout',  emoji: '🐟', weight: [0.5, 4],  fightStyle: 'quick' },
  rainbow_trout:    { name: 'Rainbow Trout',    emoji: '🐟', weight: [1, 6],    fightStyle: 'acrobatic' },
  kokanee:          { name: 'Kokanee',          emoji: '🐟', weight: [0.5, 2],  fightStyle: 'easy' },
  pink_salmon:      { name: 'Pink Salmon',      emoji: '🐟', weight: [3, 7],    fightStyle: 'easy' },
  coho_salmon:      { name: 'Coho Salmon',      emoji: '🐟', weight: [6, 15],   fightStyle: 'acrobatic' },
  king_salmon:      { name: 'King Salmon',      emoji: '👑', weight: [15, 40],  fightStyle: 'powerful' },
};

export class RiverOperation extends FishingMethod {
  constructor(config = {}) {
    const method = config.method ?? 'fly_fishing';
    const methodInfo = RIVER_METHODS[method];
    const locationInfo = RIVER_LOCATIONS[config.location ?? 'indian_river'];

    super({
      id: `river_${config.location ?? 'indian_river'}_${method}`,
      name: `${methodInfo.name} — ${locationInfo.name}`,
      icon: method === 'fly_fishing' ? '🪰' : '🎣',
      description: `${methodInfo.technique} at ${locationInfo.name}. ${locationInfo.description}`,
      unlockLevel: method === 'fly_fishing' ? 6 : 2,
      gearRequired: method === 'fly_fishing' ? ['fly_rod', 'flies'] : ['spinning_rod', 'lures'],
      targetSpecies: locationInfo.species,
      difficulty: methodInfo.difficulty,
      risk: 1,
      yield: 1.2,
      tags: ['active', 'solo', ...methodInfo.tags],
      flavor: locationInfo.name === 'Hidden Lake'
        ? 'You hike two hours through muskeg and devil\'s club to reach a lake that maybe twenty people visit a year. The water is glass. A trophy rainbow rises to your fly. This is why you came to Alaska.'
        : locationInfo.name === 'Deer Lake'
        ? 'The helicopter sets you down by the lake. King salmon fry were dumped here years ago, and they\'ve been growing in isolation ever since. Some of these fish are LEGENDARY.'
        : `The ${locationInfo.name} ${locationInfo.type === 'river' ? 'runs clear over gravel bars' : 'lies still beneath the mountains'}. Perfect Alaska freshwater fishing.`,
    });

    this.location = config.location ?? 'indian_river';
    this.locationInfo = locationInfo;
    this.method = method;
    this.methodInfo = methodInfo;
  }

  weatherModifier(weather) {
    if (weather.isThundering) return 0.4;
    if (weather.currentWeather === 'rain') return 1.2; // rain = good for river fishing
    if (weather.currentWeather === 'clear') return 1.0;
    return 1.0;
  }

  setup(world, position) {
    const hasSalmonRun = this.locationInfo.salmonRun
      && this.locationInfo.salmonRun.months.includes(new Date().getMonth() + 1);

    return {
      ...super.setup(world, position),
      phase: 'approaching',
      location: this.location,
      locationInfo: this.locationInfo,
      method: this.method,
      methodInfo: this.methodInfo,
      hasSalmonRun,
      salmonRunActive: false,
      salmonRunTimer: 0,
      bearNearby: false,
      bearDistance: 0,
      castPosition: 0,
      currentSpeed: 0.2 + Math.random() * 0.5,
      totalCatch: [],
      approachProgress: 0,
      hookWindow: 0,
      hookedFish: null,
      fishStamina: 0,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    // Salmon run events
    if (state.hasSalmonRun && !state.salmonRunActive && Math.random() < 0.005) {
      state.salmonRunActive = true;
      state.salmonRunTimer = 30000; // 30 second event
      events.push({
        type: 'salmon_run',
        message: '🌊 SALMON RUN! Hundreds of fish pushing upriver! The water is alive with them!',
        urgent: true,
      });
      // Bears attracted to run
      if (Math.random() < 0.6) {
        state.bearNearby = true;
        state.bearDistance = 50 + Math.floor(Math.random() * 100);
        events.push({ type: 'bear_sighted', distance: state.bearDistance, message: `🐻 Bear spotted at the falls! ${state.bearDistance}ft away. Be careful.` });
      }
    }

    if (state.salmonRunActive) {
      state.salmonRunTimer -= dt;
      if (state.salmonRunTimer <= 0) {
        state.salmonRunActive = false;
        events.push({ type: 'run_passing', message: 'The run is thinning out. Still some fish moving through.' });
      }
    }

    // Bear movement
    if (state.bearNearby) {
      if (Math.random() < 0.01) {
        state.bearDistance = Math.max(10, state.bearDistance - 5 + Math.floor(Math.random() * 15));
        if (state.bearDistance < 30) {
          events.push({ type: 'bear_close', message: `🐻 The bear is ${state.bearDistance}ft away. It's fishing at the falls.` });
        }
        if (state.bearDistance < 15) {
          events.push({ type: 'bear_danger', message: '🐻 TOO CLOSE! The bear notices you! Back away slowly!', urgent: true });
        }
      }
    }

    switch (state.phase) {
      case 'approaching': {
        events.push({
          type: 'arrival',
          message: `Arrived at ${state.locationInfo.name}. ${state.locationInfo.description}`,
        });
        state.phase = 'fishing';
        break;
      }

      case 'fishing': {
        const method = state.method;

        if (method === 'fly_fishing') {
          // Fly fishing: cast, drift, mend, set hook
          if (ctx.cast) {
            state.phase = 'drifting';
            state.castPosition = 0;
            events.push({ type: 'cast', message: 'Fly lands gently on the water. Start the drift.' });
          }
        } else if (method === 'spin_casting') {
          if (ctx.cast) {
            // Spin: retrieve action matters
            const retrieve = ctx.retrieve ?? 'steady';
            if (Math.random() < 0.03) {
              const speciesList = state.locationInfo.species;
              const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
              const info = FRESHWATER_SPECIES[sp];
              if (info) {
                state.hookedFish = { species: sp, ...info, weight: info.weight[0] + Math.random() * (info.weight[1] - info.weight[0]) };
                state.fishStamina = 30 + state.hookedFish.weight * 2;
                state.phase = 'fighting';
                events.push({ type: 'bite', fish: `${info.name} (${Math.round(state.hookedFish.weight)}lb)`, message: `🎣 ${info.name} on!` });
              }
            }
          }
        } else if (method === 'drift_fishing' || method === 'plunking') {
          // Passive: wait for bite
          if (Math.random() < 0.008) {
            const speciesList = state.locationInfo.species;
            const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
            const info = FRESHWATER_SPECIES[sp];
            if (info) {
              state.hookedFish = { species: sp, ...info, weight: info.weight[0] + Math.random() * (info.weight[1] - info.weight[0]) };
              state.fishStamina = 30 + state.hookedFish.weight * 2;
              state.hookWindow = 2000; // 2 seconds to hook
              events.push({ type: 'bite', fish: info.name, urgent: true, message: `🎣 Your ${method === 'drift_fishing' ? 'float' : 'rod tip'} goes down! SET THE HOOK!` });
              state.phase = 'bite';
            }
          }
        }

        // Salmon run bonus
        if (state.salmonRunActive && Math.random() < 0.02) {
          const runSpecies = state.locationInfo.salmonRun?.species;
          const info = FRESHWATER_SPECIES[runSpecies];
          if (info) {
            state.hookedFish = { species: runSpecies, ...info, weight: info.weight[0] + Math.random() * (info.weight[1] - info.weight[0]) };
            state.fishStamina = 30 + state.hookedFish.weight * 2;
            state.phase = 'fighting';
            events.push({ type: 'salmon_strike', fish: info.name, message: `🌊 Run fish! ${info.name} on!` });
          }
        }
        break;
      }

      case 'drifting': {
        // Fly drift
        state.castPosition += state.currentSpeed * dt * 0.001;
        const mendChance = ctx.mend ? 0.5 : 0.1;

        if (Math.random() < 0.04) {
          const speciesList = state.locationInfo.species;
          const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
          const info = FRESHWATER_SPECIES[sp];
          if (info) {
            state.hookWindow = 1500; // 1.5 seconds for fly takes
            events.push({ type: 'rise', fish: info.name, message: `🐟 A ${info.name} rises to your fly! STRIKE NOW!`, urgent: true });
            state.hookedFish = { species: sp, ...info, weight: info.weight[0] + Math.random() * (info.weight[1] - info.weight[0]) };
            state.phase = 'bite';
          }
        }

        // Drift ends
        if (state.castPosition > 1) {
          state.phase = 'fishing';
          events.push({ type: 'drift_end', message: 'Fly swung across the current. Recast.' });
        }
        break;
      }

      case 'bite': {
        state.hookWindow -= dt;
        if (state.hookWindow <= 0) {
          state.phase = 'fishing';
          state.hookedFish = null;
          events.push({ type: 'missed', message: 'Too slow. The fish spit the hook.' });
        } else if (ctx.setHook) {
          state.phase = 'fighting';
          events.push({ type: 'hooked', fish: state.hookedFish.name, message: `✅ HOOKED! ${state.hookedFish.name} is on!` });
        }
        break;
      }

      case 'fighting': {
        const action = ctx.reelAction ?? 'hold';
        state.fishStamina -= (action === 'reel' ? 3 : 0.5) * dt * 0.01;
        state.fishStamina -= dt * 0.003;

        // Fight style events
        if (Math.random() < 0.05) {
          const style = state.hookedFish?.fightStyle;
          if (style === 'acrobatic') events.push({ type: 'jump', message: `${state.hookedFish.name} leaps! 🐟` });
          else if (style === 'powerful') events.push({ type: 'run', message: `${state.hookedFish.name} makes a run!` });
          else if (style === 'scrappy') events.push({ type: 'shake', message: `${state.hookedFish.name} shakes its head!` });
        }

        events.push({ type: 'fight', stamina: Math.max(0, Math.round(state.fishStamina)) });

        if (state.fishStamina <= 0) {
          catches.push({
            id: state.hookedFish.species,
            name: state.hookedFish.name,
            emoji: state.hookedFish.emoji,
            weight: state.hookedFish.weight,
          });
          state.totalCatch.push(state.hookedFish);
          events.push({ type: 'landed', fish: `${state.hookedFish.name} (${Math.round(state.hookedFish.weight)}lb)`, message: `✅ Beautiful ${state.hookedFish.name}! ${state.totalCatch.length} fish so far.` });
          state.hookedFish = null;
          state.phase = 'fishing';
        }
        break;
      }
    }

    return { catches, events, state };
  }
}
