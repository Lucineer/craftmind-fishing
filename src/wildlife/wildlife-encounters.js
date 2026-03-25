// CraftMind Fishing — Wildlife Encounter System
// Random wildlife events during sailing and fishing in Southeast Alaska.
// From common harbor seal pop-ups to legendary blue whale sightings.

import { EventEmitter } from 'node:events';

// ═══════════════════════════════════════════════════════════════
// ENCOUNTER DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const RARITY_TIERS = {
  common:     { weight: 60,  color: '#888888' },
  uncommon:   { weight: 25,  color: '#55aa55' },
  rare:       { weight: 10,  color: '#5555ff' },
  ultra_rare: { weight: 3,   color: '#ff55ff' },
  legendary:  { weight: 0.5, color: '#ffaa00' },
};

export const ENCOUNTER_DEFS = [
  // ── Common Encounters ───────────────────────────────────────
  {
    id: 'seal_periscope',
    name: 'Harbor Seal Periscope',
    emoji: '🦭',
    rarity: 'common',
    description: 'A harbor seal pokes its head up to watch you fish.',
    biomes: ['sheltered_sound', 'river_estuary', 'kelp_forest'],
    season: [1,2,3,4,5,6,7,8,9,10,11,12],
    duration: 8_000,
    effects: { karma: 1 },
    narrative: [
      'A small head breaks the surface thirty yards off your port bow. Dark eyes watch you with what looks like amusement. A harbor seal — the most common companion on Southeast Alaska waters.',
      'The seal submerges quietly, then pops up again closer. They\'re curious. Don\'t feed them — it\'s bad for them and illegal.',
    ],
  },
  {
    id: 'porpoise_passing',
    name: 'Harbor Porpoise Pod',
    emoji: '🐬',
    rarity: 'common',
    description: 'A small pod of harbor porpoises passes through.',
    biomes: ['sheltered_sound', 'open_ocean', 'river_estuary'],
    season: [1,2,3,4,5,6,7,8,9,10,11,12],
    duration: 12_000,
    effects: { karma: 1 },
    narrative: [
      'Tiny dorsal fins break the surface in quick succession — puff, puff, puff. Harbor porpoises. They\'re gone almost as fast as they appeared, their "puffing pig" breathing the only sound.',
    ],
  },
  {
    id: 'eagle_swoop',
    name: 'Eagle Swoops Near Surface',
    emoji: '🦅',
    rarity: 'common',
    description: 'A bald eagle dives and catches a fish near your boat.',
    biomes: ['sheltered_sound', 'river_estuary', 'freshwater_river'],
    season: [3,4,5,6,7,8,9,10,11],
    duration: 5_000,
    effects: { karma: 2 },
    narrative: [
      'A shadow passes over the water — massive wingspan, white head. The eagle pulls up with a fish in its talons, water streaming off its catch. It banks toward a nearby tree. The fish finder of the sky.',
    ],
  },
  {
    id: 'sea_lion_bark',
    name: 'Sea Lion Barking',
    emoji: '🦭',
    rarity: 'common',
    description: 'The distant bark of Steller sea lions echoes across the water.',
    biomes: ['sheltered_sound', 'open_ocean', 'rocky_pinnacles'],
    season: [1,2,3,4,5,6,7,8,9,10,11,12],
    duration: 3_000,
    effects: {},
    narrative: [
      'That deep, guttural bark carries for miles. Steller sea lions. They\'re probably hauled out on some rock, arguing about prime real estate.',
    ],
  },
  {
    id: 'gull_flock',
    name: 'Gull Flock Following Boat',
    emoji: '🐦',
    rarity: 'common',
    description: 'A flock of gulls follows your boat — fish are active below.',
    biomes: ['sheltered_sound', 'open_ocean', 'rocky_pinnacles'],
    season: [1,2,3,4,5,6,7,8,9,10,11,12],
    duration: 15_000,
    effects: { fishActivity: 1.2 },
    narrative: [
      'The gulls found you. A dozen of them, wheeling and crying, waiting for scraps. But more importantly — "gull bait" means something\'s pushing baitfish to the surface. Fish are feeding below.',
    ],
  },

  // ── Uncommon Encounters ─────────────────────────────────────
  {
    id: 'humpback_surface',
    name: 'Humpback Surfaces Nearby',
    emoji: '🐋',
    rarity: 'uncommon',
    description: 'A humpback whale surfaces alarmingly close to your boat.',
    biomes: ['sheltered_sound', 'open_ocean'],
    season: [5,6,7,8,9,10],
    duration: 20_000,
    effects: { karma: 5, fishScare: 0.7 },
    narrative: [
      'A massive shape rises from the depths fifty yards off your starboard side. The blow — a column of vapor and sound — hits you like a warm wind. The humpback\'s back rolls through, mottled grey and white, and then the fluke goes up as it sounds. Your heart is pounding. This never gets old.',
    ],
  },
  {
    id: 'sea_otter_raft',
    name: 'Sea Otter Raft',
    emoji: '🦦',
    rarity: 'uncommon',
    description: 'A raft of sea otters floats in the kelp.',
    biomes: ['kelp_forest', 'sheltered_sound'],
    season: [1,2,3,4,5,6,7,8,9,10,11,12],
    duration: 15_000,
    effects: { karma: 5 },
    narrative: [
      'In the kelp ahead, a dozen sea otters float on their backs, wrapped in fronds to keep from drifting. One cracks a clam on a rock balanced on its chest — whack, whack, whack. A pup rides on its mother\'s belly, impossibly fluffy. You slow down just to watch.',
    ],
  },
  {
    id: 'dalls_bow_riding',
    name: "Dall's Porpoise Bow-Riding",
    emoji: '🐬',
    rarity: 'uncommon',
    description: "Dall's porpoises race to your bow and ride the wake.",
    biomes: ['open_ocean', 'sheltered_sound'],
    season: [4,5,6,7,8,9],
    duration: 20_000,
    effects: { karma: 3 },
    narrative: [
      'Black and white shapes streak toward your bow — Dall\'s porpoises! They fall in alongside, rooster-tail splashes shooting up as they surf your pressure wave. One crosses in front, so close you could reach down and touch it. They\'re racing you, and they\'re winning.',
    ],
  },
  {
    id: 'sea_lion_haulout',
    name: 'Steller Sea Lion Haul-Out',
    emoji: '🦭',
    rarity: 'uncommon',
    description: 'Dozens of Steller sea lions crowd a rocky haul-out.',
    biomes: ['rocky_pinnacles', 'open_ocean'],
    season: [5,6,7,8,9],
    duration: 10_000,
    effects: { karma: 3 },
    narrative: [
      'The rock ahead is MOVING. Dozens — maybe fifty — Steller sea lions, piled on each other like giant brown potatoes. The bulls are enormous, easily a ton each, and they\'re barking at everything that moves. The smell hits you before the sound does.',
    ],
  },
  {
    id: 'eagle_line_steal',
    name: 'Bald Eagle Steals Your Fish',
    emoji: '🦅',
    rarity: 'uncommon',
    description: 'A bald eagle steals a fish right off your line.',
    biomes: ['sheltered_sound', 'river_estuary', 'freshwater_river'],
    season: [5,6,7,8,9],
    duration: 5_000,
    effects: { karma: 3, catchLoss: true },
    narrative: [
      'Your rod bends — fish on! You reel, the fish comes up, it\'s almost at the surface, and then a BROWN FLASH. An eagle hits the water at 40mph, locks its talons into YOUR salmon, and pumps up with a six-pound silver in its grip. It doesn\'t even look back. The line goes slack. In Sitka, the eagles don\'t wait for you to fillet — they catch their own.',
    ],
  },

  // ── Rare Encounters ─────────────────────────────────────────
  {
    id: 'bubble_net_feeding',
    name: 'Bubble-Net Feeding',
    emoji: '🐋',
    rarity: 'rare',
    description: 'A pod of humpbacks performs bubble-net feeding — the most spectacular wildlife event in Alaska.',
    biomes: ['open_ocean', 'sheltered_sound'],
    season: [6,7,8,9],
    duration: 45_000,
    effects: { karma: 20, fishConcentrate: 2.5, experience: 50 },
    narrative: [
      'You notice bubbles rising to the surface in a perfect circle, expanding inward. Then MORE bubbles — a net of air rising from below. The circle tightens. Inside it, panicked herring school tighter and tighter. And then — THE LUNGE. Five humpback whales explode through the surface in unison, mouths wide open, throat pleats distended, water and fish and fury. They close their jaws, settle back, and start over. You drop your gear and watch. Some things are more important than fishing.',
    ],
  },
  {
    id: 'transient_orca_hunt',
    name: 'Transient Orca Pod Hunt',
    emoji: '🐋',
    rarity: 'rare',
    description: 'A pod of transient orcas coordinates a hunt through the area.',
    biomes: ['open_ocean', 'sheltered_sound', 'rocky_pinnacles'],
    season: [1,2,3,4,5,6,7,8,9,10,11,12],
    duration: 30_000,
    effects: { karma: 10, fishScare: 1.0, scareDuration: 20_000 },
    narrative: [
      'The dorsal fins slice the surface — tall, straight black triangles. Transient orcas. Five of them, moving in formation, silent and purposeful. The seal haul-out goes DEAD QUIET. Every seal in the water dives. Every bird takes off. The orcas are communicating in clicks you can\'t hear, coordinating something you\'re about to witness. Fishing? Not today. Not for twenty minutes.',
    ],
  },
  {
    id: 'gray_whale_mother_calf',
    name: 'Gray Whale Mother-Calf Pair',
    emoji: '🐋',
    rarity: 'rare',
    description: 'A gray whale mother and calf pass close to your boat.',
    biomes: ['sheltered_sound', 'tidal_flats'],
    season: [3,4,5,10,11],
    duration: 25_000,
    effects: { karma: 15 },
    narrative: [
      'A mud plume erupts on the surface — the gray whale is bottom feeding. Then a SECOND, smaller plume. Mother and calf. The calf surfaces right next to your boat, gray and barnacle-covered, giving you a look with one eye that seems almost好奇. The mother surfaces behind, massive and watchful. They\'re heading north — thousands of miles to go.',
    ],
  },
  {
    id: 'minke_approaches',
    name: 'Minke Whale Spyhop',
    emoji: '🐋',
    rarity: 'rare',
    description: 'A curious minke whale spyhops to look at you.',
    biomes: ['sheltered_sound', 'open_ocean'],
    season: [5,6,7,8,9],
    duration: 15_000,
    effects: { karma: 10 },
    narrative: [
      'A small whale surfaces nearby — minke, by the size. Instead of diving, it pushes its head straight UP out of the water, eyes above the surface, looking RIGHT AT YOU. Spyhopping. It holds there for five seconds, checking you out with genuine curiosity, then slides back down with barely a splash. The little whale that could.',
    ],
  },
  {
    id: 'sea_lion_steals_line',
    name: 'Sea Lion Steals Fish Off Line',
    emoji: '🦭',
    rarity: 'rare',
    description: 'A Steller sea lion grabs a fish RIGHT off your line in front of you.',
    biomes: ['sheltered_sound', 'open_ocean', 'rocky_pinnacles'],
    season: [5,6,7,8,9],
    duration: 10_000,
    effects: { karma: 5, catchLoss: true },
    narrative: [
      'You\'ve got a fish coming up, thirty yards from the boat, when a BROWN TORPEDO comes from under the hull. The sea lion hits the fish on the hook, twists, and comes up with the whole thing — hook, leader, and a twenty-pound halibut. It looks at you while it chews. That\'s personal.',
    ],
  },

  // ── Ultra-Rare Encounters ───────────────────────────────────
  {
    id: 'blue_whale_sighting',
    name: 'Blue Whale',
    emoji: '🐋',
    rarity: 'ultra_rare',
    description: 'A blue whale — the largest animal to ever live — surfaces offshore.',
    biomes: ['open_ocean', 'deep_trench'],
    season: [6,7,8],
    duration: 60_000,
    effects: { karma: 100, achievement: 'leviathan', experience: 200 },
    narrative: [
      'A shadow moves under the water so large you think it\'s a submarine. Then the blow — a column of spray TWENTY FEET HIGH, visible for miles. The blue whale\'s back rolls by like a small island, slate blue and mottled, taking thirty seconds to pass. The dorsal fin is TINY on that massive body. It\'s the size of three school buses. When the fluke rises — broad as a sail — the boat rocks from the displacement. You are nothing. This is the leviathan. This is the largest animal that has ever lived on Earth.',
    ],
  },
  {
    id: 'sperm_whale_dive',
    name: 'Sperm Whale Deep Dive',
    emoji: '🐋',
    rarity: 'ultra_rare',
    description: 'A sperm whale surfaces briefly before diving to the abyss.',
    biomes: ['open_ocean', 'deep_trench'],
    season: [5,6,7,8,9],
    duration: 20_000,
    effects: { karma: 50 },
    narrative: [
      'That\'s a weird-looking whale. The head is ENORMOUS — a third of the body length. Squared-off, wrinkled. A sperm whale. It blows once — forward and to the left, uniquely — then raises its massive fluke straight up and DIVES. Straight down. It\'s heading for 7,000 feet to hunt giant squid in the dark. It won\'t surface for ninety minutes. The clicks it makes down there can stun prey. You feel them in your bones.',
    ],
  },
  {
    id: 'fin_whale_passing',
    name: 'Fin Whale',
    emoji: '🐋',
    rarity: 'ultra_rare',
    description: 'A fin whale — the second largest animal — passes at speed.',
    biomes: ['open_ocean'],
    season: [6,7,8,9],
    duration: 10_000,
    effects: { karma: 50 },
    narrative: [
      'A blow shoots up like a geyser, visible from MILES away. That blow is huge — the fin whale has one of the tallest spouts of any whale. By the time you turn to look, you see the sleek, dark back streaming past, going TWENTY KNOTS. It\'s gone in seconds. The greyhound of the sea doesn\'t stop for admirers. Seventy tons of speed and muscle, and it was here and gone like a freight train.',
    ],
  },
  {
    id: 'beluga_wanderer',
    name: 'Beluga Whale Wanderer',
    emoji: '🐋',
    rarity: 'ultra_rare',
    description: 'A wayward beluga whale, impossibly far from Cook Inlet.',
    biomes: ['sheltered_sound', 'river_estuary'],
    season: [6,7,8],
    duration: 30_000,
    effects: { karma: 75 },
    narrative: [
      'Something WHITE is in the water ahead. Not a log, not a buoy. It\'s a BELUGA. Pure white, small, rounded head — a whale that looks like it was designed by committee. It shouldn\'t be here. These are Cook Inlet\'s endangered belugas, not Southeast Alaska regulars. It chirps and squeaks — the "canary of the sea" — sounds so weird and wonderful coming from something that big. How did it get here? Nobody knows. Take a picture. Nobody will believe you.',
    ],
  },
  {
    id: 'orca_vs_sea_lion',
    name: 'Orca vs Sea Lion',
    emoji: '🐋',
    rarity: 'ultra_rare',
    description: 'Transient orcas hunt a sea lion in full view.',
    biomes: ['open_ocean', 'sheltered_sound'],
    season: [4,5,6,7,8,9,10],
    duration: 40_000,
    effects: { karma: 25, fishScare: 1.0, scareDuration: 25_000 },
    narrative: [
      'A sea lion is porpoising at top speed — thirty knots — and it is SCREAMING. Behind it, three orcas in perfect formation, closing the gap. The sea lion tries to zigzag but orcas are smarter. One peels off to cut it off. The sea lion reverses — the second orca is there. They herd it, push it, play with it. And then the hit. The water explodes. It\'s brutal. It\'s nature. It\'s the most intense thing you\'ve ever seen on the water.',
    ],
  },

  // ── Legendary Encounters ────────────────────────────────────
  {
    id: 'blue_whale_bubble_net',
    name: 'Blue Whale Bubble-Net Feeding',
    emoji: '🐋',
    rarity: 'legendary',
    description: 'A blue whale bubble-net feeds. Not confirmed in reality — the ultimate easter egg.',
    biomes: ['open_ocean', 'deep_trench'],
    season: [7,8],
    duration: 90_000,
    effects: { karma: 500, achievement: 'deep_leviathan', experience: 1000 },
    narrative: [
      'IMPOSSIBLE. Bubbles are rising in a circle — a MASSIVE circle, two hundred feet across. No. No way. A BLUE WHALE is bubble-net feeding. This has never been documented. The krill inside the circle are so dense the water looks red. And then THE LUNGE. A hundred tons of whale erupts from the ocean, mouth open wide enough to swallow a school bus, engulfing a swimming pool\'s worth of krill in one gulp. The splash nearly swamps your boat. If anyone ever believes you, you\'ll be in National Geographic.',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// WILDLIFE ENCOUNTER SYSTEM
// ═══════════════════════════════════════════════════════════════

export class WildlifeEncounterSystem extends EventEmitter {
  constructor() {
    super();
    this.encounters = new Map(); // id → encounter instance
    this.encounterHistory = [];  // Past encounters
    this.customEncounters = [];  // Registered by mods/quests
    this.activeEncounter = null;
    this.encounterCooldown = 0;
    this.cooldownDuration = 15_000; // Min 15s between encounters
    this.totalEncounters = 0;
    this.rarityEncounters = {};    // Track first of each rarity
  }

  /** Register a custom encounter */
  register(encounterDef) {
    if (!encounterDef.id || !encounterDef.rarity || !encounterDef.description) {
      throw new Error('Encounter must have id, rarity, and description');
    }
    this.customEncounters.push(encounterDef);
    this.emit('registered', { encounter: encounterDef });
  }

  /** Get all available encounters for current conditions */
  _getEligibleEncounters(biome, month) {
    const all = [...ENCOUNTER_DEFS, ...this.customEncounters];
    return all.filter(e =>
      e.biomes.includes(biome) &&
      e.season.includes(month)
    );
  }

  /** Select encounter by weighted rarity */
  _selectEncounter(eligible) {
    if (eligible.length === 0) return null;

    const totalWeight = eligible.reduce((sum, e) => {
      return sum + (RARITY_TIERS[e.rarity]?.weight ?? 1);
    }, 0);

    let roll = Math.random() * totalWeight;
    for (const enc of eligible) {
      roll -= RARITY_TIERS[enc.rarity]?.weight ?? 1;
      if (roll <= 0) return enc;
    }
    return eligible[eligible.length - 1];
  }

  /** Tick — try to trigger encounters */
  tick(dt, playerLocation, biome, month, isFishing, isSailing) {
    if (!isFishing && !isSailing) return null;

    // Cooldown
    this.encounterCooldown -= dt;
    if (this.encounterCooldown > 0) return null;

    // Fishing is less likely to trigger encounters (player is busy)
    const triggerChance = isFishing ? 0.02 : isSailing ? 0.04 : 0;

    if (Math.random() > triggerChance) return null;

    const eligible = this._getEligibleEncounters(biome, month);
    if (eligible.length === 0) return null;

    const encounter = this._selectEncounter(eligible);
    if (!encounter) return null;

    // Trigger the encounter
    return this._triggerEncounter(encounter, playerLocation);
  }

  /** Trigger an encounter and return the event */
  _triggerEncounter(encounterDef, location) {
    const encounter = {
      id: `enc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      def: encounterDef,
      location: { ...location },
      startedAt: Date.now(),
      duration: encounterDef.duration,
      narrative: Array.isArray(encounterDef.narrative)
        ? encounterDef.narrative[Math.floor(Math.random() * encounterDef.narrative.length)]
        : encounterDef.narrative,
      effects: { ...encounterDef.effects },
      active: true,
    };

    this.encounters.set(encounter.id, encounter);
    this.activeEncounter = encounter;
    this.encounterCooldown = this.cooldownDuration + encounter.duration;
    this.totalEncounters++;

    // Track rarity milestones
    if (!this.rarityEncounters[encounterDef.rarity]) {
      this.rarityEncounters[encounterDef.rarity] = encounterDef;
    }

    // History
    this.encounterHistory.push({
      id: encounter.id,
      speciesId: encounterDef.id,
      name: encounterDef.name,
      rarity: encounterDef.rarity,
      timestamp: Date.now(),
    });
    if (this.encounterHistory.length > 1000) {
      this.encounterHistory = this.encounterHistory.slice(-500);
    }

    const event = {
      type: 'encounter',
      encounter,
      name: encounterDef.name,
      emoji: encounterDef.emoji,
      rarity: encounterDef.rarity,
      narrative: encounter.narrative,
      effects: encounter.effects,
      duration: encounter.duration,
    };

    this.emit('encounter', event);
    this.emit(`encounter:${encounterDef.rarity}`, event);
    this.emit(`encounter:${encounterDef.id}`, event);

    return event;
  }

  /** Dismiss active encounter */
  dismissEncounter(encounterId) {
    const enc = this.encounters.get(encounterId);
    if (enc) {
      enc.active = false;
      this.encounters.delete(encounterId);
      if (this.activeEncounter?.id === encounterId) {
        this.activeEncounter = null;
      }
      this.emit('dismissed', { encounter: enc });
    }
  }

  /** Get encounter stats */
  getStats() {
    return {
      totalEncounters: this.totalEncounters,
      rarityMilestones: Object.fromEntries(
        Object.entries(this.rarityEncounters).map(([k, v]) => [k, v.name])
      ),
      recentEncounters: this.encounterHistory.slice(-10).reverse(),
    };
  }
}

export default WildlifeEncounterSystem;
