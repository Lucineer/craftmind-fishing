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
import { MinecraftFishing } from './minecraft-fishing.js';
import { ScriptRunner, Script } from './script-engine.js';
import { createFishingScripts } from './scripts/fishing.js';
import { ScriptRegistry, getPinnedScript } from './scripts/registry.js';
import { VisionSystem } from './vision.js';
import { ResilientController, EMERGENCY_SCRIPTS } from './resilient-controller.js';
import { StuckDetector } from './stuck-detector.js';

// ── AI Modules ───────────────────────────────────────────────────────────────

import { BehaviorTree, Blackboard, Selector, Sequence, Parallel, Decorator, Condition, Action, Status } from '../ai/behavior-tree.js';
import { Humanizer } from '../ai/humanizer.js';
import { DailySchedule } from '../ai/schedule.js';
import { Personality } from '../ai/personality.js';
import { Memory } from '../ai/memory.js';
import { Relationships } from '../ai/relationships.js';
import { SkillLibrary } from '../ai/skill-library.js';
import { SessionRecorder } from '../ai/session-recorder.js';
import { ComparativeEvaluator } from '../ai/comparative-evaluator.js';
import { ScriptEvolver } from '../ai/script-evolver.js';
import { DecisionEngine } from '../ai/decision-engine.js';
import { Actions } from './actions.js';
import { WorldManager } from './world-manager.js';
import { SITKA_LOCATIONS } from './sitka-world.js';
import { ActionPlanner } from '../ai/action-planner.js';
import { ActionExecutor } from '../ai/action-executor.js';
import { ConversationMemory } from '../ai/conversation-memory.js';
import { Survival } from './survival.js';
import { Equipper } from './equipper.js';

// ── RCON for spawn supplies ─────────────────────────────────────────────────────
import { createRequire } from 'node:module';
const _require = createRequire(import.meta.url);
const { Rcon } = _require('rcon-client');
import { goals } from 'mineflayer-pathfinder';

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
      ctx.reply(`Gear: $${equipped} | Gold: $${game.player.gold}`);
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
  {
    name: 'build',
    description: 'Build the Sitka Sound world',
    usage: '!build',
    execute(ctx) {
      ctx.reply('🔨 Building Sitka Sound... This may take a moment.');
      ctx.reply('Run `node scripts/setup-world.js` in your server terminal to build the world.');
    },
  },
  {
    name: 'tp',
    description: 'Teleport to a Sitka location',
    usage: '!tp <location>',
    execute(ctx, locationName) {
      if (!locationName) {
        const names = Object.entries(SITKA_LOCATIONS).map(([k, v]) => `${k}: ${v.name}`).join(', ');
        return ctx.reply(`Locations: ${names}`);
      }
      const key = locationName.toLowerCase().replace(/\s+/g, '_');
      const loc = SITKA_LOCATIONS[key];
      if (!loc) return ctx.reply(`Unknown location: ${locationName}`);
      const wb = ctx._worldManager?.rcon;
      if (!wb?.rcon) return ctx.reply('World connection not available.');
      wb.teleport(ctx.bot?.username || '@p', loc.x, loc.y, loc.z).then(() => {
        ctx.reply(`⚓ Teleporting to ${loc.name}...`);
      });
    },
  },
  {
    name: 'weather',
    description: 'Check or set weather in Minecraft',
    usage: '!weather [clear|rain|storm]',
    execute(ctx, arg) {
      const game = ctx._fishingGame;
      const wm = ctx._worldManager;

      if (arg && wm) {
        if (arg === 'storm') { wm.setStorm(); return ctx.reply('⛈ Setting thunder...'); }
        if (arg === 'clear') { wm.setClear(); return ctx.reply('☀ Clearing up.'); }
        if (arg === 'rain') { wm.send('/weather rain 9999'); return ctx.reply('🌧 Rain incoming.'); }
      }

      // Default: check weather from game engine
      if (!game) return ctx.reply('Not initialized.');
      const s = game.getState();
      const r = game.weather.getFishingReport?.() || 'No report available.';
      ctx.reply(`${s.weather.emoji || ''} ${s.weather.name || s.weather.type} | Temp: ${s.weather.temperature}°F | Wind: ${s.weather.windSpeed}kts | Sea: ${s.weather.seaState} | ${r}`);
    },
  },
  {
    name: 'biome',
    description: 'Check current biome',
    usage: '!biome',
    execute(ctx) {
      const wm = ctx._worldManager;
      if (!wm) return ctx.reply('World manager not available.');
      const pos = ctx.bot?.entity?.position;
      if (!pos) return ctx.reply('No position data.');
      const biome = wm.getBiomeAt(pos.x, pos.y, pos.z);
      const nearest = wm.getNearestLocation(pos.x, pos.y, pos.z);
      ctx.reply(`Biome: ${biome} | Nearest: ${nearest.name} (${Math.round(nearest.distance)}m)`);
    },
  },
  {
    name: 'shop',
    description: 'Show the tackle shop',
    usage: '!shop',
    execute(ctx) {
      ctx._mcFishing?.showShop(ctx.username || ctx.bot?.username || 'player');
    },
  },
  {
    name: 'buy',
    description: 'Buy from the shop',
    usage: '!buy <item>',
    execute(ctx, itemId) {
      if (!itemId) return ctx.reply('Usage: !buy <item>. Type !shop to see items.');
      ctx._mcFishing?.buyItem(ctx.username || ctx.bot?.username, itemId);
    },
  },
  {
    name: 'balance',
    description: 'Check your money and fish count',
    usage: '!balance',
    aliases: ['bal', '$'],
    execute(ctx) {
      ctx._mcFishing?.showBalance(ctx.username || ctx.bot?.username || 'player');
    },
  },
  {
    name: 'scripts',
    description: 'List available personality scripts',
    usage: '!scripts',
    execute(ctx) {
      const registry = ctx._scriptRegistry;
      if (!registry) return ctx.reply('Script registry not loaded.');
      const scripts = registry.list();
      if (scripts.length === 0) return ctx.reply('No scripts available.');
      const current = ctx._scriptRunner?.currentScript || 'none';
      const lines = scripts.map(s => {
        const active = s.name === current ? ' ◄' : '';
        return `${s.name}${active} — ${s.description}`;
      });
      ctx.reply(`Scripts (${scripts.length}): ${lines.join(' | ')}`);
    },
  },
  {
    name: 'script',
    description: 'Switch Cody\'s personality script',
    usage: '!script <name>',
    execute(ctx, name) {
      if (!name) return ctx.reply('Usage: !script <name>. Use !scripts to list.');
      const registry = ctx._scriptRegistry;
      if (!registry) return ctx.reply('Script registry not loaded.');
      const scriptData = registry.get(name);
      if (!scriptData) return ctx.reply(`Unknown script: ${name}`);
      ctx._scriptRunner?.switchToV1({ ...scriptData, name }, `Alright, let me try ${name}.`);
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

function buildBehaviorTree(ai, game, ctx, actions) {
  const bb = new Blackboard();

  // ── Condition checks ──────────────────────────────────────
  const hostileNearby = new Condition('hostile_nearby', () => {
    return ctx._survival?.getNearestHostile(16) != null;
  });
  const creeperNearby = new Condition('creeper_nearby', () => {
    const hostile = ctx._survival?.getNearestHostile(6);
    return hostile?.name?.includes('creeper') || false;
  });
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
    // Script runner handles fishing now
    if (ctx._scriptRunner?.isRunning) return false;
    // Fallback for when script runner isn't active
    const hasRod = ctx.bot?.inventory?.items().some(i => i.name.includes('fishing_rod'));
    if (!hasRod) return false;
    // Check if near water (look for water blocks)
    const pos = ctx.bot?.entity?.position;
    if (!pos) return false;
    try {
      const waterId = ctx.bot.registry.blocksByName.water?.id;
      if (!waterId) return false;
      const waterBlock = ctx.bot.findBlock({
        matching: waterId,
        maxDistance: 5,
      });
      if (!waterBlock) return false;
      return true;
    } catch (e) {
      return false;
    }
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

  // ── Actions (now with real mineflayer movements!) ─────────
  const combat = new Action('combat', () => {
    bb.set('lastAction', 'combat');
    const target = ctx._survival?.getNearestHostile(16);
    if (target) {
      ctx._survival._attack(target);
    }
    return Status.RUNNING;
  });

  const fleeThreat = new Action('flee_threat', () => {
    bb.set('lastAction', 'flee');
    const target = ctx._survival?.getNearestHostile(16);
    if (target) {
      ctx._survival._fleeFrom(target);
    }
    return Status.SUCCESS;
  });

  const flee = new Action('flee', () => {
    bb.set('lastAction', 'flee');
    ctx.bot?.chat?.('Getting out of here!');
    // Actually walk away from current position
    actions.walkInDirection(10).catch(() => {});
    return Status.SUCCESS;
  });

  const seekShelter = new Action('seek_shelter', () => {
    bb.set('lastAction', 'seek_shelter');
    ctx.bot?.chat?.(ai.personality.getResponse('weather', { weatherType: 'storm' }));
    // Look around nervously
    actions.lookAround();
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
      // Look up at the sky while checking weather
      actions.lookAt(
        actions.getPosition().x,
        actions.getPosition().y + 20,
        actions.getPosition().z
      ).catch(() => {});
    }
    bb.set('lastAction', 'check_radio');
    return Status.SUCCESS;
  });

  const decidePlan = new Action('decide_plan', () => {
    bb.set('lastAction', 'decide_plan');
    return Status.SUCCESS;
  });

  const prepareGear = new Action('prepare_gear', async () => {
    ctx.bot?.chat?.('Getting my gear ready.');
    bb.set('lastAction', 'prepare_gear');
    const rod = ctx.bot?.inventory?.items()?.find(i => i.name.includes('fishing_rod'));
    if (rod) {
      await ctx.bot.equip(rod, 'hand');
    }
    return Status.SUCCESS;
  });

  const goFishing = new Action('go_fishing', async () => {
    // Never fish if script runner is active — it handles fishing
    if (ctx._scriptRunner?.isRunning) return Status.FAILURE;
    bb.set('_mcFishing', true);
    bb.set('lastAction', 'go_fishing');

    // Start fishing in background — don't await (BT can't block)
    ctx.bot.equip(ctx.bot.inventory.items().find(i => i.name.includes('fishing_rod')), 'hand').catch(() => {});
    
    ctx.bot.chat(pickRandom([
      "Lines in the water. Now we wait.",
      "Fishing. Don't jinx it.",
      "Here we go.",
    ]));

    // Look at nearest water
    try {
      const waterBlock = ctx.bot.findBlock({ matching: ctx.bot.registry.blocksByName.water?.id, maxDistance: 10 });
      if (waterBlock) ctx.bot.lookAt(waterBlock.position);
    } catch {}

    // Fish in background
    (async () => {
      try {
        if (ctx._mcFishing) {
          const result = await ctx._mcFishing.fishAsBot();
          if (result.caught) {
            ctx.bot.chat(pickRandom(["Got one!", "Fish on!", "That's what I'm talking about."]));
          } else {
            ctx.bot.chat(pickRandom(["Nothing biting.", "Dry run.", "Patience."]));
          }
        }
      } catch (e) {
        console.error('[goFishing]', e.message);
      } finally {
        bb.set('_mcFishing', false);
      }
    })();

    return Status.SUCCESS;
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
        // Celebrate: jump!
        actions.jump().catch(() => {});
      } else {
        ai.memory.addEpisode({ type: 'no_catch', tags: ['fishing'] });
        // Disappointed: shake head
        actions.shakeHead().catch(() => {});
      }
    } else {
      // While waiting: idle animations (look around, shift position)
      if (!bb.get('_idleTimer') || Date.now() - bb.get('_idleTimer') > 3000) {
        actions.lookAround();
        bb.set('_idleTimer', Date.now());
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
      // Nod approvingly
      actions.nod().catch(() => {});
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
      // Walk toward nearest player (simulate going to Ernie's)
      const player = actions.findNearestPlayer(16);
      if (player) {
        actions.lookAtEntity(player).catch(() => {});
      }
    }
    bb.set('lastAction', 'visit_ernies');
    return Status.SUCCESS;
  });

  const idleBehavior = new Action('idle', () => {
    // If script runner is active, do nothing — let scripts handle behavior
    if (ctx._scriptRunner?.isRunning) return Status.SUCCESS;
    if (!bb.get('_idleTimer') || Date.now() - bb.get('_idleTimer') > 3000) {
      // Actually perform visible idle animations
      actions.doIdleAction().catch(() => {});

      // Occasionally chat
      if (Math.random() < 0.15) {
        const phrases = [
          () => ctx.bot?.chat?.(ai.personality.getResponse('no_bites')),
          () => ctx.bot?.chat?.(pickRandom(["*adjusts gear*", "*watches the horizon*", "*checks lines*"])),
          () => {}, // silent
        ];
        pickRandom(phrases)();
      }
      bb.set('_idleTimer', Date.now());
    }
    return Status.RUNNING;
  });

  const sleep = new Action('sleep', () => {
    bb.set('lastAction', 'sleep');
    // Look down (sleeping pose)
    actions.crouch(5000).catch(() => {});
    return Status.SUCCESS;
  });

  // ── Build tree ─────────────────────────────────────────────
  const root = new Selector('root', [
    // SURVIVAL — highest priority (fight or flee)
    new Sequence('handle_creeper', [
      creeperNearby,
      fleeThreat,
    ]),
    new Sequence('handle_combat', [
      hostileNearby,
      new Condition('can_fight', () => !healthLow.check(bb)),
      combat,
    ]),
    new Sequence('handle_low_health_flee', [
      healthLow,
      hostileNearby,
      fleeThreat,
    ]),

    // Urgency (weather)
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
        new Condition('already_fishing', () => bb.get('_mcFishing')),
        new Sequence('start_fishing', [decidePlan, prepareGear, goFishing]),
      ]),
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

  async load(ctx) {
    // CRITICAL: Register SPAWN handler BEFORE any awaits.
    // The bot framework calls plugin.load() without await, then immediately
    // fires SPAWN. Any handler registered after the first await will miss it.
    const rconPort = parseInt(process.env.SERVER_PORT || '0') + 10000;
    ctx.events.on('SPAWN', () => {
      console.log(`[FishingPlugin] SPAWN handler fired for ${ctx.bot?.username} (RCON port ${rconPort})`);
      // Wrap bot.chat with a sliding window rate limiter (allows natural bursts, prevents spam)
      // - MAX_PER_WINDOW: 7 messages per 30 second window
      // - MAX_BURST: 3 messages per 3 second burst window
      if (ctx.bot && !ctx.bot._origChat) {
        const orig = ctx.bot.chat.bind(ctx.bot);
        const MAX_PER_WINDOW = 7;
        const WINDOW_MS = 30000; // 30 seconds
        const MAX_BURST = 3;
        const BURST_MS = 3000; // 3 seconds
        const timestamps = [];
        let pendingTimeout = null;

        ctx.bot._origChat = orig;
        ctx.bot.chat = (msg) => {
          const now = Date.now();

          // Prune timestamps older than 30 seconds
          while (timestamps.length > 0 && timestamps[0] < now - WINDOW_MS) {
            timestamps.shift();
          }

          // Check if we're at the per-window limit
          if (timestamps.length >= MAX_PER_WINDOW) {
            // Delay until oldest timestamp + window + buffer
            const oldestTimestamp = timestamps[0];
            const delay = (oldestTimestamp + WINDOW_MS + 100) - now;

            clearTimeout(pendingTimeout);
            pendingTimeout = setTimeout(() => {
              timestamps.push(now + delay);
              orig(msg);
            }, delay);
            return;
          }

          // Check burst: if 3+ messages in last 3 seconds, add delay
          const recentBurst = timestamps.filter(t => t >= now - BURST_MS).length;
          if (recentBurst >= MAX_BURST) {
            const delay = 500 + Math.random() * 1000; // 500-1500ms random delay

            clearTimeout(pendingTimeout);
            pendingTimeout = setTimeout(() => {
              timestamps.push(now + delay);
              orig(msg);
            }, delay);
            return;
          }

          // Send immediately
          timestamps.push(now);
          orig(msg);
        };
      }
      setTimeout(async () => {
        try {
          if (rconPort >= 30000) return;
          const rcon = await Rcon.connect({ host: 'localhost', port: rconPort, password: 'fishing42' });
          await rcon.send(`give ${ctx.bot?.username || '@p'} fishing_rod 3`);
          await rcon.send(`give ${ctx.bot?.username || '@p'} bread 32`);
          console.log(`[FishingPlugin] RCON supplies given to ${ctx.bot?.username}`);
          await rcon.end();
          if (ctx._equipper) setTimeout(() => ctx._equipper.equipAll(), 2000);
        } catch (e) {
          console.warn('[FishingPlugin] RCON supply failed:', e.message);
        }
      }, 5000);
    });

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

    // ── Comparative Evaluation System ──────────────────────
    const sessionRecorder = new SessionRecorder(dataDir);
    const comparativeEvaluator = new ComparativeEvaluator(dataDir);
    const scriptEvolver = new ScriptEvolver(dataDir);
    const decisionEngine = new DecisionEngine(comparativeEvaluator, sessionRecorder);

    ctx._ai = { memory, relationships, personality, schedule, skillLibrary, humanizer,
                 sessionRecorder, comparativeEvaluator, scriptEvolver, decisionEngine };

    // Track current session for recording
    ctx._liveSession = null;

    // Create WorldManager for Minecraft world integration
    try {
      const { WorldBuilder } = await import('./world-builder.js');
      const wb = new WorldBuilder(
        process.env.RCON_HOST || 'localhost',
        parseInt(process.env.RCON_PORT || '25575', 10),
        process.env.RCON_PASSWORD || 'craftmind'
      );
      await wb.connect();
      ctx._worldManager = new WorldManager(wb);
    } catch (err) {
      console.warn('[FishingPlugin] WorldManager init failed (non-fatal):', err.message);
      ctx._worldManager = null;
    }

    // ── Initialize Minecraft Fishing Bridge ──────────────────
    const mcFishing = new MinecraftFishing(ctx.bot, ctx._worldManager);
    ctx._mcFishing = mcFishing;
    try {
      await mcFishing.init();
    } catch (err) {
      console.warn('[FishingPlugin] MinecraftFishing init failed (non-fatal):', err.message);
    }

    // Create Actions instance for real mineflayer movements
    let actions = null;
    if (ctx.bot) {
      actions = new Actions(ctx.bot, humanizer);
      ctx._ai.actions = actions;
    }

    // ── Initialize Survival & Equipper ─────────────────────
    if (ctx.bot) {
      const survival = new Survival(ctx.bot);
      const equipper = new Equipper(ctx.bot);
      ctx._survival = survival;
      ctx._equipper = equipper;
      console.log('[FishingPlugin] Survival + Equipper modules loaded');
    }

    // ── Initialize Natural Language System ──────────────────
    const llmClient = ctx.options?.llmClient || ctx.bot?.craftmind?._brain || null;

    ctx._nlPlanner = new ActionPlanner(llmClient, {
      getGameState: () => {
        try {
          const s = game.getState();
          return {
            summary: `${s.weather.emoji || ''} ${s.weather.name || 'clear'}, ${s.tide.emoji || ''} ${s.tide.phase}, fishing: ${s.player.isFishing ? 'yes' : 'no'}, gold: $${s.player.gold}`,
          };
        } catch { return { summary: 'Game state unavailable' }; }
      },
      getPersonality: () => ({
        moodSnapshot: personality.mood?.snapshot?.(),
      }),
      getMemory: () => memory,
      getRelationships: () => relationships,
    });

    ctx._nlExecutor = new ActionExecutor(ctx.bot, humanizer, game, actions);
    ctx._nlExecutor.on({
      onChat: (msg) => ctx.bot?.chat?.(msg.slice(0, 256)),
      onError: (err, action) => {
        if (process.env.DEBUG_AI) console.error('[NL] Action error:', err.message, action?.type);
      },
      onComplete: () => {
        if (process.env.DEBUG_AI) console.log('[NL] Plan complete');
      },
    });

    // Build behavior tree (with actions wired in)
    const behaviorTree = buildBehaviorTree(ctx._ai, game, ctx, actions);
    ctx._ai.behaviorTree = behaviorTree;

    // ── Register commands ────────────────────────────────────
    for (const cmd of fishingCommands) {
      ctx.commands.register({
        ...cmd,
        execute(c, ...args) {
          cmd.execute({ ...c, _fishingGame: game, _ai: ctx._ai, _mcFishing, username: c.username }, ...args);
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
    ctx.registerMethod('getMinecraftFishing', () => mcFishing);

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

    // ── Stochastic Script Runner (replaces BT for natural behavior) ──
    let scriptRunner = null;
    let scriptRegistry = null;
    try {
      scriptRunner = new ScriptRunner(ctx.bot, {});

      // Load registry scripts (v1/v2/v3 from scripts/ directory)
      scriptRegistry = new ScriptRegistry();
      await scriptRegistry.loadAll();
      ctx._scriptRegistry = scriptRegistry;

      // Register all registry scripts with the runner
      const registryScripts = scriptRegistry.list();
      const hasV2Plus = registryScripts.some(e => e.filename?.match(/v[2-9]/) || (e.version || 1) >= 2);
      const preferredScript = process.env.CODY_SCRIPT || null;

      for (const entry of registryScripts) {
        const data = scriptRegistry.get(entry.name);
        if (data) {
          scriptRunner.register(new Script(entry.name, data.steps));
        }
      }

      // Only load legacy scripts if: no v2/v3 scripts exist AND no CODY_SCRIPT env var
      if (!hasV2Plus && !preferredScript) {
        const legacyScripts = createFishingScripts(ctx.bot);
        for (const s of legacyScripts) {
          if (!scriptRunner.scripts.has(s.name)) {
            scriptRunner.register(new Script(s.name, s.steps));
          }
        }
        console.log('[FishingPlugin] Loaded legacy scripts (no v2/v3 found)');
      } else {
        console.log(`[FishingPlugin] Using registry scripts only (${registryScripts.length} loaded)`);
      }

      // Start auto-run after 8 seconds (let BT handle initial survival setup)
      setTimeout(() => {
        if (ctx.bot?.entity) {
          // Check for pinned script from config/bot-assignments.json (highest priority for A/B testing)
          const pinnedScript = getPinnedScript(ctx.bot?.username);
          const selectedScript = pinnedScript || preferredScript || null;

          if (selectedScript && scriptRegistry.get(selectedScript)) {
            scriptRunner.switchToV1({ ...scriptRegistry.get(selectedScript), name: selectedScript });
            const source = pinnedScript ? 'pinned' : 'CODY_SCRIPT';
            console.log(`[FishingPlugin] Starting with script: ${selectedScript} (${source})`);
          } else if (selectedScript) {
            console.warn(`[FishingPlugin] Script "${selectedScript}" not found in registry, falling back to auto-run`);
            scriptRunner.startAutoRun(3000);
          } else {
            scriptRunner.startAutoRun(3000);
          }
          console.log('[FishingPlugin] Script runner started 🎲');
        }
      }, 8000);
      ctx._scriptRunner = scriptRunner;

      // ── Vision + Resilient Controller ─────────────────────
      const vision = new VisionSystem(ctx.bot);
      const resilient = new ResilientController(scriptRunner, vision);
      for (const es of EMERGENCY_SCRIPTS) {
        resilient.registerEmergencyScript(es);
      }
      // Check vision availability on startup
      vision.checkLocalVision().then(available => {
        console.log(`[Vision] Moondream/Ollama: ${available ? '✅ available' : '❌ unavailable (heuristic fallback)'}`);
      });
      ctx._vision = vision;
      ctx._resilient = resilient;
      // Resilient tick every 10s — catches stuck bots, API failures, safety issues
      const resilientLoop = setInterval(() => {
        resilient.tick().catch(() => {});
      }, 10000);
      console.log('[FishingPlugin] Resilient controller active 🛡️');

      // ── Stuck Detection System ─────────────────────────────
      const stuckDetector = new StuckDetector();
      ctx._stuckDetector = stuckDetector;

      // Track fish catches for stuck detection
      const originalRecordFish = scriptRunner?.recordFish;
      if (originalRecordFish) {
        scriptRunner.recordFish = function(...args) {
          stuckDetector.recordFish(scriptRunner.context?.fishCaught || 0);
          return originalRecordFish.apply(this, args);
        };
      }

      // Track chat messages for stuck detection
      ctx.events.on('CHAT', (username, message) => {
        if (username === (ctx.bot?.username || 'Cody')) return;
        stuckDetector.recordChat(message);
      });

      // Stuck detection check every 30s
      const stuckCheckLoop = setInterval(async () => {
        if (!ctx.bot?.entity) return;

        // Record current position
        const pos = ctx.bot.entity.position;
        stuckDetector.recordPosition({ x: pos.x, y: pos.y, z: pos.z });

        // Check if stuck
        const stuckInfo = stuckDetector.isStuck();
        if (stuckInfo) {
          console.log(`[StuckDetector] Level ${stuckInfo.level}: ${stuckInfo.reason}`);

          try {
            const rconPort = parseInt(process.env.SERVER_PORT || '0') + 10000;
            if (rconPort >= 30000) return;

            // Recovery actions based on level
            if (stuckInfo.level === 1) {
              // Level 1: Load random script
              console.log('[StuckDetector] Recovery Level 1: Loading random script');
              scriptRunner?.loadRandomScript?.();

            } else if (stuckInfo.level === 2) {
              // Level 2: Re-pathfind to water + RCON give fishing_rod
              console.log('[StuckDetector] Recovery Level 2: Re-pathfind to water + resupply');
              const rcon = await Rcon.connect({ host: 'localhost', port: rconPort, password: 'fishing42' });
              await rcon.send(`give ${ctx.bot?.username || '@p'} fishing_rod 3`);
              await rcon.end();

              // Pathfind to nearest water
              if (ctx.bot?.pathfinder) {
                const waterBlock = ctx.bot.findBlocks({
                  matching: ctx.bot.registry.blocksByName.water?.id,
                  maxDistance: 32,
                  count: 1
                })[0];
                if (waterBlock) {
                  ctx.bot.pathfinder.setGoal(new goals.GoalBlock(waterBlock.x, waterBlock.y, waterBlock.z));
                }
              }

            } else if (stuckInfo.level === 3) {
              // Level 3: TP to safe spawn, reset counter
              console.log('[StuckDetector] Recovery Level 3: TP to safe spawn + full reset');
              const rcon = await Rcon.connect({ host: 'localhost', port: rconPort, password: 'fishing42' });
              await rcon.send(`tp ${ctx.bot?.username || '@p'} 0 64 0`);
              await rcon.end();

              stuckDetector.reset();
              scriptRunner?.loadRandomScript?.();
            }
          } catch (e) {
            console.warn('[StuckDetector] Recovery failed:', e.message);
          }
        }
      }, 30000);
      this._stuckCheckLoop = stuckCheckLoop;
      console.log('[FishingPlugin] Stuck detector active 🔍');
    } catch (err) {
      console.warn('[FishingPlugin] Script runner init failed (non-fatal):', err.message);
    }

    // ── Telemetry Bridge (write stats every 60s) ────────────
    // Detect server from env (set by startup script) or bot options
    const serverPort = parseInt(process.env.SERVER_PORT) || ctx.bot?.options?.port || 0;
    const serverName = serverPort === 25566 ? 'Alpha' : serverPort === 25567 ? 'Beta' : serverPort === 25568 ? 'Gamma' : `port${serverPort}`;
    const telemetryLoop = setInterval(() => {
      if (!ctx.bot?.entity) return;
      const stats = {
        fishCaught: scriptRunner?.context?.fishCaught || 0,
        deaths: 0, // tracked externally from logs
        totalChats: ctx._ai?.memory?.working?.interactions || 0,
        uniqueChats: 0, // tracked externally from logs
        currentScript: scriptRunner?.currentScript || 'none',
        mood: scriptRunner?.mood?.mood?.toFixed(2) || '0.50',
        energy: scriptRunner?.mood?.energy?.toFixed(2) || '1.00',
        uptime: process.uptime(),
        server: serverName,
        timestamp: new Date().toISOString(),
      };
      try {
        (async () => {
          const fs = await import('node:fs');
          // Per-server stat file
          fs.writeFileSync(`/tmp/stats-${serverPort}.json`, JSON.stringify(stats, null, 2));
          // Also write combined for backward compat (last writer wins)
          fs.writeFileSync('/tmp/sim-stats.json', JSON.stringify(stats, null, 2));
        })();
      } catch {}
    }, 60000);
    this._telemetryLoop = telemetryLoop;

    // ── Spawn event ──────────────────────────────────────────
    ctx.events.on('SPAWN', () => {
      // TP to dock on respawn (prevent wandering into water/void)
      const pos = ctx.bot?.entity?.position;
      if (pos) {
        const distFromDock = Math.sqrt(pos.x ** 2 + pos.z ** 2);
        if (distFromDock > 30) {
          // Walk toward origin (dock area) instead of teleporting
          const navigator = ctx.bot?.pathfinder;
          if (navigator) {
            ctx.bot.setControlState('forward', false);
            ctx.bot.setControlState('sprint', false);
            ctx.bot.setControlState('jump', false);
          }
        }
      }
      memory.resetSession();
      schedule.resetDay();
      behaviorTree.reset();

      setTimeout(() => {
        const state = game.getState();
        ctx.bot?.chat?.(`🎣 Sitka Sound — ${state.weather.emoji || ''} ${state.weather.name || 'clear'}, ${state.tide.emoji || ''} ${state.tide.phase || 'tide unknown'}${state.weather.seaState > 3 ? '. Rough out there.' : ''}. Type !help for commands, or just talk to me.`);
      }, 3000 + Math.random() * 5000);
    });

    // ── Chat event: personality-driven responses + NL planning ─────────────
    ctx.events.on('CHAT', (username, message) => {
      if (username === (ctx.bot?.username || 'Cody')) return;

      // Look at the player who's talking
      if (actions && ctx.bot?.entity) {
        const player = actions.findNearestPlayer(32);
        if (player && player.username === username) {
          actions.lookAtEntity(player).catch(() => {});
        }
      }

      const rel = relationships.get(username);
      relationships.interact(username, 'chat');
      memory.addEpisode({ type: 'player_chat', data: { player: username, message }, tags: ['social'] });
      memory.updateWorking({ interactions: (memory.working.interactions || 0) + 1 });

      const lower = message.toLowerCase();

      // !commands are handled by command registry — skip NL processing
      if (lower.startsWith('!')) return;

      // ── Natural Language Processing ───────────────────────
      // Use ActionPlanner for non-command chat
      if (ctx._nlPlanner) {
        ctx._nlPlanner.plan(message, username).then(plan => {
          if (!plan) return;

          // Execute dialogue first (immediate chat response)
          if (plan.dialogue) {
            ctx.bot?.chat?.(plan.dialogue.slice(0, 256)); // MC chat limit
          }

          // Enqueue actions for execution
          if (plan.actions && plan.actions.length > 0 && ctx._nlExecutor) {
            ctx._nlExecutor.enqueue(plan.actions);
          }
        }).catch(err => {
          if (process.env.DEBUG_AI) console.error('[NL] Plan error:', err.message);
        });
      }
    });

    // ── Disconnect: save everything ──────────────────────────
    ctx.events.on('END', () => {
      memory.save();
      relationships.save();

      // ── Session Recording & Comparative Evaluation ─────
      const working = memory.working || {};
      const sessionData = {
        skill: working.lastSkill || 'troll-salmon',
        conditions: working.lastConditions || game.getConditions?.() || {},
        results: {
          catches: working.fishCaught || [],
          totalWeight: (working.fishCaught || []).reduce((s, f) => s + (f.weight || 0), 0),
          speciesCaught: [...new Set((working.fishCaught || []).map(f => f.species).filter(Boolean))],
        },
        outcome: working.fishCount > 3 ? 'success' : working.fishCount > 0 ? 'partial' : 'failure',
      };

      if (working.sessionStart) {
        sessionData.startTime = new Date(working.sessionStart).toISOString();
        sessionData.endTime = new Date().toISOString();
        sessionData.duration = (Date.now() - working.sessionStart) / 1000;
      }

      // Record session
      const sessionId = sessionRecorder.recordSession(sessionData);
      memory.addEpisode({ type: 'session_recorded', data: { sessionId } });

      // Run comparative evaluation
      try {
        const history = sessionRecorder.getAllSessions().filter(s => s.id !== sessionId);
        if (history.length > 0) {
          const evaluation = comparativeEvaluator.evaluate(sessionData, history);
          comparativeEvaluator.saveComparison(sessionId, evaluation);

          if (evaluation.insights.length > 0) {
            comparativeEvaluator.saveInsights(evaluation.insights);
            memory.addEpisode({ type: 'evaluation_insights', data: { insights: evaluation.insights, bestScript: evaluation.bestScript } });
          }

          // Trigger script evolution every 10 sessions
          if (sessionRecorder.sessionCount % 10 === 0 && ctx._nlPlanner?._llmClient) {
            const bestScript = evaluation.bestScript;
            scriptEvolver.evolve(bestScript, evaluation, { chat: (p) => ctx._nlPlanner._llmClient.chat(p) })
              .then(result => {
                if (result.evolved) {
                  memory.addEpisode({ type: 'script_evolved', data: result });
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        if (process.env.DEBUG_AI) console.error('[Eval] Error:', err.message);
      }

      // Legacy session analysis (backward compat)
      if (working.fishCount > 0) {
        const analysis = skillLibrary.analyzeSession({
          skillName: sessionData.skill,
          duration: sessionData.duration || 0,
          catch: working.fishCount,
          targetCatch: 10,
          conditions: sessionData.conditions,
        });
        memory.addEpisode({ type: 'session_end', data: { ...analysis, working } });
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
    clearInterval(this._telemetryLoop);
    if (this._ctx?._survival) this._ctx._survival.stop();
    if (this._ctx?._ai) {
      this._ctx._ai.memory.save();
      this._ctx._ai.relationships.save();
    }
    if (this._ctx?._nlExecutor) {
      this._ctx._nlExecutor.stop();
    }
    console.log('[FishingPlugin] Unloaded');
  },
};

export default fishingPlugin;

// ── Prevent silent exits from unhandled promise rejections ───────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[FishingPlugin] Unhandled rejection:', reason?.message || reason);
  // Don't call process.exit — let the bot keep running
});
