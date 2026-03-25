// CraftMind Fishing — Fish Species Registry
// Now using real Alaska species from the Sitka species database.

import { ALASKA_SPECIES } from './world/sitka-species.js';

/** Rarity tier multipliers for spawn rates and value */
export const RARITY = {
  Common:    { spawnWeight: 50, valueMultiplier: 1.0, color: '#aaaaaa' },
  Uncommon:  { spawnWeight: 25, valueMultiplier: 2.5, color: '#55ff55' },
  Rare:      { spawnWeight: 10, valueMultiplier: 6.0, color: '#5555ff' },
  Epic:      { spawnWeight: 3,  valueMultiplier: 15,  color: '#aa00ff' },
  Legendary: { spawnWeight: 1,  valueMultiplier: 50,  color: '#ffaa00' },
};

const speciesMap = new Map();
for (const sp of ALASKA_SPECIES) speciesMap.set(sp.id, { ...sp, rarityInfo: RARITY[sp.rarity] });

export class FishSpeciesRegistry {
  /** Get species by id */
  static get(id) {
    return speciesMap.get(id) ?? null;
  }

  /** Get all species */
  static all() {
    return [...speciesMap.values()];
  }

  /** Get species by rarity */
  static byRarity(rarity) {
    return [...speciesMap.values()].filter(s => s.rarity === rarity);
  }

  /** Get species available in a given biome */
  static forBiome(biome) {
    return [...speciesMap.values()].filter(s => s.biomes?.includes(biome));
  }

  /** Select a random species weighted by rarity, filtered by conditions */
  static select({ biome, season, timeOfDay, depth, bait, excludeCategories = [] } = {}) {
    let candidates = [...speciesMap.values()];

    if (excludeCategories.length > 0) {
      candidates = candidates.filter(s => !excludeCategories.includes(s.category));
    }
    if (biome) candidates = candidates.filter(s => s.biomes?.includes(biome));
    if (season) candidates = candidates.filter(s =>
      s.preferredSeason?.includes(season) || s.preferredSeason?.includes('year_round')
    );
    if (depth != null) {
      candidates = candidates.filter(s =>
        depth >= (s.preferredDepth?.[0] ?? 0) && depth <= (s.preferredDepth?.[1] ?? 999)
      );
    }

    if (candidates.length === 0) return null;

    // Weight by rarity
    const totalWeight = candidates.reduce((sum, s) => sum + (s.rarityInfo?.spawnWeight ?? 10), 0);
    let roll = Math.random() * totalWeight;
    for (const sp of candidates) {
      roll -= (sp.rarityInfo?.spawnWeight ?? 10);
      if (roll <= 0) return sp;
    }
    return candidates[candidates.length - 1];
  }

  /** Generate a random size for a species */
  static randomSize(species) {
    const range = species.sizeRange;
    if (!range) return 1;
    const [min, max] = range;
    // Bell curve via Box-Muller, clamped to range
    const u1 = Math.random(), u2 = Math.random();
    const normal = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
    const mean = (min + max) / 2;
    const std = (max - min) / 4;
    return Math.max(min, Math.min(max, mean + normal * std));
  }

  /** Count species */
  static get count() { return speciesMap.size; }
}

export default FishSpeciesRegistry;
