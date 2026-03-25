// CraftMind Fishing — Fishing Methods System
// 12 distinct fishing methods, each with its own personality, minigame, and risk/reward profile.

import { FishSpeciesRegistry } from './fish-species.js';

// ─── Base Class ───────────────────────────────────────────────────────

export class FishingMethod {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.icon = config.icon;
    this.unlockLevel = config.unlockLevel ?? 1;
    this.gearRequired = config.gearRequired ?? [];
    this.targetSpecies = config.targetSpecies ?? []; // species IDs or ['*'] for all
    this.difficulty = config.difficulty ?? 1;       // 1-5
    this.risk = config.risk ?? 0;                   // 0-5
    this.yield = config.yield ?? 1;                 // expected catch rate modifier
    this.tags = config.tags ?? [];                  // passive, active, team, dangerous, seasonal, diving, boat
    this.flavor = config.flavor ?? '';              // adventure-magazine flavor text
  }

  /** Place gear in the world. Returns initial state. */
  setup(world, position) {
    return { active: true, position, catches: [], events: [], startedAt: Date.now() };
  }

  /** Called each tick. Returns { catches, events, state } */
  tick(dt, state, ctx = {}) {
    return { catches: [], events: [], state };
  }

  /** Remove gear from world */
  teardown(state) {
    return state;
  }

  /** Get display state for UI */
  getState(state) {
    return { ...state, method: this.name, icon: this.icon };
  }

  /** Check if this method can target a species */
  canTarget(speciesId) {
    return this.targetSpecies.includes('*') || this.targetSpecies.includes(speciesId);
  }

  /** Get a score modifier for weather (1.0 = neutral) */
  weatherModifier(weather) {
    return 1.0;
  }

  toString() {
    const stars = '★'.repeat(this.difficulty) + '☆'.repeat(5 - this.difficulty);
    const risks = '⚠'.repeat(this.risk) + '○'.repeat(5 - this.risk);
    return `${this.icon} ${this.name} [${stars}] Risk: [${risks}]`;
  }
}

// ─── Method 1: Bait Casting (Upgraded Rod Fishing) ────────────────────

export class BaitCastingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'bait_casting',
      name: 'Bait Casting',
      icon: '🎣',
      description: 'The classic. Cast with precision, fight with skill. The foundation of every angler\'s journey.',
      unlockLevel: 1,
      gearRequired: ['fishing_rod', 'bait'],
      targetSpecies: ['*'],
      difficulty: 3,
      risk: 0,
      yield: 1.0,
      tags: ['active', 'solo'],
      flavor: 'Every legend starts with a rod, a worm, and a dream. The cast is your signature — the fight is your story.',
    });
  }

  weatherModifier(weather) {
    if (weather.currentWeather === 'rain' && !weather.isThundering) return 1.2;
    if (weather.isThundering) return 0.7;
    return 1.0;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      phase: 'casting', // casting → waiting → bite → fighting → landed/lost
      castPower: 0.5,
      castAccuracy: 0.7,
      fightTension: 0,     // 0-100, sweet spot 30-70
      fishStamina: 0,
      fishName: null,
      castDistance: 0,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    switch (state.phase) {
      case 'casting': {
        // Cast skill check: power + accuracy determine distance and spot quality
        const skillMod = (ctx.skillLevel ?? 1) * 0.05 + 0.5;
        state.castPower = Math.min(1, Math.max(0.1, (0.3 + Math.random() * 0.7) * skillMod));
        state.castAccuracy = Math.min(1, Math.max(0.1, (0.4 + Math.random() * 0.6) * skillMod));
        state.castDistance = state.castPower * (ctx.rod?.castDistance ?? 20);
        state.phase = 'waiting';
        state.waitTimer = 3000 + Math.random() * 12000; // 3-15s wait
        events.push({ type: 'cast', power: state.castPower, accuracy: state.castAccuracy, distance: Math.round(state.castDistance) });
        break;
      }
      case 'waiting': {
        state.waitTimer -= dt;
        if (state.waitTimer <= 0) {
          // Bite check
          const biteChance = 0.3 + (ctx.baitEffectiveness ?? 0.5) * 0.4;
          if (Math.random() < biteChance) {
            state.phase = 'bite';
            state.biteWindow = 1500; // 1.5s to hook
            events.push({ type: 'bite', urgent: true });
          } else {
            state.phase = 'casting'; // re-cast
            events.push({ type: 'miss', reason: 'no_bite' });
          }
        }
        break;
      }
      case 'bite': {
        state.biteWindow -= dt;
        if (state.biteWindow <= 0) {
          state.phase = 'casting';
          events.push({ type: 'miss', reason: 'too_slow' });
        } else if (ctx.hookAttempt) {
          state.phase = 'fighting';
          state.fishStamina = 50 + Math.random() * 50;
          state.fightTension = 50;
          state.fishName = ctx.species?.name ?? 'a fish';
          events.push({ type: 'hooked', fish: state.fishName });
        }
        break;
      }
      case 'fighting': {
        // Tension minigame: keep tension in 30-70 range
        const playerInput = ctx.reelAction ?? 'hold'; // hold, release, jerk
        const fishAction = Math.random() < 0.3 ? 'run' : Math.random() < 0.5 ? 'dive' : 'rest';

        switch (fishAction) {
          case 'run': state.fightTension += 15 + Math.random() * 10; break;
          case 'dive': state.fightTension += 8; state.fishStamina -= 3; break;
          case 'rest': state.fishStamina -= 2; break;
        }

        switch (playerInput) {
          case 'hold': state.fightTension -= 2; break;
          case 'release': state.fightTension -= 15; break;
          case 'jerk': state.fightTension -= 8; state.fishStamina -= 5; break;
        }

        state.fightTension = Math.max(0, Math.min(100, state.fightTension));
        state.fishStamina -= dt * 0.005; // passive drain

        events.push({ type: 'fight_update', tension: state.fightTension, stamina: state.fishStamina });

        if (state.fightTension > 90) {
          state.phase = 'casting';
          events.push({ type: 'lost', reason: 'line_snapped!', fish: state.fishName });
        } else if (state.fishStamina <= 0) {
          state.phase = 'landed';
          events.push({ type: 'landed', fish: state.fishName });
          if (ctx.species) catches.push(ctx.species);
        }
        break;
      }
    }

    return { catches, events, state };
  }
}

// ─── Method 2: Crab Pots ──────────────────────────────────────────────

export class CrabPotMethod extends FishingMethod {
  constructor() {
    super({
      id: 'crab_pots',
      name: 'Crab Pots',
      icon: '🦀',
      description: 'Place baited traps on the ocean floor. Come back later and pray the drowned didn\'t steal your bait.',
      unlockLevel: 3,
      gearRequired: ['crab_pot', 'bait'],
      targetSpecies: ['crab', 'shrimp', 'lobster_small'],
      difficulty: 1,
      risk: 1,
      yield: 0.6,
      tags: ['passive', 'solo', 'team'],
      flavor: 'Set it and forget it. The ocean does the work while you kick back. Just don\'t cry when a drowned walks off with your dinner.',
    });
  }

  weatherModifier(w) { return 1.0; } // underwater — weather doesn't matter

  setup(world, position) {
    return {
      ...super.setup(world, position),
      pots: [],       // up to 8
      maxPots: 8,
      fillTime: 300000 + Math.random() * 600000, // 5-15 min
      nearCoral: position?.nearCoral ?? false,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];
    const elapsed = Date.now() - state.startedAt;

    // Check pots if returning
    if (ctx.checkPots && state.pots.length > 0) {
      for (let i = 0; i < state.pots.length; i++) {
        const pot = state.pots[i];
        if (!pot.checked) {
          pot.checked = true;
          const roll = Math.random();
          if (roll < 0.15 && pot.nearCoral) {
            // Treasure!
            const treasures = ['📜 Old Map', '💍 Gold Ring', '🧴 Sea Potion', '🐚 Pearl'];
            events.push({ type: 'treasure', pot: i, item: treasures[Math.floor(Math.random() * treasures.length)] });
          } else if (roll < 0.25) {
            events.push({ type: 'pot_robbed', pot: i, thief: 'Drowned' });
          } else if (roll < 0.65) {
            const potCatch = { id: 'crab', name: 'Crab', emoji: '🦀', weight: 0.3 + Math.random() * 1.5 };
            catches.push(potCatch);
            events.push({ type: 'pot_catch', pot: i, message: `Pot #${i}: ${potCatch.emoji} ${potCatch.name} (${potCatch.weight.toFixed(1)}kg)` });
          } else {
            events.push({ type: 'pot_empty', pot: i });
          }
        }
      }
    }

    return { catches, events, state };
  }

  placePot(state, position) {
    if (state.pots.length >= state.maxPots) return false;
    state.pots.push({ position, checked: false, nearCoral: position?.nearCoral ?? false, placedAt: Date.now() });
    return true;
  }
}

// ─── Method 3: Lobster Traps ──────────────────────────────────────────

export class LobsterTrapMethod extends FishingMethod {
  constructor() {
    super({
      id: 'lobster_traps',
      name: 'Lobster Traps',
      icon: '🦞',
      description: 'Deep-sea traps for the finest crustaceans. Requires depth > 30 blocks. Guardians will smash your traps.',
      unlockLevel: 8,
      gearRequired: ['lobster_trap', 'bait'],
      targetSpecies: ['deep_sea_lobster', 'giant_isopod', 'abyssal_crab', 'pearl_oyster'],
      difficulty: 2,
      risk: 3,
      yield: 0.5,
      tags: ['passive', 'team', 'dangerous'],
      flavor: 'The deep holds wonders that the shallow can\'t imagine. It also holds guardians that think your traps are toys.',
    });
  }

  setup(world, position) {
    const depth = position?.depth ?? 0;
    if (depth < 30) {
      return { ...super.setup(world, position), active: false, error: 'depth_too_shallow' };
    }
    return {
      ...super.setup(world, position),
      fillTime: 900000 + Math.random() * 900000, // 15-30 min
      trapTier: position?.trapTier ?? 'iron',    // iron, gold, diamond
      guardianRisk: depth > 45 ? 0.3 : 0.1,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];
    const elapsed = Date.now() - state.startedAt;
    const fillProgress = Math.min(1, elapsed / state.fillTime);

    // Guardian attack check
    if (Math.random() < state.guardianRisk * 0.01) {
      events.push({ type: 'guardian_attack', damage: state.trapTier === 'diamond' ? 'none' : 'damaged' });
      if (state.trapTier !== 'diamond') state.active = false;
    }

    if (ctx.checkTrap && fillProgress >= 0.8) {
      const species = [
        { id: 'deep_sea_lobster', name: 'Deep Sea Lobster', emoji: '🦞', weight: 2 + Math.random() * 4 },
        { id: 'giant_isopod', name: 'Giant Isopod', emoji: '🐛', weight: 1 + Math.random() * 2 },
        { id: 'abyssal_crab', name: 'Abyssal Crab', emoji: '🦀', weight: 1.5 + Math.random() * 3 },
      ];
      const catch_ = species[Math.floor(Math.random() * species.length)];
      if (Math.random() < 0.08) {
        catches.push({ id: 'pearl_oyster', name: 'Pearl Oyster', emoji: '🦪', weight: 0.5 });
        events.push({ type: 'rare_catch', fish: 'Pearl Oyster 🦪' });
      } else {
        catches.push(catch_);
        events.push({ type: 'trap_catch', fish: catch_ });
      }
    }

    return { catches, events, state };
  }
}

// ─── Method 4: Longlining ─────────────────────────────────────────────

export class LongliningMethod extends FishingMethod {
  constructor() {
    super({
      id: 'longlining',
      name: 'Longlining',
      icon: '🪝',
      description: 'Deploy a line with 20-50 hooks across the ocean. Passive but massive. "Oh god it\'s a shark on hook #12."',
      unlockLevel: 10,
      gearRequired: ['longline'],
      targetSpecies: ['*'],
      difficulty: 2,
      risk: 2,
      yield: 3.0,
      tags: ['passive', 'team'],
      flavor: 'Forty-seven hooks, one line, and the terrifying uncertainty of what\'s waiting at the other end. Longlining is patience weaponized.',
    });
  }

  weatherModifier(w) {
    if (w.isThundering) return 0.3; // storms scatter hooks
    if (w.currentWeather === 'clear') return 1.1;
    return 0.8;
  }

  setup(world, position) {
    const hookCount = 20 + Math.floor(Math.random() * 31); // 20-50
    return {
      ...super.setup(world, position),
      hookCount,
      hooks: Array.from({ length: hookCount }, (_, i) => ({
        id: i, hasFish: false, fish: null, baited: true,
      })),
      soakTime: 1800000 + Math.random() * 1800000, // 30-60 min
      anchored: false,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];
    const elapsed = Date.now() - state.startedAt;

    // Deploy phase
    if (!state.anchored && ctx.deployLine) {
      state.anchored = true;
      events.push({ type: 'deployed', hooks: state.hookCount });
    }

    // Fill hooks during soak
    if (state.anchored && elapsed < state.soakTime) {
      for (const hook of state.hooks) {
        if (!hook.hasFish && hook.baited && Math.random() < 0.002) {
          hook.hasFish = true;
          hook.fish = { weight: 0.1 + Math.random() * 5 };
        }
      }
    }

    // Reel in
    if (ctx.reelIn && state.anchored) {
      state.anchored = false;
      let fishCount = 0;
      for (let i = 0; i < state.hooks.length; i++) {
        const hook = state.hooks[i];
        if (hook.hasFish) {
          fishCount++;
          // Shark event — thrashes other hooks loose
          if (Math.random() < 0.05) {
            events.push({ type: 'shark_on_hook', hookId: i, fish: 'Shark 🦈' });
            catches.push({ id: 'shark', name: 'Shark', emoji: '🦈', weight: 10 + Math.random() * 30 });
            // Shark thrashes loose nearby hooks
            const loose = Math.floor(Math.random() * 5) + 1;
            for (let j = Math.max(0, i - loose); j <= Math.min(state.hooks.length - 1, i + loose); j++) {
              if (state.hooks[j].hasFish && j !== i) {
                state.hooks[j].hasFish = false;
                events.push({ type: 'hook_lost', hookId: j, reason: 'shark_thrash' });
              }
            }
          } else {
            catches.push({ id: 'pelagic_fish', name: 'Pelagic Fish', emoji: '🐟', weight: hook.fish.weight });
          }
        }
      }
      events.push({ type: 'reel_in', totalFish: fishCount, totalHooks: state.hookCount });
    }

    return { catches, events, state };
  }
}

// ─── Method 5: Trolling ───────────────────────────────────────────────

export class TrollingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'trolling',
      name: 'Trolling',
      icon: '🚤',
      description: 'Drag lures behind a moving boat. Different speeds attract different species. Explore new waters.',
      unlockLevel: 12,
      gearRequired: ['boat', 'trolling_rod'],
      targetSpecies: ['tuna', 'marlin', 'sailfish', 'dolphin_fish'],
      difficulty: 3,
      risk: 1,
      yield: 1.5,
      tags: ['active', 'team', 'boat'],
      flavor: 'The open ocean doesn\'t care about your plans. Trolling is a conversation with the sea — you propose a speed, and she decides what bites.',
    });
  }

  weatherModifier(w) {
    if (w.currentWeather === 'clear') return 1.3;
    if (w.isThundering) return 0.5;
    return 1.0;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      speed: 0.5,        // 0-1, sweet spot varies by target
      distanceTraveled: 0,
      lines: 3,          // number of lines out
      lineStates: Array.from({ length: 3 }, () => ({ hasFish: false, fish: null })),
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];
    const speed = ctx.speed ?? state.speed;

    state.distanceTraveled += speed * dt * 0.01;

    // Speed affects species attraction
    for (const line of state.lineStates) {
      if (!line.hasFish) {
        // Fast speed = pelagics, slow = bottom fish
        const pelagicChance = speed * 0.003;
        const bottomChance = (1 - speed) * 0.002;
        if (Math.random() < pelagicChance) {
          line.hasFish = true;
          line.fish = { type: 'pelagic', name: 'Tuna', emoji: '🐟', weight: 5 + Math.random() * 20 };
          events.push({ type: 'fish_on', line: state.lineStates.indexOf(line), fish: line.fish.name });
        } else if (Math.random() < bottomChance) {
          line.hasFish = true;
          line.fish = { type: 'bottom', name: 'Cod', emoji: '🐟', weight: 1 + Math.random() * 3 };
        }
      }
    }

    if (ctx.reelLine != null && state.lineStates[ctx.reelLine]?.hasFish) {
      const line = state.lineStates[ctx.reelLine];
      catches.push(line.fish);
      events.push({ type: 'landed', fish: line.fish.name, weight: line.fish.weight.toFixed(1) + 'kg' });
      line.hasFish = false;
      line.fish = null;
    }

    return { catches, events, state };
  }
}

// ─── Method 6: Trawling ───────────────────────────────────────────────

export class TrawlingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'trawling',
      name: 'Trawling',
      icon: '🛥️',
      description: 'Drag a massive net behind the boat. Scoop up EVERYTHING. Destroy the ecosystem. Face the consequences.',
      unlockLevel: 15,
      gearRequired: ['boat', 'trawl_net'],
      targetSpecies: ['*'],
      difficulty: 2,
      risk: 3,
      yield: 10.0,
      tags: ['active', 'team', 'dangerous', 'controversial'],
      flavor: 'They say trawling is fishing. It\'s not. It\'s war. You\'ll haul up more fish than you\'ve ever seen — and more guilt than you can carry.',
    });
  }

  weatherModifier(w) {
    if (w.isThundering) return 0.2; // dangerous in storms
    if (w.currentWeather === 'clear') return 1.0;
    return 0.7;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      netHealth: 100,
      netCapacity: 100,
      netContents: [],       // fish + bycatch + junk
      reputationDamage: 0,
      haulCount: 0,
      deployed: false,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    if (ctx.deploy && !state.deployed) {
      state.deployed = true;
      events.push({ type: 'net_deployed' });
    }

    if (state.deployed && state.netHealth > 0) {
      // Net fills over time
      const fillRate = 0.5 + Math.random() * 1.5;
      if (Math.random() < fillRate * 0.02 && state.netContents.length < state.netCapacity) {
        const roll = Math.random();
        if (roll < 0.6) {
          // Regular fish
          catches.push({ id: 'trawl_fish', name: 'Mixed Fish', emoji: '🐟', weight: 0.2 + Math.random() * 2 });
        } else if (roll < 0.8) {
          // Junk
          state.netContents.push({ type: 'junk', name: 'Seaweed / Old Boot', emoji: '🗑️' });
          events.push({ type: 'bycatch', item: 'Junk' });
        } else if (roll < 0.92) {
          // Endangered bycatch
          events.push({ type: 'endangered_bycatch', species: 'Rare Species' });
          state.reputationDamage += 10;
        } else {
          // Treasure
          catches.push({ id: 'trawl_treasure', name: 'Sunken Treasure', emoji: '💰', weight: 5 });
          events.push({ type: 'treasure', item: 'Sunken Treasure 💰' });
        }
      }

      // Net damage — coral snag
      if (Math.random() < 0.005) {
        state.netHealth -= 20;
        events.push({ type: 'net_snag', remainingHealth: state.netHealth });
      }

      // Reputation drain
      state.reputationDamage += dt * 0.001;
    }

    if (ctx.haul && state.deployed) {
      state.deployed = false;
      state.haulCount = catches.length;
      events.push({
        type: 'haul_complete',
        fishCount: catches.length,
        junkCount: state.netContents.filter(c => c.type === 'junk').length,
        reputation: -Math.round(state.reputationDamage),
      });
    }

    return { catches, events, state };
  }

  /** Trawling ecosystem impact */
  getEcosystemImpact() {
    return {
      populationDamage: 0.15,     // -15% per trawl pass
      habitatDamage: 0.08,
      reputationChange: -5,
      bycatchRate: 0.25,
    };
  }
}

// ─── Method 7: Free Diving ────────────────────────────────────────────

export class FreeDivingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'free_diving',
      name: 'Free Diving',
      icon: '🤿',
      description: 'Dive underwater with nothing but your lungs and courage. The most intimate — and dangerous — way to fish.',
      unlockLevel: 5,
      gearRequired: [],
      targetSpecies: ['coral_beauty', 'tropical_fry', 'shulker_shrimp', 'pearl_clam'],
      difficulty: 4,
      risk: 4,
      yield: 0.8,
      tags: ['active', 'solo', 'dangerous', 'diving', 'exclusive'],
      flavor: 'Three seconds of air left. The legendary pearl oyster glows in the darkness ahead. This is what it means to be alive.',
    });
  }

  weatherModifier(w) {
    if (w.currentWeather === 'clear') return 1.3; // calm, clear = essential
    if (w.isThundering) return 0.3;
    return 0.8;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      oxygen: 100,          // 0-100, depletes over time
      maxOxygen: 100,
      depth: 0,
      maxDepth: 15,
      approaching: null,    // fish being approached
      approachProgress: 0,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    state.oxygen -= dt * 0.03; // ~3.3 sec of air at surface
    state.oxygen -= (state.depth * 0.01 * dt * 0.001); // depth penalty

    // Current pushes diver
    if (Math.random() < 0.02) {
      events.push({ type: 'current_push', direction: ['left', 'right', 'up', 'down'][Math.floor(Math.random() * 4)] });
    }

    // Approach fish
    if (ctx.approach && !state.approaching) {
      state.approaching = { name: 'Coral Fish', emoji: '🐠' };
      state.approachProgress = 0;
    }

    if (state.approaching) {
      const stealth = ctx.stealth ?? 0.5;
      state.approachProgress += stealth * dt * 0.001;

      if (state.approachProgress >= 1.0) {
        catches.push({ id: 'coral_fish', name: 'Coral Fish', emoji: '🐠', weight: 0.5 + Math.random() * 1 });
        events.push({ type: 'spear_catch', fish: state.approaching.name });
        state.approaching = null;
      } else if (ctx.stealth < 0.3) {
        events.push({ type: 'spooked', fish: state.approaching.name });
        state.approaching = null;
      }
    }

    // Drowning check
    if (state.oxygen <= 0) {
      events.push({ type: 'drowning', urgent: true });
      state.active = false;
    }

    // Shark encounter
    if (Math.random() < 0.003 * state.depth) {
      events.push({ type: 'shark_nearby', depth: state.depth });
    }

    return { catches, events, state };
  }
}

// ─── Method 8: SCUBA Diving ───────────────────────────────────────────

export class SCUBADivingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'scuba_diving',
      name: 'SCUBA Diving',
      icon: '🤿',
      description: 'Gear up with an air tank. Explore the deep. Find shipwrecks. Just watch out for gear malfunctions.',
      unlockLevel: 12,
      gearRequired: ['scuba_gear'],
      targetSpecies: ['deep_sea_angler', 'cave_salmon', 'warden_catfish', 'frozen_char'],
      difficulty: 3,
      risk: 3,
      yield: 1.2,
      tags: ['active', 'team', 'dangerous', 'diving'],
      flavor: 'The SCUBA tank hisses in your ear like a whispered promise: five more minutes. Five more minutes of magic.',
    });
  }

  weatherModifier(w) {
    if (w.currentWeather === 'clear') return 1.2;
    if (w.isThundering) return 0.4;
    return 0.9;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      airSupply: 300000,   // 5 min in ms
      maxAir: 300000,
      depth: 0,
      maxDepth: 50,
      nearWreck: position?.nearWreck ?? false,
      buddyPresent: false,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    state.airSupply -= dt;

    // Buddy air sharing
    if (ctx.buddyShare && state.buddyPresent) {
      state.airSupply += dt * 0.3; // buddy shares air, both drain slower
      events.push({ type: 'air_shared' });
    }

    // Gear malfunction
    if (Math.random() < 0.0005) {
      state.airSupply -= 60000; // lose 1 min of air suddenly
      events.push({ type: 'gear_malfunction', severity: 'air_leak', urgent: true });
    }

    // Wreck exploration
    if (state.nearWreck && ctx.exploreWreck) {
      if (Math.random() < 0.15) {
        catches.push({ id: 'wreck_treasure', name: 'Shipwreck Treasure', emoji: '💰', weight: 2 });
        events.push({ type: 'treasure', item: 'Ancient Loot from the wreck!' });
      }
      if (Math.random() < 0.3) {
        catches.push({ id: 'cave_fish', name: 'Cave Fish', emoji: '🐟', weight: 1 + Math.random() * 2 });
      }
    }

    // Regular deep catches
    if (ctx.spearFish && Math.random() < 0.04) {
      const deepFish = [
        { id: 'deep_catch', name: 'Deep Sea Angler', emoji: '🎣', weight: 2 + Math.random() * 3 },
        { id: 'cave_catch', name: 'Cave Salmon', emoji: '🐟', weight: 1 + Math.random() * 2 },
      ];
      catches.push(deepFish[Math.floor(Math.random() * deepFish.length)]);
    }

    if (state.airSupply <= 0) {
      events.push({ type: 'out_of_air', urgent: true });
      state.active = false;
    }

    return { catches, events, state };
  }
}

// ─── Method 9: Jigging ────────────────────────────────────────────────

export class JiggingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'jigging',
      name: 'Jigging',
      icon: '🎣',
      description: 'Not "cast and wait" — actively work the lure. Jerk, pause, jerk, pause. The rhythm is everything.',
      unlockLevel: 7,
      gearRequired: ['jig_rod', 'jig_lure'],
      targetSpecies: ['river_pike', 'prismarine_cod', 'spore_bass', 'redstone_eel'],
      difficulty: 4,
      risk: 0,
      yield: 1.3,
      tags: ['active', 'solo', 'rhythmic'],
      flavor: 'Jig-jig-pause. Jig-jig-pause. The bass doesn\'t know it yet, but it\'s already yours. The rhythm always wins.',
    });
  }

  weatherModifier(w) {
    if (w.currentWeather === 'cloudy') return 1.3; // overcast = fish less cautious
    if (w.currentWeather === 'rain') return 1.1;
    return 1.0;
  }

  // Jig patterns per species
  static PATTERNS = {
    river_pike:     { name: 'Aggressive Jerk',   rhythm: 'jig-jig-pause-jig', window: 300, tolerance: 100 },
    prismarine_cod: { name: 'Slow Sweep',         rhythm: 'slow_sweep-long_pause', window: 500, tolerance: 150 },
    spore_bass:     { name: 'Mycelium Pulse',     rhythm: 'jig-pause-jig-pause', window: 400, tolerance: 120 },
    redstone_eel:   { name: 'Electric Staccato',  rhythm: 'jig-jig-jig-pause', window: 250, tolerance: 80 },
  };

  setup(world, position) {
    return {
      ...super.setup(world, position),
      currentPattern: 'river_pike',
      rhythmScore: 0,       // 0-100, how well player matches rhythm
      comboCount: 0,
      bestCombo: 0,
      phase: 'idle',         // idle → jigging → bite → fight
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    if (state.phase === 'idle' && ctx.startJigging) {
      state.phase = 'jigging';
      events.push({ type: 'jigging_start', pattern: JiggingMethod.PATTERNS[state.currentPattern]?.name ?? 'Unknown' });
    }

    if (state.phase === 'jigging') {
      // Rhythm evaluation
      if (ctx.jigInput) {
        const pattern = JiggingMethod.PATTERNS[state.currentPattern];
        const timing = ctx.jigTiming ?? 0; // ms since last input
        const diff = Math.abs(timing - pattern.window);

        if (diff < pattern.tolerance) {
          state.rhythmScore = Math.min(100, state.rhythmScore + 15);
          state.comboCount++;
          state.bestCombo = Math.max(state.bestCombo, state.comboCount);
          events.push({ type: 'perfect_timing', combo: state.comboCount, rhythmScore: state.rhythmScore });
        } else {
          state.rhythmScore = Math.max(0, state.rhythmScore - 10);
          state.comboCount = 0;
          events.push({ type: 'off_beat', rhythmScore: state.rhythmScore });
        }

        // Fish bites when rhythm is high enough
        const biteChance = state.rhythmScore / 200;
        if (Math.random() < biteChance) {
          state.phase = 'bite';
          events.push({ type: 'slam', fish: 'Pike', rhythmScore: state.rhythmScore });
        }
      }
    }

    if (state.phase === 'bite' && ctx.hookAttempt) {
      catches.push({ id: 'jigged_fish', name: 'Pike', emoji: '🐟', weight: 2 + state.rhythmScore * 0.05 });
      events.push({ type: 'landed', fish: 'Pike', quality: state.rhythmScore > 70 ? 'Trophy!' : 'Good' });
      state.phase = 'idle';
      state.rhythmScore = 0;
    }

    return { catches, events, state };
  }
}

// ─── Method 10: Ice Fishing ───────────────────────────────────────────

export class IceFishingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'ice_fishing',
      name: 'Ice Fishing',
      icon: '🧊',
      description: 'Fish through holes in frozen water. Winter-exclusive. Peaceful, solitary, beautiful — until a fish drags you in.',
      unlockLevel: 5,
      gearRequired: ['ice_auger'],
      targetSpecies: ['frozen_char', 'ice_fish', 'frozen_trout', 'crystal_perch'],
      difficulty: 2,
      risk: 1,
      yield: 1.0,
      tags: ['active', 'solo', 'seasonal'],
      flavor: 'The wind howls. A wolf cries in the distance. Your hole in the ice glows faintly. And then — a tug. Gentle. Patient. Alive.',
    });
  }

  weatherModifier() { return 1.0; } // always cold enough

  setup(world, position) {
    return {
      ...super.setup(world, position),
      holeDepth: 1,
      holeSize: 1,
      fishConcentrated: true,
      warmth: 100,
      ambientSounds: ['howling_wind', 'cracking_ice', 'wolf_howl', 'silence'],
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    state.warmth -= dt * 0.005;

    // Ambient events
    if (Math.random() < 0.01) {
      const sound = state.ambientSounds[Math.floor(Math.random() * state.ambientSounds.length)];
      events.push({ type: 'ambient', sound });
    }

    // Fish bite (concentrated but cautious)
    if (ctx.lineInWater && Math.random() < 0.015) {
      const species = [
        { id: 'frozen_char', name: 'Arctic Char', emoji: '🐟', weight: 1 + Math.random() * 3 },
        { id: 'ice_fish', name: 'Ice Fish', emoji: '❄️', weight: 0.3 + Math.random() * 1 },
        { id: 'frozen_trout', name: 'Frozen Trout', emoji: '🐟', weight: 1 + Math.random() * 2 },
      ];

      let caught;
      if (Math.random() < 0.05) {
        caught = { id: 'crystal_perch', name: 'Crystal Perch', emoji: '💎', weight: 2 + Math.random() * 3 };
        events.push({ type: 'rare_bite', fish: 'Crystal Perch 💎', message: 'The ice GLOWS beneath your feet...' });
      } else {
        caught = species[Math.floor(Math.random() * species.length)];
      }

      if (ctx.hookAttempt) {
        catches.push(caught);
        events.push({ type: 'landed', fish: caught.name });
      } else {
        events.push({ type: 'bite', urgent: true, fish: caught.name });
      }

      // Pull toward hole event
      if (Math.random() < 0.1) {
        events.push({ type: 'fish_pull', message: 'The fish lunges — you almost fall in!' });
      }
    }

    // Thin ice warning
    if (state.warmth < 20 && Math.random() < 0.02) {
      events.push({ type: 'ice_cracking', message: '⚠️ The ice groans beneath you...' });
    }

    return { catches, events, state };
  }
}

// ─── Method 11: Surf Casting ──────────────────────────────────────────

export class SurfCastingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'surf_casting',
      name: 'Surf Casting',
      icon: '🌊',
      description: 'Cast from shore into the surf zone. Time your casts between waves. Storms bring rare species — and lightning.',
      unlockLevel: 7,
      gearRequired: ['surf_rod'],
      targetSpecies: ['surf_perch', 'striped_bass', 'bluefish', 'storm_sturgeon'],
      difficulty: 3,
      risk: 2,
      yield: 1.2,
      tags: ['active', 'solo'],
      flavor: 'Lightning cracks the sky. The Storm Sturgeon is biting. Do you stay and cast, or run for your life? This is surf fishing.',
    });
  }

  weatherModifier(w) {
    if (w.isThundering) return 1.5; // storms = rare species!
    if (w.currentWeather === 'rain') return 1.2;
    return 1.0;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      waveTimer: 0,
      waveInterval: 3000 + Math.random() * 4000,
      castWindow: false,
      stormActive: false,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    state.waveTimer += dt;

    // Wave cycle
    if (state.waveTimer >= state.waveInterval) {
      state.waveTimer = 0;
      state.waveInterval = 3000 + Math.random() * 4000;
      state.castWindow = !state.castWindow;

      if (state.castWindow) {
        events.push({ type: 'wave_gap', message: '⚡ CAST NOW — gap between waves!' });
      } else {
        events.push({ type: 'wave_crash', message: '🌊 Wave crashes! Too late...' });
      }
    }

    // Cast between waves
    if (ctx.cast && state.castWindow) {
      const species = [
        { id: 'surf_perch', name: 'Surf Perch', emoji: '🐟', weight: 0.5 + Math.random() * 1.5 },
        { id: 'striped_bass', name: 'Striped Bass', emoji: '🐟', weight: 2 + Math.random() * 5 },
        { id: 'bluefish', name: 'Bluefish', emoji: '🐟', weight: 1 + Math.random() * 3 },
      ];

      // Storm-exclusive species
      if (state.stormActive && Math.random() < 0.08) {
        catches.push({ id: 'storm_sturgeon', name: 'Storm Sturgeon', emoji: '⚡', weight: 8 + Math.random() * 15 });
        events.push({ type: 'legendary', fish: '⚡ Storm Sturgeon!', message: 'The sky turns electric. A STORM STURGEON strikes!' });
      } else {
        const caught = species[Math.floor(Math.random() * species.length)];
        catches.push(caught);
        events.push({ type: 'landed', fish: caught.name });
      }
    }

    // Lightning risk during storms
    if (state.stormActive && Math.random() < 0.005) {
      events.push({ type: 'lightning_strike', message: '⚡⚡⚡ LIGHTNING! Too close! Get off the beach!', urgent: true });
      state.active = false;
    }

    // Rogue wave
    if (Math.random() < 0.002) {
      events.push({ type: 'rogue_wave', message: '🌊 ROGUE WAVE! You\'re swept off your feet!' });
    }

    return { catches, events, state };
  }
}

// ─── Method 12: Spearfishing ──────────────────────────────────────────

export class SpearfishingMethod extends FishingMethod {
  constructor() {
    super({
      id: 'spearfishing',
      name: 'Spearfishing',
      icon: '🪝',
      description: 'Hunt fish underwater with a spear. One shot. Lead the target. Miss and you scare everything away.',
      unlockLevel: 14,
      gearRequired: ['spear'],
      targetSpecies: ['*'],
      difficulty: 5,
      risk: 4,
      yield: 0.4, // low quantity, highest quality
      tags: ['active', 'solo', 'dangerous', 'diving'],
      flavor: 'The Ender Koi darts left. You lead it by two blocks, adjust for current, and throw. Time stops. The spear flies true.',
    });
  }

  weatherModifier(w) {
    if (w.currentWeather === 'clear') return 1.3; // clear water = essential
    if (w.currentWeather === 'rain') return 0.5;  // murky water
    return 0.8;
  }

  setup(world, position) {
    return {
      ...super.setup(world, position),
      spearsLeft: 5,
      oxygen: 80,
      currentSpeed: 0.5 + Math.random() * 1.5,
      targetAcquired: false,
      target: null,
      leadDistance: 0,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    state.oxygen -= dt * 0.025;

    // Spot a target
    if (!state.target && Math.random() < 0.03) {
      state.target = {
        name: ['Ender Koi', 'Prismarine Cod', 'Coral Beauty', 'Redstone Eel'][Math.floor(Math.random() * 4)],
        speed: 1 + Math.random() * 3,
        direction: Math.random() * Math.PI * 2,
        distance: 5 + Math.random() * 10,
      };
      state.targetAcquired = true;
      events.push({ type: 'target_spotted', fish: state.target.name, distance: state.target.distance.toFixed(1) });
    }

    // Throw spear
    if (ctx.throwSpear && state.target && state.spearsLeft > 0) {
      state.spearsLeft--;
      const aim = ctx.aim ?? { x: 0, y: 0, z: 0 };
      const lead = state.target.speed * 0.5; // need to lead by speed * time
      state.leadDistance = lead;

      // Accuracy check
      const accuracy = ctx.skill ?? 0.5;
      const hitChance = accuracy * 0.7 - (state.currentSpeed * 0.1); // current makes it harder

      if (Math.random() < hitChance) {
        catches.push({
          id: 'speared_fish',
          name: state.target.name,
          emoji: '🐟',
          weight: 2 + Math.random() * 4,
          quality: 'pristine',
        });
        events.push({ type: 'hit!', fish: state.target.name, message: `Led the ${state.target.name} by ${lead.toFixed(1)} blocks. PERFECT SHOT!` });

        // Blood attracts predators
        if (Math.random() < 0.15) {
          events.push({ type: 'blood_in_water', message: '🦈 Something smelled the blood...' });
        }
      } else {
        events.push({ type: 'miss', message: 'The spear flies wide! Everything scatters...' });
        state.target = null; // miss scares fish away
      }
    }

    if (state.oxygen <= 0) {
      events.push({ type: 'drowning', urgent: true });
      state.active = false;
    }

    return { catches, events, state };
  }
}

// ─── Method Registry ──────────────────────────────────────────────────

export const FISHING_METHODS = {
  bait_casting:    new BaitCastingMethod(),
  crab_pots:       new CrabPotMethod(),
  lobster_traps:   new LobsterTrapMethod(),
  longlining:      new LongliningMethod(),
  trolling:        new TrollingMethod(),
  trawling:        new TrawlingMethod(),
  free_diving:     new FreeDivingMethod(),
  scuba_diving:    new SCUBADivingMethod(),
  jigging:         new JiggingMethod(),
  ice_fishing:     new IceFishingMethod(),
  surf_casting:    new SurfCastingMethod(),
  spearfishing:    new SpearfishingMethod(),
};

export class FishingMethodRegistry {
  static get(id) { return FISHING_METHODS[id] ?? null; }
  static all() { return Object.values(FISHING_METHODS); }
  static byTag(tag) { return Object.values(FISHING_METHODS).filter(m => m.tags.includes(tag)); }
  static byDifficulty(min, max) { return Object.values(FISHING_METHODS).filter(m => m.difficulty >= min && m.difficulty <= max); }
  static forLevel(level) { return Object.values(FISHING_METHODS).filter(m => m.unlockLevel <= level); }
  static get count() { return Object.keys(FISHING_METHODS).length; }

  /** Get the best method for given conditions */
  static recommend({ weather, biome, season, skillLevel = 1 }) {
    let best = null, bestScore = -Infinity;
    for (const method of this.forLevel(skillLevel)) {
      let score = method.yield;
      score *= method.weatherModifier(weather ?? { currentWeather: 'clear', isThundering: false });
      if (method.tags.includes('seasonal') && season !== 'winter') score *= 0.1;
      score *= (6 - method.difficulty) / 5; // easier methods score slightly higher for beginners
      if (score > bestScore) { bestScore = score; best = method; }
    }
    return best;
  }
}

export default FishingMethodRegistry;
