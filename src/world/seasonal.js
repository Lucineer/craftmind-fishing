/**
 * Seasonal System for CraftMind Fishing
 *
 * Manages seasons, their effects on fishing, and special seasonal events.
 * Four seasons with fish availability modifiers and weather patterns.
 *
 * @module world/seasonal
 */

/**
 * Season definition
 * @typedef {Object} SeasonDefinition
 * @property {string} id - Season identifier
 * @property {string} name - Display name
 * @property {number[]} months - Real-world months (1-12)
 * @property {Object} modifiers - Season modifiers
 * @property {Object} weatherPatterns - Weather probability adjustments
 * @property {string[]} specialFish - Fish with boosted rates this season
 * @property {Object} event - Seasonal event details
 */

/**
 * All season definitions
 * @type {Map<string, SeasonDefinition>}
 */
export const SEASONS = new Map([
  ['spring', {
    id: 'spring',
    name: 'Spring',
    months: [3, 4, 5], // March, April, May
    modifiers: {
      catchRateMod: 1.15,
      rarityMod: 1.1,
      activityLevel: 'high'  // Fish are active after winter
    },
    weatherPatterns: {
      clear: 0.5,
      rain: 0.4,
      thunder: 0.08,
      snow: 0.02
    },
    specialFish: [
      'rainbow_trout',
      'golden_trout',
      'arctic_char',
      'whitefish',
      'brook_trout'
    ],
    fishBehavior: {
      spawnActivity: 2.0,    // High spawning activity
      feedingActivity: 1.3,  // Hungry after winter
      migrationBonus: 0.2    // Salmon runs starting
    },
    event: {
      id: 'spring_festival',
      name: 'Spring Spawning Festival',
      description: 'Celebrate the return of fish to rivers and streams.',
      durationDays: 31,
      startMonth: 3,
      startDay: 20,
      bonuses: {
        xpMultiplier: 1.5,
        coinMultiplier: 1.25
      }
    }
  }],

  ['summer', {
    id: 'summer',
    name: 'Summer',
    months: [6, 7, 8], // June, July, August
    modifiers: {
      catchRateMod: 1.0,
      rarityMod: 1.0,
      activityLevel: 'medium'
    },
    weatherPatterns: {
      clear: 0.65,
      rain: 0.25,
      thunder: 0.09,
      snow: 0.01
    },
    specialFish: [
      'bluefin_tuna',
      'king_salmon',
      'lingcod',
      'pacific_halibut',
      'alaskan_spot_prawn'
    ],
    fishBehavior: {
      spawnActivity: 0.8,
      feedingActivity: 1.0,
      deepWaterBonus: 0.15  // Fish retreat to cooler depths
    },
    event: {
      id: 'summer_slam',
      name: 'Summer Slam Tournament',
      description: 'The biggest fish are caught in summer\'s warm waters.',
      durationDays: 30,
      startMonth: 6,
      startDay: 21,
      bonuses: {
        sizeBonus: 1.2,
        tournament: 'biggest_catch'
      }
    }
  }],

  ['fall', {
    id: 'fall',
    name: 'Fall',
    months: [9, 10, 11], // September, October, November
    modifiers: {
      catchRateMod: 1.2,
      rarityMod: 1.15,
      activityLevel: 'very_high'  // Pre-winter feeding frenzy
    },
    weatherPatterns: {
      clear: 0.45,
      rain: 0.4,
      thunder: 0.1,
      snow: 0.05
    },
    specialFish: [
      'king_salmon',
      'coho_salmon',
      'sockeye_salmon',
      'pink_salmon',
      'chum_salmon',
      'dolly_varden'
    ],
    fishBehavior: {
      spawnActivity: 3.0,     // Peak salmon spawning
      feedingActivity: 1.5,   // Aggressive feeding
      migrationBonus: 0.5     // Massive salmon runs
    },
    event: {
      id: 'harvest_moon',
      name: 'Harvest Moon Festival',
      description: 'The salmon return! Night fishing is especially rewarding.',
      durationDays: 30,
      startMonth: 9,
      startDay: 22,
      bonuses: {
        nightCatchRate: 1.5,
        salmonBonus: 1.5
      }
    }
  }],

  ['winter', {
    id: 'winter',
    name: 'Winter',
    months: [12, 1, 2], // December, January, February
    modifiers: {
      catchRateMod: 0.85,     // Slower fishing
      rarityMod: 1.25,        // But rarer fish
      activityLevel: 'low'
    },
    weatherPatterns: {
      clear: 0.35,
      rain: 0.25,
      thunder: 0.05,
      snow: 0.35
    },
    specialFish: [
      'arctic_char',
      'burbot',
      'frost_pike',
      'aurora_char',
      'frost_serpent',
      'ice_perch'
    ],
    fishBehavior: {
      spawnActivity: 0.5,
      feedingActivity: 0.7,
      frozenBiomeBonus: 0.3,  // Ice fishing is rewarding
      legendaryChance: 0.1    // Winter legends emerge
    },
    event: {
      id: 'winter_wonderland',
      name: 'Winter Wonderland',
      description: 'Ice fishing reveals hidden treasures of the frozen depths.',
      durationDays: 31,
      startMonth: 12,
      startDay: 21,
      bonuses: {
        frozenBiomeBonus: 2.0,
        legendaryChance: 1.5
      }
    }
  }]
]);

/**
 * SeasonSystem class for managing seasonal effects
 */
export class SeasonSystem {
  constructor(options = {}) {
    /** @type {Date|number} - Current date reference */
    this.currentDate = options.currentDate || new Date();
    /** @type {Map<string, SeasonDefinition>} */
    this.seasons = SEASONS;
    /** @type {boolean} - Use real-time or game-time */
    this.useRealTime = options.useRealTime !== false;
  }

  /**
   * Get the current season based on date
   * @param {Date} [date] - Date to check (defaults to current)
   * @returns {SeasonDefinition}
   */
  getCurrentSeason(date = this.currentDate) {
    const month = date.getMonth() + 1; // 0-indexed to 1-indexed

    for (const season of this.seasons.values()) {
      if (season.months.includes(month)) {
        return season;
      }
    }

    // Default to spring if not found
    return this.seasons.get('spring');
  }

  /**
   * Get season for a specific month
   * @param {number} month - Month (1-12)
   * @returns {SeasonDefinition}
   */
  getSeasonByMonth(month) {
    for (const season of this.seasons.values()) {
      if (season.months.includes(month)) {
        return season;
      }
    }
    return this.seasons.get('spring');
  }

  /**
   * Check if a seasonal event is currently active
   * @param {Date} [date] - Date to check
   * @returns {{active: boolean, event?: Object, remainingDays?: number}}
   */
  getActiveEvent(date = this.currentDate) {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    for (const season of this.seasons.values()) {
      const event = season.event;
      if (!event) continue;

      const eventStart = new Date(date.getFullYear(), event.startMonth - 1, event.startDay);
      const eventEnd = new Date(eventStart);
      eventEnd.setDate(eventEnd.getDate() + event.durationDays);

      if (date >= eventStart && date <= eventEnd) {
        const remainingMs = eventEnd - date;
        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

        return {
          active: true,
          event: {
            ...event,
            seasonId: season.id,
            seasonName: season.name
          },
          remainingDays
        };
      }
    }

    return { active: false };
  }

  /**
   * Get season modifiers for a fish species
   * @param {Object} fish - Fish species to check
   * @param {string} fish.id - Fish identifier
   * @param {Date} [date] - Date to check
   * @returns {Object} Seasonal modifiers for this fish
   */
  getSeasonModifier(fish, date = this.currentDate) {
    const season = this.getCurrentSeason(date);

    // Check if this fish is special for the season
    const isSpecialFish = season.specialFish.includes(fish.id);

    const modifiers = {
      catchRateMod: season.modifiers.catchRateMod,
      rarityMod: season.modifiers.rarityMod,
      isSpecialFish,
      specialFishBonus: isSpecialFish ? 1.5 : 1.0
    };

    // Apply fish behavior modifiers
    if (season.fishBehavior) {
      Object.assign(modifiers, season.fishBehavior);
    }

    return modifiers;
  }

  /**
   * Get all fish available in current season
   * @param {Object[]} allFish - All fish species
   * @param {Date} [date] - Date to check
   * @returns {Object[]} Fish with seasonal bonuses applied
   */
  getSeasonalFishList(allFish, date = this.currentDate) {
    const season = this.getCurrentSeason(date);
    const specialFishSet = new Set(season.specialFish);

    return allFish.map(fish => {
      const isSpecial = specialFishSet.has(fish.id);
      return {
        ...fish,
        isSeasonalSpecial: isSpecial,
        seasonalBonus: isSpecial ? 1.5 : 1.0,
        seasonModifiers: this.getSeasonModifier(fish, date)
      };
    });
  }

  /**
   * Get weather probability for current season
   * @param {Date} [date] - Date to check
   * @returns {Object} Weather probabilities
   */
  getWeatherProbabilities(date = this.currentDate) {
    const season = this.getCurrentSeason(date);
    return { ...season.weatherPatterns };
  }

  /**
   * Calculate total fishing bonuses for current conditions
   * @param {Object} options
   * @param {Date} [options.date] - Current date
   * @param {string} [options.biome] - Current biome
   * @param {string} [options.weather] - Current weather
   * @param {number} [options.timeOfDay] - Time in ticks
   * @returns {Object} Combined bonuses
   */
  calculateTotalBonuses(options = {}) {
    const { date = this.currentDate, biome, weather, timeOfDay } = options;
    const season = this.getCurrentSeason(date);
    const eventStatus = this.getActiveEvent(date);

    const bonuses = {
      season: {
        id: season.id,
        name: season.name,
        catchRateMod: season.modifiers.catchRateMod,
        rarityMod: season.modifiers.rarityMod
      },
      event: null,
      weather: 1.0,
      time: 1.0,
      biome: 1.0
    };

    // Apply event bonuses
    if (eventStatus.active && eventStatus.event.bonuses) {
      bonuses.event = {
        ...eventStatus.event,
        bonuses: eventStatus.event.bonuses
      };
    }

    // Weather bonuses
    if (weather === 'rain') {
      bonuses.weather = 1.1;
    } else if (weather === 'thunder') {
      bonuses.weather = 1.25;
    }

    // Time bonuses (dawn/dusk are best)
    if (timeOfDay !== undefined) {
      if (timeOfDay < 3000 || (timeOfDay >= 12000 && timeOfDay < 14000)) {
        bonuses.time = 1.15;
      } else if (timeOfDay >= 14000) {
        bonuses.time = 0.9; // Night penalty (except for night-active fish)
      }
    }

    // Biome-season synergy
    if (biome) {
      if (biome === 'frozen_river' && season.id === 'winter') {
        bonuses.biome = 1.5; // Winter ice fishing bonus
      } else if (biome === 'river' && season.id === 'fall') {
        bonuses.biome = 1.3; // Salmon run bonus
      }
    }

    return bonuses;
  }

  /**
   * Get upcoming seasonal events
   * @param {number} [daysAhead=30] - Days to look ahead
   * @returns {Object[]} Upcoming events
   */
  getUpcomingEvents(daysAhead = 30) {
    const events = [];
    const now = new Date(this.currentDate);

    for (let i = 0; i <= daysAhead; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);

      const eventStatus = this.getActiveEvent(checkDate);
      if (eventStatus.active) {
        // Avoid duplicates
        if (!events.find(e => e.id === eventStatus.event.id)) {
          events.push({
            ...eventStatus.event,
            daysUntil: i
          });
        }
      }
    }

    return events;
  }

  /**
   * Get season display info for UI
   * @param {Date} [date]
   * @returns {Object}
   */
  getSeasonDisplayInfo(date = this.currentDate) {
    const season = this.getCurrentSeason(date);
    const eventStatus = this.getActiveEvent(date);

    const seasonEmoji = {
      spring: '🌸',
      summer: '☀️',
      fall: '🍂',
      winter: '❄️'
    };

    return {
      name: season.name,
      id: season.id,
      emoji: seasonEmoji[season.id] || '🎣',
      activityLevel: season.modifiers.activityLevel,
      catchRateMod: season.modifiers.catchRateMod,
      rarityMod: season.modifiers.rarityMod,
      specialFishCount: season.specialFish.length,
      activeEvent: eventStatus.active ? {
        name: eventStatus.event.name,
        description: eventStatus.event.description,
        remainingDays: eventStatus.remainingDays
      } : null
    };
  }

  /**
   * Set the current date reference (for testing)
   * @param {Date|number} date
   */
  setCurrentDate(date) {
    this.currentDate = date instanceof Date ? date : new Date(date);
  }

  /**
   * Get all seasons
   * @returns {SeasonDefinition[]}
   */
  getAllSeasons() {
    return Array.from(this.seasons.values());
  }
}

// Singleton instance
export const seasonSystem = new SeasonSystem();

export default SeasonSystem;
