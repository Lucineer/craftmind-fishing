// CraftMind Fishing — CFEC-Inspired Fishery Statistics
// Based on real Commercial Fisheries Entry Commission data patterns for SE Alaska.

/**
 * Fishery statistics modeled after real CFEC data.
 * Values are approximate but reflect actual Alaska fishery economics:
 * permit counts, earnings variability, permit values, seasons.
 */
export const cfecData = {
  fisheries: {
    salmon_purse_seine: {
      name: 'Salmon Purse Seine',
      permit_holders: 450,
      vessels_active: 300,
      avg_annual_earnings: 150000,
      avg_catch_lbs: 200000,
      permit_value: 250000,
      season: 'June-September',
      gear_required: 'purse_seine_net',
      crew_min: 4,
      notes: 'The backbone of SE Alaska commercial fishing. Permit values skyrocketed in 80s-90s.',
    },
    salmon_troll: {
      name: 'Salmon Troll',
      permit_holders: 1000,
      avg_annual_earnings: 40000,
      avg_catch_lbs: 15000,
      permit_value: 100000,
      season: 'May-September',
      gear_required: 'trolling_rod',
      crew_min: 1,
      notes: 'Many Sitka fishermen are trollers. Boat-dependent, often solo operation.',
    },
    salmon_gillnet: {
      name: 'Salmon Gillnet',
      permit_holders: 700,
      avg_annual_earnings: 80000,
      avg_catch_lbs: 80000,
      permit_value: 150000,
      season: 'June-August',
      gear_required: 'gillnet',
      crew_min: 1,
      notes: 'Set net operations. More common in other parts of Alaska than Sitka specifically.',
    },
    halibut_longline: {
      name: 'Halibut Longline',
      permit_holders: 2000,
      avg_annual_earnings: 60000,
      avg_catch_lbs: 30000,
      permit_value: 300000,
      season: 'March-November',
      gear_required: 'longline',
      crew_min: 2,
      notes: 'IFQ system allocates specific poundage to each fisherman. Can lease quota.',
    },
    sablefish_longline: {
      name: 'Sablefish (Blackcod) Longline',
      permit_holders: 1800,
      avg_annual_earnings: 70000,
      avg_catch_lbs: 15000,
      permit_value: 350000,
      season: 'March-November',
      gear_required: 'longline',
      crew_min: 2,
      notes: 'Often fished alongside halibut. The "money fish" for many longliners.',
    },
    dungeness_crab: {
      name: 'Dungeness Crab',
      permit_holders: 800,
      avg_annual_earnings: 25000,
      avg_catch_lbs: 10000,
      permit_value: 30000,
      season: 'December-March (primary)',
      gear_required: 'crab_pot',
      crew_min: 1,
      notes: 'Winter fishery. Hard work, cold weather, but steady money. Many fishermen do crab + salmon.',
    },
    king_crab_bering_sea: {
      name: 'Bering Sea King Crab',
      permit_holders: 80,
      avg_annual_earnings: 200000,
      avg_catch_lbs: 50000,
      permit_value: 2000000,
      season: 'October-January (opilio), September-November (red king)',
      gear_required: 'king_crab_pot',
      crew_min: 4,
      notes: 'The Deadliest Catch fishery. Extreme danger, extreme reward. Only ~80 boats.',
    },
    dive_fishery: {
      name: 'Dive Fishery',
      permit_holders: 200,
      avg_annual_earnings: 35000,
      avg_catch_lbs: 5000,
      permit_value: 50000,
      season: 'April-October',
      gear_required: 'wetsuit_5mm',
      crew_min: 1,
      species: ['sea_cucumber', 'geoduck', 'weathervane_scallop', 'abalone'],
      notes: 'Physical work, cold water, good money per pound. Geoduck is the prize.',
    },
  },
};

/**
 * Get the fishery data for a given fishery ID.
 */
export function getFishery(id) {
  return cfecData.fisheries[id] ?? null;
}

/**
 * Get all fishery IDs.
 */
export function getFisheryIds() {
  return Object.keys(cfecData.fisheries);
}

/**
 * Calculate a simulated earnings range for a fishery.
 * Real earnings are VERY variable — some years $20k, some $500k+.
 * Returns { pessimistic, average, optimistic }.
 */
export function earningsRange(fisheryId) {
  const fishery = cfecData.fisheries[fisheryId];
  if (!fishery) return null;
  return {
    pessimistic: Math.round(fishery.avg_annual_earnings * 0.15),
    average: fishery.avg_annual_earnings,
    optimistic: Math.round(fishery.avg_annual_earnings * 3.5),
  };
}

export default cfecData;
