// CraftMind Fishing — Halibut Longlining
// The standard halibut/sablefish method. Set gear, soak, retrieve.
// Patience and preparation. The deep rewards those who wait.

import { FishingMethod } from '../fishing-methods.js';

/** Bait types and their effectiveness */
export const BAIT_TYPES = {
  herring:      { name: 'Herring',      effectiveness: 1.0,  targets: ['halibut', 'sablefish', 'rockfish'], desc: 'Standard — works for everything' },
  octopus:      { name: 'Octopus',      effectiveness: 1.4,  targets: ['halibut'],                  desc: 'Halibut LOVE octopus' },
  salmon_belly: { name: 'Salmon Belly', effectiveness: 1.3,  targets: ['sablefish'],                 desc: 'Sablefish can\'t resist' },
  squid:        { name: 'Squid',        effectiveness: 0.9,  targets: ['halibut', 'rockfish'],        desc: 'Cheap, decent results' },
};

export class LonglineOperation extends FishingMethod {
  constructor(config = {}) {
    super({
      id: 'alaska_longlining',
      name: 'Halibut Longlining',
      icon: '🪝',
      description: 'Deploy hundreds of hooks along a weighted groundline. Soak for hours. Haul back halibut, sablefish, and the occasional nightmare from the deep.',
      unlockLevel: 8,
      gearRequired: ['longline', 'hooks', 'bait'],
      targetSpecies: ['halibut', 'sablefish', 'rockfish', 'pacific_cod', 'sleeper_shark'],
      difficulty: 3,
      risk: 2,
      yield: 4.0,
      tags: ['passive', 'team', 'boat'],
      flavor: 'You bait hooks in the rain for two hours. You shoot gear until your hands are numb. You wait. And then the hydraulic hooker starts singing, and up comes a 150-pound barn door halibut. Worth every minute.',
    });
    this.boat = config.boat ?? 'FV Halibut Hunter';
    this.captain = config.captain ?? 'Rex';
    this.gear = config.gear ?? { hooks: 100, hook_spacing: '10ft', bait: 'herring', depth: '200ft' };
  }

  weatherModifier(weather) {
    if (weather.isThundering) return 0.1;
    if (weather.currentWeather === 'storm') return 0.2;
    if (weather.currentWeather === 'rain') return 0.8;
    if (weather.currentWeather === 'clear') return 1.1;
    return 1.0;
  }

  /** Optimal soak time depends on time of day */
  _optimalSoakTime() {
    const hour = new Date().getHours();
    // Halibut feed more at dawn/dusk
    if (hour >= 5 && hour <= 7) return 14400000;  // 4 hours
    if (hour >= 18 && hour <= 20) return 14400000;
    return 21600000; // 6 hours otherwise
  }

  setup(world, position) {
    const hookCount = this.gear.hooks ?? 100;
    const bait = BAIT_TYPES[this.gear.bait] ?? BAIT_TYPES.herring;

    return {
      ...super.setup(world, position),
      phase: 'baiting', // baiting → shooting → soaking → hauling → dressing → done
      captain: this.captain,
      boat: this.boat,
      hookCount,
      hooks: Array.from({ length: hookCount }, (_, i) => ({
        id: i, baited: false, hasFish: false, fish: null, baitType: this.gear.bait,
      })),
      bait: this.gear.bait,
      baitEffectiveness: bait.effectiveness,
      soakStart: null,
      soakDuration: this._optimalSoakTime(),
      soakElapsed: 0,
      haulProgress: 0,     // 0 to hookCount
      sharksHit: 0,
      headsOnly: 0,        // halibut eaten by sharks
      totalWeight: 0,
      circleHooks: true,   // required by regulation
      depth: parseInt(this.gear.depth) ?? 200,
    };
  }

  tick(dt, state, ctx = {}) {
    const events = [];
    const catches = [];

    switch (state.phase) {
      case 'baiting': {
        // Auto-bait or player action
        const baitRate = ctx.baitingMachine ? 10 : 2; // hooks per second
        let baited = 0;
        for (const hook of state.hooks) {
          if (!hook.baited && baited < baitRate) {
            hook.baited = true;
            baited++;
          }
        }

        const allBaited = state.hooks.every(h => h.baited);
        if (allBaited || ctx.startShooting) {
          state.phase = 'shooting';
          events.push({ type: 'baiting_done', message: `All ${state.hookCount} hooks baited with ${state.bait}. Gear over the side!` });
        }
        break;
      }

      case 'shooting': {
        // Run out gear — takes time proportional to hook count
        state.shootProgress = (state.shootProgress ?? 0) + dt * 0.003;
        if (state.shootProgress >= 1) {
          state.phase = 'soaking';
          state.soakStart = Date.now();
          const hours = Math.round(state.soakDuration / 3600000);
          events.push({
            type: 'gear_set',
            message: `Gear is set at ${state.depth}ft. Soaking for ~${hours} hours. Time to wait.`,
            soakDuration: state.soakDuration,
          });
        } else if (Math.random() < 0.05) {
          events.push({ type: 'shooting_update', progress: Math.round(state.shootProgress * 100), message: 'Gear going over...' });
        }
        break;
      }

      case 'soaking': {
        state.soakElapsed += dt;
        const progress = state.soakElapsed / state.soakDuration;

        // Fish bite hooks during soak
        const baitMod = state.baitEffectiveness;
        for (const hook of state.hooks) {
          if (!hook.hasFish && hook.baited && Math.random() < 0.001 * baitMod) {
            const roll = Math.random();
            const bait = BAIT_TYPES[hook.baitType];
            if (roll < 0.35) {
              hook.hasFish = true;
              hook.fish = { species: 'halibut', weight: 10 + Math.random() * 140 };
            } else if (roll < 0.55 && bait.targets.includes('sablefish')) {
              hook.hasFish = true;
              hook.fish = { species: 'sablefish', weight: 3 + Math.random() * 12 };
            } else if (roll < 0.70) {
              hook.hasFish = true;
              hook.fish = { species: 'rockfish', weight: 2 + Math.random() * 8 };
            } else if (roll < 0.78) {
              hook.hasFish = true;
              hook.fish = { species: 'pacific_cod', weight: 2 + Math.random() * 10 };
            } else if (roll < 0.82) {
              // Shark!
              hook.hasFish = true;
              hook.fish = { species: 'sleeper_shark', weight: 50 + Math.random() * 200 };
            }
          }
        }

        // Sleeper sharks eat halibut on the line
        if (Math.random() < 0.003) {
          const halibutHooks = state.hooks.filter(h => h.hasFish && h.fish?.species === 'halibut');
          if (halibutHooks.length > 0) {
            const victim = halibutHooks[Math.floor(Math.random() * halibutHooks.length)];
            state.headsOnly++;
            events.push({
              type: 'shark_attack',
              message: `🦈 Sleeper shark ate a ${Math.round(victim.fish.weight)}lb halibut on hook #${victim.id}! Just a head came up.`,
            });
          }
        }

        // Player can haul early or wait for optimal
        if (ctx.startHauling || progress >= 1.0) {
          state.phase = 'hauling';
          events.push({
            type: 'haul_start',
            message: progress >= 1 ? 'Soak time\'s up. Hauling back!' : 'Hauling early — some hooks might be light.',
            soakProgress: Math.round(progress * 100),
          });
        }
        break;
      }

      case 'hauling': {
        // Process hooks one by one
        const haulRate = 3;
        for (let i = 0; i < haulRate; i++) {
          const idx = Math.floor(state.haulProgress);
          if (idx >= state.hookCount) break;
          const hook = state.hooks[idx];
          state.haulProgress++;

          if (hook.hasFish && hook.fish) {
            const f = hook.fish;

            if (f.species === 'sleeper_shark') {
              state.sharksHit++;
              events.push({ type: 'shark_on', hook: idx, message: `Hook #${idx}: 🦈 Sleeper shark! Cut it loose.` });
            } else {
              const names = {
                halibut: 'Halibut', sablefish: 'Sablefish', rockfish: 'Rockfish', pacific_cod: 'Pacific Cod',
              };
              const emojis = { halibut: '🐟', sablefish: '🐟', rockfish: '🐟', pacific_cod: '🐟' };
              catches.push({ id: f.species, name: names[f.species], emoji: emojis[f.species], weight: f.weight });
              state.totalWeight += f.weight;
              events.push({
                type: 'fish_up',
                hook: idx,
                fish: `${names[f.species]} (${Math.round(f.weight)}lb)`,
              });
            }
          }
        }

        if (state.haulProgress >= state.hookCount) {
          state.phase = 'done';
          events.push({
            type: 'haul_complete',
            totalCatch: catches.length,
            totalWeight: Math.round(state.totalWeight),
            sharks: state.sharksHit,
            heads: state.headsOnly,
            message: `Longline haul complete! ${catches.length} fish, ${Math.round(state.totalWeight)}lb total.${state.sharksHit > 0 ? ` ${state.sharksHit} sharks cut loose.` : ''}${state.headsOnly > 0 ? ` ${state.headsOnly} halibut lost to sharks (heads only).` : ''}`,
          });
        }
        break;
      }
    }

    return { catches, events, state };
  }
}
