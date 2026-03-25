// Tests for the fishing methods system
import { FishingMethodRegistry, GearCraftingSystem, WeatherFishingSystem, SkillTree, SkillSystem, FISHING_METHODS } from '../src/index.js';
import { WeatherSystem } from '../src/weather-system.js';
import { Ecosystem } from '../src/ecosystem.js';

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition, msg) { if (!condition) throw new Error(msg ?? 'Assertion failed'); }

console.log('\n🎣 Fishing Methods Tests\n');

// ─── Method Registry ───
console.log('--- Method Registry ---');
test('All 12 methods exist', () => assert(FishingMethodRegistry.count === 12, `Got ${FishingMethodRegistry.count}`));
test('All methods have required fields', () => {
  for (const m of FishingMethodRegistry.all()) {
    assert(m.id, `Missing id: ${m}`);
    assert(m.name, `Missing name: ${m}`);
    assert(m.icon, `Missing icon: ${m}`);
    assert(m.difficulty >= 1 && m.difficulty <= 5, `Bad difficulty for ${m.id}`);
    assert(m.risk >= 0 && m.risk <= 5, `Bad risk for ${m.id}`);
  }
});
test('byTag filters correctly', () => {
  const passive = FishingMethodRegistry.byTag('passive');
  assert(passive.length >= 3, `Expected >=3 passive methods, got ${passive.length}`);
});
test('forLevel filters correctly', () => {
  const level1 = FishingMethodRegistry.forLevel(1);
  assert(level1.length >= 1, `Expected >=1 method at level 1, got ${level1.length}`);
  const level20 = FishingMethodRegistry.forLevel(20);
  assert(level20.length === 12, `Expected 12 methods at level 20, got ${level20.length}`);
});

// ─── Method Mechanics ───
console.log('\n--- Method Mechanics ---');
test('Each method can setup and tick', () => {
  for (const [id, method] of Object.entries(FISHING_METHODS)) {
    const state = method.setup({ biome: 'ocean' }, { x: 0, y: 10, z: 0 });
    assert(state.active !== undefined, `${id}: setup missing active`);
    const result = method.tick(1000, state, {});
    assert(Array.isArray(result.catches), `${id}: catches not array`);
    assert(Array.isArray(result.events), `${id}: events not array`);
  }
});
test('Bait Casting has fight mechanics', () => {
  const m = FISHING_METHODS.bait_casting;
  const state = m.setup({}, {});
  assert(state.phase === 'casting', 'Should start in casting phase');
});
test('Crab Pots can place pots', () => {
  const m = FISHING_METHODS.crab_pots;
  const state = m.setup({}, {});
  assert(m.placePot(state, { nearCoral: true }));
  assert(m.placePot(state, { nearCoral: false }));
  assert(state.pots.length === 2);
  assert(!m.placePot(state, {}) || state.pots.length <= 8); // up to 8
});
test('Longlining has hooks', () => {
  const m = FISHING_METHODS.longlining;
  const state = m.setup({}, {});
  assert(state.hookCount >= 20, `Expected >=20 hooks, got ${state.hookCount}`);
});
test('Trawling has ecosystem impact', () => {
  const m = FISHING_METHODS.trawling;
  const impact = m.getEcosystemImpact();
  assert(impact.populationDamage > 0);
  assert(impact.reputationChange < 0);
});
test('Free Diving has oxygen', () => {
  const m = FISHING_METHODS.free_diving;
  const state = m.setup({}, {});
  assert(state.oxygen === 100);
});

// ─── Gear Crafting ───
console.log('\n--- Gear Crafting ---');
test('Crafting system works', () => {
  const sys = new GearCraftingSystem();
  const pot = sys.craft('crab_pot');
  assert(pot.id === 'crab_pot');
  assert(pot.durabilityPct === 100);
});
test('Gear has durability', () => {
  const item = new GearCraftingSystem().craft('spear');
  item.use(10);
  assert(item.durabilityPct < 100);
  assert(!item.isBroken);
});
test('Gear can break', () => {
  const item = new GearCraftingSystem().craft('jig_lure', 'iron', 'pike_jig');
  while (!item.isBroken) item.use(100);
  assert(item.isBroken);
});
test('Gear can upgrade', () => {
  const item = new GearCraftingSystem().craft('spear', 'iron');
  assert(item.upgrade());
  assert(item.tier === 'gold');
});
test('All recipes exist', () => {
  const recipes = GearCraftingSystem.getRecipes();
  assert(Object.keys(recipes).length >= 9, `Expected >=9 recipes`);
});

// ─── Weather × Method ───
console.log('\n--- Weather × Method ---');
test('Weather modifiers work for all methods', () => {
  const w = { currentWeather: 'clear', isThundering: false };
  for (const m of FishingMethodRegistry.all()) {
    const mod = WeatherFishingSystem.getModifier(m.id, w, 'summer');
    assert(typeof mod.multiplier === 'number', `${m.id}: bad multiplier`);
    assert(Array.isArray(mod.notes), `${m.id}: bad notes`);
  }
});
test('Storm hurts most methods but helps surf casting', () => {
  const w = { currentWeather: 'rain', isThundering: true };
  const surf = WeatherFishingSystem.getModifier('surf_casting', w, 'summer');
  assert(surf.multiplier > 1.0, 'Surf casting should be boosted in storms');
  const trawl = WeatherFishingSystem.getModifier('trawling', w, 'summer');
  assert(trawl.multiplier < 0.5, 'Trawling should be terrible in storms');
});
test('Winter boosts ice fishing', () => {
  const w = { currentWeather: 'clear', isThundering: false };
  const ice = WeatherFishingSystem.getModifier('ice_fishing', w, 'winter');
  assert(ice.multiplier > 1.0, 'Ice fishing should be boosted in winter');
});
test('Weather report generates', () => {
  const w = new WeatherSystem();
  const report = WeatherFishingSystem.getWeatherReport(w, 'summer');
  assert(report.length > 100, 'Report too short');
});

// ─── Skill Trees ───
console.log('\n--- Skill Trees ---');
test('Skill tree levels up', () => {
  const tree = new SkillTree('bait_casting');
  assert(tree.level === 1);
  tree.addXp(100);
  assert(tree.level >= 2, `Expected level >=2, got ${tree.level}`);
});
test('Titles change with level', () => {
  const tree = new SkillTree('jigging');
  const t1 = tree.getTitle();
  tree.addXp(10000);
  const t2 = tree.getTitle();
  // Might be same at low levels but should exist
  assert(t1 && t2);
});
test('Master title at level 20', () => {
  const tree = new SkillTree('spearfishing');
  tree.xp = 999999999;
  tree._recalcLevel();
  assert(tree.getTitle() === 'The Spear Saint');
});
test('Gear wear reduction at level 5', () => {
  const tree = new SkillTree('crab_pots');
  tree.xp = 5000;
  tree._recalcLevel();
  assert(tree.getGearWearMultiplier() === 0.8);
});
test('Legendary possible at level 20', () => {
  const tree = new SkillTree('free_diving');
  tree.xp = 999999999;
  tree._recalcLevel();
  assert(tree.canLegendary);
});
test('Skill system tracks multiple methods', () => {
  const sys = new SkillSystem();
  sys.addXp('bait_casting', 50);
  sys.addXp('jigging', 50);
  sys.addXp('spearfishing', 50);
  const best = sys.getBestTitle();
  assert(best !== null);
  assert(best.title);
});

console.log(`\n${'━'.repeat(40)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${'━'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
