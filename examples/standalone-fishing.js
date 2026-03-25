#!/usr/bin/env node
// Standalone Fishing Demo — No Minecraft required!
// Fun terminal fishing with tension, personality, and progression.

import { CraftMindFishing, FishingRod, Bait, TipsSystem, FishingLog } from '../src/index.js';

const tips = new TipsSystem();
const log = new FishingLog();

// Reduced casts for a tighter experience
const CASTS = 20;
const FIRST_CATCH_GUARANTEE = 5; // guarantee catch within first N casts

console.log(`
╔══════════════════════════════════════════════════╗
║     🐟  CraftMind Fishing — Standalone Demo  🐟  ║
║           AI-Powered Fishing Simulation          ║
╚══════════════════════════════════════════════════╝
`);

const fishing = new CraftMindFishing();

fishing.addWater('village_pond', 'plains', { name: 'Sunlit Village Pond', maxDepth: 5, surfaceArea: 80 });
fishing.addWater('ocean_depths', 'deep_ocean', { name: 'Abyssal Ocean Trench', maxDepth: 60, surfaceArea: 500 });
fishing.addWater('nether_lake', 'basalt_deltas', { name: 'Nether Magma Lake', maxDepth: 8, surfaceArea: 40 });
fishing.addWater('end_void', 'end_highlands', { name: 'Void Sea', maxDepth: 20, surfaceArea: 200 });
fishing.addWater('frozen_lake', 'frozen_ocean', { name: 'Permafrost Lake', maxDepth: 15, surfaceArea: 120 });

const angler = fishing.createBot('CaptainHooks', {
  rod: new FishingRod('diamond', { lure: 3, luck_of_the_sea: 2, unbreaking: 2 }),
  baitInventory: [
    new Bait('worm', { stackSize: 64 }),
    new Bait('glow_berries', { stackSize: 32 }),
    new Bait('blazerod_shavings', { stackSize: 16 }),
    new Bait('nautilus_shell_bait', { stackSize: 4 }),
    new Bait('ender_pearl_dust', { stackSize: 2 }),
  ],
});

// Onboarding
const weatherEmoji = TipsSystem.weatherEmoji(fishing.weather.currentWeather, fishing.weather.isThundering);
const moonEmoji = TipsSystem.moonEmoji(fishing.weather.moonPhase);
const timeOfDay = fishing.ecosystem.getTimeOfDay();

console.log(`🐟 Welcome to CraftMind Fishing!`);
console.log(`📍 Biomes: 5 water bodies | ${weatherEmoji} ${fishing.weather.currentWeather} | ${moonEmoji} ${fishing.weather.getMoonPhaseName()}`);
console.log(`🎣 ${angler.rod.toString()}`);
console.log(`💡 ${tips.getTip()}`);
console.log(`\n${'━'.repeat(45)}\n`);

const waterIds = ['village_pond', 'ocean_depths', 'nether_lake', 'end_void', 'frozen_lake'];
const catches = [];
let catchesThisCast = 0;
let hotStreakSpecies = null;
let hotStreakCount = 0;

// Track species diversity for early-game variety boost
const speciesCatchCount = {};

for (let i = 0; i < CASTS; i++) {
  fishing.tick(60000);
  const wid = waterIds[Math.floor(Math.random() * waterIds.length)];
  const water = fishing.ecosystem.getWaterBody(wid);
  const timeOfDayNow = fishing.ecosystem.getTimeOfDay();

  angler.selectBestBait(water?.biome, timeOfDayNow);

  // Cast animation
  process.stdout.write(`🎯 Cast #${i + 1}... `);
  await delay(80);
  process.stdout.write(`whoosh... `);
  await delay(60);
  process.stdout.write(`splash! `);
  await delay(80);
  process.stdout.write(`🫧 bob... `);
  await delay(100);
  process.stdout.write(`bob... `);
  await delay(120);
  process.stdout.write(`bob...\n`);

  // Nibble/bite tension
  const result = angler.fish(fishing.ecosystem, wid, fishing.weather, timeOfDayNow);

  if (!result.success) {
    // First cast guarantee: if no catch by cast FIRST_CATCH_GUARANTEE, force a bite
    if (i < FIRST_CATCH_GUARANTEE && catches.length === 0) {
      process.stdout.write(`  ~ nibble... `);
      await delay(80);
      process.stdout.write(`! BITE!\n`);
      // Force a catch by picking a random species and catching it
      const biome = water?.biome ?? 'plains';
      const allSpecies = [...new Set(FishingSpeciesRegistry_forBiome(biome))];
      if (allSpecies.length > 0) {
        // Pick an uncommon or better species for the guaranteed catch
    const nonCommon = allSpecies.filter(s => s.rarity !== 'Common');
    const species = nonCommon.length > 0
      ? nonCommon[Math.floor(Math.random() * nonCommon.length)]
      : allSpecies[Math.floor(Math.random() * allSpecies.length)];
    const size = FishSpeciesRegistry.randomSize(species);
    const weight = size * species.avgWeight;
    const forcedCaught = {
      species, size: Math.round(size * 100) / 100,
      weight: Math.round(weight * 100) / 100,
      caughtAt: Date.now(), baitUsed: angler.currentBait?.id ?? 'worm',
      weather: fishing.weather.currentWeather, timeOfDay: timeOfDayNow,
    };
    fishing.economy.trackCatch(forcedCaught);
    const sale = fishing.economy.sell(forcedCaught, 'raw');
    catches.push(forcedCaught);
    const catchResult = log.recordCatch(forcedCaught, sale.value);
    displayCatch(forcedCaught, sale.value, i + 1, tips, log, speciesCatchCount, catchResult);
    continue;
      }
    }

    // Junk chance (rare — 5% of misses)
    if (Math.random() < 0.05) {
      const junk = tips.getRandomJunk();
      process.stdout.write(`  ~ something snagged... 🗑️ ${junk.emoji} ${junk.name} (junk)\n`);
      process.stdout.write(`     "${tips.getJunkJoke()}"\n`);
      log.recordJunk(junk.name);
    } else if (Math.random() < 0.4) {
      // Nibble but got away
      process.stdout.write(`  ~ nibble... `);
      await delay(100);
      process.stdout.write(`💥 Got away!\n`);
    } else {
      // Nothing
      process.stdout.write(`  . . . nothing\n`);
    }
    log.recordMiss();
  } else {
    // Show bite tension
    process.stdout.write(`  ~ nibble... `);
    await delay(80);
    process.stdout.write(`! BITE! `);
    await delay(60);
    process.stdout.write(`reel... `);
    await delay(100);

    const c = result.caught;
    fishing.economy.trackCatch(c);
    const sale = fishing.economy.sell(c, 'raw');
    catches.push(c);
    const catchResult = log.recordCatch(c, sale.value);
    displayCatch(c, sale.value, i + 1, tips, log, speciesCatchCount, catchResult);
  }
}

console.log(`\n${'═'.repeat(45)}`);
console.log(`📊  SESSION RESULTS`);
console.log(`${'═'.repeat(45)}`);

console.log(`🎣 Catches: ${catches.length}/${CASTS} (${log.catchRate}% rate)`);
console.log(`💰 Balance: ${fishing.economy.balance.toFixed(2)} emeralds`);
console.log(`⬆️ Level: ${log.level} (${log.xp} XP)`);

const rareCatches = catches.filter(c => c.species.rarity !== 'Common');
if (rareCatches.length > 0) {
  console.log(`\n🌟 Notable catches:`);
  for (const c of rareCatches) {
    console.log(`   ${c.species.emoji} ${c.species.name} [${c.species.rarity}] — ${c.weight}kg`);
  }
}

const totalPop = fishing.ecosystem.getStatus().bodies.reduce((s, b) => s + b.totalPopulation, 0);
console.log(`\n🎯 Unique species: ${angler.caughtSpecies.size} | 🐠 ${totalPop} fish in ecosystem`);
console.log(`📊 ${angler.getStats().knowledgeEntries} knowledge entries learned`);
const achievements = fishing.economy.getAchievements().filter(a => a.achieved);
console.log(`🏆 Achievements: ${achievements.length} (${achievements.map(a => a.name).join(', ') || 'none yet'})`);
console.log(fishing.weather.toString());

// Next time hook
const bestBait = catches.length > 0
  ? catches.reduce((a, b) => a.weight > b.weight ? a : b).baitUsed
  : 'worm';
console.log(`\n💡 Try using ${bestBait} bait — the fish were biting it today!`);

// Fisherman's Log
console.log(log.generateLog());

// --- Helpers ---

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function displayCatch(caught, saleValue, castNum, tips, log, speciesCount, catchResult) {
  const rarity = caught.species.rarity;
  const emoji = TipsSystem.rarityEmoji(rarity);

  speciesCount[caught.species.id] = (speciesCount[caught.species.id] || 0) + 1;

  let line = `  ${emoji} ${caught.species.name} (${caught.size.toFixed(2)}m, ${caught.weight.toFixed(2)}kg) — 💰 ${saleValue}`;

  // Rarity display
  if (rarity !== 'Common') {
    line = `  ${TipsSystem.rarityDisplay(rarity)} ${line.trim()}`;
  }

  console.log(line);

  // Size excitement
  if (FishingLog.isBigOne(caught)) {
    console.log(`     WOW! That's a BIG one! 🎉`);
  }

  // Personal best
  if (catchResult?.wasPersonalBest) {
    console.log(`     🏆 Personal best ${caught.species.name}! (was ${catchResult.previousSize.toFixed(2)}m, now ${caught.size.toFixed(2)}m)`);
  }

  // First rare tip
  const rareTip = tips.getFirstRareTip(rarity);
  if (rareTip) {
    console.log(`     ${rareTip}`);
  }

  // Rotating tip (every 3rd catch)
  if (catches.length % 3 === 0) {
    console.log(`     💡 ${tips.getTip()}`);
  }
}

// Import helpers that we need inline
import { FishSpeciesRegistry } from '../src/fish-species.js';

function FishingSpeciesRegistry_forBiome(biome) {
  return FishSpeciesRegistry.forBiome(biome);
}
