#!/usr/bin/env node
/**
 * @description Sets up the Sitka Sound world in a Minecraft server via RCON.
 * Usage: node scripts/setup-world.js
 *
 * Credentials default to localhost:25575 / "craftmind" — override with env vars:
 *   RCON_HOST, RCON_PORT, RCON_PASSWORD
 */

import { WorldBuilder } from '../src/mineflayer/world-builder.js';
import { StructureBuilder } from '../src/mineflayer/structure-builder.js';
import { SITKA_LOCATIONS } from '../src/mineflayer/sitka-world.js';

const host = process.env.RCON_HOST || 'localhost';
const port = parseInt(process.env.RCON_PORT || '25575', 10);
const password = process.env.RCON_PASSWORD || 'craftmind';

async function main() {
  console.log('🔨 CraftMind World Setup — Sitka Sound');
  console.log(`   Connecting to ${host}:${port}...`);

  const wb = new WorldBuilder(host, port, password);
  await wb.connect();
  const sb = new StructureBuilder(wb);

  const commands = [];

  // Helper to log and send
  async function run(desc, fn) {
    console.log(`  → ${desc}`);
    try {
      const result = await fn();
      commands.push(desc);
      return result;
    } catch (err) {
      console.warn(`  ⚠ Failed: ${desc} — ${err.message}`);
      return null;
    }
  }

  // 1. Teleport Cody and any players to spawn
  await run('Teleport entities to spawn', () => wb.teleport('@a', 0, 65, 0));

  // 2. Clear build area
  await run('Clear build area', () => wb.fill(-60, 60, -40, 50, 85, 40, 'air'));

  // 3. Fill ocean
  await run('Fill ocean area with water', () => wb.fill(-200, 55, -300, 300, 61, 300, 'water'));

  // 4. Land masses — town area
  await run('Build town land', () => wb.fill(-40, 62, -30, 40, 62, 20, 'grass_block'));
  await run('Build sub-surface', () => wb.fill(-40, 55, -30, 40, 61, 20, 'stone'));

  // Beaches
  await run('Build beaches', () => wb.fill(-45, 62, -35, 45, 62, 25, 'sand'));
  await run('Build beach sub', () => wb.fill(-45, 60, -35, 45, 61, 25, 'sandstone'));

  // 5. Main dock
  await run('Build main dock', () => sb.buildDock(0, 63, 5, 20, 'z'));

  // 6. Ernie's Bar
  await run("Build Ernie's Bar & Grill", () => sb.buildBuilding(-17, 66, -12, 5, 4, 5, 'oak_planks', 'oak_log', "Ernie's Bar & Grill"));
  await run("Sign: Ernie's Bar", () => sb.placeSign(-15, 66, -12, "Ernie's Bar & Grill"));

  // 7. LFS Marine
  await run('Build LFS Marine Supply', () => sb.buildBuilding(-28, 66, -12, 5, 4, 5, 'spruce_planks', 'spruce_log', 'LFS Marine Supply'));
  await run('Sign: LFS Marine', () => sb.placeSign(-26, 66, -12, 'LFS Marine Supply'));

  // 8. ADF&G Office
  await run('Build ADF&G Office', () => sb.buildBuilding(-18, 66, -27, 6, 4, 5, 'stone_bricks', 'cobblestone_wall', 'ADF&G'));
  await run('Sign: ADF&G', () => sb.placeSign(-15, 66, -27, 'ADF&G Field Office'));

  // 9. Processor
  await run('Build Sitka Sound Processors', () => sb.buildBuilding(28, 64, 13, 6, 4, 5, 'iron_blocks', 'chain', 'Sitka Sound Processors'));
  await run('Sign: Processor', () => sb.placeSign(31, 64, 13, 'Sitka Sound Processors'));

  // 10. Fishing spot buoys
  const spots = [
    { key: 'kelp_line', emoji: '🟢' },
    { key: 'bio_island', emoji: '🟡' },
    { key: 'deep_channel', emoji: '🔵' },
    { key: 'river_mouth', emoji: '🟤' },
  ];
  for (const spot of spots) {
    const loc = SITKA_LOCATIONS[spot.key];
    await run(`Buoy: ${loc.name}`, () => sb.placeSign(loc.x, loc.y + 1, loc.z, `${spot.emoji} ${loc.name}`));
  }

  // 11. Starting chest
  await run('Place starting chest', () => sb.placeChest(0, 65, 0, [
    { id: 'fishing_rod', count: 1 },
    { id: 'bread', count: 16 },
    { id: 'oak_boat', count: 1 },
    { id: 'lantern', count: 2 },
  ]));

  // 12. World settings
  await run('Set world spawn', () => wb.send('/setworldspawn 0 65 0'));
  await run('Set time to morning', () => wb.setTime(6000));
  await run('Set clear weather', () => wb.setWeather('clear 9999'));

  await wb.disconnect();

  console.log('\n✅ World setup complete!');
  console.log(`   ${commands.length} operations performed.`);
  console.log('\n   Locations built:');
  for (const [, loc] of Object.entries(SITKA_LOCATIONS)) {
    console.log(`     • ${loc.name} (${loc.x}, ${loc.y}, ${loc.z}) [${loc.type}]`);
  }
}

main().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
