/**
 * FishSpawner - Selects fish based on biome, time, weather, and equipment conditions
 *
 * Part of the CraftMind fishing game system. Implements weighted random selection
 * with rarity distribution and condition modifiers.
 *
 * @module craftmind-fishing/world/fish-spawner
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Rarity tier weights (base distribution)
 * @type {Object<string, number>}
 */
const BASE_RARITY_WEIGHTS = {
  common: 68.0,
  uncommon: 20.0,
  rare: 8.0,
  epic: 3.0,
  legendary: 0.5
};

/**
 * Time-of-day modifiers for fish activity
 * @type {Object<string, number>}
 */
const TIME_MODIFIERS = {
  dawn: { uncommon: 1.2, rare: 1.3, epic: 1.2 },      // 5000-7000 ticks
  day: { common: 1.1 },                                // 7000-13000 ticks
  dusk: { uncommon: 1.3, rare: 1.4, epic: 1.3 },      // 13000-15000 ticks
  night: { rare: 1.2, epic: 1.5, legendary: 1.3 }     // 15000-24000, 0-5000 ticks
};

/**
 * Weather modifiers for catch rates
 * @type {Object<string, Object>}
 */
const WEATHER_MODIFIERS = {
  clear: { common: 1.05 },
  rain: { uncommon: 1.3, rare: 1.5 },
  thunder: { rare: 1.5, epic: 1.8, legendary: 1.5 },
  snow: { common: 0.9, rare: 1.2 }
};

/**
 * Rod tier bonuses to rare catch chances
 * @type {Object<number, Object>}
 */
const ROD_TIER_BONUSES = {
  1: { rare: 1.0, epic: 1.0, legendary: 1.0 },     // Wooden
  2: { rare: 1.05, epic: 1.05, legendary: 1.0 },   // Bamboo
  3: { rare: 1.1, epic: 1.1, legendary: 1.05 },    // Iron
  4: { rare: 1.2, epic: 1.2, legendary: 1.1 },     // Golden
  5: { rare: 1.25, epic: 1.25, legendary: 1.2 },   // Diamond
  6: { rare: 1.35, epic: 1.35, legendary: 1.3 }    // Netherite
};

/**
 * Bait type bonuses
 * @type {Object<string, Object>}
 */
const BAIT_BONUSES = {
  worm: { common: 1.1 },
  cricket: { uncommon: 1.15 },
  minnow: { rare: 1.2 },
  golden_worm: { epic: 1.3 },
  void_pearl: { legendary: 2.0 },
  magic_bait: { all: 1.1 }
};

/**
 * FishSpawner class for selecting fish based on conditions
 */
export class FishSpawner {
  /**
   * @param {Object} options - Spawner configuration
   * @param {string} options.biome - Current biome (ocean, river, deep_ocean, etc.)
   * @param {number} options.timeOfDay - Minecraft time (0-24000 ticks)
   * @param {string} options.weather - Weather state (clear, rain, thunder, snow)
   * @param {number} [options.rodTier=1] - Fishing rod tier (1-6)
   * @param {string} [options.baitType] - Equipped bait type
   * @param {number} [options.playerLuck=0] - Player luck bonus (0-1)
   */
  constructor(options) {
    this.biome = options.biome || 'ocean';
    this.timeOfDay = options.timeOfDay ?? 6000;
    this.weather = options.weather || 'clear';
    this.rodTier = Math.min(6, Math.max(1, options.rodTier || 1));
    this.baitType = options.baitType || null;
    this.playerLuck = Math.min(1, Math.max(0, options.playerLuck || 0));

    // Lazy-loaded fish data
    this._fishData = null;
    this._fishByRarity = null;
  }

  /**
   * Load fish species data from JSON
   * @returns {Promise<Object>} Fish data object
   */
  async _loadFishData() {
    if (this._fishData) {
      return this._fishData;
    }

    const dataPath = join(__dirname, '..', 'data', 'fish-species.json');
    const rawData = await readFile(dataPath, 'utf-8');
    this._fishData = JSON.parse(rawData);

    // Index by rarity for faster lookup
    this._fishByRarity = {
      common: [],
      uncommon: [],
      rare: [],
      epic: [],
      legendary: []
    };

    for (const fish of this._fishData.species) {
      if (this._fishByRarity[fish.rarity]) {
        this._fishByRarity[fish.rarity].push(fish);
      }
    }

    return this._fishData;
  }

  /**
   * Get the current time period (dawn, day, dusk, night)
   * @returns {string} Time period name
   */
  _getTimePeriod() {
    const time = this.timeOfDay;

    if (time >= 5000 && time < 7000) return 'dawn';
    if (time >= 7000 && time < 13000) return 'day';
    if (time >= 13000 && time < 15000) return 'dusk';
    return 'night';
  }

  /**
   * Calculate modified rarity weights based on all conditions
   * @returns {Object<string, number>} Modified weights by rarity
   */
  _calculateModifiedWeights() {
    const weights = { ...BASE_RARITY_WEIGHTS };
    const timePeriod = this._getTimePeriod();

    // Apply time modifiers
    const timeMods = TIME_MODIFIERS[timePeriod] || {};
    for (const [rarity, mult] of Object.entries(timeMods)) {
      if (weights[rarity]) {
        weights[rarity] *= mult;
      }
    }

    // Apply weather modifiers
    const weatherMods = WEATHER_MODIFIERS[this.weather] || {};
    for (const [rarity, mult] of Object.entries(weatherMods)) {
      if (weights[rarity]) {
        weights[rarity] *= mult;
      }
    }

    // Apply rod tier bonuses
    const rodMods = ROD_TIER_BONUSES[this.rodTier] || ROD_TIER_BONUSES[1];
    for (const [rarity, mult] of Object.entries(rodMods)) {
      if (weights[rarity]) {
        weights[rarity] *= mult;
      }
    }

    // Apply bait bonuses
    if (this.baitType && BAIT_BONUSES[this.baitType]) {
      const baitMods = BAIT_BONUSES[this.baitType];
      if (baitMods.all) {
        for (const rarity of Object.keys(weights)) {
          weights[rarity] *= baitMods.all;
        }
      } else {
        for (const [rarity, mult] of Object.entries(baitMods)) {
          if (weights[rarity]) {
            weights[rarity] *= mult;
          }
        }
      }
    }

    // Apply player luck bonus (affects rare+ more than common)
    if (this.playerLuck > 0) {
      weights.common *= (1 - this.playerLuck * 0.2);
      weights.uncommon *= (1 + this.playerLuck * 0.1);
      weights.rare *= (1 + this.playerLuck * 0.3);
      weights.epic *= (1 + this.playerLuck * 0.4);
      weights.legendary *= (1 + this.playerLuck * 0.5);
    }

    return weights;
  }

  /**
   * Perform weighted random selection for rarity
   * @param {Object<string, number>} weights - Rarity weights
   * @returns {string} Selected rarity
   */
  _selectRarity(weights) {
    const rarities = Object.keys(weights);
    const totalWeight = rarities.reduce((sum, r) => sum + weights[r], 0);

    let random = Math.random() * totalWeight;

    for (const rarity of rarities) {
      random -= weights[rarity];
      if (random <= 0) {
        return rarity;
      }
    }

    return 'common'; // Fallback
  }

  /**
   * Select a random fish size using bell curve distribution
   * @param {number} minSize - Minimum size in cm
   * @param {number} maxSize - Maximum size in cm
   * @returns {number} Selected size in cm
   */
  _rollSize(minSize, maxSize) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();

    // Standard normal (mean=0, std=1)
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Scale to 0-1 range with mean at 0.5, std of ~0.15
    // Clamps to prevent outliers
    const normalized = Math.max(0, Math.min(1, 0.5 + z * 0.15));

    // Map to size range
    return Math.round(minSize + normalized * (maxSize - minSize));
  }

  /**
   * Filter fish by biome availability
   * @param {Array<Object>} fishList - List of fish objects
   * @returns {Array<Object>} Filtered fish list
   */
  _filterByBiome(fishList) {
    return fishList.filter(fish =>
      fish.biomes.includes(this.biome) || fish.biomes.includes('all')
    );
  }

  /**
   * Select a fish based on current conditions
   * @returns {Promise<Object|null>} Selected fish object with size, or null if none available
   */
  async selectFish() {
    await this._loadFishData();

    // Calculate modified rarity weights
    const weights = this._calculateModifiedWeights();

    // Select rarity tier
    const selectedRarity = this._selectRarity(weights);

    // Get fish of that rarity that can spawn in this biome
    const candidates = this._filterByBiome(this._fishByRarity[selectedRarity]);

    if (candidates.length === 0) {
      // Fallback to common if selected rarity has no fish for this biome
      const fallbackCandidates = this._filterByBiome(this._fishByRarity.common);
      if (fallbackCandidates.length === 0) {
        return null;
      }
      const fish = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
      const size = this._rollSize(fish.minSize, fish.maxSize);
      return { ...fish, rolledSize: size };
    }

    // Random selection from candidates
    const fish = candidates[Math.floor(Math.random() * candidates.length)];

    // Roll size with bell curve
    const size = this._rollSize(fish.minSize, fish.maxSize);

    return { ...fish, rolledSize: size };
  }

  /**
   * Get all fish available in the current biome
   * @returns {Promise<Array<Object>>} List of available fish
   */
  async getAvailableFish() {
    await this._loadFishData();
    return this._filterByBiome(this._fishData.species);
  }

  /**
   * Get fish statistics for debugging
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    await this._loadFishData();
    const weights = this._calculateModifiedWeights();
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    return {
      biome: this.biome,
      timePeriod: this._getTimePeriod(),
      weather: this.weather,
      rodTier: this.rodTier,
      baitType: this.baitType,
      playerLuck: this.playerLuck,
      modifiedWeights: weights,
      normalizedChances: {
        common: (weights.common / totalWeight * 100).toFixed(2) + '%',
        uncommon: (weights.uncommon / totalWeight * 100).toFixed(2) + '%',
        rare: (weights.rare / totalWeight * 100).toFixed(2) + '%',
        epic: (weights.epic / totalWeight * 100).toFixed(2) + '%',
        legendary: (weights.legendary / totalWeight * 100).toFixed(3) + '%'
      },
      availableSpecies: (await this.getAvailableFish()).length
    };
  }
}

export default FishSpawner;
