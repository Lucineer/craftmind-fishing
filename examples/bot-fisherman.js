#!/usr/bin/env node
// Bot Fisherman Demo — Demonstrates bot fishing, knowledge sharing, and tournaments.

import { CraftMindFishing } from '../src/index.js';
import { FishingRod } from '../src/rod-system.js';
import { Bait } from '../src/bait-system.js';
import { Tournament } from '../src/tournament.js';

console.log(`
╔═══════════════════════════════════════════════════════╗
║   🤖  CraftMind Fishing — Bot Fisherman Demo  🤖     ║
║     Autonomous bots compete in a fishing tournament    ║
╚═══════════════════════════════════════════════════════╝
`);

const fishing = new CraftMindFishing();
fishing.addWater('tournament_pond', 'ocean', { name: 'Tournament Cove', maxDepth: 40, surfaceArea: 300 });

// Create competing bots with different strategies
const bots = [
  fishing.createBot('Bot_Alpha', {
    rod: new FishingRod('diamond', { lure: 3, luck_of_the_sea: 3 }),
    baitInventory: [
      new Bait('nautilus_shell_bait', { stackSize: 20 }),
      new Bait('glow_ink_sac', { stackSize: 20 }),
    ],
  }),
  fishing.createBot('Bot_Beta', {
    rod: new FishingRod('netherite', { unbreaking: 3 }),
    baitInventory: [
      new Bait('worm', { stackSize: 64 }),
      new Bait('minnow', { stackSize: 32 }),
    ],
  }),
  fishing.createBot('Bot_Gamma', {
    rod: new FishingRod('prismarine', { lure: 5, luck_of_the_sea: 2 }),
    baitInventory: [
      new Bait('glow_berries', { stackSize: 32 }),
      new Bait('prismarine_shard_bait', { stackSize: 16 }),
    ],
  }),
];

console.log(`\n⚓ Tournament Mode: Species Collection\n`);
const tournament = new Tournament({
  name: 'Grand Fishing Championship',
  mode: 'species_collection',
  duration: 30000, // 30 seconds of sim time
});

for (const bot of bots) tournament.addParticipant(bot);
tournament.start();

// Run rounds
const ROUNDS = 100;
for (let i = 0; i < ROUNDS; i++) {
  fishing.tick(60000);
  const timeOfDay = fishing.ecosystem.getTimeOfDay();

  for (const bot of bots) {
    if (tournament.isActive()) {
      bot.selectBestBait('ocean', timeOfDay);
      const result = bot.fish(fishing.ecosystem, 'tournament_pond', fishing.weather, timeOfDay);
      if (result.success) {
        tournament.recordCatch(bot.name, result.caught);
      }
    }
  }
}

const leaderboard = tournament.end();

console.log(`🏆 TOURNAMENT RESULTS: ${tournament.name}\n`);
console.log(`${'Rank'.padEnd(6)} ${'Bot'.padEnd(16)} ${'Score'.padEnd(8)} ${'Catches'.padEnd(8)} ${'Species'.padEnd(8)} ${'Best Catch'}`);
console.log(`${'─'.repeat(60)}`);

for (const entry of leaderboard) {
  const best = entry.bestCatch ? `${entry.bestCatch.species.emoji} ${entry.bestCatch.species.name} (${entry.bestCatch.weight}kg)` : '—';
  console.log(`${`#${entry.rank}`.padEnd(6)} ${entry.name.padEnd(16)} ${String(entry.score).padEnd(8)} ${String(entry.catches).padEnd(8)} ${String(entry.uniqueSpecies).padEnd(8)} ${best}`);
}

// Knowledge sharing demo
console.log(`\n🧠 Knowledge Sharing:`);
for (const bot of bots) {
  console.log(`  ${bot.name}: ${bot.knowledge.size} knowledge entries, ${bot.caughtSpecies.size} species caught`);
}

// Bot Alpha shares knowledge with Gamma
bots[0].knowledge.merge(bots[1].knowledge);
console.log(`\n  🤝 Bot_Alpha learned from Bot_Beta: now has ${bots[0].knowledge.size} entries`);

console.log(`\n${fishing.weather.toString()}`);
