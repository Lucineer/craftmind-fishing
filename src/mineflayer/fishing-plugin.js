/**
 * @module craftmind-fishing/mineflayer-plugin
 * @description CraftMind Core plugin that bridges the fishing game engine
 * to a Mineflayer bot with commands, state machine, inventory hooks, and world awareness.
 *
 * Usage:
 *   const fishingPlugin = require('craftmind-fishing/src/mineflayer/fishing-plugin.cjs');
 *   // or as ESM:
 *   import fishingPlugin from './src/mineflayer/fishing-plugin.js';
 *
 *   createBot({ plugins: [fishingPlugin], ... });
 */

import { SitkaFishingGame, METHOD_BIOME_RULES } from '../integration/game-engine.js';

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

      // Find best method for biome
      const method = methodArg || _bestMethod(biome, game);
      if (!method) return ctx.reply("No viable fishing method here. Try !weather to check conditions.");

      const result = game.startFishing(method);
      if (result.success) {
        ctx.bot.craftmind._stateMachine?.transition('CASTING', { method });
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
      const lines = [
        `${state.weather.emoji || ''} ${state.weather.name || state.weather.type}`,
        `${state.tide.emoji || ''} Tide: ${state.tide.level.toFixed(1)}ft ${state.tide.direction}`,
        `Bite mult: ${state.weather.biteMultiplier}x`,
        `Fishing: ${state.player.isFishing ? '🎯 Active' : '❌ Idle'}`,
        `Gold: $${state.player.gold} | Fish in hold: ${state.player.inventory}`,
        `Species caught: ${state.player.statistics.speciesCaught.length}`,
        `Total caught: ${state.player.statistics.totalFishCaught}`,
      ];
      ctx.reply(lines.join(' | '));
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

      if (arg === 'all') {
        const results = game.sellAllFish();
        if (results.length === 0) return ctx.reply('Nothing to sell.');
        const total = results.reduce((s, r) => s + (r.gold || 0), 0) - (results.length > 0 ? game.player.gold - results[results.length - 1]?.gold : 0);
        ctx.reply(`💰 Sold ${results.length} fish for $${game.player.gold}`);
      } else {
        // Sell first fish
        const fish = game.player.inventory[0];
        if (!fish) return ctx.reply('No fish to sell.');
        const result = game.sellFish(fish.speciesId, fish.weight);
        ctx.reply(result.message);
      }
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
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function _detectBiome(ctx) {
  const world = ctx.bot?.craftmind?._world;
  if (!world) return null;

  // Use blockUnder and nearWater as heuristic
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

// ── Plugin definition ─────────────────────────────────────────────────────────

const fishingPlugin = {
  name: 'fishing',
  version: '1.0.0',
  provides: ['fishing', 'game-engine'],

  load(ctx) {
    // Create the game engine instance
    const game = new SitkaFishingGame();
    game.init({ name: ctx.bot?.username || 'Captain' });

    // Store reference on context
    ctx._fishingGame = game;

    // Register fishing commands
    for (const cmd of fishingCommands) {
      ctx.commands.register({
        ...cmd,
        execute(c, ...args) {
          cmd.execute({ ...c, _fishingGame: game }, ...args);
        },
      });
    }

    // Register fishing states in state machine
    if (ctx.stateMachine) {
      ctx.stateMachine.registerState('CASTING', {
        from: ['IDLE', 'FISHING', 'LANDING'],
        timeout: 300_000, // 5 min timeout
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

    // Inventory hook: track fish
    ctx.addInventoryHook('fish', {
      itemPattern: /fish|salmon|cod|halibut|crab|shrimp|rockfish|trout|char/,
      onCollect(item) {
        game.player.statistics.totalFishCaught++;
      },
    });

    // Inventory hook: track gear usage
    ctx.addInventoryHook('fishing_gear', {
      itemPattern: /fishing_rod|hook|bait|net|line/,
    });

    // World awareness: sync biome to game engine
    if (ctx.bot?.craftmind?._world) {
      ctx.events.on('SPAWN', () => {
        const biome = _detectBiome(ctx);
        if (biome) game.player.location.biome = biome;
      });
    }

    // Add prompt fragment for LLM brain
    ctx.addPromptFragment('fishing', `
You are an expert Alaska fisherman in Sitka Sound. You know salmon trolling, halibut longlining,
crab potting, river fishing, and more. The current game world has weather, tides, a market economy,
and NPCs (Ernie at the bar, Old Thomas the Tlingit elder, Mary the harbormaster).
Use !fish to cast, !reel to haul back, !check for status, !sell to sell fish, !weather for conditions.
Speak with knowledge about Alaska fishing, respect for the sea, and Tlingit cultural traditions.
Keep responses short and in-character.`, 10);

    // Register game engine as a bot method
    ctx.registerMethod('getFishingGame', () => game);

    // Start game engine update loop
    const gameLoop = setInterval(() => {
      if (ctx.bot?.entity) {
        game.update(5000); // 5-second ticks
      }
    }, 5000);

    // Store for cleanup
    this._gameLoop = gameLoop;
    this._game = game;

    // Spawn event: welcome
    ctx.events.on('SPAWN', () => {
      setTimeout(() => {
        const state = game.getState();
        ctx.bot?.chat?.(`🎣 Sitka Sound — ${state.weather.emoji || ''} ${state.weather.name || 'clear'}, ${state.tide.emoji || ''} ${state.tide.phase || 'tide unknown'}. Type !help for fishing commands.`);
      }, 3000);
    });

    // Chat context: respond to fishing-related chat
    ctx.events.on('CHAT', (username, message) => {
      const lower = message.toLowerCase();
      const fishingWords = ['fish', 'catch', 'salmon', 'halibut', 'crab', 'tide', 'weather', 'ocean', 'sea', 'rod', 'bait'];
      if (fishingWords.some(w => lower.includes(w)) && !lower.startsWith('!')) {
        // Let the brain handle it naturally — the prompt fragment above guides it
      }
    });

    console.log('[FishingPlugin] Loaded — Sitka Sound fishing ready 🎣');
  },

  unload() {
    if (this._gameLoop) clearInterval(this._gameLoop);
    console.log('[FishingPlugin] Unloaded');
  },
};

export default fishingPlugin;
