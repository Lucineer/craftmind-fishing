// CraftMind Fishing — Real Alaska Ex-Vessel Prices
// Based on CFEC/NOAA data (approximate, adapted for gameplay).
// These are dock prices — what the fisherman gets paid per pound.

/**
 * Salmon ex-vessel prices (per pound).
 * Notes reflect real-world Alaska commercial fishing dynamics.
 */
export const salmonPrices = {
  chinook_king: { base: 5.50, range: [3.00, 12.00], category: 'salmon', notes: 'Premium troll-caught = higher price. Seiners get less. Sport fish not sold commercially.' },
  coho_silver: { base: 3.00, range: [1.50, 6.00], category: 'salmon', notes: 'Second most valuable salmon. Good market demand.' },
  sockeye_red: { base: 2.50, range: [1.00, 5.00], category: 'salmon', notes: 'Most commercially valuable by total $$. Huge volume. Bristol Bay gets $5-7/lb, SE Alaska less.' },
  pink_humpy: { base: 0.30, range: [0.10, 0.80], category: 'salmon', notes: 'The bread and butter. Low price per pound but MASSIVE volume. Odd-year runs bigger.' },
  chum_dog: { base: 0.80, range: [0.30, 1.50], category: 'salmon', notes: 'Used for canned, smoked, roe. Roe (eggs) can be worth more than the fish!' },
};

/**
 * Groundfish ex-vessel prices (per pound).
 */
export const groundfishPrices = {
  halibut: { base: 7.00, range: [4.00, 12.00], category: 'groundfish', notes: 'Premium white fish. IFQ system. Larger fish = more $/lb. Fresh > frozen. Heading/gutting = value added.' },
  sablefish_blackcod: { base: 8.00, range: [5.00, 15.00], category: 'groundfish', notes: 'High-value! Especially in Japan. Collar and belly are premium cuts.' },
  pacific_cod: { base: 1.50, range: [0.80, 3.00], category: 'groundfish', notes: 'Mid-tier. Lots goes to fish & chips, surimi. Seasonal — cod jig fishery is a specific season.' },
  lingcod: { base: 4.00, range: [2.50, 7.00], category: 'groundfish', notes: 'Good local market. Sport caught mostly. Commercial is limited.' },
  yelloweye_rockfish: { base: 5.00, range: [3.00, 8.00], category: 'groundfish', notes: 'Deep water, limited quota. "Red snapper" on restaurant menus.' },
  various_rockfish: { base: 2.00, range: [0.50, 4.00], category: 'groundfish', notes: 'Quillback, copper, black rockfish. Mostly bycatch in halibut fishery.' },
};

/**
 * Shellfish ex-vessel prices (per pound unless noted).
 */
export const shellfishPrices = {
  dungeness_crab: { base: 4.00, range: [2.50, 8.00], category: 'shellfish', notes: 'Winter fishery (Dec-March). Price spikes around holidays. Live > processed.' },
  king_crab: { base: 10.00, range: [5.00, 25.00], category: 'shellfish', notes: 'THE big money. Bering Sea red king = highest. Opilio (snow crab) = lower but volume. Weather-dependent supply = price swings.' },
  tanner_crab: { base: 4.50, range: [2.00, 8.00], category: 'shellfish', notes: 'Similar to opilio but different fishery. C. bairdi is the main species.' },
  geoduck: { base: 15.00, range: [8.00, 30.00], category: 'shellfish', notes: 'PER CLAM. Live export to Asia. Divers can make $500-1000/day on a good tide. THE most valuable per-unit shellfish.' },
  sea_cucumber: { base: 3.00, range: [1.50, 6.00], category: 'shellfish', notes: 'Dive fishery. Exported dried to Asia. Easy to harvest but labor-intensive processing.' },
  spot_shrimp: { base: 12.00, range: [8.00, 20.00], category: 'shellfish', notes: 'PER POUND. Spot prawns = premium. Pot-caught. Limited season.' },
  weathervane_scallop: { base: 12.00, range: [8.00, 18.00], category: 'shellfish', notes: 'Dive or dredge caught. Premium. Limited entry fishery.' },
  abalone: { base: 20.00, range: [10.00, 40.00], category: 'shellfish', notes: 'ILLEGAL commercially. Black market only. Easter egg quest item.' },
};

/**
 * Pelagic/tuna ex-vessel prices (per pound).
 */
export const pelagicPrices = {
  albacore_tuna: { base: 5.00, range: [2.50, 10.00], category: 'pelagic', notes: 'Offshore troll fishery. Summer/fall. Sold as loins or canned. Sashimi-grade = premium.' },
  halibut_butterfish: { base: 0.50, range: [0.20, 1.00], category: 'pelagic', notes: 'Small halibut under regulation. Sold as "butterfish" or pet food. Catch-and-release for undersized.' },
  herring: { base: 0.30, range: [0.10, 0.80], category: 'pelagic', notes: 'Sac-roe herring fishery = highest value (eggs sold to Japan). Bait fish otherwise.' },
  squid: { base: 1.00, range: [0.50, 2.50], category: 'pelagic', notes: 'Jig fishery. Sold as bait or human consumption.' },
  bluefin_tuna: { base: 30.00, range: [15.00, 100.00], category: 'pelagic', notes: 'ULTRA-RARE easter egg. Japanese market pays insane $ for quality. Could be $100+/lb for sushi-grade.' },
};

/** All prices merged into one lookup */
export const allPrices = { ...salmonPrices, ...groundfishPrices, ...shellfishPrices, ...pelagicPrices };

/**
 * Price modifiers — multipliers applied to base price based on conditions.
 */
export const priceModifiers = {
  freshness: { fresh: 1.0, iced: 0.85, frozen: 0.60, spoiled: 0.1 },
  quality: { premium: 1.3, standard: 1.0, damaged: 0.7 },
  processing: { whole: 1.0, headed_gutted: 1.2, filleted: 1.5, smoked: 1.8 },
  season: { peak: 1.0, early: 1.1, late: 0.8, off_season: 1.3 }, // off-season = scarce = more valuable
  market_condition: { glut: 0.6, normal: 1.0, shortage: 1.5, boom: 2.0 },
};

/**
 * Season definitions for Alaska fisheries.
 * month: 0=Jan, 5=Jun, etc.
 */
export const fisherySeasons = {
  chinook_king:       { peak: [5, 6, 7], early: [4], late: [8] },
  coho_silver:        { peak: [7, 8, 9], early: [6], late: [10] },
  sockeye_red:        { peak: [6, 7], early: [5], late: [8] },
  pink_humpy:         { peak: [6, 7, 8], early: [5], late: [9] },
  chum_dog:           { peak: [6, 7], early: [5], late: [8] },
  halibut:            { peak: [5, 6, 7, 8], early: [3, 4], late: [9, 10] },
  sablefish_blackcod: { peak: [3, 4, 5, 9, 10], early: [2, 11], late: [6, 8] },
  dungeness_crab:     { peak: [0, 1, 2], early: [11], late: [3] },
  king_crab:          { peak: [9, 10, 11], early: [8], late: [0] },
  geoduck:            { peak: [4, 5, 6, 7, 8], early: [3, 9], late: [10] },
  spot_shrimp:        { peak: [4, 5, 6], early: [3], late: [7] },
};

/**
 * Calculate an ex-vessel price given species, modifiers, and market conditions.
 * @param {string} speciesId
 * @param {object} options - { freshness, quality, processing, seasonMonth, marketCondition }
 * @returns {number} price per pound
 */
export function calcPrice(speciesId, options = {}) {
  const data = allPrices[speciesId];
  if (!data) return 0;

  const freshMult = priceModifiers.freshness[options.freshness] ?? 1.0;
  const qualMult = priceModifiers.quality[options.quality] ?? 1.0;
  const procMult = priceModifiers.processing[options.processing] ?? 1.0;

  let seasonMult = 1.0;
  if (options.seasonMonth != null) {
    const season = fisherySeasons[speciesId];
    if (season) {
      const m = options.seasonMonth;
      if (season.peak?.includes(m)) seasonMult = priceModifiers.season.peak;
      else if (season.early?.includes(m)) seasonMult = priceModifiers.season.early;
      else if (season.late?.includes(m)) seasonMult = priceModifiers.season.late;
      else seasonMult = priceModifiers.season.off_season;
    }
  }

  const marketMult = priceModifiers.market_condition[options.marketCondition] ?? 1.0;

  return Math.round(data.base * freshMult * qualMult * procMult * seasonMult * marketMult * 100) / 100;
}

export default { allPrices, priceModifiers, fisherySeasons, calcPrice };
