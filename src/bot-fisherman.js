// CraftMind Fishing — Bot Fisherman (Rewrite with Model-Driven Scripts)
// AI bot with layered cognition: reflex scripts + model-driven adaptation.

import { FishSpeciesRegistry } from './fish-species.js';
import { FishAI, FishSchool } from './fish-ai.js';
import { Ecosystem, WaterBody } from './ecosystem.js';
import { FishingRod } from './rod-system.js';
import { Bait } from './bait-system.js';
import { WeatherSystem } from './weather-system.js';
import { BehaviorScript, DefaultScripts } from './behavior-script.js';
import { AttentionSystem } from './attention-system.js';
import { generateScriptModification, compressContext } from './script-writer.js';
import { GameTheorySim } from './game-theory-sim.js';

export class FishingKnowledge {
  constructor() {
    this.entries = new Map();
  }

  record(catchData) {
    const key = `${catchData.baitId}|${catchData.speciesId}|${catchData.biome}|${catchData.timeOfDay}`;
    const entry = this.entries.get(key) ?? {
      bait: catchData.baitId, species: catchData.speciesId,
      biome: catchData.biome, time: catchData.timeOfDay,
      weather: catchData.weather, catches: 0, attempts: 0,
    };
    entry.catches++;
    this.entries.set(key, entry);
  }

  recordMiss(catchData) {
    const key = `${catchData.baitId}|null|${catchData.biome}|${catchData.timeOfDay}`;
    const entry = this.entries.get(key) ?? {
      bait: catchData.baitId, species: null,
      biome: catchData.biome, time: catchData.timeOfDay,
      weather: catchData.weather, catches: 0, attempts: 0,
    };
    entry.attempts++;
    this.entries.set(key, entry);
  }

  getBestBait(speciesId, biome) {
    let best = null, bestRate = 0;
    for (const [, entry] of this.entries) {
      if (entry.species !== speciesId || entry.biome !== biome) continue;
      const rate = entry.catches / Math.max(1, entry.catches + entry.attempts);
      if (rate > bestRate) { bestRate = rate; best = entry; }
    }
    return best;
  }

  merge(other) {
    for (const [key, entry] of other.entries) {
      const existing = this.entries.get(key);
      if (existing) {
        existing.catches += entry.catches;
        existing.attempts += entry.attempts;
      } else {
        this.entries.set(key, { ...entry });
      }
    }
  }

  get size() { return this.entries.size; }
}

/**
 * Bot Fisherman with layered cognition.
 */
export class BotFisherman {
  constructor(name, options = {}) {
    this.name = name;
    this.rod = options.rod ?? new FishingRod('iron');
    this.baitInventory = options.baitInventory ?? [new Bait('worm', { stackSize: 64 }), new Bait('glow_berries', { stackSize: 32 })];
    this.knowledge = options.knowledge ?? new FishingKnowledge();
    this.totalCatch = 0;
    this.totalMiss = 0;
    this.caughtSpecies = new Set();
    this.inventory = [];
    this.currentBait = this.baitInventory[0] ?? null;
    this.currentWaterBodyId = options.waterBodyId ?? null;
    this.state = 'idle';

    // Behavior script for fisherman
    this.script = options.script ?? DefaultScripts.fisherman();
    this.attentionSystem = options.attentionSystem ?? new AttentionSystem();

    // Model layer
    this.lastModelCall = 0;
    this.modelInterval = options.modelInterval ?? 50000;
    this.eventLog = [];
    this.modelTaskRunning = false;

    // Game theory: cooperation tracking
    this.lastAction = null; // 'cooperate' | 'defect'

    // Fleet membership (v3)
    this.fleetId = options.fleetId ?? null;
    this.fleetRole = options.fleetRole ?? null; // 'captain'|'scout'|'tanker'|'support'|'specialist'
    this.fleetStatus = options.fleetStatus ?? 'idle'; // idle, fishing, traveling, in_danger, returning

    // Performance tracking for script evaluation
    this.performanceHistory = [];
    this.currentSpotCatches = 0;
    this.currentSpotMisses = 0;
  }

  /** Get context for behavior script evaluation */
  _getScriptContext() {
    return {
      lowOnBait: this.baitInventory.every(b => b.stackSize <= 2) || !this.currentBait?.stackSize,
      rodDamaged: this.rod.broken || this.rod.currentDurability < this.rod.durability * 0.2,
      goodWeather: this._weather?.currentWeather === 'clear' || this._weather?.currentWeather === 'rain',
      badWeather: this._weather?.isThundering,
      spotDepleted: this.currentSpotCatches < 3 && this.currentSpotMisses > 8,
      rareFishSeen: this._lastSpeciesRarity === 'Rare' || this._lastSpeciesRarity === 'Epic' || this._lastSpeciesRarity === 'Legendary',
      isDawn: this._timeOfDay === 'dawn',
      isDusk: this._timeOfDay === 'dusk',
      isNight: this._timeOfDay === 'night',
      isDay: this._timeOfDay === 'day',
    };
  }

  /** Select best bait using knowledge + script */
  selectBestBait(biome, timeOfDay) {
    let bestBait = null, bestScore = 0;
    for (const bait of this.baitInventory) {
      if (bait.isExpired() || bait.stackSize <= 0) continue;
      const score = bait.getEffectiveness('*') * bait.getFreshness();
      if (score > bestScore) { bestScore = score; bestBait = bait; }
    }
    if (bestBait) this.currentBait = bestBait;

    // Check if script wants to change bait
    const ctx = this._getScriptContext();
    const action = this.script.evaluate(ctx);
    if (action === 'change_bait_night' && this._timeOfDay === 'night') {
      const nightBait = this.baitInventory.find(b => b.id === 'glow_berries' && b.stackSize > 0);
      if (nightBait) this.currentBait = nightBait;
    } else if (action === 'change_bait_deep') {
      const deepBait = this.baitInventory.find(b => b.id === 'blazerod_shavings' && b.stackSize > 0);
      if (deepBait) this.currentBait = deepBait;
    }

    return this.currentBait;
  }

  /** Attempt one fishing cycle */
  fish(ecosystem, waterBodyId, weather, timeOfDay) {
    this._weather = weather;
    this._timeOfDay = timeOfDay;

    const water = ecosystem.getWaterBody(waterBodyId);
    if (!water) return { success: false, reason: 'no_water' };

    this.currentWaterBodyId = waterBodyId;

    // Check behavior script for strategic decisions
    const scriptCtx = this._getScriptContext();
    const scriptAction = this.script.evaluate(scriptCtx);

    if (scriptAction === 'move_spot') {
      this.currentSpotCatches = 0;
      this.currentSpotMisses = 0;
      this._logEvent('Moved to new spot (script decision: spot depleted)');
      // Continue fishing at "new" spot
    }
    if (scriptAction === 'rest') {
      return { success: false, reason: 'resting', scriptAction };
    }

    const bait = this.currentBait;
    if (!bait || bait.stackSize <= 0) return { success: false, reason: 'no_bait' };
    if (this.rod.broken) return { success: false, reason: 'rod_broken' };

    const biteMult = weather.getBiteMultiplier(timeOfDay);
    const lureBonus = bait.getLure();
    const rarityBoost = this.rod.getRarityBoost() + (lureBonus?.effect === 'rarity_boost' ? lureBonus.value : 0);

    // Select species (consider ecosystem population)
    const species = FishSpeciesRegistry.select({
      biome: water.biome, timeOfDay,
      depth: Math.random() * water.maxDepth, bait: bait.id,
    });

    if (!species) {
      this.totalMiss++;
      this.currentSpotMisses++;
      bait.useOne();
      this.knowledge.recordMiss({ baitId: bait.id, biome: water.biome, timeOfDay, weather: weather.currentWeather });
      return { success: false, reason: 'no_bite' };
    }

    this._lastSpeciesRarity = species.rarity;

    // Fish AI decides (simplified — uses school stress from ecosystem)
    const stressLevel = water.fishingPressure;
    const baitData = { effectiveness: { [species.id]: bait.getEffectiveness(species.id), default: 0.2 } };
    const baitEffectiveness = bait.getEffectiveness(species.id);
    const biteChance = baitEffectiveness * biteMult * (1 - stressLevel * 0.5);

    // Track for game theory
    ecosystem.gameTheory.foraging.record({
      species: species.id, baitType: bait.id,
      approached: true, bit: Math.random() < biteChance,
      energyCost: 1, caloricGain: species.baseValue,
    });

    if (Math.random() > biteChance) {
      this.totalMiss++;
      this.currentSpotMisses++;
      bait.useOne();
      this.knowledge.recordMiss({ baitId: bait.id, biome: water.biome, timeOfDay, weather: weather.currentWeather });
      water.recordFishing(this.name, 0);
      return { success: false, reason: 'fish_fled', species: species.name };
    }

    // Caught!
    const size = FishSpeciesRegistry.randomSize(species);
    const weight = size * species.avgWeight;
    const broke = this.rod.applyDamage(Math.ceil(species.fightStrength / 3));

    const caught = {
      species, size: Math.round(size * 100) / 100,
      weight: Math.round(weight * 100) / 100,
      caughtAt: Date.now(), baitUsed: bait.id,
      weather: weather.currentWeather, timeOfDay,
    };

    this.inventory.push(caught);
    this.totalCatch++;
    this.currentSpotCatches++;
    this.caughtSpecies.add(species.id);
    bait.useOne();
    ecosystem.catchFish(waterBodyId, species.id);
    water.recordFishing(this.name, 1);
    this.knowledge.record({ baitId: bait.id, speciesId: species.id, biome: water.biome, timeOfDay, weather: weather.currentWeather });

    this.script.trackOutcome(1); // good for fisherman

    // Track technique effectiveness for arms race
    ecosystem.gameTheory.armsRace.recordEffectiveness(`${bait.id}_${water.biome}`, 1);

    this._logEvent(`Caught ${species.name} (${weight.toFixed(1)}kg) using ${bait.name}`);

    return { success: true, caught, rodBroke: broke };
  }

  /**
   * Model update — bot reviews strategy and modifies its own script.
   */
  async modelUpdate(gameTheory = null) {
    if (this.modelTaskRunning) return false;
    if (Date.now() - this.lastModelCall < this.modelInterval) return false;

    this.modelTaskRunning = true;

    try {
      const totalAttempts = this.totalCatch + this.totalMiss;
      const successRate = totalAttempts > 0 ? this.totalCatch / totalAttempts : 0;

      const metrics = {
        totalCatch: this.totalCatch,
        totalMiss: this.totalMiss,
        successRate: Math.round(successRate * 100) + '%',
        speciesCaught: this.caughtSpecies.size,
        currentSpotEfficiency: this.currentSpotCatches / Math.max(1, this.currentSpotCatches + this.currentSpotMisses),
        rodCondition: Math.round((this.rod.currentDurability / this.rod.durability) * 100) + '%',
        baitRemaining: this.baitInventory.reduce((s, b) => s + b.stackSize, 0),
      };

      // Add game theory insights
      if (gameTheory) {
        const armsRaces = gameTheory.armsRace.getActiveArmsRaces();
        if (armsRaces.length > 0) {
          metrics.activeArmsRaces = armsRaces;
        }
        const optForaging = gameTheory.foraging.detectOptimalForaging();
        if (optForaging) {
          metrics.optimalForaging = optForaging;
        }
      }

      const diff = await generateScriptModification({
        entityType: 'fisherman',
        speciesId: this.name,
        currentRules: this.script.toModelFormat(),
        contextSummary: compressContext(this.eventLog, 10),
        metrics,
      });

      if (diff) {
        this.script.checkpoint();
        const result = this.script.applyDiff(diff);
        this.script.commit();
        this._logEvent(`Strategy updated: ${diff.reasoning ?? 'model decision'}`);
        this.lastModelCall = Date.now();
        this.modelTaskRunning = false;
        return true;
      }

      this.lastModelCall = Date.now();
      this.modelTaskRunning = false;
      return false;
    } catch (err) {
      console.warn(`[BotFisherman] Model update error for ${this.name}: ${err.message}`);
      this.script.rollback();
      this.modelTaskRunning = false;
      return false;
    }
  }

  /** Simulate N fishing attempts */
  fishSession(ecosystem, waterBodyId, count = 10) {
    const weather = new WeatherSystem();
    const results = [];
    for (let i = 0; i < count; i++) {
      weather.tick(60000);
      const timeOfDay = i % 4 === 0 ? 'dawn' : i % 4 === 1 ? 'day' : i % 4 === 2 ? 'dusk' : 'night';
      this.selectBestBait(ecosystem.getWaterBody(waterBodyId)?.biome, timeOfDay);
      const result = this.fish(ecosystem, waterBodyId, weather, timeOfDay);
      results.push(result);
      if (this.rod.broken) break;
    }
    return results;
  }

  getStats() {
    return {
      name: this.name,
      rod: this.rod.toString(),
      totalCatch: this.totalCatch,
      totalMiss: this.totalMiss,
      catchRate: this.totalCatch + this.totalMiss > 0
        ? Math.round((this.totalCatch / (this.totalCatch + this.totalMiss)) * 100) + '%' : '0%',
      speciesCaught: this.caughtSpecies.size,
      knowledgeEntries: this.knowledge.size,
      inventorySize: this.inventory.length,
      scriptRules: this.script.rules.length,
      lastScriptAction: this._lastScriptAction,
    };
  }

  _logEvent(summary) {
    this.eventLog.push({ summary, timestamp: Date.now() });
    if (this.eventLog.length > 50) this.eventLog.shift();
  }
}

export default BotFisherman;
