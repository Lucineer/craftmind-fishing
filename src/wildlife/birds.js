// CraftMind Fishing — Seabird System
// Birds tell you where the fish are. This is real.
// "The birds are working" = active fish feeding below.

import { EventEmitter } from 'node:events';

// ═══════════════════════════════════════════════════════════════
// BIRD SPECIES DATABASE
// ═══════════════════════════════════════════════════════════════

export const BIRD_TYPES = {
  gull: {
    id: 'gull',
    name: 'Gull',
    scientific: 'Larus spp.',
    emoji: '🐦',
    rarity: 'common',
    flockSize: [3, 50],
    behavior: 'surface_feeding',
    indicatesSpecies: ['herring', 'pink_salmon', 'sand_lance', 'capelin'],
    indicatesDepth: 'surface',
    indicatesBiome: ['sheltered_sound', 'open_ocean', 'river_estuary', 'tidal_flats'],
    notes: 'The classic fish finder. Diving gulls = feeding fish below. "Gull bait" = fish are biting.',
    fishActivityBoost: 1.2,
  },
  bald_eagle: {
    id: 'bald_eagle',
    name: 'Bald Eagle',
    scientific: 'Haliaeetus leucocephalus',
    emoji: '🦅',
    rarity: 'common',
    flockSize: [1, 5],
    behavior: 'surface_striking',
    indicatesSpecies: ['salmon', 'dolly_varden', 'herring'],
    indicatesDepth: 'surface',
    indicatesBiome: ['sheltered_sound', 'river_estuary', 'freshwater_river'],
    notes: 'Sit on nav buoys watching for fish. Will steal your catch. Iconic Alaska. Sometimes 20+ in a tree during salmon run.',
    fishActivityBoost: 1.1,
  },
  cormorant: {
    id: 'cormorant',
    name: 'Cormorant',
    scientific: 'Phalacrocorax pelagicus',
    emoji: '🐦',
    rarity: 'common',
    flockSize: [2, 20],
    behavior: 'diving',
    indicatesSpecies: ['rockfish', 'greenling', 'sculpin', 'cod'],
    indicatesDepth: 'bottom',
    indicatesBiome: ['sheltered_sound', 'rocky_pinnacles', 'kelp_forest'],
    notes: 'Diving birds = underwater structure or pinnacles. They find bottom fish you can\'t see.',
    fishActivityBoost: 1.15,
  },
  pigeon_guillemot: {
    id: 'pigeon_guillemot',
    name: 'Pigeon Guillemot',
    scientific: 'Cepphus columba',
    emoji: '🐦',
    rarity: 'uncommon',
    flockSize: [2, 10],
    behavior: 'diving',
    indicatesSpecies: ['rockfish', 'greenling', 'prawn'],
    indicatesDepth: 'nearshore',
    indicatesBiome: ['sheltered_sound', 'kelp_forest', 'rocky_pinnacles'],
    notes: 'Cute little black-and-white diving birds with red feet. Indicate nearshore fish activity.',
    fishActivityBoost: 1.1,
  },
  tufted_puffin: {
    id: 'tufted_puffin',
    name: 'Tufted Puffin',
    scientific: 'Fratercula cirrhata',
    emoji: '🐧',
    rarity: 'uncommon',
    flockSize: [5, 30],
    behavior: 'diving',
    indicatesSpecies: ['herring', 'sand_lance', 'capelin', 'pollock'],
    indicatesDepth: 'offshore',
    indicatesBiome: ['open_ocean'],
    notes: 'Offshore = deep water upwelling, nutrient-rich. Puffins mean good water. Also impossibly cute.',
    fishActivityBoost: 1.3,
  },
  surf_scoter: {
    id: 'surf_scoter',
    name: 'Surf Scoter',
    scientific: 'Melanitta perspicillata',
    emoji: '🐦',
    rarity: 'uncommon',
    flockSize: [5, 40],
    behavior: 'diving',
    indicatesSpecies: ['clam', 'mussel', 'crab', 'flounder'],
    indicatesDepth: 'shallow',
    indicatesBiome: ['tidal_flats', 'sheltered_sound', 'kelp_forest'],
    notes: 'Diving ducks in rafts. Indicate shallow bottom fish and shellfish beds.',
    fishActivityBoost: 1.1,
  },
  common_murre: {
    id: 'common_murre',
    name: 'Common Murre',
    scientific: 'Uria aalge',
    emoji: '🐦',
    rarity: 'uncommon',
    flockSize: [20, 200],
    behavior: 'surface_diving',
    indicatesSpecies: ['herring', 'capelin', 'sand_lance', 'pollock', 'salmon'],
    indicatesDepth: 'offshore',
    indicatesBiome: ['open_ocean'],
    notes: 'Large flocks offshore = massive bait schools below. If murres are working, something big is pushing bait to the surface.',
    fishActivityBoost: 1.4,
  },
};

// ═══════════════════════════════════════════════════════════════
// ACTIVE BIRD FLOCK
// ═══════════════════════════════════════════════════════════════

export class BirdFlock {
  constructor(speciesId, location) {
    const def = BIRD_TYPES[speciesId];
    if (!def) throw new Error(`Unknown bird species: ${speciesId}`);

    this.id = `flock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.speciesId = speciesId;
    this.species = def;
    this.location = { ...location };
    this.size = def.flockSize[0] + Math.floor(Math.random() * (def.flockSize[1] - def.flockSize[0]));
    this.activity = 'resting'; // resting, feeding, diving, circling, fleeing
    this.active = true;
    this.spawnedAt = Date.now();
    this.despawnAfter = 60_000 + Math.random() * 180_000; // 1-4 min
    this.heading = Math.random() * Math.PI * 2;
  }

  /** Bird behavior changes based on fish activity */
  updateBehavior(fishActivityBelow, predatorNearby) {
    if (predatorNearby) {
      this.activity = 'fleeing';
      return;
    }

    if (fishActivityBelow > 0.7) {
      this.activity = this.species.behavior === 'diving' ? 'diving' : 'feeding';
    } else if (fishActivityBelow > 0.3) {
      this.activity = this.species.behavior === 'diving' ? 'diving' : 'circling';
    } else {
      this.activity = Math.random() < 0.5 ? 'resting' : 'circling';
    }
  }

  tick(dt, fishActivity, predatorNearby) {
    if (!this.active) return;

    if (Date.now() - this.spawnedAt > this.despawnAfter) {
      this.active = false;
      return;
    }

    this.updateBehavior(fishActivity, predatorNearby);

    // Slight drift
    this.location.x += Math.cos(this.heading) * 0.5 * (dt / 1000);
    this.location.z += Math.sin(this.heading) * 0.5 * (dt / 1000);

    if (Math.random() < 0.01) {
      this.heading += (Math.random() - 0.5) * 0.5;
    }
  }

  /** Get fish-finding intelligence from this flock */
  getFishFindingIntel() {
    if (this.activity === 'resting' || this.activity === 'fleeing') return null;

    return {
      birdSpecies: this.species.name,
      activity: this.activity,
      indicatesSpecies: this.species.indicatesSpecies,
      depth: this.species.indicatesDepth,
      confidence: this.activity === 'feeding' || this.activity === 'diving' ? 0.8 : 0.5,
      message: this._generateIntelMessage(),
    };
  }

  _generateIntelMessage() {
    const sp = this.species;
    const act = this.activity;

    if (sp.id === 'gull' && act === 'feeding') {
      return 'The gulls are diving hard — "gull bait." Something\'s pushing baitfish to the surface. Get your gear in the water.';
    }
    if (sp.id === 'bald_eagle' && act === 'feeding') {
      return 'Eagles are working the surface. Salmon are pushing through — probably silvers.';
    }
    if (sp.id === 'cormorant' && act === 'diving') {
      return 'Cormorants are diving deep. Bottom structure nearby — rockfish and greenling down there.';
    }
    if (sp.id === 'tufted_puffin' && act === 'diving') {
      return 'Puffins! They mean deep water upwelling. Herring and sand lance should be holding here.';
    }
    if (sp.id === 'common_murre' && act === 'feeding') {
      return 'The murres are WORKING. That\'s a big flock in a tight circle — something big is herding bait below. Could be salmon sharks or even humpbacks underneath.';
    }
    if (sp.id === 'surf_scoter' && act === 'diving') {
      return 'Scoter raft diving in the shallows. Bottom fish and shellfish — dig out your crab pots.';
    }

    return `The ${sp.name.toLowerCase()}s are ${act}. Something fishy is going on.`;
  }
}

// ═══════════════════════════════════════════════════════════════
// BIRD SYSTEM
// ═══════════════════════════════════════════════════════════════

export class BirdSystem extends EventEmitter {
  constructor(world) {
    super();
    this.world = world;
    this.flocks = new Map();
    this.maxFlocks = 10;
    this.spawnTimer = 0;
    this.spawnInterval = 20_000;
  }

  /** Spawn bird flocks appropriate to location */
  spawnForBiome(biome, location, month) {
    const eligible = Object.values(BIRD_TYPES).filter(b =>
      b.indicatesBiome.includes(biome)
    );
    if (eligible.length === 0) return null;

    // Don't over-spawn
    if (this.flocks.size >= this.maxFlocks) return null;

    // Weight by rarity
    const totalWeight = eligible.reduce((s, b) => s + (b.rarity === 'common' ? 40 : 15), 0);
    let roll = Math.random() * totalWeight;
    let selected = eligible[0];
    for (const b of eligible) {
      roll -= b.rarity === 'common' ? 40 : 15;
      if (roll <= 0) { selected = b; break; }
    }

    const flock = new BirdFlock(selected.id, {
      x: location.x + (Math.random() - 0.5) * 150,
      z: location.z + (Math.random() - 0.5) * 150,
    });

    this.flocks.set(flock.id, flock);
    this.emit('flock_spawned', { flock });
    return flock;
  }

  /** Tick the system */
  tick(dt, playerLocation, biome, month, fishActivity = 0, predatorNearby = false) {
    const events = [];

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && playerLocation) {
      this.spawnTimer = this.spawnInterval;
      if (Math.random() < 0.5) {
        this.spawnForBiome(biome, playerLocation, month);
      }
    }

    // Tick flocks
    for (const [id, flock] of this.flocks) {
      flock.tick(dt, fishActivity, predatorNearby);

      // Intel from active flocks near player
      if (playerLocation && flock.active) {
        const dx = flock.location.x - playerLocation.x;
        const dz = flock.location.z - playerLocation.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 200) {
          const intel = flock.getFishFindingIntel();
          if (intel) {
            events.push({
              type: 'bird_intel',
              flockId: flock.id,
              ...intel,
              distance: dist,
            });
            this.emit('intel', { flock, intel });
          }
        }

        // "All birds leave" = predator event
        if (flock.activity === 'fleeing' && dist < 150) {
          events.push({
            type: 'birds_fleeing',
            message: 'Every bird in the area takes off at once. They know something you don\'t. Something big is underneath.',
            predatorWarning: true,
          });
          this.emit('birds_fled', { flock });
        }
      }

      if (!flock.active) {
        this.flocks.delete(id);
      }
    }

    return events;
  }

  /** Get bird-based fish finding report */
  getFishFindingReport(playerLocation) {
    const nearbyFlocks = [...this.flocks.values()].filter(f => {
      if (!f.active) return false;
      const dx = f.location.x - (playerLocation?.x ?? 0);
      const dz = f.location.z - (playerLocation?.z ?? 0);
      return Math.sqrt(dx * dx + dz * dz) < 250;
    });

    if (nearbyFlocks.length === 0) {
      return {
        birdActivity: 'none',
        message: 'No birds working the area. Usually means no fish. Try somewhere else.',
        confidence: 0.6,
        targetSpecies: [],
      };
    }

    const actives = nearbyFlocks.filter(f => f.activity === 'feeding' || f.activity === 'diving');
    if (actives.length === 0) {
      return {
        birdActivity: 'present',
        message: 'Birds in the area but not working. Fish aren\'t active here right now.',
        confidence: 0.4,
        targetSpecies: [],
      };
    }

    // Aggregate intel
    const allSpecies = new Set();
    let maxConfidence = 0;
    const messages = [];

    for (const flock of actives) {
      const intel = flock.getFishFindingIntel();
      if (intel) {
        intel.indicatesSpecies.forEach(s => allSpecies.add(s));
        maxConfidence = Math.max(maxConfidence, intel.confidence);
        messages.push(intel.message);
      }
    }

    return {
      birdActivity: 'working',
      message: 'The birds are WORKING! Multiple flocks are feeding actively.',
      details: messages,
      confidence: maxConfidence,
      targetSpecies: [...allSpecies],
    };
  }

  /** Get eagles sitting on buoys (flavor detail) */
  getEagleBuoys() {
    return [
      { buoy: 'Nav Buoy #3', eagleCount: 2 },
      { buoy: 'Channel Marker 7', eagleCount: 1 },
      { buoy: 'Halibut Hole Marker', eagleCount: 3 },
    ].filter(() => Math.random() < 0.7); // Not always present
  }
}

export default BirdSystem;
