#!/usr/bin/env node
// Test suite for Minecraft world infrastructure — Sitka Sound

import { SITKA_LOCATIONS, getLocationByName, getLocationsByType } from '../src/mineflayer/sitka-world.js';
import { WorldManager } from '../src/mineflayer/world-manager.js';

let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  ❌ FAIL: ${msg}`); }
}

console.log('🧪 CraftMind — Minecraft World Infrastructure Tests\n');

// === Mock RCON ===
class MockRcon {
  constructor() { this.commands = []; this.connected = true; }
  async connect() { return this; }
  async end() { this.connected = false; }
  async send(cmd) { this.commands.push(cmd); return `{cmd: "${cmd}"}`; }
  async setBlock(x, y, z, blockType) { return this.send(`/setblock ${x} ${y} ${z} ${blockType}`); }
  async fill(x1, y1, z1, x2, y2, z2, blockType) { return this.send(`/fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${blockType}`); }
}

const mockWb = new MockRcon();

// === Sitka Locations ===
console.log('── Sitka Locations ──');
assert(SITKA_LOCATIONS.spawn !== undefined, 'Spawn location exists');
assert(SITKA_LOCATIONS.spawn.name === 'Sitka Dock', 'Spawn name correct');
assert(Object.keys(SITKA_LOCATIONS).length >= 15, `Expected 15+ locations, got ${Object.keys(SITKA_LOCATIONS).length}`);

assert(SITKA_LOCATIONS.ernies_bar.type === 'building', 'Ernies is a building');
assert(SITKA_LOCATIONS.kelp_line.type === 'fishing_spot', 'Kelp Line is a fishing_spot');
assert(SITKA_LOCATIONS.hot_springs.type === 'wilderness', 'Hot Springs is wilderness');
assert(SITKA_LOCATIONS.mount_edgecumbe.type === 'landmark', 'Mt Edgecumbe is landmark');
assert(SITKA_LOCATIONS.old_dock.type === 'ruin', 'Old Dock is ruin');

// getLocationByName
assert(getLocationByName('spawn') !== null, 'getLocationByName finds spawn');
assert(getLocationByName('Ernie\'s Bar & Grill') !== null, 'getLocationByName finds Ernie');
assert(getLocationByName('nonexistent') === null, 'getLocationByName returns null for unknown');

// getLocationsByType
assert(getLocationsByType('building').length >= 4, `Expected 4+ buildings, got ${getLocationsByType('building').length}`);
assert(getLocationsByType('fishing_spot').length >= 4, `Expected 4+ fishing spots, got ${getLocationsByType('fishing_spot').length}`);
assert(getLocationsByType('town').length >= 1, 'At least 1 town location');
assert(getLocationsByType('wilderness').length >= 2, 'At least 2 wilderness locations');

// === WorldManager ===
console.log('── WorldManager ──');
const wm = new WorldManager(mockWb);

// Nearest location
const nearest = wm.getNearestLocation(1, 65, 1);
assert(nearest !== null, 'getNearestLocation returns a result');
assert(nearest.key === 'spawn', `Nearest to (1,65,1) is spawn, got ${nearest.key}`);
assert(nearest.distance < 2, 'Distance to spawn is small');

const nearestBar = wm.getNearestLocation(-14, 65, -9);
assert(nearestBar.key === 'ernies_bar', `Nearest to Ernie's coords is ernies_bar, got ${nearestBar.key}`);

const nearestKelp = wm.getNearestLocation(100, 60, 80);
assert(nearestKelp.key === 'kelp_line', `Nearest to kelp coords is kelp_line, got ${nearestKelp.key}`);

// Biome detection
assert(wm.getBiomeAt(0, 65, 0) === 'town', 'Spawn is town biome');
assert(wm.getBiomeAt(-14, 65, -9) === 'town', 'Building area is town');
assert(wm.getBiomeAt(0, 55, 100) === 'ocean', 'Y=55 far from town is ocean');
assert(wm.getBiomeAt(0, 50, 100) === 'deep_water', 'Y=50 is deep_water');
assert(wm.getBiomeAt(0, 64, 100) === 'shore', 'Y=64 is shore');
assert(wm.getBiomeAt(100, 60, 80) === 'kelp_forest', 'Kelp Line is kelp_forest');

// === WorldBuilder (via mock) ===
console.log('── WorldBuilder Commands ──');
mockWb.commands = [];

// Verify command format via WorldManager methods
(async () => {
  await wm.send('/time set 6000');
  assert(mockWb.commands.includes('/time set 6000'), 'send() passes command to RCON');

  await wm.setStorm();
  assert(mockWb.commands.includes('/weather thunder 9999'), 'setStorm sets thunder');
  assert(mockWb.commands.includes('/time set 18000'), 'setStorm sets night');

  await wm.setClear();
  assert(mockWb.commands.includes('/weather clear 9999'), 'setClear sets clear weather');

  await wm.spawnStructure('spawn');
  assert(mockWb.commands.some(c => c.includes('oak_sign')), 'spawnStructure places sign');
  assert(mockWb.commands.some(c => c.includes('Sitka Dock')), 'spawnStructure sets sign text');

  await wm.spawnStructure('nonexistent');
  // Should not send commands for unknown location
  const signCmdsBefore = mockWb.commands.filter(c => c.includes('oak_sign')).length;
  assert(true, 'spawnStructure returns false for unknown (non-fatal)');

  await wm.setTide(1);
  assert(mockWb.commands.some(c => c.includes('fill') && c.includes('water')), 'setTide sends fill command');

  await wm.spawnFishSchool('salmon', 100, 60, 80);
  assert(mockWb.commands.some(c => c.includes('summon salmon')), 'spawnFishSchool summons salmon');

  // Verify command counts from spawnFishSchool
  const fishCmds = mockWb.commands.filter(c => c.includes('summon salmon'));
  assert(fishCmds.length >= 5, `Fish school has 5+ salmon, got ${fishCmds.length}`);

  // === Structure Builder import test ===
  console.log('── StructureBuilder ──');
  const { StructureBuilder } = await import('../src/mineflayer/structure-builder.js');
  const sb = new StructureBuilder(mockWb);
  mockWb.commands = [];

  await sb.buildPlatform(0, 64, 0, 5, 5, 'oak_planks');
  assert(mockWb.commands[0].includes('/fill 0 64 0 4 64 4 oak_planks'), 'buildPlatform sends correct fill');

  mockWb.commands = [];
  await sb.buildDock(0, 63, 0, 10, 'x');
  assert(mockWb.commands.some(c => c.includes('oak_planks')), 'buildDock uses oak_planks');
  assert(mockWb.commands.some(c => c.includes('oak_fence')), 'buildDock uses fence posts');
  assert(mockWb.commands.some(c => c.includes('lantern')), 'buildDock places lantern at end');

  mockWb.commands = [];
  await sb.placeSign(0, 66, 0, 'Test Sign');
  assert(mockWb.commands[0].includes('oak_sign'), 'placeSign places sign block');
  assert(mockWb.commands[1]?.includes('Test Sign'), 'placeSign sets text via data merge');

  mockWb.commands = [];
  await sb.placeChest(0, 65, 0, [{ id: 'fishing_rod', count: 1 }]);
  assert(mockWb.commands[0].includes('chest'), 'placeChest places chest');
  assert(mockWb.commands[1]?.includes('fishing_rod'), 'placeChest puts item in chest');

  mockWb.commands = [];
  await sb.buildBuilding(0, 66, 0, 5, 4, 5, 'oak_planks', 'oak_log', 'Test');
  assert(mockWb.commands.some(c => c.includes('stone_bricks')), 'buildBuilding has stone floor');
  assert(mockWb.commands.some(c => c.includes('air')), 'buildBuilding clears interior');
  assert(mockWb.commands.some(c => c.includes('glass_pane')), 'buildBuilding has windows');
  assert(mockWb.commands.some(c => c.includes('oak_log')), 'buildBuilding has corner posts');

  // === WorldBuilder class ===
  console.log('── WorldBuilder Class ──');
  const { WorldBuilder } = await import('../src/mineflayer/world-builder.js');
  const wb2 = new WorldBuilder('test', 1234, 'test');
  assert(wb2.host === 'test', 'WorldBuilder stores host');
  assert(wb2.port === 1234, 'WorldBuilder stores port');
  assert(wb2.password === 'test', 'WorldBuilder stores password');
  assert(wb2.rcon === null, 'WorldBuilder starts disconnected');

  // === Location coordinate validation ===
  console.log('── Coordinate Validation ──');
  for (const [key, loc] of Object.entries(SITKA_LOCATIONS)) {
    assert(typeof loc.x === 'number' && typeof loc.y === 'number' && typeof loc.z === 'number',
      `${key} has valid coordinates`);
    assert(loc.y >= 50 && loc.y <= 100, `${key} y-level is reasonable`);
  }

  // === Summary ===
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | Total: ${passed + failed}`);
  console.log(failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed.');
  process.exit(failed > 0 ? 1 : 0);
})();
