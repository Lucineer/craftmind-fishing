// CraftMind Fishing — Dynamic Ecosystem (Rewrite with Emergence & Game Theory)
// Fish populations, predator-prey, seasons, emergence tracking, game theory sims.

import { FishSpeciesRegistry } from './fish-species.js';
import { EmergenceTracker } from './emergence-tracker.js';
import { GameTheorySim } from './game-theory-sim.js';
import { NoveltyDetector } from './novelty-detector.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export class WaterBody {
  constructor(id, biome, options = {}) {
    this.id = id;
    this.biome = biome;
    this.name = options.name ?? id;
    this.maxDepth = options.maxDepth ?? 20;
    this.surfaceArea = options.surfaceArea ?? 100;
    this.waterQuality = options.waterQuality ?? 100;
    this.temperature = options.temperature ?? 20;
    this.createdAt = Date.now();
    this.lastTick = Date.now();

    // Population: speciesId → count
    this.populations = new Map();

    // Population history for emergence detection
    this.populationHistory = new Map(); // speciesId → [count over time]

    // Seed initial populations
    const availableSpecies = FishSpeciesRegistry.forBiome(biome);
    for (const sp of availableSpecies) {
      const basePop = sp.rarity === 'Common' ? 40 :
                      sp.rarity === 'Uncommon' ? 20 :
                      sp.rarity === 'Rare' ? 8 :
                      sp.rarity === 'Epic' ? 3 : 1;
      this.populations.set(sp.id, basePop);
      this.populationHistory.set(sp.id, [basePop]);
    }

    // Fishing pressure tracking (for game theory)
    this.fishingPressure = 0;          // 0-1
    this.fishingPressureHistory = [];
    this.activeFishermen = new Set();
  }

  getPopulation(speciesId) {
    return this.populations.get(speciesId) ?? 0;
  }

  addPopulation(speciesId, amount) {
    const current = this.populations.get(speciesId) ?? 0;
    const newPop = Math.max(0, current + amount);
    this.populations.set(speciesId, newPop);

    // Track history
    const history = this.populationHistory.get(speciesId) ?? [];
    history.push(newPop);
    if (history.length > 200) history.shift();
    this.populationHistory.set(speciesId, history);

    return newPop;
  }

  getTotalPopulation() {
    let total = 0;
    for (const count of this.populations.values()) total += count;
    return total;
  }

  /** Record fishing activity at this water body */
  recordFishing(fishermanId, fishCaught) {
    this.activeFishermen.add(fishermanId);
    this.fishingPressure = Math.min(1, this.activeFishermen.size / 5);
    this.fishingPressureHistory.push({
      pressure: this.fishingPressure,
      fishermen: this.activeFishermen.size,
      timestamp: Date.now(),
    });
    if (this.fishingPressureHistory.length > 100) this.fishingPressureHistory.shift();
  }

  /** Get current depth distribution for emergence tracking */
  getDepthDistribution() {
    // Simplified: deeper species have lower average depth, surface fish higher
    let totalDepth = 0, count = 0;
    for (const [speciesId, pop] of this.populations) {
      const sp = FishSpeciesRegistry.get(speciesId);
      if (!sp || pop <= 0) continue;
      const avgDepth = (sp.preferredDepth[0] + sp.preferredDepth[1]) / 2;
      totalDepth += avgDepth * pop;
      count += pop;
    }
    return count > 0 ? { avgDepth: totalDepth / count } : { avgDepth: 10 };
  }
}

export class Ecosystem {
  constructor(options = {}) {
    this.waterBodies = new Map();
    this.saveDir = options.saveDir ?? './data/persistence';
    this.dayCycle = options.dayCycle ?? 24000;
    this.seasonCycle = options.seasonCycle ?? 7;
    this.inGameDay = options.inGameDay ?? 0;
    this.tickCount = 0;

    // New systems
    this.emergenceTracker = options.emergenceTracker ?? new EmergenceTracker();
    this.gameTheory = options.gameTheory ?? new GameTheorySim();
    this.noveltyDetector = options.noveltyDetector ?? new NoveltyDetector();

    // Observation context for biology lessons
    this.biologyContext = {};
  }

  addWaterBody(waterBody) {
    this.waterBodies.set(waterBody.id, waterBody);
    return this;
  }

  getWaterBody(id) {
    return this.waterBodies.get(id) ?? null;
  }

  /** Simulate one ecosystem tick */
  tick(dt = 60000) {
    this.tickCount++;
    this.inGameDay += dt / this.dayCycle;

    for (const [waterId, water] of this.waterBodies) {
      const popBefore = water.getTotalPopulation();
      this._tickPopulation(water, dt);
      this._tickPredation(water, dt);
      this._tickWaterQuality(water, dt);
      const popAfter = water.getTotalPopulation();

      // Feed emergence tracker
      this._feedEmergence(water, waterId, dt);

      // Feed novelty detector
      this._feedNovelty(water, dt);

      // Feed game theory
      this._feedGameTheory(water, waterId, dt);
    }

    // Feed biology observation context
    this._updateBiologyContext();
  }

  _tickPopulation(water, dt) {
    const season = this.getSeason();
    const factor = dt / 60000;

    for (const [speciesId, pop] of water.populations) {
      const species = FishSpeciesRegistry.get(speciesId);
      if (!species) continue;

      const baseRespawn = species.rarity === 'Common' ? 0.3 :
                          species.rarity === 'Uncommon' ? 0.1 :
                          species.rarity === 'Rare' ? 0.03 :
                          species.rarity === 'Epic' ? 0.01 : 0.002;

      let seasonMult = 1.0;
      if (species.preferredTime.includes('night') && (season === 'winter' || season === 'autumn')) seasonMult = 1.3;
      if (species.biomes.includes('frozen_ocean') && season === 'winter') seasonMult = 2.0;

      const qualityMult = water.waterQuality / 100;

      // Fishing pressure reduces growth
      const pressurePenalty = 1 - water.fishingPressure * 0.5;

      const capacity = species.rarity === 'Common' ? 60 :
                       species.rarity === 'Uncommon' ? 30 :
                       species.rarity === 'Rare' ? 12 :
                       species.rarity === 'Epic' ? 5 : 2;
      const growthRate = baseRespawn * seasonMult * qualityMult * pressurePenalty * (1 - pop / capacity) * factor;

      water.addPopulation(speciesId, growthRate);
    }
  }

  _tickPredation(water, dt) {
    const factor = dt / 60000;
    for (const [speciesId] of water.populations) {
      const sp = FishSpeciesRegistry.get(speciesId);
      if (!sp?.predators?.length) continue;

      for (const predatorId of sp.predators) {
        const predatorPop = water.getPopulation(predatorId);
        if (predatorPop <= 0) continue;
        const predation = predatorPop * 0.002 * factor;
        water.addPopulation(speciesId, -predation);
      }
    }
  }

  _tickWaterQuality(water, dt) {
    // Natural recovery + fishing pressure penalty
    water.waterQuality = Math.min(100, water.waterQuality + dt * 0.0005 - water.fishingPressure * dt * 0.0001);
    water.waterQuality = Math.max(0, water.waterQuality);
  }

  /** Feed emergence tracker with current state */
  _feedEmergence(water, waterId, dt) {
    // Population data for ecological pattern detection
    const populations = {};
    for (const [speciesId, history] of water.populationHistory) {
      populations[speciesId] = history;
    }

    this.emergenceTracker.observe({
      populations,
      depthDistribution: water.getDepthDistribution(),
      schoolPositions: {}, // Filled by FishAI layer
      fleeEvents: [],
      fishingActivity: [],
      scriptChanges: [],
    });
  }

  /** Feed novelty detector with key metrics */
  _feedNovelty(water, dt) {
    // Population by rarity
    const rarityPops = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    for (const [speciesId, pop] of water.populations) {
      const sp = FishSpeciesRegistry.get(speciesId);
      if (sp) rarityPops[sp.rarity.toLowerCase()] = (rarityPops[sp.rarity.toLowerCase()] ?? 0) + pop;
    }

    for (const [rarity, pop] of Object.entries(rarityPops)) {
      this.noveltyDetector.observe(`population_${rarity}`, pop);
    }

    this.noveltyDetector.observe('water_quality_avg', water.waterQuality);
    this.noveltyDetector.observe('fishing_pressure', water.fishingPressure * 100);
    this.noveltyDetector.observe('school_size_avg', water.getTotalPopulation() / Math.max(1, [...water.populations.values()].filter(p => p > 0).length));
  }

  /** Feed game theory simulation */
  _feedGameTheory(water, waterId, dt) {
    // Check for tragedy of commons
    for (const [fishermanId] of water.activeFishermen) {
      this.gameTheory.tragedy.recordActivity(waterId, fishermanId, 1, water.getTotalPopulation());
    }
  }

  /** Apply hazard effects to a water body (v3 fleet mechanics). */
  applyHazardEffects(waterId, hazard) {
    const water = this.waterBodies.get(waterId);
    if (!water) return;

    if (!hazard.affectsFish) return;

    switch (hazard.type) {
      case 'shark_pack':
        // Sharks scatter fish and reduce population slightly
        for (const [speciesId] of water.populations) {
          water.addPopulation(speciesId, -Math.random() * 2);
        }
        this.noveltyDetector.forceEvent('important', 'hazard_shark_pack', `Shark pack at (${hazard.location.x}, ${hazard.location.z})`, { waterId });
        break;

      case 'elder_guardian':
        // Guardian presence significantly reduces nearby populations
        for (const [speciesId] of water.populations) {
          water.addPopulation(speciesId, -Math.random() * 5);
        }
        this.noveltyDetector.forceEvent('critical', 'hazard_guardian', `Elder Guardian detected!`, { waterId });
        break;

      case 'whale_breach':
        // Stuns fish but doesn't reduce population — opportunity
        this.noveltyDetector.observeEvent('hazard_opportunity', {
          description: `Whale breach near ${waterId} — fish stunned, easy catch!`,
          priority: 'interesting',
        });
        break;

      case 'coral_storm':
        // Damages coral habitat — long-term population reduction
        water.waterQuality = Math.max(0, water.waterQuality - 10);
        for (const [speciesId] of water.populations) {
          water.addPopulation(speciesId, -Math.random() * 3);
        }
        break;

      case 'bioluminescent':
        // Attracts deep-sea species — temporary population boost
        for (const [speciesId] of water.populations) {
          const sp = FishSpeciesRegistry.get(speciesId);
          if (sp && sp.preferredDepth[0] > 15) {
            water.addPopulation(speciesId, Math.random() * 2);
          }
        }
        this.noveltyDetector.forceEvent('interesting', 'bioluminescent', 'Rare deep-sea fish surfacing!', { waterId });
        break;

      case 'leviathan':
        // Extreme — massive population displacement
        for (const [speciesId] of water.populations) {
          water.addPopulation(speciesId, -Math.random() * 10);
        }
        this.noveltyDetector.forceEvent('critical', 'leviathan', `⚠️ LEVIATHAN at (${hazard.location.x}, ${hazard.location.z})!`, { waterId });
        break;
    }
  }

  /** Update biology observation context */
  _updateBiologyContext() {
    for (const [, water] of this.waterBodies) {
      const totalPop = water.getTotalPopulation();
      const activeFishermen = water.activeFishermen.size;

      // Carrying capacity detection
      const capacity = 200; // rough estimate
      this.biologyContext.resourcesLimited = totalPop >= capacity * 0.9;

      // Pressure effects
      if (activeFishermen >= 3) {
        this.biologyContext.speciesWentExtinct = [...water.populations.values()].some(p => p <= 0);
      }
    }
  }

  pollute(waterId, amount) {
    const water = this.waterBodies.get(waterId);
    if (water) water.waterQuality = Math.max(0, water.waterQuality - amount);
  }

  getSeason() {
    const day = Math.floor(this.inGameDay) % (this.seasonCycle * 4);
    if (day < this.seasonCycle) return 'spring';
    if (day < this.seasonCycle * 2) return 'summer';
    if (day < this.seasonCycle * 3) return 'autumn';
    return 'winter';
  }

  getTimeOfDay() {
    const progress = this.inGameDay % 1;
    if (progress < 0.25) return 'dawn';
    if (progress < 0.5) return 'day';
    if (progress < 0.75) return 'dusk';
    return 'night';
  }

  catchFish(waterId, speciesId) {
    const water = this.waterBodies.get(waterId);
    if (!water || water.getPopulation(speciesId) <= 0) return false;
    water.addPopulation(speciesId, -1);
    return true;
  }

  getStatus() {
    const bodies = [];
    for (const [, water] of this.waterBodies) {
      bodies.push({
        id: water.id, biome: water.biome,
        waterQuality: Math.round(water.waterQuality),
        totalPopulation: Math.round(water.getTotalPopulation()),
        fishingPressure: Math.round(water.fishingPressure * 100) + '%',
        season: this.getSeason(),
        timeOfDay: this.getTimeOfDay(),
      });
    }
    return {
      day: this.inGameDay, season: this.getSeason(),
      timeOfDay: this.getTimeOfDay(), bodies,
      emergence: this.emergenceTracker.getDiscoveryProgress(),
      gameTheory: this.gameTheory.getSummary(),
      novelty: this.noveltyDetector.getMetricsSummary(),
    };
  }

  save() {
    if (!existsSync(this.saveDir)) mkdirSync(this.saveDir, { recursive: true });
    const state = {
      inGameDay: this.inGameDay, tickCount: this.tickCount,
      waterBodies: [...this.waterBodies.entries()].map(([id, w]) => ({
        id, biome: w.biome, name: w.name, maxDepth: w.maxDepth,
        surfaceArea: w.surfaceArea, waterQuality: w.waterQuality,
        temperature: w.temperature, populations: [...w.populations.entries()],
        populationHistory: [...w.populationHistory.entries()].map(([k, v]) => [k, v.slice(-50)]),
        fishingPressure: w.fishingPressure,
      })),
    };
    writeFileSync(`${this.saveDir}/ecosystem.json`, JSON.stringify(state, null, 2));
  }

  load() {
    try {
      const raw = readFileSync(`${this.saveDir}/ecosystem.json`, 'utf-8');
      const state = JSON.parse(raw);
      this.inGameDay = state.inGameDay ?? 0;
      this.tickCount = state.tickCount ?? 0;
      this.waterBodies.clear();
      for (const wd of state.waterBodies ?? []) {
        const wb = new WaterBody(wd.id, wd.biome, wd);
        wb.waterQuality = wd.waterQuality ?? 100;
        wb.populations = new Map(wd.populations);
        wb.populationHistory = new Map(wd.populationHistory ?? []);
        wb.fishingPressure = wd.fishingPressure ?? 0;
        this.waterBodies.set(wb.id, wb);
      }
      return true;
    } catch { return false; }
  }
}

export default Ecosystem;
