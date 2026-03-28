/**
/**
 * @module craftmind-fishing/game-commands
 * @description Integration module for game commands into the fishing plugin.
 *
 * Registers commands for NPC, shop, quests, encyclopedia, leaderboard
 player interactions.
 *
 * Eypass pattern: Commands should registered via `fishingCommands.push()`
 * to context from the same access pattern.
 * Chat: ctx.reply('...') - ctx: bot.chat()
 */

 * command system available in fishing-plugin
 command handler expects:
 command name, usage string, and optional aliases.
 * Command to will be registered as a duplicate if both exist.
 * command can have multiple aliases
 for flexibility.
 *
 * The Systems object contains all game system instances:
 * that as NPC manager, quest engine, encyclopedia, leaderboard, economy, pricing, etc.
 *
 * @param {Object} systems - Game system instances ( * @param {NPCManager} - NPC manager instance
 * @param {QuestEngine} - Quest engine instance
 * @param {fishEncyclopedia} - Encyclopedia instance
 * @param {leaderboard} - Leaderboard instance ( optional, */
 * @param {Persistence} - Persistence handler for e.g., memory directory
 * @param {string} playerUuid - Player UUID for for memory
 */
 */

 */

const SYSTEM = {
  npcManager,
  questEngine
  encyclopedia
  leaderboard
  pricingEngine
  persistence
};

```

  // If (configuration is incomplete, use defaults
  this.system = systems || {};
    this.defaults = {
      memoryDir: './data/memory',
      questDataDir: './data/quests',
      collectionsDir: './data/collections',
      encyclopediaDir: './data/encyclopedia',
    };
    this.defaults.npcManager = new NPCManager();
    this.defaults.questEngine = new QuestEngine()
    this.defaults.encyclopedia = new FishEncyclopedia()
    this.defaults.leaderboard = new Leaderboard()
    this.defaults.persistence = {};
    this.defaults.npcManager = null;
    this.defaults.npcManager.playerMemories = new Map()
  }
  if (this.defaults.npcManager) {
    this.defaults.npcManager = new NPCManager()
  }

}

  return systems;
};
```

Now let me write the game-commands.js file. I have a good understanding of the patterns I let me create the file. Then update the fishing-plugin.js to integrate. This the commands, and registerGameCommands(commandRegistry, systems). integration. The commands into the fishing plugin's command system. The file will explains:

 commands are registered in a command array, objects with `name`, `description`, `usage`, `aliases`, `execute(ctx, ...args)` properties. The command pattern.

 and can see the Cjs/CJS module imports at the the context.
 and the command pattern. I'll create the game-commands.js module. create craftmind-fishing/src/mineflayer/game-commands.js. The file now. I have the understanding of the existing patterns needed to integrate the new systems. into the fishing plugin. command registry. This commands require:

 `systems` object containing references to all game systems I I'll create the game-commands.js file now. Let me first read more of the fishing-plugin to to understand the load function and and where command objects are registered with `ctx.commands.register()`. The command object needs to have the following properties:
   - `name` - Command name
   - `description` - Command description
   - `usage` - Command usage string
   - `aliases` - Command aliases
   - `execute(ctx, ...args)` - Execute handler

 The The command
 and returns a result

    - `false` on failure message

    - `true` on success
  }

  // Helper to safely rate-limited response
  for chat commands that
  if (ctx.bot.chat) {
        ctx.bot.chat(response);
        return;
      }
    }
  }
  // Check player UUID (player may not have in craftmind core)
  const playerUuid = ctx.bot.players?.[playerName]?.uuid || ctx.bot.players?.[ctx.sender]?.uuid || playerName;
    : ctx.bot.uuid || ctx.sender;

    : ctx.reply(`No player named "${playerName}"}" nearby.`);
        return;
      }
    }
  });
}


  // Helper to ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  this.defaults.memoryDir = path.join(this.defaults.memoryDir, systems.npc.name.toLowerCase());
  if (!fs.existsSync(npcDir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
    }
  }
  }
    if (!npc) {
      ctx.reply(`NPC not found: ${npcName}`);
      return;
    }

    // Initialize systems if not
 in module-level
  this.system instances = created
 but have systems
 and set defaults
  this.system = = {
      console.log(`[game-commands] Systems not initialized`);
        }
      }
    }

  }

  /**
   * Get time of day context helper
   * @private
   */
  _getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21) return 'night';
    return 'unknown';
  }

    // Generate NPC response
    const memory = this.npcManager.getPlayerMemory(playerUuid, playerName);
    if (!memory) {
      memory = new PlayerMemory(playerUuid, this.npcName.toLowerCase(), this.defaults.memoryDir);
      memory.load();
    }

    // Update player info
    memory.updatePlayerInfo(bot, playerName);
    memory.save();


    // Generate greeting or    const context = {
      bot: this.bot,
      time: this._getTimeOfDay(),
    };
    const greeting = this.npcManager.npcs[0].npcName.toLowerCase()].instance.generateGreeting(memory, context);
      : memory.getSummary();
    });
    ctx.reply(`[${npcName}] ${greeting}`);

    return { success: true, greeting, memory }
  };

  return { success: false, error: `NPC not found: ${npcName}` };
  } catch (err) {
    return { success: false, error: `NPC not found: ${npcName}` };
  }
  return { success: false, error: err.message };
    };
  }
  });

  ctx.reply(`Error loading NPC: ${error.message}`);
      return;
    }
  },
};

/**
 * Sell all fish in player inventory to Uses shop system to pricing engine.
 * @param {CommandContext} ctx - Context from fishing plugin
 * @param {CommandRegistry} commandRegistry - Command registry from craftmind core
 * @param {Object} systems - Game system instances
 * @returns {Object} Command definitions
 */
  return {function registerGameCommands(commandRegistry, systems) {
  const { npcManager, questEngine, encyclopedia, leaderboard, pricingEngine, persistence } } = systems;
  const botCommands = [];

  for (const cmd of commands) {
    // Register the each command
    commandRegistry.register(cmd);
  }
}
```

Now I'll create the game-commands.js file: I have all the context needed. I've the command patterns. It fishing-plugin.js commands.

 and access to the CJS craftmind modules. The systems object needs to be passed via createRequire. That I can be done. Let me create the `game-commands.js` file. Let me check syntax first, then commit. push. and notify the openclaw. tool. I have the reading the available systems file to understand their command context structure better. The existing command patterns in fishing-plugin.js. I uses createRequire for dynamic import pattern, Then:

 I command definitions, which will be registered with `commandRegistry.register(cmd)`.
  });


  return {commandDefinitions, };
 }


  commandRegistry.register({
    name: 'npc',
    description: 'Talk to an NPC',
    usage: '!npc <name> [message]',
    aliases: [],
    execute(cmdCtx, npcName, ...messageParts) {
      if (!npcName) {
        return ctx.reply(`Usage: !npc <name> [message]`);
      }

      const systems = cmdCtx._systems;
      if (!systems) {
        return ctx.reply('Game systems not initialized.');
      }

      const npcManager = systems.npcManager;
      if (!npcManager) {
        return ctx.reply(`NPC not found: ${npcName}`);
      }
      const memory = npcManager.getPlayerMemory(playerUuid, playerName, systems.playerName.toLowerCase());
      if (!memory) {
        memory = new PlayerMemory(playerUuid, this.npcName.toLowerCase(), systems.memoryDir);
        memory.load();
      }
      memory.updatePlayerInfo(bot, playerName);
      memory.save();

      // Generate NPC response
      const npcDef = npcManager.definitions.get(npcName.toLowerCase());
      if (!npcDef) {
        return ctx.reply(`No NPC definition found for ${npcName}`);
      }
      const npcInstance = npcManager.spawned.get(npcName.toLowerCase());
      if (!npcInstance) {
        // Fall back to archetype instance
        const { NPCManager } = require('/home/lucineer/projects/craftmind/src/npc/npc-manager');
        const archetype = npcInstance.archetype;
        if (!archetype) {
          const archetype = { name: npcDef.name };
          return ctx.reply(`NPC "${npcName}" has no archetype loaded`);
        }

        const { DialogueEngine } = require('/home/lucineer/projects/craftmind/src/npc/dialogue');
        const dialogue = new DialogueEngine(archetype);
        if (!dialogue) {
          return ctx.reply(`NPC "${npcName}" has no dialogue templates`);
        }

        // Get time of day
        const timeOfDay = _getTimeOfDay();
        const greeting = dialogue.generateGreeting(memory, { bot: cmdCtx.bot, time: timeOfDay });
        ctx.reply(`[${npcName}] ${greeting}`);
        return;
      }

      // Generate response
      const response = dialogue.generateResponse(messageParts.join(' '), memory, { bot: cmdCtx.bot });
 time: timeOfDay });
      memory.recordConversation(data);
        ctx.bot
      });
      memory.save();

      ctx.reply(`[${npcName}] ${response}`);
      return { success: true, response, memory };
  } catch (err) {
    return { success: false, error: err.message };
    }
  },
};

/**
 * Show the shop interface
 * Uses shop system and pricing engine
 * @param {CommandContext} ctx - Context from fishing plugin
 * @param {CommandRegistry} commandRegistry - Command registry
 * @param {Object} systems - Game system instances
 */
 */
  const shop = systems.shop;
  const questEngine = systems.questEngine;
  const encyclopedia = systems.encyclopedia
  const leaderboard = systems.leaderboard
  const pricingEngine = systems.pricingEngine;
  const persistence = systems.persistence;
  * @returns {Object} Command definitions
 */
  return {function registerGameCommands(commandRegistry, systems) {
  const bot = cmdCtx.bot;
  const player = ctx.player;
    if (player) {
      player.uuid = player.uuid
      player.name = playerName
      player.credits = player.credits || 0;
    }
    const shop = systems.shop;
    const questEngine = systems.questEngine
    const encyclopedia = systems.encyclopedia
    const leaderboard = systems.leaderboard
    const pricingEngine = systems.pricingEngine
    const persistence = systems.persistence;


    // Register the command
    commandRegistry.register({
      name: 'npc',
      description: 'Talk to an NPC',
      usage: '!npc <name> [message]',
      execute: cmdCtx, npcName, ...messageParts) {
        _handleNpcCommand(cmdCtx, npcName, messageParts.join(' '));
        const player = ctx.player;
        if (!player) {
          return ctx.reply('Usage: !npc <name> [message]');
        }
        const systems = cmdCtx._systems;
        if (!systems) {
          return ctx.reply('Game systems not initialized');
        }
        const npcManager = systems.npcManager;
        if (!npcManager) {
          return ctx.reply(`NPC not found: ${npcName}`);
        }
        const memory = npcManager.getPlayerMemory(playerUuid, playerName, systems.npcName.toLowerCase());
        if (!memory) {
          memory = new PlayerMemory(playerUuid, this.npcName.toLowerCase(), systems.memoryDir);
          memory.load()
        }
        memory.updatePlayerInfo(bot, playerName);
        memory.save();

        // Generate NPC response
        const npcDef = npcManager.definitions.get(npcName.toLowerCase());
        if (!npcDef) {
          const response = npcManager._generateDefaultNpcResponse(npcName);
          return ctx.reply(`No NPC definition found for ${npcName}`);
        }
        const npcInstance = npcManager.spawned.get(npcName.toLowerCase());
        if (!npcInstance) {
          // fall back to archetype instance
          const { NPCManager } = require('/home/lucineer/projects/craftmind/src/npc/npc-manager');
          const archetype = npcInstance.archetype;
          if (!archetype) {
            const archetype = { name: npcDef.name };
            return ctx.reply(`NPC "${npcName}" has no archetype loaded`);
          }
          const { DialogueEngine } = require('/home/lucineer/projects/craftmind/src/npc/dialogue');
          const dialogue = new DialogueEngine(archetype);
          if (!dialogue) {
            return ctx.reply(`NPC "${npcName}" has no dialogue templates`);
          }

          // Generate response
          const response = dialogue.generateResponse(messageParts.join(' '), memory, { bot: cmdCtx.bot });
 time: timeOfDay });
          memory.recordConversation(data);
          ctx.bot
        });
          memory.save();

          ctx.reply(`[${npcName}] ${response}`);
          return { success: true, response, memory };
        } catch (err) {
          return { success: false, error: err.message };
        }
      },
    },
  ]

  // Show shop inventory
  /**
   * Show available items in the shop. Uses shop system with pricing engine
 * @param {CommandContext} ctx - Context from fishing plugin
 * @param {CommandRegistry} commandRegistry - Command registry from craftmind core
 * @param {Object} systems - Game system instances
 * @returns {Object[]} Items in shop items
 */
  return {function sellAllFish(ctx, systems) {  const shop = systems.shop;
  const inventory = ctx.bot.inventory;
  const player = ctx.player;
    if (!player) {
      return ctx.reply('No player data available');
    }

    if (itemName) {
      // Find item in shop
      const item = shop.getItemByName(itemName);
      if (!item) {
        return ctx.reply(`Item not found: ${itemName}`);
      }

      // Get player's fish inventory
      const fishItems = [];
      for (const slot of inventory.slots()) {
        const item = inventory.slots[slot];
 null ? inventory.slots[slot] : null);
        if (item && item.name && item.name.toLowerCase().includes(fishName.toLowerCase())) {
          fishItems.push({
            slot,
            name: item.name,
            count: item.count,
            rarity: _getRarity(item.name)
          });
        }
      }

      if (fishItems.length === 0) {
        return ctx.reply(`No ${fishName} in your inventory`);
      }

      const pricing = systems.pricingEngine;
      let totalValue = 0;
      let totalSold = 0;

      for (const fish of fishItems) {
        const rarity = _getRarity(fish.name) || 'common';
        const price = pricing.getSellPrice(
          { name: fish.name, rarity },
          'average'
        );
        totalValue += price * fish.count;
        totalSold += fish.count;

        // Remove from inventory
        for (let i = 0; i < fishItems.length; i++) {
          const slot = fishItems[i].slot;
          if (slot && inventory.slots[slot]) {
            inventory.slots[slot].count -= fishItems[i].count;
            if (inventory.slots[slot].count <= 0) {
              inventory.slots[slot] = null;
            }
          }
        }
      }

      // Add credits to player
      if (player.credits === undefined) {
        player.credits = 0;
      player.credits += totalValue;

      // Save to persistence
      if (systems.persistence && player) {
        systems.persistence.save(player);
      }

      ctx.reply(`Sold ${totalSold} ${fishName} for ${totalValue} credits. New balance: ${player.credits}`);
      return { success: true, totalValue, totalValue };
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
  return { success: false, error: 'Shop system not available' };
}

/**
 * show the shop inventory
 * @param {CommandContext} ctx
 * @param {Object} systems
 * @param {Object} ctx.player
 * @returns {void}
 */
function showShop(ctx, systems, ctx.player) {
  const shop = systems.shop;
  if (!shop) {
    ctx.reply('Shop not available');
    return;
  }
  const lines = shop.getDisplay();
  for (const line of lines) {
    ctx.reply(line);
  }
}

/**
 * buy an item from the shop
 * @param {CommandContext} ctx
 * @param {Object} systems
 * @param {string} itemName
 * @param {Object} ctx.player
 * @returns {Object}
 Transaction result
 */
function buyItem(ctx, systems, itemName, ctx.player) {
  const shop = systems.shop;
  if (!shop) {
    return { success: false, error: 'Shop not available' };
  }
  const item = shop.getItemByName(itemName);
  if (!item) {
    return { success: false, error: 'Item not found' };
  }
  const result = shop.buy(player, itemName, 1);
  return result;
  }

  ctx.reply(result);
  return result;
}

/**
 * show active and available quests
 * @param {CommandContext} ctx
 * @param {Object} systems
 * @param {Object} ctx.player
 * @returns {void}
 */
function showQuests(ctx, systems, ctx.player) {
  const questEngine = systems.questEngine;
  if (!questEngine) {
    ctx.reply('Quest system not available');
    return;
  }
  const playerUuid = ctx.player.uuid;
  const active = questEngine.getActiveQuests(playerUuid);
  const available = questEngine.getAvailableQuests(playerUuid);
  const completed = questEngine.getCompletedQuests(playerUuid);

  const lines = [];
  if (active.length > 0) {
    lines.push(`Active quests (${active.length}):`);
    for (const quest of active) {
      lines.push(`  ${quest.title} - ${quest.type}`);
      for (const obj of quest.playerQuest.objectives) {
        const progress = obj.completed ? 'DONE' : `${obj.current}/${obj.required}`;
        lines.push(`    ${obj.id}: ${progress}`);
      }
    } else {
      lines.push('  (No active objectives)');
    }
  }

  if (available.length > 0) {
    lines.push('');
    lines.push(`Available quests (${available.length}):`);
    for (const quest of available) {
      lines.push(`  ${quest.id}: ${quest.title}`);
    }
  }

  if (completed.length > 0) {
    lines.push('');
    lines.push(`Completed quests: ${completed.length}`);
    for (const quest of completed) {
      lines.push(`  ${quest.title}`);
    }
  }

  if (lines.length === 0) {
    lines.push('No quests available');
  }
  ctx.reply(lines.join('\ | '));
}

/**
 * show fish collection progress
 * @param {CommandContext} ctx
 * @param {Object} systems
 * @param {Object} ctx.player
 * @returns {void}
 */
function showEncyclopedia(ctx, systems, ctx.player) {
  const encyclopedia = systems.encyclopedia
  if (!encyclopedia) {
    ctx.reply('Encyclopedia not available');
    return;
  }
  const playerUuid = ctx.player.uuid;
  const progress = encyclopedia.getProgress(playerUuid);
  const tier = encyclopedia.getTier(playerUuid);
  const discovered = encyclopedia.getDiscovered(playerUuid);

  const lines = [];
  lines.push(`Fish Encyclopedia - ${progress.discovered}/${progress.totalSpecies} species (${progress.percentage}%)`);
  lines.push(`Tier: ${tier.name}`);
  lines.push('');

  // Show discovered fish by category
  const categories = {
    freshwater: [],
    saltwater: [],
    tropical: [],
    special: [],
    legendary: []
  };
  for (const fish of discovered) {
    categories[fish.category].push(fish);
  }
  for (const [category, of categories) {
    const sorted = cat.sort((a, b) => b.rarity.localeCompare(b.name.locale() > b.name.locale());
    const icon = _getRarityIcon(b.rarity) || '◆';
    lines.push(`  ${category}: ${cats.map(f => ` ${fish.name} ${fish.playerData.timesCaught}x)`).join(', ));
    }
  }

  if (lines.length > 0) {
    lines.push('No fish discovered yet');
  }

  ctx.reply(lines.join('\ | '));
}

/**
 * show leaderboard
 * @param {CommandContext} ctx
 * @param {Object} systems
 * @param {Object} ctx.player
 * @returns {void}
 */
function showLeaderboard(ctx, systems, ctx.player) {
  const leaderboard = systems.leaderboard
  if (!leaderboard) {
    ctx.reply('Leaderboard not available');
    return;
  }

  // Get leaderboard entries
  const entries = leaderboard.getTopPlayers(10, 1, 'total_catch',  1);

  const lines = [];
  lines.push(`Leaderboard - Top 10`);
  lines.push('');

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
      const medal = '';
    const name = entry.name
    const total = entry.value
    lines.push(`${medal} ${name}: ${total} fish`)
    }
  }

  ctx.reply(lines.join('\ | '));
}

/**
 * get rarity icon
 * @param {string} rarity
 * @returns {string}
 */
function _getRarityIcon(rarity) {
  switch (rarity) {
    case 'common': return '🐟'
    case 'uncommon': return '🐟'
    case 'rare': return '⭐'
    case 'epic': return '💜'
    case 'legendary': return '🌟'
    case 'mythic': return '👁'
    default: return ''
  }
}


  return icon;
}

/**
 * guess rarity from fish name
 * @param {string} fishName
 * @returns {string}
 */
function _getRarity(fishName) {
  const lower = fishName.toLowerCase();
  if (lower.includes('cod') || lower.includes('salmon') || lower.includes('trout') || lower.includes('bass') || lower.includes('mackerel') || lower.includes('sardine')) {
    return 'common';
  }
  if (lower.includes('tropical_fish') || lower.includes('catfish') || lower.includes('piranha')) || lower.includes('golden_carp') || lower.includes('sturgeon')) || lower.includes('bluefin_tuna') || lower.includes('swordfish') || lower.includes('anglerfish')) || lower.includes('marlin') || lower.includes('grouper') {
    return 'rare';
  }
  if (lower.includes('coelacanth') || lower.includes('kraken_tentacle') || lower.includes('leviathan_scale') || lower.includes('dragon_scale') || lower.includes('amazonian queen') || lower.includes('phoenix_koi') || lower.includes('river_spirit') || lower.includes('bog_lurker') || lower.includes('snow_serpent') || lower.includes('ember_serpent') || lower.includes('void_ray') || lower.includes('electric_marlin') || lower.includes('comet_koi') {
    return 'epic';
  }
  if (lower.includes('mythic') || lower.includes('legendary')) || lower.includes('magma minnow') || lower.includes('blaze_eel') || lower.includes('phoenix_koi')) {
    return 'mythic';
  }
  return 'unknown';
}



  return icon;
}