/**
 * @module craftmind-fishing/mineflayer-plugin
 * @description CraftMind Core plugin that bridges the fishing game engine
 * to a Mineflayer bot with commands, behavior tree, personality, and autonomous
 * behavior engine.
 *
 * Usage:
 *   const fishingPlugin = require('craftmind-fishing/src/mineflayer/fishing-plugin.cjs');
 *   createBot({ plugins: [fishingPlugin], ... });
 */

import { SitkaFishingGame, METHOD_BIOME_RULES } from '../integration/game-engine.js';

// ── AI Modules ───────────────────────────────────────────────────────────────

import { BehaviorTree, Blackboard, Selector, Sequence, Parallel, Decorator, Condition, Action, Status } from '../ai/behavior-tree.js';
import { Humanizer } from '../ai/humanizer.js';
import { DailySchedule } from '../ai/schedule.js';
import { Personality } from '../ai/personality.js';
import { Memory } from '../ai/memory.js';
import { Relationships } from '../ai/relationships.js';
import { SkillLibrary } from '../ai/skill-library.js';

// ── Fishing commands ──────────────────────────────────────────────────────────

const fishingCommands = [
  {
    name: 'fish',
    description: 'Start fishing (uses best method for current location)',
    usage: '!fish [method]',
    aliases: ['cast', 'f'],
    execute(ctx, methodArg) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Fishing game not initialized.');
      if (game.player.isFishing) return ctx.reply("Already fishing! Use !reel or !stop to stop.");

      const biome = _detectBiome(ctx);
      if (biome) game.player.location.biome = biome;

      const method = methodArg || _bestMethod(biome, game);
      if (!method) return ctx.reply("No viable fishing method here. Try !weather to check conditions.");

      const result = game.startFishing(method);
      if (result.success) {
        ctx.bot.craftmind._stateMachine?.transition('CASTING', { method });

        // Feed into AI systems
        if (ctx._ai) {
          ctx._ai.memory.addEpisode({ type: 'started_fishing', data: { method, biome } });
          ctx._ai.memory.updateWorking({ task: 'fishing', location: biome });
        }

        ctx.reply(result.message);
      } else {
        ctx.reply(result.message);
      }
    },
  },
  {
    name: 'reel',
    description: 'Haul back your catch',
    usage: '!reel',
    aliases: ['haul'],
    execute(ctx) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Fishing game not initialized.');
      if (!game.player.isFishing) return ctx.reply("You're not fishing. Use !fish to start.");

      ctx.bot.craftmind._stateMachine?.transition('REELING');
      const result = game.haulBack();

      if (ctx._ai) {
        if (result.success && result.catch.length > 0) {
          const totalWeight = result.catch.reduce((s, f) => s + f.weight, 0);
          ctx._ai.personality.mood.update({ type: 'caught_fish', value: Math.min(1, totalWeight / 50) });
          ctx._ai.memory.addEpisode({
            type: 'caught_fish',
            data: { catch: result.catch, totalWeight },
            tags: ['fishing', 'success'],
          });
          ctx._ai.memory.updateWorking({
            fishCount: (ctx._ai.memory.working.fishCount || 0) + result.catch.length,
            fishCaught: [...(ctx._ai.memory.working.fishCaught || []), ...result.catch],
          });
        } else {
          ctx._ai.personality.mood.update({ type: 'lost_fish' });
          ctx._ai.memory.addEpisode({ type: 'no_catch', tags: ['fishing', 'failure'] });
        }
      }

      if (result.success && result.catch.length > 0) {
        const summary = result.catch.map(f => {
          const sp = game.species[f.speciesId];
          return `${sp?.name || f.speciesId} ${f.weight}lb (${f.quality})`;
        }).join(', ');
        ctx.reply(`🎣 ${result.message} — ${summary}`);
      } else {
        ctx.reply(result.message);
      }
      ctx.bot.craftmind._stateMachine?.transition('IDLE');
    },
  },
  {
    name: 'check',
    description: 'Check current fishing status',
    usage: '!check',
    execute(ctx) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Not initialized.');
      const state = game.getState();
      const mood = ctx._ai?.personality?.mood?.snapshot();
      const moodStr = mood ? ` | Mood: E${(mood.energy * 100) | 0} S${(mood.satisfaction * 100) | 0} F${(mood.frustration * 100) | 0}` : '';
      const lines = [
        `${state.weather.emoji || ''} ${state.weather.name || state.weather.type}`,
        `${state.tide.emoji || ''} Tide: ${state.tide.level.toFixed(1)}ft ${state.tide.direction}`,
        `Bite mult: ${state.weather.biteMultiplier}x`,
        `Fishing: ${state.player.isFishing ? '🎯 Active' : '❌ Idle'}`,
        `Gold: $${state.player.gold} | Fish in hold: ${state.player.inventory.length}`,
        `Species caught: ${state.player.statistics.speciesCaught.length}`,
        `Total caught: ${state.player.statistics.totalFishCaught}`,
      ];
      ctx.reply(lines.join(' | ') + moodStr);
    },
  },
  {
    name: 'sell',
    description: 'Sell fish from your hold',
    usage: '!sell [all|<species>]',
    execute(ctx, arg) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Not initialized.');
      if (game.player.inventory.length === 0) return ctx.reply('No fish to sell.');

      const goldBefore = game.player.gold;

      if (arg === 'all') {
        const results = game.sellAllFish();
        if (results.length === 0) return ctx.reply('Nothing to sell.');
      } else {
        const fish = game.player.inventory[0];
        if (!fish) return ctx.reply('No fish to sell.');
        const result = game.sellFish(fish.speciesId, fish.weight);
        ctx.reply(result.message);
      }

      const earned = game.player.gold - goldBefore;
      if (earned > 0 && ctx._ai) {
        ctx._ai.personality.mood.update({ type: 'good_sale', value: Math.min(1, earned / 100) });
        ctx._ai.memory.addEpisode({ type: 'sold_fish', data: { gold: earned } });
        ctx._ai.memory.updateWorking({
          goldEarned: (ctx._ai.memory.working.goldEarned || 0) + earned,
        });
      }

      ctx.reply(`💰 Sold fish. Gold: $${game.player.gold}`);
    },
  },
  {
    name: 'gear',
    description: 'Check gear or buy from shop',
    usage: '!gear [buy <id>]',
    execute(ctx, action, gearId) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Not initialized.');
      if (action === 'buy' && gearId) {
        const result = game.buyGear(gearId);
        return ctx.reply(result.message);
      }
      const equipped = game.player.gear.map(g => g.id).join(', ') || 'none';
      ctx.reply(`Gear: ${equipped} | Gold: $${game.player.gold}`);
    },
  },
  {
    name: 'weather',
    description: 'Check weather conditions',
    usage: '!weather',
    execute(ctx) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Not initialized.');
      const s = game.getState();
      const r = game.weather.getFishingReport?.() || 'No report available.';
      ctx.reply(`${s.weather.emoji || ''} ${s.weather.name || s.weather.type} | Temp: ${s.weather.temperature}°F | Wind: ${s.weather.windSpeed}kts | Sea: ${s.weather.seaState} | ${r}`);
    },
  },
  {
    name: 'tide',
    description: 'Check tidal conditions',
    usage: '!tide',
    execute(ctx) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Not initialized.');
      const t = game.getState().tide;
      ctx.reply(`${t.emoji || ''} Tide: ${t.level.toFixed(1)}ft ${t.direction} — ${t.phase}`);
    },
  },
  {
    name: 'radio',
    description: 'Check marine radio',
    usage: '!radio',
    execute(ctx) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Not initialized.');
      const events = game.eventLog.filter(e => e.emoji === '📻').slice(-3);
      if (events.length === 0) return ctx.reply('📻 Radio is quiet.');
      ctx.reply(events.map(e => e.message).join(' | '));
    },
  },
  {
    name: 'permit',
    description: 'Check permits or buy one',
    usage: '!permit [buy <id>]',
    execute(ctx, action, permitId) {
      const game = ctx._fishingGame;
      if (!game) return ctx.reply('Not initialized.');
      if (action === 'buy' && permitId) {
        const result = game.buyPermit(permitId);
        return ctx.reply(result.message);
      }
      const permits = game.player.permits.length > 0
        ? game.player.permits.join(', ')
        : 'none';
      ctx.reply(`Permits: ${permits} | Gold: $${game.player.gold}`);
    },
  },
  {
    name: 'cody',
    description: 'Talk to Cody about fishing, life, or ask for help',
    usage: '!cody [topic]',
    execute(ctx, topic) {
      const ai = ctx._ai;
      if (!ai) return ctx.reply("Cody's not feeling talkative right now.");

      const player = ctx.username || 'stranger';
      const rel = ai.relationships.get(player);
      ai.relationships.interact(player, 'chat');
      ai.memory.updateWorking({ interactions: (ai.memory.working.interactions || 0) + 1 });

      if (!topic || topic === 'hello' || topic === 'hi') {
        ctx.reply(ai.personality.getGreeting(player, rel));
        return;
      }

      // Opinion queries
      if (topic === 'opinion' || topic === 'think') {
        const subjects = Object.keys(ai.personality.opinions);
        ctx.reply(ai.personality.getResponse('opinion', { subject: subjects[Math.floor(Math.random() * subjects.length)] }));
        return;
      }

      // Tips
      if (topic === 'tip' || topic === 'help' || topic === 'advice') {
        if (ai.relationships.wouldShare(player, 'fishing_tips')) {
          ctx.reply(ai.personality.getResponse('tip'));
        } else {
          ctx.reply(pickRandom([
            "Maybe after I get to know you better.",
            "Come back when you've caught a few fish first.",
            "Earn your stripes, kid.",
          ]));
        }
        return;
      }

      // How's the fishing
      if (topic === 'fishing' || topic === 'bite') {
        const w = ai.memory.working;
        if (w.fishCount > 0) {
          ctx.reply(`Caught ${w.fishCount} so far today. ${w.fishCount > 5 ? 'Pretty good day.' : 'Could be better.'}`);
        } else {
          ctx.reply(pickRandom([
            "Haven't had a bite yet. They'll come around.",
            "Slow day. Patience.",
            "Fish aren't cooperating today.",
          ]));
        }
        return;
      }

      // Default: personality-driven response
      ctx.reply(ai.personality.getResponse('general'));
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function _detectBiome(ctx) {
  const world = ctx.bot?.craftmind?._world;
  if (!world) return null;
  if (world.nearWater) {
    if (world.blockUnder === 'sand') return 'tidal_flats';
    if (world.blockUnder === 'gravel') return 'freshwater_river';
    return 'sheltered_sound';
  }
  if (world.blockUnder === 'grass_block' || world.blockUnder === 'dirt') return 'freshwater_river';
  return null;
}

function _bestMethod(biome, game) {
  if (!biome) return null;
  for (const [method, rules] of Object.entries(METHOD_BIOME_RULES)) {
    if (rules.biomes.includes(biome)) {
      const viability = game.checkMethodViability(method);
      if (viability.viable) return method;
    }
  }
  return null;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Build Behavior Tree ───────────────────────────────────────────────────────

function buildBehaviorTree(ai, game, ctx) {
  const bb = new Blackboard();

  // ── Condition checks ──────────────────────────────────────
  const healthLow = new Condition('health_low', () =>
    (ctx.bot?.health || 20) < 6
  );
  const isNight = new Condition('is_night', () => {
    const state = game.getState?.();
    if (!state) return false;
    const hour = (state.gameTime || 0) % 24;
    return hour >= 21 || hour < 5.5;
  });
  const isFishing = new Condition('is_fishing', () => game.player?.isFishing);
  const isSleepTime = new Condition('sleep_time', () => {
    const state = game.getState?.();
    if (!state) return false;
    const hour = (state.gameTime || 0) % 24;
    return hour >= 21 || hour < 5.5;
  });
  const shouldFish = new Condition('should_fish', () => {
    const state = game.getState?.();
    if (!state) return false;
    const hour = (state.gameTime || 0) % 24;
    const decision = ai.personality.shouldGoFishing({
      weatherType: state.weather?.type,
      seaState: state.weather?.seaState,
    });
    return decision.go && hour >= 7 && hour < 16;
  });
  const wantsToSocialize = new Condition('wants_social', () => {
    const state = game.getState?.();
    if (!state) return false;
    const hour = (state.gameTime || 0) % 24;
    return hour >= 17 && hour < 19 && ai.personality.wantsToTalk();
  });
  const isStorming = new Condition('is_storm', () => {
    const state = game.getState?.();
    return state?.weather?.type === 'storm' || state?.weather?.seaState > 4;
  });

  // ── Actions ───────────────────────────────────────────────
  const flee = new Action('flee', () => {
    bb.set('lastAction', 'flee');
    ctx.bot?.chat?.('Getting out of here!');
    return Status.SUCCESS;
  });

  const seekShelter = new Action('seek_shelter', () => {
    bb.set('lastAction', 'seek_shelter');
    ctx.bot?.chat?.(ai.personality.getResponse('weather', { weatherType: 'storm' }));
    return Status.SUCCESS;
  });

  const checkRadio = new Action('check_radio', () => {
    const state = game.getState?.();
    if (state) {
      const w = state.weather;
      ctx.bot?.chat?.(`📻 Checking radio... ${w.emoji || ''} ${w.name || 'clear'}, wind ${w.windSpeed}kts, sea ${w.seaState}.`);
      ai.schedule.applyWeather(w.type);
      ai.personality.mood.update(w.type === 'clear' ? { type: 'good_weather' } : { type: 'weather_storm' });
      ai.memory.addEpisode({ type: 'checked_weather', data: { weather: w.type } });
    }
    bb.set('lastAction', 'check_radio');
    return Status.SUCCESS;
  });

  const decidePlan = new Action('decide_plan', () => {
    const decision = ai.personality.shouldGoFishing({
      weatherType: game.getState?.().weather?.type,
      seaState: game.getState?.().weather?.seaState,
    });
    ctx.bot?.chat?.(decision.reason);
    bb.set('fishingDecision', decision.go);
    bb.set('lastAction', 'decide_plan');
    ai.memory.addEpisode({ type: 'planned_day', data: { going: decision.go, reason: decision.reason } });
    return Status.SUCCESS;
  });

  const prepareGear = new Action('prepare_gear', () => {
    ctx.bot?.chat?.('Heading to LFS for bait and supplies.');
    bb.set('lastAction', 'prepare_gear');
    return Status.SUCCESS;
  });

  const goFishing = new Action('go_fishing', () => {
    if (!game.player.isFishing) {
      const state = game.getState();
      const biome = state?.player?.location?.biome || 'sheltered_sound';
      const method = _bestMethod(biome, game) || 'salmon_trolling';
      const result = game.startFishing(method);
      if (result.success) {
        ctx.bot?.chat?.(pickRandom([
          "Lines in the water. Now we wait.",
          "Fishing. Don't jinx it by talking.",
          "Here we go.",
        ]));
        ai.memory.updateWorking({ task: 'fishing', location: biome });
        ai.memory.addEpisode({ type: 'started_fishing', data: { method, biome } });
      }
    }
    bb.set('lastAction', 'go_fishing');
    return game.player.isFishing ? Status.RUNNING : Status.SUCCESS;
  });

  const checkBite = new Action('check_bite', () => {
    if (!game.player.isFishing) return Status.FAILURE;

    // Simulate bite check (would be driven by game engine events in practice)
    const state = game.getState();
    if (state?.weather?.biteMultiplier > 1.5 && Math.random() < 0.1) {
      const result = game.haulBack();
      if (result.success && result.catch.length > 0) {
        const biggest = result.catch.reduce((a, b) => a.weight > b.weight ? a : b);
        ctx.bot?.chat?.(ai.personality.getResponse('caught_fish', { weight: biggest.weight }));
        ai.personality.mood.update({ type: 'caught_fish', value: Math.min(1, biggest.weight / 40) });
        ai.memory.addEpisode({
          type: 'caught_fish',
          data: { catch: result.catch },
          tags: ['fishing', 'success'],
        });
        ai.memory.updateWorking({
          fishCount: (ai.memory.working.fishCount || 0) + result.catch.length,
        });
      } else {
        ai.memory.addEpisode({ type: 'no_catch', tags: ['fishing'] });
      }
    }
    return Status.RUNNING;
  });

  const sellCatch = new Action('sell_catch', () => {
    if (game.player.inventory.length > 0) {
      const goldBefore = game.player.gold;
      game.sellAllFish();
      const earned = game.player.gold - goldBefore;
      ctx.bot?.chat?.(`Sold the catch for $${earned}. Not bad.`);
      ai.personality.mood.update({ type: 'good_sale', value: Math.min(1, earned / 100) });
      ai.memory.addEpisode({ type: 'sold_fish', data: { gold: earned } });
    }
    bb.set('lastAction', 'sell_catch');
    return Status.SUCCESS;
  });

  const visitErnies = new Action('visit_ernies', () => {
    if (ai.personality.wantsToTalk()) {
      ctx.bot?.chat?.(pickRandom([
        "Heading to Ernie's. Chowder time.",
        "After a day on the water, Ernie's chowder hits different.",
      ]));
    }
    bb.set('lastAction', 'visit_ernies');
    return Status.SUCCESS;
  });

  const idleBehavior = new Action('idle', () => {
    if (!bb.get('_idleTimer') || Date.now() - bb.get('_idleTimer') > 5000) {
      const phrases = [
        () => ctx.bot?.chat?.(ai.personality.getResponse('no_bites')),
        () => ctx.bot?.chat?.(pickRandom(["*adjusts gear*", "*watches the horizon*", "*checks lines*"])),
        () => {}, // silent
      ];
      pickRandom(phrases)();
      bb.set('_idleTimer', Date.now());
    }
    return Status.RUNNING;
  });

  const sleep = new Action('sleep', () => {
    bb.set('lastAction', 'sleep');
    return Status.SUCCESS;
  });

  // ── Build tree ─────────────────────────────────────────────
  const root = new Selector('root', [
    // Urgency
    new Sequence('handle_danger', [
      isStorming,
      new Selector('danger_response', [flee, seekShelter]),
    ]),

    // Sleep time
    new Sequence('sleep_routine', [
      isSleepTime,
      sleep,
    ]),

    // Fishing
    new Sequence('fishing_routine', [
      shouldFish,
      new Selector('fishing_actions', [
        isFishing,
        new Sequence('start_fishing', [decidePlan, prepareGear, goFishing]),
      ]),
      checkBite,
    ]),

    // Social
    new Sequence('social_routine', [
      wantsToSocialize,
      visitErnies,
    ]),

    // Morning routine
    new Sequence('morning_routine', [
      new Condition('is_morning', () => {
        const state = game.getState?.();
        const hour = (state?.gameTime || 0) % 24;
        return hour >= 6 && hour < 7;
      }),
      checkRadio,
      decidePlan,
      prepareGear,
    ]),

    // Sell catch
    new Sequence('sell_routine', [
      new Condition('has_catch', () => game.player.inventory.length > 0),
      sellCatch,
    ]),

    // Default idle
    idleBehavior,
  ]);

  return new BehaviorTree(root, bb);
}

// ── Plugin definition ─────────────────────────────────────────────────────────

const fishingPlugin = {
  name: 'fishing',
  version: '2.0.0',
  provides: ['fishing', 'game-engine', 'ai-behavior'],

  load(ctx) {
    // Create the game engine instance
    const game = new SitkaFishingGame();
    game.init({ name: ctx.bot?.username || 'Captain' });
    ctx._fishingGame = game;

    // ── Initialize AI Systems ────────────────────────────────
    const dataDir = ctx.options?.memoryDir || './data';
    const memory = new Memory(`${dataDir}/memory`);
    const relationships = new Relationships(`${dataDir}/memory`);
    const personality = new Personality();
    const schedule = new DailySchedule();
    const skillLibrary = new SkillLibrary();
    const humanizer = new Humanizer();

    ctx._ai = { memory, relationships, personality, schedule, skillLibrary, humanizer };

    // Build behavior tree
    const behaviorTree = buildBehaviorTree(ctx._ai, game, ctx);
    ctx._ai.behaviorTree = behaviorTree;

    // ── Register commands ────────────────────────────────────
    for (const cmd of fishingCommands) {
      ctx.commands.register({
        ...cmd,
        execute(c, ...args) {
          cmd.execute({ ...c, _fishingGame: game, _ai: ctx._ai, username: c.username }, ...args);
        },
      });
    }

    // ── Register states ──────────────────────────────────────
    if (ctx.stateMachine) {
      ctx.stateMachine.registerState('CASTING', {
        from: ['IDLE', 'FISHING', 'LANDING'],
        timeout: 300_000,
      });
      ctx.stateMachine.registerState('REELING', {
        from: ['CASTING'],
        timeout: 60_000,
      });
      ctx.stateMachine.registerState('FIGHTING', {
        from: ['REELING'],
        timeout: 120_000,
      });
      ctx.stateMachine.registerState('LANDING', {
        from: ['FIGHTING', 'REELING'],
        timeout: 30_000,
      });
    }

    // ── Inventory hooks ──────────────────────────────────────
    ctx.addInventoryHook('fish', {
      itemPattern: /fish|salmon|cod|halibut|crab|shrimp|rockfish|trout|char/,
      onCollect(item) {
        game.player.statistics.totalFishCaught++;
      },
    });
    ctx.addInventoryHook('fishing_gear', {
      itemPattern: /fishing_rod|hook|bait|net|line/,
    });

    // ── Prompt fragment for LLM (fallback) ───────────────────
    ctx.addPromptFragment('fishing', `
You are Cody, an experienced Alaska fisherman in Sitka Sound. You have strong opinions about gear and technique.
You're stubborn, patient, superstitious, and talkative when the mood strikes. You remember players between sessions.
Use personality-driven responses for routine situations. Use LLM only for novel/complex situations.
Pink hoochies are the best lure. 3.5 knots trolling speed. Fish the kelp line edge.
Current mood: ${JSON.stringify(personality.mood.snapshot())}`, 10);

    ctx.registerMethod('getFishingGame', () => game);
    ctx.registerMethod('getAI', () => ctx._ai);

    // ── Behavior tree tick loop (500ms) ──────────────────────
    const tickInterval = 500;
    let tickCount = 0;

    const behaviorLoop = setInterval(() => {
      if (!ctx.bot?.entity) return;

      try {
        const status = behaviorTree.tick();

        // Update mood over time
        if (tickCount % 20 === 0) { // every 10 seconds
          personality.mood.update({ type: 'time_passes' });
        }

        // Sync schedule
        if (tickCount % 12 === 0) { // every 6 seconds
          const state = game.getState?.();
          if (state) {
            const hour = (state.gameTime || 0) % 24;
            schedule.getCurrentBlock(hour, {
              weather: state.weather?.type,
              biteMultiplier: state.weather?.biteMultiplier,
              fishCount: memory.working.fishCount,
            });
          }
        }

        tickCount++;

        // Debug log every 100 ticks (50 seconds)
        if (tickCount % 100 === 0 && process.env.DEBUG_AI) {
          console.log(`[AI] Tick ${tickCount} status: ${status} | ${behaviorTree.print().split('\n').filter(l => l.includes('→')).join(', ')}`);
        }
      } catch (err) {
        // Don't let AI errors crash the bot
        if (process.env.DEBUG_AI) console.error('[AI] Tick error:', err.message);
      }
    }, tickInterval);

    // ── Game engine loop (5s ticks) ──────────────────────────
    const gameLoop = setInterval(() => {
      if (ctx.bot?.entity) {
        game.update(5000);
      }
    }, 5000);

    // ── Persistence (save every 60 seconds) ──────────────────
    const saveLoop = setInterval(() => {
      memory.save();
      relationships.save();
    }, 60_000);

    // ── Spawn event ──────────────────────────────────────────
    ctx.events.on('SPAWN', () => {
      memory.resetSession();
      schedule.resetDay();
      behaviorTree.reset();

      setTimeout(() => {
        const state = game.getState();
        ctx.bot?.chat?.(`🎣 Sitka Sound — ${state.weather.emoji || ''} ${state.weather.name || 'clear'}, ${state.tide.emoji || ''} ${state.tide.phase || 'tide unknown'}${state.weather.seaState > 3 ? '. Rough out there.' : ''}. Type !help for commands, !cody to talk.`);
      }, 3000);
    });

    // ── Chat event: personality-driven responses ─────────────
    ctx.events.on('CHAT', (username, message) => {
      if (username === (ctx.bot?.username || 'Cody')) return;

      const rel = relationships.get(username);
      relationships.interact(username, 'chat');
      memory.addEpisode({ type: 'player_chat', data: { player: username, message }, tags: ['social'] });
      memory.updateWorking({ interactions: (memory.working.interactions || 0) + 1 });

      // Cody responds to fishing talk with personality, not LLM
      const lower = message.toLowerCase();
      const fishingWords = ['fish', 'catch', 'salmon', 'halibut', 'crab', 'tide', 'weather', 'ocean', 'sea', 'rod', 'bait', 'lure', 'hook'];
      if (fishingWords.some(w => lower.includes(w)) && !lower.startsWith('!')) {
        // Let the behavior tree / LLM handle it via prompt
        // But log the interaction for personality shaping
      }
    });

    // ── Disconnect: save everything ──────────────────────────
    ctx.events.on('END', () => {
      memory.save();
      relationships.save();
      // Session analysis
      if (memory.working.fishCount > 0) {
        const analysis = skillLibrary.analyzeSession({
          skillName: 'troll-salmon',
          duration: (Date.now() - memory.working.sessionStart) / 1000,
          catch: memory.working.fishCount,
          targetCatch: 10,
          conditions: {},
        });
        memory.addEpisode({ type: 'session_end', data: { ...analysis, working: memory.working } });
        memory.extractRulesFromEpisodes();
      }
    });

    // Store for cleanup
    this._behaviorLoop = behaviorLoop;
    this._gameLoop = gameLoop;
    this._saveLoop = saveLoop;
    this._game = game;
    this._ctx = ctx;

    console.log('[FishingPlugin] v2.0 Loaded — Sitka Sound fishing + AI behavior engine 🎣🧠');
  },

  unload() {
    clearInterval(this._behaviorLoop);
    clearInterval(this._gameLoop);
    clearInterval(this._saveLoop);
    if (this._ctx?._ai) {
      this._ctx._ai.memory.save();
      this._ctx._ai.relationships.save();
    }
    console.log('[FishingPlugin] Unloaded');
  },
};

export default fishingPlugin;
