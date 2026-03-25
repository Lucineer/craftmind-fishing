// CraftMind Fishing — Financial Tracking
// Real Alaska commercial fishing business management.

export const EXPENSE_CATEGORIES = {
  fuel: { name: 'Fuel', emoji: '⛽' },
  gear: { name: 'Gear & Equipment', emoji: '🪝' },
  bait: { name: 'Bait', emoji: '🪱' },
  ice: { name: 'Ice', emoji: '🧊' },
  permits: { name: 'Permits & Leases', emoji: '📋' },
  boat_maintenance: { name: 'Boat Maintenance', emoji: '🔧' },
  dock_fees: { name: 'Dock Fees', emoji: '⚓' },
  insurance: { name: 'Insurance', emoji: '🛡️' },
  provisions: { name: 'Food & Supplies', emoji: '🍔' },
  crew_wages: { name: 'Crew Wages', emoji: '👥' },
  repairs: { name: 'Repairs', emoji: '🔨' },
  fines: { name: 'Fines', emoji: '⚠️' },
  loan_payment: { name: 'Loan Payment', emoji: '🏦' },
  miscellaneous: { name: 'Miscellaneous', emoji: '📦' },
};

/** Random financial events that can happen to a fisherman. */
export const FINANCIAL_EVENTS = [
  { id: 'engine_blow', name: 'Engine Failure', description: 'Engine blew up mid-trip.', cost: 15000, category: 'repairs', weight: 3 },
  { id: 'great_price', name: 'Premium Price', description: 'Got a great price at the dock!', cost: -3000, category: 'miscellaneous', weight: 8 },
  { id: 'spoilage', name: 'Fish Spoilage', description: 'Ice machine broke — fish lost.', cost: 5000, category: 'miscellaneous', weight: 4 },
  { id: 'over_limit_fine', name: 'Over-Limit Fine', description: 'Fish & Game citation for over-limit.', cost: 2500, category: 'fines', weight: 2 },
  { id: 'insurance_payout', name: 'Insurance Payout', description: 'Storm damage claim paid out.', cost: -8000, category: 'insurance', weight: 2 },
  { id: 'net_tear', name: 'Net Damage', description: 'Torn net needs repair.', cost: 2000, category: 'repairs', weight: 5 },
  { id: 'fuel_spike', name: 'Fuel Price Spike', description: 'Marina fuel prices jumped.', cost: 1500, category: 'fuel', weight: 4 },
  { id: 'found_gear', name: 'Found Gear', description: 'Found usable gear floating — saved money!', cost: -500, category: 'gear', weight: 3 },
  { id: 'prop_damage', name: 'Propeller Damage', description: 'Hit a log. Prop needs work.', cost: 4000, category: 'repairs', weight: 2 },
  { id: 'bad_weather_days', name: 'Weather Days', description: 'Lost 3 days to weather — still paying dock fees.', cost: 300, category: 'dock_fees', weight: 6 },
];

export class FinancialTracker {
  constructor() {
    this.catchLog = [];       // { species, lbs, price_per_lb, total, date, location, method }
    this.expenses = [];       // { category, amount, description, date }
    this.income = [];         // { amount, source, date, fishTicketId? }
    this.loans = [];          // { principal, remaining, interest_rate, payment, lender }
    this.seasonStart = null;
  }

  /** Record a catch and its sale. */
  recordCatch(data) {
    const entry = {
      species: data.species,
      lbs: data.lbs,
      price_per_lb: data.price_per_lb,
      total: Math.round(data.lbs * data.price_per_lb * 100) / 100,
      date: data.date ?? new Date().toISOString().slice(0, 10),
      location: data.location ?? 'Sitka Sound',
      method: data.method ?? 'unknown',
      fishTicketId: data.fishTicketId ?? null,
    };
    this.catchLog.push(entry);
    this.income.push({ amount: entry.total, source: `catch:${data.species}`, date: entry.date, fishTicketId: data.fishTicketId });
    return entry;
  }

  /** Record an expense. */
  recordExpense(category, amount, description) {
    if (!EXPENSE_CATEGORIES[category]) throw new Error(`Unknown expense category: ${category}`);
    const entry = {
      category,
      amount,
      description,
      date: new Date().toISOString().slice(0, 10),
    };
    this.expenses.push(entry);
    return entry;
  }

  /** Record other income. */
  recordIncome(amount, source) {
    const entry = { amount, source, date: new Date().toISOString().slice(0, 10) };
    this.income.push(entry);
    return entry;
  }

  /** Take out a bank loan. */
  takeLoan(principal, interestRate = 0.08, paymentTerm = 12) {
    const monthlyPayment = Math.round((principal * (1 + interestRate)) / paymentTerm);
    const loan = {
      principal,
      remaining: principal,
      interest_rate: interestRate,
      monthlyPayment,
      paymentTerm,
      lender: 'First National Bank of Sitka',
      startDate: new Date().toISOString().slice(0, 10),
    };
    this.loans.push(loan);
    this.recordIncome(loan.principal, 'loan');
    return loan;
  }

  /** Make a loan payment. */
  makeLoanPayment() {
    const active = this.loans.filter(l => l.remaining > 0);
    if (active.length === 0) return null;
    let totalPaid = 0;
    for (const loan of active) {
      const payment = Math.min(loan.monthlyPayment, loan.remaining);
      loan.remaining -= payment;
      totalPaid += payment;
      this.recordExpense('loan_payment', payment, `Loan payment to ${loan.lender}`);
    }
    return totalPaid;
  }

  /** Roll a random financial event. */
  rollFinancialEvent() {
    const totalWeight = FINANCIAL_EVENTS.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const event of FINANCIAL_EVENTS) {
      roll -= event.weight;
      if (roll <= 0) {
        // cost > 0 = expense, cost < 0 = windfall
        if (event.cost > 0) {
          this.recordExpense(event.category, event.cost, event.description);
        } else {
          this.recordIncome(Math.abs(event.cost), `event:${event.id}`);
        }
        return event;
      }
    }
    return null;
  }

  /** Get a season report. */
  getSeasonReport() {
    const grossIncome = this.income.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = this.expenses.reduce((s, e) => s + e.amount, 0);
    const netIncome = grossIncome - totalExpenses;
    const tax = Math.max(0, Math.round(netIncome * 0.20)); // rough 20% tax

    // Alaska fishermen get some breaks — deduct boat depreciation, fuel tax credit
    const taxBreaks = Math.round(grossIncome * 0.05); // ~5% deductions
    const adjustedTax = Math.max(0, tax - taxBreaks);

    const expenseBreakdown = {};
    for (const e of this.expenses) {
      if (!expenseBreakdown[e.category]) expenseBreakdown[e.category] = 0;
      expenseBreakdown[e.category] += e.amount;
    }

    const speciesBreakdown = {};
    for (const c of this.catchLog) {
      if (!speciesBreakdown[c.species]) speciesBreakdown[c.species] = { lbs: 0, value: 0, count: 0 };
      speciesBreakdown[c.species].lbs += c.lbs;
      speciesBreakdown[c.species].value += c.total;
      speciesBreakdown[c.species].count++;
    }

    return {
      gross: Math.round(grossIncome * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      net: Math.round(netIncome * 100) / 100,
      tax: adjustedTax,
      taxBreaks,
      takeHome: Math.round((netIncome - adjustedTax) * 100) / 100,
      totalCatchLbs: this.catchLog.reduce((s, c) => s + c.lbs, 0),
      totalCatchCount: this.catchLog.length,
      expenseBreakdown,
      speciesBreakdown,
      activeLoans: this.loans.filter(l => l.remaining > 0).map(l => ({ remaining: Math.round(l.remaining), monthlyPayment: l.monthlyPayment })),
    };
  }

  /** Get a quick balance snapshot. */
  getBalance() {
    const income = this.income.reduce((s, i) => s + i.amount, 0);
    const expenses = this.expenses.reduce((s, e) => s + e.amount, 0);
    return {
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      balance: Math.round((income - expenses) * 100) / 100,
    };
  }

  /** Serialize */
  toJSON() {
    return { catchLog: this.catchLog, expenses: this.expenses, income: this.income, loans: this.loans };
  }

  /** Deserialize */
  static fromJSON(data) {
    const tracker = new FinancialTracker();
    if (data) {
      tracker.catchLog = data.catchLog ?? [];
      tracker.expenses = data.expenses ?? [];
      tracker.income = data.income ?? [];
      tracker.loans = data.loans ?? [];
    }
    return tracker;
  }
}

export default FinancialTracker;
