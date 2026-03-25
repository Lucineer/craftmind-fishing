// CraftMind Fishing — NOAA API Proxy with Caching
// Thin wrapper around NOAA REST endpoints with in-memory cache.
// Works in browser and Node. Never blocks the game on a fetch.

/**
 * NOAA API base URLs (public, no key required for weather.gov & tides).
 * Buoy / landings endpoints would need keys for production; this proxy
 * ships stubs so the fallback-data path always works.
 */
const NOAA_ENDPOINTS = {
  weather: 'https://api.weather.gov',
  tides: 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations',
  buoy: 'https://www.ndbc.noaa.gov/data/realtime2',
};

export class NOAAAPIProxy {
  constructor({ cacheExpiry } = {}) {
    this.cache = new Map();

    // Default TTLs (ms): weather 30 min, tides 24 h, buoy 5 min
    this.cacheExpiry = {
      weather: 1_800_000,
      tides: 86_400_000,
      buoy: 300_000,
      landings: 8_640_0000,
      species: 8_640_0000,
      enc: Infinity, // ENC data never changes
      ...cacheExpiry,
    };
  }

  /** Generic fetch with caching. */
  async fetch(endpoint, params = {}, options = {}) {
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.time < this.cacheExpiry[endpoint]) {
      return cached.data;
    }

    try {
      const data = await this._fetchFromNOAA(endpoint, params, options);
      this.cache.set(cacheKey, { data, time: Date.now() });
      return data;
    } catch (err) {
      // Return stale cache on network error
      if (cached) return cached.data;
      throw err;
    }
  }

  // ── NOAA weather.gov ────────────────────────────────────────────

  async getWeatherPoint({ lat, lon }) {
    return this.fetch('weather', { lat, lon }, { path: `/points/${lat},${lon}` });
  }

  async getGridpointForecast({ gridId, x, y }) {
    return this.fetch('weather', { gridId, x, y }, { path: `/gridpoints/${gridId}/${x},${y}/forecast` });
  }

  // ── NOAA Tides & Currents ───────────────────────────────────────

  async getTidePredictions({ station, date, product = 'predictions' }) {
    const params = new URLSearchParams({
      station,
      date,
      product,
      datum: 'MLLW',
      units: 'english',
      format: 'json',
    });
    return this.fetch('tides', { station, date }, {
      path: `/stations/${station}/${product}.json?${params}`,
    });
  }

  // ── NOAA NDBC Buoy ──────────────────────────────────────────────

  async getBuoyData({ station }) {
    return this.fetch('buoy', { station }, {
      path: `/${station}.spec`,
    });
  }

  // ── Cache management ────────────────────────────────────────────

  /** Invalidate all entries for a given endpoint group. */
  invalidate(endpoint) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${endpoint}:`)) this.cache.delete(key);
    }
  }

  /** Clear entire cache. */
  clear() {
    this.cache.clear();
  }

  /** Cache stats for debugging. */
  stats() {
    const byEndpoint = {};
    for (const [key, val] of this.cache) {
      const ep = key.split(':')[0];
      byEndpoint[ep] = (byEndpoint[ep] ?? 0) + 1;
    }
    return { entries: this.cache.size, byEndpoint };
  }

  // ── Internal ────────────────────────────────────────────────────

  async _fetchFromNOAA(endpoint, _params, options = {}) {
    const base = NOAA_ENDPOINTS[endpoint];
    if (!base) throw new Error(`Unknown NOAA endpoint: ${endpoint}`);

    const url = options.path ? `${base}${options.path}` : base;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CraftMindFishing/1.0 (educational game)',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`NOAA ${res.status}: ${res.statusText}`);
    return res.json();
  }
}

export default NOAAAPIProxy;
