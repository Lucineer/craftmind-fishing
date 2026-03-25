// Tests for the Town of Sitka module
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { TOWN_CONFIG, STREETS, ZONES, getStreet } from '../src/town/sitka-town.js';
import { BUILDINGS, BUILDING_POSITIONS, getBuilding, getBuildingsByType, isOpen, findNearbyBuildings } from '../src/town/town-buildings.js';
import { NPCS, getNPC, getNPCsAtBuilding, getNPCsAtTime, getNPCDialogue } from '../src/town/sitka-npcs.js';
import { HARBORS, SitkaHarbor } from '../src/town/harbor-system.js';
import { VHF_CHANNELS, MarineRadio } from '../src/town/radio-system.js';
import { ANNUAL_EVENTS, RANDOM_EVENTS, TownEventManager } from '../src/town/town-events.js';

let passed = 0;
let failed = 0;

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

console.log('\n🏘️  Town of Sitka Tests\n');

// ─── sitka-town.js ──────────────────────────────────────
console.log('--- sitka-town.js ---');

test('TOWN_CONFIG has correct name and population', () => {
  assert.equal(TOWN_CONFIG.name, 'Sitka');
  assert.equal(TOWN_CONFIG.population, 8500);
});

test('All 10 main streets exist', () => {
  const expected = ['lincoln', 'harbor', 'katlian', 'baranof', 'halibut_point', 'sawmill_creek', 'seward', 'jeff_davis', 'lake', 'kashevaroff'];
  for (const s of expected) {
    assert.ok(STREETS[s], `Missing street: ${s}`);
  }
});

test('Lincoln Street is described as downtown main drag', () => {
  assert.ok(STREETS.lincoln.description.toLowerCase().includes('heart'));
});

test('Zones include downtown, harbor, industrial', () => {
  assert.ok(ZONES.downtown);
  assert.ok(ZONES.harbor_district);
  assert.ok(ZONES.industrial);
  assert.ok(ZONES.airport);
});

test('getStreet returns street object', () => {
  const s = getStreet('lincoln');
  assert.equal(s.name, 'Lincoln Street');
  assert.equal(getStreet('nonexistent'), null);
});

// ─── town-buildings.js ──────────────────────────────────
console.log('--- town-buildings.js ---');

test('BUILDINGS has all required categories', () => {
  const types = new Set(Object.values(BUILDINGS).map(b => b.type));
  assert.ok(types.has('bar'), 'Missing bars');
  assert.ok(types.has('restaurant'), 'Missing restaurants');
  assert.ok(types.has('shop'), 'Missing shops');
  assert.ok(types.has('harbor'), 'Missing harbors');
  assert.ok(types.has('lodging'), 'Missing lodging');
  assert.ok(types.has('school'), 'Missing schools');
  assert.ok(types.has('charter'), 'Missing charters');
  assert.ok(types.has('fuel'), 'Missing fuel');
  assert.ok(types.has('service'), 'Missing services');
  assert.ok(types.has('landmark'), 'Missing landmarks');
});

test('Ernie\'s Old Time Saloon has correct location', () => {
  const e = BUILDINGS.ernies_old_time_saloon;
  assert.equal(e.location.street, 'Lincoln');
  assert.equal(e.location.address, 130);
  assert.equal(e.npc, 'ernie');
  assert.ok(e.functions.includes('hear_rumors'));
});

test('LFS Marine has gear inventory', () => {
  const lfs = BUILDINGS.lfs_marine_supplies;
  assert.equal(lfs.location.street, 'Katlian');
  assert.equal(lfs.npc, 'linda');
  assert.ok(lfs.inventory);
  assert.ok(lfs.inventory.categories.includes('hooks'));
});

test('St. Michael\'s Cathedral is a landmark', () => {
  const sm = BUILDINGS.st_michaels_cathedral;
  assert.equal(sm.type, 'landmark');
  assert.equal(sm.npc, 'old_thomas');
  assert.ok(sm.description.includes('Russian'));
});

test('All buildings have positions', () => {
  for (const id of Object.keys(BUILDINGS)) {
    assert.ok(BUILDING_POSITIONS[id], `Missing position for ${id}`);
  }
});

test('getBuilding finds by id', () => {
  const b = getBuilding('ernies_old_time_saloon');
  assert.equal(b.name, "Ernie's Old Time Saloon");
  assert.equal(getBuilding('nonexistent'), null);
});

test('getBuildingsByType filters correctly', () => {
  const bars = getBuildingsByType('bar');
  assert.ok(bars.length >= 2);
  bars.forEach(b => assert.equal(b.type, 'bar'));
});

test('isOpen works for normal hours and 24h', () => {
  assert.equal(isOpen('ernies_old_time_saloon', 16), true);  // open 3pm-1am
  assert.equal(isOpen('ernies_old_time_saloon', 10), false); // 10am = closed
  assert.equal(isOpen('ernies_old_time_saloon', 23), true);  // 11pm = open
  assert.equal(isOpen('sitka_hotel', 3), true);              // 24h
});

test('findNearbyBuildings returns sorted by distance', () => {
  const nearby = findNearbyBuildings(10, 25, 20);
  assert.ok(nearby.length >= 1);
  for (let i = 1; i < nearby.length; i++) {
    assert.ok(nearby[i].dist >= nearby[i - 1].dist);
  }
});

// ─── sitka-npcs.js ──────────────────────────────────────
console.log('--- sitka-npcs.js ---');

test('All key NPCs exist', () => {
  const expected = ['ernie', 'linda', 'captain_pete', 'mary', 'old_thomas', 'sarah', 'dave', 'captain_sig', 'jenna', 'tourist', 'old_salt'];
  for (const id of expected) {
    assert.ok(NPCS[id], `Missing NPC: ${id}`);
  }
});

test('Ernie has personality, schedule, and dialogue', () => {
  const e = NPCS.ernie;
  assert.equal(e.personality, 'grizzled_old_salt');
  assert.ok(e.schedule);
  assert.ok(e.dialogue.weather.length > 0);
  assert.ok(e.dialogue.fishing_tips.length > 0);
  assert.ok(e.dialogue.old_days.length > 0);
  assert.ok(e.quests.includes('the_400_pounder'));
});

test('Old Thomas speaks Tlingit', () => {
  const t = NPCS.old_thomas;
  assert.ok(t.dialogue.tlingit.length > 0);
  assert.ok(t.dialogue.tlingit[0].includes('Yak')); // Yak'ei yatee
});

test('Captain Sig has Bering Sea stories', () => {
  const s = NPCS.captain_sig;
  assert.ok(s.dialogue.bering_sea.length > 0);
  assert.ok(s.dialogue.crab.length > 0);
  assert.ok(s.quests.includes('crab_boat_dreams'));
});

test('Old Salt has secret spot easter egg', () => {
  const o = NPCS.old_salt;
  assert.equal(o.fullName, null); // deliberately unknown
  assert.ok(o.easterEgg);
  assert.equal(o.easterEgg.requiredVisits, 7);
  assert.ok(o.dialogue.secret_spot_reveal);
});

test('getNPCsAtTime returns NPCs at correct locations', () => {
  // At 8am, Ernie should be sleeping
  const morning = getNPCsAtTime(8);
  const ernieMorning = morning.find(n => n.id === 'ernie');
  assert.ok(ernieMorning);
  assert.equal(ernieMorning.location, 'home');
  assert.equal(ernieMorning.activity, 'sleeping');

  // At 6pm, Ernie should be at the bar
  const evening = getNPCsAtTime(18);
  const ernieEvening = evening.find(n => n.id === 'ernie');
  assert.ok(ernieEvening);
  assert.equal(ernieEvening.location, 'ernies_old_time_saloon');
});

test('getNPCDialogue returns strings', () => {
  const line = getNPCDialogue('ernie', 'weather');
  assert.ok(typeof line === 'string');
  assert.ok(line.length > 0);

  const random = getNPCDialogue('ernie');
  assert.ok(typeof random === 'string');
});

test('getNPCsAtBuilding finds NPCs at a location', () => {
  const atSaloon = getNPCsAtBuilding('ernies_old_time_saloon');
  assert.ok(atSaloon.length >= 1);
  assert.ok(atSaloon.some(n => n.id === 'ernie'));
});

// ─── harbor-system.js ───────────────────────────────────
console.log('--- harbor-system.js ---');

test('Three harbors exist with correct names', () => {
  assert.equal(HARBORS.eliason.name, 'Eliason Harbor');
  assert.equal(HARBORS.anb.name, 'ANB Harbor');
  assert.equal(HARBORS.crescent.name, 'Crescent Harbor');
});

test('Eliason has the most slips', () => {
  assert.ok(HARBORS.eliason.slips.total > HARBORS.anb.slips.total);
  assert.ok(HARBORS.eliason.slips.total > HARBORS.crescent.slips.total);
});

test('SitkaHarbor docks and undocks boats', () => {
  const h = new SitkaHarbor();
  const result = h.dock('FV Test Boat', { harbor: 'eliason', length: 30 });
  assert.ok(result.success);
  assert.ok(result.slip.startsWith('E-'));

  const check = h.checkMoorage('FV Test Boat');
  assert.ok(check.docked);
  assert.ok(check.message.includes('E-'));

  h.undock('FV Test Boat');
  const after = h.checkMoorage('FV Test Boat');
  assert.ok(!after.docked);
});

test('Boat too long gets rejected', () => {
  const h = new SitkaHarbor();
  const result = h.dock('FV Huge', { harbor: 'crescent', length: 50 });
  assert.ok(!result.success);
  assert.ok(result.message.includes('too long'));
});

test('Moorage payment calculates correctly', () => {
  const h = new SitkaHarbor();
  h.dock('FV Pay Test', { harbor: 'eliason', length: 40 });
  const payment = h.payMoorage('FV Pay Test', 1);
  assert.ok(payment.success);
  assert.equal(payment.cost, 40 * 4.50); // length * pricePerFoot
});

test('Daily report generates correctly', () => {
  const h = new SitkaHarbor();
  h.generateHarborTraffic();
  const report = h.getDailyReport();
  assert.ok(report.weather);
  assert.ok(report.fishing.length > 0);
  assert.ok(report.docked > 0);
  assert.ok(report.coffeeRowIntel.length >= 2);
  assert.ok(report.harbormasterNotice);
});

test('Coffee row intel returns strings', () => {
  const h = new SitkaHarbor();
  const intel = h.getCoffeeRowIntel();
  assert.ok(intel.length >= 2);
  intel.forEach(i => assert.ok(typeof i === 'string'));
});

// ─── radio-system.js ────────────────────────────────────
console.log('--- radio-system.js ---');

test('All 6 VHF channels exist', () => {
  const expected = [16, 9, 6, 12, 22, 67];
  for (const ch of expected) {
    assert.ok(VHF_CHANNELS[ch], `Missing channel ${ch}`);
  }
});

test('Channel 16 is distress/calling', () => {
  assert.equal(VHF_CHANNELS[16].type, 'distress_calling');
});

test('Channel 9 is commercial fishing', () => {
  assert.equal(VHF_CHANNELS[9].type, 'commercial_fishing');
});

test('MarineRadio tunes and broadcasts', () => {
  const r = new MarineRadio();
  const tune = r.tune(9);
  assert.ok(tune.success);

  const msg = r.broadcast('coordination', 'Test message from FV Test', 'FV Test');
  assert.equal(msg.channel, 9);
  assert.equal(msg.type, 'coordination');
});

test('Mayday produces correct format', () => {
  const r = new MarineRadio();
  r.tune(16);
  const msg = r.mayday('FV Sinking', 'taking water', '2 miles west of Cape');
  assert.equal(msg.priority, 'critical');
  assert.ok(msg.message.includes('Mayday mayday mayday'));
  assert.ok(msg.message.includes('FV Sinking'));
});

test('Securite produces correct format', () => {
  const r = new MarineRadio();
  r.tune(16);
  const msg = r.securite('gale warning for Sitka Sound');
  assert.equal(msg.priority, 'high');
  assert.ok(msg.message.includes('Securite securite securite'));
});

test('Listen returns channel-specific messages', () => {
  const r = new MarineRadio();
  r.tune(9);
  const listen = r.listen();
  assert.ok(listen.channel);
  assert.ok(listen.messages.length >= 0);
});

test('generateRadioEvent produces varied events', () => {
  const r = new MarineRadio();
  const events = new Set();
  for (let i = 0; i < 20; i++) {
    const e = r.generateRadioEvent();
    events.add(e.type);
  }
  assert.ok(events.size >= 3, `Expected varied events, got: ${[...events].join(', ')}`);
});

test('Message log works', () => {
  const r = new MarineRadio();
  r.tune(16);
  r.broadcast('general', 'test 1');
  r.tune(9);
  r.broadcast('coordination', 'test 2');
  const allLog = r.getLog();
  assert.equal(allLog.length, 2);
  const ch9Log = r.getLog(9);
  assert.equal(ch9Log.length, 1);
});

// ─── town-events.js ─────────────────────────────────────
console.log('--- town-events.js ---');

test('Annual events cover all seasons', () => {
  const months = new Set(Object.values(ANNUAL_EVENTS).map(e => e.month));
  assert.ok(months.has(2), 'Missing winter event'); // rondy
  assert.ok(months.has(3), 'Missing spring event'); // herring
  assert.ok(months.has(5), 'Missing spring event'); // salmon derby
  assert.ok(months.has(7), 'Missing summer event'); // july 4th
  assert.ok(months.has(10), 'Missing fall event'); // alaska day
  assert.ok(months.has(11), 'Missing fall event'); // whale fest
});

test('Alaska Day is on October 18', () => {
  const ad = ANNUAL_EVENTS.alaska_day;
  assert.equal(ad.month, 10);
  assert.equal(ad.dayRange[0], 18);
  assert.ok(ad.description.includes('1867'));
});

test('Herring spawn has major gameplay effects', () => {
  const hs = ANNUAL_EVENTS.herring_spawn;
  assert.ok(hs.gameplayChanges.fishAggression > 1);
  assert.ok(hs.gameplayChanges.whaleEncounterChance > 0);
});

test('Tournaments have prize structures', () => {
  const sd = ANNUAL_EVENTS.sitka_salmon_derby;
  assert.ok(sd.gameplayChanges.tournament);
  assert.ok(sd.gameplayChanges.tournament.prize > 0);
  assert.equal(sd.gameplayChanges.tournament.species, 'chinook');
});

test('Random events have weights', () => {
  assert.ok(RANDOM_EVENTS.length >= 8);
  RANDOM_EVENTS.forEach(e => {
    assert.ok(e.weight > 0, `${e.id} has no weight`);
    assert.ok(e.description, `${e.id} has no description`);
  });
});

test('TownEventManager triggers annual events by date', () => {
  const em = new TownEventManager();
  const events = em.setDate(10, 18); // Alaska Day
  assert.ok(events.some(e => e.id === 'alaska_day'));

  const july4 = em.setDate(7, 4);
  assert.ok(july4.some(e => e.id === 'july_4th'));
});

test('TownEventManager rolls daily random events', () => {
  const em = new TownEventManager();
  em.setDate(6, 15);
  // Roll many times — should get at least some events
  let gotEvent = false;
  for (let i = 0; i < 50; i++) {
    const events = em.rollDailyEvents();
    if (events.length > 0) { gotEvent = true; break; }
  }
  assert.ok(gotEvent, 'Should have rolled at least one random event in 50 tries');
});

test('Gameplay changes merge from multiple active events', () => {
  const em = new TownEventManager();
  em.setDate(7, 4); // July 4th — sets townActivity
  em.activeEvents.push(RANDOM_EVENTS[0]); // force a random event
  const changes = em.getGameplayChanges();
  assert.ok(Object.keys(changes).length > 0);
});

// ─── Integration ────────────────────────────────────────
console.log('--- Integration ---');

test('NPC locations match building IDs', () => {
  for (const [id, npc] of Object.entries(NPCS)) {
    if (npc.location?.building) {
      assert.ok(BUILDINGS[npc.location.building], `NPC ${id} references missing building ${npc.location.building}`);
    }
  }
});

test('Harbor positions are near water (lower y values)', () => {
  for (const id of ['eliason_harbor', 'anb_harbor', 'crescent_harbor']) {
    const pos = BUILDING_POSITIONS[id];
    assert.ok(pos.y <= 63, `${id} y=${pos.y}, should be at or below water level`);
  }
});

test('Buildings on streets match their street keys', () => {
  for (const [id, building] of Object.entries(BUILDINGS)) {
    const pos = BUILDING_POSITIONS[id];
    if (pos) {
      assert.equal(pos.street, building.location.streetKey, `Street mismatch for ${id}`);
    }
  }
});

// ─── Summary ────────────────────────────────────────────
console.log(`\n📊 ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
if (failed > 0) process.exit(1);
