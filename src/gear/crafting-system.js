// CraftMind Fishing — Crafting System (Alaska-Authentic Recipes)
// Minecraft items → real SE Alaska fishing gear.

import { ALL_GEAR } from './alaska-gear.js';

// ─── Crafting Tiers ───────────────────────────────────────────────────

export const CRAFTING_TIERS = {
  1: { name: 'Basic',       color: '⬜', description: 'Common Minecraft items. The essentials.' },
  2: { name: 'Intermediate', color: '🟦', description: 'Some uncommon materials. Real fishing gear.' },
  3: { name: 'Advanced',     color: '🟧', description: 'Uncommon/rare materials. Serious gear.' },
  4: { name: 'Expert',       color: '🟪', description: 'Rare drops and finds. Commercial-grade.' },
  5: { name: 'Master',       color: '🟨', description: 'Unique quest items. Legendary gear.' },
};

// ─── Workstations ─────────────────────────────────────────────────────

export const WORKSTATIONS = {
  anvil:           { name: 'Anvil',           emoji: '🔨', description: 'Metal work — hooks, pots, rigging, heavy hardware.' },
  loom:            { name: 'Loom',            emoji: '🧵', description: 'Fabric and line work — nets, wetsuits, braided line.' },
  crafting_table:  { name: 'Crafting Table',  emoji: '📦', description: 'Assemblies — rods, reels, combined gear.' },
  fletching_table: { name: 'Fletching Table', emoji: '🏹', description: 'Fine work — lures, jigs, flies, terminal tackle.' },
  smithing_table:  { name: 'Smithing Table',  emoji: '⚒️', description: 'Upgrades — iron → gold → diamond → netherite → prismarine → ender.' },
  enchanting_table:{ name: 'Enchanting Table', emoji: '📖', description: 'Enchantments — Luck of the Sea, Unbreaking, Lure.' },
};

// ─── All Crafting Recipes ─────────────────────────────────────────────

export const RECIPES = {
  // ── Hooks (Fletching Table) ─────────────────────────────
  circle_hook: {
    result: 'circle_hook',
    tier: 1,
    workstation: 'fletching_table',
    craftTime: 30,
    ingredients: { iron_ingot: 2, string: 1 },
    description: 'Mandatory for halibut fishing in Alaska.',
  },
  j_hook: {
    result: 'j_hook',
    tier: 1,
    workstation: 'fletching_table',
    craftTime: 20,
    ingredients: { iron_ingot: 1, string: 1 },
  },
  treble_hook: {
    result: 'treble_hook',
    tier: 1,
    workstation: 'fletching_table',
    craftTime: 25,
    ingredients: { iron_ingot: 2, string: 2 },
  },
  siwash_hook: {
    result: 'siwash_hook',
    tier: 1,
    workstation: 'fletching_table',
    craftTime: 25,
    ingredients: { iron_ingot: 2, string: 1 },
  },
  dinglebar_hook: {
    result: 'dinglebar_hook',
    tier: 2,
    workstation: 'anvil',
    craftTime: 90,
    ingredients: { iron_ingot: 4, iron_block: 1, string: 2 },
    description: '16-32oz heavy jig. Pound the bottom.',
  },
  cod_jig: {
    result: 'cod_jig',
    tier: 1,
    workstation: 'fletching_table',
    craftTime: 30,
    ingredients: { iron_ingot: 2, string: 1, feather: 1 },
  },
  hoochie: {
    result: 'hoochie',
    tier: 2,
    workstation: 'fletching_table',
    craftTime: 60,
    ingredients: { string: 3, leather: 1, ink_sac: 1, feather: 2 },
    description: 'Rubber squid skirt. THE salmon trolling lure.',
  },
  buzz_bomb: {
    result: 'buzz_bomb',
    tier: 2,
    workstation: 'anvil',
    craftTime: 60,
    ingredients: { iron_ingot: 3, string: 1 },
  },
  zig_zag: {
    result: 'zig_zag',
    tier: 2,
    workstation: 'anvil',
    craftTime: 60,
    ingredients: { iron_ingot: 3, string: 1, gold_nugget: 1 },
  },
  crippled_herring: {
    result: 'crippled_herring',
    tier: 2,
    workstation: 'anvil',
    craftTime: 50,
    ingredients: { iron_ingot: 3, string: 1, lapis_lazuli: 1 },
  },
  point_wilson_dart: {
    result: 'point_wilson_dart',
    tier: 2,
    workstation: 'fletching_table',
    craftTime: 50,
    ingredients: { iron_ingot: 2, string: 1, red_dye: 1 },
  },
  mooching_rig: {
    result: 'mooching_rig',
    tier: 2,
    workstation: 'fletching_table',
    craftTime: 45,
    ingredients: { string: 2, hook_any: 1, feather: 1 },
    requiresBait: 'herring',
  },
  bucktail_jig: {
    result: 'bucktail_jig',
    tier: 2,
    workstation: 'fletching_table',
    craftTime: 50,
    ingredients: { iron_ingot: 1, string: 1, feather: 3, leather: 1 },
  },

  // ── Line (Loom) ─────────────────────────────────────────
  mono_10lb: {
    result: 'mono_10lb',
    tier: 1,
    workstation: 'loom',
    craftTime: 20,
    ingredients: { string: 4 },
    produces: 3,
  },
  mono_20lb: {
    result: 'mono_20lb',
    tier: 1,
    workstation: 'loom',
    craftTime: 25,
    ingredients: { string: 6 },
    produces: 3,
  },
  mono_40lb: {
    result: 'mono_40lb',
    tier: 1,
    workstation: 'loom',
    craftTime: 30,
    ingredients: { string: 8 },
    produces: 2,
  },
  mono_80lb: {
    result: 'mono_80lb',
    tier: 2,
    workstation: 'loom',
    craftTime: 45,
    ingredients: { string: 12, slime_ball: 1 },
    produces: 2,
  },
  braid_30lb: {
    result: 'braid_30lb',
    tier: 2,
    workstation: 'loom',
    craftTime: 60,
    ingredients: { string: 8, slime_ball: 1 },
    produces: 3,
  },
  braid_50lb: {
    result: 'braid_50lb',
    tier: 2,
    workstation: 'loom',
    craftTime: 75,
    ingredients: { string: 10, slime_ball: 2 },
    produces: 2,
  },
  braid_80lb: {
    result: 'braid_80lb',
    tier: 2,
    workstation: 'loom',
    craftTime: 90,
    ingredients: { string: 14, slime_ball: 2, iron_ingot: 1 },
    produces: 2,
  },
  braid_130lb: {
    result: 'braid_130lb',
    tier: 3,
    workstation: 'loom',
    craftTime: 120,
    ingredients: { string: 20, slime_ball: 3, iron_ingot: 2 },
    produces: 2,
  },
  braid_200lb: {
    result: 'braid_200lb',
    tier: 4,
    workstation: 'loom',
    craftTime: 180,
    ingredients: { string: 30, slime_ball: 4, iron_block: 1, prismarine_shard: 2 },
    produces: 1,
  },
  lead_core: {
    result: 'lead_core',
    tier: 2,
    workstation: 'loom',
    craftTime: 60,
    ingredients: { string: 8, iron_nugget: 8 },
    produces: 3,
  },
  wire_leader_40lb: {
    result: 'wire_leader_40lb',
    tier: 2,
    workstation: 'anvil',
    craftTime: 40,
    ingredients: { iron_ingot: 3 },
    produces: 3,
  },
  wire_leader_80lb: {
    result: 'wire_leader_80lb',
    tier: 2,
    workstation: 'anvil',
    craftTime: 50,
    ingredients: { iron_ingot: 4 },
    produces: 2,
  },
  wire_leader_100lb: {
    result: 'wire_leader_100lb',
    tier: 3,
    workstation: 'anvil',
    craftTime: 60,
    ingredients: { iron_ingot: 6, iron_block: 1 },
    produces: 2,
  },
  dacron_30lb: {
    result: 'dacron_30lb',
    tier: 1,
    workstation: 'loom',
    craftTime: 20,
    ingredients: { string: 6, white_wool: 2 },
    produces: 3,
  },

  // ── Rods (Crafting Table) ───────────────────────────────
  light_spin_rod: {
    result: 'light_spin_rod',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 60,
    ingredients: { stick: 3, string: 2, iron_ingot: 1 },
  },
  medium_spin_rod: {
    result: 'medium_spin_rod',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 90,
    ingredients: { stick: 4, string: 3, iron_ingot: 2, leather: 1 },
  },
  heavy_mooching_rod: {
    result: 'heavy_mooching_rod',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 120,
    ingredients: { stick: 5, string: 4, iron_ingot: 2, leather: 2 },
    description: 'Long, flexible. For drifting cut-plug herring for kings.',
  },
  halibut_rod: {
    result: 'halibut_rod',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 150,
    ingredients: { stick: 3, string: 3, iron_ingot: 3, leather: 2, iron_block: 1 },
    description: 'Short, stiff, heavy. Built to winch barn doors.',
  },
  dinglebar_rod: {
    result: 'dinglebar_rod',
    tier: 3,
    workstation: 'crafting_table',
    craftTime: 200,
    ingredients: { stick: 3, string: 4, iron_block: 2, leather: 2, prismarine_shard: 2 },
    description: 'EXTRA heavy. For pounding jigs on bottom.',
  },
  trolling_rod: {
    result: 'trolling_rod',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 120,
    ingredients: { stick: 4, string: 4, iron_ingot: 2, leather: 2 },
  },
  fly_rod: {
    result: 'fly_rod',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 90,
    ingredients: { stick: 4, string: 3, feather: 4, leather: 1 },
  },
  spear: {
    result: 'spear',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 60,
    ingredients: { stick: 2, iron_ingot: 3, flint: 1 },
  },

  // ── Reels (Crafting Table) ──────────────────────────────
  spinning_reel: {
    result: 'spinning_reel',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 60,
    ingredients: { iron_ingot: 3, stick: 1, string: 2 },
  },
  level_wind_reel: {
    result: 'level_wind_reel',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 120,
    ingredients: { iron_ingot: 5, stick: 2, string: 3, iron_block: 1 },
  },
  shimano_talica: {
    result: 'shimano_talica',
    tier: 3,
    workstation: 'crafting_table',
    craftTime: 300,
    ingredients: { iron_block: 2, iron_ingot: 6, stick: 2, redstone: 2, string: 4, prismarine_crystals: 2 },
    description: 'Two-speed lever drag. The reel dreams are made of.',
  },
  avet_hx: {
    result: 'avet_hx',
    tier: 3,
    workstation: 'crafting_table',
    craftTime: 240,
    ingredients: { iron_block: 1, iron_ingot: 5, stick: 2, redstone: 1, string: 3 },
  },
  daiwa_sea_line: {
    result: 'daiwa_sea_line',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 150,
    ingredients: { iron_ingot: 5, stick: 2, string: 3 },
  },
  fly_reel: {
    result: 'fly_reel',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 60,
    ingredients: { iron_ingot: 2, stick: 1, string: 2 },
  },
  hand_reel: {
    result: 'hand_reel',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 20,
    ingredients: { stick: 1, string: 3 },
  },
  electric_reel: {
    result: 'electric_reel',
    tier: 3,
    workstation: 'crafting_table',
    craftTime: 360,
    ingredients: { iron_block: 2, iron_ingot: 4, redstone: 4, stick: 2, string: 3, piston: 1 },
    description: 'Push a button, it reels for you. Deep water savior.',
  },

  // ── Nets & Traps (Loom / Anvil) ─────────────────────────
  gill_net: {
    result: 'gill_net',
    tier: 2,
    workstation: 'loom',
    craftTime: 300,
    ingredients: { string: 32, stick: 8, white_wool: 8, float_any: 4 },
  },
  purse_seine_net: {
    result: 'purse_seine_net',
    tier: 4,
    workstation: 'loom',
    craftTime: 900,
    ingredients: { string: 64, stick: 16, white_wool: 16, iron_block: 2, chain: 8 },
    description: 'HUGE net. Requires crew. Industrial salmon fishing.',
  },
  beach_seine: {
    result: 'beach_seine',
    tier: 2,
    workstation: 'loom',
    craftTime: 200,
    ingredients: { string: 24, stick: 6, white_wool: 4, lead: 4 },
  },
  dungeness_pot: {
    result: 'dungeness_pot',
    tier: 1,
    workstation: 'anvil',
    craftTime: 120,
    ingredients: { iron_ingot: 6, string: 4, stick: 2 },
    description: 'Wire pot with 3 entries. The bread and butter.',
  },
  king_crab_pot: {
    result: 'king_crab_pot',
    tier: 4,
    workstation: 'anvil',
    craftTime: 480,
    ingredients: { iron_block: 3, chain: 6, string: 8, stick: 4 },
    description: '80lb+ steel pot. Bering Sea gear.',
  },
  tanner_crab_pot: {
    result: 'tanner_crab_pot',
    tier: 3,
    workstation: 'anvil',
    craftTime: 300,
    ingredients: { iron_block: 2, chain: 4, string: 6, stick: 3 },
  },
  shrimp_pot: {
    result: 'shrimp_pot',
    tier: 2,
    workstation: 'anvil',
    craftTime: 90,
    ingredients: { iron_ingot: 4, string: 3, stick: 2 },
  },
  octopus_pot: {
    result: 'octopus_pot',
    tier: 3,
    workstation: 'anvil',
    craftTime: 180,
    ingredients: { iron_ingot: 5, string: 4, stick: 2, iron_block: 1 },
  },
  trawl_net: {
    result: 'trawl_net',
    tier: 4,
    workstation: 'loom',
    craftTime: 600,
    ingredients: { string: 48, white_wool: 12, stick: 12, lead: 6, chain: 4 },
  },

  // ── Boat Gear (Anvil / Crafting Table) ──────────────────
  pot_puller: {
    result: 'pot_puller',
    tier: 3,
    workstation: 'anvil',
    craftTime: 400,
    ingredients: { iron_block: 2, piston: 2, redstone: 2, lever: 1, chain: 2 },
    description: 'Hydraulic/electric hauler. Essential for king crab.',
  },
  hydraulic_hooker: {
    result: 'hydraulic_hooker',
    tier: 4,
    workstation: 'anvil',
    craftTime: 600,
    ingredients: { iron_block: 3, piston: 3, redstone: 3, chain: 4 },
  },
  downrigger: {
    result: 'downrigger',
    tier: 2,
    workstation: 'anvil',
    craftTime: 200,
    ingredients: { iron_block: 1, piston: 1, stick: 2, redstone: 1, string: 4 },
    description: 'Gets trolling gear to exact depth. Critical for salmon.',
  },
  fish_finder: {
    result: 'fish_finder',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 180,
    ingredients: { iron_ingot: 3, glass_pane: 2, redstone: 2, prismarine_shard: 1 },
  },
  gps: {
    result: 'gps',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 150,
    ingredients: { iron_ingot: 2, glass_pane: 1, redstone: 1, compass: 1 },
  },
  anchor: {
    result: 'anchor',
    tier: 1,
    workstation: 'anvil',
    craftTime: 60,
    ingredients: { iron_ingot: 6, chain: 3 },
  },
  pot_line: {
    result: 'pot_line',
    tier: 1,
    workstation: 'loom',
    craftTime: 30,
    ingredients: { string: 8 },
    produces: 3,
  },
  buoy: {
    result: 'buoy',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 15,
    ingredients: { wool_any: 2, stick: 1, string: 1 },
    produces: 3,
  },
  crimp: {
    result: 'crimp',
    tier: 1,
    workstation: 'anvil',
    craftTime: 10,
    ingredients: { iron_nugget: 3 },
    produces: 4,
  },
  snap_swivel: {
    result: 'snap_swivel',
    tier: 1,
    workstation: 'anvil',
    craftTime: 15,
    ingredients: { iron_ingot: 1, iron_nugget: 2 },
    produces: 3,
  },
  skirt: {
    result: 'skirt',
    tier: 1,
    workstation: 'fletching_table',
    craftTime: 20,
    ingredients: { leather: 1, string: 2, dye_any: 1 },
    produces: 3,
  },

  // ── Diving Gear (Loom / Crafting Table) ─────────────────
  wetsuit_3mm: {
    result: 'wetsuit_3mm',
    tier: 2,
    workstation: 'loom',
    craftTime: 120,
    ingredients: { leather: 6, string: 2, slime_ball: 1 },
  },
  wetsuit_5mm: {
    result: 'wetsuit_5mm',
    tier: 2,
    workstation: 'loom',
    craftTime: 180,
    ingredients: { leather: 8, string: 3, slime_ball: 2 },
    description: 'Most Alaska divers live in 5mm.',
  },
  wetsuit_7mm: {
    result: 'wetsuit_7mm',
    tier: 3,
    workstation: 'loom',
    craftTime: 240,
    ingredients: { leather: 12, string: 4, slime_ball: 3 },
  },
  dry_suit: {
    result: 'dry_suit',
    tier: 4,
    workstation: 'loom',
    craftTime: 480,
    ingredients: { leather: 16, string: 6, slime_ball: 4, iron_ingot: 4, prismarine_shard: 2 },
    description: 'Stays dry. Expensive but worth every penny at 38°F.',
  },
  mask: {
    result: 'mask',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 40,
    ingredients: { glass_pane: 3, leather: 2, string: 1 },
  },
  fins: {
    result: 'fins',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 40,
    ingredients: { leather: 3, stick: 2 },
  },
  dive_computer: {
    result: 'dive_computer',
    tier: 3,
    workstation: 'crafting_table',
    craftTime: 240,
    ingredients: { iron_ingot: 3, glass_pane: 2, redstone: 3, prismarine_shard: 1, compass: 1 },
  },
  regulator: {
    result: 'regulator',
    tier: 3,
    workstation: 'crafting_table',
    craftTime: 300,
    ingredients: { iron_ingot: 5, iron_block: 1, redstone: 2, glass_pane: 1, leather: 1 },
  },
  tank_al80: {
    result: 'tank_al80',
    tier: 2,
    workstation: 'anvil',
    craftTime: 120,
    ingredients: { iron_ingot: 6, iron_block: 1, redstone: 1 },
  },
  tank_steel100: {
    result: 'tank_steel100',
    tier: 3,
    workstation: 'anvil',
    craftTime: 180,
    ingredients: { iron_block: 2, iron_ingot: 4, redstone: 2 },
  },
  bcd: {
    result: 'bcd',
    tier: 3,
    workstation: 'loom',
    craftTime: 240,
    ingredients: { leather: 8, iron_ingot: 4, string: 4, redstone: 2 },
  },
  dive_light: {
    result: 'dive_light',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 60,
    ingredients: { iron_ingot: 2, glass_pane: 1, redstone: 2, glowstone_dust: 1 },
  },
  dive_knife: {
    result: 'dive_knife',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 30,
    ingredients: { iron_ingot: 2, stick: 1, leather: 1 },
  },
  catch_bag: {
    result: 'catch_bag',
    tier: 1,
    workstation: 'loom',
    craftTime: 20,
    ingredients: { string: 6, stick: 2 },
  },
  abalone_iron: {
    result: 'abalone_iron',
    tier: 2,
    workstation: 'anvil',
    craftTime: 60,
    ingredients: { iron_ingot: 3, stick: 1 },
  },

  // ── Misc / Specialty ────────────────────────────────────
  harpoon: {
    result: 'harpoon',
    tier: 3,
    workstation: 'crafting_table',
    craftTime: 180,
    ingredients: { iron_ingot: 5, stick: 3, string: 6, iron_block: 1 },
    description: 'Flying gaff on a rope. For landing barn doors.',
  },
  gaff: {
    result: 'gaff',
    tier: 2,
    workstation: 'crafting_table',
    craftTime: 90,
    ingredients: { iron_ingot: 3, stick: 2 },
  },
  bang_stick: {
    result: 'bang_stick',
    tier: 5,
    workstation: 'crafting_table',
    craftTime: 600,
    ingredients: { iron_ingot: 4, iron_block: 1, redstone: 3, gunpowder: 3, stick: 2 },
    description: 'Powerhead. Easter egg. Don\'t tell Fish & Game.',
    easterEgg: true,
  },
  fillet_knife: {
    result: 'fillet_knife',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 30,
    ingredients: { iron_ingot: 2, stick: 1 },
  },
  slime_bag: {
    result: 'slime_bag',
    tier: 2,
    workstation: 'loom',
    craftTime: 40,
    ingredients: { leather: 2, string: 4, slime_ball: 1 },
  },
  bait_cooler: {
    result: 'bait_cooler',
    tier: 1,
    workstation: 'crafting_table',
    craftTime: 40,
    ingredients: { iron_ingot: 2, ice_any: 4 },
  },
  flasher: {
    result: 'flasher',
    tier: 2,
    workstation: 'anvil',
    craftTime: 60,
    ingredients: { iron_ingot: 4, string: 2, prismarine_shard: 1 },
    description: 'Rotating attractor. Run your hoochie 36" behind it.',
  },
  diver_plate: {
    result: 'diver_plate',
    tier: 2,
    workstation: 'anvil',
    craftTime: 50,
    ingredients: { iron_ingot: 3, string: 2 },
  },
  herring_rigs: {
    result: 'herring_rigs',
    tier: 2,
    workstation: 'fletching_table',
    craftTime: 30,
    ingredients: { string: 2, hook_any: 1, feather: 1 },
    requiresBait: 'herring',
    produces: 3,
  },
};

// ─── Enchantment Recipes ──────────────────────────────────────────────

export const ENCHANTMENTS = {
  luck_of_the_sea: { name: 'Luck of the Sea', maxLevel: 3, description: 'Increases rare fish chance by 15% per level', costMultiplier: [1, 2, 5] },
  lure:            { name: 'Lure',            maxLevel: 5, description: 'Fish bite 20% faster per level',             costMultiplier: [1, 2, 3, 5, 8] },
  unbreaking:      { name: 'Unbreaking',      maxLevel: 3, description: 'Gear loses durability 33% slower per level',  costMultiplier: [1, 3, 6] },
  mending:         { name: 'Mending',         maxLevel: 1, description: 'XP auto-repairs gear',                      costMultiplier: [10] },
  depth_finder:    { name: 'Depth Finder',    maxLevel: 3, description: 'Shows optimal fishing depth',               costMultiplier: [1, 2, 4] },
  salt_guard:      { name: 'Salt Guard',      maxLevel: 3, description: 'Reduces saltwater corrosion by 25%/level',  costMultiplier: [2, 4, 8] },
};

// ─── Crafting System ──────────────────────────────────────────────────

export class CraftingSystem {
  constructor() {
    this.knownRecipes = new Set(['circle_hook', 'j_hook', 'mono_20lb', 'light_spin_rod', 'spinning_reel', 'dungeness_pot', 'fillet_knife']); // tier 1 starters
    this.craftingLevel = 1;
    this.craftedCount = 0;
    this.tierUnlocked = { 1: true, 2: false, 3: false, 4: false, 5: false };
  }

  /** Get all recipes available to the player */
  getAvailableRecipes() {
    const available = {};
    for (const [id, recipe] of Object.entries(RECIPES)) {
      if (this.knownRecipes.has(id) && this.tierUnlocked[recipe.tier]) {
        available[id] = recipe;
      }
    }
    return available;
  }

  /** Get recipes by tier */
  getRecipesByTier(tier) {
    return Object.entries(RECIPES).filter(([, r]) => r.tier === tier);
  }

  /** Discover a recipe */
  discoverRecipe(recipeId) {
    if (!RECIPES[recipeId]) return false;
    this.knownRecipes.add(recipeId);
    return true;
  }

  /** Unlock a crafting tier */
  unlockTier(tier) {
    if (tier < 2 || tier > 5) return false;
    this.tierUnlocked[tier] = true;
    return true;
  }

  /** Craft an item */
  craft(recipeId, inventory) {
    const recipe = RECIPES[recipeId];
    if (!recipe) throw new Error(`Unknown recipe: ${recipeId}`);
    if (!this.knownRecipes.has(recipeId)) throw new Error(`Recipe not discovered: ${recipeId}`);
    if (!this.tierUnlocked[recipe.tier]) throw new Error(`Tier ${recipe.tier} crafting not unlocked`);

    // Check ingredients
    for (const [item, count] of Object.entries(recipe.ingredients)) {
      if ((inventory[item] ?? 0) < count) {
        throw new Error(`Not enough ${item}: need ${count}, have ${inventory[item] ?? 0}`);
      }
    }

    // Consume ingredients
    for (const [item, count] of Object.entries(recipe.ingredients)) {
      inventory[item] -= count;
    }

    this.craftedCount++;
    const gearInfo = ALL_GEAR[recipe.result];

    return {
      id: recipe.result,
      name: gearInfo?.name ?? recipe.result,
      emoji: gearInfo?.emoji ?? '📦',
      tier: recipe.tier,
      description: recipe.description ?? gearInfo?.description ?? '',
      quantity: recipe.produces ?? 1,
    };
  }

  /** Get crafting progress summary */
  getSummary() {
    const known = this.knownRecipes.size;
    const total = Object.keys(RECIPES).length;
    const tiersUnlocked = Object.entries(this.tierUnlocked)
      .filter(([, v]) => v)
      .map(([k]) => CRAFTING_TIERS[k]);
    return {
      totalRecipes: total,
      knownRecipes: known,
      craftedCount: this.craftedCount,
      tiersUnlocked,
      discoveryPct: Math.round((known / total) * 100),
    };
  }

  /** Get recipes the player hasn't discovered yet */
  getUndiscoveredRecipes() {
    return Object.keys(RECIPES).filter(id => !this.knownRecipes.has(id));
  }
}

export default CraftingSystem;
