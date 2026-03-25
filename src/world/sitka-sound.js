// CraftMind Fishing — Sitka Sound World Map & Geography
// Southeast Alaska open world: islands, sounds, mountains, kelp, glaciers.

export const BIOMES = {
  open_ocean:       { name: 'Open Ocean',       maxDepth: [40, 100], salinity: 35, visibility: [15, 25], color: '#1a3a5c' },
  sheltered_sound:  { name: 'Sheltered Sound',  maxDepth: [15, 40],  salinity: 32, visibility: [8, 18],  color: '#2a5a4a' },
  kelp_forest:      { name: 'Kelp Forest',      maxDepth: [5, 15],   salinity: 33, visibility: [5, 12],  color: '#2a6a3a' },
  rocky_pinnacles:  { name: 'Rocky Pinnacles',  maxDepth: [5, 60],   salinity: 34, visibility: [10, 20], color: '#4a4a4a' },
  river_estuary:    { name: 'River Estuary',    maxDepth: [2, 10],   salinity: [5, 25], visibility: [2, 6], color: '#5a7a5a' },
  freshwater_river: { name: 'Freshwater River', maxDepth: [1, 5],    salinity: 0,  visibility: [3, 8],  color: '#3a6a8a' },
  alpine_lake:      { name: 'Alpine Lake',      maxDepth: [10, 30],  salinity: 0,  visibility: [12, 22], color: '#2a4a7a' },
  tidal_flats:      { name: 'Tidal Flats',      maxDepth: [0, 3],    salinity: [20, 33], visibility: [1, 4], color: '#8a8a6a' },
  coral_reef:       { name: 'Coral Reef',       maxDepth: [10, 25],  salinity: 35, visibility: [15, 25], color: '#7a4a6a' },
  deep_trench:      { name: 'Deep Trench',      maxDepth: [100, 200],salinity: 35, visibility: [5, 12], color: '#0a1a3c' },
  land:             { name: 'Land',             maxDepth: [0, 0],     salinity: 0,  visibility: 0,        color: '#3a6a3a' },
  mountain:         { name: 'Mountain',         maxDepth: [0, 0],     salinity: 0,  visibility: 0,        color: '#6a6a6a' },
  town:             { name: 'Town',             maxDepth: [0, 0],     salinity: 0,  visibility: 0,        color: '#8a7a6a' },
};

export const LANDMARKS = [
  // Major islands
  { id: 'baranof_island',   name: 'Baranof Island',    emoji: '🏔️', type: 'island',   cx: 120, cz: 200, radius: 80, description: 'The main island. Mountains, Sitka town, and endless coastline.' },
  { id: 'kruzof_island',    name: 'Kruzof Island',     emoji: '🌋', type: 'island',   cx: 320, cz: 140, radius: 60, description: 'Home to Mount Edgecumbe. Offshore fishing grounds surround it.' },
  { id: 'chichagof_island', name: 'Chichagof Island',  emoji: '🌲', type: 'island',   cx: -80, cz: 160, radius: 90, description: 'Vast wilderness island to the west. Bear country.' },
  { id: 'haida_gwaii',     name: 'Haida Gwaii Edge',  emoji: '🌊', type: 'boundary', cx: 500, cz: 300, radius: 40, description: 'The distant southern edge. Open ocean begins.' },
  // Towns & features on Baranof
  { id: 'sitka_town',       name: 'Sitka',             emoji: '🏘️', type: 'town',     cx: 145, cz: 230, radius: 12, description: 'The only real town. Fuel, gear, the harbor, gossip at the docks.' },
  { id: 'deer_mountain',    name: 'Deer Mountain',     emoji: '⛰️', type: 'mountain', cx: 135, cz: 210, radius: 15, description: 'Peak above Sitka. Hiking trail, incredible view of the sound.' },
  { id: 'blue_lake',        name: 'Blue Lake',         emoji: '💎', type: 'lake',     cx: 105, cz: 185, radius: 10, description: 'Freshwater reservoir. Stocked with salmon fry and trout.' },
  { id: 'deer_lake',        name: 'Deer Lake',         emoji: '🦌', type: 'lake',     cx: 85, cz: 165, radius: 8,  description: 'Above the waterfall. Helicopter-stocked. Trophy cutthroat.' },
  // Sound & passages
  { id: 'sitka_sound',      name: 'Sitka Sound',       emoji: '🌊', type: 'water',    cx: 220, cz: 220, radius: 50, description: 'Sheltered water between islands. Salmon highway.' },
  { id: 'the_narrows',      name: 'The Narrows',       emoji: '🔀', type: 'channel',  cx: 200, cz: 280, radius: 8,  description: 'Narrow passage with ripping currents. Dangerous but productive.' },
  { id: 'the_gut',          name: 'The Gut',           emoji: '🌀', type: 'channel',  cx: 280, cz: 310, radius: 6,  description: 'Massive tidal currents. Boats that enter may not return.' },
  // Special fishing spots
  { id: 'halibut_hole',     name: 'Halibut Hole',      emoji: '🐟', type: 'fishing',  cx: 250, cz: 180, radius: 10, description: 'Famous deep pocket near shore. Trophy halibut live here.' },
  { id: 'gods_pocket',      name: "God's Pocket",      emoji: '✨', type: 'fishing',  cx: 350, cz: 250, radius: 12, description: 'Remote legendary fishing. Those who find it never forget.' },
  { id: 'mount_edgecumbe',  name: 'Mount Edgecumbe',   emoji: '🌋', type: 'volcano',  cx: 320, cz: 140, radius: 20, description: 'Dormant volcano. Ring of incredible fishing around its base.' },
  { id: 'mist_cove',        name: 'Mist Cove',         emoji: '🌫️', type: 'cove',     cx: 180, cz: 320, radius: 10, description: 'Hidden cove shrouded in mist. Sea otter families gather here.' },
  // Deep water
  { id: 'the_trench',       name: 'The Trench',        emoji: '🕳️', type: 'trench',   cx: 450, cz: 200, radius: 15, description: 'Bottomless drop-off. Things live down there that nobody has seen.' },
];

/** Seed-based pseudo-random for deterministic terrain */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 2D noise via value noise */
function valueNoise(x, z, seed = 42) {
  const rng = seededRandom(Math.floor(x) * 73856093 ^ Math.floor(z) * 19349663 ^ seed);
  return rng();
}

export class SitkaSound {
  constructor(options = {}) {
    this.width = options.width ?? 600;
    this.height = options.height ?? 400;
    this.seed = options.seed ?? 42;
    this.map = null;       // 2D array of biome keys
    this.depthMap = null;  // 2D array of depth values
    this.tempMap = null;   // 2D array of temperatures (°F)
    this.currentMap = null; // 2D array of { strength, angle }
    this.salinityMap = null;
    this.visibilityMap = null;
    this.generated = false;
  }

  /** Generate the full world map */
  generate() {
    this.map = [];
    this.depthMap = [];
    this.tempMap = [];
    this.currentMap = [];
    this.salinityMap = [];
    this.visibilityMap = [];

    for (let z = 0; z < this.height; z++) {
      this.map[z] = [];
      this.depthMap[z] = [];
      this.tempMap[z] = [];
      this.currentMap[z] = [];
      this.salinityMap[z] = [];
      this.visibilityMap[z] = [];
      for (let x = 0; x < this.width; x++) {
        const { biome, depth, temp, salinity, visibility } = this._computeTile(x, z);
        this.map[z][x] = biome;
        this.depthMap[z][x] = depth;
        this.tempMap[z][x] = temp;
        this.salinityMap[z][x] = salinity;
        this.visibilityMap[z][x] = visibility;

        // Currents: stronger in channels, calm in sheltered areas
        const current = this._computeCurrent(x, z, biome);
        this.currentMap[z][x] = current;
      }
    }

    this.generated = true;
    return this;
  }

  _computeTile(x, z) {
    const rng = seededRandom(x * 73856093 + z * 19349663 + this.seed);
    const noise1 = valueNoise(x / 40, z / 40, this.seed);
    const noise2 = valueNoise(x / 20, z / 20, this.seed + 1);
    const noise3 = valueNoise(x / 10, z / 10, this.seed + 2);

    // Check if on land
    const onLand = this._isLand(x, z);
    if (onLand) {
      // Check if mountain (higher elevation inland)
      const distToCoast = this._distToCoast(x, z);
      const elevation = onLand.elevation;
      if (elevation > 30) {
        return { biome: 'mountain', depth: 0, temp: 30 + rng() * 10, salinity: 0, visibility: 0 };
      }
      // Check for freshwater features
      if (onLand.lake) {
        return this._lakeTile(x, z, rng);
      }
      if (onLand.river) {
        return { biome: 'freshwater_river', depth: 1 + rng() * 4, temp: 38 + rng() * 12, salinity: 0, visibility: 3 + rng() * 5 };
      }
      return { biome: 'land', depth: 0, temp: 35 + rng() * 15, salinity: 0, visibility: 0 };
    }

    // Water tiles
    const landmark = this._getNearestLandmark(x, z);
    const depth = this._computeDepth(x, z, noise1, noise2, rng);

    // Biome assignment based on depth, position, noise
    let biome, temp, salinity, visibility;

    if (depth >= 100) {
      biome = 'deep_trench';
      temp = 34 + rng() * 4;
      salinity = 35;
      visibility = 5 + rng() * 7;
    } else if (depth >= 40) {
      // Check for pinnacles (noise creates underwater mountains)
      if (noise3 > 0.75 && noise2 > 0.6) {
        biome = 'rocky_pinnacles';
        temp = 38 + rng() * 6;
        salinity = 34;
        visibility = 10 + rng() * 10;
      } else {
        biome = 'open_ocean';
        temp = 38 + rng() * 8;
        salinity = 35;
        visibility = 15 + rng() * 10;
      }
    } else if (depth >= 15) {
      // Sheltered sound vs kelp vs pinnacles
      if (noise3 > 0.8) {
        biome = 'rocky_pinnacles';
        temp = 40 + rng() * 6;
        salinity = 34;
        visibility = 10 + rng() * 8;
      } else if (this._isSheltered(x, z) && noise2 > 0.4) {
        biome = 'kelp_forest';
        temp = 42 + rng() * 8;
        salinity = 33;
        visibility = 5 + rng() * 7;
      } else {
        biome = 'sheltered_sound';
        temp = 40 + rng() * 8;
        salinity = 32;
        visibility = 8 + rng() * 10;
      }
    } else if (depth >= 3) {
      // Shallow water
      if (this._nearEstuary(x, z)) {
        biome = 'river_estuary';
        temp = 42 + rng() * 10;
        salinity = 5 + rng() * 20;
        visibility = 2 + rng() * 4;
      } else if (noise2 > 0.85) {
        biome = 'coral_reef';
        temp = 46 + rng() * 6;
        salinity = 35;
        visibility = 15 + rng() * 10;
      } else if (noise3 > 0.5) {
        biome = 'kelp_forest';
        temp = 42 + rng() * 8;
        salinity = 33;
        visibility = 5 + rng() * 7;
      } else {
        biome = 'sheltered_sound';
        temp = 42 + rng() * 8;
        salinity = 32;
        visibility = 6 + rng() * 10;
      }
    } else {
      // Very shallow — tidal flats
      biome = 'tidal_flats';
      temp = 44 + rng() * 8;
      salinity = 20 + rng() * 13;
      visibility = 1 + rng() * 3;
    }

    // Check if this is near The Narrows or The Gut
    if (landmark && (landmark.id === 'the_narrows' || landmark.id === 'the_gut')) {
      if (this._dist2D(x, z, landmark.cx, landmark.cz) < landmark.radius * 1.5) {
        if (depth > 3) biome = 'sheltered_sound'; // Override to sound in channels
      }
    }

    return { biome, depth, temp, salinity, visibility };
  }

  _lakeTile(x, z, rng) {
    const depth = 10 + rng() * 20;
    return { biome: 'alpine_lake', depth, temp: 34 + rng() * 8, salinity: 0, visibility: 12 + rng() * 10 };
  }

  _computeDepth(x, z, noise1, noise2, rng) {
    // Base depth increases away from land
    const coastDist = this._distToCoast(x, z);
    const baseDepth = Math.min(150, coastDist * 0.8);

    // Noise modulation
    const depthMod = (noise1 * 0.6 + noise2 * 0.4) * 40 - 10;

    // Near landmarks can create depth anomalies (holes, trenches)
    const landmark = this._getNearestLandmark(x, z);
    let landmarkMod = 0;
    if (landmark) {
      const dist = this._dist2D(x, z, landmark.cx, landmark.cz);
      if (landmark.id === 'halibut_hole' && dist < landmark.radius) {
        landmarkMod = 30 + (1 - dist / landmark.radius) * 20; // Deep hole!
      }
      if (landmark.id === 'the_trench' && dist < landmark.radius) {
        landmarkMod = 60 + (1 - dist / landmark.radius) * 100; // The deep
      }
      if (landmark.id === 'mount_edgecumbe' && dist < landmark.radius * 2) {
        // Shoals around volcano
        if (dist > landmark.radius) landmarkMod = -15;
      }
    }

    // Shallow near coast
    const shallowFactor = Math.max(0, 1 - coastDist / 30);
    const shallowDepth = shallowFactor * 5;

    return Math.max(0, Math.round(baseDepth + depthMod + landmarkMod - shallowDepth + rng() * 3));
  }

  _computeCurrent(x, z, biome) {
    // Default: mild
    let strength = 0.1;
    let angle = Math.PI * 0.5; // East

    // Tidal influence (general)
    const coastDist = this._distToCoast(x, z);
    if (coastDist < 50) strength += 0.1;

    // Channel currents
    const landmarks = ['the_narrows', 'the_gut'];
    for (const lid of landmarks) {
      const lm = LANDMARKS.find(l => l.id === lid);
      if (!lm) continue;
      const dist = this._dist2D(x, z, lm.cx, lm.cz);
      if (dist < lm.radius * 2) {
        const factor = 1 - dist / (lm.radius * 2);
        strength += lid === 'the_gut' ? factor * 0.9 : factor * 0.6;
        // Current direction follows channel axis
        angle = lid === 'the_gut' ? Math.PI * 0.3 : Math.PI * 0.7;
      }
    }

    // Open ocean has drift
    if (biome === 'open_ocean' || biome === 'deep_trench') {
      strength = Math.max(strength, 0.2 + valueNoise(x / 60, z / 60, this.seed + 99) * 0.3);
    }

    // Sheltered = calm
    if (biome === 'sheltered_sound' || biome === 'kelp_forest') {
      strength *= 0.3;
    }

    // Add some noise to angle
    angle += (valueNoise(x / 30, z / 30, this.seed + 77) - 0.5) * 0.5;

    return { strength: Math.min(1, strength), angle: angle % (Math.PI * 2) };
  }

  _isLand(x, z) {
    // Check proximity to island landmarks
    for (const lm of LANDMARKS) {
      if (lm.type !== 'island' && lm.type !== 'town' && lm.type !== 'mountain' && lm.type !== 'volcano') continue;
      const dist = this._dist2D(x, z, lm.cx, lm.cz);
      if (dist < lm.radius) {
        const elevation = (1 - dist / lm.radius) * 45;
        let lake = false, river = false;
        // Lakes on Baranof
        if (lm.id === 'baranof_island') {
          const blueLake = LANDMARKS.find(l => l.id === 'blue_lake');
          const deerLake = LANDMARKS.find(l => l.id === 'deer_lake');
          if (blueLake && this._dist2D(x, z, blueLake.cx, blueLake.cz) < blueLake.radius) lake = true;
          if (deerLake && this._dist2D(x, z, deerLake.cx, deerLake.cz) < deerLake.radius) lake = true;
          // Rivers flow from mountains to coast
          if (elevation < 15 && valueNoise(x / 15, z / 15, this.seed + 33) > 0.6) river = true;
        }
        return { elevation, lake, river };
      }
    }
    return null;
  }

  _isSheltered(x, z) {
    // Check if between islands (protected from open ocean)
    const baranof = LANDMARKS.find(l => l.id === 'baranof_island');
    const kruzof = LANDMARKS.find(l => l.id === 'kruzof_island');
    if (!baranof || !kruzof) return false;

    // Between the two main islands
    const midX = (baranof.cx + kruzof.cx) / 2;
    const midZ = (baranof.cz + kruzof.cz) / 2;
    const distToMid = this._dist2D(x, z, midX, midZ);
    const distToBaranof = this._dist2D(x, z, baranof.cx, baranof.cz);
    const distToKruzof = this._dist2D(x, z, kruzof.cx, kruzof.cz);

    return distToMid < 120 && distToBaranof < baranof.radius + 40 && distToKruzof < kruzof.radius + 40;
  }

  _nearEstuary(x, z) {
    // Near rivers on Baranof coast
    const baranof = LANDMARKS.find(l => l.id === 'baranof_island');
    if (!baranof) return false;
    const dist = this._dist2D(x, z, baranof.cx, baranof.cz);
    return dist > baranof.radius - 5 && dist < baranof.radius + 15 &&
      valueNoise(x / 12, z / 12, this.seed + 55) > 0.65;
  }

  _distToCoast(x, z) {
    // Approximate distance to nearest land edge
    let minDist = 999;
    for (const lm of LANDMARKS) {
      if (lm.type !== 'island' && lm.type !== 'town' && lm.type !== 'mountain' && lm.type !== 'volcano') continue;
      const dist = this._dist2D(x, z, lm.cx, lm.cz);
      if (dist < lm.radius + 50) {
        minDist = Math.min(minDist, Math.max(0, dist - lm.radius));
      }
    }
    return minDist === 999 ? 50 : minDist;
  }

  _getNearestLandmark(x, z) {
    let nearest = null;
    let minDist = Infinity;
    for (const lm of LANDMARKS) {
      const dist = this._dist2D(x, z, lm.cx, lm.cz);
      if (dist < minDist) {
        minDist = dist;
        nearest = lm;
      }
    }
    return nearest;
  }

  _dist2D(x1, z1, x2, z2) {
    return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
  }

  /** Get biome at coordinates */
  getBiome(x, z) {
    if (!this.generated) throw new Error('World not generated. Call generate() first.');
    if (z < 0 || z >= this.height || x < 0 || x >= this.width) return 'open_ocean';
    return this.map[z][x];
  }

  /** Get water depth at coordinates */
  getDepth(x, z) {
    if (!this.generated) throw new Error('World not generated. Call generate() first.');
    if (z < 0 || z >= this.height || x < 0 || x >= this.width) return 50;
    return this.depthMap[z][x];
  }

  /** Get temperature at coordinates (°F) */
  getTemperature(x, z) {
    if (!this.generated) throw new Error('World not generated. Call generate() first.');
    if (z < 0 || z >= this.height || x < 0 || x >= this.width) return 40;
    return this.tempMap[z][x];
  }

  /** Get current strength (0-1) and direction (radians) */
  getCurrent(x, z) {
    if (!this.generated) throw new Error('World not generated. Call generate() first.');
    if (z < 0 || z >= this.height || x < 0 || x >= this.width) return { strength: 0.2, angle: 0 };
    return this.currentMap[z][x];
  }

  /** Get salinity at coordinates (ppt) */
  getSalinity(x, z) {
    if (!this.generated) throw new Error('World not generated. Call generate() first.');
    if (z < 0 || z >= this.height || x < 0 || x >= this.width) return 35;
    return this.salinityMap[z][x];
  }

  /** Get visibility at coordinates (blocks) */
  getVisibility(x, z) {
    if (!this.generated) throw new Error('World not generated. Call generate() first.');
    if (z < 0 || z >= this.height || x < 0 || x >= this.width) return 15;
    return this.visibilityMap[z][x];
  }

  /** Get nearest landmark to coordinates */
  getLandmark(x, z) {
    return this._getNearestLandmark(x, z);
  }

  /** Check if a tile is water (fishable) */
  isWater(x, z) {
    const biome = this.getBiome(x, z);
    return biome !== 'land' && biome !== 'mountain' && biome !== 'town';
  }

  /** Get a summary of the world */
  getSummary() {
    const biomeCounts = {};
    for (const row of this.map) {
      for (const b of row) biomeCounts[b] = (biomeCounts[b] ?? 0) + 1;
    }
    const total = this.width * this.height;
    return {
      size: `${this.width} × ${this.height}`,
      totalTiles: total,
      waterTiles: Object.entries(biomeCounts)
        .filter(([b]) => b !== 'land' && b !== 'mountain' && b !== 'town')
        .reduce((s, [, c]) => s + c, 0),
      biomes: Object.fromEntries(
        Object.entries(biomeCounts).sort((a, b) => b[1] - a[1])
      ),
      landmarks: LANDMARKS.length,
    };
  }

  /** Get all landmarks */
  static getLandmarks() { return [...LANDMARKS]; }
}

export default SitkaSound;
