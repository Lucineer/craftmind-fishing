// CraftMind Fishing — Main Entry Point
// Ties everything together into one cohesive fishing system.

// Core
export { FishSpeciesRegistry, RARITY } from './fish-species.js';

// Sitka Sound World
export { SitkaSound, BIOMES, LANDMARKS } from './world/sitka-sound.js';
export { TidalSystem, TIDAL_PHASES } from './world/tides.js';
export { SEWeather, SEASONS, WEATHER_TYPES, SPECIAL_WEATHER } from './world/weather-se.js';
export { SitkaSpeciesRegistry, ALASKA_SPECIES, SPECIES_CATEGORIES } from './world/sitka-species.js';
export { LandmarkSystem, DISCOVERABLE_LOCATIONS } from './world/landmarks.js';
export { MapRenderer } from './world/map-renderer.js';
export { FishAI, FishSchool } from './fish-ai.js';
export { Ecosystem, WaterBody } from './ecosystem.js';
export { FishingRod, RodRegistry } from './rod-system.js';
export { Bait, BaitRegistry } from './bait-system.js';
export { WeatherSystem } from './weather-system.js';
export { BotFisherman, FishingKnowledge } from './bot-fisherman.js';
export { Tournament, TOURNAMENT_MODES } from './tournament.js';
export { Economy, COOKING_RECIPES, ACHIEVEMENTS } from './economy.js';

// Real Alaska Economics
export { allPrices, salmonPrices, groundfishPrices, shellfishPrices, pelagicPrices, priceModifiers, fisherySeasons, calcPrice } from './economy/ex-vessel-prices.js';
export { cfecData, getFishery, getFisheryIds, earningsRange } from './economy/cfec-data.js';
export { PERMIT_TYPES, PermitSystem } from './economy/permit-system.js';
export { FishTicket, FishTicketLedger } from './economy/fish-ticket.js';
export { EXPENSE_CATEGORIES, FINANCIAL_EVENTS, FinancialTracker } from './economy/financial-tracking.js';
export { DOCK_BUYERS, MARKET_EVENTS, AlaskaMarket } from './economy/market-simulation.js';

// Fleet Mechanics (v3)
export { Fleet, FleetMember, FLEET_ROLES } from './fleet.js';
export { FleetCaptain } from './fleet-captain.js';
export { MarineHazard, MarineHazardSystem, HAZARD_TYPES } from './marine-hazards.js';

// Wildlife Systems
export { MarineMammalSystem, MarineMammal, MAMMAL_TYPES } from './wildlife/marine-mammals.js';
export { PredationSystem, PREDATION_TYPES, COUNTERMEASURES } from './wildlife/predation-system.js';
export { WildlifeEncounterSystem, ENCOUNTER_DEFS, RARITY_TIERS } from './wildlife/wildlife-encounters.js';
export { BearSystem, Bear, BEAR_TYPES, BEAR_SAFETY } from './wildlife/bear-system.js';
export { BirdSystem, BirdFlock, BIRD_TYPES } from './wildlife/birds.js';
export { WorkflowEngine, Workflow, WorkflowStep, WORKFLOW_STATUS } from './workflow-engine.js';
export { FishingCompany, PortFacility, CompetitorFleet } from './fishing-company.js';
export { Boat, BOAT_TIERS, EQUIPMENT_TYPES } from './boat.js';
export { Market, NPCCustomer } from './market.js';
export { Contract, ContractBoard, CONTRACT_TYPES } from './contracts.js';
export { Tavern, CrewMember, PERSONALITIES } from './crew-recruitment.js';
export { SafetyNet } from './safety-net.js';

// Fishing Methods System
export { FishingMethod, FishingMethodRegistry, FISHING_METHODS, BaitCastingMethod, CrabPotMethod, LobsterTrapMethod, LongliningMethod, TrollingMethod, TrawlingMethod, FreeDivingMethod, SCUBADivingMethod, JiggingMethod, IceFishingMethod, SurfCastingMethod, SpearfishingMethod } from './fishing-methods.js';
export { GearItem, GearCraftingSystem, RECIPES, TIER_MULTIPLIERS, TIER_ORDER } from './gear-crafting.js';
export { WeatherFishingSystem, WEATHER_METHOD_MAP, SEASON_METHOD_MAP } from './weather-fishing.js';
export { SkillTree, SkillSystem, METHOD_MASTERY, SKILL_MILESTONES } from './skill-trees.js';

// Layered Cognition Systems
export { BehaviorScript, DefaultScripts } from './behavior-script.js';
export { BoidsEngine, FishEntity, WaterCurrent, Obstacle, SpeciesModifiers } from './boids-engine.js';
export { NoveltyDetector } from './novelty-detector.js';
export { generateScriptModification, compressContext, scoreModification } from './script-writer.js';
export { EmergenceTracker } from './emergence-tracker.js';
export { GameTheorySim, TragedyOfTheCommons, PrisonersDilemma, OptimalForaging, EvolutionaryArmsRace } from './game-theory-sim.js';
export { BiologyLessons } from './biology-lessons.js';
export { AttentionSystem } from './attention-system.js';
export { TipsSystem } from './tips.js';
export { FishingLog } from './fishing-log.js';

import { FishSpeciesRegistry } from './fish-species.js';
import { Ecosystem, WaterBody } from './ecosystem.js';
import { WeatherSystem } from './weather-system.js';
import { BotFisherman } from './bot-fisherman.js';
import { FishingRod } from './rod-system.js';
import { Bait } from './bait-system.js';
import { Tournament } from './tournament.js';
import { Economy } from './economy.js';
import { BoidsEngine } from './boids-engine.js';
import { NoveltyDetector } from './novelty-detector.js';
import { EmergenceTracker } from './emergence-tracker.js';
import { BiologyLessons } from './biology-lessons.js';

/**
 * CraftMind Fishing — the complete system with layered cognition.
 */
export class CraftMindFishing {
  constructor(options = {}) {
    this.ecosystem = options.ecosystem ?? new Ecosystem(options.ecosystemOpts);
    this.weather = options.weather ?? new WeatherSystem();
    this.economy = options.economy ?? new Economy(options.economyOpts);
    this.biology = options.biology ?? new BiologyLessons();
    this.boids = options.boids ?? new BoidsEngine(options.boidsOpts);
    this.noveltyDetector = this.ecosystem.noveltyDetector;
    this.emergenceTracker = this.ecosystem.emergenceTracker;
    this.bots = [];
  }

  /** Create a new water body in the ecosystem */
  addWater(id, biome, opts = {}) {
    const wb = new WaterBody(id, biome, opts);
    this.ecosystem.addWaterBody(wb);
    return wb;
  }

  /** Create a bot fisherman */
  createBot(name, options = {}) {
    const bot = new BotFisherman(name, {
      ...options,
      attentionSystem: options.attentionSystem,
    });
    this.bots.push(bot);
    return bot;
  }

  /** Run one simulation tick */
  tick(dt = 60000) {
    this.weather.tick(dt);
    this.ecosystem.tick(dt);

    // Update biology observations
    this.biology.observe(this.ecosystem.biologyContext);
  }

  /** Quick demo: run a fishing session */
  runDemo(casts = 20) {
    this.addWater('village_pond', 'plains', { name: 'Village Pond', maxDepth: 5 });
    this.addWater('nether_pool', 'nether_wastes', { name: 'Nether Lava Pool', maxDepth: 3 });

    const bot = this.createBot('DemoBot', {
      rod: new FishingRod('diamond', { lure: 3, luck_of_the_sea: 2 }),
      baitInventory: [
        new Bait('worm', { stackSize: 64 }),
        new Bait('glow_berries', { stackSize: 32 }),
        new Bait('blazerod_shavings', { stackSize: 16 }),
      ],
    });

    const results = [];
    const waterIds = ['village_pond', 'nether_pool'];

    for (let i = 0; i < casts; i++) {
      this.tick(60000);
      const wid = waterIds[Math.floor(Math.random() * waterIds.length)];
      const timeOfDay = this.ecosystem.getTimeOfDay();
      bot.selectBestBait(this.ecosystem.getWaterBody(wid)?.biome, timeOfDay);
      const result = bot.fish(this.ecosystem, wid, this.weather, timeOfDay);
      if (result.success) {
        this.economy.trackCatch(result.caught);
        const sale = this.economy.sell(result.caught);
        result.saleValue = sale.value;
      }
      results.push(result);
    }

    return {
      botStats: bot.getStats(),
      economy: this.economy.getMarketSummary(),
      catches: results.filter(r => r.success),
      misses: results.filter(r => !r.success).length,
      weather: this.weather.toString(),
      ecosystem: this.ecosystem.getStatus(),
      emergence: this.emergenceTracker.getDiscoveries(),
      biology: this.biology.getProgress(),
    };
  }

  /** Get full status */
  getStatus() {
    return {
      speciesCount: FishSpeciesRegistry.count,
      waterBodies: this.ecosystem.getStatus(),
      weather: this.weather.toString(),
      economy: this.economy.getMarketSummary(),
      bots: this.bots.map(b => b.getStats()),
      emergence: this.emergenceTracker.getDiscoveryProgress(),
      biology: this.biology.getProgress(),
      novelty: this.noveltyDetector.getMetricsSummary(),
    };
  }
}

export default CraftMindFishing;
