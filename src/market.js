// CraftMind Fishing — Dynamic Fish Market
// Supply/demand pricing, events, NPC customers, shop mechanic.

export const MARKET_EVENTS = [
  { id: 'royal_banquet', name: 'Royal Banquet Order', desc: 'A royal banquet demands exotic fish!', effect: { species: 'glow_squid', priceMultiplier: 3, duration: 300000 } },
  { id: 'festival', name: 'Fishing Festival', desc: 'Annual fishing festival — all prices up!', effect: { priceMultiplier: 1.5, duration: 600000 } },
  { id: ' glut', name: 'Market Glut', desc: 'Oversupply crashed prices!', effect: { priceMultiplier: 0.5, duration: 300000 } },
  { id: 'merchant_arrival', name: 'Exotic Merchant', desc: 'A merchant from afar pays premium for rare fish.', effect: { rarity: 'Rare', priceMultiplier: 2.5, duration: 300000 } },
  { id: 'storm_damage', name: 'Port Storm Damage', desc: 'Storms damaged supplies — fish prices rise!', effect: { priceMultiplier: 1.8, duration: 200000 } },
];

export class NPCCustomer {
  constructor(options = {}) {
    this.name = options.name ?? this._randomName();
    this.preferences = options.preferences ?? []; // species they like
    this.budget = options.budget ?? 10 + Math.floor(Math.random() * 50);
    this.patience = options.patience ?? 3; // attempts before leaving
    this.personality = options.personality ?? (['haggler', 'generous', 'picky', 'regular'])[Math.floor(Math.random() * 4)];
    this.attempts = 0;
  }

  _randomName() {
    const names = ['Grian', 'Pearl', 'Mumbo', 'Scar', 'Etho', 'BdoubleO', 'Xisuma', 'Doc', 'Ren', 'Impulse'];
    return names[Math.floor(Math.random() * names.length)];
  }

  /** Will they buy this fish? */
  willBuy(speciesId, price) {
    if (price > this.budget) return false;
    if (this.preferences.length > 0 && !this.preferences.includes(speciesId)) return false;
    this.attempts++;
    if (this.attempts > this.patience) return false;

    const chance = this.personality === 'generous' ? 0.9 :
                   this.personality === 'haggler' ? 0.5 :
                   this.personality === 'picky' ? 0.3 : 0.7;
    return Math.random() < chance;
  }

  /** Get offer price (hagglers pay less). */
  getOfferPrice(basePrice) {
    if (this.personality === 'haggler') return Math.round(basePrice * 0.7 * 100) / 100;
    if (this.personality === 'generous') return Math.round(basePrice * 1.2 * 100) / 100;
    return basePrice;
  }
}

export class Market {
  constructor(options = {}) {
    this.supply = new Map(); // speciesId → quantity sold recently
    this.demand = new Map(); // speciesId → base demand score
    this.priceHistory = new Map(); // speciesId → [price over time]
    this.activeEvents = new Map();
    this.npcCustomers = [];
    this.basePrices = options.basePrices ?? new Map(); // speciesId → base price

    // Shop mechanic (Moonlighter-style)
    this.shopInventory = []; // fish available for sale at player's stand
    this.shopPrices = new Map(); // speciesId → player-set price
    this.shopReputation = options.shopReputation ?? 50; // 0-100

    // Timing
    this.lastEventCheck = Date.now();
    this.eventCheckInterval = 120000; // 2 minutes between event checks
    this.supplyWindow = options.supplyWindow ?? 600000; // 10 min supply tracking window

    // Supply tracking for price decay
    this.supplyLog = []; // { speciesId, timestamp }
  }

  /** Set base price for a species. */
  setBasePrice(speciesId, price) {
    this.basePrices.set(speciesId, price);
  }

  /** Get demand info for a species. */
  getDemand(speciesId) {
    const supply = this._recentSupply(speciesId);
    const basePrice = this.basePrices.get(speciesId) ?? 10;
    const eventMult = this._getEventMultiplier(speciesId);

    const demandScore = Math.max(0.2, 1 / (1 + supply * 0.05));
    const price = Math.round(basePrice * demandScore * eventMult * 100) / 100;

    // Trend
    const history = this.priceHistory.get(speciesId) ?? [];
    let trend = 'stable';
    if (history.length >= 3) {
      const recent = history.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const older = history.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
      if (recent > older * 1.15) trend = 'rising';
      else if (recent < older * 0.85) trend = 'falling';
    }

    let reason = 'normal';
    if (supply > 20) reason = 'oversupply';
    else if (eventMult > 1.3) reason = 'event_boost';
    else if (demandScore > 1.5) reason = 'high_demand';

    return { price, trend, reason, demandScore: Math.round(demandScore * 100) / 100, supply, eventMultiplier: eventMult };
  }

  /** Record a sale (increases supply, affects price). */
  recordSale(speciesId, quantity = 1) {
    const now = Date.now();
    for (let i = 0; i < quantity; i++) {
      this.supplyLog.push({ speciesId, timestamp: now });
    }

    // Track price history
    const demand = this.getDemand(speciesId);
    const history = this.priceHistory.get(speciesId) ?? [];
    history.push(demand.price);
    if (history.length > 100) history.shift();
    this.priceHistory.set(speciesId, history);
  }

  /** Sell fish at market (returns gold earned). */
  sellFish(speciesId, quantity = 1) {
    const demand = this.getDemand(speciesId);
    const total = demand.price * quantity;
    this.recordSale(speciesId, quantity);
    return { gold: Math.round(total * 100) / 100, unitPrice: demand.price };
  }

  /** Sell at player's fish stand (Moonlighter mechanic). */
  sellAtStand(speciesId, customerName) {
    const playerPrice = this.shopPrices.get(speciesId) ?? this.basePrices.get(speciesId) ?? 10;
    // Check if NPC will buy
    const npc = this.npcCustomers.find(c => c.name === customerName) ?? new NPCCustomer();
    if (!npc.willBuy(speciesId, playerPrice)) {
      return { sold: false, reason: 'customer_rejected' };
    }
    const offer = npc.getOfferPrice(playerPrice);
    this.shopReputation = Math.min(100, this.shopReputation + 1);
    return { sold: true, gold: offer, customer: customerName };
  }

  /** Set price at fish stand. */
  setStandPrice(speciesId, price) {
    this.shopPrices.set(speciesId, price);
  }

  /** Add fish to shop inventory. */
  addShopInventory(fishData) {
    this.shopInventory.push(fishData);
  }

  /** Clear shop inventory (after selling). */
  clearShopInventory() {
    const items = [...this.shopInventory];
    this.shopInventory = [];
    return items;
  }

  /** Spawn NPC customers (Dave the Diver style). */
  spawnCustomers(count = 3) {
    for (let i = 0; i < count; i++) {
      this.npcCustomers.push(new NPCCustomer());
    }
    // Keep max 20 customers
    if (this.npcCustomers.length > 20) {
      this.npcCustomers = this.npcCustomers.slice(-20);
    }
    return this.npcCustomers.slice(-count);
  }

  /** Check for random market events. */
  checkEvents() {
    if (Date.now() - this.lastEventCheck < this.eventCheckInterval) return [];
    this.lastEventCheck = Date.now();

    const triggered = [];
    for (const event of MARKET_EVENTS) {
      if (Math.random() < 0.1) { // 10% chance per event per check
        this.activeEvents.set(event.id, {
          ...event,
          triggeredAt: Date.now(),
          expiresAt: Date.now() + event.effect.duration,
        });
        triggered.push(event);
      }
    }

    // Expire old events
    for (const [id, event] of this.activeEvents) {
      if (Date.now() > event.expiresAt) this.activeEvents.delete(id);
    }

    return triggered;
  }

  /** Get market forecast (for captain AI). */
  getForecast() {
    const forecasts = [];
    for (const [speciesId] of this.basePrices) {
      const demand = this.getDemand(speciesId);
      const history = this.priceHistory.get(speciesId) ?? [];
      let predicted = demand.price;

      if (history.length >= 5) {
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        const recent = history.slice(-3).reduce((a, b) => a + b, 0) / 3;
        predicted = recent + (recent - avg) * 0.3; // simple trend extrapolation
      }

      forecasts.push({
        species: speciesId,
        current: demand.price,
        predicted: Math.round(predicted * 100) / 100,
        trend: demand.trend,
        confidence: Math.min(1, (this.priceHistory.get(speciesId)?.length ?? 0) / 20),
      });
    }
    return forecasts.sort((a, b) => Math.abs(b.predicted - b.current) - Math.abs(a.predicted - a.current));
  }

  _recentSupply(speciesId) {
    const cutoff = Date.now() - this.supplyWindow;
    return this.supplyLog.filter(s => s.speciesId === speciesId && s.timestamp > cutoff).length;
  }

  _getEventMultiplier(speciesId) {
    let mult = 1.0;
    for (const event of this.activeEvents.values()) {
      const effect = event.effect;
      if (effect.species && effect.species !== speciesId) continue;
      if (effect.rarity) continue; // handled differently
      mult *= effect.priceMultiplier ?? 1;
    }
    return mult;
  }

  /** Get market summary. */
  getSummary() {
    return {
      activeEvents: [...this.activeEvents.values()],
      totalSpeciesTracked: this.basePrices.size,
      npcCustomers: this.npcCustomers.length,
      shopReputation: this.shopReputation,
      shopInventory: this.shopInventory.length,
    };
  }
}

export default Market;
