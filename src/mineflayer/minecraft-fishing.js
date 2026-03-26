/**
 * @module craftmind-fishing/mineflayer/minecraft-fishing
 * @description Bridges real Minecraft fishing mechanics (both bot and player)
 * to the scoreboard-based money/shop system.
 *
 * Uses mineflayer's built-in bot.fish() for Cody, and detects player fish
 * catches via the playerCollect event + item entity monitoring.
 */

import { Rcon } from 'rcon-client';

// ── Minecraft item → game species mapping ─────────────────────────────────────
const ITEM_SPECIES_MAP = {
  cod:          { speciesId: 'pacific_cod',    name: 'Pacific Cod',          basePrice: 8 },
  salmon:       { speciesId: 'coho_salmon',     name: 'Coho Salmon',         basePrice: 25 },
  tropical_fish:{ speciesId: 'rockfish',        name: 'Rockfish',            basePrice: 15 },
  pufferfish:   { speciesId: 'pufferfish',      name: 'Pufferfish',          basePrice: 10 },
  // Custom named items from the game (via anvil or commands)
  // These are detected by custom name matching
};

// Weight ranges by species (lbs)
const WEIGHT_RANGES = {
  king_salmon:         { min: 10, max: 60 },
  coho_salmon:         { min: 4, max: 20 },
  sockeye_salmon:      { min: 3, max: 12 },
  pink_salmon:         { min: 2, max: 8 },
  chum_salmon:         { min: 3, max: 15 },
  halibut:             { min: 15, max: 200 },
  pacific_cod:         { min: 2, max: 15 },
  sablefish:           { min: 5, max: 30 },
  lingcod:             { min: 5, max: 40 },
  yelloweye_rockfish:  { min: 3, max: 15 },
  rockfish:            { min: 1, max: 8 },
  pufferfish:          { min: 1, max: 5 },
};

const SHOP_ITEMS = {
  fishing_rod:     { name: 'Fishing Rod',     price: 10,  command: 'give {player} fishing_rod' },
  iron_fishing_rod:{ name: 'Iron Fishing Rod', price: 50,  command: 'give {player} fishing_rod' },
  luck_of_the_sea: { name: 'Luck of the Sea (enchant book)', price: 200, command: 'enchant {player} fishing_rod luck_of_the_sea 3' },
  lure:            { name: 'Lure (enchant book)',           price: 150, command: 'enchant {player} fishing_rod lure 3' },
  cooked_cod:      { name: 'Cooked Cod',     price: 3,  command: 'give {player} cooked_cod 3' },
  boat:            { name: 'Boat',            price: 30,  command: 'give {player} oak_boat' },
  name_tag:        { name: 'Name Tag',        price: 20,  command: 'give {player} name_tag' },
};

function randomWeight(speciesId) {
  const range = WEIGHT_RANGES[speciesId] || { min: 1, max: 5 };
  return Math.round((range.min + Math.random() * (range.max - range.min)) * 10) / 10;
}

function randomVariety() {
  // Sometimes give a rarer species
  const roll = Math.random();
  if (roll < 0.05) return ITEM_SPECIES_MAP.salmon; // 5% coho
  if (roll < 0.15) return ITEM_SPECIES_MAP.tropical_fish; // 10% rockfish
  if (roll < 0.20) return ITEM_SPECIES_MAP.pufferfish; // 5% pufferfish
  return ITEM_SPECIES_MAP.cod; // 80% cod
}

export class MinecraftFishing {
  /**
   * @param {import('mineflayer').Bot} bot
   * @param {object} worldManager - The WorldManager with RCON access
   */
  constructor(bot, worldManager) {
    this.bot = bot;
    this.wm = worldManager;
    this.rcon = worldManager?.rcon || null;
    this._fishing = false;
    this._fishCount = 0;
    this._playerCatchCooldowns = new Map(); // prevent double-counting
  }

  async init() {
    // Set up scoreboard objectives via RCON
    if (!this.rcon?.rcon) {
      console.warn('[MinecraftFishing] No RCON connection - scoreboard unavailable');
      return;
    }

    try {
      await this._rconCmd('scoreboard objectives add fishmoney dummy "🐟 Fishing Money $"');
    } catch { /* already exists */ }
    try {
      await this._rconCmd('scoreboard objectives add fishcaught dummy "🎣 Fish Caught"');
    } catch { /* already exists */ }
    try {
      await this._rconCmd('scoreboard objectives add fishlevel dummy "⭐ Fish Level"');
    } catch { /* already exists */ }

    await this._rconCmd('scoreboard objectives setdisplay sidebar fishmoney');
    console.log('[MinecraftFishing] Scoreboard initialized ✓');

    // ── Detect player fishing catches ─────────────────────────
    // When any player collects a fish item entity
    this.bot.on('playerCollect', (collector, collectedEntity) => {
      if (!collectedEntity || collector.username === this.bot.username) return;

      const itemName = collectedEntity.name?.replace('minecraft:', '');
      const mapping = ITEM_SPECIES_MAP[itemName];

      if (mapping) {
        // Cooldown to prevent double-counting
        const lastTime = this._playerCatchCooldowns.get(collector.username) || 0;
        if (Date.now() - lastTime < 1000) return;
        this._playerCatchCooldowns.set(collector.username, Date.now());

        const weight = randomWeight(mapping.speciesId);
        const money = Math.round(weight * mapping.basePrice * 0.5);

        this._awardCatch(collector.username, mapping.speciesId, mapping.name, weight, money);
      }
    });

    // ── Also detect when Cody catches fish ────────────────────
    this.bot.on('playerCollect', (collector, collectedEntity) => {
      if (!collectedEntity || collector.username !== this.bot.username) return;

      const itemName = collectedEntity.name?.replace('minecraft:', '');
      const mapping = ITEM_SPECIES_MAP[itemName];

      if (mapping) {
        const lastTime = this._playerCatchCooldowns.get(this.bot.username) || 0;
        if (Date.now() - lastTime < 1000) return;
        this._playerCatchCooldowns.set(this.bot.username, Date.now());

        const weight = randomWeight(mapping.speciesId);
        const money = Math.round(weight * mapping.basePrice * 0.5);

        this._awardCatch(this.bot.username, mapping.speciesId, mapping.name, weight, money);
      }
    });
  }

  async _awardCatch(username, speciesId, speciesName, weight, money) {
    // Award via scoreboard
    try {
      await this._rconCmd(`scoreboard players add "${username}" fishmoney ${money}`);
      await this._rconCmd(`scoreboard players add "${username}" fishcaught 1`);
    } catch (err) {
      console.error('[MinecraftFishing] RCON error:', err.message);
    }

    // Announce in chat
    const msg = `🎣 ${username} caught a ${weight} lb ${speciesName}! (+$${money})`;
    this.bot.chat(msg);

    this._fishCount++;
    return { speciesId, speciesName, weight, money };
  }

  async _rconCmd(cmd) {
    if (!this.rcon?.rcon) return null;
    return this.rcon.send(cmd);
  }

  /**
   * Make Cody fish using mineflayer's built-in bot.fish().
   * @returns {Promise<{success: boolean, catch?: object}>}
   */
  async fishAsBot() {
    if (this._fishing) return { success: false, message: 'Already fishing.' };

    // Check if holding a fishing rod
    const held = this.bot.heldItem;
    if (!held || !held.name.includes('fishing_rod')) {
      // Try to equip one
      const rod = this.bot.inventory.items().find(i => i.name.includes('fishing_rod'));
      if (rod) {
        await this.bot.equip(rod, 'hand');
      } else {
        return { success: false, message: 'No fishing rod!' };
      }
    }

    this._fishing = true;
    try {
      // Track inventory before
      const fishBefore = this.bot.inventory.items().filter(i =>
        ['cod', 'salmon', 'tropical_fish', 'pufferfish', 'cooked_cod', 'raw_cod', 'raw_salmon'].includes(i.name.replace('minecraft:', ''))
      ).reduce((s, i) => s + i.count, 0);

      await this.bot.fish();

      // Track inventory after
      const fishAfter = this.bot.inventory.items().filter(i =>
        ['cod', 'salmon', 'tropical_fish', 'pufferfish', 'cooked_cod', 'raw_cod', 'raw_salmon'].includes(i.name.replace('minecraft:', ''))
      ).reduce((s, i) => s + i.count, 0);

      const caught = fishAfter - fishBefore;
      if (caught > 0) {
        const mapping = randomVariety();
        const weight = randomWeight(mapping.speciesId);
        const money = Math.round(weight * mapping.basePrice * 0.5);
        this._awardCatch(this.bot.username, mapping.speciesId, mapping.name, weight, money);
        return { success: true, caught: true, species: mapping.name, weight, money };
      }
      return { success: true, caught: false, message: 'No bite this time.' };
    } catch (err) {
      return { success: false, caught: false, message: err.message };
    } finally {
      this._fishing = false;
    }
  }

  // ── Shop Commands ──────────────────────────────────────────────────────────

  async showShop(username) {
    const lines = ['=== 🏪 Cody\'s Tackle Shop ==='];
    for (const [id, item] of Object.entries(SHOP_ITEMS)) {
      lines.push(`  ${id}: ${item.name} — $${item.price}`);
    }
    lines.push('Use: !buy <item_id>');
    this.bot.chat(lines.join(' | '));
  }

  async buyItem(username, itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) {
      this.bot.chat(`Unknown item: ${itemId}. Type !shop to see what's available.`);
      return;
    }

    // Check balance
    let balance = 0;
    try {
      const result = await this._rconCmd(`scoreboard players get "${username}" fishmoney`);
      // Parse: "score has X points"
      const match = result?.match(/has\s+(\d+)/);
      balance = match ? parseInt(match[1]) : 0;
    } catch { balance = 0; }

    if (balance < item.price) {
      this.bot.chat(`${username}: Need $${item.price}, you have $${balance}.`);
      return;
    }

    // Deduct and give
    try {
      await this._rconCmd(`scoreboard players remove "${username}" fishmoney ${item.price}`);
      const cmd = item.command.replace('{player}', username);
      await this._rconCmd(cmd);
      this.bot.chat(`${username} bought ${item.name} for $${item.price}. Enjoy! 🎣`);
    } catch (err) {
      this.bot.chat(`Shop error: ${err.message}`);
      // Refund
      await this._rconCmd(`scoreboard players add "${username}" fishmoney ${item.price}`).catch(() => {});
    }
  }

  async showBalance(username) {
    let money = 0;
    let caught = 0;
    try {
      const m = await this._rconCmd(`scoreboard players get "${username}" fishmoney`);
      const mm = m?.match(/has\s+(\d+)/);
      money = mm ? parseInt(mm[1]) : 0;
    } catch { /* no score yet */ }
    try {
      const c = await this._rconCmd(`scoreboard players get "${username}" fishcaught`);
      const cm = c?.match(/has\s+(\d+)/);
      caught = cm ? parseInt(cm[1]) : 0;
    } catch { /* no score yet */ }

    this.bot.chat(`💰 ${username}: $${money} | 🐟 ${caught} fish caught`);
  }

  async sellAll(username) {
    // We can't directly read player inventories, so this is a stub
    // that works via the game engine for Cody, or tells players to use
    // a different mechanism
    this.bot.chat(`${username}: Use !sell to sell fish. Fish are sold automatically when caught for money.`);
  }
}
