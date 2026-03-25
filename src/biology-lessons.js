// CraftMind Fishing — Biology Lessons (Hidden Education)
// Players learn biology by DISCOVERING it, not by reading it.
// System generates "Discovery Cards" when biological phenomena are witnessed.

/**
 * A biology discovery card.
 * @typedef {Object} DiscoveryCard
 * @property {string} id
 * @property {string} title - Short, intriguing title
 * @property {string} phenomenon - The biological principle observed
 * @property {string} observation - What the player saw that triggered this
 * @property {string} insight - The "aha moment" — why this happens in nature
 * @property {string} category - "behavior", "ecology", "evolution", "anatomy", "reproduction"
 * @property {boolean} discovered
 * @property {number} discoveredAt - timestamp
 * @property {string} rarity - common | uncommon | rare | legendary
 */

/**
 * All discoverable biology phenomena.
 */
const BIOLOGY_CARDS = [
  // Schooling behavior
  { id: 'bio_schooling_safety', title: 'Safety in Numbers', phenomenon: 'Fish school because predators target isolated individuals', category: 'behavior', rarity: 'common',
    condition: (ctx) => ctx.loneFishEaten && ctx.schoolFishSurvived,
    observation: 'A lone fish was eaten by a predator while the school swam past safely.',
    insight: 'In nature, schooling reduces each individual\'s chance of being eaten. Predators get confused by many moving targets — it\'s called the "confusion effect."' },

  { id: 'bio_schooling_hydrodynamics', title: 'Slipstream Swimming', phenomenon: 'Fish save energy by swimming in each other\'s wake', category: 'anatomy', rarity: 'uncommon',
    condition: (ctx) => ctx.schoolSpeed > ctx.solitarySpeed * 0.9 && ctx.schoolSize > 10,
    observation: 'A school of fish maintained high speed despite some members being exhausted.',
    insight: 'Just like cyclists in a peloton, fish in a school create vortices that reduce drag for the fish behind them. This can save up to 20% of their energy.' },

  { id: 'bio_schooling_navigation', title: 'Many Eyes Theory', phenomenon: 'Larger groups detect predators faster', category: 'behavior', rarity: 'common',
    condition: (ctx) => ctx.largeSchoolDetectedPredatorBefore && !ctx.smallSchoolDetectedPredatorBefore,
    observation: 'A large school noticed a predator and scattered before a smaller school nearby even reacted.',
    insight: 'With more eyes watching, groups detect threats sooner. Each fish only needs to watch a small arc — the group covers all directions.' },

  // Predator-prey dynamics
  { id: 'bio_predator_weak_target', title: 'The Weak Are Chosen', phenomenon: 'Predators preferentially target weak or slow individuals', category: 'ecology', rarity: 'common',
    condition: (ctx) => ctx.predatorAteInjured && !ctx.predatorAteHealthy,
    observation: 'A predator passed by healthy fish to chase an injured one.',
    insight: 'Predators naturally select the easiest prey — this is "optimal foraging" from the predator\'s perspective. Chasing a healthy fish wastes energy.' },

  { id: 'bio_predator ambush', title: 'Ambush Predator', phenomenon: 'Some predators hide and wait rather than chase', category: 'behavior', rarity: 'uncommon',
    condition: (ctx) => ctx.predatorStayedStill && ctx.predatorCaughtFish,
    observation: 'A predator held perfectly still near the bottom, then struck when prey swam overhead.',
    insight: 'Ambush predators like pike and anglerfish conserve energy by waiting. They\'ve evolved camouflage and patience instead of speed.' },

  // Ecosystem interconnection
  { id: 'bio_food_web', title: 'The Invisible Web', phenomenon: 'Removing one species affects the entire ecosystem', category: 'ecology', rarity: 'rare',
    condition: (ctx) => ctx.speciesWentExtinct && ctx.otherSpeciesChanged,
    observation: 'When one fish species disappeared, the populations of several other species changed dramatically.',
    insight: 'Ecosystems are interconnected webs. Remove a prey species and predators starve. Remove a predator and prey overpopulate, depleting their food. Everything is connected.' },

  { id: 'bio_trophic_cascade', title: 'Trophic Cascade', phenomenon: 'Top predators control the entire ecosystem structure', category: 'ecology', rarity: 'legendary',
    condition: (ctx) => ctx.topPredatorRemoved && ctx.herbivoreIncreased && ctx.plantLifeDecreased,
    observation: 'After the top predator vanished, smaller fish multiplied and ate all the plants.',
    insight: 'A "trophic cascade" is when a change at one trophic level ripples through the entire food chain. Famous example: wolves in Yellowstone changed river patterns by controlling deer populations.' },

  { id: 'bio_keystone_species', title: 'Keystone Species', phenomenon: 'Some species are disproportionately important to ecosystem health', category: 'ecology', rarity: 'rare',
    condition: (ctx) => ctx.singleSpeciesRemoval && ctx.cascadingEffects,
    observation: 'Removing one relatively uncommon species caused the whole ecosystem to change.',
    insight: 'A "keystone species" holds the ecosystem together like the keystone in an arch. Remove it and the whole structure collapses, even though it might be a small part of the community.' },

  // Natural selection
  { id: 'bio_natural_selection_bait', title: 'Adaptive Avoidance', phenomenon: 'Fish evolve to avoid commonly-used fishing techniques', category: 'evolution', rarity: 'uncommon',
    condition: (ctx) => ctx.baitEffectivenessDeclined && ctx.scriptRulesModified,
    observation: 'Fish stopped biting a bait type that used to work perfectly.',
    insight: 'Natural selection favors individuals that avoid threats. Fish that ignore common bait get caught; fish that avoid it survive and pass on their behavior. Within generations, the whole school adapts.' },

  { id: 'bio_color_camouflage', title: 'Natural Camouflage', phenomenon: 'Fish coloration matches their environment', category: 'anatomy', rarity: 'common',
    condition: (ctx) => ctx.deepWaterFishDark && ctx.shallowWaterFishLight,
    observation: 'Fish living near the surface were lighter colored than deep-water fish.',
    insight: 'Countershading is nature\'s invisibility cloak. Dark backs blend with the deep water when seen from above, light bellies blend with the sky when seen from below.' },

  { id: 'bio_speed_vs_endurance', title: 'The Speed Trade-off', phenomenon: 'Fish can\'t be both fast and tireless', category: 'anatomy', rarity: 'uncommon',
    condition: (ctx) => ctx.fastFishTiredQuickly && ctx.slowFishEndured,
    observation: 'A fast fish escaped the predator initially but tired and was caught. A slower fish maintained distance and survived.',
    insight: 'Muscle fibers come in two types: fast-twitch (burst speed, tire quickly) and slow-twitch (endurance, lower speed). Every species has evolved a different balance optimized for their survival strategy.' },

  // Reproduction and population
  { id: 'bio_r_vs_k_selection', title: 'Many vs. Few', phenomenon: 'Some species have many babies, others invest heavily in few', category: 'reproduction', rarity: 'rare',
    condition: (ctx) => ctx.commonSpeciesFastRecovery && ctx.rareSpeciesSlowRecovery,
    observation: 'Common fish bounced back quickly after fishing pressure, but rare species took much longer.',
    insight: '"r-selected" species (like common fish) produce many offspring with low survival rates. "K-selected" species (like rare/legendary fish) produce few offspring with high parental investment. Both strategies work.' },

  { id: 'bio_carrying_capacity', title: 'Nature\'s Limit', phenomenon: 'Populations naturally stop growing at a certain point', category: 'ecology', rarity: 'uncommon',
    condition: (ctx) => ctx.populationStabilized && ctx.resourcesLimited,
    observation: 'A fish population stopped growing even though there was no fishing pressure.',
    insight: 'Every environment has a "carrying capacity" — the maximum population it can support. Limited food, space, and oxygen prevent infinite growth. Nature has built-in limits.' },

  // Senses and communication
  { id: 'bio_lateral_line', title: 'The Invisible Sense', phenomenon: 'Fish detect vibrations in the water without touching anything', category: 'anatomy', rarity: 'uncommon',
    condition: (ctx) => ctx.fishReactedToVibration && !ctx.fishReactedToSilent,
    observation: 'Fish scattered when something moved in the water nearby, even though nothing touched them.',
    insight: 'The "lateral line" is a row of tiny sensors along a fish\'s body that detects water movement and pressure changes. It\'s how fish school in perfect formation and detect approaching predators in darkness.' },

  { id: 'bio_fear_chemical', title: 'Fear on the Water', phenomenon: 'Injured fish release chemicals that warn others', category: 'behavior', rarity: 'rare',
    condition: (ctx) => ctx.injuryCausedSchoolFlee && ctx.noVisualContact,
    observation: 'An entire school fled when one fish was injured, even though the predator was far away.',
    insight: 'Many fish species release "alarm substances" (schreckstoff) when injured. This chemical signal spreads through the water, warning nearby fish of danger. It\'s an evolved communication system.' },

  // Circadian rhythms
  { id: 'bio_circadian_rhythm', title: 'The Internal Clock', phenomenon: 'Fish behavior changes predictably with time of day', category: 'behavior', rarity: 'common',
    condition: (ctx) => ctx.consistentDawnActivity && ctx.consistentNightActivity,
    observation: 'Fish reliably changed their behavior at dawn and dusk, even without any obvious trigger.',
    insight: 'Fish have circadian rhythms — internal 24-hour clocks that regulate activity, feeding, and hiding. Dawn and dusk trigger hormonal changes that shift fish from rest to active mode.' },

  // More cards (filling out the 30+ target)
  { id: 'bio_mimicry', title: 'Copycat Survival', phenomenon: 'Harmless species imitate dangerous ones to avoid predation', category: 'evolution', rarity: 'legendary',
    condition: (ctx) => ctx.harmlessFishAvoided && ctx.looksLikeDangerousFish,
    observation: 'Predators avoided a harmless fish that looked similar to a toxic species.',
    insight: 'Batesian mimicry is when a harmless species evolves to look like a dangerous one. The mimic gains protection without the cost of producing toxins. It\'s nature\'s oldest con game.' },

  { id: 'bio_symbiosis', title: 'Unexpected Partners', phenomenon: 'Different species help each other survive', category: 'ecology', rarity: 'rare',
    condition: (ctx) => ctx.speciesAHelpedSpeciesB && ctx.mutualBenefit,
    observation: 'Two different species of fish appeared to coordinate their behavior for mutual benefit.',
    insight: 'Symbiosis is when different species develop a cooperative relationship. Cleaning fish eat parasites off larger fish — both benefit. Nature is full of partnerships.' },

  { id: 'bio_depth_zonation', title: 'Depth Zones', phenomenon: 'Different species occupy specific depth ranges', category: 'ecology', rarity: 'common',
    condition: (ctx) => ctx.distinctDepthLayers && ctx.speciesSeparated,
    observation: 'Fish clearly separated into different depth zones — no species overlapped much.',
    insight: 'Lakes and oceans have distinct zones based on light, temperature, and pressure. Each species has evolved to thrive in its preferred zone. This reduces competition between species.' },

  { id: 'bio_seasonal_migration', title: 'The Long Swim', phenomenon: 'Fish move to different areas with the seasons', category: 'behavior', rarity: 'uncommon',
    condition: (ctx) => ctx.schoolMovedWithSeason && ctx.predictablePattern,
    observation: 'The school relocated to a different part of the water body as the season changed.',
    insight: 'Seasonal migration is driven by temperature, food availability, and reproduction needs. Fish navigate using temperature gradients, magnetic fields, and even the stars.' },

  { id: 'bio_competition_exclusion', title: 'No Two Alike', phenomenon: 'Similar species can\'t coexist in the same niche', category: 'ecology', rarity: 'rare',
    condition: (ctx) => ctx.competingSpecies && ctx.oneSpeciesDominated,
    observation: 'Two species that seemed similar ended up with one dominating and the other declining.',
    insight: 'The "competitive exclusion principle" states that two species competing for the exact same resources can\'t coexist long-term. One will always outcompete the other. Species evolve to specialize and avoid direct competition.' },

  { id: 'bio_swarm_intelligence', title: 'Group Mind', phenomenon: 'A school makes better decisions than any individual fish', category: 'behavior', rarity: 'uncommon',
    condition: (ctx) => ctx.schoolFoundFood && ctx.individualsMissedFood,
    observation: 'The school collectively found food that no individual fish was heading toward.',
    insight: 'Swarm intelligence emerges when simple individual behaviors combine to produce complex group decisions. Each fish follows simple rules, but the school as a whole appears to "think."' },
];

export class BiologyLessons {
  constructor(options = {}) {
    this.cards = BIOLOGY_CARDS.map(c => ({ ...c, discovered: false, discoveredAt: null }));
    this.discoveredSet = new Set();
    this.callbacks = []; // onDiscovery(card)
    this._observationContext = {};
  }

  /**
   * Update the observation context and check for new discoveries.
   * @param {Object} ctx - Current observation state
   */
  observe(ctx) {
    this._observationContext = { ...this._observationContext, ...ctx };

    const newDiscoveries = [];
    for (const card of this.cards) {
      if (card.discovered) continue;
      try {
        if (card.condition(this._observationContext)) {
          card.discovered = true;
          card.discoveredAt = Date.now();
          card.observation = typeof card.observation === 'function'
            ? card.observation(this._observationContext)
            : card.observation;
          this.discoveredSet.add(card.id);
          newDiscoveries.push(card);
        }
      } catch (_) {
        // Condition evaluation failed — skip
      }
    }

    for (const card of newDiscoveries) {
      for (const cb of this.callbacks) {
        try { cb(card); } catch (_) {}
      }
    }

    return newDiscoveries;
  }

  /** Get all discovery cards with status */
  getAllCards() {
    return this.cards.map(c => ({
      id: c.id, title: c.title, category: c.category, rarity: c.rarity,
      discovered: c.discovered, discoveredAt: c.discoveredAt,
    }));
  }

  /** Get discovered cards */
  getDiscovered() {
    return this.cards.filter(c => c.discovered);
  }

  /** Get undiscovered cards (hints only, no spoilers) */
  getUndiscovered() {
    return this.cards.filter(c => !c.discovered).map(c => ({
      id: c.id, title: c.title, category: c.category, rarity: c.rarity,
    }));
  }

  /** Get a fully revealed card */
  getCard(id) {
    const card = this.cards.find(c => c.id === id);
    if (!card || !card.discovered) return null;
    return {
      id: card.id, title: card.title, phenomenon: card.phenomenon,
      observation: card.observation, insight: card.insight,
      category: card.category, rarity: card.rarity,
      discoveredAt: card.discoveredAt,
    };
  }

  /** Get discovery progress */
  getProgress() {
    const discovered = this.cards.filter(c => c.discovered).length;
    const byRarity = {};
    for (const card of this.cards) {
      if (!byRarity[card.rarity]) byRarity[card.rarity] = { total: 0, discovered: 0 };
      byRarity[card.rarity].total++;
      if (card.discovered) byRarity[card.rarity].discovered++;
    }
    return { discovered, total: this.cards.length, byRarity };
  }

  /** Register callback for new discoveries */
  onDiscovery(callback) {
    this.callbacks.push(callback);
  }

  /** Reset all discoveries */
  reset() {
    for (const card of this.cards) {
      card.discovered = false;
      card.discoveredAt = null;
    }
    this.discoveredSet.clear();
    this._observationContext = {};
  }
}

export default BiologyLessons;
