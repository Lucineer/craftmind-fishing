/**
 * Biome System for CraftMind Fishing
 *
 * Defines biomes, their properties, and fish availability filtering
 * based on time of day, weather, and seasonal conditions.
 *
 * @module world/biomes
 */

/** @typedef {import('../data/fish-species.json').Species} FishSpecies */

/**
 * Biome definition with fishing properties
 * @typedef {Object} BiomeDefinition
 * @property {string} id - Unique biome identifier
 * @property {string} name - Display name
 * @property {string} description - Flavor text
 * @property {number} catchSpeedMod - Multiplier for catch time (1.0 = normal)
 * @property {number} rarityMod - Multiplier for rare fish chances
 * @property {number} sizeMod - Multiplier for fish size
 * @property {number} minY - Minimum Y level for this biome (-64 to 320)
 * @property {number} maxY - Maximum Y level
 * @property {string[]} allowedWeather - Weather types that affect fishing
 * @property {Object} timeBonuses - Time-based catch rate bonuses
 */

/**
 * Time of day constants (Minecraft ticks)
 * @enum {number}
 */
export const TimeOfDay = {
  DAWN: 0,        // 0-3000 ticks
  DAY: 3000,      // 3000-9000 ticks
  NOON: 6000,     // Around midday
  DUSK: 12000,    // 12000-14000 ticks
  NIGHT: 14000,   // 14000-24000 ticks
  MIDNIGHT: 18000 // Deepest night
};

/**
 * Weather types that affect fishing
 * @enum {string}
 */
export const WeatherType = {
  CLEAR: 'clear',
  RAIN: 'rain',
  THUNDER: 'thunder',
  SNOW: 'snow'
};

/**
 * All biome definitions for the fishing system
 * @type {Map<string, BiomeDefinition>}
 */
export const BIOMES = new Map([
  ['ocean_shallow', {
    id: 'ocean_shallow',
    name: 'Shallow Ocean',
    description: 'Coastal waters teeming with common fish and occasional surprises.',
    catchSpeedMod: 1.0,
    rarityMod: 1.0,
    sizeMod: 1.0,
    minY: 45,
    maxY: 63,
    allowedWeather: ['clear', 'rain', 'thunder'],
    timeBonuses: {
      dawn: 1.1,   // Early morning feeding
      day: 1.0,
      dusk: 1.15,  // Evening feeding frenzy
      night: 0.9
    },
    fishDensity: 1.2,  // More fish per area
    dangerLevel: 0.1   // Low danger
  }],

  ['ocean_deep', {
    id: 'ocean_deep',
    name: 'Deep Ocean',
    description: 'The dark depths where ancient creatures swim and legends are born.',
    catchSpeedMod: 0.85,    // Slower catches
    rarityMod: 1.5,         // More rare fish
    sizeMod: 1.3,           // Bigger fish
    minY: -64,
    maxY: 45,
    allowedWeather: ['clear', 'rain', 'thunder'],
    timeBonuses: {
      dawn: 1.0,
      day: 0.95,
      dusk: 1.0,
      night: 1.25   // Deep creatures more active at night
    },
    fishDensity: 0.7,
    dangerLevel: 0.3
  }],

  ['river', {
    id: 'river',
    name: 'River',
    description: 'Flowing freshwater streams where salmon return to spawn.',
    catchSpeedMod: 1.1,     // Faster catches due to current
    rarityMod: 1.1,
    sizeMod: 0.9,           // Slightly smaller fish
    minY: 50,
    maxY: 70,
    allowedWeather: ['clear', 'rain', 'thunder'],
    timeBonuses: {
      dawn: 1.2,   // Best time for river fishing
      day: 1.0,
      dusk: 1.15,
      night: 0.85
    },
    fishDensity: 1.0,
    dangerLevel: 0.05
  }],

  ['lake', {
    id: 'lake',
    name: 'Lake',
    description: 'Calm freshwater bodies perfect for peaceful fishing.',
    catchSpeedMod: 1.05,
    rarityMod: 1.0,
    sizeMod: 1.1,           // Lakes grow big fish
    minY: 55,
    maxY: 80,
    allowedWeather: ['clear', 'rain', 'thunder'],
    timeBonuses: {
      dawn: 1.25,  // Morning surface feeding
      day: 1.0,
      dusk: 1.2,
      night: 0.9
    },
    fishDensity: 1.1,
    dangerLevel: 0.02
  }],

  ['swamp', {
    id: 'swamp',
    name: 'Swamp',
    description: 'Murky waters hiding strange and ancient creatures.',
    catchSpeedMod: 0.9,     // Slower, more patient fishing
    rarityMod: 1.2,         // Unusual species
    sizeMod: 1.0,
    minY: 55,
    maxY: 70,
    allowedWeather: ['clear', 'rain', 'thunder'],
    timeBonuses: {
      dawn: 1.0,
      day: 0.8,
      dusk: 1.1,
      night: 1.3    // Swamp creatures love the dark
    },
    fishDensity: 0.8,
    dangerLevel: 0.25
  }],

  ['frozen_river', {
    id: 'frozen_river',
    name: 'Frozen River',
    description: 'Ice-cold waters where only the hardiest fish survive.',
    catchSpeedMod: 0.75,    // Slow fishing
    rarityMod: 1.4,         // Rare cold-water species
    sizeMod: 1.0,
    minY: 55,
    maxY: 70,
    allowedWeather: ['clear', 'snow'],
    timeBonuses: {
      dawn: 1.0,
      day: 1.1,
      dusk: 1.0,
      night: 0.9
    },
    fishDensity: 0.5,       // Fewer fish
    dangerLevel: 0.15,
    requiresIceFishing: true
  }],

  ['underground_lake', {
    id: 'underground_lake',
    name: 'Underground Lake',
    description: 'Dark caverns with blind fish and creatures from the depths.',
    catchSpeedMod: 0.8,     // Slow, careful fishing
    rarityMod: 1.6,         // Very rare species
    sizeMod: 1.2,           // Ancient, large fish
    minY: -64,
    maxY: 40,
    allowedWeather: ['clear'],  // Weather doesn't matter underground
    timeBonuses: {
      dawn: 1.0,   // Time doesn't matter
      day: 1.0,
      dusk: 1.0,
      night: 1.0
    },
    fishDensity: 0.4,       // Sparse populations
    dangerLevel: 0.4,
    lightLevel: 0            // Always dark
  }]
]);

/**
 * BiomeSystem class for managing biome detection and fish filtering
 */
export class BiomeSystem {
  /**
   * @param {Object} options
   * @param {FishSpecies[]} options.fishSpecies - All available fish species
   */
  constructor(options = {}) {
    /** @type {FishSpecies[]} */
    this.fishSpecies = options.fishSpecies || [];
    /** @type {Map<string, FishSpecies[]>} */
    this.fishByBiome = new Map();
    /** @type {Map<string, BiomeDefinition>} */
    this.biomes = BIOMES;

    // Index fish by biome for fast lookups
    this._indexFishByBiome();
  }

  /**
   * Build lookup index of fish by biome
   * @private
   */
  _indexFishByBiome() {
    for (const fish of this.fishSpecies) {
      for (const biome of fish.biomes) {
        if (!this.fishByBiome.has(biome)) {
          this.fishByBiome.set(biome, []);
        }
        this.fishByBiome.get(biome).push(fish);
      }
    }
  }

  /**
   * Detect biome from block position and context
   * @param {Object} block - Block position and properties
   * @param {number} block.x - X coordinate
   * @param {number} block.y - Y coordinate
   * @param {number} block.z - Z coordinate
   * @param {string} [block.biomeHint] - Minecraft biome name if available
   * @param {number} [block.lightLevel] - Light level at position
   * @returns {BiomeDefinition|null} Detected biome or null
   */
  getBiomeAt(block) {
    const { x, y, z, biomeHint, lightLevel } = block;

    // Use hint if available (from mineflayer biome detection)
    if (biomeHint) {
      const mapping = {
        'ocean': 'ocean_shallow',
        'deep_ocean': 'ocean_deep',
        'deep_cold_ocean': 'ocean_deep',
        'deep_lukewarm_ocean': 'ocean_deep',
        'deep_warm_ocean': 'ocean_deep',
        'river': 'river',
        'frozen_river': 'frozen_river',
        'swamp': 'swamp',
        'lake': 'lake'  // Custom biome if modded
      };
      const mapped = mapping[biomeHint.toLowerCase()];
      if (mapped && this.biomes.has(mapped)) {
        return this.biomes.get(mapped);
      }
    }

    // Infer from Y level and properties
    if (y < 40 && lightLevel === 0) {
      return this.biomes.get('underground_lake');
    }

    if (y < 45) {
      return this.biomes.get('ocean_deep');
    }

    if (y >= 45 && y <= 63) {
      return this.biomes.get('ocean_shallow');
    }

    // Default to lake for freshwater contexts
    return this.biomes.get('lake');
  }

  /**
   * Get all fish available in a biome with conditions
   * @param {string} biomeId - Biome identifier
   * @param {Object} options - Filtering options
   * @param {number} [options.timeOfDay] - Current time in ticks (0-24000)
   * @param {string} [options.weather] - Current weather
   * @param {string} [options.season] - Current season
   * @returns {FishSpecies[]} Filtered list of available fish
   */
  getFishForBiome(biomeId, options = {}) {
    const { timeOfDay, weather, season } = options;
    const fishList = this.fishByBiome.get(biomeId) || [];
    const biome = this.biomes.get(biomeId);

    if (!biome) {
      return fishList;
    }

    // Filter by time of day
    let filtered = fishList;
    if (timeOfDay !== undefined) {
      filtered = this._filterByTime(filtered, timeOfDay, biome);
    }

    // Filter by weather
    if (weather && !biome.allowedWeather.includes(weather)) {
      // Biome doesn't support this weather, reduce availability
      filtered = filtered.map(fish => ({
        ...fish,
        availabilityMod: 0.5
      }));
    }

    // Apply biome modifiers
    return filtered.map(fish => ({
      ...fish,
      biomeModifiers: {
        catchSpeedMod: biome.catchSpeedMod,
        rarityMod: biome.rarityMod,
        sizeMod: biome.sizeMod
      }
    }));
  }

  /**
   * Filter fish by time of day
   * @private
   * @param {FishSpecies[]} fish - Fish to filter
   * @param {number} timeOfDay - Time in ticks
   * @param {BiomeDefinition} biome - Current biome
   * @returns {FishSpecies[]} Filtered fish
   */
  _filterByTime(fish, timeOfDay, biome) {
    // Determine time period
    let period = 'day';
    if (timeOfDay < 3000) period = 'dawn';
    else if (timeOfDay >= 12000 && timeOfDay < 14000) period = 'dusk';
    else if (timeOfDay >= 14000) period = 'night';

    // Apply biome time bonus
    const timeBonus = biome.timeBonuses[period] || 1.0;

    return fish.map(f => ({
      ...f,
      timeBonus,
      periodActive: true
    }));
  }

  /**
   * Get biome modifiers for catch calculations
   * @param {string} biomeId - Biome identifier
   * @returns {Object} Modifiers for catch speed, rarity, and size
   */
  getBiomeModifiers(biomeId) {
    const biome = this.biomes.get(biomeId);
    if (!biome) {
      return {
        catchSpeedMod: 1.0,
        rarityMod: 1.0,
        sizeMod: 1.0,
        timeBonus: 1.0
      };
    }

    return {
      catchSpeedMod: biome.catchSpeedMod,
      rarityMod: biome.rarityMod,
      sizeMod: biome.sizeMod,
      timeBonus: 1.0  // Caller should calculate based on time
    };
  }

  /**
   * Check if fishing is possible in a biome with given conditions
   * @param {string} biomeId - Biome identifier
   * @param {Object} conditions - Current conditions
   * @param {string} [conditions.weather] - Weather type
   * @param {boolean} [conditions.hasIceFishingGear] - Has ice fishing capability
   * @returns {{canFish: boolean, reason?: string}}
   */
  canFishInBiome(biomeId, conditions = {}) {
    const biome = this.biomes.get(biomeId);

    if (!biome) {
      return { canFish: false, reason: 'Unknown biome' };
    }

    // Check ice fishing requirement
    if (biome.requiresIceFishing && !conditions.hasIceFishingGear) {
      return { canFish: false, reason: 'Ice fishing gear required' };
    }

    return { canFish: true };
  }

  /**
   * Get all biome IDs
   * @returns {string[]}
   */
  getAllBiomeIds() {
    return Array.from(this.biomes.keys());
  }

  /**
   * Get biome definition by ID
   * @param {string} biomeId
   * @returns {BiomeDefinition|undefined}
   */
  getBiome(biomeId) {
    return this.biomes.get(biomeId);
  }

  /**
   * Calculate effective catch rate for a fish in biome conditions
   * @param {FishSpecies} fish - The fish to catch
   * @param {string} biomeId - Biome identifier
   * @param {Object} conditions - Current conditions
   * @returns {number} Effective catch rate (0-1)
   */
  calculateCatchRate(fish, biomeId, conditions = {}) {
    const biome = this.biomes.get(biomeId);
    if (!biome) return 0;

    // Base rarity distribution
    const rarityRates = {
      common: 0.65,
      uncommon: 0.22,
      rare: 0.09,
      epic: 0.032,
      legendary: 0.008
    };

    let rate = rarityRates[fish.rarity] || 0.65;

    // Apply biome rarity modifier
    rate *= biome.rarityMod;

    // Apply time bonus
    if (conditions.timeOfDay !== undefined) {
      const period = this._getTimePeriod(conditions.timeOfDay);
      rate *= biome.timeBonuses[period] || 1.0;
    }

    // Weather bonus for rain
    if (conditions.weather === 'rain' || conditions.weather === 'thunder') {
      if (fish.rarity === 'rare' || fish.rarity === 'epic') {
        rate *= 1.3;
      }
    }

    // Weather bonus for thunder
    if (conditions.weather === 'thunder') {
      if (fish.rarity === 'legendary') {
        rate *= 1.5;
      }
    }

    return Math.min(rate, 1.0);
  }

  /**
   * Get time period from ticks
   * @private
   * @param {number} ticks
   * @returns {string}
   */
  _getTimePeriod(ticks) {
    if (ticks < 3000) return 'dawn';
    if (ticks < 12000) return 'day';
    if (ticks < 14000) return 'dusk';
    return 'night';
  }
}

export default BiomeSystem;
