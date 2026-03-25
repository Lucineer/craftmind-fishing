// CraftMind Fishing — Game Engine
// The main orchestrator that ties all systems into a living, breathing world.

import { SitkaSound } from '../world/sitka-sound.js';
import { ALASKA_SPECIES } from '../world/sitka-species.js';
import { SEWeather } from '../world/weather-se.js';
import { TidalSystem } from '../world/tides.js';
import { MarineMammalSystem } from '../wildlife/marine-mammals.js';
import { PredationSystem } from '../wildlife/predation-system.js';
import { WildlifeEncounterSystem } from '../wildlife/wildlife-encounters.js';
import { BearSystem } from '../wildlife/bear-system.js';
import { BirdSystem } from '../wildlife/birds.js';
import { MarineRadio } from '../town/radio-system.js';
import { SitkaHarbor } from '../town/harbor-system.js';
import { TownEventManager } from '../town/town-events.js';
import { NPCS } from '../town/sitka-npcs.js';
import { AlaskaMarket } from '../economy/market-simulation.js';
import { FishTicketLedger } from '../economy/fish-ticket.js';
import { PermitSystem } from '../economy/permit-system.js';
import { FinancialTracker } from '../economy/financial-tracking.js';
import { allPrices } from '../economy/ex-vessel-prices.js';
import { getRegulations, SPORT_REGS, EMERGENCY_ORDER_TYPES } from '../regulations/alaska-regulations.js';
import { GameWarden } from '../regulations/game-warden.js';
import { GearShop } from '../gear/gear-shop.js';
import { ALL_GEAR } from '../gear/alaska-gear.js';
import { ALASKA_BOAT_TYPES } from '../boats/alaska-boats.js';
import { QUESTS } from '../quests/fishing-quests.js';

// ═══════════════════════════════════════════════════════════════
// PLAYER STATE
// ═══════════════════════════════════════════════════════════════

function createDefaultPlayer() {
  return {
    name: 'Captain',
    gold: 500,
    balance: 500,
    boat: null,
    gear: [],
    permits: [],
    location: { x: 10, y: 62, z: 90, biome: 'sheltered_sound' },
    isFishing: false,
    fishingState: null,
    isSailing: false,
    inventory: [],
    reputation: 0,
    karma: 0,
    statistics: {
      totalFishCaught: 0,
      totalWeightCaught: 0,
      biggestFish: null,
      tripsCompleted: 0,
      totalEarnings: 0,
      daysFished: 0,
      speciesCaught: new Set(),
    },
    activeQuests: [],
    completedQuests: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// METHOD ↔ BIOME COMPATIBILITY
// ═══════════════════════════════════════════════════════════════

export const METHOD_BIOME_RULES = {
  halibut_longlining: {
    biomes: ['open_ocean', 'rocky_pinnacles', 'sheltered_sound'],
    minDepth: 60,
    maxSeaState: 4,
    requiredGear: ['circle_hook'],
    requiredPermit: 'halibut',
    species: ['halibut', 'sablefish', 'pacific_cod', 'yelloweye_rockfish'],
  },
  salmon_trolling: {
    biomes: ['sheltered_sound', 'open_ocean', 'river_estuary', 'kelp_forest'],
    minDepth: 10,
    maxSeaState: 4,
    requiredGear: ['hoochie'],
    requiredPermit: 'salmon',
    species: ['king_salmon', 'coho_salmon', 'pink_salmon', 'chum_salmon', 'sockeye_salmon'],
  },
  purse_seining: {
    biomes: ['sheltered_sound', 'river_estuary', 'open_ocean'],
    minDepth: 20,
    maxSeaState: 5,
    requiredGear: [],
    requiredPermit: 'seine',
    minBoatType: 'seiner',
    species: ['pink_salmon', 'sockeye_salmon', 'chum_salmon', 'coho_salmon', 'herring'],
  },
  river_fishing: {
    biomes: ['freshwater_river', 'river_estuary'],
    minDepth: 1,
    maxSeaState: 2,
    requiredGear: [],
    requiredPermit: 'sport_fishing',
    species: ['king_salmon', 'coho_salmon', 'pink_salmon', 'dolly_varden', 'cutthroat_trout', 'steelhead'],
  },
  pot_dungeness: {
    biomes: ['sheltered_sound', 'tidal_flats', 'river_estuary'],
    minDepth: 10,
    maxSeaState: 3,
    requiredGear: [],
    requiredPermit: 'crab',
    species: ['dungeness_crab'],
  },
  pot_shrimp: {
    biomes: ['sheltered_sound', 'rocky_pinnacles'],
    minDepth: 150,
    maxSeaState: 3,
    requiredGear: [],
    requiredPermit: 'shrimp',
    species: ['shrimp'],
  },
  dive_fishery: {
    biomes: ['tidal_flats', 'kelp_forest', 'rocky_pinnacles'],
    minDepth: 5,
    maxSeaState: 2,
    requiredGear: [],
    requiredPermit: 'dive',
    species: ['sea_cucumber', 'geoduck', 'giant_octopus'],
  },
  dinglebar_jigging: {
    biomes: ['rocky_pinnacles', 'open_ocean', 'sheltered_sound'],
    minDepth: 30,
    maxSeaState: 4,
    requiredGear: ['dinglebar_hook'],
    requiredPermit: 'sport_fishing',
    species: ['lingcod', 'yelloweye_rockfish', 'black_rockfish', 'halibut'],
  },
  bait_casting: {
    biomes: ['sheltered_sound', 'freshwater_river', 'river_estuary', 'tidal_flats', 'kelp_forest'],
    minDepth: 1,
    maxSeaState: 3,
    requiredGear: [],
    requiredPermit: 'sport_fishing',
    species: ['black_rockfish', 'greenling', 'pacific_cod', 'dolly_varden'],
  },
};

// ═══════════════════════════════════════════════════════════════
// GAME ENGINE
// ═══════════════════════════════════════════════════════════════

export class SitkaFishingGame {
  constructor() {
    // World
    this.world = new SitkaSound();

    // Species
    this.species = {};
    for (const sp of ALASKA_SPECIES) {
      this.species[sp.id] = sp;
    }

    // Environment
    this.weather = new SEWeather({ dayLengthMinutes: 24, daysPerSeason: 7 });
    this.tides = new TidalSystem({ cycleMinutes: 20, maxRange: 6 });

    // Economy
    this.ticketLedger = new FishTicketLedger();
    this.market = new AlaskaMarket({ ledger: this.ticketLedger });
    this.permitSystem = new PermitSystem(this.player ?? createDefaultPlayer());
    this.finances = new FinancialTracker();

    // Regulations
    this.warden = new GameWarden();

    // Wildlife
    this.mammals = new MarineMammalSystem();
    this.predation = new PredationSystem();
    this.encounters = new WildlifeEncounterSystem();
    this.bears = new BearSystem();
    this.birds = new BirdSystem();

    // Town
    this.radio = new MarineRadio();
    this.harbor = new SitkaHarbor();
    this.townEvents = new TownEventManager();
    this.gearShop = new GearShop();

    // Player
    this.player = createDefaultPlayer();
    this.permitSystem = new PermitSystem(this.player);

    // Game state
    this.initialized = false;
    this.gameTime = 0;
    this.lastTick = Date.now();
    this.eventLog = [];
    this.paused = false;

    this._radioTimer = 0;
    this._radioInterval = 60_000;
  }

  // ── Initialization ──────────────────────────────────────────

  init(playerOptions = {}) {
    if (playerOptions.name) this.player.name = playerOptions.name;
    if (playerOptions.boat) this._setPlayerBoat(playerOptions.boat);
    if (playerOptions.gold) {
      this.player.gold = playerOptions.gold;
      this.player.balance = playerOptions.gold;
    }
    if (playerOptions.permits) {
      this.player.permits = [...playerOptions.permits];
      for (const pid of playerOptions.permits) {
        try { this.permitSystem.acquire(pid, { source: 'quest', cost: 0 }); } catch {}
      }
    }
    if (playerOptions.gear) this.player.gear = playerOptions.gear;

    // Sync weather moon phase with tides
    this.tides.moonPhase = this.weather.moonPhase ?? 0.5;

    // Connect systems
    this._connectSystems();

    this.initialized = true;
    this.lastTick = Date.now();
    return this;
  }

  _connectSystems() {
    // Wire wildlife events
    if (typeof this.mammals.on === 'function') {
      this.mammals.on('orca_scare', (evt) => {
        this._logEvent('🦈', evt.message || 'Orcas spotted nearby!');
      });
      this.mammals.on('sea_lion_approaching', (evt) => {
        this._logEvent('🦭', evt.message || 'Sea lions approaching your gear!');
      });
      this.mammals.on('bubble_net', (evt) => {
        this._logEvent('🐋', evt.message || 'Humpback bubble-net feeding!');
      });
    }

    if (typeof this.predation.on === 'function') {
      this.predation.on('steal', (evt) => {
        this._logEvent('⚠️', evt.message || 'Wildlife stealing your catch!');
      });
    }

    if (typeof this.bears.on === 'function') {
      this.bears.on('bear_sighted', (evt) => {
        this._logEvent('🐻', evt.message || 'Bear spotted on the riverbank.');
      });
    }

    if (typeof this.encounters.on === 'function') {
      this.encounters.on('encounter', (evt) => {
        if (evt.effects?.karma) this.player.karma += evt.effects.karma;
      });
    }

    if (typeof this.warden.on === 'function') {
      this.warden.on('violation', (evt) => {
        this._logEvent('👮', `Game Warden: ${evt.message || 'Violation!'}`);
        if (evt.fine) {
          this.player.gold -= evt.fine;
          this.player.reputation -= 10;
        }
      });
    }
  }

  // ── Main Update Loop ───────────────────────────────────────

  update(dt) {
    if (!this.initialized || this.paused) return;

    const now = Date.now();
    if (dt === undefined) dt = now - this.lastTick;
    this.lastTick = now;
    this.gameTime += dt;

    const gameDt = dt / 1000;
    const gameMinutes = dt / 60_000;

    // 1. Weather
    if (typeof this.weather.tick === 'function') this.weather.tick(gameMinutes);

    // 2. Tides
    if (typeof this.tides.tick === 'function') this.tides.tick(gameMinutes);
    this.tides.moonPhase = this.weather.moonPhase ?? 0.5;

    // 3. Market fluctuation
    if (typeof this.market.tick === 'function' && Math.random() < gameDt * 0.2) {
      this.market.tick();
    }

    // 4. Wildlife
    const month = this._getCurrentMonth();
    const biome = this.player.location.biome ?? 'sheltered_sound';

    if (typeof this.mammals.tick === 'function') {
      this.mammals.tick(dt, this.player.location, biome, month, this.player.fishingState);
    }
    if (typeof this.encounters.tick === 'function') {
      this.encounters.tick(dt, this.player.location, biome, month, this.player.isFishing, this.player.isSailing);
    }
    if (typeof this.bears.tick === 'function') {
      this.bears.tick(dt, this.player.location, biome, this.weather.getWeather());
    }
    if (typeof this.birds.tick === 'function') {
      this.birds.tick(dt, this.player.location, biome, month);
    }

    // 5. Predation cleanup
    if (typeof this.predation.tick === 'function') this.predation.tick();

    // 6. Predation during haul-back
    if (this.player.isFishing && this.player.fishingState?.hauling) {
      if (typeof this.predation.processHaul === 'function') {
        const predResult = this.predation.processHaul({
          method: this.player.fishingState.method,
          location: this.player.location,
          catch: this.player.inventory.slice(-10),
          gear: this.player.gear,
          hour: this.weather.getWeather().timeInfo?.hour ?? 12,
          month,
        });
        if (predResult?.events) {
          for (const evt of predResult.events) this._logEvent('🦈', evt.message);
        }
      }
      this.player.fishingState.hauling = false;
    }

    // 7. Bird fish indicator
    if (typeof this.birds.getReport === 'function' && this.player.isFishing) {
      const birdReport = this.birds.getReport();
      if (birdReport?.indicatesFish && this.player.fishingState) {
        this.player.fishingState.birdBonus = birdReport.confidence ?? 1.0;
      }
    }

    // 8. Radio
    this._radioTimer -= dt;
    if (this._radioTimer <= 0) {
      this._radioTimer = this._radioInterval + Math.random() * 30_000;
      this._processRadioBroadcast();
    }

    // 9. Bear encounters at river
    if (biome === 'freshwater_river' && this.player.isFishing && typeof this.bears.checkEncounter === 'function') {
      const bearEvent = this.bears.checkEncounter(this.player.location);
      if (bearEvent) this._logEvent('🐻', bearEvent.message);
    }

    // 10. Fishing progress
    if (this.player.isFishing && this.player.fishingState) {
      this._updateFishing(dt);
    }

    return this.getState();
  }

  // ── Fishing System ─────────────────────────────────────────

  checkMethodViability(methodId) {
    const rules = METHOD_BIOME_RULES[methodId];
    if (!rules) return { viable: false, reasons: [`Unknown method: ${methodId}`] };

    const reasons = [];
    const biome = this.player.location.biome ?? 'unknown';
    const weather = this.weather.getWeather();
    const seaState = typeof this.weather.getSeaState === 'function' ? this.weather.getSeaState() : 0;

    // Biome
    if (!rules.biomes.includes(biome)) {
      reasons.push(`Can't ${methodId.replace(/_/g, ' ')} here — wrong location.`);
    }

    // Sea state
    if (seaState > rules.maxSeaState) {
      reasons.push(`Seas too rough (state ${seaState}). Max: ${rules.maxSeaState}.`);
    }

    // Storm
    if (weather.type === 'storm') {
      reasons.push("Can't fish in a storm. Stay safe.");
    }
    if (weather.specialEvent?.id === 'whiteout') {
      reasons.push('Zero visibility.');
    }

    // Gear
    if (rules.requiredGear.length > 0) {
      const playerGearIds = new Set(this.player.gear.map(g => g.id));
      for (const req of rules.requiredGear) {
        if (!playerGearIds.has(req)) {
          reasons.push(`Need gear: ${req}. Visit the gear shop.`);
        }
      }
    }

    // Permit
    if (rules.requiredPermit) {
      if (!this.permitSystem.has(rules.requiredPermit) && !this.player.permits.includes(rules.requiredPermit)) {
        reasons.push(`Requires ${rules.requiredPermit} permit. See ADF&G office.`);
      }
    }

    // Boat
    if (rules.minBoatType && this.player.boat) {
      const boatDef = ALASKA_BOAT_TYPES[this.player.boat];
      if (!boatDef?.compatibleMethods?.includes(methodId)) {
        reasons.push(`Your boat can't do this method.`);
      }
    }

    // Predation block
    if (typeof this.predation.isFishingBlocked === 'function') {
      const block = this.predation.isFishingBlocked(this.player.location);
      if (block?.blocked) reasons.push(block.reason);
    }

    return {
      viable: reasons.length === 0,
      reasons,
      method: methodId,
      biome,
      seaState,
      species: rules.species,
    };
  }

  startFishing(methodId, targetSpecies = null) {
    const viability = this.checkMethodViability(methodId);
    if (!viability.viable) return { success: false, message: viability.reasons.join(' ') };

    const rules = METHOD_BIOME_RULES[methodId];
    this.player.isFishing = true;
    this.player.fishingState = {
      method: methodId,
      targetSpecies: targetSpecies || rules.species[0],
      startTime: Date.now(),
      bites: 0,
      birdBonus: 0,
    };

    const sp = targetSpecies || rules.species[0];
    return {
      success: true,
      message: `Fishing for ${this.species[sp]?.name ?? sp} via ${methodId.replace(/_/g, ' ')}.`,
      species: sp,
    };
  }

  haulBack() {
    if (!this.player.isFishing || !this.player.fishingState) {
      return { success: false, message: "You're not fishing." };
    }

    const state = this.player.fishingState;
    state.hauling = true;

    const catchResult = this._generateCatch(state);

    for (const fish of catchResult.catch) {
      this.player.inventory.push(fish);
      this.player.statistics.totalFishCaught++;
      this.player.statistics.totalWeightCaught += fish.weight;
      this.player.statistics.speciesCaught.add(fish.speciesId);
      if (!this.player.statistics.biggestFish || fish.weight > this.player.statistics.biggestFish.weight) {
        this.player.statistics.biggestFish = fish;
      }
    }

    this.player.isFishing = false;
    this.player.fishingState = null;
    this.player.statistics.tripsCompleted++;

    return catchResult;
  }

  stopFishing(reason = '') {
    if (!this.player.isFishing) return;
    this.player.isFishing = false;
    this.player.fishingState = null;
    if (reason) this._logEvent('🛑', reason);
  }

  sellFish(speciesId, weight) {
    const idx = this.player.inventory.findIndex(f => f.speciesId === speciesId && f.weight === weight);
    if (idx === -1) return { success: false, message: "You don't have that fish." };

    const fish = this.player.inventory.splice(idx, 1)[0];

    // Get market price
    const basePrice = allPrices[speciesId] ?? this.species[speciesId]?.baseValue ?? 1;
    let marketPrice = basePrice;
    if (typeof this.market.getPrice === 'function') {
      const mkt = this.market.getPrice(speciesId);
      marketPrice = mkt?.price ?? basePrice;
    }
    const total = Math.round(marketPrice * fish.weight * 100) / 100;

    // Generate fish ticket
    let ticket = null;
    if (typeof this.ticketLedger.record === 'function') {
      ticket = this.ticketLedger.record({
        speciesId, weight: fish.weight, quality: fish.quality,
        pricePerLb: marketPrice, total,
        captain: this.player.name,
        vessel: this.player.boat ? ALASKA_BOAT_TYPES[this.player.boat]?.name : 'Unknown',
      });
    }

    // Record in market
    if (typeof this.market.recordSale === 'function') {
      this.market.recordSale(speciesId, fish.weight);
    }

    // Update finances
    if (typeof this.finances.recordSale === 'function') {
      this.finances.recordSale({ speciesId, weight: fish.weight, total, date: new Date().toISOString() });
    }

    this.player.gold += Math.floor(total);
    this.player.balance = this.player.gold;
    this.player.statistics.totalEarnings += total;

    return {
      success: true,
      message: `Sold ${fish.weight}lb ${this.species[speciesId]?.name ?? speciesId} for $${total.toFixed(2)}`,
      ticket, gold: this.player.gold,
    };
  }

  sellAllFish() {
    const results = [];
    while (this.player.inventory.length > 0) {
      const fish = this.player.inventory[0];
      const r = this.sellFish(fish.speciesId, fish.weight);
      if (!r.success) break;
      results.push(r);
    }
    return results;
  }

  // ── Boat & Gear ────────────────────────────────────────────

  setBoat(boatId) {
    const boatDef = ALASKA_BOAT_TYPES[boatId];
    if (!boatDef) return { success: false, message: `Unknown boat: ${boatId}` };
    if (boatDef.cost > this.player.gold) {
      return { success: false, message: `Need $${boatDef.cost}. You have $${this.player.gold}.` };
    }
    if (this.player.boat && typeof this.harbor.undock === 'function') {
      this.harbor.undock(this.player.boat);
    }
    this.player.gold -= boatDef.cost;
    this.player.balance = this.player.gold;
    this.player.boat = boatId;
    if (typeof this.harbor.dock === 'function') {
      this.harbor.dock(boatId, { name: `FV ${this.player.name}'s ${boatDef.name}` });
    }
    return { success: true, message: `Acquired ${boatDef.name}!`, boat: boatDef };
  }

  buyGear(gearId) {
    const item = this.gearShop.inventory?.get(gearId);
    const gearDef = ALL_GEAR[gearId];
    const price = item?.price ?? gearDef?.cost ?? 50;
    if (price > this.player.gold) return { success: false, message: `Need $${price}.` };
    this.player.gold -= price;
    this.player.balance = this.player.gold;
    this.player.gear.push({ id: gearId, durability: gearDef?.durability ?? 50 });
    return { success: true, message: `Bought ${gearDef?.name ?? gearId}.`, gear: gearDef };
  }

  buyPermit(permitId) {
    const permitInfo = PermitSystem.getType(permitId);
    if (!permitInfo) return { success: false, message: `Unknown permit: ${permitId}` };
    const cost = permitInfo.cost ?? 100;
    if (cost > this.player.gold) return { success: false, message: `Need $${cost}.` };
    try {
      this.permitSystem.acquire(permitId, { source: 'purchase', cost });
      this.player.gold -= cost;
      this.player.balance = this.player.gold;
      this.player.permits.push(permitId);
      return { success: true, message: `Obtained ${permitInfo.name} permit.` };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // ── NPC Interaction ────────────────────────────────────────

  talkToNPC(npcId) {
    const npc = NPCS[npcId];
    if (!npc) return { success: false, message: 'Nobody here by that name.' };
    return {
      success: true,
      npc: { id: npc.id, name: npc.name },
      dialogue: this._generateNPCDialogue(npc),
      quests: this._getAvailableQuests(npcId),
    };
  }

  // ── Quest System ───────────────────────────────────────────

  acceptQuest(questId) {
    if (this.player.activeQuests.find(q => q.id === questId))
      return { success: false, message: 'Already on that quest.' };
    const quest = QUESTS[questId];
    if (!quest) return { success: false, message: 'Unknown quest.' };
    this.player.activeQuests.push({ id: questId, ...quest, acceptedAt: Date.now(), progress: {} });
    return { success: true, message: `Quest accepted: ${quest.name}`, quest };
  }

  // ── State Queries ──────────────────────────────────────────

  getState() {
    const weather = this.weather.getWeather();
    const tide = this.tides.getCurrent();
    const biteMult = (this.weather.getBiteMultiplier?.() ?? 1.0) * (this.tides.getBiteMultiplier?.() ?? 1.0);

    return {
      gameTime: this.gameTime,
      player: {
        name: this.player.name,
        gold: this.player.gold,
        boat: this.player.boat,
        location: this.player.location,
        isFishing: this.player.isFishing,
        karma: this.player.karma,
        reputation: this.player.reputation,
        inventory: this.player.inventory.length,
        statistics: {
          ...this.player.statistics,
          speciesCaught: [...this.player.statistics.speciesCaught],
        },
        activeQuests: this.player.activeQuests.length,
      },
      weather: {
        type: weather.type,
        name: weather.info?.name,
        emoji: weather.info?.emoji,
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        seaState: this.weather.getSeaState?.() ?? 0,
        season: weather.season,
        seasonName: weather.seasonInfo?.name,
        timeOfDay: weather.timeOfDay,
        hour: weather.timeInfo?.hour ?? 12,
        biteMultiplier: Math.round(biteMult * 100) / 100,
        specialEvent: weather.specialEvent,
        boatSafety: this.weather.getBoatSafety?.() ?? 'safe',
      },
      tide: {
        level: tide.level,
        direction: tide.direction,
        phase: tide.phase?.name ?? 'unknown',
        emoji: tide.phase?.emoji ?? '🌊',
      },
      mammals: this.mammals.activeMammals?.size ?? 0,
      recentEvents: this.eventLog.slice(-20),
      fishingReport: this.weather.getFishingReport?.() ?? null,
      harborReport: typeof this.harbor.getDailyReport === 'function' ? this.harbor.getDailyReport() : null,
    };
  }

  forceWeather(type) { this.weather.forceWeather(type); }
  forceSeason(season) { this.weather.forceSeason(season); }
  forceTide(minutes) { this.tides.forceTime?.(minutes); }

  toString() {
    if (!this.initialized) return 'Game not initialized. Call init() first.';
    const w = this.weather.getWeather();
    const t = this.tides.getCurrent();
    return `🎣 Sitka Fishing | ${w.info?.emoji ?? ''} ${w.info?.name ?? ''} | ${t.phase?.emoji ?? ''} ${t.phase?.name ?? ''} | Gold: $${this.player.gold}`;
  }

  // ── Internal ───────────────────────────────────────────────

  _setPlayerBoat(boatId) {
    if (ALASKA_BOAT_TYPES[boatId]) {
      this.player.boat = boatId;
      if (typeof this.harbor.dock === 'function') {
        this.harbor.dock(boatId, { name: `FV ${this.player.name}'s Boat` });
      }
    }
  }

  _getCurrentMonth() {
    const season = this.weather.getSeason();
    const sm = { spring: 4, summer: 7, fall: 10, winter: 1 };
    const sd = this.weather.getWeather().timeInfo?.seasonDay ?? 0;
    return Math.min(12, Math.max(1, sm[season] + Math.floor(sd / 7)));
  }

  _generateCatch(fishingState) {
    const rules = METHOD_BIOME_RULES[fishingState.method];
    if (!rules) return { success: false, catch: [], message: 'Unknown method.' };

    const biteMult = (this.weather.getBiteMultiplier?.() ?? 1.0) * (this.tides.getBiteMultiplier?.() ?? 1.0);
    const birdBonus = fishingState.birdBonus ?? 1.0;
    const totalMult = biteMult * birdBonus;

    let gearMult = 1.0;
    for (const g of this.player.gear) {
      const gearDef = ALL_GEAR[g.id];
      if (gearDef?.effectiveness?.[fishingState.targetSpecies]) {
        gearMult *= gearDef.effectiveness[fishingState.targetSpecies];
      }
    }

    const catchChance = 0.3 * totalMult * gearMult;
    const caught = [];

    for (const speciesId of rules.species) {
      if (Math.random() > catchChance) continue;
      const sp = this.species[speciesId];
      if (!sp) continue;

      const minW = sp.sizeRange?.[0] ?? 1;
      const maxW = sp.sizeRange?.[1] ?? 10;
      const weight = Math.round(minW + Math.random() * (maxW - minW) * 0.7 + (maxW - minW) * 0.3 * Math.random());

      const season = this.weather.getSeason();
      const seasonInfo = this.weather.getWeather().seasonInfo;
      let seasonBoost = 1.0;
      if (seasonInfo?.speciesBoost?.includes(speciesId) || seasonInfo?.speciesBoost?.includes('all_salmon')) {
        seasonBoost = 1.5;
      }

      if (Math.random() < seasonBoost) {
        caught.push({
          speciesId, weight,
          quality: weight > maxW * 0.7 ? 'trophy' : weight > maxW * 0.4 ? 'good' : 'standard',
          caughtAt: Date.now(),
        });
      }
    }

    const totalWeight = caught.reduce((s, f) => s + f.weight, 0);
    return {
      success: true,
      catch: caught,
      message: caught.length > 0 ? `Caught ${caught.length} fish totaling ${totalWeight}lbs!` : 'No bites this time.',
      method: fishingState.method,
    };
  }

  _updateFishing(dt) {
    const state = this.player.fishingState;
    if (typeof this.birds.getReport === 'function') {
      const birdReport = this.birds.getReport();
      if (birdReport?.indicatesFish) state.birdBonus = birdReport.confidence ?? 1.0;
    }
    if (Math.random() < 0.01) state.bites++;
  }

  _processRadioBroadcast() {
    const weather = this.weather.getWeather();

    if (weather.type === 'storm' || weather.specialEvent?.id === 'williwaw') {
      const msg = 'Gale warning for Sitka Sound, all vessels seek safe harbor immediately.';
      if (typeof this.radio.broadcast === 'function') {
        this.radio.broadcast('securite', msg, 'Sitka Harbormaster');
      }
      this._logEvent('📻', msg);
    }

    // Market condition affects radio
    if (typeof this.market.getPriceSummary === 'function') {
      const summary = this.market.getPriceSummary();
      if (summary.trending === 'down' && Math.random() < 0.2) {
        this._logEvent('📻', 'Market report: prices soft this week.');
      }
    }

    // Random radio chatter
    if (Math.random() < 0.4 && typeof this.radio.generateRadioEvent === 'function') {
      const event = this.radio.generateRadioEvent();
      this._logEvent('📻', `[Ch ${event.channel}] ${event.vessel}: ${event.message}`);
    }
  }

  _generateNPCDialogue(npc) {
    const weather = this.weather.getWeather();
    const lines = [];

    // Weather-aware
    if (weather.type === 'storm') {
      if (npc.id === 'ernie') lines.push("Storm's here. Pull up a stool.");
      else if (npc.id === 'mary') lines.push("All vessels secured. Stay off the water.");
    }

    // Market-aware
    if (typeof this.market.getPriceSummary === 'function') {
      const summary = this.market.getPriceSummary();
      if (summary.trending === 'down' && npc.id === 'ernie') {
        lines.push("Prices are down this week. Hold your fish if you can.");
      }
    }

    // Default dialogue
    if (npc.dialogue?.rumors?.length && npc.id === 'ernie') {
      lines.push(npc.dialogue.rumors[Math.floor(Math.random() * npc.dialogue.rumors.length)]);
    }
    if (npc.greeting?.length) {
      lines.push(npc.greeting[Math.floor(Math.random() * npc.greeting.length)]);
    }

    return lines.length > 0 ? lines.sort(() => Math.random() - 0.5).slice(0, 2) : ["..."];
  }

  _getAvailableQuests(npcId) {
    const npc = NPCS[npcId];
    if (!npc?.quests) return [];
    return npc.quests
      .filter(qId => !this.player.completedQuests.includes(qId) && !this.player.activeQuests.find(q => q.id === qId))
      .map(qId => QUESTS[qId])
      .filter(Boolean);
  }

  _logEvent(emoji, message) {
    this.eventLog.push({ emoji, message, time: Date.now(), gameTime: this.gameTime });
    if (this.eventLog.length > 200) this.eventLog = this.eventLog.slice(-100);
  }
}

export default SitkaFishingGame;
