// CraftMind Fishing — Alaska Fishing Regulations
// Based on real ADF&G Sport Fishing Regulations for Southeast Alaska.
// Emergency orders and in-season changes are part of the gameplay.

// ═══════════════════════════════════════════════════════════════════
// Sport Fishing Regulations
// ═══════════════════════════════════════════════════════════════════

export const SPORT_REGS = {
  halibut: {
    dailyBag: 2,
    possessionLimit: 4,
    sizeLimit: { min: 32 },      // one fish 32" or under, one fish 50" or over (reverse slot)
    reverseSlot: true,
    slotDescription: 'May retain one fish ≤32" OR one fish ≥50" (not both on charter)',
    season: 'Feb 1 – Dec 31',
    charterRules: 'One fish per person per day, one trip per day',
    managingBody: 'IPHC (International Pacific Halibut Commission)',
    notes: 'Regulations change yearly. IPHC manages halibut allocation between US and Canada.',
  },
  king_salmon: {
    dailyBag: 1,
    possessionLimit: 2,
    sizeLimit: { min: 28 },
    season: 'Varies by area and year — emergency orders common',
    nonresidentRetention: 'Varies — often 1 per year in SE Alaska',
    managingBody: 'ADF&G',
    notes: 'King salmon regulations change FREQUENTLY. ADF&G issues emergency orders based on run strength. Game simulates this.',
  },
  coho_salmon: {
    dailyBag: 6,
    possessionLimit: 12,
    sizeLimit: null,
    season: 'June – October',
    notes: 'Generous limits. The sport fishery favorite. Most fun salmon to catch.',
  },
  sockeye_salmon: {
    dailyBag: 6,
    possessionLimit: 12,
    sizeLimit: null,
    season: 'June – September (varies by system)',
    notes: 'Best eating salmon. Stocked lake systems may have different rules.',
  },
  pink_salmon: {
    dailyBag: 6,
    possessionLimit: 12,
    sizeLimit: null,
    season: 'July – September',
    notes: 'Odd years have massive runs in Southeast Alaska. No limit worries.',
  },
  chum_salmon: {
    dailyBag: 6,
    possessionLimit: 12,
    sizeLimit: null,
    season: 'July – October',
    notes: 'Often caught incidentally while targeting other salmon.',
  },
  lingcod: {
    dailyBag: 1,
    possessionLimit: 2,
    sizeLimit: { min: 35 },
    season: 'May 16 – Jun 15 (retention), catch-and-release rest of year',
    notes: 'SHORT retention season! Most of the year is catch-and-release only.',
  },
  rockfish: {
    dailyBag: 5,
    possessionLimit: 10,
    sizeLimit: null,
    yelloweye_limit: 1,
    non_pelagic_limit: 4,
    deepWaterReleaseRequired: true,
    notes: 'Pelagic (black, dusky) = higher limit. Non-pelagic (yelloweye, quillback) = lower. Deep water release device required from 60ft+.',
  },
  dungeness_crab: {
    dailyBag: 10,
    possessionLimit: 0, // no possession limit, daily bag applies
    sizeLimit: { min: 6.5 },       // inches across back, carapace width
    sexRestriction: 'Males only',
    softshellRelease: true,
    season: 'Year-round in SE Alaska, peak June–September',
    notes: 'Males only, 6.5" minimum. Release softshell crabs. No females with eggs.',
  },
  shrimp: {
    dailyBag: '5 gallons whole (shell-on)',
    pot_limit: 5,
    season: 'Year-round',
    notes: 'Spot prawns are the prize. Coonstripe and sidestripe also common.',
  },
  clam: {
    dailyBag: 'Varies by beach and species',
    sizeLimit: null,
    notes: 'Check ADF&G beach status for PSP (paralytic shellfish poisoning) closures before harvesting.',
  },
};

// ═══════════════════════════════════════════════════════════════════
// Commercial Regulations
// ═══════════════════════════════════════════════════════════════════

export const COMMERCIAL_REGS = {
  salmon_purse_seine: {
    permitRequired: 'Limited Entry Seine Permit',
    permitHolders: 450,
    areaRestrictions: 'Specific registration areas and sections',
    seasonLength: 'Varies — ADF&G announcements via radio',
    gearRestrictions: 'Max 900 fathom lead, 150 fathom depth',
    escapeRequirement: 'Crown web must be 4" or larger (let small fish escape)',
    notes: '"The seine is OPEN in Section 11!" — boats scramble. Openings announced by ADF&G via VHF radio.',
  },
  salmon_troll: {
    permitRequired: 'Limited Entry Troll Permit',
    permitHolders: 1000,
    season: 'May – September',
    notes: 'Many Sitka fishermen are trollers. Often solo operation. Boat-dependent.',
  },
  halibut: {
    permitRequired: 'IFQ (Individual Fishing Quota)',
    quotaSystem: true,
    quotaBasedOn: 'Historical catch history (from 1975-1990 qualifying years)',
    notes: 'IFQ system implemented 1995. Eliminated dangerous "derby" fishing. Can lease quota.',
  },
  sablefish: {
    permitRequired: 'IFQ (Individual Fishing Quota)',
    quotaSystem: true,
    notes: 'Often fished alongside halibut on the same longline gear. The "money fish."',
  },
  dungeness: {
    permitRequired: 'Vessel permit required',
    notes: 'Winter fishery. Cold, hard work. Many fishermen combine with summer salmon.',
  },
  king_crab_bering_sea: {
    permitRequired: 'CR license (Crab Rationalization)',
    permitHolders: 80,
    notes: 'THE Deadliest Catch fishery. Extreme danger, extreme reward. Only ~80 boats.',
  },
};

// ═══════════════════════════════════════════════════════════════════
// Emergency Order System
// ═══════════════════════════════════════════════════════════════════

export const EMERGENCY_ORDER_TYPES = {
  closure: {
    label: 'Fishery Closure',
    severity: 'high',
    radioPrefix: 'ATTENTION ALL FISHERMEN',
    template: 'Effective immediately, the {species} fishery in {area} is CLOSED due to {reason}. All {species} must be released.',
  },
  restriction: {
    label: 'Harvest Restriction',
    severity: 'medium',
    radioPrefix: 'ADF&G ADVISORY',
    template: 'Effective {date}, {species} retention in {area} is restricted to {details}. This emergency order remains in effect until further notice.',
  },
  opening: {
    label: 'Fishery Opening',
    severity: 'low',
    radioPrefix: 'SEINE OPENING ANNOUNCEMENT',
    template: 'The {gear} fishery is NOW OPEN in Section {section}. Good luck and be safe.',
  },
  beach_closure: {
    label: 'Beach Closure (PSP)',
    severity: 'high',
    radioPrefix: 'SHELLFISH SAFETY ADVISORY',
    template: 'All shellfish harvesting is CLOSED on {beach} due to elevated paralytic shellfish poisoning (PSP) levels. Do NOT harvest or consume shellfish from this area.',
  },
};

/**
 * EmergencyOrder — represents an ADF&G in-season management action.
 */
export class EmergencyOrder {
  constructor({ type, species, area, reason, date, issuedBy = 'ADF&G' }) {
    const typeDef = EMERGENCY_ORDER_TYPES[type];
    if (!typeDef) throw new Error(`Unknown emergency order type: ${type}`);

    this.id = `EO-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    this.type = type;
    this.label = typeDef.label;
    this.severity = typeDef.severity;
    this.radioPrefix = typeDef.radioPrefix;
    this.species = species;
    this.area = area ?? 'Sitka Sound';
    this.reason = reason ?? 'weak run forecast';
    this.issuedBy = issuedBy;
    this.issuedAt = date ?? new Date().toISOString();
    this.active = true;
  }

  /** Generate the radio broadcast text. */
  getRadioBroadcast() {
    const template = EMERGENCY_ORDER_TYPES[this.type].template;
    return `${this.radioPrefix}. ${template}`
      .replace('{species}', this.species)
      .replace('{area}', this.area)
      .replace('{reason}', this.reason)
      .replace('{date}', this.issuedAt.slice(0, 10))
      .replace('{gear}', this.species)
      .replace('{section}', Math.floor(Math.random() * 20) + 1);
  }

  /** Short description for the UI. */
  getSummary() {
    return `${this.label}: ${this.species} in ${this.area} — ${this.reason}`;
  }

  toJSON() {
    return {
      id: this.id, type: this.type, label: this.label,
      species: this.species, area: this.area, reason: this.reason,
      severity: this.severity, active: this.active,
      issuedAt: this.issuedAt, issuedBy: this.issuedBy,
    };
  }
}

/**
 * Get regulations for a species.
 */
export function getRegulations(speciesId) {
  return SPORT_REGS[speciesId] ?? null;
}

/**
 * Check if a harvest is legal.
 * Returns { legal, violations[] }.
 */
export function checkHarvest({ speciesId, size, count, season }) {
  const regs = SPORT_REGS[speciesId];
  if (!regs) return { legal: true, violations: [] };

  const violations = [];

  // Size check
  if (regs.sizeLimit?.min && size < regs.sizeLimit.min) {
    violations.push({
      type: 'undersized',
      severity: 'high',
      message: `${speciesId} is ${size} inches. Minimum size is ${regs.sizeLimit.min} inches.`,
      fine: 150 + Math.floor(Math.random() * 200),
    });
  }

  // Bag limit check
  if (typeof regs.dailyBag === 'number' && count > regs.dailyBag) {
    violations.push({
      type: 'over_limit',
      severity: 'high',
      message: `You have ${count} ${speciesId}. Daily bag limit is ${regs.dailyBag}.`,
      fine: 100 * (count - regs.dailyBag),
    });
  }

  return { legal: violations.length === 0, violations };
}

export default { SPORT_REGS, COMMERCIAL_REGS, EmergencyOrder, EMERGENCY_ORDER_TYPES, getRegulations, checkHarvest };
