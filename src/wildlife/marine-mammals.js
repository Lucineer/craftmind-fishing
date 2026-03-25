// CraftMind Fishing — Marine Mammal System
// Southeast Alaska's whales, pinnipeds, dolphins, and porpoises.
// A Sitka fisherman should read this and go "yep, that's exactly what happens."

import { EventEmitter } from 'node:events';

// ═══════════════════════════════════════════════════════════════
// MAMMAL SPECIES DATABASE
// ═══════════════════════════════════════════════════════════════

export const MAMMAL_TYPES = {
  // ── Whales ──────────────────────────────────────────────────
  humpback_whale: {
    id: 'humpback_whale',
    name: 'Humpback Whale',
    scientific: 'Megaptera novaeangliae',
    category: 'baleen_whale',
    emoji: '🐋',
    rarity: 'uncommon',
    sizeRange: [40, 50],         // feet
    weightRange: [25, 40],       // tons
    season: [5, 6, 7, 8, 9, 10],// May–October
    peakMonth: [7, 8, 9],       // July–September
    biomes: ['sheltered_sound', 'open_ocean', 'rocky_pinnacles'],
    preferredDepth: [0, 100],
    groupSize: [1, 15],          // bubble-net pods can be 5-15
    protected: true,
    fishermanImpact: 'mixed',    // can concentrate or scare fish
    personality: 'Gentle giant. Acrobatic. The soul of Southeast Alaska waters.',
    notes: 'Bubble-net feeding is the most spectacular wildlife event in Alaska. If you see it, stop fishing and watch.',
  },
  gray_whale: {
    id: 'gray_whale',
    name: 'Gray Whale',
    scientific: 'Eschrichtius robustus',
    category: 'baleen_whale',
    emoji: '🐋',
    rarity: 'rare',
    sizeRange: [40, 50],
    weightRange: [20, 35],
    season: [3, 4, 5, 10, 11],  // Migratory: Mar-May north, Oct-Nov south
    peakMonth: [4, 10],
    biomes: ['sheltered_sound', 'tidal_flats', 'open_ocean'],
    preferredDepth: [0, 30],     // Shallow bottom feeders
    groupSize: [1, 3],           // Often mother-calf pairs
    protected: true,
    fishermanImpact: 'positive', // curious, mud plumes don't bother fishing
    personality: 'The friendly traveler. Bottom-feeds in the shallows like a giant vacuum.',
    notes: 'Mud plumes on the surface mean a gray whale is feeding below. Very curious — will approach boats.',
  },
  fin_whale: {
    id: 'fin_whale',
    name: 'Fin Whale',
    scientific: 'Balaenoptera physalus',
    category: 'baleen_whale',
    emoji: '🐋',
    rarity: 'ultra_rare',
    sizeRange: [65, 80],
    weightRange: [50, 70],       // Second largest animal ever
    season: [6, 7, 8, 9],
    peakMonth: [7, 8],
    biomes: ['open_ocean', 'deep_trench'],
    preferredDepth: [20, 200],
    groupSize: [1, 2],
    protected: true,
    fishermanImpact: 'neutral',
    personality: 'The greyhound of the sea. Massive, fast, and gone before you can grab your camera.',
    notes: 'Massive blow visible from miles away. Usually offshore. Heartbeat audible to divers.',
  },
  minke_whale: {
    id: 'minke_whale',
    name: 'Minke Whale',
    scientific: 'Balaenoptera acutorostrata',
    category: 'baleen_whale',
    emoji: '🐋',
    rarity: 'uncommon',
    sizeRange: [25, 30],
    weightRange: [5, 10],        // Smallest baleen whale
    season: [5, 6, 7, 8, 9],
    peakMonth: [6, 7, 8],
    biomes: ['sheltered_sound', 'open_ocean', 'rocky_pinnacles'],
    preferredDepth: [0, 80],
    groupSize: [1, 4],
    protected: true,
    fishermanImpact: 'neutral',
    personality: 'The little whale that could. Inquisitive, quick, and often the first whale you see.',
    notes: 'Will spyhop to look at you. Quick surfacing pattern. Often in channels and straits.',
  },
  blue_whale: {
    id: 'blue_whale',
    name: 'Blue Whale',
    scientific: 'Balaenoptera musculus',
    category: 'baleen_whale',
    emoji: '🐋',
    rarity: 'legendary',        // Ultra-rare easter egg
    sizeRange: [80, 100],
    weightRange: [100, 200],     // LARGEST ANIMAL EVER
    season: [6, 7, 8],
    peakMonth: [7],
    biomes: ['open_ocean', 'deep_trench'],
    preferredDepth: [50, 200],
    groupSize: [1, 2],
    protected: true,
    fishermanImpact: 'neutral',
    personality: 'A living mountain. Seeing one changes your life.',
    notes: 'Ultra-rare offshore encounter. Calls are 188 decibels — loudest animal sound. Achievement: "Leviathan".',
  },
  orca: {
    id: 'orca',
    name: 'Killer Whale',
    scientific: 'Orcinus orca',
    category: 'toothed_whale',
    emoji: '🐋',
    rarity: 'uncommon',
    sizeRange: [20, 30],
    weightRange: [3, 10],
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
    peakMonth: [5, 6, 7, 8],
    biomes: ['sheltered_sound', 'open_ocean', 'river_estuary', 'rocky_pinnacles'],
    preferredDepth: [0, 150],
    groupSize: [3, 20],          // Pods of 3-20
    protected: true,
    fishermanImpact: 'negative', // Transients scare all fish; residents less so
    personality: 'Apex predator. Brilliant, social, terrifying if you are a seal.',
    notes: 'Two ecotypes: Resident (eat salmon, follow runs) and Transient/Bigg\'s (eat marine mammals). Transients kill all fishing for 15-30 minutes.',
  },
  sperm_whale: {
    id: 'sperm_whale',
    name: 'Sperm Whale',
    scientific: 'Physeter macrocephalus',
    category: 'toothed_whale',
    emoji: '🐋',
    rarity: 'ultra_rare',
    sizeRange: [50, 65],
    weightRange: [35, 45],
    season: [5, 6, 7, 8, 9],
    peakMonth: [7, 8],
    biomes: ['open_ocean', 'deep_trench'],
    preferredDepth: [100, 200],  // Deep diver — 7000+ feet
    groupSize: [1, 5],
    protected: true,
    fishermanImpact: 'neutral',
    personality: 'The deep hunter. Largest toothed predator. Clicks can stun prey.',
    notes: 'Very rare in SE Alaska, more common in Gulf. Ambergris easter egg on beaches — incredibly valuable.',
  },
  beluga_whale: {
    id: 'beluga_whale',
    name: 'Beluga Whale',
    scientific: 'Delphinapterus leucas',
    category: 'toothed_whale',
    emoji: '🐋',
    rarity: 'legendary',        // Ultra-rare easter egg
    sizeRange: [12, 15],
    weightRange: [0.7, 1.5],
    season: [6, 7, 8],
    peakMonth: [7],
    biomes: ['sheltered_sound', 'river_estuary'],
    preferredDepth: [0, 30],
    groupSize: [1, 6],
    protected: true,
    fishermanImpact: 'neutral',
    personality: 'The canary of the sea. White, vocal, and impossibly rare this far south.',
    notes: 'Occasionally wanders from endangered Cook Inlet population. Finding one is incredible luck.',
  },

  // ── Pinnipeds ──────────────────────────────────────────────
  steller_sea_lion: {
    id: 'steller_sea_lion',
    name: 'Steller Sea Lion',
    scientific: 'Eumetopias jubatus',
    category: 'pinniped',
    emoji: '🦭',
    rarity: 'common',
    sizeRange: [7, 11],         // feet (males 10-11, females 7-8)
    weightRange: [600, 2500],    // lbs (males up to 2500!)
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
    peakMonth: [6, 7],          // Breeding season
    biomes: ['sheltered_sound', 'open_ocean', 'rocky_pinnacles', 'tidal_flats'],
    preferredDepth: [0, 60],
    groupSize: [1, 50],         // Haul-outs can have dozens
    protected: true,
    fishermanImpact: 'highly_negative', // THE biggest pain for fishermen
    personality: 'Bold, smart, and relentless. They learn your boat, your schedule, your gear.',
    notes: 'Follow longline boats, pull fish off hooks during haul-back. 10-30% catch loss. They get BOLDER over time.',
  },
  harbor_seal: {
    id: 'harbor_seal',
    name: 'Harbor Seal',
    scientific: 'Phoca vitulina',
    category: 'pinniped',
    emoji: '🦭',
    rarity: 'common',
    sizeRange: [5, 6],
    weightRange: [200, 300],
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    peakMonth: [6, 7, 8],
    biomes: ['sheltered_sound', 'river_estuary', 'kelp_forest', 'tidal_flats', 'rocky_pinnacles'],
    preferredDepth: [0, 30],
    groupSize: [1, 12],
    protected: true,
    fishermanImpact: 'negative', // Less destructive than sea lions but persistent
    personality: 'Curious, quiet, persistent. The "periscope" watcher at your boat.',
    notes: 'Pluck fish off hooks, steal bait. Pups on beaches in summer — disturbing them is illegal. Learn boat sounds = food.',
  },

  // ── Small Cetaceans ────────────────────────────────────────
  harbor_porpoise: {
    id: 'harbor_porpoise',
    name: 'Harbor Porpoise',
    scientific: 'Phocoena phocoena',
    category: 'porpoise',
    emoji: '🐬',
    rarity: 'common',
    sizeRange: [4, 5],
    weightRange: [100, 130],
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    peakMonth: [6, 7, 8],
    biomes: ['sheltered_sound', 'river_estuary', 'open_ocean'],
    preferredDepth: [0, 60],
    groupSize: [2, 10],
    protected: true,
    fishermanImpact: 'neutral',  // Harmless
    personality: 'Tiny, quick, shy. The "puffing pig" of Alaska waters.',
    notes: 'Quick surfacing, usually don\'t bother anyone. Harmless and ubiquitous.',
  },
  sea_otter: {
    id: 'sea_otter',
    name: 'Sea Otter',
    scientific: 'Enhydra lutris',
    category: 'mustelid',
    emoji: '🦦',
    rarity: 'uncommon',
    sizeRange: [3, 4],
    weightRange: [50, 80],
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    peakMonth: [6, 7, 8],
    biomes: ['kelp_forest', 'sheltered_sound', 'rocky_pinnacles'],
    preferredDepth: [0, 25],
    groupSize: [1, 30],         // Rafts
    protected: true,
    fishermanImpact: 'negative', // Compete for shellfish
    personality: 'Tool-using genius wrapped in kelp. Floats on its back, cracks clams on its chest.',
    notes: 'Mist Cove residents. Compete for urchins, crab, clams. Quest: "The Otter\'s Gift".',
  },
  pacific_white_sided_dolphin: {
    id: 'pacific_white_sided_dolphin',
    name: 'Pacific White-Sided Dolphin',
    scientific: 'Lagenorhynchus obliquidens',
    category: 'dolphin',
    emoji: '🐬',
    rarity: 'uncommon',
    sizeRange: [7, 8],
    weightRange: [300, 400],
    season: [5, 6, 7, 8, 9],
    peakMonth: [6, 7, 8],
    biomes: ['open_ocean', 'sheltered_sound'],
    preferredDepth: [0, 100],
    groupSize: [10, 100],
    protected: true,
    fishermanImpact: 'positive', // Pure joy encounter
    personality: 'The acrobat. Rides bow wakes, leaps and spins. Pure joy.',
    notes: 'Come right to the boat bow, ride the wake, jump alongside. Large groups of 50-100.',
  },
  dalls_porpoise: {
    id: 'dalls_porpoise',
    name: "Dall's Porpoise",
    scientific: 'Phocoenoides dalli',
    category: 'porpoise',
    emoji: '🐬',
    rarity: 'common',
    sizeRange: [6, 7],
    weightRange: [300, 400],
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    peakMonth: [5, 6, 7, 8],
    biomes: ['open_ocean', 'sheltered_sound', 'rocky_pinnacles'],
    preferredDepth: [0, 100],
    groupSize: [2, 20],
    protected: true,
    fishermanImpact: 'positive',
    personality: 'The speed demon. Black and white, 35mph, rooster tail splash.',
    notes: 'Looks like a mini orca. Will actively race boats. "Rooster tail" when surfacing at speed.',
  },
};

// Rarity spawn weights
const RARITY_WEIGHTS = {
  common:     50,
  uncommon:   25,
  rare:       10,
  ultra_rare: 3,
  legendary:  0.5,
};

// ═══════════════════════════════════════════════════════════════
// ACTIVE MAMMAL INSTANCE
// ═══════════════════════════════════════════════════════════════

export class MarineMammal {
  constructor(speciesId, location, options = {}) {
    const def = MAMMAL_TYPES[speciesId];
    if (!def) throw new Error(`Unknown marine mammal: ${speciesId}`);

    this.id = `mammal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.speciesId = speciesId;
    this.species = def;
    this.location = { ...location };
    this.heading = Math.random() * Math.PI * 2;
    this.speed = options.speed ?? this._defaultSpeed();
    this.groupSize = options.groupSize ?? this._randomGroupSize();
    this.state = options.state ?? 'traveling'; // traveling, feeding, resting, breaching, diving, spyhopping, bubble_feeding
    this.stateTimer = 0;
    this.despawnAfter = options.despawnAfter ?? (120_000 + Math.random() * 300_000); // 2-7 min
    this.spawnedAt = Date.now();
    this.active = true;

    // Orca-specific: ecotype
    this.orcaType = null;
    if (speciesId === 'orca') {
      this.orcaType = Math.random() < 0.5 ? 'resident' : 'transient';
    }

    // Sea lion adaptiveness (gets bolder over time near boats)
    this.boldness = speciesId === 'steller_sea_lion' ? 0.1 : 0;
  }

  _defaultSpeed() {
    const speeds = {
      humpback_whale: 3, gray_whale: 4, fin_whale: 12, minke_whale: 6,
      blue_whale: 8, orca: 15, sperm_whale: 5, beluga_whale: 6,
      steller_sea_lion: 10, harbor_seal: 8, harbor_porpoise: 12,
      sea_otter: 3, pacific_white_sided_dolphin: 15, dalls_porpoise: 20,
    };
    return (speeds[this.speciesId] ?? 5) * (0.7 + Math.random() * 0.6);
  }

  _randomGroupSize() {
    const [min, max] = this.species.groupSize;
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  /** Update mammal state. Returns array of events. */
  tick(dt, playerLocation, playerFishing) {
    if (!this.active) return [];

    const events = [];

    // Check despawn
    if (Date.now() - this.spawnedAt > this.despawnAfter) {
      this.active = false;
      events.push({ type: 'mammal_despawned', speciesId: this.speciesId, mammal: this });
      return events;
    }

    // State transitions
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this._chooseNewState(playerLocation, playerFishing);
    }

    // Movement
    this._move(dt);

    // Fishing interactions
    if (playerFishing && playerLocation) {
      const dist = this._distanceTo(playerLocation);
      if (dist < 100) {
        events.push(...this._fishingInteraction(dist, playerFishing));
      }
    }

    return events;
  }

  _chooseNewState(playerLocation, playerFishing) {
    const states = ['traveling', 'traveling', 'feeding', 'resting'];
    const sp = this.species;

    // Species-specific state additions
    if (sp.id === 'humpback_whale') {
      states.push('breaching', 'breaching', 'diving', 'bubble_feeding');
    }
    if (sp.id === 'minke_whale') {
      states.push('spyhopping', 'spyhopping');
    }
    if (sp.id === 'gray_whale') {
      states.push('feeding'); // Bottom feeding = mud plumes
    }

    this.state = states[Math.floor(Math.random() * states.length)];
    this.stateTimer = 5_000 + Math.random() * 20_000;
  }

  _move(dt) {
    const speedPerTick = this.speed * (dt / 1000);
    this.location.x += Math.cos(this.heading) * speedPerTick;
    this.location.z += Math.sin(this.heading) * speedPerTick;

    // Occasional heading changes
    if (Math.random() < 0.02) {
      this.heading += (Math.random() - 0.5) * 1.0;
    }
  }

  _distanceTo(loc) {
    const dx = this.location.x - (loc.x ?? 0);
    const dz = this.location.z - (loc.z ?? 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  _fishingInteraction(distance, fishingState) {
    const events = [];
    const sp = this.species;

    // Transient orcas scare all fish
    if (sp.id === 'orca' && this.orcaType === 'transient' && this.state === 'feeding') {
      events.push({
        type: 'orca_scare',
        speciesId: 'orca',
        orcaType: 'transient',
        message: 'A pod of transient orcas is hunting nearby! Fish are fleeing!',
        effect: { fishScareRadius: 500, scareDuration: 15_000 + Math.random() * 15_000 },
      });
    }

    // Sea lions follow longline boats
    if (sp.id === 'steller_sea_lion' && fishingState.method === 'longline' && distance < 80) {
      this.boldness = Math.min(1.0, this.boldness + 0.001);
      if (Math.random() < 0.1 + this.boldness * 0.3) {
        events.push({
          type: 'sea_lion_approaching',
          speciesId: 'steller_sea_lion',
          boldness: this.boldness,
          message: this.boldness > 0.5
            ? 'Sea lions are following your boat. They know the routine.'
            : 'A Steller sea lion is watching your operation from a safe distance.',
        });
      }
    }

    // Humpback bubble-net feeding concentrates fish
    if (sp.id === 'humpback_whale' && this.state === 'bubble_feeding') {
      events.push({
        type: 'bubble_net',
        speciesId: 'humpback_whale',
        message: 'Bubbles are rising to the surface in a circle — humpbacks are bubble-net feeding!',
        effect: { fishConcentrateRadius: 80, concentrationMultiplier: 2.0 },
      });
    }

    // Harbor seal steals bait
    if (sp.id === 'harbor_seal' && distance < 30 && Math.random() < 0.05) {
      events.push({
        type: 'seal_periscope',
        speciesId: 'harbor_seal',
        message: 'A harbor seal pokes its head up, watching your gear with interest.',
      });
    }

    return events;
  }
}

// ═══════════════════════════════════════════════════════════════
// MARINE MAMMAL SYSTEM — Spawning & Management
// ═══════════════════════════════════════════════════════════════

export class MarineMammalSystem extends EventEmitter {
  constructor(world) {
    super();
    this.world = world;
    this.activeMammals = new Map(); // id → MarineMammal
    this.spawnTimer = 0;
    this.spawnInterval = 30_000;   // Check for spawns every 30s
    this.maxActive = 15;           // Cap active mammals for performance
    this.seasonalCache = null;     // Rebuild each month
    this.currentMonth = -1;
    this.totalSightings = new Map(); // speciesId → count

    // Known haul-out sites (for sea lions)
    this.haulOutSites = [
      { id: 'sea_rock_haulout', name: 'Sea Rock', x: 200, z: 160, species: ['steller_sea_lion', 'harbor_seal'] },
      { id: 'buoy_7_haulout', name: 'Nav Buoy #7', x: 260, z: 190, species: ['steller_sea_lion'] },
      { id: 'mist_cove_raft', name: 'Mist Cove Kelp', x: 180, z: 320, species: ['sea_otter'] },
      { id: 'channel_marker_3', name: 'Channel Marker 3', x: 210, z: 270, species: ['harbor_seal', 'steller_sea_lion'] },
    ];
  }

  /** Get species available this month */
  getSeasonalSpecies(month) {
    if (this.currentMonth === month && this.seasonalCache) return this.seasonalCache;
    this.currentMonth = month;
    this.seasonalCache = Object.values(MAMMAL_TYPES).filter(sp => sp.season.includes(month));
    return this.seasonalCache;
  }

  /** Pick a random species weighted by rarity and biome */
  selectSpeciesForBiome(biome, month) {
    const seasonal = this.getSeasonalSpecies(month);
    const biomeMatch = seasonal.filter(sp => sp.biomes.includes(biome));
    if (biomeMatch.length === 0) return null;

    const totalWeight = biomeMatch.reduce((sum, sp) => sum + (RARITY_WEIGHTS[sp.rarity] ?? 1), 0);
    let roll = Math.random() * totalWeight;
    for (const sp of biomeMatch) {
      roll -= RARITY_WEIGHTS[sp.rarity] ?? 1;
      if (roll <= 0) return sp;
    }
    return biomeMatch[biomeMatch.length - 1];
  }

  /** Spawn a mammal near a location */
  spawn(speciesId, center, options = {}) {
    if (this.activeMammals.size >= this.maxActive) return null;

    const mammal = new MarineMammal(speciesId, {
      x: center.x + (Math.random() - 0.5) * 200,
      z: center.z + (Math.random() - 0.5) * 200,
    }, options);

    this.activeMammals.set(mammal.id, mammal);

    // Track sightings
    this.totalSightings.set(speciesId, (this.totalSightings.get(speciesId) ?? 0) + 1);

    this.emit('spawned', { mammal });
    return mammal;
  }

  /** Try spawning around player position */
  trySpawnNearPlayer(playerLocation, biome, month) {
    if (this.activeMammals.size >= this.maxActive) return null;

    const species = this.selectSpeciesForBiome(biome, month);
    if (!species) return null;

    // Legendary species need extra luck
    if (species.rarity === 'legendary' && Math.random() > 0.002) return null;
    if (species.rarity === 'ultra_rare' && Math.random() > 0.01) return null;

    return this.spawn(species.id, playerLocation);
  }

  /** Tick the system. Called each game tick. */
  tick(dt, playerLocation, biome, month, fishingState) {
    const allEvents = [];

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && playerLocation) {
      this.spawnTimer = this.spawnInterval;
      const spawned = this.trySpawnNearPlayer(playerLocation, biome, month);
      if (spawned) {
        allEvents.push({ type: 'mammal_spawned', mammal: spawned, species: spawned.species });
      }
    }

    // Tick all mammals
    for (const [id, mammal] of this.activeMammals) {
      const events = mammal.tick(dt, playerLocation, fishingState);
      if (events.length > 0) {
        allEvents.push(...events);
        for (const evt of events) this.emit(evt.type, evt);
      }
      if (!mammal.active) {
        this.activeMammals.delete(id);
      }
    }

    return allEvents;
  }

  /** Get all mammals near a location */
  getNearby(location, radius = 200) {
    return [...this.activeMammals.values()].filter(m => {
      const dx = m.location.x - location.x;
      const dz = m.location.z - location.z;
      return Math.sqrt(dx * dx + dz * dz) < radius;
    });
  }

  /** Get haul-out sites with their current occupants */
  getHaulOutInfo() {
    return this.haulOutSites.map(site => {
      const nearby = this.getNearby({ x: site.x, z: site.z }, 50);
      const occupants = nearby.filter(m => site.species.includes(m.speciesId));
      return { ...site, occupantCount: occupants.length, occupants };
    });
  }

  /** Get whale song info (for diving players) */
  getWhaleSong(playerLocation, depth) {
    if (depth < 10) return null;
    const nearby = this.getNearby(playerLocation, 500);
    const whales = nearby.filter(m => m.species.category === 'baleen_whale' && depth > 10);
    if (whales.length === 0) return null;

    const closest = whales.sort((a, b) => {
      const da = a._distanceTo(playerLocation);
      const db = b._distanceTo(playerLocation);
      return da - db;
    })[0];

    const dist = closest._distanceTo(playerLocation);
    return {
      speciesId: closest.speciesId,
      species: closest.species.name,
      volume: Math.max(0, 1 - dist / 500) * Math.min(1, depth / 50),
      description: closest.speciesId === 'humpback_whale'
        ? 'A haunting, complex melody echoes through the deep. A male humpback is singing.'
        : closest.speciesId === 'blue_whale'
          ? 'The deepest, loudest sound you have ever felt. It resonates in your chest.'
          : 'Low frequency clicks and moans pulse through the water.',
    };
  }
}

export default MarineMammalSystem;
