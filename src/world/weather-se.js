// CraftMind Fishing — Southeast Alaska Weather System
// Sitka gets 85+ inches of rain per year. Weather is not optional.
// Seasons: Spring, Summer, Fall, Winter (accelerated for gameplay).

export const SEASONS = {
  spring: {
    name: 'Spring', emoji: '🌱', tempRange: [36, 52],
    description: 'Herring spawn. First salmon. Crab season opens. The world wakes up wet.',
    speciesBoost: ['herring', 'king_salmon', 'dungeness_crab'],
  },
  summer: {
    name: 'Summer', emoji: '☀️', tempRange: [48, 65],
    description: 'Peak salmon run. Halibut season. Best weather (still rainy). Tourist boats everywhere.',
    speciesBoost: ['all_salmon', 'halibut', 'rockfish', 'tuna'],
  },
  fall: {
    name: 'Fall', emoji: '🍂', tempRange: [35, 50],
    description: 'Silver salmon run. Giant halibut. Storm season begins. The real fishermen stay.',
    speciesBoost: ['coho_salmon', 'halibut', 'lingcod', 'sablefish'],
  },
  winter: {
    name: 'Winter', emoji: '❄️', tempRange: [25, 40],
    description: 'Dungeness crab. Sea cucumbers. Ice fishing. Hard, cold, rewarding. Alaska sorts out who belongs.',
    speciesBoost: ['dungeness_crab', 'king_crab', 'sea_cucumber', 'tanner_crab'],
  },
};

export const WEATHER_TYPES = {
  clear:      { name: 'Clear',       emoji: '☀️', biteMult: 0.9, visibility: 20, seaState: 0, chance: { spring: 0.08, summer: 0.12, fall: 0.06, winter: 0.04 } },
  overcast:   { name: 'Overcast',    emoji: '☁️', biteMult: 1.1, visibility: 12, seaState: 1, chance: { spring: 0.30, summer: 0.28, fall: 0.25, winter: 0.20 } },
  rain:       { name: 'Rain',        emoji: '🌧️', biteMult: 1.4, visibility: 6,  seaState: 2, chance: { spring: 0.35, summer: 0.35, fall: 0.30, winter: 0.25 } },
  heavy_rain: { name: 'Heavy Rain',  emoji: '⛈️', biteMult: 1.5, visibility: 3,  seaState: 3, chance: { spring: 0.15, summer: 0.12, fall: 0.20, winter: 0.18 } },
  storm:      { name: 'Storm',       emoji: '🌪️', biteMult: 1.3, visibility: 1,  seaState: 5, chance: { spring: 0.06, summer: 0.04, fall: 0.12, winter: 0.10 } },
  fog:        { name: 'Fog',         emoji: '🌫️', biteMult: 1.2, visibility: 1,  seaState: 1, chance: { spring: 0.04, summer: 0.06, fall: 0.04, winter: 0.08 } },
  snow:       { name: 'Snow',        emoji: '🌨️', biteMult: 0.8, visibility: 2,  seaState: 1, chance: { spring: 0.02, summer: 0.00, fall: 0.03, winter: 0.15 } },
};

// Special Alaska weather events
export const SPECIAL_WEATHER = {
  williwaw:     { name: 'Williwaw',     emoji: '💨', description: 'Sudden violent wind from the mountains. Boats can capsize.', duration: [1, 5], danger: 'extreme' },
  glacier_wind: { name: 'Glacier Wind', emoji: '🧊', description: 'Cold wind from nearby glaciers. Temperature drops suddenly.', duration: [3, 10], danger: 'moderate' },
  banana_belt:  { name: 'Banana Belt',  emoji: '🍌', description: 'Warm sunny day. Everyone goes fishing. You should too.', duration: [10, 30], danger: 'none' },
  whiteout:     { name: 'Whiteout',     emoji: '⬜', description: 'Zero visibility. Only sound navigation. The sound of whales...', duration: [5, 15], danger: 'high' },
};

export class SEWeather {
  /**
   * @param {object} options
   * @param {number} options.dayLengthMinutes - One in-game day in real minutes (default 24)
   * @param {number} options.daysPerSeason - Game days per season (default 7)
   */
  constructor(options = {}) {
    this.dayLengthMinutes = options.dayLengthMinutes ?? 24;
    this.daysPerSeason = options.daysPerSeason ?? 7;
    this.gameTime = 0; // total game minutes elapsed

    this.currentWeather = 'overcast';
    this.weatherTimer = 0;
    this.weatherDuration = this._randomDuration();
    this.temperature = 45;
    this.windSpeed = 5;
    this.windDirection = Math.random() * 360;
    this.isThundering = false;

    this.specialEvent = null;
    this.specialEventTimer = 0;

    this.moonPhase = Math.floor(Math.random() * 8);
    this.forecast = []; // next 3 weather transitions
    this._generateForecast();
  }

  /** Get current season */
  getSeason() {
    const dayInYear = this.gameTime / this.dayLengthMinutes;
    const seasonIndex = Math.floor((dayInYear / this.daysPerSeason) % 4);
    return ['spring', 'summer', 'fall', 'winter'][seasonIndex];
  }

  /** Get time of day */
  getTimeOfDay() {
    const hourOfDay = ((this.gameTime % this.dayLengthMinutes) / this.dayLengthMinutes) * 24;
    if (hourOfDay < 5) return 'night';
    if (hourOfDay < 7) return 'dawn';
    if (hourOfDay < 17) return 'day';
    if (hourOfDay < 20) return 'dusk';
    return 'night';
  }

  /** Get current time info */
  getTimeInfo() {
    const hourOfDay = ((this.gameTime % this.dayLengthMinutes) / this.dayLengthMinutes) * 24;
    const dayNumber = Math.floor(this.gameTime / this.dayLengthMinutes) + 1;
    return {
      hour: Math.floor(hourOfDay),
      minute: Math.floor((hourOfDay % 1) * 60),
      timeOfDay: this.getTimeOfDay(),
      day: dayNumber,
      season: this.getSeason(),
      seasonDay: Math.floor((dayNumber - 1) / this.daysPerSeason % 4),
    };
  }

  /** Advance simulation */
  tick(dt = 1) {
    this.gameTime += dt;
    this.weatherTimer += dt;
    this.moonPhase = (this.moonPhase + dt / (this.dayLengthMinutes * 8)) % 8;

    const season = this.getSeason();
    const seasonData = SEASONS[season];

    // Temperature drifts toward seasonal range
    const [tMin, tMax] = seasonData.tempRange;
    const target = tMin + Math.random() * (tMax - tMin);
    this.temperature += (target - this.temperature) * 0.05 + (Math.random() - 0.5) * 0.5;

    // Wind
    this.windSpeed += (Math.random() - 0.5) * 2;
    this.windSpeed = Math.max(0, Math.min(60, this.windSpeed));
    this.windDirection += (Math.random() - 0.5) * 10;

    // Weather transitions
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      this.weatherDuration = this._randomDuration();
      this.currentWeather = this._pickWeather(season);
      this.isThundering = this.currentWeather === 'storm' || (this.currentWeather === 'heavy_rain' && Math.random() < 0.3);
      this._generateForecast();
    }

    // Special events
    if (this.specialEvent) {
      this.specialEventTimer += dt;
      if (this.specialEventTimer >= this.specialEvent.duration) {
        this.specialEvent = null;
      }
    } else if (Math.random() < 0.001) { // ~0.1% chance per tick
      this._triggerSpecialEvent(season);
    }

    // Thunder subsides
    if (this.isThundering && this.currentWeather !== 'storm' && Math.random() < 0.05) {
      this.isThundering = false;
    }

    // Special event temperature effects
    if (this.specialEvent?.id === 'glacier_wind') {
      this.temperature -= 2;
    } else if (this.specialEvent?.id === 'banana_belt') {
      this.temperature = Math.min(70, this.temperature + 1);
    }
  }

  /** Get current weather state */
  getWeather() {
    return {
      type: this.currentWeather,
      info: WEATHER_TYPES[this.currentWeather],
      temperature: Math.round(this.temperature),
      windSpeed: Math.round(this.windSpeed),
      windDirection: Math.round(this.windDirection),
      isThundering: this.isThundering,
      season: this.getSeason(),
      seasonInfo: SEASONS[this.getSeason()],
      timeOfDay: this.getTimeOfDay(),
      timeInfo: this.getTimeInfo(),
      moonPhase: Math.floor(this.moonPhase),
      specialEvent: this.specialEvent ? { ...this.specialEvent, timeRemaining: Math.max(0, this.specialEvent.duration - this.specialEventTimer) } : null,
    };
  }

  /** Get bite rate multiplier */
  getBiteMultiplier() {
    let mult = WEATHER_TYPES[this.currentWeather].biteMult;

    // Time of day
    const tod = this.getTimeOfDay();
    if (tod === 'dawn' || tod === 'dusk') mult *= 1.25;
    if (tod === 'night') mult *= 0.9;

    // Temperature comfort (Alaska fish like cold)
    const tempFactor = 1 - Math.abs(this.temperature - 48) / 40;
    mult *= 0.7 + tempFactor * 0.4;

    // Thunder bonus
    if (this.isThundering) mult *= 1.3;

    // Special events
    if (this.specialEvent?.id === 'banana_belt') mult *= 1.2;
    if (this.specialEvent?.id === 'williwaw') mult *= 0.3; // Too dangerous

    return mult;
  }

  /** Get sea state (0-5, affects boat safety) */
  getSeaState() {
    let state = WEATHER_TYPES[this.currentWeather].seaState;
    if (this.specialEvent?.id === 'williwaw') state = 6; // Beyond normal scale
    if (this.specialEvent?.id === 'storm') state += 1;
    return state;
  }

  /** Get boat safety check */
  getBoatSafety() {
    const seaState = this.getSeaState();
    if (seaState >= 5) return { safe: false, reason: 'Seas too rough. Stay in port.', risk: 'extreme' };
    if (seaState >= 4) return { safe: true, reason: 'Rough seas. Experienced captains only.', risk: 'high' };
    if (this.isThundering) return { safe: true, reason: 'Lightning risk. Keep watch.', risk: 'moderate' };
    if (this.specialEvent?.id === 'fog' || this.specialEvent?.id === 'whiteout') return { safe: true, reason: 'Zero visibility. Radar essential.', risk: 'high' };
    return { safe: true, reason: 'Seas reasonable.', risk: 'low' };
  }

  /** Get fishing quality description */
  getFishingReport() {
    const w = this.getWeather();
    const bite = this.getBiteMultiplier();
    const season = w.seasonInfo;

    let quality = 'poor';
    if (bite > 1.5) quality = 'excellent';
    else if (bite > 1.2) quality = 'good';
    else if (bite > 0.9) quality = 'fair';

    return {
      quality,
      biteMultiplier: Math.round(bite * 100) / 100,
      weather: w.info.name,
      season: season.name,
      tip: this._getTip(),
      activeSpecies: season.speciesBoost,
    };
  }

  /** Get forecast for next few transitions */
  getForecast() {
    return {
      current: this.currentWeather,
      today: this.forecast[0] ?? this.currentWeather,
      tomorrow: this.forecast[1] ?? this.forecast[0] ?? this.currentWeather,
      temp: Math.round(this.temperature),
      season: this.getSeason(),
    };
  }

  /** Force weather for testing */
  forceWeather(type) {
    if (!WEATHER_TYPES[type]) throw new Error(`Unknown weather type: ${type}`);
    this.currentWeather = type;
    this.isThundering = type === 'storm';
    this.weatherTimer = 0;
  }

  /** Force season by setting game time */
  forceSeason(season) {
    const index = ['spring', 'summer', 'fall', 'winter'].indexOf(season);
    if (index < 0) throw new Error(`Unknown season: ${season}`);
    this.gameTime = index * this.daysPerSeason * this.dayLengthMinutes;
  }

  toString() {
    const w = this.getWeather();
    const special = w.specialEvent ? ` | ${w.specialEvent.emoji} ${w.specialEvent.name}` : '';
    return `${w.info.emoji} ${w.info.name}${w.isThundering ? ' ⚡' : ''}${special} | 🌡️ ${w.temperature}°F | ${w.seasonInfo.emoji} ${w.seasonInfo.name} | ${this.getTimeOfDay()}`;
  }

  // --- Internal ---

  _pickWeather(season) {
    const chances = {};
    for (const [type, info] of Object.entries(WEATHER_TYPES)) {
      chances[type] = info.chance[season] ?? 0;
    }
    const total = Object.values(chances).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [type, chance] of Object.entries(chances)) {
      roll -= chance;
      if (roll <= 0) return type;
    }
    return 'overcast';
  }

  _randomDuration() {
    return 3 + Math.random() * 8; // 3-11 game minutes per weather
  }

  _generateForecast() {
    this.forecast = [];
    const season = this.getSeason();
    for (let i = 0; i < 3; i++) {
      this.forecast.push(this._pickWeather(season));
    }
  }

  _triggerSpecialEvent(season) {
    const eligible = Object.entries(SPECIAL_WEATHER).filter(([id, ev]) => {
      if (id === 'banana_belt') return season === 'summer' || season === 'spring';
      if (id === 'snow') return season === 'winter';
      return true;
    });
    if (eligible.length === 0) return;
    const [id, ev] = eligible[Math.floor(Math.random() * eligible.length)];
    const duration = ev.duration[0] + Math.random() * (ev.duration[1] - ev.duration[0]);
    this.specialEvent = { id, ...ev, duration };
    this.specialEventTimer = 0;
  }

  _getTip() {
    const tips = {
      clear: 'Rare clear day in Southeast Alaska. Fish aren\'t used to the sun — try deeper water.',
      overcast: 'Classic Sitka weather. The fish don\'t mind. Neither should you.',
      rain: 'Rain is when Alaska fish feed. This is what you came for.',
      heavy_rain: 'Fish are feeding hard, but watch the seas. Halibut go shallow in heavy rain.',
      storm: 'Only the desperate or the brave fish in a storm. Storm Sturgeon only appear now.',
      fog: 'Halibut surface-feed in fog. Dangerous for boats, legendary for fishing.',
      snow: 'Try ice fishing on Blue Lake or Deer Lake. The stillness is the reward.',
    };
    let tip = tips[this.currentWeather] ?? 'Fish are biting somewhere.';
    if (this.specialEvent) {
      tip += ` ${this.specialEvent.description}`;
    }
    return tip;
  }
}

export default SEWeather;
