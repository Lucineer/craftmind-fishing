// CraftMind Fishing — Dynamic Alaska Market Simulation
// Supply/demand pricing, random events, dock buyers, weather impact.

import { allPrices, priceModifiers, fisherySeasons, calcPrice } from './ex-vessel-prices.js';
import { FishTicketLedger } from './fish-ticket.js';

/** Dock buyers — each has specialties and preferences. */
export const DOCK_BUYERS = [
  { name: 'Sitka Sound Seafoods', specialty: 'salmon', premium: 1.1, notes: 'Main salmon buyer in Sitka. Reliable.' },
  { name: 'North Pacific Seafoods', specialty: 'groundfish', premium: 1.05, notes: 'Big operation. Good for halibut and cod.' },
  { name: 'The Fish House', specialty: 'fresh local', premium: 1.15, max_volume: 500, notes: 'Small buyer, premium prices, limited volume. Local restaurant supplier.' },
  { name: 'Sitka Processing', specialty: 'bulk', premium: 0.95, unlimited: true, notes: 'Takes anything, lower prices, but always buying.' },
  { name: 'Icy Strait Point', specialty: 'tourist trade', premium: 1.2, seasonal: true, season_months: [5, 6, 7, 8], notes: 'Cruise ship tourists. Premium for photo-worthy fish. Summer only.' },
];

/** Market events — random events that affect prices. */
export const MARKET_EVENTS = [
  {
    id: 'japan_surge',
    name: 'Japanese Market Surge',
    description: 'Demand spike from Japan for sablefish and spot shrimp.',
    affectedSpecies: ['sablefish_blackcod', 'spot_shrimp'],
    priceMultiplier: 2.0,
    duration: 3, // game days
    weight: 3,
  },
  {
    id: 'farmed_salmon_scandal',
    name: 'Farmed Salmon Scare',
    description: 'Disease scare in farmed salmon — wild prices rise!',
    affectedSpecies: ['chinook_king', 'coho_silver', 'sockeye_red'],
    priceMultiplier: 1.5,
    duration: 5,
    weight: 4,
  },
  {
    id: 'holiday_crab',
    name: 'Holiday Season',
    description: 'Crab prices spike for holiday feasts.',
    affectedSpecies: ['king_crab', 'dungeness_crab', 'tanner_crab'],
    priceMultiplier: 1.6,
    duration: 7,
    weight: 5,
    month: 12,
  },
  {
    id: 'plant_fire',
    name: 'Processing Plant Fire',
    description: 'Processing plant damaged — all prices drop temporarily.',
    affectedSpecies: 'all',
    priceMultiplier: 0.6,
    duration: 4,
    weight: 2,
  },
  {
    id: 'geoduck_celebrity',
    name: 'Celebrity Geoduck Endorsement',
    description: 'A TV chef made geoduck famous again.',
    affectedSpecies: ['geoduck'],
    priceMultiplier: 2.0,
    duration: 3,
    weight: 1,
  },
  {
    id: 'chinese_new_year',
    name: 'Chinese New Year',
    description: 'Massive demand spike for premium seafood.',
    affectedSpecies: ['geoduck', 'spot_shrimp', 'weathervane_scallop', 'sablefish_blackcod'],
    priceMultiplier: 1.8,
    duration: 5,
    weight: 3,
    month: 1,
  },
  {
    id: 'glut',
    name: 'Market Glut',
    description: 'Oversupply — everyone caught fish at once.',
    affectedSpecies: 'all',
    priceMultiplier: 0.7,
    duration: 3,
    weight: 5,
  },
  {
    id: 'storm_supply',
    name: 'Storm-Driven Shortage',
    description: 'Bad weather kept boats in — supply drops, prices rise.',
    affectedSpecies: 'all',
    priceMultiplier: 1.4,
    duration: 2,
    weight: 4,
  },
];

export class AlaskaMarket {
  /**
   * @param {object} options
   * @param {FishTicketLedger} [options.ledger] - Fish ticket ledger for supply data
   */
  constructor(options = {}) {
    this.ledger = options.ledger ?? new FishTicketLedger();
    this.activeEvents = new Map(); // eventId -> { event, daysRemaining }
    this.priceCache = new Map();    // speciesId -> { price, trend, reason, history: [] }
    this.gameDay = 0;
    this.currentMonth = new Date().getMonth();

    // Supply tracking: speciesId -> pounds sold this week
    this.weeklySupply = new Map();
    this.weeklyDemand = new Map();

    // Initialize price cache
    for (const speciesId of Object.keys(allPrices)) {
      this.priceCache.set(speciesId, {
        price: allPrices[speciesId].base,
        trend: 'stable',
        reason: 'Market opening',
        history: [allPrices[speciesId].base],
      });
    }
  }

  /** Advance the market by one game day. */
  update(gameDay, month) {
    this.gameDay = gameDay ?? this.gameDay + 1;
    this.currentMonth = month ?? this.currentMonth;

    // Tick active events
    this._tickEvents();

    // Maybe trigger new events
    this._rollEvents();

    // Update all prices
    for (const [speciesId, cache] of this.priceCache) {
      const newPrice = this._calculatePrice(speciesId);
      const oldPrice = cache.price;

      // Trend detection
      if (newPrice > oldPrice * 1.05) cache.trend = 'rising';
      else if (newPrice < oldPrice * 0.95) cache.trend = 'falling';
      else cache.trend = 'stable';

      cache.price = newPrice;
      cache.reason = this._getPriceReason(speciesId);
      cache.history.push(newPrice);
      if (cache.history.length > 30) cache.history.shift(); // Keep 30 days
    }

    // Reset weekly supply every 7 days
    if (this.gameDay % 7 === 0) {
      this.weeklySupply.clear();
    }
  }

  /** Get current price for a species. */
  getPrice(speciesId) {
    const cached = this.priceCache.get(speciesId);
    if (!cached) return null;
    return {
      price: Math.round(cached.price * 100) / 100,
      trend: cached.trend,
      reason: cached.reason,
      history: cached.history.map(p => Math.round(p * 100) / 100),
    };
  }

  /** Record a sale (affects supply). */
  recordSale(speciesId, pounds) {
    this.weeklySupply.set(speciesId, (this.weeklySupply.get(speciesId) ?? 0) + pounds);
  }

  /** Find the best buyer for a species. */
  findBestBuyer(speciesId, pounds, month) {
    const speciesData = allPrices[speciesId];
    if (!speciesData) return null;

    const basePrice = this.getPrice(speciesId)?.price ?? speciesData.base;
    let bestBuyer = null;
    let bestPrice = 0;

    for (const buyer of DOCK_BUYERS) {
      // Check seasonal availability
      if (buyer.seasonal && buyer.season_months && !(buyer.season_months).includes(month ?? this.currentMonth)) continue;
      // Check volume limits
      if (buyer.max_volume && pounds > buyer.max_volume) continue;

      // Specialty premium
      let premium = buyer.premium;
      if (speciesData.category === buyer.specialty) premium *= 1.05; // Extra 5% for specialty match

      const offeredPrice = basePrice * premium;
      if (offeredPrice > bestPrice) {
        bestPrice = offeredPrice;
        bestBuyer = { ...buyer, offeredPrice: Math.round(offeredPrice * 100) / 100 };
      }
    }

    return bestBuyer;
  }

  /** Sell fish to best available buyer. Returns { buyer, price, total }. */
  sellToBuyer(speciesId, pounds, month) {
    const buyer = this.findBestBuyer(speciesId, pounds, month);
    if (!buyer) return { success: false, reason: 'No buyers available.' };

    this.recordSale(speciesId, pounds);

    return {
      success: true,
      buyer: buyer.name,
      price_per_lb: buyer.offeredPrice,
      total: Math.round(buyer.offeredPrice * pounds * 100) / 100,
      notes: buyer.notes,
    };
  }

  /** Get market forecast for captain AI / decision making. */
  getForecast() {
    const forecasts = [];
    for (const [speciesId, cache] of this.priceCache) {
      const history = cache.history;
      let predicted = cache.price;

      if (history.length >= 5) {
        const recent = history.slice(-3).reduce((a, b) => a + b, 0) / 3;
        predicted = recent + (recent - cache.price) * 0.2;
      }

      // Check for upcoming events that might affect this species
      const upcomingEvents = [];
      for (const [eventId, evt] of this.activeEvents) {
        const event = evt.event;
        if (event.affectedSpecies === 'all' || event.affectedSpecies.includes(speciesId)) {
          upcomingEvents.push(event.name);
        }
      }

      forecasts.push({
        species: speciesId,
        current: Math.round(cache.price * 100) / 100,
        predicted: Math.round(predicted * 100) / 100,
        trend: cache.trend,
        upcomingEvents,
      });
    }
    return forecasts.sort((a, b) => Math.abs(b.predicted - b.current) - Math.abs(a.predicted - a.current));
  }

  /** Get all active events. */
  getActiveEvents() {
    return [...this.activeEvents.values()].map(e => ({
      name: e.event.name,
      description: e.event.description,
      daysRemaining: e.daysRemaining,
    }));
  }

  /** Internal: calculate price for a species. */
  _calculatePrice(speciesId) {
    const data = allPrices[speciesId];
    if (!data) return 0;

    let price = data.base;

    // Event multipliers
    for (const [, evt] of this.activeEvents) {
      const event = evt.event;
      if (event.affectedSpecies === 'all' || event.affectedSpecies.includes(speciesId)) {
        price *= event.priceMultiplier;
      }
    }

    // Supply/demand (weekly supply pushes price down)
    const supply = this.weeklySupply.get(speciesId) ?? 0;
    const supplyMult = 1 / (1 + supply * 0.0005);
    price *= supplyMult;

    // Small random walk (±5%)
    price *= 0.95 + Math.random() * 0.10;

    // Clamp to range
    return Math.max(data.range[0], Math.min(data.range[1], Math.round(price * 100) / 100));
  }

  /** Internal: generate a reason for the current price. */
  _getPriceReason(speciesId) {
    const reasons = [];

    // Check events
    for (const [, evt] of this.activeEvents) {
      const event = evt.event;
      if (event.affectedSpecies === 'all' || event.affectedSpecies.includes(speciesId)) {
        reasons.push(event.description);
      }
    }

    // Check supply
    const supply = this.weeklySupply.get(speciesId) ?? 0;
    if (supply > 5000) reasons.push('Heavy supply — prices pressured down');
    else if (supply < 100) reasons.push('Light supply — prices holding steady');

    // Season
    const season = fisherySeasons[speciesId];
    if (season) {
      const m = this.currentMonth;
      if (season.peak?.includes(m)) reasons.push('Peak season — good volume available');
      else if (!season.early?.includes(m) && !season.late?.includes(m) && !season.peak?.includes(m)) {
        reasons.push('Off-season — limited availability');
      }
    }

    return reasons.length > 0 ? reasons[0] : 'Normal market conditions';
  }

  /** Internal: tick active events. */
  _tickEvents() {
    for (const [id, evt] of this.activeEvents) {
      evt.daysRemaining--;
      if (evt.daysRemaining <= 0) {
        this.activeEvents.delete(id);
      }
    }
  }

  /** Internal: roll for new events. */
  _rollEvents() {
    for (const event of MARKET_EVENTS) {
      // Month-specific events only fire in that month
      if (event.month != null && event.month !== this.currentMonth) continue;
      // Don't stack same event
      if (this.activeEvents.has(event.id)) continue;

      const chance = 0.03 * (event.weight ?? 1); // ~3% base per event per day, weighted
      if (Math.random() < chance) {
        this.activeEvents.set(event.id, {
          event,
          daysRemaining: event.duration,
        });
      }
    }
  }

  /** Get full market summary. */
  getSummary() {
    return {
      gameDay: this.gameDay,
      currentMonth: this.currentMonth,
      activeEvents: this.getActiveEvents(),
      speciesTracked: this.priceCache.size,
      weeklySupply: Object.fromEntries(this.weeklySupply),
    };
  }

  /** Serialize */
  toJSON() {
    return {
      gameDay: this.gameDay,
      currentMonth: this.currentMonth,
      activeEvents: [...this.activeEvents.entries()],
      priceCache: [...this.priceCache.entries()],
      weeklySupply: [...this.weeklySupply.entries()],
    };
  }

  /** Deserialize */
  static fromJSON(data) {
    const market = new AlaskaMarket();
    if (data) {
      market.gameDay = data.gameDay ?? 0;
      market.currentMonth = data.currentMonth ?? 0;
      market.activeEvents = new Map(data.activeEvents ?? []);
      market.priceCache = new Map(data.priceCache ?? []);
      market.weeklySupply = new Map(data.weeklySupply ?? []);
    }
    return market;
  }
}

export default AlaskaMarket;
