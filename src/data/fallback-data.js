// CraftMind Fishing — Realistic Pre-Generated Sitka Fallback Data
// Everything here is based on real NOAA / NWS / NDBC 30-year normals
// for Sitka, AK (station 9454050, buoy 46084).
// The game ALWAYS works even without internet.

// ═══════════════════════════════════════════════════════════════════
// Sitka Tidal Constants (mixed semidiurnal)
// ═══════════════════════════════════════════════════════════════════

export const SITKA_TIDE_PATTERN = {
  station: 'Sitka, AK',
  stationId: '9454050',
  type: 'mixed semidiurnal',
  meanRange: 5.5,     // feet MLLW to MHHW
  springRange: 10.5,  // feet (new & full moon)
  neapRange: 3.5,     // feet (quarter moon)
  highHigh: 12.5,     // feet above MLLW
  lowHigh: 8.0,
  highLow: 1.5,
  lowLow: -2.5,       // feet below MLLW (minus tides are real here!)
};

// ═══════════════════════════════════════════════════════════════════
// Sitka Weather Normals (30-year)
// ═══════════════════════════════════════════════════════════════════

export const SITKA_WEATHER = {
  station: 'Sitka, AK',
  annualRainfall: 86,        // inches
  wettestMonth: 'October',
  driestMonth: 'July',
  avgTemp: {
    jan: 34, feb: 35, mar: 37, apr: 42,
    may: 48, jun: 54, jul: 58, aug: 57,
    sep: 52, oct: 45, nov: 39, dec: 35,
  },
  daysByCondition: {
    clear: 35,
    partlyCloudy: 100,
    cloudy: 150,
    overcast: 80,
  },
  prevailingWind: 'SE',
  avgWindSpeed: 10,          // knots
  galeFrequency: 'Common Oct-Mar',
  daylight: {
    summer_solstice: 18,     // hours
    winter_solstice: 6,
    equinox: 12,
  },
};

// ═══════════════════════════════════════════════════════════════════
// Cape Edgecumbe Buoy Pattern (station 46084)
// ═══════════════════════════════════════════════════════════════════

export const BUOY_PATTERN = {
  station: 'Cape Edgecumbe',
  stationId: '46084',
  avgWaveHeight: { spring: 5, summer: 3, fall: 6, winter: 10 }, // feet
  maxWaveHeight: 35,
  dominantWavePeriod: { summer: 8, winter: 14 },               // seconds
  avgWindSpeed: { summer: 10, winter: 20 },                     // knots
  maxWindSpeed: 75,                                             // knots (storm)
  waterTemp: { spring: 43, summer: 50, fall: 48, winter: 42 },  // °F
};

// ═══════════════════════════════════════════════════════════════════
// Historical Catch Data (CFEC-inspired for Sitka area)
// ═══════════════════════════════════════════════════════════════════

export const HISTORICAL_CATCHES = {
  salmon: {
    chinook:  { avgAnnualLbs: 500000,   range: [200000, 1000000],   trend: 'variable' },
    coho:    { avgAnnualLbs: 2000000,  range: [1000000, 4000000],  trend: 'stable' },
    sockeye: { avgAnnualLbs: 500000,   range: [100000, 1500000],   trend: 'variable' },
    pink:    { avgAnnualLbs: 15000000, range: [3000000, 50000000], trend: 'odd_year_boost', oddYearBoost: 3 },
    chum:    { avgAnnualLbs: 800000,   range: [200000, 2000000],   trend: 'stable' },
  },
  halibut:  { avgAnnualLbs: 2000000,  range: [1500000, 2500000] },
  sablefish:{ avgAnnualLbs: 500000,   range: [300000, 700000] },
  dungeness:{ avgAnnualLbs: 3000000,  range: [1000000, 6000000] },
  shrimp:   { avgAnnualLbs: 200000,   range: [100000, 400000] },
};

// ═══════════════════════════════════════════════════════════════════
// FallbackData — generates realistic values from the patterns above
// ═══════════════════════════════════════════════════════════════════

export class FallbackData {
  /** Generate a realistic tide table for a given day. */
  getTides(dateOrDayOfYear = 1) {
    const day = typeof dateOrDayOfYear === 'number' ? dateOrDayOfYear : this._dayOfYear(dateOrDayOfYear);
    const { springRange, neapRange, meanRange } = SITKA_TIDE_PATTERN;

    // Spring-neap from lunar phase (approx)
    const lunarPhase = (day % 29.5) / 29.5;
    const springFactor = Math.abs(Math.cos(lunarPhase * Math.PI * 2));
    const range = neapRange + (springRange - neapRange) * springFactor;

    // Two unequal high tides and two low tides per day
    // Phase offset so tides shift ~50 min/day (real)
    const phaseShift = (day * 50 / 1440) * Math.PI * 2;

    const tides = [];
    const labels = ['High High', 'Low Low', 'High Low', 'Low High'];
    const levels = [
      range * 0.6 + 2,   // high-high
      -range * 0.3 - 1,  // low-low
      range * 0.35 + 1,  // high-low
      -range * 0.15,     // low-high
    ];

    for (let i = 0; i < 4; i++) {
      const hour = 2.5 + i * 6.2 + Math.sin(phaseShift + i) * 0.8;
      tides.push({
        time: `${String(Math.floor(hour) % 24).padStart(2, '0')}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}`,
        type: i % 2 === 0 ? 'H' : 'L',
        label: labels[i],
        height: Math.round(levels[i] * 10) / 10,
        heightFt: Math.round(levels[i] * 10) / 10,
      });
    }

    return {
      station: SITKA_TIDE_PATTERN.station,
      date: typeof dateOrDayOfYear === 'string' ? dateOrDayOfYear : `2026-${String(Math.floor(day / 30) + 1).padStart(2, '0')}-${String(Math.floor(day % 30) + 1).padStart(2, '0')}`,
      tides,
      range: Math.round(range * 10) / 10,
      isSpring: springFactor > 0.7,
      isNeap: springFactor < 0.3,
    };
  }

  /** Generate a realistic weather snapshot. */
  getWeather(season = 'summer', hourOfDay = 12) {
    const month = { spring: 4, summer: 7, fall: 10, winter: 1 }[season] ?? 7;
    const baseTemp = SITKA_WEATHER.avgTemp;

    const tempKey = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][month - 1];
    const base = baseTemp[tempKey];
    const diurnalRange = 8;
    const tempOffset = Math.sin((hourOfDay - 6) / 24 * Math.PI * 2) * (diurnalRange / 2);
    const temp = Math.round((base + tempOffset + (Math.random() - 0.5) * 4) * 10) / 10;

    // Pick weather type weighted by season
    const weatherWeights = {
      clear: season === 'summer' ? 0.12 : 0.04,
      partlyCloudy: 0.15,
      cloudy: 0.30,
      overcast: 0.25,
      rain: 0.18,
      heavy_rain: season === 'fall' ? 0.15 : 0.08,
      fog: 0.06,
    };
    const weatherType = this._weightedPick(weatherWeights);

    // Wind
    const isGaleSeason = season === 'fall' || season === 'winter';
    const baseWind = isGaleSeason ? 15 : 8;
    const windSpeed = Math.max(0, Math.round(baseWind + Math.random() * 20 - 5));
    const windDir = 135 + (Math.random() - 0.5) * 60; // prevailing SE

    return {
      temperature: temp,
      tempF: Math.round(temp * 9 / 5 + 32),
      weatherType,
      windSpeed,
      windDirection: Math.round(windDir) % 360,
      windDirLabel: this._compassDir(windDir),
      humidity: 75 + Math.round(Math.random() * 20),
      pressure: Math.round(1000 + Math.random() * 30),
      visibility: weatherType === 'fog' ? 0.5 : weatherType === 'clear' ? 15 : 5 + Math.random() * 5,
      seaState: this._seaState(windSpeed, weatherType),
    };
  }

  /** Generate realistic buoy conditions. */
  getBuoyData(season = 'summer') {
    const p = BUOY_PATTERN;
    const waveHt = this._jitter(p.avgWaveHeight[season], 2);
    const windSpd = this._jitter(p.avgWindSpeed[season], 5);
    const waterTemp = this._jitter(p.waterTemp[season], 2);

    return {
      station: p.station,
      stationId: p.stationId,
      waveHeight: waveHt,
      wavePeriod: this._jitter((p.dominantWavePeriod[season] + p.dominantWavePeriod.winter) / 2, 3),
      windSpeed: windSpd,
      windGust: Math.round(windSpd * 1.3),
      waterTemp: waterTemp,
      waterTempF: Math.round(waterTemp),
    };
  }

  /** Generate simulated landings data for a year. */
  getLandingsData({ year = 2026, species } = {}) {
    if (species && HISTORICAL_CATCHES[species]) {
      const d = HISTORICAL_CATCHES[species];
      return { year, species, lbs: this._randomInRange(d.range), trend: d.trend };
    }
    if (species && HISTORICAL_CATCHES.salmon[species]) {
      const d = HISTORICAL_CATCHES.salmon[species];
      return { year, species: `salmon.${species}`, lbs: this._randomInRange(d.range), trend: d.trend };
    }
    // Return all
    const result = { year };
    for (const [key, val] of Object.entries(HISTORICAL_CATCHES)) {
      if (key === 'salmon') {
        result.salmon = {};
        for (const [s, d] of Object.entries(val)) {
          result.salmon[s] = { lbs: this._randomInRange(d.range), trend: d.trend };
        }
      } else {
        result[key] = { lbs: this._randomInRange(val.range) };
      }
    }
    return result;
  }

  // ── Helpers ─────────────────────────────────────────────────────

  _dayOfYear(dateStr) {
    const d = new Date(dateStr);
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86_400_000);
  }

  _jitter(base, spread) {
    return Math.round((base + (Math.random() - 0.5) * spread * 2) * 10) / 10;
  }

  _randomInRange([min, max]) {
    return Math.round(min + Math.random() * (max - min));
  }

  _weightedPick(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [key, w] of Object.entries(weights)) {
      r -= w;
      if (r <= 0) return key;
    }
    return Object.keys(weights).pop();
  }

  _compassDir(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  _seaState(wind, weather) {
    if (weather === 'heavy_rain' || weather === 'storm') return Math.min(6, Math.ceil(wind / 10));
    return Math.min(5, Math.ceil(wind / 12));
  }
}

export default FallbackData;
