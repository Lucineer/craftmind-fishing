/**
 * CatchProcessor - Processes fish catches and calculates rewards
 *
 * Handles XP, credits, and item generation based on fish species,
 * size quality, and player data.
 *
 * @module craftmind-fishing/integration/catch-processor
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Size quality tier definitions
 * @type {Object<string, Object>}
 */
const SIZE_QUALITY_TIERS = {
  tiny: { threshold: 0.25, multiplier: 0.5, label: 'Tiny' },
  average: { threshold: 0.75, multiplier: 1.0, label: 'Average' },
  large: { threshold: 0.95, multiplier: 1.5, label: 'Large' },
  record: { threshold: 1.0, multiplier: 2.0, label: 'Record' }
};

/**
 * Rarity XP bonus multipliers
 * @type {Object<string, number>}
 */
const RARITY_XP_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.0
};

/**
 * Rarity credit bonus multipliers
 * @type {Object<string, number>}
 */
const RARITY_CREDIT_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.3,
  rare: 1.8,
  epic: 2.5,
  legendary: 4.0
};

/**
 * CatchProcessor class for processing fish catches
 */
export class CatchProcessor {
  /**
   * @param {Object} options - Processor configuration
   * @param {number} [options.xpBoost=0] - XP boost percentage (0-1)
   * @param {number} [options.creditBoost=0] - Credit boost percentage (0-1)
   * @param {boolean} [options.firstCatchOfDay=false] - First catch bonus
   * @param {number} [options.streak=0] - Consecutive day streak
   */
  constructor(options = {}) {
    this.xpBoost = Math.min(1, Math.max(0, options.xpBoost || 0));
    this.creditBoost = Math.min(1, Math.max(0, options.creditBoost || 0));
    this.firstCatchOfDay = options.firstCatchOfDay || false;
    this.streak = Math.max(0, options.streak || 0);

    // Lazy-loaded size tier data
    this._sizeTiers = null;
  }

  /**
   * Load size tier configuration
   * @returns {Promise<Object>} Size tier data
   */
  async _loadSizeTiers() {
    if (this._sizeTiers) {
      return this._sizeTiers;
    }

    try {
      const dataPath = join(__dirname, '..', 'data', 'fish-species.json');
      const rawData = await readFile(dataPath, 'utf-8');
      const fishData = JSON.parse(rawData);
      this._sizeTiers = fishData.sizeQualityTiers || SIZE_QUALITY_TIERS;
    } catch {
      this._sizeTiers = SIZE_QUALITY_TIERS;
    }

    return this._sizeTiers;
  }

  /**
   * Calculate size quality tier based on where size falls in min/max range
   * @param {number} size - Actual fish size
   * @param {number} minSize - Species minimum size
   * @param {number} maxSize - Species maximum size
   * @returns {Promise<Object>} Quality tier info { tier, multiplier, label }
   */
  async _calculateSizeQuality(size, minSize, maxSize) {
    const sizeTiers = await this._loadSizeTiers();

    // Normalize size to 0-1 range
    const range = maxSize - minSize;
    const normalized = range > 0 ? (size - minSize) / range : 0.5;

    // Determine tier
    let tier = 'average';
    let multiplier = 1.0;
    let label = 'Average';

    if (normalized < sizeTiers.tiny.threshold) {
      tier = 'tiny';
      multiplier = sizeTiers.tiny.multiplier;
      label = sizeTiers.tiny.label;
    } else if (normalized < sizeTiers.average.threshold) {
      tier = 'average';
      multiplier = sizeTiers.average.multiplier;
      label = sizeTiers.average.label;
    } else if (normalized < sizeTiers.large.threshold) {
      tier = 'large';
      multiplier = sizeTiers.large.multiplier;
      label = sizeTiers.large.label;
    } else {
      tier = 'record';
      multiplier = sizeTiers.record.multiplier;
      label = sizeTiers.record.label;
    }

    return { tier, multiplier, label, normalizedPercent: Math.round(normalized * 100) };
  }

  /**
   * Calculate streak bonus
   * @returns {number} Streak multiplier
   */
  _calculateStreakBonus() {
    if (this.streak >= 10) return 1.5;
    if (this.streak >= 5) return 1.3;
    if (this.streak >= 3) return 1.15;
    return 1.0;
  }

  /**
   * Process a fish catch and calculate rewards
   * @param {Object} fish - Fish object with species data and rolledSize
   * @param {Object} playerData - Player data for bonuses
   * @param {number} [playerData.fishingLevel=1] - Player fishing level
   * @param {boolean} [playerData.isNewDiscovery=false] - First time catching this species
   * @param {number} [playerData.personalBest=0] - Previous best size for this species
   * @returns {Promise<Object>} Processed catch result
   */
  async processCatch(fish, playerData = {}) {
    const fishingLevel = playerData.fishingLevel || 1;
    const isNewDiscovery = playerData.isNewDiscovery || false;
    const personalBest = playerData.personalBest || 0;

    // Calculate size quality
    const sizeQuality = await this._calculateSizeQuality(
      fish.rolledSize,
      fish.minSize,
      fish.maxSize
    );

    // Get rarity multipliers
    const rarityXpMult = RARITY_XP_MULTIPLIERS[fish.rarity] || 1.0;
    const rarityCreditMult = RARITY_CREDIT_MULTIPLIERS[fish.rarity] || 1.0;

    // Calculate base XP
    let baseXp = fish.xpReward || 5;

    // Apply size quality multiplier
    let xp = Math.round(baseXp * sizeQuality.multiplier);

    // Apply rarity multiplier
    xp = Math.round(xp * rarityXpMult);

    // Apply level-based bonus (5% per 10 levels)
    const levelBonus = 1 + (Math.floor(fishingLevel / 10) * 0.05);
    xp = Math.round(xp * levelBonus);

    // Apply configured XP boost
    if (this.xpBoost > 0) {
      xp = Math.round(xp * (1 + this.xpBoost));
    }

    // Apply streak bonus
    const streakMult = this._calculateStreakBonus();
    xp = Math.round(xp * streakMult);

    // First catch of day bonus
    if (this.firstCatchOfDay) {
      xp = Math.round(xp * 2.0);
    }

    // New discovery bonus
    if (isNewDiscovery) {
      xp += 50; // Flat bonus for new species
    }

    // Calculate base credits
    let baseCredits = fish.baseValue || 10;

    // Apply size quality multiplier
    let credits = Math.round(baseCredits * sizeQuality.multiplier);

    // Apply rarity multiplier
    credits = Math.round(credits * rarityCreditMult);

    // Apply configured credit boost
    if (this.creditBoost > 0) {
      credits = Math.round(credits * (1 + this.creditBoost));
    }

    // Apply streak bonus to credits too
    credits = Math.round(credits * streakMult);

    // First catch of day credit bonus
    if (this.firstCatchOfDay) {
      credits = Math.round(credits * 1.5);
    }

    // Determine if this is a new personal best
    const isPersonalBest = fish.rolledSize > personalBest;

    // Build item representation
    const item = {
      id: `fishing:${fish.id}`,
      displayName: fish.name,
      rarity: fish.rarity,
      size: fish.rolledSize,
      sizeQuality: sizeQuality.label,
      biome: fish.biomes[0],
      baseValue: fish.baseValue,
      description: fish.description,
      specialEffect: fish.specialEffect || null
    };

    // Calculate rarity bonus (extra rewards for rare+ catches)
    let rarityBonus = null;
    if (fish.rarity === 'legendary') {
      rarityBonus = {
        type: 'announcement',
        message: `✨ [Player] caught a LEGENDARY ${fish.name}!`,
        effect: fish.specialEffect
      };
    } else if (fish.rarity === 'epic') {
      rarityBonus = {
        type: 'particles',
        message: `Purple particles swirl around the ${fish.name}!`
      };
    } else if (fish.rarity === 'rare') {
      rarityBonus = {
        type: 'glow',
        color: 'blue'
      };
    }

    return {
      // Core rewards
      xp,
      credits,

      // Item representation
      item,

      // Size quality details
      sizeQuality: {
        tier: sizeQuality.tier,
        label: sizeQuality.label,
        multiplier: sizeQuality.multiplier,
        percentile: sizeQuality.normalizedPercent
      },

      // Rarity bonus effects
      rarityBonus,

      // Special flags
      isNewDiscovery,
      isPersonalBest,
      isFirstCatchOfDay: this.firstCatchOfDay,
      streakBonus: streakMult,

      // Summary for display
      summary: {
        fishName: fish.name,
        rarity: fish.rarity,
        size: `${fish.rolledSize}cm (${sizeQuality.label})`,
        xpEarned: xp,
        creditsEarned: credits,
        bonuses: this._formatBonuses(sizeQuality, streakMult, isNewDiscovery, isPersonalBest)
      }
    };
  }

  /**
   * Format bonus descriptions for display
   * @param {Object} sizeQuality - Size quality info
   * @param {number} streakMult - Streak multiplier
   * @param {boolean} isNewDiscovery - New species flag
   * @param {boolean} isPersonalBest - Personal best flag
   * @returns {Array<string>} List of bonus descriptions
   */
  _formatBonuses(sizeQuality, streakMult, isNewDiscovery, isPersonalBest) {
    const bonuses = [];

    if (sizeQuality.tier !== 'average') {
      bonuses.push(`${sizeQuality.label} size (${sizeQuality.multiplier}x)`);
    }

    if (streakMult > 1.0) {
      bonuses.push(`${Math.round((streakMult - 1) * 100)}% streak bonus`);
    }

    if (this.firstCatchOfDay) {
      bonuses.push('2x first catch of day');
    }

    if (isNewDiscovery) {
      bonuses.push('+50 XP new discovery');
    }

    if (isPersonalBest) {
      bonuses.push('🏆 New personal best!');
    }

    return bonuses;
  }

  /**
   * Calculate total value for selling fish
   * @param {Object} fish - Fish object
   * @param {number} size - Fish size
   * @returns {Promise<number>} Total sell value in credits
   */
  async calculateSellValue(fish, size) {
    const sizeQuality = await this._calculateSizeQuality(
      size,
      fish.minSize,
      fish.maxSize
    );

    const rarityMult = RARITY_CREDIT_MULTIPLIERS[fish.rarity] || 1.0;

    return Math.round(fish.baseValue * sizeQuality.multiplier * rarityMult);
  }
}

export default CatchProcessor;
