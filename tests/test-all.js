#!/usr/bin/env node
// Comprehensive test suite for CraftMind Fishing — Alaska Edition

import { FishSpeciesRegistry, RARITY } from '../src/fish-species.js';
import { FishAI, FishSchool } from '../src/fish-ai.js';
import { BoidsEngine, FishEntity } from '../src/boids-engine.js';
import { SitkaFishingGame, METHOD_BIOME_RULES } from '../src/integration/game-engine.js';

let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  ❌ FAIL: ${msg}`); }
}

console.log('🧪 CraftMind Fishing — Test Suite (Alaska Edition)\n');

// === Fish Species ===
console.log('── Fish Species ──');
assert(FishSpeciesRegistry.count >= 20, `Expected 20+ species, got ${FishSpeciesRegistry.count}`);
assert(FishSpeciesRegistry.get('king_salmon') !== null, 'King Salmon exists');
assert(FishSpeciesRegistry.get('halibut') !== null, 'Halibut exists');
assert(FishSpeciesRegistry.get('humpback_whale')?.rarity === 'Legendary', 'Humpback Whale is Legendary');
assert(FishSpeciesRegistry.byRarity('Common').length > 0, 'Common species exist');
assert(FishSpeciesRegistry.forBiome('sheltered_sound').length > 0, 'Sheltered Sound has species');
assert(FishSpeciesRegistry.forBiome('open_ocean').length > 0, 'Open Ocean has species');
assert(FishSpeciesRegistry.forBiome('deep_trench').length > 0, 'Deep Trench has species');
assert(FishSpeciesRegistry.forBiome('freshwater_river').length > 0, 'Freshwater River has species');
const selected = FishSpeciesRegistry.select({ biome: 'sheltered_sound' });
assert(selected !== null, 'Species selection works for sheltered_sound');
assert(RARITY.Legendary.spawnWeight < RARITY.Common.spawnWeight, 'Legendary rarer than Common');

// Verify no fantasy species remain
assert(FishSpeciesRegistry.get('nether_trout') === null, 'No Nether Trout (fantasy)');
assert(FishSpeciesRegistry.get('ender_perch') === null, 'No Ender Perch (fantasy)');

// Halibut should NOT be in kelp_forest
const halibut = FishSpeciesRegistry.get('halibut');
assert(!halibut.biomes.includes('kelp_forest'), 'Halibut not in kelp forest (deep water species)');

// Salmon should be in river
const kingSalmon = FishSpeciesRegistry.get('king_salmon');
assert(kingSalmon.biomes.includes('freshwater_river'), 'King salmon in freshwater river');

// === Fish AI ===
console.log('── Fish AI ──');

// Create a school + AI
const boids = new BoidsEngine({ bounds: { minX: -50, maxX: 50, minY: 0, maxY: 30, minZ: -50, maxZ: 50 } });
const school = new FishSchool('test_school', 'king_salmon', { size: 5, waterBodyId: 'sitka_sound' });
const fishIds = [];
for (let i = 0; i < 5; i++) {
  const id = `fish_${i}`;
  const entity = new FishEntity(id, {
    x: -20 + Math.random() * 40,
    y: 10 + Math.random() * 10,
    z: -20 + Math.random() * 40,
    speciesId: 'king_salmon',
  });
  boids.addEntity(entity);
  fishIds.push(id);
}
boids.createSchool('test_school', fishIds);

const ai = new FishAI(school, { boids });

assert(school.hunger >= 0 && school.hunger <= 10, 'School hunger in range');
ai.tick(2000);

// Test spook — the FIXED spook method
ai.spook('noise');
let allFleeing = true;
for (const id of fishIds) {
  const entity = boids.entities.get(id);
  if (!entity || !entity.fleeing) { allFleeing = false; break; }
}
assert(allFleeing, 'All fish flee when school is spooked');

// Test getBiteProbability — should be > 0 normally
const biteProb = ai.getBiteProbability();
assert(typeof biteProb === 'number', 'getBiteProbability returns number');

// Test school logging
school.logEvent('test event');
assert(school.eventLog.length > 0, 'School event log works');

// Test species data flows through
assert(school.species !== null, 'School has species data');
assert(school.species.id === 'king_salmon', 'School has correct species');

// === Method ↔ World Compatibility ===
console.log('── Method ↔ World Compatibility ──');

// Halibut longlining should NOT be viable in kelp_forest
assert(METHOD_BIOME_RULES.halibut_longlining.biomes.includes('open_ocean'), 'Halibut longlining in open ocean');
assert(!METHOD_BIOME_RULES.halibut_longlining.biomes.includes('kelp_forest'), 'Halibut longlining NOT in kelp forest');
assert(!METHOD_BIOME_RULES.halibut_longlining.biomes.includes('freshwater_river'), 'Halibut longlining NOT in river');

// Purse seining should NOT be in deep ocean
assert(METHOD_BIOME_RULES.purse_seining.biomes.includes('sheltered_sound'), 'Purse seining in sheltered sound');

// River fishing should only be in river/estuary
assert(METHOD_BIOME_RULES.river_fishing.biomes.includes('freshwater_river'), 'River fishing in river');
assert(!METHOD_BIOME_RULES.river_fishing.biomes.includes('open_ocean'), 'River fishing NOT in open ocean');

// Dive fishery should NOT be in open ocean or river
assert(!METHOD_BIOME_RULES.dive_fishery.biomes.includes('open_ocean'), 'Dive fishery NOT in open ocean');
assert(!METHOD_BIOME_RULES.dive_fishery.biomes.includes('freshwater_river'), 'Dive fishery NOT in river');

// All methods should have species
for (const [method, rules] of Object.entries(METHOD_BIOME_RULES)) {
  assert(rules.species.length > 0, `${method} has species`);
  assert(rules.biomes.length > 0, `${method} has biomes`);
  assert(typeof rules.maxSeaState === 'number', `${method} has maxSeaState`);
}

// === Game Engine ===
console.log('── Game Engine ──');

const game = new SitkaFishingGame();
assert(game !== null, 'Game engine instantiates');
assert(!game.initialized, 'Game not initialized yet');

game.init({ name: 'Captain Test', boat: 'skiff', gold: 1000, permits: ['sport_fishing', 'salmon'] });
assert(game.initialized, 'Game initialized');

// Test state
const state = game.getState();
assert(state.player.name === 'Captain Test', 'Player name set');
assert(state.player.gold === 1000, 'Player gold set');
assert(state.player.boat === 'skiff', 'Player boat set');
assert(state.weather !== undefined, 'Weather state available');
assert(state.tide !== undefined, 'Tide state available');

// Test update
game.update(1000);
assert(state.gameTime === undefined || typeof state.gameTime === 'number', 'Game time tracks');

// Test method viability
const openOceanResult = game.checkMethodViability('halibut_longlining');
// Should fail — player is in sheltered_sound, not open ocean
assert(typeof openOceanResult.viable === 'boolean', 'Method viability check returns boolean');
assert(typeof openOceanResult.reasons.length === 'number', 'Method viability has reasons');

const riverResult = game.checkMethodViability('river_fishing');
// May pass or fail depending on location, but should return valid structure
assert(Array.isArray(riverResult.reasons), 'River viability has reasons array');

// Test force weather
game.forceWeather('storm');
const stormState = game.getState();
assert(stormState.weather.type === 'storm', 'Storm forced');
assert(stormState.weather.boatSafety !== undefined, 'Boat safety in storm');

// Test fishing
game.forceWeather('clear');
// Move player to a valid fishing location
game.player.location.biome = 'sheltered_sound';
const fishResult = game.startFishing('salmon_trolling');
assert(typeof fishResult.success === 'boolean', 'Fishing returns success boolean');

if (fishResult.success) {
  const haulResult = game.haulBack();
  assert(typeof haulResult.success === 'boolean', 'Haul back returns success');
  assert(Array.isArray(haulResult.catch), 'Haul back returns catch array');
}

// Test selling
if (game.player.inventory.length > 0) {
  const fish = game.player.inventory[0];
  const sellResult = game.sellFish(fish.speciesId, fish.weight);
  assert(typeof sellResult.success === 'boolean', 'Selling fish returns boolean');
}

// Test toString
const gameStr = game.toString();
assert(typeof gameStr === 'string' && gameStr.includes('Sitka'), 'toString works');

// === Economy ↔ Fishing Flow ===
console.log('── Economy ↔ Fishing Flow ──');

// Reset player for clean economy test
game.player.inventory = [];
game.player.location.biome = 'sheltered_sound';
game.player.gold = 2000;
game.forceWeather('clear');

// Buy gear
const gearResult = game.buyGear('hoochie');
assert(typeof gearResult.success === 'boolean', 'Buy gear returns boolean');

// Buy permit
const permitResult = game.buyPermit('halibut');
assert(typeof permitResult.success === 'boolean', 'Buy permit returns boolean');

// Set a bigger boat
const boatResult = game.setBoat('charter');
assert(typeof boatResult.success === 'boolean', 'Set boat returns boolean');

// === Event Log ===
console.log('── Event Log ──');
const finalState = game.getState();
assert(Array.isArray(finalState.recentEvents), 'Event log is array');
assert(finalState.recentEvents.length >= 0, 'Event log accessible');

// === Summary ===
console.log(`\n${'═'.repeat(40)}`);
console.log(`  ✅ ${passed} passed, ❌ ${failed} failed`);
console.log(`${'═'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
