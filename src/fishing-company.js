// CraftMind Fishing — Fishing Company (Tycoon Layer)
// Boat upgrades, port facilities, research tree, competitor fleets, daily routine.

import { Fleet } from './fleet.js';
import { FleetCaptain } from './fleet-captain.js';
import { Market } from './market.js';
import { ContractBoard } from './contracts.js';
import { Tavern } from './crew-recruitment.js';
import { SafetyNet } from './safety-net.js';
import { Boat, BOAT_TIERS } from './boat.js';

export class PortFacility {
  constructor(type, options = {}) {
    this.type = type; // 'market', 'bait_shop', 'boat_yard', 'tavern', 'research_lab'
    this.level = options.level ?? 1;
    this.maxLevel = options.maxLevel ?? 5;
    this.name = options.name ?? this._defaultName();
    this.upgradeCost = options.upgradeCost ?? 200;
    this.unlocked = options.unlocked ?? true;
  }

  upgrade() {
    if (this.level >= this.maxLevel) return false;
    const cost = this.upgradeCost * this.level;
    this.level++;
    return { cost, newLevel: this.level };
  }

  _defaultName() {
    const names = {
      market: 'Fish Market', bait_shop: 'Bait & Tackle',
      boat_yard: 'Boat Yard', tavern: 'Tavern', research_lab: 'Research Lab',
    };
    return names[this.type] ?? this.type;
  }
}

export class CompetitorFleet {
  constructor(options = {}) {
    this.name = options.name ?? this._randomName();
    this.skill = options.skill ?? 3 + Math.floor(Math.random() * 5);
    this.activity = options.activity ?? 0.5; // how active they are
    this.specialty = options.specialty ?? ['deep_water', 'surface', 'rare_fish'][Math.floor(Math.random() * 3)];
    this.reputation = options.reputation ?? 10 + Math.floor(Math.random() * 30);
    this.relationship = options.relationship ?? 0; // -100 enemy, 100 ally

    this.catches = [];
    this.gold = options.gold ?? 500 + Math.floor(Math.random() * 1000);
    this.discoveries = [];
  }

  _randomName() {
    const names = ['The Iron Tide', 'Deepwater Collective', 'Coral Cutters', 'Storm Riders',
      'The Leviathan Club', 'Abyssal Anglers', 'Pearl Divers Guild', 'Neptune\'s Trident'];
    return names[Math.floor(Math.random() * names.length)];
  }

  /** Simulate competitor activity for a tick. */
  simulateTick(market) {
    if (Math.random() > this.activity) return [];

    const events = [];
    // Competitor catches fish (affects market supply)
    const species = ['cod', 'salmon', 'prismarine_cod', 'glow_squid'][Math.floor(Math.random() * 4)];
    const count = Math.floor(Math.random() * 3 * this.skill / 5) + 1;
    if (market) market.recordSale(species, count);

    // Rare: discover new spot
    if (Math.random() < 0.05 * this.skill / 10) {
      events.push({ type: 'discovery', fleet: this.name, spot: `Deep Trench ${Math.floor(Math.random() * 100)}` });
      this.discoveries.push(Date.now());
    }

    return events;
  }
}

export class FishingCompany {
  constructor(options = {}) {
    this.name = options.name ?? 'Unnamed Fisheries';
    this.owner = options.owner ?? null;
    this.gold = options.gold ?? 500;
    this.reputation = options.reputation ?? 0;

    // Core systems
    this.fleet = options.fleet ?? new Fleet({ name: `${this.name} Fleet`, captain: this.owner });
    this.captain = options.captain ?? null;
    this.market = options.market ?? new Market();
    this.contracts = options.contracts ?? new ContractBoard();
    this.tavern = options.tavern ?? new Tavern();
    this.safetyNet = new SafetyNet(this.fleet);

    // Port facilities
    this.facilities = {
      market: new PortFacility('market'),
      bait_shop: new PortFacility('bait_shop'),
      boat_yard: new PortFacility('boat_yard'),
      tavern: new PortFacility('tavern'),
      research_lab: new PortFacility('research_lab'),
    };

    // Research tree
    this.research = new Map(); // researchId → { name, level, maxLevel, unlocked, cost }
    this._initResearch();

    // Competitors
    this.competitors = options.competitors ?? [
      new CompetitorFleet(), new CompetitorFleet(),
    ];

    // Daily cycle
    this.timeOfDay = 'morning'; // morning, day, evening, night
    this.dayCount = 0;
    this.lastDayChange = Date.now();
    this.dayDuration = options.dayDuration ?? 240000; // 4 min per "day"

    // Stats
    this.totalVoyages = 0;
    this.totalGoldEarned = 0;
    this.totalFishCaught = 0;
    this.log = [];
  }

  _initResearch() {
    const tree = [
      { id: 'rod_iron', name: 'Iron Rod Mastery', maxLevel: 3, cost: 100 },
      { id: 'rod_diamond', name: 'Diamond Rod Mastery', maxLevel: 3, cost: 500 },
      { id: 'bait_advanced', name: 'Advanced Bait Crafting', maxLevel: 3, cost: 200 },
      { id: 'species_knowledge', name: 'Species Encyclopedia', maxLevel: 5, cost: 150 },
      { id: 'hazard_resistance', name: 'Hazard Resistance', maxLevel: 3, cost: 300 },
      { id: 'deep_fishing', name: 'Deep Water Techniques', maxLevel: 3, cost: 400 },
      { id: 'night_fishing', name: 'Night Fishing Mastery', maxLevel: 3, cost: 250 },
      { id: 'fleet_coordination', name: 'Fleet Coordination', maxLevel: 3, cost: 350 },
    ];
    for (const item of tree) {
      this.research.set(item.id, { ...item, level: 0, unlocked: item.cost <= 100 });
    }
  }

  /** Advance the daily cycle. */
  tick(dt = 10000) {
    // Day/night cycle
    if (Date.now() - this.lastDayChange > this.dayDuration / 4) {
      this.lastDayChange = Date.now();
      const phases = ['morning', 'day', 'evening', 'night'];
      const idx = (phases.indexOf(this.timeOfDay) + 1) % 4;
      this.timeOfDay = phases[idx];
      if (idx === 0) this.dayCount++;
      this._onPhaseChange();
    }

    // Market events
    this.market.checkEvents();

    // Competitor simulation
    for (const comp of this.competitors) {
      comp.simulateTick(this.market);
    }

    // Contract expiry
    this.contracts.expireOld();

    // Safety check
    const issues = this.safetyNet.safetyCheck();
    for (const issue of issues) {
      this.log.push({ type: 'safety', ...issue, timestamp: Date.now() });
    }

    // Generate contracts periodically
    if (this.contracts.getAvailable().length < 3 && Math.random() < 0.1) {
      const type = ['delivery', 'delivery', 'research', 'exploration'][Math.floor(Math.random() * 4)];
      this.contracts.generate(type);
    }
  }

  _onPhaseChange() {
    switch (this.timeOfDay) {
      case 'morning':
        this.log.push({ type: 'phase', msg: '🌅 Morning — Review weather, plan expedition', timestamp: Date.now() });
        // Refresh tavern
        this.tavern.refresh();
        break;
      case 'day':
        this.log.push({ type: 'phase', msg: '☀️ Day — Fishing expedition time!', timestamp: Date.now() });
        break;
      case 'evening':
        this.log.push({ type: 'phase', msg: '🌇 Evening — Sell catch, upgrade equipment', timestamp: Date.now() });
        break;
      case 'night':
        this.log.push({ type: 'phase', msg: '🌙 Night — Risky night fishing or rest', timestamp: Date.now() });
        break;
    }
  }

  /** Purchase a facility upgrade. */
  upgradeFacility(type) {
    const facility = this.facilities[type];
    if (!facility || facility.level >= facility.maxLevel) return false;
    const cost = facility.upgradeCost * facility.level;
    if (this.gold < cost) return false;
    this.gold -= cost;
    facility.upgrade();
    return { facility: type, newLevel: facility.level, cost };
  }

  /** Research a technology. */
  researchTech(techId) {
    const tech = this.research.get(techId);
    if (!tech || !tech.unlocked || tech.level >= tech.maxLevel) return false;
    const cost = tech.cost * (tech.level + 1);
    if (this.gold < cost) return false;
    this.gold -= cost;
    tech.level++;
    // Unlock dependent techs
    if (tech.level >= tech.maxLevel) {
      for (const [, t] of this.research) {
        if (!t.unlocked && t.cost <= tech.cost * 2) t.unlocked = true;
      }
    }
    return { tech: techId, newLevel: tech.level, cost };
  }

  /** Hire from tavern. */
  hireCrew(memberId) {
    const member = this.tavern.hire(memberId);
    if (!member) return null;
    const hireCost = member.hireCost;
    if (this.gold < hireCost) { this.tavern.addCrew(member); return null; }
    this.gold -= hireCost;
    this.fleet.addMember(member.name, {
      role: member.role, skill: member.skill,
      personality: member.personality, boat: member.boat,
    });
    return { member, cost: hireCost };
  }

  /** Sell all cargo at market. */
  sellCatch() {
    let totalGold = 0;
    for (const [, member] of this.fleet.members) {
      for (const fish of member.catches) {
        const result = this.market.sellFish(fish.species?.id ?? 'unknown');
        totalGold += result.gold;
      }
      member.catches = [];
    }
    this.gold += totalGold;
    this.totalGoldEarned += totalGold;
    return totalGold;
  }

  /** Get company status. */
  getStatus() {
    return {
      name: this.name, gold: this.gold, reputation: this.reputation,
      dayCount: this.dayCount, timeOfDay: this.timeOfDay,
      fleet: this.fleet.getStatus(),
      market: this.market.getSummary(),
      contracts: this.contracts.getSummary(),
      tavern: this.tavern.getSummary(),
      safety: this.safetyNet.getStats(),
      research: [...this.research.entries()].map(([id, t]) => ({ id, level: t.level, maxLevel: t.maxLevel })),
      facilities: Object.fromEntries(Object.entries(this.facilities).map(([k, f]) => [k, f.level])),
      competitors: this.competitors.map(c => ({ name: c.name, reputation: c.reputation })),
      totalVoyages: this.totalVoyages,
      totalGoldEarned: this.totalGoldEarned,
      totalFishCaught: this.totalFishCaught,
    };
  }
}

export default FishingCompany;
