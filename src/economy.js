// CraftMind Fishing — Fish Economy
// Dynamic pricing, fish merchant, cooking, achievements.

import { RARITY } from './fish-species.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export const COOKING_RECIPES = {
  raw:         { name: 'Raw Fish',     valueMultiplier: 1.0 },
  cooked:      { name: 'Cooked Fish',  valueMultiplier: 1.5 },
  smoked:      { name: 'Smoked Fish',  valueMultiplier: 2.0 },
  sushi:       { name: 'Sushi',        valueMultiplier: 2.5 },
  fish_stew:   { name: 'Fish Stew',    valueMultiplier: 3.0, requires: 3 },
  golden_feast:{ name: 'Golden Feast', valueMultiplier: 5.0, requires: 5 },
};

export const ACHIEVEMENTS = [
  { id: 'first_catch', name: 'First Catch', description: 'Catch your first fish', reward: 10 },
  { id: 'ten_catch', name: 'Dedicated Angler', description: 'Catch 10 fish', reward: 50 },
  { id: 'hundred_catch', name: 'Master Angler', description: 'Catch 100 fish', reward: 200 },
  { id: 'first_rare', name: 'Rare Find', description: 'Catch a Rare fish', reward: 100 },
  { id: 'first_epic', name: 'Epic Discovery', description: 'Catch an Epic fish', reward: 500 },
  { id: 'first_legendary', name: 'Legend of the Deep', description: 'Catch a Legendary fish', reward: 2000 },
  { id: 'collector_10', name: 'Collector', description: 'Catch 10 unique species', reward: 300 },
  { id: 'collector_20', name: 'Encyclopedist', description: 'Catch 20 unique species', reward: 1000 },
  { id: 'big_fish', name: 'Big One', description: 'Catch a fish over 20kg', reward: 150 },
  { id: 'monster', name: 'Monster of the Deep', description: 'Catch a fish over 50kg', reward: 500 },
  { id: 'full_collection', name: 'Complete Collection', description: 'Catch every species', reward: 5000 },
];

export class Economy {
  constructor(options = {}) {
    this.saveDir = options.saveDir ?? './data/persistence';
    this.balance = options.balance ?? 0;
    this.totalSold = 0;
    this.totalBought = 0;
    // Supply tracking: speciesId → quantity sold (affects pricing)
    this.marketSupply = new Map();
    this.achieved = new Set();
    this.stats = { totalCatches: 0, totalWeight: 0, uniqueSpecies: new Set() };
  }

  /** Calculate the market value of a caught fish */
  getValue(caught, recipe = 'raw') {
    const species = caught.species;
    const recipeData = COOKING_RECIPES[recipe] ?? COOKING_RECIPES.raw;
    const rarityMult = RARITY[species.rarity]?.valueMultiplier ?? 1;
    const sizeBonus = 1 + (caught.size / species.sizeRange[1]) * 0.5;
    const freshnessBonus = caught.freshness ?? 1.0;

    // Supply/demand: price drops as more of this species are sold
    const supply = this.marketSupply.get(species.id) ?? 0;
    const demandMult = 1 / (1 + supply * 0.05);

    return Math.round(species.baseValue * rarityMult * sizeBonus * freshnessBonus * demandMult * recipeData.valueMultiplier * 100) / 100;
  }

  /** Sell a caught fish */
  sell(caught, recipe = 'raw') {
    const value = this.getValue(caught, recipe);
    this.balance += value;
    this.totalSold += value;
    this.marketSupply.set(caught.species.id, (this.marketSupply.get(caught.species.id) ?? 0) + 1);
    this._checkAchievements(caught);
    return { value, balance: this.balance };
  }

  /** Buy something (bait, rods, etc.) */
  buy(item, cost) {
    if (this.balance < cost) return { success: false, reason: 'insufficient_funds' };
    this.balance -= cost;
    this.totalBought += cost;
    return { success: true, balance: this.balance };
  }

  /** Get current price for a species */
  getPrice(species, recipe = 'raw') {
    if (!species) return 0;
    const speciesId = typeof species === 'string' ? species : species.id;
    const supply = this.marketSupply.get(speciesId) ?? 0;
    const demandMult = 1 / (1 + supply * 0.05);
    if (typeof species === 'string') return Math.round(10 * demandMult * 100) / 100; // fallback
    const recipeMult = COOKING_RECIPES[recipe]?.valueMultiplier ?? 1;
    return Math.round(species.baseValue * RARITY[species.rarity].valueMultiplier * demandMult * recipeMult * 100) / 100;
  }

  /** Track a catch for stats */
  trackCatch(caught) {
    this.stats.totalCatches++;
    this.stats.totalWeight += caught.weight;
    this.stats.uniqueSpecies.add(caught.species.id);
  }

  /** Check and award achievements */
  _checkAchievements(caught) {
    const check = (id) => {
      if (this.achieved.has(id)) return;
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (!ach) return;
      let earned = false;
      if (id === 'first_catch' && this.stats.totalCatches >= 1) earned = true;
      if (id === 'ten_catch' && this.stats.totalCatches >= 10) earned = true;
      if (id === 'hundred_catch' && this.stats.totalCatches >= 100) earned = true;
      if (id === 'first_rare' && caught.species.rarity === 'Rare') earned = true;
      if (id === 'first_epic' && caught.species.rarity === 'Epic') earned = true;
      if (id === 'first_legendary' && caught.species.rarity === 'Legendary') earned = true;
      if (id === 'collector_10' && this.stats.uniqueSpecies.size >= 10) earned = true;
      if (id === 'collector_20' && this.stats.uniqueSpecies.size >= 20) earned = true;
      if (id === 'big_fish' && caught.weight >= 20) earned = true;
      if (id === 'monster' && caught.weight >= 50) earned = true;
      if (id === 'full_collection' && this.stats.uniqueSpecies.size >= 25) earned = true;
      if (earned) {
        this.achieved.add(id);
        this.balance += ach.reward;
      }
    };
    for (const ach of ACHIEVEMENTS) check(ach.id);
  }

  /** Get all achievements with status */
  getAchievements() {
    return ACHIEVEMENTS.map(a => ({ ...a, achieved: this.achieved.has(a.id) }));
  }

  /** Get market summary */
  getMarketSummary() {
    return {
      balance: this.balance, totalSold: this.totalSold, totalBought: this.totalBought,
      catches: this.stats.totalCatches, totalWeight: Math.round(this.stats.totalWeight * 100) / 100,
      uniqueSpecies: this.stats.uniqueSpecies.size, achievements: this.achieved.size,
    };
  }

  save() {
    if (!existsSync(this.saveDir)) mkdirSync(this.saveDir, { recursive: true });
    writeFileSync(`${this.saveDir}/economy.json`, JSON.stringify({
      balance: this.balance, totalSold: this.totalSold, totalBought: this.totalBought,
      marketSupply: [...this.marketSupply.entries()], achieved: [...this.achieved],
      stats: { ...this.stats, uniqueSpecies: [...this.stats.uniqueSpecies] },
    }, null, 2));
  }

  load() {
    try {
      const raw = readFileSync(`${this.saveDir}/economy.json`, 'utf-8');
      const data = JSON.parse(raw);
      this.balance = data.balance ?? 0;
      this.totalSold = data.totalSold ?? 0;
      this.totalBought = data.totalBought ?? 0;
      this.marketSupply = new Map(data.marketSupply ?? []);
      this.achieved = new Set(data.achieved ?? []);
      this.stats = { ...data.stats, uniqueSpecies: new Set(data.stats?.uniqueSpecies ?? []) };
      return true;
    } catch { return false; }
  }
}

export default Economy;
