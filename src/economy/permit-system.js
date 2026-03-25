// CraftMind Fishing — Alaska Commercial Permit System
// Permits have REAL value. An Alaska salmon permit can be worth $250k+.

import { cfecData } from './cfec-data.js';

/** Permit type definitions */
export const PERMIT_TYPES = {
  sport_license: {
    id: 'sport_license',
    name: 'Sport Fishing License',
    cost: 25,
    annual_renewal: 25,
    description: 'Basic Alaska sport fishing license. Personal use limits only.',
    gear_unlocked: ['light_spin_rod', 'handline'],
    catch_limit: 'Sport limits apply (varies by species).',
    notes: 'Everyone starts here. You can catch fish for personal use but not sell commercially.',
  },
  salmon_troll: {
    id: 'salmon_troll',
    name: 'Salmon Troll Permit',
    cost: 100000,
    annual_renewal: 0, // it's a one-time purchase
    description: 'Limited entry salmon troll permit. Lets you sell troll-caught salmon commercially.',
    gear_unlocked: ['trolling_rod', 'downrigger', 'flasher', 'hoochie'],
    required_fishery: 'salmon_troll',
    catch_limit: 'No catch limit (seasonal).',
    notes: 'Many Sitka fishermen are trollers. Solo operation possible. Permit values fluctuate.',
  },
  salmon_seine: {
    id: 'salmon_seine',
    name: 'Salmon Purse Seine Permit',
    cost: 250000,
    annual_renewal: 0,
    description: 'Limited entry seine permit. The backbone of SE Alaska commercial fishing.',
    gear_unlocked: ['purse_seine_net'],
    required_fishery: 'salmon_purse_seine',
    crew_min: 4,
    catch_limit: 'No catch limit (seasonal).',
    notes: 'Very valuable. Requires a crew and a proper seine boat. High earnings potential.',
  },
  salmon_gillnet: {
    id: 'salmon_gillnet',
    name: 'Salmon Gillnet Permit',
    cost: 150000,
    annual_renewal: 0,
    description: 'Limited entry gillnet permit for set net operations.',
    gear_unlocked: ['gillnet'],
    required_fishery: 'salmon_gillnet',
    catch_limit: 'No catch limit (seasonal).',
    notes: 'Set net operations. More common in other parts of Alaska than Sitka.',
  },
  halibut_ifq: {
    id: 'halibut_ifq',
    name: 'Halibut IFQ',
    cost: 300000,
    annual_renewal: 0,
    description: 'Individual Fishing Quota — you own a specific poundage per year. Can lease quota.',
    gear_unlocked: ['longline'],
    required_fishery: 'halibut_longline',
    catch_limit: 'IFQ poundage (e.g., 15,000 lbs/year).',
    leaseable: true,
    lease_cost_percent: 0.30, // 30% of permit value per year to lease
    notes: 'IFQ system. Can buy or lease. Very valuable — $300k+ for a good block.',
  },
  sablefish_ifq: {
    id: 'sablefish_ifq',
    name: 'Sablefish (Blackcod) IFQ',
    cost: 350000,
    annual_renewal: 0,
    description: 'Sablefish IFQ — MORE valuable per pound than halibut. Japanese market demand.',
    gear_unlocked: ['longline'],
    required_fishery: 'sablefish_longline',
    catch_limit: 'IFQ poundage (e.g., 10,000 lbs/year).',
    leaseable: true,
    lease_cost_percent: 0.35,
    notes: 'The "money fish." Often fished alongside halibut on the same longline gear.',
  },
  dungeness_crab: {
    id: 'dungeness_crab',
    name: 'Dungeness Crab Permit',
    cost: 30000,
    annual_renewal: 500,
    description: 'Seasonal crab permit. Winter fishery. Lower barrier to entry.',
    gear_unlocked: ['crab_pot'],
    required_fishery: 'dungeness_crab',
    catch_limit: 'Size limit 6.5" across back. Sex limit (males only).',
    notes: 'Affordable entry into commercial fishing. Many fishermen crab in winter, salmon in summer.',
  },
  king_crab: {
    id: 'king_crab',
    name: 'Bering Sea King Crab Permit',
    cost: 2000000,
    annual_renewal: 0,
    description: 'THE big one. Only ~80 boats. Extreme danger, extreme reward.',
    gear_unlocked: ['king_crab_pot'],
    required_fishery: 'king_crab_bering_sea',
    crew_min: 4,
    catch_limit: 'IFQ poundage.',
    notes: 'Two million dollars. The Deadliest Catch fishery. Not for beginners.',
  },
  dive_permit: {
    id: 'dive_permit',
    name: 'Commercial Dive Permit',
    cost: 50000,
    annual_renewal: 500,
    description: 'For sea cucumber, geoduck, weathervane scallop harvest.',
    gear_unlocked: ['wetsuit_5mm', 'dive_bag'],
    required_fishery: 'dive_fishery',
    catch_limit: 'Species-specific daily/seasonal limits.',
    notes: 'Good money per pound but physical, cold, dangerous work.',
  },
};

export class PermitSystem {
  constructor(player = {}) {
    this.player = player;
    // owned permits: permitId -> { acquired: Date, source: 'purchase'|'lease'|'quest', cost: number, quota: number }
    this.permits = new Map();
    // IFQ quota tracking: permitId -> { total, caught }
    this.quota = new Map();
  }

  /** Get all permit types */
  static getTypes() { return PERMIT_TYPES; }

  /** Get a permit type definition */
  static getType(id) { return PERMIT_TYPES[id] ?? null; }

  /** Check if player has a permit */
  has(permitId) {
    return this.permits.has(permitId);
  }

  /** Get player's permits */
  list() {
    const result = [];
    for (const [id, info] of this.permits) {
      const type = PERMIT_TYPES[id];
      if (!type) continue;
      result.push({
        ...type,
        acquired: info.acquired,
        source: info.source,
        cost: info.cost,
        quotaRemaining: this.quota.get(id) ? this.quota.get(id).total - this.quota.get(id).caught : null,
      });
    }
    return result;
  }

  /** Acquire a permit */
  acquire(permitId, options = {}) {
    const type = PERMIT_TYPES[permitId];
    if (!type) throw new Error(`Unknown permit: ${permitId}`);
    if (this.permits.has(permitId)) throw new Error(`Already have ${type.name}.`);

    const source = options.source ?? 'purchase';
    const cost = options.cost ?? type.cost;

    if (source === 'purchase' && this.player.balance != null) {
      if (this.player.balance < cost) throw new Error(`Need $${cost.toLocaleString()} for ${type.name}. You have $${this.player.balance.toLocaleString()}.`);
      this.player.balance -= cost;
    }

    this.permits.set(permitId, { acquired: new Date(), source, cost });

    // Set up IFQ quota
    if (type.leaseable || permitId.includes('ifq')) {
      const lbs = options.quota ?? (permitId === 'halibut_ifq' ? 15000 : 10000);
      this.quota.set(permitId, { total: lbs, caught: 0 });
    }

    return { permit: permitId, name: type.name, cost, source };
  }

  /** Lease an IFQ permit for the season (cheaper than buying) */
  lease(permitId, quotaLbs) {
    const type = PERMIT_TYPES[permitId];
    if (!type || !type.leaseable) throw new Error(`${permitId} is not leaseable.`);

    const leaseCost = Math.round(type.cost * type.lease_cost_percent);
    if (this.player.balance != null && this.player.balance < leaseCost) {
      throw new Error(`Lease costs $${leaseCost.toLocaleString()}. You have $${this.player.balance.toLocaleString()}.`);
    }
    if (this.player.balance != null) this.player.balance -= leaseCost;

    this.permits.set(permitId, { acquired: new Date(), source: 'lease', cost: leaseCost });
    this.quota.set(permitId, { total: quotaLbs ?? 10000, caught: 0 });

    return { permit: permitId, name: type.name, leaseCost, quota: quotaLbs };
  }

  /** Check quota for an IFQ permit */
  check(permitId) {
    const q = this.quota.get(permitId);
    if (!q) return null;
    return { quota_remaining: q.total - q.caught, quota_total: q.total, lbs_caught: q.caught };
  }

  /** Record catch against IFQ quota */
  recordCatch(permitId, lbs) {
    const q = this.quota.get(permitId);
    if (!q) return { allowed: true, remaining: Infinity };
    const remaining = q.total - q.caught;
    if (lbs > remaining) {
      return { allowed: false, remaining, overage: lbs - remaining };
    }
    q.caught += lbs;
    return { allowed: true, remaining: remaining - lbs };
  }

  /** Reset annual quotas (start of new fishing year) */
  resetAnnualQuotas() {
    for (const [id, q] of this.quota) {
      q.caught = 0;
    }
  }

  /** Get current permit value (fluctuates based on market) */
  getCurrentValue(permitId) {
    const type = PERMIT_TYPES[permitId];
    if (!type || type.id === 'sport_license') return 0;
    // Simulate 10-20% fluctuation
    const mult = 0.9 + Math.random() * 0.2;
    return Math.round(type.cost * mult);
  }

  /** Serialize for save */
  toJSON() {
    return {
      permits: [...this.permits.entries()],
      quota: [...this.quota.entries()],
    };
  }

  /** Load from saved data */
  static fromJSON(data) {
    const sys = new PermitSystem();
    if (data) {
      sys.permits = new Map(data.permits ?? []);
      sys.quota = new Map(data.quota?.map(([k, v]) => [k, v]) ?? []);
    }
    return sys;
  }
}

export default PermitSystem;
