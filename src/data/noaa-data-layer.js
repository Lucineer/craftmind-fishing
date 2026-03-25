// CraftMind Fishing — NOAA Integration Layer
// Unified API for weather, tides, buoy, landings, and ENC data.
// Falls back to realistic pre-generated Sitka data when offline.

import { NOAAAPIProxy } from './noaa-api-proxy.js';
import { FallbackData } from './fallback-data.js';

export class NOAADataLayer {
  /**
   * @param {object} config
   * @param {boolean} config.liveData - Use live NOAA APIs (default false)
   * @param {string}  config.cacheDir - Directory for cached NOAA data (default './data/noaa-cache')
   */
  constructor(config = {}) {
    this.useLiveData = config.liveData ?? false;
    this.fallback = new FallbackData();
    this.proxy = new NOAAAPIProxy();

    // Sitka defaults
    this.station = '9454050';   // Sitka tide station
    this.buoyId = '46084';      // Cape Edgecumbe
    this.lat = 57.05;
    this.lon = -135.33;
  }

  // ── Weather ─────────────────────────────────────────────────────

  /** Get current weather (or realistic fallback). */
  async getWeather({ season, hourOfDay } = {}) {
    if (this.useLiveData) {
      try {
        const point = await this.proxy.getWeatherPoint({ lat: this.lat, lon: this.lon });
        // Extract gridpoint for forecast
        const { properties: { forecastHourly } } = point;
        const forecast = await this.proxy.fetch('weather', { forecastHourly }, { path: forecastHourly.replace('https://api.weather.gov', '') });
        return this._mapWeatherGrid(forecast);
      } catch {
        // Fall through to fallback
      }
    }
    return this.fallback.getWeather(season, hourOfDay);
  }

  // ── Tides ───────────────────────────────────────────────────────

  /** Get tide predictions for a date. */
  async getTides(date = '2026-06-15') {
    if (this.useLiveData) {
      try {
        const raw = await this.proxy.getTidePredictions({
          station: this.station,
          date,
          product: 'predictions',
        });
        return this._mapTidePredictions(raw);
      } catch {
        // Fall through
      }
    }
    return this.fallback.getTides(date);
  }

  /** Get tide table for the next several days. */
  async getTideTable(days = 3) {
    const table = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTides = await this.getTides(dateStr);
      table.push(dayTides);
    }
    return table;
  }

  // ── Buoy Data ──────────────────────────────────────────────────

  /** Get real-time (or simulated) buoy conditions. */
  async getBuoyData({ station, season } = {}) {
    const buoy = station ?? this.buoyId;
    if (this.useLiveData) {
      try {
        const raw = await this.proxy.getBuoyData({ station: buoy });
        return this._mapBuoyData(raw);
      } catch {
        // Fall through
      }
    }
    return this.fallback.getBuoyData(season);
  }

  // ── Landings / Historical Catch ────────────────────────────────

  /** Get historical catch data (simulated or from NOAA). */
  async getLandingsData({ year, region, species } = {}) {
    // NOAA landings data requires an API key and is complex;
    // we always use the fallback which is based on real CFEC patterns.
    return this.fallback.getLandingsData({ year, species });
  }

  // ── Species Info ────────────────────────────────────────────────

  /** Get species information. Uses local registry — NOAA has no unified species API. */
  getSpeciesInfo(scientificName) {
    const { SitkaSpeciesRegistry } = require('../world/sitka-species.js');
    return SitkaSpeciesRegistry.all().find(
      s => s.scientificName.toLowerCase() === scientificName.toLowerCase()
    ) ?? null;
  }

  // ── Convenience ─────────────────────────────────────────────────

  /** Get a full "situation report" — weather + tides + buoy in one call. */
  async getSitRep({ season, hourOfDay, date } = {}) {
    const [weather, tides, buoy] = await Promise.all([
      this.getWeather({ season, hourOfDay }),
      this.getTides(date),
      this.getBuoyData({ season }),
    ]);
    return { weather, tides, buoy, timestamp: Date.now() };
  }

  // ── Mappers (NOAA JSON → game-friendly shape) ──────────────────

  _mapWeatherGrid(forecast) {
    try {
      const period = forecast.properties.periods[0];
      return {
        temperature: period.temperature,
        tempF: period.temperature,
        weatherType: this._mapNWSIcon(period.icon),
        windSpeed: parseInt(period.windSpeed) || 10,
        windDirection: this._nwsDirToDeg(period.windDirection),
        humidity: period.relativeHumidity?.value ?? 80,
        description: period.shortForecast,
      };
    } catch {
      return this.fallback.getWeather();
    }
  }

  _mapTidePredictions(raw) {
    try {
      const predictions = raw.predictions ?? [];
      return {
        station: raw.metadata?.name ?? 'Sitka, AK',
        date: raw.metadata?.date ?? 'unknown',
        tides: predictions.map(p => ({
          time: p.t,
          type: p.type === 'H' ? 'H' : 'L',
          label: p.type === 'H' ? 'High Tide' : 'Low Tide',
          height: parseFloat(p.v),
          heightFt: parseFloat(p.v),
        })),
        range: 0,
      };
    } catch {
      return this.fallback.getTides();
    }
  }

  _mapBuoyData(raw) {
    // NDBC spec data is text-based; this is a best-effort parse
    try {
      return {
        station: raw.station_id ?? this.buoyId,
        waveHeight: parseFloat(raw.waveHeight) ?? 5,
        wavePeriod: parseFloat(raw.dominantWavePeriod) ?? 8,
        windSpeed: parseFloat(parseFloat(raw.windSpeed).toFixed(1)) ?? 10,
        waterTemp: parseFloat(raw.waterTemperature) ?? 48,
      };
    } catch {
      return this.fallback.getBuoyData();
    }
  }

  _mapNWSIcon(iconUrl) {
    if (!iconUrl) return 'cloudy';
    if (iconUrl.includes('clear')) return 'clear';
    if (iconUrl.includes('rain')) return iconUrl.includes('showers') ? 'rain' : 'heavy_rain';
    if (iconUrl.includes('snow')) return 'snow';
    if (iconUrl.includes('fog')) return 'fog';
    if (iconUrl.includes('cloudy')) return 'overcast';
    if (iconUrl.includes('partly')) return 'partlyCloudy';
    return 'cloudy';
  }

  _nwsDirToDeg(dir) {
    if (!dir) return 135;
    const map = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
    return map[dir.toUpperCase()] ?? parseInt(dir) ?? 135;
  }
}

export default NOAADataLayer;
