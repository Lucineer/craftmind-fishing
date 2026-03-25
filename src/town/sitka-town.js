// CraftMind Fishing — Town of Sitka
// The player's home base. Real streets, real businesses, real Alaska character.

export const TOWN_CONFIG = {
  name: 'Sitka',
  subtitle: 'Sitka Sound, Southeast Alaska',
  population: 8500,
  description: 'A fishing town wrapped in rainforest and salt water. The biggest town on Baranof Island, where Tlingit people have lived for thousands of years and Russian America once ruled the Pacific.',
};

// Main streets with their character and block ranges
export const STREETS = {
  lincoln: {
    name: 'Lincoln Street',
    type: 'main_downtown',
    description: 'The heart of downtown Sitka. Restaurants, bars, shops, tourists, and fishermen all mix on this narrow strip of asphalt.',
    blocks: {
      100: 'downtown_core',
      200: 'restaurant_row',
      300: 'downtown_shops',
      400: 'midtown',
      500: 'residential_downtown',
    },
    atmosphere: 'salt air, coffee shops, tourists with cameras, pickup trucks with crab pots in the back',
  },
  harbor: {
    name: 'Harbor Drive',
    type: 'waterfront',
    description: 'The waterfront road. Walk here and you smell diesel, kelp, and coffee from the visitor center. Fishing boats bob in the harbor.',
    blocks: {
      300: 'visitor_center',
      330: 'tours',
      400: 'harbor_access',
    },
    atmosphere: 'gulls crying, diesel fumes, boat masts swaying, harbor seals hoping for scraps',
  },
  katlian: {
    name: 'Katlian Street',
    type: 'harbor_commercial',
    description: 'Commercial strip connecting downtown to ANB Harbor. Marine supplies, fuel, the Pioneer Bar.',
    blocks: {
      200: 'pioneer_bar',
      400: 'marine_supplies',
      600: 'anb_harbor',
    },
    atmosphere: 'work trucks, forklifts, the smell of marine epoxy and fresh paint',
  },
  baranof: {
    name: 'Baranof Street',
    type: 'residential_commercial',
    description: 'Runs parallel to Lincoln. Market Center grocery, Xóots Elementary, quieter feel.',
    blocks: {
      200: 'grocery',
      300: 'school',
    },
    atmosphere: 'minivans, dog walkers, kids on bikes',
  },
  halibut_point: {
    name: 'Halibut Point Road',
    type: 'highway',
    description: 'The main road out of town. Ace Hardware, Sea Mart, fuel docks — everything practical is out here.',
    blocks: {
      800: 'ace_hardware',
      1700: 'buckland_equipment',
      1800: 'sea_mart',
      5300: 'delta_western_fuel',
      3900: 'charter_boats',
      4100: 'lodge_charters',
    },
    atmosphere: 'wider road, pickup trucks with boat trailers, Sitka black-tailed deer on the shoulder',
  },
  sawmill_creek: {
    name: 'Sawmill Creek Road',
    type: 'resort_road',
    description: 'Winds toward the airport and Baranof Lodge. The tourist track.',
    blocks: {
      400: 'baranof_lodge',
      1300: 'eagle_bay_inn',
      600: 'airport',
    },
    atmosphere: 'rental cars, taxis, the drone of floatplanes',
  },
  seward: {
    name: 'Seward Street',
    type: 'mixed',
    description: 'Coldwater Bar & Grill, Southeast Resort, and the road toward Mt Edgecumbe High School.',
    blocks: {
      300: 'coldwater_resort',
      1300: 'mt_edgecumbe_hs',
    },
    atmosphere: 'locals eating lunch, out-of-town construction workers',
  },
  jeff_davis: {
    name: 'Jeff Davis Street',
    type: 'harbor_access',
    description: 'Short street near the harbor. Sea Roamer Charters has their dock here.',
    blocks: {
      100: 'sea_roamer_charters',
    },
    atmosphere: 'charter boat signs, coolers waiting for fishermen, the sound of diesel generators',
  },
  lake: {
    name: 'Lake Street',
    type: 'residential',
    description: 'Climbs the hill. Sitka High School sits up here with a view of the sound.',
    blocks: {
      1000: 'sitka_high',
    },
    atmosphere: 'school buses, kids with fishing rods',
  },
  kashevaroff: {
    name: 'Kashevaroff Street',
    type: 'residential_school',
    description: 'Keet Gooshi Heen Elementary, named after a Tlingit scholar.',
    blocks: {
      300: 'keet_gooshi_heen',
    },
    atmosphere: 'playground noise, parent drop-off line, crossing guards',
  },
};

// Geographic zones — how the town is laid out spatially
export const ZONES = {
  downtown: {
    name: 'Downtown Sitka',
    description: 'Lincoln Street core. The tourist heart. Bars, restaurants, shops.',
    streets: ['lincoln'],
    bounds: { x1: 0, z1: 0, x2: 80, z2: 60 },
    landmarks: ['st_michaels_cathedral', 'totem_park'],
  },
  harbor_district: {
    name: 'Harbor District',
    description: 'Eliason Harbor, Crescent Harbor, Harbor Drive. Where the fishing happens.',
    streets: ['harbor', 'katlian', 'jeff_davis'],
    bounds: { x1: 0, z1: 60, x2: 100, z2: 120 },
    landmarks: ['eliason_harbor', 'crescent_harbor', 'anb_harbor'],
  },
  old_town: {
    name: 'Old Town / Sheldon Jackson',
    description: 'Historic Russian-American area. St. Michael\'s Cathedral, Totem Park.',
    streets: ['lincoln', 'harbor'],
    bounds: { x1: -30, z1: 0, x2: 0, z2: 40 },
    landmarks: ['st_michaels_cathedral', 'sheldon_jackson_museum'],
  },
  industrial: {
    name: 'Halibut Point Road',
    description: 'The practical side of Sitka. Hardware stores, marine fuel, grocery, equipment.',
    streets: ['halibut_point'],
    bounds: { x1: 80, z1: 0, x2: 200, z2: 40 },
    landmarks: ['ace_hardware', 'sea_mart', 'delta_western'],
  },
  airport: {
    name: 'Airport / Sawmill Creek',
    description: 'Out toward the airport. Baranof Lodge, Eagle Bay Inn, floatplane dock.',
    streets: ['sawmill_creek'],
    bounds: { x1: 60, z1: 60, x2: 120, z2: 100 },
    landmarks: ['airport', 'baranof_lodge'],
  },
  residential: {
    name: 'Residential Sitka',
    description: 'Where people actually live. Sitka High School, quiet streets, view houses.',
    streets: ['baranof', 'lake', 'kashevaroff', 'seward'],
    bounds: { x1: -20, z1: 40, x2: 60, z2: 80 },
    landmarks: ['sitka_high', 'keet_gooshi_heen'],
  },
};

// Town layout for Minecraft rendering — block coordinates
// Each zone has a center point and approximate dimensions
export const TOWN_LAYOUT = {
  origin: { x: 0, y: 64, z: 0 }, // sea level spawn
  waterLevel: 62,
  mountEdgecumbe: { x: 300, z: -400, height: 120 }, // across the sound
  scale: 4, // 1 real block = 4 Minecraft blocks (rough)
  zones: {
    downtown: { cx: 0, cz: 30, w: 80, h: 50 },
    harbor: { cx: 0, cz: 80, w: 100, h: 50 },
    industrial: { cx: 120, cz: 10, w: 100, h: 40 },
    airport: { cx: 80, cz: 80, w: 60, h: 40 },
    residential: { cx: -20, cz: 50, w: 60, h: 50 },
  },
};

/**
 * Get a street's full info by key
 */
export function getStreet(key) {
  return STREETS[key] || null;
}

/**
 * Navigate between two buildings — returns distance in Minecraft blocks
 * Building positions are exported from town-buildings.js; pass them in.
 */
export function getDistance(fromId, toId, positions) {
  const a = positions[fromId];
  const b = positions[toId];
  if (!a || !b) return null;
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export default { TOWN_CONFIG, STREETS, ZONES, TOWN_LAYOUT };
