#!/usr/bin/env node
// CraftMind Fishing — Methods Demo
// Show all 12 methods with adventure-magazine flavor.
// "Running this should feel like reading an adventure magazine."

import { FishingMethodRegistry, GearCraftingSystem, WeatherFishingSystem, SkillSystem } from '../src/index.js';
import { WeatherSystem } from '../src/weather-system.js';
import { Ecosystem } from '../src/ecosystem.js';

const weather = new WeatherSystem();
const ecosystem = new Ecosystem();
const weatherKey = weather.isThundering ? 'storm' : weather.currentWeather;
const season = ecosystem.getSeason();

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║          🐟  CraftMind Fishing — 12 Methods Showcase  🐟        ║
║              "Every water has a thousand ways to fish it"         ║
╠═══════════════════════════════════════════════════════════════════╣
║  🌦️  Weather: ${weather.currentWeather.padEnd(10)}  🌡️ ${String(Math.round(weather.temperature) + '°C').padEnd(4)}  📅 Season: ${season.padEnd(8)}  ║
╚═══════════════════════════════════════════════════════════════════╝
`);

// Weather report
console.log('\n' + WeatherFishingSystem.getWeatherReport(weather, season));
console.log('');

const methods = FishingMethodRegistry.all();
const skills = new SkillSystem();

for (const method of methods) {
  const mod = WeatherFishingSystem.getModifier(method.id, weather, season);
  const rec = mod.multiplier >= 1.2 ? ' 🌟 RECOMMENDED' : mod.multiplier <= 0.5 ? ' ⚠️ NOT ADVISED' : '';

  console.log(`${'━'.repeat(58)}`);
  console.log(`${method.icon}  ${method.name.toUpperCase()}${rec}`);
  console.log(`${'━'.repeat(58)}`);
  console.log(`  "${method.flavor}"`);
  console.log('');
  console.log(`  📋 ${method.description}`);
  console.log(`  ⭐ Difficulty: ${'★'.repeat(method.difficulty)}${'☆'.repeat(5 - method.difficulty)}   ⚠️ Risk: ${'⚠'.repeat(method.risk)}${'○'.repeat(5 - method.risk)}   🎯 Yield: ${'◆'.repeat(Math.min(5, Math.ceil(method.yield)))}   🔓 Unlock: Lv.${method.unlockLevel}`);
  console.log(`  🏷️  ${method.tags.map(t => '[' + t + ']').join(' ')}`);

  // Gear required
  if (method.gearRequired.length > 0) {
    console.log(`  🎒 Gear: ${method.gearRequired.join(', ')}`);
  }

  // Weather note
  const weatherNote = mod.notes.filter(n => n).join(' | ');
  if (weatherNote) {
    console.log(`  🌦️  ${weatherNote}`);
  }

  // Simulate a mini-session
  const state = method.setup({ biome: 'ocean' }, { x: 0, y: 10, z: 0 });
  const tree = skills.getTree(method.id);
  tree.addXp(5 + Math.floor(Math.random() * 10));

  // Run a few ticks with context
  const ctx = {
    weather,
    baitEffectiveness: 0.6,
    skillLevel: 3,
    rod: { castDistance: 25 },
    lineInWater: true,
  };

  // Method-specific context
  if (method.id === 'jigging') { ctx.startJigging = true; ctx.jigInput = true; ctx.jigTiming = 300; }
  if (method.id === 'bait_casting') { /* auto-progression */ }
  if (method.id === 'surf_casting') { ctx.cast = true; state.stormActive = weather.isThundering; }
  if (method.id === 'free_diving') { ctx.approach = true; ctx.stealth = 0.6; }
  if (method.id === 'spearfishing') { ctx.throwSpear = true; ctx.aim = { x: 1, y: 0, z: 0 }; ctx.skill = 0.6; }
  if (method.id === 'crab_pots') { for (let i = 0; i < 6; i++) method.placePot(state, { nearCoral: Math.random() > 0.5 }); ctx.checkPots = true; }
  if (method.id === 'ice_fishing') { ctx.lineInWater = true; }
  if (method.id === 'trolling') { ctx.speed = 0.6; }
  if (method.id === 'trawling') { ctx.deploy = true; }
  if (method.id === 'longlining') { ctx.deployLine = true; }

  for (let t = 0; t < 5; t++) {
    const result = method.tick(1000, state, ctx);
    if (result.events.length > 0) {
      for (const ev of result.events) {
        const urgent = ev.urgent ? ' ‼️' : '';
        const msg = ev.message ?? `${ev.type.replace(/_/g, ' ')}${ev.fish ? ': ' + ev.fish : ''}`;
        console.log(`    ${method.icon} ${msg}${urgent}`);
      }
    }
    if (result.catches.length > 0) {
      for (const c of result.catches) {
        console.log(`    🐟 CAUGHT: ${c.emoji ?? '🐟'} ${c.name} (${c.weight.toFixed(1)}kg)${c.quality ? ' — ' + c.quality : ''}`);
      }
    }
  }

  console.log(`  📊 Skill: ${tree.getProgressBar()} "${tree.getTitle()}"`);
  console.log('');
}

// Recommendation
const allIds = methods.map(m => m.id);
const rec = WeatherFishingSystem.recommend(weather, season, allIds);
const recMethod = FishingMethodRegistry.get(rec.method);
console.log(`${'━'.repeat(58)}`);
console.log(`🎯 TODAY'S RECOMMENDATION: ${recMethod.icon} ${recMethod.name} (x${rec.score.toFixed(1)})`);
console.log(`   ${rec.notes.join(' | ')}`);
console.log(`${'━'.repeat(58)}`);

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║   🎣 12 methods. 12 personalities. One ocean. What's your play?  ║
╚═══════════════════════════════════════════════════════════════════╝
`);
