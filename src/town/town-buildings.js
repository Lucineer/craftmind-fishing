// CraftMind Fishing — Town Buildings
// Every building in Sitka mapped from Google Places data, with NPCs, functions, and atmosphere.

// Minecraft positions for each building (x, y, z relative to town origin)
export const BUILDING_POSITIONS = {
  // === LINCOLN STREET (downtown core, z ≈ 20-50) ===
  ernies_old_time_saloon:    { x: 5,   y: 64, z: 25, street: 'lincoln' },
  sitka_hotel:               { x: 8,   y: 64, z: 22, street: 'lincoln' },
  campfire_kitchen:          { x: 15,  y: 64, z: 25, street: 'lincoln' },
  slammin_salmon:            { x: 20,  y: 64, z: 28, street: 'lincoln' },
  thai_alaska:               { x: 22,  y: 64, z: 22, street: 'lincoln' },
  sitka_food_coop:           { x: 25,  y: 64, z: 30, street: 'lincoln' },
  bayview_restaurant:        { x: 28,  y: 65, z: 25, street: 'lincoln' },
  pacific_high_school:       { x: 35,  y: 64, z: 25, street: 'lincoln' },
  st_michaels_cathedral:     { x: 2,   y: 64, z: 30, street: 'lincoln' },
  st_peters_episcopal:       { x: 10,  y: 64, z: 35, street: 'lincoln' },
  crescent_harbor_entrance:  { x: 40,  y: 64, z: 30, street: 'lincoln' },

  // === HARBOR DRIVE (waterfront, z ≈ 55-65) ===
  visitor_center:            { x: 5,   y: 64, z: 58, street: 'harbor' },
  mean_queen:                { x: 15,  y: 64, z: 60, street: 'harbor' },
  sitka_sea_level_adventures:{ x: 20,  y: 64, z: 58, street: 'harbor' },

  // === KATLIAN STREET (commercial, z ≈ 70-85) ===
  pioneer_bar:               { x: 10,  y: 64, z: 72, street: 'katlian' },
  lfs_marine_supplies:       { x: 25,  y: 64, z: 75, street: 'katlian' },
  the_galley:                { x: 30,  y: 64, z: 70, street: 'katlian' },
  longliner_lodge:           { x: 35,  y: 64, z: 75, street: 'katlian' },
  fish_baranof:              { x: 38,  y: 64, z: 72, street: 'katlian' },
  petro_express:             { x: 42,  y: 64, z: 70, street: 'katlian' },
  petro_marine:              { x: 44,  y: 64, z: 68, street: 'katlian' },
  harbormaster:              { x: 48,  y: 64, z: 75, street: 'katlian' },
  anb_harbor:                { x: 55,  y: 63, z: 78, street: 'katlian' },

  // === BARANOF STREET (residential/commercial, z ≈ 35-45) ===
  market_center:             { x: -10, y: 64, z: 40, street: 'baranof' },
  xoots_elementary:          { x: -15, y: 64, z: 38, street: 'baranof' },

  // === HALIBUT POINT ROAD (industrial, x ≈ 80-200) ===
  ace_hardware:              { x: 80,  y: 64, z: 10, street: 'halibut_point' },
  buckland_equipment:        { x: 120, y: 64, z: 15, street: 'halibut_point' },
  alaska_commercial:         { x: 130, y: 64, z: 20, street: 'halibut_point' },
  sea_mart:                  { x: 140, y: 64, z: 10, street: 'halibut_point' },
  delta_western:             { x: 180, y: 63, z: 5,  street: 'halibut_point' },
  a_z_sportfishing:          { x: 160, y: 64, z: 25, street: 'halibut_point' },
  sitka_point_lodge:         { x: 170, y: 64, z: 30, street: 'halibut_point' },
  angling_unlimited:         { x: 175, y: 64, z: 35, street: 'halibut_point' },
  first_baptist_church:      { x: 100, y: 64, z: 8,  street: 'halibut_point' },

  // === SAWMILL CREEK ROAD (resort, z ≈ 80-100) ===
  baranof_lodge:             { x: 70,  y: 64, z: 85, street: 'sawmill_creek' },
  eagle_bay_inn:             { x: 90,  y: 64, z: 90, street: 'sawmill_creek' },
  airport:                   { x: 80,  y: 64, z: 95, street: 'sawmill_creek' },

  // === JEFF DAVIS STREET ===
  sea_roamer_charters:       { x: -5,  y: 63, z: 65, street: 'jeff_davis' },

  // === SEWARD STREET ===
  coldwater_bar_grill:       { x: -20, y: 64, z: 50, street: 'seward' },
  southeast_resort:          { x: -25, y: 64, z: 52, street: 'seward' },
  mt_edgecumbe_hs:           { x: -30, y: 64, z: 60, street: 'seward' },
  mt_edgecumbe_high_school:   { x: -30, y: 64, z: 60, street: 'seward' },

  // === LAKE STREET ===
  sitka_high_school:         { x: -15, y: 68, z: 45, street: 'lake' },

  // === KASHEVAROFF STREET ===
  keet_gooshi_heen:          { x: -25, y: 64, z: 38, street: 'kashevaroff' },

  // === HARBORS (on the water, y ≈ 62-63) ===
  eliason_harbor:            { x: 10,  y: 62, z: 90,  street: 'harbor' },
  crescent_harbor:           { x: 45,  y: 62, z: 95,  street: 'harbor' },

  // === SERVICES ===
  post_office:               { x: 18,  y: 64, z: 30, street: 'lincoln' },
  health_center:             { x: 30,  y: 64, z: 40, street: 'baranof' },
  adfg_office:               { x: 50,  y: 64, z: 72, street: 'katlian' },
};

// Building definitions with NPCs, functions, and flavor
export const BUILDINGS = {
  // ─── BARS ────────────────────────────────────────────
  ernies_old_time_saloon: {
    id: 'ernies_old_time_saloon',
    name: "Ernie's Old Time Saloon",
    location: { street: 'Lincoln', address: 130, streetKey: 'lincoln' },
    type: 'bar',
    npc: 'ernie',
    functions: ['buy_drinks', 'hear_rumors', 'get_quests', 'meet_fishermen'],
    hours: { open: 15, close: 1 },
    atmosphere: 'Dim lighting, old photos on the walls, smell of beer and spilled chowder. A mounted halibut watches from above the bar. Jukebox plays George Strait. Napkins with fishing stories scribbled on them.',
    description: "The classic Sitka bar. Fishermen gather here to tell stories, share tips, and complain about the weather. Ernie has been tending bar since before you were born. If you want to know what's biting, this is where you ask.",
    interior: {
      blocks: ['oak_planks', 'spruce_log', 'barrel', 'brewing_stand', 'lantern', 'note_block'],
      features: ['bar_counter', 'booths', 'jukebox', 'halibut_mount', 'old_photos', 'dart_board'],
      size: { w: 12, h: 5, d: 8 },
    },
  },

  pioneer_bar: {
    id: 'pioneer_bar',
    name: 'Pioneer Bar & Liquor Store',
    location: { street: 'Katlian', address: 212, streetKey: 'katlian' },
    type: 'bar',
    npc: null, // Captain Sig hangs out here when in town
    functions: ['buy_drinks', 'buy_liquor', 'meet_fishermen', 'hear_rumors'],
    hours: { open: 12, close: 1 },
    atmosphere: 'Working-class bar near the harbor. Tough crowd. If you\'re not a fisherman, you\'re a tourist who wandered too far.',
    description: 'The harbor bar. Longliners and seiner captains hold court here after a day on the water. Buy a bottle of something brown and listen.',
    interior: {
      blocks: ['spruce_planks', 'cobblestone', 'barrel', 'iron_bars'],
      features: ['bar_counter', 'liquor_shelves', 'pool_table', 'tough_crowd'],
      size: { w: 10, h: 4, d: 7 },
    },
  },

  // ─── RESTAURANTS ─────────────────────────────────────
  mean_queen: {
    id: 'mean_queen',
    name: 'Mean Queen',
    location: { street: 'Harbor', address: 205, streetKey: 'harbor' },
    type: 'restaurant',
    npc: null,
    functions: ['eat', 'buy_food', 'socialize'],
    hours: { open: 11, close: 22 },
    atmosphere: 'Pizza and beer with a harbor view. The name is ironic — the queen is actually nice.',
    description: 'Harbor-front pizza and bar. Locals and tourists both eat here. Decent halibut fish and chips.',
    interior: {
      blocks: ['oak_planks', 'white_concrete', 'furnace', 'chest'],
      features: ['pizza_oven', 'harbor_view_windows', 'booths', 'outdoor_deck'],
      size: { w: 10, h: 4, d: 8 },
    },
  },

  the_galley: {
    id: 'the_galley',
    name: 'The Galley Restaurant',
    location: { street: 'Katlian', address: 485, streetKey: 'katlian' },
    type: 'restaurant',
    npc: null,
    functions: ['eat', 'buy_food'],
    hours: { open: 11, close: 21 },
    atmosphere: 'Cozy seafood restaurant. Best fish tacos in town. Locals argue about this constantly.',
    description: 'Seafood done right. The halibut is fresh off the boat. If Ernie recommends a place, it\'s The Galley.',
    interior: {
      blocks: ['spruce_planks', 'sea_pickle', 'lantern'],
      features: ['open_kitchen', 'nautical_decor', 'fireplace'],
      size: { w: 9, h: 4, d: 7 },
    },
  },

  slammin_salmon: {
    id: 'slammin_salmon',
    name: "Slammin' Salmon @ Fisherman's Alley",
    location: { street: 'Lincoln', address: 200, streetKey: 'lincoln' },
    type: 'restaurant',
    npc: null,
    functions: ['eat', 'buy_food', 'see_daily_catch'],
    hours: { open: 11, close: 22 },
    atmosphere: 'Right in Fisherman\'s Alley. You can see the boats from your table. The salmon literally went from ocean to plate.',
    description: "The freshest seafood in Sitka, which is saying something. The name is terrible but the food isn't.",
    interior: {
      blocks: ['oak_planks', 'glass_pane', 'item_frame'],
      features: ['fish_display', 'open_kitchen', 'dockside_seating'],
      size: { w: 10, h: 4, d: 7 },
    },
  },

  thai_alaska: {
    id: 'thai_alaska',
    name: 'Thai Alaska Kitchen',
    location: { street: 'Lincoln', address: 205, streetKey: 'lincoln' },
    type: 'restaurant',
    npc: null,
    functions: ['eat', 'buy_food'],
    hours: { open: 11, close: 21 },
    atmosphere: 'Small but perfect. Pad thai and halibut curry. Who knew? Everyone in Sitka, actually.',
    description: 'The surprise hit of Sitka dining. Thai food made with fresh Alaska seafood. Locals drive across town for this.',
    interior: {
      blocks: ['bamboo', 'lantern', 'red_carpet'],
      features: ['small_counter', 'stools', 'tropical_plants'],
      size: { w: 7, h: 4, d: 5 },
    },
  },

  campfire_kitchen: {
    id: 'campfire_kitchen',
    name: 'Campfire Kitchen - Woodfire Pizza',
    location: { street: 'Lincoln', address: 331, streetKey: 'lincoln' },
    type: 'restaurant',
    npc: null,
    functions: ['eat', 'buy_food'],
    hours: { open: 11, close: 22 },
    atmosphere: 'Wood-fired pizza in Alaska. Smells amazing from a block away.',
    description: 'Woodfire pizza on Lincoln Street. The kind of place where fishermen and tourists sit next to each other and both leave happy.',
    interior: {
      blocks: ['stone', 'campfire', 'oak_planks'],
      features: ['pizza_oven', 'communal_tables', 'fire_pit'],
      size: { w: 10, h: 4, d: 8 },
    },
  },

  coldwater_bar_grill: {
    id: 'coldwater_bar_grill',
    name: 'Coldwater Bar & Grill',
    location: { street: 'Seward', address: 330, streetKey: 'seward' },
    type: 'restaurant',
    npc: null,
    functions: ['eat', 'buy_drinks'],
    hours: { open: 11, close: 23 },
    atmosphere: 'Bar and grill with a local crowd. Burgers, fish, beer. Nothing fancy, everything good.',
    description: 'The neighborhood bar on Seward Street. If you live on this side of town, this is your spot.',
    interior: {
      blocks: ['spruce_planks', 'stone_bricks', 'barrel'],
      features: ['bar_counter', 'booths', 'tv_screens'],
      size: { w: 10, h: 4, d: 7 },
    },
  },

  bayview_restaurant: {
    id: 'bayview_restaurant',
    name: 'Bayview Restaurant',
    location: { street: 'Lincoln', address: 407, streetKey: 'lincoln' },
    type: 'restaurant',
    npc: null,
    functions: ['eat', 'buy_food'],
    hours: { open: 7, close: 21 },
    atmosphere: 'Upstairs restaurant with a view of the sound. Breakfast spot for the hotel crowd.',
    description: 'Upstairs on Lincoln with water views. Best breakfast in town if you\'re not cooking it yourself.',
    interior: {
      blocks: ['white_concrete', 'glass_pane', 'oak_planks'],
      features: ['bay_windows', 'white_tablecloths', 'breakfast_bar'],
      size: { w: 9, h: 5, d: 7 },
    },
  },

  // ─── SHOPS ───────────────────────────────────────────
  lfs_marine_supplies: {
    id: 'lfs_marine_supplies',
    name: 'LFS Marine Supplies',
    location: { street: 'Katlian', address: 475, streetKey: 'katlian' },
    type: 'shop',
    npc: 'linda',
    functions: ['buy_gear', 'sell_gear', 'repair_gear', 'get_advice'],
    hours: { open: 7, close: 18 },
    atmosphere: 'The smell of new rope and rubber boots. Every wall covered with gear. Linda knows where every single item is.',
    description: 'THE marine supply store in Sitka. Linda knows everything about every piece of gear. Need a specific hook for halibut? She\'s got it. Need 600 feet of 3/8" braided line? In the back, left shelf, third bin.',
    inventory: {
      categories: ['rods', 'reels', 'line', 'hooks', 'weights', 'netting', 'rope', 'hardware', 'safety', 'electronics', 'clothing', 'bait'],
      tierRange: [1, 3],
      specials: ['tide_chart_printout', 'fishing_knot_book'],
    },
    interior: {
      blocks: ['stone', 'iron_bars', 'chest', 'oak_planks'],
      features: ['gear_shelves', 'rope_coils', 'bait_freezer', 'counter', 'repair_bench'],
      size: { w: 14, h: 5, d: 10 },
    },
  },

  ace_hardware: {
    id: 'ace_hardware',
    name: 'Ace Hardware Sitka',
    location: { street: 'Halibut Point', address: 815, streetKey: 'halibut_point' },
    type: 'shop',
    npc: null,
    functions: ['buy_gear', 'buy_hardware', 'buy_tools'],
    hours: { open: 7, close: 19 },
    atmosphere: 'Standard Ace Hardware, but in Alaska. More fishing gear than a typical Ace, fewer lawn mowers.',
    description: 'The hardware store out on Halibut Point Road. Good for boat repair supplies, tools, and basic fishing gear.',
    inventory: {
      categories: ['tools', 'hardware', 'paint', 'rope', 'basic_fishing', 'safety', 'marine_hardware'],
      tierRange: [1, 2],
    },
    interior: {
      blocks: ['stone_bricks', 'oak_planks', 'iron_bars', 'chest'],
      features: ['aisles', 'helpful_signs', 'checkout_counter'],
      size: { w: 16, h: 5, d: 12 },
    },
  },

  market_center: {
    id: 'market_center',
    name: 'Market Center',
    location: { street: 'Baranof', address: 210, streetKey: 'baranof' },
    type: 'shop',
    npc: null,
    functions: ['buy_groceries', 'buy_bait', 'buy_ice'],
    hours: { open: 7, close: 22 },
    atmosphere: 'The main grocery store in town. Smaller than a city grocery but they have what you need. Checkout line gossip is how Sitka gets its news.',
    description: 'Downtown grocery. Not huge, but you can get your basics. The produce section is smaller than you\'d like but the seafood counter makes up for it.',
    inventory: {
      categories: ['groceries', 'produce', 'meat', 'seafood', 'frozen', 'beverages', 'bait', 'ice'],
      tierRange: [1, 1],
    },
    interior: {
      blocks: ['white_concrete', 'glass', 'chest', 'barrel'],
      features: ['shopping_aisles', 'seafood_counter', 'checkout', 'produce_display'],
      size: { w: 16, h: 5, d: 12 },
    },
  },

  sea_mart: {
    id: 'sea_mart',
    name: 'Sea Mart Quality Foods',
    location: { street: 'Halibut Point', address: 1867, streetKey: 'halibut_point' },
    type: 'shop',
    npc: null,
    functions: ['buy_groceries', 'buy_bait', 'buy_ice'],
    hours: { open: 7, close: 22 },
    atmosphere: 'The bigger grocery store. Out on Halibut Point Road where there\'s room for parking. Weekend shopping destination.',
    description: 'The main grocery store for most Sitkans. Bigger selection than Market Center, parking lot is always full.',
    inventory: {
      categories: ['groceries', 'produce', 'meat', 'seafood', 'frozen', 'beverages', 'bait', 'ice', 'pharmacy'],
      tierRange: [1, 1],
    },
    interior: {
      blocks: ['white_terracotta', 'glass', 'chest', 'spruce_planks'],
      features: ['aisles', 'seafood_section', 'pharmacy', 'bakery', 'parking_lot'],
      size: { w: 20, h: 5, d: 14 },
    },
  },

  alaska_commercial: {
    id: 'alaska_commercial',
    name: 'Alaska Commercial Company',
    location: { street: 'Halibut Point', address: '705B', streetKey: 'halibut_point' },
    type: 'shop',
    npc: null,
    functions: ['buy_gear', 'buy_supplies', 'buy_clothing'],
    hours: { open: 8, close: 20 },
    atmosphere: 'The general store. Has a bit of everything. Alaska chainsaw art by the door, Carhartt section in the back.',
    description: 'General store with an Alaska twist. Good for work clothes, basic gear, and things you forgot to pack.',
    inventory: {
      categories: ['clothing', 'workwear', 'basic_gear', 'souvenirs', 'groceries'],
      tierRange: [1, 1],
    },
    interior: {
      blocks: ['spruce_planks', 'stone', 'chest'],
      features: ['general_merchandise', 'carhartt_wall', 'checkout'],
      size: { w: 12, h: 4, d: 9 },
    },
  },

  // ─── LODGING ─────────────────────────────────────────
  sitka_hotel: {
    id: 'sitka_hotel',
    name: 'Sitka Hotel',
    location: { street: 'Lincoln', address: 118, streetKey: 'lincoln' },
    type: 'lodging',
    npc: null,
    functions: ['rest', 'save_game', 'meet_people'],
    hours: { open: 0, close: 24 },
    atmosphere: 'Old-school Alaska hotel. Clean, simple, functional. The kind of place where the walls have stories.',
    description: 'Downtown hotel on Lincoln Street. If you\'re not sleeping on your boat, you\'re sleeping here.',
    interior: {
      blocks: ['spruce_planks', 'white_wool', 'red_bed', 'chest'],
      features: ['lobby', 'rooms', 'front_desk'],
      size: { w: 12, h: 4, d: 10 },
    },
  },

  baranof_lodge: {
    id: 'baranof_lodge',
    name: 'Baranof Lodge',
    location: { street: 'Sawmill Creek', address: 404, streetKey: 'sawmill_creek' },
    type: 'lodging',
    npc: null,
    functions: ['rest', 'save_game', 'dining'],
    hours: { open: 0, close: 24 },
    atmosphere: 'The resort hotel. Where the tourists with money stay. Nice restaurant downstairs.',
    description: 'Sitka\'s resort hotel near the airport. Pricier than the Sitka Hotel but the views are worth it.',
    interior: {
      blocks: ['dark_oak_planks', 'glass_pane', 'red_bed', 'lantern'],
      features: ['grand_lobby', 'restaurant', 'ocean_view_rooms'],
      size: { w: 16, h: 6, d: 12 },
    },
  },

  longliner_lodge: {
    id: 'longliner_lodge',
    name: 'LongLiner Lodge',
    location: { street: 'Katlian', address: 485, streetKey: 'katlian' },
    type: 'lodging',
    npc: null,
    functions: ['rest', 'save_game', 'meet_charter_captains'],
    hours: { open: 0, close: 24 },
    atmosphere: 'Fisherman\'s lodge. Charter clients stay here. Smells like waders and coffee.',
    description: 'The lodge for sport fishing clients. Charter captains pick up their guests from here every morning at 5am.',
    interior: {
      blocks: ['spruce_log', 'spruce_planks', 'lantern', 'barrel'],
      features: ['bunk_rooms', 'gear_drying_room', 'coffee_station', 'fish_cleaning_area'],
      size: { w: 14, h: 4, d: 10 },
    },
  },

  southeast_resort: {
    id: 'southeast_resort',
    name: 'Southeast Resort',
    location: { street: 'Seward', address: 330, streetKey: 'seward' },
    type: 'lodging',
    npc: null,
    functions: ['rest', 'save_game'],
    hours: { open: 0, close: 24 },
    atmosphere: 'Small resort on Seward Street. Quiet, comfortable, affordable.',
    description: 'A smaller resort option. Popular with repeat visitors who know Sitka well.',
    interior: {
      blocks: ['oak_planks', 'white_wool', 'flower_pot'],
      features: ['cozy_lobby', 'rooms', 'garden_area'],
      size: { w: 10, h: 4, d: 8 },
    },
  },

  eagle_bay_inn: {
    id: 'eagle_bay_inn',
    name: 'Eagle Bay Inn',
    location: { street: 'Sawmill Creek', address: 1321, streetKey: 'sawmill_creek' },
    type: 'lodging',
    npc: null,
    functions: ['rest', 'save_game'],
    hours: { open: 0, close: 24 },
    atmosphere: 'Quiet inn out Sawmill Creek Road. Eagles nest nearby — hence the name.',
    description: 'Peaceful spot away from downtown. Eagles perch on the trees out back. Good breakfast.',
    interior: {
      blocks: ['spruce_planks', 'cobblestone', 'lantern'],
      features: ['innkeeper_desk', 'cozy_rooms', 'breakfast_nook'],
      size: { w: 10, h: 4, d: 8 },
    },
  },

  // ─── HARBORS ─────────────────────────────────────────
  eliason_harbor: {
    id: 'eliason_harbor',
    name: 'Eliason Harbor',
    location: { street: 'Siginaka Way', address: null, streetKey: 'harbor' },
    type: 'harbor',
    npc: null, // harbormaster is nearby
    functions: ['dock_boat', 'launch_boat', 'coffee_row', 'check_moorage', 'daily_report'],
    hours: { open: 0, close: 24 },
    atmosphere: 'The main harbor. Floats creak, rigging clanks, gulls wheel overhead. The smell of diesel and kelp. Old guys drink coffee on the dock at 6am.',
    description: 'Sitka\'s main harbor. This is where it happens. Hundreds of boats — seiners, longliners, trollers, charter boats, skiffs, and the occasional visiting yacht.',
    interior: {
      blocks: ['spruce_planks', 'stone', 'iron_bars', 'lantern', 'chest', 'water'],
      features: ['docks', 'slips', 'fuel_dock', 'boat_ramp', 'harbormaster_office', 'coffee_row_bench'],
      size: { w: 40, h: 3, d: 20 },
    },
  },

  anb_harbor: {
    id: 'anb_harbor',
    name: 'ANB Harbor',
    location: { street: 'Katlian', address: 617, streetKey: 'katlian' },
    type: 'harbor',
    npc: null,
    functions: ['dock_boat', 'check_moorage'],
    hours: { open: 0, close: 24 },
    atmosphere: 'Commercial fishing harbor. Bigger boats, more serious. Named after the Alaska Native Brotherhood.',
    description: 'The commercial harbor. If your boat is over 50 feet, this is where you dock. Working boats only — tourists get lost looking for this place.',
    interior: {
      blocks: ['dark_oak_planks', 'stone', 'iron_bars'],
      features: ['industrial_docks', 'crane', 'net_lofts', 'ice_plant'],
      size: { w: 30, h: 3, d: 15 },
    },
  },

  crescent_harbor: {
    id: 'crescent_harbor',
    name: 'Crescent Harbor',
    location: { street: 'Lincoln', address: null, streetKey: 'harbor' },
    type: 'harbor',
    npc: null,
    functions: ['dock_boat', 'launch_boat'],
    hours: { open: 0, close: 24 },
    atmosphere: 'Smaller harbor near downtown. More protected. Smaller boats, recreational fleet.',
    description: 'The small boat harbor. Recreational fishermen, small skiffs, and a few charter boats. Quieter than Eliason.',
    interior: {
      blocks: ['oak_planks', 'stone'],
      features: ['small_docks', 'boat_ramp', 'parking'],
      size: { w: 25, h: 3, d: 12 },
    },
  },

  // ─── CHARTERS ────────────────────────────────────────
  sea_roamer_charters: {
    id: 'sea_roamer_charters',
    name: 'Sea Roamer Charters',
    location: { street: 'Jeff Davis', address: 103, streetKey: 'jeff_davis' },
    type: 'charter',
    npc: null,
    functions: ['book_charter', 'get_fishing_report', 'meet_captain'],
    hours: { open: 5, close: 20 },
    atmosphere: 'Charter office near the harbor. Photos of trophy fish on the walls. Phone ringing with bookings.',
    description: 'One of Sitka\'s established charter operations. Half-day and full-day trips for halibut and salmon.',
    interior: {
      blocks: ['spruce_planks', 'item_frame', 'chest'],
      features: ['trophy_photos', 'booking_desk', 'gear_storage'],
      size: { w: 8, h: 4, d: 6 },
    },
  },

  a_z_sportfishing: {
    id: 'a_z_sportfishing',
    name: 'A-Z Sportfishing Charters',
    location: { street: 'Halibut Point', address: 3922, streetKey: 'halibut_point' },
    type: 'charter',
    npc: null,
    functions: ['book_charter', 'get_fishing_report'],
    hours: { open: 5, close: 20 },
    description: 'Charter operation out on Halibut Point Road. Good reputation for halibut trips.',
    interior: {
      blocks: ['oak_planks', 'item_frame'],
      features: ['booking_office', 'gear_room'],
      size: { w: 8, h: 4, d: 6 },
    },
  },

  sitka_point_lodge: {
    id: 'sitka_point_lodge',
    name: 'Sitka Point Lodge & Fishing Charters',
    location: { street: 'Halibut Point', address: 4110, streetKey: 'halibut_point' },
    type: 'charter',
    npc: null,
    functions: ['book_charter', 'rest', 'dining', 'get_fishing_report'],
    hours: { open: 0, close: 24 },
    description: 'Lodge and charter combo out on Halibut Point Road. All-inclusive fishing packages.',
    interior: {
      blocks: ['dark_oak_planks', 'spruce_log', 'lantern'],
      features: ['lodge_rooms', 'charter_dock', 'dining_hall'],
      size: { w: 16, h: 5, d: 12 },
    },
  },

  angling_unlimited: {
    id: 'angling_unlimited',
    name: 'Angling Unlimited',
    location: { street: 'Halibut Point', address: 4256, streetKey: 'halibut_point' },
    type: 'charter',
    npc: null,
    functions: ['book_charter', 'get_fishing_report'],
    hours: { open: 5, close: 20 },
    description: 'Another well-known charter. They specialize in salmon and halibut combo trips.',
    interior: {
      blocks: ['oak_planks', 'item_frame', 'chest'],
      features: ['booking_office', 'fleet_photos'],
      size: { w: 8, h: 4, d: 6 },
    },
  },

  fish_baranof: {
    id: 'fish_baranof',
    name: 'Fish Baranof',
    location: { street: 'Katlian', address: 485, streetKey: 'katlian' },
    type: 'charter',
    npc: null,
    functions: ['book_charter'],
    hours: { open: 6, close: 19 },
    description: 'Charter fishing operation on Katlian Street. Smaller outfit, personal service.',
    interior: {
      blocks: ['spruce_planks'],
      features: ['small_office', 'dock_access'],
      size: { w: 7, h: 4, d: 5 },
    },
  },

  // ─── SCHOOLS ─────────────────────────────────────────
  sitka_high_school: {
    id: 'sitka_high_school',
    name: 'Sitka High School',
    location: { street: 'Lake', address: 1000, streetKey: 'lake' },
    type: 'school',
    npc: 'dave',
    functions: ['attend_class', 'get_school_quest', 'learn_history'],
    hours: { open: 8, close: 15 },
    atmosphere: 'The high school. Kids with XtraTuf boots and hoodies. Fishing rods in the back of trucks in the parking lot.',
    description: 'Sitka High School. Home of the Wolves. The kids here can fillet a salmon faster than most adults.',
    interior: {
      blocks: ['stone_bricks', 'oak_planks', 'glass_pane', 'chest', 'lectern'],
      features: ['classrooms', 'gym', 'library', 'parking_lot'],
      size: { w: 20, h: 5, d: 15 },
    },
  },

  keet_gooshi_heen: {
    id: 'keet_gooshi_heen',
    name: 'Keet Gooshi Heen Elementary',
    location: { street: 'Kashevaroff', address: 307, streetKey: 'kashevaroff' },
    type: 'school',
    npc: null,
    functions: ['visit', 'learn_tlingit_words'],
    hours: { open: 8, close: 15 },
    atmosphere: 'Elementary school named after a Tlingit scholar. Tlingit language classes taught here.',
    description: 'The elementary school. Named after a Tlingit scholar. Kids learn Lingít here alongside English.',
    interior: {
      blocks: ['oak_planks', 'white_concrete', 'glass_pane', 'lectern'],
      features: ['classrooms', 'playground', 'library', 'totem_pole'],
      size: { w: 18, h: 4, d: 12 },
    },
  },

  xoots_elementary: {
    id: 'xoots_elementary',
    name: 'Xóots Elementary',
    location: { street: 'Baranof', address: 305, streetKey: 'baranof' },
    type: 'school',
    npc: null,
    functions: ['visit'],
    hours: { open: 8, close: 15 },
    description: 'Elementary school on Baranof Street. Part of the Sitka School District.',
    interior: {
      blocks: ['spruce_planks', 'glass_pane', 'lectern'],
      features: ['classrooms', 'playground'],
      size: { w: 16, h: 4, d: 10 },
    },
  },

  pacific_high_school: {
    id: 'pacific_high_school',
    name: 'Pacific High School',
    location: { street: 'Lincoln', address: 509, streetKey: 'lincoln' },
    type: 'school',
    npc: null,
    functions: ['visit'],
    hours: { open: 8, close: 15 },
    description: 'Alternative high school in downtown Sitka. Small classes, hands-on learning.',
    interior: {
      blocks: ['oak_planks', 'glass_pane', 'lectern'],
      features: ['classrooms', 'workshop', 'garden'],
      size: { w: 12, h: 4, d: 8 },
    },
  },

  mt_edgecumbe_high_school: {
    id: 'mt_edgecumbe_hs',
    name: 'Mt. Edgecumbe High School',
    location: { street: 'Seward', address: 1330, streetKey: 'seward' },
    type: 'school',
    npc: null,
    functions: ['visit'],
    hours: { open: 8, close: 15 },
    atmosphere: 'The boarding school. Students from villages all over Alaska come here. Beautiful campus overlooking the sound.',
    description: 'Historic boarding school for Alaska Native students from across the state. Originally a BIA school, now run by the state. Stunning views.',
    interior: {
      blocks: ['stone_bricks', 'dark_oak_planks', 'glass_pane'],
      features: ['dormitories', 'classrooms', 'athletic_field', 'ocean_view'],
      size: { w: 24, h: 5, d: 18 },
    },
  },

  // ─── CHURCHES & LANDMARKS ────────────────────────────
  st_michaels_cathedral: {
    id: 'st_michaels_cathedral',
    name: 'St. Michael the Archangel Orthodox Cathedral',
    location: { street: 'Lincoln', address: 240, streetKey: 'lincoln' },
    type: 'landmark',
    npc: 'old_thomas',
    functions: ['visit', 'learn_history', 'meet_old_thomas'],
    hours: { open: 9, close: 17 },
    atmosphere: 'Russian Orthodox cathedral with onion domes. Historic. Quiet. Incense and old wood. Old Thomas sits on the bench outside.',
    description: "The heart of Sitka's Russian history. Built in the 1840s, rebuilt after a fire. Russian Orthodox — a reminder that Alaska was once Russian America.",
    interior: {
      blocks: ['spruce_planks', 'gold_block', 'red_carpet', 'lantern', 'iron_bars'],
      features: ['onion_domes', 'icons', 'candles', 'wooden_pews', 'bell_tower'],
      size: { w: 10, h: 8, d: 8 },
    },
  },

  first_baptist_church: {
    id: 'first_baptist_church',
    name: 'First Baptist Church',
    location: { street: 'Halibut Point', address: 514, streetKey: 'halibut_point' },
    type: 'landmark',
    npc: null,
    functions: ['visit'],
    hours: { open: 0, close: 24 },
    description: 'Community church on Halibut Point Road. Sunday services, potlucks, and community suppers.',
    interior: {
      blocks: ['stone_bricks', 'oak_planks', 'glass_pane'],
      features: ['sanctuary', 'steeple', 'community_hall'],
      size: { w: 12, h: 7, d: 10 },
    },
  },

  st_peters_episcopal: {
    id: 'st_peters_episcopal',
    name: "St. Peter's by the Sea Episcopal",
    location: { street: 'Lincoln', address: 611, streetKey: 'lincoln' },
    type: 'landmark',
    npc: null,
    functions: ['visit'],
    hours: { open: 0, close: 24 },
    description: "Small Episcopal church on Lincoln Street. 'By the Sea' is right — you can hear the harbor from the pews.",
    interior: {
      blocks: ['stone', 'oak_planks', 'glass_pane', 'lantern'],
      features: ['small_sanctuary', 'ocean_view', 'garden'],
      size: { w: 8, h: 5, d: 7 },
    },
  },

  // ─── FUEL ────────────────────────────────────────────
  petro_express: {
    id: 'petro_express',
    name: 'Petro Express Car Wash & Gas',
    location: { street: 'Katlian', address: 614, streetKey: 'katlian' },
    type: 'fuel',
    npc: null,
    functions: ['buy_fuel', 'wash_vehicle'],
    hours: { open: 6, close: 22 },
    description: 'Gas station and car wash on Katlian Street. Fill up the truck before heading to the harbor.',
    interior: {
      blocks: ['stone', 'iron_bars', 'cauldron'],
      features: ['gas_pumps', 'car_wash', 'convenience_store'],
      size: { w: 10, h: 4, d: 8 },
    },
  },

  petro_marine: {
    id: 'petro_marine',
    name: 'Petro Marine North Plant',
    location: { street: 'Katlian', address: 613, streetKey: 'katlian' },
    type: 'fuel',
    npc: null,
    functions: ['buy_boat_fuel', 'buy_diesel'],
    hours: { open: 6, close: 20 },
    description: 'Marine fuel dock. Diesel for the fishing fleet. The smell of fuel hangs heavy here.',
    interior: {
      blocks: ['stone', 'iron_bars', 'cauldron', 'barrel'],
      features: ['fuel_dock', 'diesel_tanks', 'pumps'],
      size: { w: 12, h: 4, d: 10 },
    },
  },

  delta_western: {
    id: 'delta_western',
    name: 'Delta Western',
    location: { street: 'Halibut Point', address: 5311, streetKey: 'halibut_point' },
    type: 'fuel',
    npc: null,
    functions: ['buy_boat_fuel', 'buy_diesel', 'buy_propane'],
    hours: { open: 6, close: 20 },
    description: 'Major marine fuel supplier. The big trucks you see on Halibut Point Road are heading here.',
    interior: {
      blocks: ['stone', 'iron_bars', 'barrel'],
      features: ['fuel_tanks', 'truck_dock', 'office'],
      size: { w: 16, h: 5, d: 12 },
    },
  },

  // ─── SERVICES ────────────────────────────────────────
  harbormaster: {
    id: 'harbormaster',
    name: 'Sitka Harbormaster',
    location: { street: 'Katlian', address: 617, streetKey: 'katlian' },
    type: 'service',
    npc: 'mary',
    functions: ['pay_moorage', 'get_permit', 'file_float_plan', 'hear_announcements'],
    hours: { open: 8, close: 17 },
    atmosphere: 'Official but friendly. Charts on the wall, radio crackling, Mary knows every boat by name.',
    description: "The harbormaster's office. Mary runs a tight ship — literally. Moorage permits, float plans, harbor regulations. She'll also tell you if a boat is sinking.",
    interior: {
      blocks: ['spruce_planks', 'oak_planks', 'map', 'lectern', 'chest'],
      features: ['permit_counter', 'radio_desk', 'harbor_charts', 'bulletin_board'],
      size: { w: 10, h: 4, d: 8 },
    },
  },

  visitor_center: {
    id: 'visitor_center',
    name: 'Sitka Centennial Visitors Center',
    location: { street: 'Harbor', address: 330, streetKey: 'harbor' },
    type: 'service',
    npc: 'tourist',
    functions: ['get_map', 'learn_history', 'meet_tourists'],
    hours: { open: 8, close: 17 },
    atmosphere: 'Clean, bright, full of brochures. The tourist NPC asks dumb questions here. "Is this where they film Deadliest Catch?" "No, that\'s Dutch Harbor."',
    description: 'The visitors center. Pick up a map, learn about Sitka history, and try not to roll your eyes at the tourists.',
    interior: {
      blocks: ['white_concrete', 'glass_pane', 'spruce_planks', 'lectern'],
      features: ['information_desk', 'gift_shop', 'exhibit', 'restrooms'],
      size: { w: 14, h: 5, d: 10 },
    },
  },

  adfg_office: {
    id: 'adfg_office',
    name: 'ADF&G Office',
    location: { street: 'Katlian', address: null, streetKey: 'katlian' },
    type: 'service',
    npc: 'sarah',
    functions: ['check_regulations', 'get_species_info', 'report_catch', 'tag_salmon'],
    hours: { open: 8, close: 17 },
    atmosphere: 'Government office but the biologists here actually care. Sarah has posters of salmon life cycles and a tank with juvenile fish.',
    description: "Alaska Department of Fish and Game. This is where you learn the rules. What's open, what's closed, what size, what limit. Sarah will explain it all — she actually likes teaching people.",
    interior: {
      blocks: ['oak_planks', 'glass_pane', 'lectern', 'chest'],
      features: ['regulation_posters', 'species_displays', 'permit_window', 'fish_tank'],
      size: { w: 10, h: 4, d: 8 },
    },
  },

  post_office: {
    id: 'post_office',
    name: 'Sitka Post Office',
    location: { street: 'Lincoln', address: null, streetKey: 'lincoln' },
    type: 'service',
    npc: null,
    functions: ['send_mail', 'receive_packages'],
    hours: { open: 9, close: 17 },
    description: 'The post office. Every small town needs one. Ship your fish home from here.',
    interior: {
      blocks: ['stone_bricks', 'oak_planks', 'chest', 'lectern'],
      features: ['po_boxes', 'shipping_counter'],
      size: { w: 10, h: 4, d: 7 },
    },
  },

  health_center: {
    id: 'health_center',
    name: 'Sitka Community Health Center',
    location: { street: 'Baranof', address: null, streetKey: 'baranof' },
    type: 'service',
    npc: null,
    functions: ['heal', 'get_medical_advice'],
    hours: { open: 8, close: 18 },
    description: 'The clinic. Not the place you want to visit, but good to know it\'s there if you hook yourself.',
    interior: {
      blocks: ['white_concrete', 'glass_pane', 'chest'],
      features: ['reception', 'exam_rooms', 'pharmacy'],
      size: { w: 12, h: 4, d: 9 },
    },
  },

  // ─── SPECIAL ─────────────────────────────────────────
  airport: {
    id: 'airport',
    name: 'Sitka Rocky Gutierrez Airport',
    location: { street: 'Airport Road', address: null, streetKey: 'sawmill_creek' },
    type: 'special',
    npc: null,
    functions: ['travel', 'watch_planes'],
    hours: { open: 5, close: 23 },
    atmosphere: 'Small regional airport. The runway is on a narrow strip of land with water on both sides. Every landing is an adventure.',
    description: 'Sitka\'s airport. One of the most scenic — and stressful — approaches in Alaska. Water on both sides of the runway. Alaska Airlines and floatplanes.',
    interior: {
      blocks: ['stone', 'glass_pane', 'iron_bars', 'white_concrete'],
      features: ['terminal', 'runway', 'floatplane_dock', 'baggage_claim'],
      size: { w: 30, h: 4, d: 20 },
    },
  },

  buckland_equipment: {
    id: 'buckland_equipment',
    name: 'Buckland Equipment',
    location: { street: 'Halibut Point', address: 1709, streetKey: 'halibut_point' },
    type: 'shop',
    npc: null,
    functions: ['buy_equipment', 'rent_equipment', 'repair_equipment'],
    hours: { open: 7, close: 17 },
    description: 'Heavy equipment and industrial supplies. If you need a winch for your boat or a generator for your cabin, this is the place.',
    inventory: {
      categories: ['heavy_equipment', 'winches', 'generators', 'marine_hardware', 'safety'],
      tierRange: [2, 3],
    },
    interior: {
      blocks: ['dark_oak_planks', 'stone', 'iron_bars', 'chest'],
      features: ['showroom', 'warehouse', 'service_bay'],
      size: { w: 18, h: 6, d: 14 },
    },
  },

  sitka_food_coop: {
    id: 'sitka_food_coop',
    name: 'Sitka Food Co-op',
    location: { street: 'Lincoln', address: 236, streetKey: 'lincoln' },
    type: 'shop',
    npc: null,
    functions: ['buy_organic_groceries', 'buy_local_products'],
    hours: { open: 10, close: 18 },
    description: "The co-op. Local products, organic produce, things you can't find at Sea Mart. Run by volunteers.",
    inventory: {
      categories: ['organic_groceries', 'local_products', 'baked_goods', 'specialty'],
      tierRange: [1, 1],
    },
    interior: {
      blocks: ['oak_planks', 'barrel', 'chest'],
      features: ['bulk_bins', 'produce_section', 'community_board'],
      size: { w: 8, h: 4, d: 6 },
    },
  },

  sitka_sea_level_adventures: {
    id: 'sitka_sea_level_adventures',
    name: 'Sitka Sea Level Adventures',
    location: { street: 'Harbor', address: 330, streetKey: 'harbor' },
    type: 'service',
    npc: null,
    functions: ['book_tour', 'rent_kayak', 'get_wildlife_info'],
    hours: { open: 8, close: 18 },
    description: 'Tour company for visitors. Kayak rentals, whale watching tours, hiking guides. Good intel on wildlife locations.',
    interior: {
      blocks: ['spruce_planks', 'glass_pane'],
      features: ['tour_desk', 'kayak_rack', 'gear_rental'],
      size: { w: 9, h: 4, d: 7 },
    },
  },
};

/**
 * Get building by ID
 */
export function getBuilding(id) {
  return BUILDINGS[id] || null;
}

/**
 * Get all buildings of a given type
 */
export function getBuildingsByType(type) {
  return Object.values(BUILDINGS).filter(b => b.type === type);
}

/**
 * Get all buildings on a given street
 */
export function getBuildingsOnStreet(streetKey) {
  return Object.values(BUILDINGS).filter(b => b.location.streetKey === streetKey);
}

/**
 * Check if a building is open at a given hour (0-23)
 */
export function isOpen(buildingId, hour) {
  const b = BUILDINGS[buildingId];
  if (!b || !b.hours) return false;
  if (b.hours.open < b.hours.close) {
    return hour >= b.hours.open && hour < b.hours.close;
  }
  // Wraps midnight (e.g., 15:00 - 1:00)
  return hour >= b.hours.open || hour < b.hours.close;
}

/**
 * Find nearby buildings within radius (Minecraft blocks)
 */
export function findNearbyBuildings(x, z, radius = 30) {
  const results = [];
  for (const [id, pos] of Object.entries(BUILDING_POSITIONS)) {
    const dx = pos.x - x;
    const dz = pos.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= radius) results.push({ id, dist, ...pos, building: BUILDINGS[id] });
  }
  return results.sort((a, b) => a.dist - b.dist);
}

export default { BUILDINGS, BUILDING_POSITIONS };
