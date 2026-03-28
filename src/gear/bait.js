/**
 * Bait System for CraftMind Fishing
 *
 * Defines bait types, their effects, and application to fish spawning.
 * Seven bait types from basic worms to legendary secret bait.
 *
 * @module gear/bait
 */

/**
 * Bait definition
 * @typedef {Object} BaitDefinition
 * @property {string} id - Unique bait identifier
 * @property {string} name - Display name
 * @property {string} rarity - Rarity tier
 * @property {string} description - Flavor text
 * @property {Object} effect - Bait effects
 * @property {number} effect.luckBonus - Luck percentage bonus (0-1)
 * @property {number} effect.speedBonus - Cast speed bonus (0-1)
 * @property {string[]} [effect.biomeUnlock] - Biomes this bait enables
 * @property {Object} [effect.rarityBonus] - Per-rarity bonuses
 * @property {string} durationType - 'catches' or 'minutes'
 * @property {number} durationValue - Number of catches or minutes
 * @property {Object} [source] - How to obtain this bait
 */

/**
 * All bait types
 * @type {BaitDefinition[]}
 */
export const BAIT_TYPES = [
  {
    id: 'worm',
    name: 'Earthworm',
    rarity: 'common',
    description: 'The classic bait. Works on almost everything, beloved by fish everywhere.',
    effect: {
      luckBonus: 0.0,
      speedBonus: 0.0,
      commonBonus: 0.1  // +10% common fish catch rate
    },
    durationType: 'catches',
    durationValue: 1,
    source: {
      type: 'dig',
      target: 'grass_block,dirt,coarse_dirt',
      chance: 0.3
    }
  },
  {
    id: 'cricket',
    name: 'Cricket',
    rarity: 'common',
    description: 'A lively insect that attracts fish with its movement.',
    effect: {
      luckBonus: 0.05,
      speedBonus: 0.05,
      uncommonBonus: 0.15
    },
    durationType: 'catches',
    durationValue: 3,
    source: {
      type: 'harvest',
      target: 'tall_grass,fern',
      time: 'night',
      chance: 0.15
    }
  },
  {
    id: 'minnow',
    name: 'Live Minnow',
    rarity: 'uncommon',
    description: 'Small fish make the best bait for bigger fish.',
    effect: {
      luckBonus: 0.10,
      speedBonus: 0.0,
      rareBonus: 0.20,
      sizeBonus: 0.1  // +10% chance for larger fish
    },
    durationType: 'catches',
    durationValue: 5,
    source: {
      type: 'catch',
      withRod: 'wooden_fishing_rod',
      filter: 'size<15cm',
      chance: 0.25
    }
  },
  {
    id: 'lure',
    name: 'Silver Lure',
    rarity: 'uncommon',
    description: 'A shiny artificial lure that flashes in the water.',
    effect: {
      luckBonus: 0.15,
      speedBonus: 0.10,
      attractRadius: 5  // Attracts fish within 5 blocks
    },
    durationType: 'minutes',
    durationValue: 10,
    source: {
      type: 'craft',
      recipe: {
        shapeless: true,
        ingredients: ['iron_nugget', 'iron_nugget', 'string'],
        result: 'lure'
      }
    }
  },
  {
    id: 'enchanted_bait',
    name: 'Enchanted Bait',
    rarity: 'rare',
    description: 'Glowing with magical energy, this bait calls to fish from afar.',
    effect: {
      luckBonus: 0.20,
      speedBonus: 0.15,
      rarityBonus: {
        rare: 0.25,
        epic: 0.15
      },
      ignoreWeather: true  // Works in any weather
    },
    durationType: 'catches',
    durationValue: 10,
    source: {
      type: 'craft',
      recipe: {
        shapeless: true,
        ingredients: ['glow_ink_sac', 'pufferfish', 'gold_nugget'],
        result: 'enchanted_bait'
      }
    }
  },
  {
    id: 'legendary_bait',
    name: 'Void Pearl Fragment',
    rarity: 'epic',
    description: 'A shard of impossible origin that whispers of deep secrets.',
    effect: {
      luckBonus: 0.35,
      speedBonus: 0.20,
      rarityBonus: {
        epic: 0.30,
        legendary: 0.20
      },
      biomeUnlock: ['underground_lake'],
      revealHidden: true  // Can reveal hidden/secret fish
    },
    durationType: 'catches',
    durationValue: 5,
    source: {
      type: 'loot',
      location: 'end_city,ancient_city',
      chance: 0.05
    }
  },
  {
    id: 'secret_bait',
    name: 'Ethereal Nectar',
    rarity: 'legendary',
    description: 'Dew collected from flowers that bloom only under the aurora.',
    effect: {
      luckBonus: 0.50,
      speedBonus: 0.25,
      rarityBonus: {
        legendary: 0.50
      },
      ignoreWeather: true,
      ignoreTime: true,   // Works at any time
      biomeUnlock: ['frozen_river', 'underground_lake'],
      auroraOnly: true,   // Only obtainable during aurora
      guaranteedRarity: 'rare'  // Minimum catch rarity
    },
    durationType: 'catches',
    durationValue: 3,
    source: {
      type: 'special',
      condition: 'aurora_visible',
      action: 'collect_dew',
      chance: 0.1
    }
  }
];

/**
 * BaitSystem class for managing bait effects
 */
export class BaitSystem {
  constructor() {
    /** @type {Map<string, BaitDefinition>} */
    this.baits = new Map();

    // Initialize bait registry
    for (const bait of BAIT_TYPES) {
      this.baits.set(bait.id, bait);
    }
  }

  /**
   * Get bait by ID
   * @param {string} baitId
   * @returns {BaitDefinition|undefined}
   */
  getBait(baitId) {
    return this.baits.get(baitId);
  }

  /**
   * Get all baits sorted by rarity
   * @returns {BaitDefinition[]}
   */
  getAllBaits() {
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    return [...this.baits.values()].sort((a, b) =>
      rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
    );
  }

  /**
   * Apply bait effects to a fish spawner configuration
   * @param {Object} spawner - Fish spawner state
   * @param {string} baitId - Bait to apply
   * @returns {Object} Modified spawner weights
   */
  applyBait(spawner, baitId) {
    const bait = this.baits.get(baitId);
    if (!bait) {
      return spawner;
    }

    const modified = { ...spawner };

    // Apply luck bonus to all fish
    if (bait.effect.luckBonus) {
      modified.globalLuckBonus = (modified.globalLuckBonus || 0) + bait.effect.luckBonus;
    }

    // Apply speed bonus
    if (bait.effect.speedBonus) {
      modified.speedBonus = (modified.speedBonus || 0) + bait.effect.speedBonus;
    }

    // Apply rarity-specific bonuses
    if (bait.effect.commonBonus) {
      modified.rarityWeights = modified.rarityWeights || {};
      modified.rarityWeights.common =
        (modified.rarityWeights.common || 0.65) * (1 + bait.effect.commonBonus);
    }
    if (bait.effect.uncommonBonus) {
      modified.rarityWeights = modified.rarityWeights || {};
      modified.rarityWeights.uncommon =
        (modified.rarityWeights.uncommon || 0.22) * (1 + bait.effect.uncommonBonus);
    }
    if (bait.effect.rareBonus) {
      modified.rarityWeights = modified.rarityWeights || {};
      modified.rarityWeights.rare =
        (modified.rarityWeights.rare || 0.09) * (1 + bait.effect.rareBonus);
    }
    if (bait.effect.rarityBonus) {
      modified.rarityWeights = modified.rarityWeights || {};
      for (const [rarity, bonus] of Object.entries(bait.effect.rarityBonus)) {
        modified.rarityWeights[rarity] =
          (modified.rarityWeights[rarity] || 0) * (1 + bonus);
      }
    }

    // Apply size bonus
    if (bait.effect.sizeBonus) {
      modified.sizeBonus = (modified.sizeBonus || 0) + bait.effect.sizeBonus;
    }

    // Unlock restricted biomes
    if (bait.effect.biomeUnlock) {
      modified.unlockedBiomes = [
        ...(modified.unlockedBiomes || []),
        ...bait.effect.biomeUnlock
      ];
    }

    // Set special flags
    if (bait.effect.ignoreWeather) {
      modified.ignoreWeather = true;
    }
    if (bait.effect.ignoreTime) {
      modified.ignoreTime = true;
    }
    if (bait.effect.revealHidden) {
      modified.revealHidden = true;
    }
    if (bait.effect.guaranteedRarity) {
      modified.minRarity = bait.effect.guaranteedRarity;
    }

    return modified;
  }

  /**
   * Calculate remaining bait duration
   * @param {string} baitId
   * @param {Object} activeBait - Active bait state
   * @param {number} activeBait.uses - Number of uses
   * @param {number} activeBait.startTime - Start timestamp (ms)
   * @returns {{remaining: number, unit: string, expired: boolean}}
   */
  getRemainingDuration(baitId, activeBait) {
    const bait = this.baits.get(baitId);
    if (!bait) {
      return { remaining: 0, unit: 'unknown', expired: true };
    }

    if (bait.durationType === 'catches') {
      const remaining = Math.max(0, bait.durationValue - activeBait.uses);
      return {
        remaining,
        unit: 'catches',
        expired: remaining <= 0
      };
    }

    if (bait.durationType === 'minutes') {
      const elapsedMs = Date.now() - activeBait.startTime;
      const elapsedMin = elapsedMs / 60000;
      const remaining = Math.max(0, bait.durationValue - elapsedMin);
      return {
        remaining: Math.ceil(remaining),
        unit: 'minutes',
        expired: remaining <= 0
      };
    }

    return { remaining: 0, unit: 'unknown', expired: true };
  }

  /**
   * Check if bait can be obtained with given conditions
   * @param {string} baitId
   * @param {Object} conditions - Player conditions
   * @returns {{canObtain: boolean, reason?: string}}
   */
  canObtainBait(baitId, conditions = {}) {
    const bait = this.baits.get(baitId);
    if (!bait) {
      return { canObtain: false, reason: 'Unknown bait' };
    }

    const source = bait.source;

    switch (source.type) {
      case 'dig':
        return { canObtain: true };

      case 'harvest':
        if (source.time && conditions.timeOfDay !== source.time) {
          return { canObtain: false, reason: `Only available at ${source.time}` };
        }
        return { canObtain: true };

      case 'catch':
        if (source.withRod && conditions.rodId !== source.withRod) {
          return { canObtain: false, reason: `Requires ${source.withRod}` };
        }
        return { canObtain: true };

      case 'craft':
        return { canObtain: true };

      case 'loot':
        if (source.location && !conditions.location) {
          return { canObtain: false, reason: `Found in ${source.location}` };
        }
        return { canObtain: true };

      case 'special':
        if (source.condition === 'aurora_visible' && !conditions.auroraVisible) {
          return { canObtain: false, reason: 'Only during aurora borealis' };
        }
        return { canObtain: true };

      default:
        return { canObtain: true };
    }
  }

  /**
   * Get bait display info for UI
   * @param {string} baitId
   * @returns {Object|null}
   */
  getBaitDisplayInfo(baitId) {
    const bait = this.baits.get(baitId);
    if (!bait) return null;

    const effectDescriptions = [];

    if (bait.effect.luckBonus) {
      effectDescriptions.push(`+${(bait.effect.luckBonus * 100).toFixed(0)}% luck`);
    }
    if (bait.effect.speedBonus) {
      effectDescriptions.push(`+${(bait.effect.speedBonus * 100).toFixed(0)}% speed`);
    }
    if (bait.effect.rarityBonus) {
      for (const [rarity, bonus] of Object.entries(bait.effect.rarityBonus)) {
        effectDescriptions.push(`+${(bonus * 100).toFixed(0)}% ${rarity}`);
      }
    }
    if (bait.effect.biomeUnlock) {
      effectDescriptions.push(`Unlocks: ${bait.effect.biomeUnlock.join(', ')}`);
    }
    if (bait.effect.ignoreWeather) {
      effectDescriptions.push('All weather');
    }
    if (bait.effect.ignoreTime) {
      effectDescriptions.push('Any time');
    }

    const durationText = bait.durationType === 'catches'
      ? `${bait.durationValue} catches`
      : `${bait.durationValue} minutes`;

    return {
      name: bait.name,
      rarity: bait.rarity,
      description: bait.description,
      effects: effectDescriptions,
      duration: durationText,
      source: this._getSourceDescription(bait.source)
    };
  }

  /**
   * Get human-readable source description
   * @private
   */
  _getSourceDescription(source) {
    switch (source.type) {
      case 'dig':
        return `Dig ${source.target.replace(/_/g, ' ')}`;
      case 'harvest':
        const timeNote = source.time ? ` at ${source.time}` : '';
        return `Harvest ${source.target}${timeNote}`;
      case 'catch':
        return `Catch while fishing`;
      case 'craft':
        return 'Craft at workbench';
      case 'loot':
        return `Found in ${source.location}`;
      case 'special':
        if (source.condition === 'aurora_visible') {
          return 'Collect during aurora borealis';
        }
        return 'Special event';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get effective catch weights with bait applied
   * @param {string} baitId
   * @returns {Object} Rarity weights
   */
  getEffectiveRarityWeights(baitId) {
    const baseWeights = {
      common: 0.65,
      uncommon: 0.22,
      rare: 0.09,
      epic: 0.032,
      legendary: 0.008
    };

    const bait = this.baits.get(baitId);
    if (!bait) return baseWeights;

    const modified = { ...baseWeights };

    if (bait.effect.commonBonus) {
      modified.common *= (1 + bait.effect.commonBonus);
    }
    if (bait.effect.uncommonBonus) {
      modified.uncommon *= (1 + bait.effect.uncommonBonus);
    }
    if (bait.effect.rareBonus) {
      modified.rare *= (1 + bait.effect.rareBonus);
    }
    if (bait.effect.rarityBonus) {
      for (const [rarity, bonus] of Object.entries(bait.effect.rarityBonus)) {
        modified[rarity] = (modified[rarity] || 0) * (1 + bonus);
      }
    }

    // Normalize to sum to 1
    const total = Object.values(modified).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(modified)) {
      modified[key] /= total;
    }

    return modified;
  }
}

// Singleton instance
export const baitSystem = new BaitSystem();

export default BaitSystem;
