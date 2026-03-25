// CraftMind Fishing — Gear Crafting System
// All gear crafted from Minecraft items. Durability, tiers, upgrades.
// NOTE: Alaska-specific recipes are in src/gear/crafting-system.js
// This file provides the base GearItem class and tier system.

const TIER_MULTIPLIERS = {
  iron:       { durability: 1.0, effectiveness: 1.0, name: 'Iron',       color: '⬜' },
  gold:       { durability: 0.8, effectiveness: 1.2, name: 'Gold',       color: '🟡' },
  diamond:    { durability: 2.0, effectiveness: 1.5, name: 'Diamond',    color: '🔷' },
  netherite:  { durability: 3.0, effectiveness: 1.8, name: 'Netherite',  color: '⬛' },
  prismarine: { durability: 1.5, effectiveness: 2.0, name: 'Prismarine', color: '🟩' },
  ender:      { durability: 4.0, effectiveness: 2.5, name: 'Ender',      color: '🟣' },
};

const TIER_ORDER = ['iron', 'gold', 'diamond', 'netherite', 'prismarine', 'ender'];

// ─── Recipe Definitions ───────────────────────────────────────────────

const RECIPES = {
  crab_pot: {
    name: 'Crab Pot',
    emoji: '🦀',
    type: 'trap',
    description: 'Baited trap for crabs, shrimp, and the occasional treasure.',
    tierable: false,
    durability: 100,
    recipes: {
      iron: { ingredients: { iron_ingot: 3, string: 2, bait_any: 1 }, craftTime: 5000 },
    },
  },
  lobster_trap: {
    name: 'Lobster Trap',
    emoji: '🦞',
    type: 'trap',
    description: 'Deep-sea crustacean trap. Must be placed at depth > 30.',
    tierable: true,
    durability: 80,
    recipes: {
      iron:       { ingredients: { iron_ingot: 4, string: 2, bait_any: 1 }, craftTime: 8000 },
      gold:       { ingredients: { gold_ingot: 4, prismarine_shard: 2, bait_any: 2 }, craftTime: 8000 },
      diamond:    { ingredients: { diamond: 3, prismarine_crystals: 2, iron_ingot: 2, bait_any: 2 }, craftTime: 12000 },
    },
  },
  longline: {
    name: 'Longline Gear',
    emoji: '🪝',
    type: 'line',
    description: 'Anchor points, hooks, and bait for a 20-50 hook longline.',
    tierable: false,
    durability: 150,
    recipes: {
      iron: { ingredients: { iron_ingot: 8, chain: 4, string: 16, iron_hook: 20 }, craftTime: 15000 },
    },
  },
  trawl_net: {
    name: 'Trawl Net',
    emoji: '🛥️',
    type: 'net',
    description: 'Industrial fishing net. Scoops up everything. Damages ecosystems.',
    tierable: false,
    durability: 200,
    recipes: {
      iron: { ingredients: { string: 32, white_wool: 8, stick: 12, lead: 4 }, craftTime: 20000 },
    },
  },
  scuba_gear: {
    name: 'SCUBA Gear',
    emoji: '🤿',
    type: 'armor',
    description: 'Iron-and-glass air tank. 5 minutes of underwater breathing.',
    tierable: true,
    durability: 120,
    recipes: {
      iron:    { ingredients: { iron_ingot: 6, glass_pane: 4, leather: 2 }, craftTime: 10000 },
      gold:    { ingredients: { gold_ingot: 6, glass_pane: 4, leather: 2, prismarine_shard: 2 }, craftTime: 10000 },
      diamond: { ingredients: { diamond: 4, glass_pane: 6, leather: 2, prismarine_crystals: 2 }, craftTime: 15000 },
    },
  },
  spear: {
    name: 'Fishing Spear',
    emoji: '🪝',
    type: 'weapon',
    description: 'Throwable spear for underwater hunting. One shot per throw.',
    tierable: true,
    durability: 60,
    recipes: {
      iron:      { ingredients: { stick: 2, iron_ingot: 3, flint: 1 }, craftTime: 3000 },
      gold:      { ingredients: { stick: 2, gold_ingot: 3, flint: 1 }, craftTime: 3000 },
      diamond:   { ingredients: { stick: 2, diamond: 2, flint: 1 }, craftTime: 4000 },
      netherite: { ingredients: { stick: 2, netherite_ingot: 2, flint: 1 }, craftTime: 5000 },
    },
  },
  ice_auger: {
    name: 'Ice Auger',
    emoji: '🧊',
    type: 'tool',
    description: 'Drills holes through ice for ice fishing. Winter essential.',
    tierable: true,
    durability: 90,
    recipes: {
      iron:    { ingredients: { iron_ingot: 3, stick: 2 }, craftTime: 4000 },
      diamond: { ingredients: { diamond: 2, iron_ingot: 2, stick: 2 }, craftTime: 6000 },
    },
  },
  jig_lure: {
    name: 'Jig Lure',
    emoji: '🎣',
    type: 'lure',
    description: 'Active lure for jigging technique. Different combos for different species.',
    tierable: false,
    durability: 40,
    recipes: {
      pike_jig:   { ingredients: { feather: 2, string: 1, iron_hook: 1, white_dye: 1 }, craftTime: 2000, variant: 'Aggressive Jerk' },
      cod_jig:    { ingredients: { feather: 2, string: 1, iron_hook: 1, blue_dye: 1 }, craftTime: 2000, variant: 'Slow Sweep' },
      bass_jig:   { ingredients: { feather: 2, string: 1, iron_hook: 1, green_dye: 1 }, craftTime: 2000, variant: 'Mycelium Pulse' },
      eel_jig:    { ingredients: { feather: 2, string: 1, iron_hook: 1, red_dye: 1 }, craftTime: 2000, variant: 'Electric Staccato' },
    },
  },
  surf_rod: {
    name: 'Surf Rod',
    emoji: '🌊',
    type: 'rod',
    description: 'Long rod for casting beyond the breakers.',
    tierable: true,
    durability: 110,
    recipes: {
      iron:    { ingredients: { stick: 3, string: 3, iron_ingot: 2 }, craftTime: 6000 },
      gold:    { ingredients: { stick: 3, string: 3, gold_ingot: 2 }, craftTime: 6000 },
      diamond: { ingredients: { stick: 3, string: 3, diamond: 2 }, craftTime: 8000 },
    },
  },
  trolling_rod: {
    name: 'Trolling Rod',
    emoji: '🚤',
    type: 'rod',
    description: 'Sturdy rod for boat fishing. Built to handle big pelagics.',
    tierable: true,
    durability: 130,
    recipes: {
      iron:    { ingredients: { stick: 3, string: 4, iron_ingot: 3 }, craftTime: 8000 },
      gold:    { ingredients: { stick: 3, string: 4, gold_ingot: 3 }, craftTime: 8000 },
      diamond: { ingredients: { stick: 3, string: 4, diamond: 2, iron_ingot: 1 }, craftTime: 12000 },
    },
  },
};

export class GearItem {
  constructor(gearId, tier = 'iron', variant = null) {
    const recipe = RECIPES[gearId];
    if (!recipe) throw new Error(`Unknown gear: ${gearId}`);
    this.id = gearId;
    this.name = recipe.name;
    this.emoji = recipe.emoji;
    this.type = recipe.type;
    this.description = recipe.description;
    this.tier = tier;
    this.variant = variant;

    const tierData = TIER_MULTIPLIERS[tier] ?? TIER_MULTIPLIERS.iron;
    this.maxDurability = recipe.durability * tierData.durability;
    this.currentDurability = this.maxDurability;
    this.effectiveness = tierData.effectiveness;
    this.tierName = tierData.name;
    this.tierColor = tierData.color;
  }

  /** Use the gear, reducing durability */
  use(amount = 1) {
    this.currentDurability -= amount;
    return this.currentDurability > 0;
  }

  /** Check if gear is broken */
  get isBroken() { return this.currentDurability <= 0; }

  /** Get durability percentage */
  get durabilityPct() {
    return Math.max(0, Math.round((this.currentDurability / this.maxDurability) * 100));
  }

  /** Repair gear */
  repair(amount) {
    this.currentDurability = Math.min(this.maxDurability, this.currentDurability + amount);
  }

  /** Upgrade to next tier */
  upgrade() {
    const currentIdx = TIER_ORDER.indexOf(this.tier);
    if (currentIdx === -1 || currentIdx >= TIER_ORDER.length - 1) return false;
    const nextTier = TIER_ORDER[currentIdx + 1];
    const tierData = TIER_MULTIPLIERS[nextTier];
    this.tier = nextTier;
    this.tierName = tierData.name;
    this.tierColor = tierData.color;
    this.maxDurability = RECIPES[this.id].durability * tierData.durability;
    this.effectiveness = tierData.effectiveness;
    return true;
  }

  toString() {
    const dur = this.durabilityPct;
    const durEmoji = dur > 70 ? '✨' : dur > 30 ? '⚠️' : '💀';
    const variantStr = this.variant ? ` [${this.variant}]` : '';
    return `${this.tierColor}${this.emoji} ${this.tierName} ${this.name}${variantStr} (${dur}% dur) ${durEmoji}`;
  }
}

export class GearCraftingSystem {
  constructor() {
    this.inventory = new Map(); // gearId -> { item: GearItem, count: number }
  }

  /** Check if player has required materials */
  hasMaterials(gearId, tier = 'iron', variant = null) {
    const recipe = RECIPES[gearId];
    const recipeKey = recipe.tierable ? tier : (variant ?? tier);
    const recipeData = recipe.recipes[recipeKey] ?? recipe.recipes[Object.keys(recipe.recipes)[0]];
    if (!recipeData) return false;
    // In simulation, we just check if the recipe exists
    return true;
  }

  /** Craft a gear item */
  craft(gearId, tier = 'iron', variant = null) {
    const recipe = RECIPES[gearId];
    if (!recipe) throw new Error(`Unknown recipe: ${gearId}`);

    const recipeKey = recipe.tierable ? tier : (variant ?? Object.keys(recipe.recipes)[0]);
    const recipeData = recipe.recipes[recipeKey];
    if (!recipeData) throw new Error(`No recipe for ${gearId} at tier ${recipeKey}`);

    const item = new GearItem(gearId, tier, recipeData.variant ?? variant);
    this.addToInventory(item);
    return item;
  }

  /** Add gear to inventory */
  addToInventory(item, count = 1) {
    const existing = this.inventory.get(item.id);
    if (existing) {
      existing.count += count;
    } else {
      this.inventory.set(item.id, { item, count });
    }
  }

  /** Get a gear item from inventory */
  get(gearId) {
    const entry = this.inventory.get(gearId);
    if (!entry || entry.count <= 0) return null;
    entry.count--;
    return entry.item;
  }

  /** Get all recipes */
  static getRecipes() { return { ...RECIPES }; }

  /** Get a specific recipe */
  static getRecipe(gearId) { return RECIPES[gearId] ?? null; }

  /** Get tier info */
  static getTiers() { return { ...TIER_MULTIPLIERS }; }

  /** Get tier order */
  static getTierOrder() { return [...TIER_ORDER]; }

  /** Get inventory summary */
  getInventorySummary() {
    const items = [];
    for (const [, entry] of this.inventory) {
      if (entry.count > 0) items.push(`${entry.item.toString()} x${entry.count}`);
    }
    return items.length > 0 ? items.join('\n') : 'Empty';
  }
}

export { RECIPES, TIER_MULTIPLIERS, TIER_ORDER };
export default GearCraftingSystem;
