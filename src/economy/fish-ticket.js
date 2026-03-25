// CraftMind Fishing — Fish Ticket System
// Every Alaska commercial fisherman fills out a "fish ticket" — a legal record
// of what they caught, where, when, and who they sold to. This is REAL.

export class FishTicket {
  /**
   * @param {object} data
   * @param {string} data.fisherman
   * @param {string} data.vessel
   * @param {string} [data.date]
   * @param {string} data.area
   * @param {string} data.species
   * @param {number} data.pounds
   * @param {number} data.price_per_lb
   * @param {string} data.buyer
   * @param {string} data.gear_type
   * @param {string} data.permit_number
   * @param {string} [data.quality] - premium | standard | damaged
   * @param {string} [data.freshness] - fresh | iced | frozen
   */
  constructor(data) {
    this.id = FishTicket.generateId();
    this.fisherman = data.fisherman ?? 'Unknown';
    this.vessel = data.vessel ?? 'Unknown';
    this.date = data.date ?? new Date().toISOString().slice(0, 10);
    this.area = data.area ?? 'Sitka Sound';
    this.species = data.species;
    this.pounds = data.pounds ?? 0;
    this.price_per_lb = data.price_per_lb ?? 0;
    this.buyer = data.buyer ?? 'Unknown';
    this.gear_type = data.gear_type ?? 'unknown';
    this.permit_number = data.permit_number ?? 'N/A';
    this.quality = data.quality ?? 'standard';
    this.freshness = data.freshness ?? 'fresh';
    this.signed = false;
    this.voided = false;
    this.total_value = 0;
  }

  /** Sign the ticket — makes it a legal record. */
  sign() {
    if (this.voided) throw new Error('Cannot sign a voided ticket.');
    this.signed = true;
    this.total_value = Math.round(this.pounds * this.price_per_lb * 100) / 100;
    return this;
  }

  /** Void the ticket (e.g., fish spoiled, misidentified species). */
  void(reason) {
    this.voided = true;
    this.void_reason = reason;
    this.total_value = 0;
    return this;
  }

  /** Check for potential fraud (reporting errors). */
  audit() {
    const issues = [];
    if (!this.signed && !this.voided) issues.push('Unsigned ticket');
    if (this.pounds <= 0) issues.push('Zero or negative weight');
    if (this.price_per_lb <= 0) issues.push('Zero or negative price');
    if (!this.permit_number || this.permit_number === 'N/A') issues.push('No permit number');
    if (!this.buyer || this.buyer === 'Unknown') issues.push('No buyer specified');
    if (!this.area) issues.push('No fishing area specified');
    return {
      valid: issues.length === 0,
      issues,
      risk: issues.length === 0 ? 'none' : issues.length <= 1 ? 'low' : issues.length <= 3 ? 'medium' : 'high',
    };
  }

  /** Serialize */
  toJSON() {
    return { ...this };
  }

  /** Generate a ticket ID */
  static generateId() {
    const prefix = 'FT';
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
  }
}

/**
 * FishTicketLedger — tracks all tickets, provides statistics.
 */
export class FishTicketLedger {
  constructor() {
    this.tickets = [];
    this.voidedCount = 0;
  }

  /** Record a new ticket. Creates and signs it. */
  record(data) {
    const ticket = new FishTicket(data);
    ticket.sign();
    this.tickets.push(ticket);
    return ticket;
  }

  /** Void a ticket by ID. */
  voidTicket(ticketId, reason) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return false;
    ticket.void(reason);
    this.voidedCount++;
    return true;
  }

  /** Get tickets for a date range. */
  getByDateRange(start, end) {
    return this.tickets.filter(t => t.date >= start && t.date <= end && !t.voided);
  }

  /** Get tickets for a species. */
  getBySpecies(species) {
    return this.tickets.filter(t => t.species === species && !t.voided);
  }

  /** Get tickets for a buyer. */
  getByBuyer(buyer) {
    return this.tickets.filter(t => t.buyer === buyer && !t.voided);
  }

  /** Summary statistics (feeds into market simulation & CFEC data). */
  getSummary() {
    const active = this.tickets.filter(t => !t.voided);
    const speciesTotals = {};
    let totalLbs = 0;
    let totalValue = 0;

    for (const t of active) {
      totalLbs += t.pounds;
      totalValue += t.total_value;
      if (!speciesTotals[t.species]) {
        speciesTotals[t.species] = { pounds: 0, value: 0, count: 0 };
      }
      speciesTotals[t.species].pounds += t.pounds;
      speciesTotals[t.species].value += t.total_value;
      speciesTotals[t.species].count++;
    }

    return {
      totalTickets: active.length,
      voidedTickets: this.voidedCount,
      totalPounds: Math.round(totalLbs),
      totalValue: Math.round(totalValue * 100) / 100,
      averagePricePerLb: totalLbs > 0 ? Math.round((totalValue / totalLbs) * 100) / 100 : 0,
      speciesTotals,
      topBuyers: this._topBuyers(active),
    };
  }

  /** Find the best buyer (highest total purchases). */
  _topBuyers(tickets) {
    const buyerTotals = {};
    for (const t of tickets) {
      if (!buyerTotals[t.buyer]) buyerTotals[t.buyer] = 0;
      buyerTotals[t.buyer] += t.total_value;
    }
    return Object.entries(buyerTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, totalValue: Math.round(value * 100) / 100 }));
  }

  /** Serialize */
  toJSON() {
    return { tickets: this.tickets, voidedCount: this.voidedCount };
  }

  /** Deserialize */
  static fromJSON(data) {
    const ledger = new FishTicketLedger();
    if (data) {
      ledger.tickets = (data.tickets ?? []).map(d => Object.assign(new FishTicket(d), d));
      ledger.voidedCount = data.voidedCount ?? 0;
    }
    return ledger;
  }
}

export default FishTicket;
