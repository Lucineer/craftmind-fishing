/**
 * Fishing Rod Registry for CraftMind Fishing
 *
 * Defines rod tiers, their properties, and comparison utilities.
 * Six tiers from basic wooden to legendary with unique abilities.
 *
 * @module gear/rods
 */

/**
 * Rod tier definition
 * @typedef {Object} RodDefinition
 * @property {string} id - Unique rod identifier
 * @property {string} name - Display name
 * @property {string} rarity - Rarity tier (common to legendary)
 * @property {number} tier - Numeric tier (1-6)
 * @property {number} durability - Maximum uses before breaking
 * @property {number} castSpeedMod - Speed multiplier for casting (higher = faster)
 * @property {number} luckMod - Bonus to rare fish catch rate
 * @property {number} enchantSlots - Number of enchantment slots
 * @property {string|null} specialAbility - Unique ability name
 * @property {Object} crafting - Crafting recipe (optional)
 * @property {string} description - Flavor text
 */

/**
 * Rod tiers with all properties
 * @type {RodDefinition[]}
 */
export const ROD_TIERS = [
  {
    id: 'wooden_fishing_rod',
    name: 'Wooden Fishing Rod',
    rarity: 'common',
    tier: 1,
    durability: 64,
    castSpeedMod: 1.0,
    luckMod: 0.0,
    enchantSlots: 1,
    specialAbility: null,
    crafting: {
      pattern: ['  S', ' S ', 'W  '],
      ingredients: { 'S': 'stick', 'W': 'oak_planks' }
    },
    description: 'A simple rod for beginners. Good enough for common fish.',
    unlockRequirement: null
  },
  {
    id: 'iron_fishing_rod',
    name: 'Iron Fishing Rod',
    rarity: 'uncommon',
    tier: 2,
    durability: 256,
    castSpeedMod: 1.2,
    luckMod: 0.10,
    enchantSlots: 2,
    specialAbility: null,
    crafting: {
      pattern: ['  S', ' I ', 'S  '],
      ingredients: { 'S': 'stick', 'I': 'iron_ingot' }
    },
    description: 'A sturdy rod that catches fish faster and lasts longer.',
    unlockRequirement: { type: 'catch_count', value: 200 }
  },
  {
    id: 'golden_fishing_rod',
    name: 'Golden Fishing Rod',
    rarity: 'rare',
    tier: 3,
    durability: 32,
    castSpeedMod: 1.5,
    luckMod: 0.20,
    enchantSlots: 3,
    specialAbility: 'golden_lure',
    crafting: {
      pattern: ['  S', ' G ', 'S  '],
      ingredients: { 'S': 'stick', 'G': 'gold_ingot' }
    },
    description: 'Fast but fragile. The gold attracts fish like moths to flame.',
    unlockRequirement: { type: 'craft', value: 'golden_fishing_rod' },
    abilities: {
      golden_lure: {
        name: 'Golden Lure',
        description: '+5% catch rate during golden hour (dawn/dusk)',
        bonus: { timeBonus: 1.05, times: ['dawn', 'dusk'] }
      }
    }
  },
  {
    id: 'diamond_fishing_rod',
    name: 'Diamond Fishing Rod',
    rarity: 'epic',
    tier: 4,
    durability: 1024,
    castSpeedMod: 1.3,
    luckMod: 0.25,
    enchantSlots: 4,
    specialAbility: 'treasure_finder',
    crafting: {
      pattern: ['  D', ' S ', 'D  '],
      ingredients: { 'S': 'stick', 'D': 'diamond' }
    },
    description: 'A masterwork rod. Diamonds channel luck through the line.',
    unlockRequirement: { type: 'catch_count', value: 1000 },
    abilities: {
      treasure_finder: {
        name: 'Treasure Finder',
        description: '+15% chance to find treasure items while fishing',
        bonus: { treasureChance: 0.15 }
      }
    }
  },
  {
    id: 'netherite_fishing_rod',
    name: 'Netherite Fishing Rod',
    rarity: 'epic',
    tier: 5,
    durability: 2031,
    castSpeedMod: 1.4,
    luckMod: 0.35,
    enchantSlots: 4,
    specialAbility: 'lava_fisher',
    crafting: {
      type: 'smithing',
      base: 'diamond_fishing_rod',
      addition: 'netherite_ingot'
    },
    description: 'The ultimate rod. Can even fish in lava with the right bait.',
    unlockRequirement: { type: 'upgrade', value: 'diamond_fishing_rod' },
    abilities: {
      lava_fisher: {
        name: 'Lava Fisher',
        description: 'Can fish in lava pools (requires netherite rod + fire resistance)',
        bonus: { lavaFishing: true }
      }
    }
  },
  {
    id: 'legendary_fishing_rod',
    name: 'Aurora Rod',
    rarity: 'legendary',
    tier: 6,
    durability: -1,  // Unbreakable
    castSpeedMod: 1.6,
    luckMod: 0.50,
    enchantSlots: 5,
    specialAbility: 'aurora_blessing',
    crafting: null,  // Not craftable
    description: 'Forged from captured starlight, this rod bends reality to the angler\'s will.',
    unlockRequirement: { type: 'catch_legendary', value: 5 },
    abilities: {
      aurora_blessing: {
        name: 'Aurora Blessing',
        description: 'Under aurora borealis, legendary fish are revealed and +50% catch rate',
        bonus: { auroraBoost: 1.5, legendaryReveal: true }
      }
    }
  }
];

/**
 * RodRegistry class for managing fishing rods
 */
export class RodRegistry {
  constructor() {
    /** @type {Map<string, RodDefinition>} */
    this.rods = new Map();
    /** @type {Map<number, RodDefinition>} */
    this.rodsByTier = new Map();

    // Initialize rod registries
    for (const rod of ROD_TIERS) {
      this.rods.set(rod.id, rod);
      this.rodsByTier.set(rod.tier, rod);
    }
  }

  /**
   * Get rod by ID
   * @param {string} rodId - Rod identifier
   * @returns {RodDefinition|undefined}
   */
  getRod(rodId) {
    return this.rods.get(rodId);
  }

  /**
   * Get rod by tier number
   * @param {number} tier - Tier number (1-6)
   * @returns {RodDefinition|undefined}
   */
  getRodByTier(tier) {
    return this.rodsByTier.get(tier);
  }

  /**
   * Get all rods sorted by tier
   * @returns {RodDefinition[]}
   */
  getAllRods() {
    return [...this.rods.values()].sort((a, b) => a.tier - b.tier);
  }

  /**
   * Compare two rods for shop display
   * @param {string} rodAId - First rod ID
   * @param {string} rodBId - Second rod ID
   * @returns {Object} Comparison result with advantages
   */
  compareRods(rodAId, rodBId) {
    const rodA = this.rods.get(rodAId);
    const rodB = this.rods.get(rodBId);

    if (!rodA || !rodB) {
      return { error: 'One or both rods not found' };
    }

    return {
      rodA: {
        id: rodA.id,
        name: rodA.name,
        tier: rodA.tier
      },
      rodB: {
        id: rodB.id,
        name: rodB.name,
        tier: rodB.tier
      },
      differences: {
        durability: {
          a: rodA.durability,
          b: rodB.durability,
          advantage: rodA.durability > rodB.durability ? 'a' :
                     rodA.durability < rodB.durability ? 'b' : 'tie',
          percentChange: rodB.durability > 0 ?
            ((rodA.durability - rodB.durability) / rodB.durability * 100).toFixed(1) : '∞'
        },
        castSpeed: {
          a: rodA.castSpeedMod,
          b: rodB.castSpeedMod,
          advantage: rodA.castSpeedMod > rodB.castSpeedMod ? 'a' :
                     rodA.castSpeedMod < rodB.castSpeedMod ? 'b' : 'tie',
          percentChange: ((rodA.castSpeedMod - rodB.castSpeedMod) / rodB.castSpeedMod * 100).toFixed(1)
        },
        luck: {
          a: rodA.luckMod,
          b: rodB.luckMod,
          advantage: rodA.luckMod > rodB.luckMod ? 'a' :
                     rodA.luckMod < rodB.luckMod ? 'b' : 'tie',
          percentChange: rodB.luckMod > 0 ?
            ((rodA.luckMod - rodB.luckMod) / rodB.luckMod * 100).toFixed(1) : 'N/A'
        },
        enchantSlots: {
          a: rodA.enchantSlots,
          b: rodB.enchantSlots,
          advantage: rodA.enchantSlots > rodB.enchantSlots ? 'a' :
                     rodA.enchantSlots < rodB.enchantSlots ? 'b' : 'tie'
        }
      },
      specialAbilities: {
        a: rodA.specialAbility,
        b: rodB.specialAbility
      },
      tierDifference: rodA.tier - rodB.tier
    };
  }

  /**
   * Calculate effective rod bonuses
   * @param {string} rodId - Rod identifier
   * @param {Object} context - Current fishing context
   * @param {number} [context.timeOfDay] - Time in ticks
   * @param {string} [context.weather] - Weather type
   * @param {boolean} [context.auroraActive] - Aurora borealis visible
   * @returns {Object} Calculated bonuses
   */
  calculateRodBonuses(rodId, context = {}) {
    const rod = this.rods.get(rodId);
    if (!rod) {
      return {
        castSpeedMod: 1.0,
        luckMod: 0.0,
        specialBonuses: {}
      };
    }

    let castSpeedMod = rod.castSpeedMod;
    let luckMod = rod.luckMod;
    const specialBonuses = {};

    // Apply special abilities
    if (rod.specialAbility && rod.abilities) {
      const ability = rod.abilities[rod.specialAbility];
      if (ability) {
        // Golden Lure - dawn/dusk bonus
        if (rod.specialAbility === 'golden_lure' && context.timeOfDay !== undefined) {
          const isGoldenHour = context.timeOfDay < 3000 ||
                              (context.timeOfDay >= 12000 && context.timeOfDay < 14000);
          if (isGoldenHour) {
            luckMod += 0.05;
            specialBonuses.goldenHour = true;
          }
        }

        // Treasure Finder - always active
        if (rod.specialAbility === 'treasure_finder') {
          specialBonuses.treasureChance = 0.15;
        }

        // Lava Fisher
        if (rod.specialAbility === 'lava_fisher') {
          specialBonuses.lavaFishing = true;
        }

        // Aurora Blessing
        if (rod.specialAbility === 'aurora_blessing' && context.auroraActive) {
          luckMod += 0.5;
          specialBonuses.legendaryReveal = true;
          specialBonuses.auroraBoost = 1.5;
        }
      }
    }

    return {
      castSpeedMod,
      luckMod,
      specialBonuses,
      durability: rod.durability,
      enchantSlots: rod.enchantSlots
    };
  }

  /**
   * Check if player meets unlock requirements for a rod
   * @param {string} rodId - Rod identifier
   * @param {Object} playerStats - Player's fishing statistics
   * @param {number} playerStats.totalCatches - Total fish caught
   * @param {number} playerStats.legendaryCatches - Legendary fish caught
   * @param {string[]} playerStats.ownedRods - Rods already owned
   * @returns {{unlocked: boolean, reason?: string}}
   */
  checkUnlockRequirements(rodId, playerStats) {
    const rod = this.rods.get(rodId);
    if (!rod) {
      return { unlocked: false, reason: 'Unknown rod' };
    }

    if (!rod.unlockRequirement) {
      return { unlocked: true };
    }

    const req = rod.unlockRequirement;

    switch (req.type) {
      case 'catch_count':
        if (playerStats.totalCatches >= req.value) {
          return { unlocked: true };
        }
        return {
          unlocked: false,
          reason: `Catch ${req.value - playerStats.totalCatches} more fish (need ${req.value} total)`
        };

      case 'craft':
        // Check if player has crafting materials (simplified)
        return { unlocked: true };

      case 'upgrade':
        if (playerStats.ownedRods.includes(req.value)) {
          return { unlocked: true };
        }
        return { unlocked: false, reason: `Requires ${req.value} to upgrade` };

      case 'catch_legendary':
        if (playerStats.legendaryCatches >= req.value) {
          return { unlocked: true };
        }
        return {
          unlocked: false,
          reason: `Catch ${req.value - playerStats.legendaryCatches} more legendary fish`
        };

      default:
        return { unlocked: true };
    }
  }

  /**
   * Get next rod tier upgrade path
   * @param {string} currentRodId - Current rod ID
   * @returns {RodDefinition|null} Next rod tier or null if at max
   */
  getNextUpgrade(currentRodId) {
    const currentRod = this.rods.get(currentRodId);
    if (!currentRod) return null;

    return this.rodsByTier.get(currentRod.tier + 1) || null;
  }

  /**
   * Get rod display info for UI
   * @param {string} rodId
   * @returns {Object} Formatted rod info
   */
  getRodDisplayInfo(rodId) {
    const rod = this.rods.get(rodId);
    if (!rod) return null;

    return {
      name: rod.name,
      tier: rod.tier,
      rarity: rod.rarity,
      durability: rod.durability === -1 ? 'Unbreakable' : rod.durability.toString(),
      stats: {
        'Cast Speed': `${(rod.castSpeedMod * 100).toFixed(0)}%`,
        'Luck Bonus': `+${(rod.luckMod * 100).toFixed(0)}%`,
        'Enchant Slots': rod.enchantSlots.toString()
      },
      specialAbility: rod.specialAbility ? rod.abilities[rod.specialAbility]?.name : null,
      description: rod.description
    };
  }
}

// Singleton instance
export const rodRegistry = new RodRegistry();

export default RodRegistry;
