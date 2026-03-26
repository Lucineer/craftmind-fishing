// Set up test worlds: water near spawn, fishing dock
import { Rcon } from 'rcon-client';

const SERVERS = [
  { port: 25566, rcon: 25576, name: 'Alpha' },
  { port: 25567, rcon: 25577, name: 'Beta' },
  { port: 25568, rcon: 25578, name: 'Gamma' },
];

async function setupServer(s) {
  console.log(`Setting up ${s.name} (port ${s.port})...`);
  const r = await new Rcon({ host: 'localhost', port: s.rcon, password: 'craftmind' }).connect();

  // Create a fishing dock: clear area, place water, add platform
  // Dock at (0, 64, 5) facing water at (0, 63, 0 to -20)
  
  // Fill water in front of spawn
  for (let x = -8; x <= 8; x++) {
    for (let z = -20; z <= -1; z++) {
      await r.send(`/fill ${x} 62 ${z} ${x} 62 ${z} water`);
    }
  }
  
  // Stone dock platform
  await r.send('/fill -3 64 0 3 64 3 stone');
  await r.send('/fill -3 63 0 3 63 3 stone');
  
  // Set spawn on dock
  await r.send('/spawnpoint @a 0 65 1');
  
  // Place a chest with gear
  await r.send(`/setblock -2 65 1 chest`);
  
  // Give all players starting gear
  await r.send('/give @a minecraft:fishing_rod 2');
  await r.send('/give @a minecraft:bread 64');
  await r.send('/give @a minecraft:iron_sword 1');
  await r.send('/give @a minecraft:iron_helmet 1');
  await r.send('/give @a minecraft:iron_chestplate 1');
  await r.send('/give @a minecraft:iron_leggings 1');
  await r.send('/give @a minecraft:iron_boots 1');
  await r.send('/give @a minecraft:shield 1');
  await r.send('/give @a minecraft:oak_boat 1');
  
  // Scoreboard
  try { await r.send('/scoreboard objectives add fishmoney dummy Money'); } catch {}
  try { await r.send('/scoreboard objectives add fishcaught dummy Fish'); } catch {}
  await r.send('/scoreboard objectives setdisplay sidebar fishmoney');
  await r.send('/scoreboard players set @a fishmoney 50');
  
  // Permanent day, no mobs (pure fishing test)
  await r.send('/time set 6000');
  await r.send('/gamerule doDaylightCycle false');
  await r.send('/gamerule doMobSpawning false');
  
  // TP any existing players to dock
  await r.send('/tp @a 0 65 1');
  
  console.log(`✓ ${s.name} ready`);
  await r.end();
}

for (const s of SERVERS) {
  try {
    await setupServer(s);
  } catch (e) {
    console.error(`✗ ${s.name}: ${e.message}`);
  }
}
console.log('\nAll servers set up.');
