#!/usr/bin/env node
// Fleet Demo — Dramatic expedition with tension, dialogue, and narrative.
// Feels like reading an adventure story.

import { Fleet, FleetMember } from '../src/fleet.js';
import { FleetCaptain } from '../src/fleet-captain.js';
import { MarineHazardSystem } from '../src/marine-hazards.js';
import { WorkflowEngine } from '../src/workflow-engine.js';
import { FishingCompany } from '../src/fishing-company.js';
import { SafetyNet } from '../src/safety-net.js';
import { Boat } from '../src/boat.js';
import { TipsSystem } from '../src/tips.js';
import { FishingLog } from '../src/fishing-log.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

console.log(`
╔══════════════════════════════════════════════════╗
║   ⚓  CraftMind Fishing — Fleet Expedition  ⚓    ║
║         Adventure on the Deep Reef Run          ║
╚══════════════════════════════════════════════════╝
`);

// 1. Create the fishing company
console.log('🏢 Creating CedarBeach Fisheries...');
await delay(400);
const company = new FishingCompany({ name: 'CedarBeach Fisheries', owner: 'SafeArtist2047' });

// 2. Assemble fleet with personalities
console.log('\n⚓ Assembling Fleet...\n');
await delay(300);

const fleet = company.fleet;
fleet.addMember('Captain Cody', { role: 'captain', specialty: 'strategy', personality: 'veteran', skill: 7 });
fleet.addMember('Nova', { role: 'scout', specialty: 'deep_water', personality: 'lucky', skill: 8 });
fleet.addMember('Rex', { role: 'tanker', specialty: 'big_game', personality: 'reckless', skill: 6 });
fleet.addMember('Iris', { role: 'support', specialty: 'bait_crafting', personality: 'cautious', skill: 7 });

for (const [, member] of fleet.members) member.isOnline = true;

const memberEmojis = { 'Captain Cody': '🧑‍✈️', 'Nova': '🌊', 'Rex': '💪', 'Iris': '🧪' };
const memberStatuses = {};

function setRandomStatus(name) {
  const statuses = ['🎣 Casting...', '⏳ Waiting...', '🎣 Reeling in...', '📊 Checking gear', '🐟 Watching the water'];
  memberStatuses[name] = statuses[Math.floor(Math.random() * statuses.length)];
}

function statusLine() {
  const parts = Object.entries(memberStatuses).map(([name, status]) =>
    `${memberEmojis[name] ?? '🎣'} ${name.split(' ').pop()}: ${status}`
  );
  return '   ' + parts.join(' | ');
}

console.log(`   🧑‍✈️ Captain Cody (veteran strategist) — "The sea tests us all."`);
console.log(`   🌊 Nova (lucky scout) — "I can feel them out there..."`);
console.log(`   💪 Rex (reckless tanker) — "Bigger fish, bigger glory!"`);
console.log(`   🧪 Iris (cautious support) — "Safety first. Always."`);
await delay(500);

// 3. Captain
console.log('\n🧠 Initializing Fleet Captain AI...');
await delay(300);
const captain = new FleetCaptain({ fleet, apiKey: null });

// 4. Safety net
console.log('🛡️ Deploying Safety Net...');
await delay(300);
const safety = new SafetyNet(fleet);
safety.onEvent(e => {
  console.log(`   [🛡️ SafetyNet] ${e.type === 'rescue_dispatched' ? '🚨 ' + e.message : '✅ ' + e.type}`);
});

// 5. Market
console.log('💰 Opening market at Deep Reef outpost...');
await delay(300);
company.market.setBasePrice('prismarine_cod', 25);
company.market.setBasePrice('glow_squid', 40);
company.market.setBasePrice('ender_perch', 60);
company.market.setBasePrice('warden_catfish', 100);
company.market.spawnCustomers(5);

// 6. Hazards
const hazards = new MarineHazardSystem({ spawnRate: 0.1 });
hazards.onEvent(e => console.log(`   [🌊 Hazard] ${e.type}`));

// 7. Workflow
console.log('📋 Defining expedition plan...\n');
await delay(400);
const workflowEngine = new WorkflowEngine();
workflowEngine.define('expedition', WorkflowEngine.expeditionDefinition({ target: 'Deep Reef' }));

// 8. BOAT
console.log('🚤 Boarding The Cody Express...\n');
await delay(300);
const boat = new Boat('The Cody Express', 'trawler');
boat.upgrade('radar', 2);
boat.upgrade('capacity', 3);
boat.installEquipment('sonar');
console.log(`   ${boat.toString()}`);
await delay(500);

// ═══════════════════════════════════════════
// 🚢 EXPEDITION START
// ═══════════════════════════════════════════
console.log(`\n${'━'.repeat(50)}`);
console.log(`🚢 === EXPEDITION: DEEP REEF RUN ===`);
console.log(`   Target: Deep Reef (-400, 64, -200)`);
console.log(`   Crew: Cody, Nova, Rex, Iris`);
console.log(`   Vessel: ${boat.name} (${boat.tier})`);
console.log(`${'━'.repeat(50)}\n`);
await delay(600);

const startTime = Date.now();
let elapsed = () => {
  const s = Math.round((Date.now() - startTime) / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

fleet.startExpedition({ x: -400, y: 64, z: -200 }, { name: 'Deep Reef Run' });
const expedition = workflowEngine.create('expedition');
workflowEngine.setActive(expedition);
expedition.onStepComplete = (step, result) => {
  console.log(`   ✅ Step "${step.name}" complete`);
};
expedition.start();

let tick = 0;
const maxTicks = 12;

while (expedition.status === 'running' && tick < maxTicks) {
  console.log(`\n--- ⏱️ Tick ${tick + 1} (${elapsed()}) ---`);

  // Set random statuses
  for (const name of Object.keys(memberEmojis)) setRandomStatus(name);

  // Tick workflow
  const results = workflowEngine.tick();

  // ── TICK 1: DEPARTURE ──
  if (tick === 0) {
    memberStatuses['Captain Cody'] = '🧭 Plotting course';
    memberStatuses['Nova'] = '🔭 Scanning horizon';
    memberStatuses['Rex'] = '🔧 Checking harpoons';
    memberStatuses['Iris'] = '📦 Stocking supplies';
    console.log(statusLine());
    console.log(`   Captain Cody: "Alright crew, Deep Reef awaits. Stay sharp out there."`);
    console.log(`   Nova: "Sonar's picking up some large signatures to the east..."`);
    await delay(600);
  }
  // ── TICK 2: ARRIVAL & FIRST CASTS ──
  else if (tick === 1) {
    console.log(`   📍 Arrived at Deep Reef coordinates.`);
    console.log(`   Captain Cody: "Drop anchor. Let's see what's biting."`);
    memberStatuses['Captain Cody'] = '🎣 Casting...';
    memberStatuses['Nova'] = '🎣 Casting...';
    memberStatuses['Rex'] = '🎣 Casting...';
    memberStatuses['Iris'] = '🧪 Crafting bait';
    console.log(statusLine());
    await delay(500);

    // First catches
    fleet.getMember('Nova').catches.push({ species: { id: 'prismarine_cod', name: 'Prismarine Cod', rarity: 'Uncommon', baseValue: 25, emoji: '🐟' }, weight: 2.3 });
    fleet.getMember('Rex').catches.push({ species: { id: 'prismarine_cod', name: 'Prismarine Cod', rarity: 'Common', baseValue: 10, emoji: '🐟' }, weight: 1.1 });
    console.log(`   🌊 Nova: "🐟 Got a Prismarine Cod! Solid start."`);
    console.log(`   💪 Rex: "Small fry. I want the big ones."`);
  }
  // ── TICK 3: CAPTAIN REVIEW ──
  else if (tick === 2) {
    memberStatuses['Captain Cody'] = '🧠 Reviewing strategy';
    console.log(statusLine());
    await delay(400);
    console.log(`   🧠 Captain reviewing strategy...`);
    const decision = await captain.review();
    if (decision) {
      console.log(`   🧑‍✈️ Captain: "${decision.action}: ${decision.reasoning}"`);
    }
    await delay(400);
    fleet.getMember('Iris').catches.push({ species: { id: 'glow_squid', name: 'Glow Squid', rarity: 'Rare', baseValue: 40, emoji: '🦑' }, weight: 3.8 });
    console.log(`   🧪 Iris: "🦑 RARE! Glow Squid! My special bait worked!"`);
    console.log(`   Captain Cody: "Excellent. Keep that bait recipe handy."`);
  }
  // ── TICK 4: SHARK ATTACK (DRAMATIC!) ──
  else if (tick === 3) {
    await delay(600);
    console.log(`\n   ${'⚠️'.repeat(10)}`);
    console.log(`   🦈 ⚠️ SHARK PACK DETECTED NEAR NOVA!`);
    console.log(`   ${'⚠️'.repeat(10)}\n`);
    await delay(800);

    memberStatuses['Nova'] = '🆘 IN DANGER!';
    memberStatuses['Rex'] = '⚔️ Fighting!';
    memberStatuses['Iris'] = '🆘 IN DANGER!';
    memberStatuses['Captain Cody'] = '🧭 Coordinating';
    console.log(statusLine());
    await delay(600);

    console.log(`   🌊 Nova: "Something's moving in the water..."`);
    await delay(500);
    console.log(`   💪 Rex: "I see fins! Three of them!"`);
    await delay(500);
    console.log(`   🌊 Nova: "SOS! They're circling my line!"`);
    await delay(400);
    console.log(`   🧑‍✈️ Captain Cody: "All fleet, converge on Nova's position! Rex, you too!"`);
    await delay(400);
    console.log(`   🧪 Iris: "Deploying decoy bait! 🎣"`);
    await delay(300);
    console.log(`   💪 Rex: "Coming Nova! Hold on!"`);
    await delay(600);

    const shark = hazards.spawn('shark_pack', { location: { x: -380, z: -180 } });
    console.log(`   🦈 ${shark.name} at (${shark.location.x}, ${shark.location.z}), radius: ${shark.radius}`);
    await delay(400);

    // Safety responses
    safety.memberInDanger('Nova', shark);
    safety.memberInDanger('Rex', shark);
    await delay(600);

    const hazardEvents = hazards.tick([...fleet.members.values()], Array(20));
    await delay(400);

    console.log(`   🦈 Shark pack scared off by fleet coordination!`);
    await delay(400);
    console.log(`   🌊 Nova: "That was too close... thanks everyone 💙"`);
    console.log(`   💪 Rex: "Next time, I'll fight 'em bare-handed."`);
    console.log(`   🧪 Iris: "Let's NOT have a next time."`);
    await delay(600);
  }
  // ── TICK 5-6: RECOVERY & BIG CATCH ──
  else if (tick === 4) {
    memberStatuses['Nova'] = '😰 Recovering';
    memberStatuses['Rex'] = '💪 Showing off';
    memberStatuses['Iris'] = '🧪 Crafting bait';
    memberStatuses['Captain Cody'] = '🎣 Casting...';
    console.log(statusLine());
    await delay(400);
    console.log(`   Captain Cody: "Everyone okay? Good. The fish are still here — sharks didn't scare them all."`);
    await delay(400);
    fleet.getMember('Rex').catches.push({ species: { id: 'warden_catfish', name: 'Warden Catfish', rarity: 'Epic', baseValue: 100, emoji: '🐱' }, weight: 28.5 });
    await delay(300);
    console.log(`   💪 Rex: "🔥 EPIC CATCH! Warden Catfish — 28.5kg!!"`);
    console.log(`   🌊 Nova: "Okay that's actually impressive."`);
    console.log(`   🧪 Iris: "Told you big game fishing was about patience."`);
    await delay(400);
  }
  else if (tick === 5) {
    console.log(statusLine());
    await delay(300);
    fleet.getMember('Nova').catches.push({ species: { id: 'glow_squid', name: 'Glow Squid', rarity: 'Rare', baseValue: 40, emoji: '🦑' }, weight: 4.1 });
    fleet.getMember('Captain Cody').catches.push({ species: { id: 'ender_perch', name: 'Ender Perch', rarity: 'Rare', baseValue: 60, emoji: '🐠' }, weight: 1.8 });
    console.log(`   🌊 Nova: "🦑 Another Glow Squid! 4.1kg!"`);
    console.log(`   🧑‍✈️ Captain Cody: "🐠 Ender Perch — rare AND beautiful."`);
    await delay(300);
    console.log(`   💪 Rex: "You know what they say — third time's the..."`);
    await delay(300);
    fleet.getMember('Rex').catches.push({ species: { id: 'prismarine_cod', name: 'Prismarine Cod', rarity: 'Common', baseValue: 10, emoji: '🐟' }, weight: 0.8 });
    console.log(`   💪 Rex: "...charm? That's just a cod."`);
    await delay(500);
  }
  // ── TICKS 6+: WRAPPING UP ──
  else {
    console.log(statusLine());
    await delay(300);
    // Occasional catch
    if (Math.random() > 0.5) {
      const members = ['Nova', 'Rex', 'Iris', 'Captain Cody'];
      const m = members[Math.floor(Math.random() * members.length)];
      const fishNames = ['Prismarine Cod', 'Glow Squid', 'Deep Sea Angler'];
      console.log(`   ${memberEmojis[m]} ${m.split(' ').pop()}: "🐟 ${fishNames[Math.floor(Math.random() * fishNames.length)]} on the line!"`);
      await delay(300);
    }
    for (const r of results) {
      if (r.status === 'complete') console.log(`   ✅ ${r.step}: complete`);
    }
  }

  tick++;
  await delay(400);
}

// Complete expedition
fleet.endExpedition(true);
console.log(`\n${'━'.repeat(50)}`);
console.log(`🚢 EXPEDITION COMPLETE (${elapsed()})`);
console.log(`${'━'.repeat(50)}\n`);

// CATCH REPORT
console.log(`📊 === CATCH REPORT ===\n`);
for (const [name, member] of fleet.members) {
  const emoji = memberEmojis[name] ?? '🎣';
  const totalWeight = member.catches.reduce((s, c) => s + (c.weight || 0), 0);
  const species = [...new Set(member.catches.map(c => c.species?.name))].join(', ');
  const rares = member.catches.filter(c => c.species?.rarity !== 'Common');
  console.log(`   ${emoji} ${name}: ${member.catches.length} fish (${totalWeight.toFixed(1)}kg)`);
  if (species) console.log(`      Species: ${species}`);
  if (rares.length > 0) {
    rares.forEach(c => console.log(`      🌟 ${c.species.name} [${c.species.rarity}] — ${c.weight}kg`));
  }
  await delay(200);
}

// Track total before selling (sellCatch clears the array)
const totalCatch = [...fleet.members.values()].reduce((s, m) => s + m.catches.length, 0);
const epics = [...fleet.members.values()].flatMap(m => m.catches.filter(c => c.species?.rarity !== 'Common'));

console.log(`\n🏪 === SELLING CATCH ===\n`);
await delay(400);
const goldEarned = company.sellCatch();
console.log(`   Sold all catch for 💰 ${Math.round(goldEarned * 100) / 100} gold!`);
await delay(300);

// MARKET REPORT
console.log(`\n📈 === MARKET REPORT ===\n`);
for (const species of ['prismarine_cod', 'glow_squid', 'ender_perch']) {
  const demand = company.market.getDemand(species);
  const emoji = demand.trend === 'up' ? '📈' : demand.trend === 'down' ? '📉' : '➡️';
  console.log(`   ${emoji} ${species}: ${demand.price}g (${demand.trend}, ${demand.reason})`);
}

// COMPANY STATUS
console.log(`\n🏢 === COMPANY STATUS ===\n`);
const status = company.getStatus();
console.log(`   Company: ${status.name}`);
console.log(`   Fleet members: ${status.fleet?.members ?? 'online'}`);
console.log(`   Balance: 💰 ${status.balance ?? goldEarned} gold`);

// NARRATIVE SUMMARY
console.log(`\n${'═'.repeat(50)}`);
console.log(`📝 EXPEDITION LOG — Deep Reef Run`);
console.log(`${'═'.repeat(50)}`);

console.log(`
Duration: ${elapsed()}
Total catch: ${totalCatch} fish
Gold earned: ${Math.round(goldEarned * 100) / 100}
Notable catches: ${epics.map(c => `${c.species.name} [${c.species.rarity}]`).join(', ') || 'none'}

The Deep Reef Run was ${totalCatch > 5 ? 'a resounding success' : 'modest but promising'}.
${epics.some(c => c.species?.rarity === 'Epic') ? "Rex's Warden Catfish will be the talk of the harbor for weeks." : ''}
The shark encounter was terrifying, but the crew held together.
Cody's leadership and Iris's quick thinking saved the day.

Next expedition: CedarBeach Fisheries sets sail again tomorrow.
`);
console.log(`${'═'.repeat(50)}\n`);
console.log(`=== ✅ Fleet Demo Complete ===`);
