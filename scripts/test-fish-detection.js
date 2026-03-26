#!/usr/bin/env node
/**
 * Test: Can the bot find water and fish?
 * Usage: node scripts/test-fish-detection.js [host] [port]
 */
import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';

const host = process.argv[2] || 'localhost';
const port = parseInt(process.argv[3] || '25566', 10);

console.log(`[Test] Connecting to ${host}:${port}...`);

const bot = mineflayer.createBot({
  host,
  port,
  username: 'TestBot_' + Date.now(),
  hideErrors: false,
});

bot.loadPlugin(pathfinder);

bot.once('spawn', async () => {
  console.log(`[Test] Spawned at ${bot.entity.position}`);

  // 1. Check water block
  try {
    const waterName = bot.registry.blocksByName.water;
    console.log(`[Test] Water registry: ${JSON.stringify(waterName)}`);
    const waterBlock = bot.findBlock({
      matching: waterName?.id,
      maxDistance: 20,
    });
    if (waterBlock) {
      const dist = bot.entity.position.distanceTo(waterBlock.position);
      console.log(`[Test] ✅ Found water at ${waterBlock.position} (${dist.toFixed(1)} blocks away)`);
    } else {
      console.log('[Test] ❌ No water within 20 blocks');
    }
  } catch (e) {
    console.error(`[Test] ❌ findBlock error: ${e.message}`);
  }

  // 2. Check for fishing rod
  const rods = bot.inventory.items().filter(i => i.name.includes('fishing_rod'));
  if (rods.length > 0) {
    console.log(`[Test] ✅ Has ${rods.length} fishing rod(s): ${rods.map(r => r.name).join(', ')}`);
  } else {
    console.log('[Test] ⚠️ No fishing rod in inventory');
    // Try to get one from nearby chest
    console.log('[Test] Checking for nearby chests...');
    const chest = bot.findBlock({ matching: bot.registry.blocksByName.chest?.id, maxDistance: 6 });
    if (chest) console.log(`[Test] Found chest at ${chest.position}`);
    else console.log('[Test] No chest nearby either');
  }

  // 3. Try bot.fish()
  if (rods.length > 0) {
    try {
      await bot.equip(rods[0], 'hand');
      const waterBlock = bot.findBlock({ matching: bot.registry.blocksByName.water?.id, maxDistance: 6 });
      if (waterBlock) {
        bot.lookAt(waterBlock.position);
        await new Promise(r => setTimeout(r, 500));
        console.log('[Test] Casting line...');
        await bot.fish();
        console.log('[Test] ✅ bot.fish() completed (hooked a fish or timed out)');
      } else {
        console.log('[Test] ⚠️ Skipped bot.fish() — no water within 6 blocks');
      }
    } catch (e) {
      console.error(`[Test] ❌ bot.fish() error: ${e.message}`);
    }
  }

  console.log('[Test] Done. Disconnecting...');
  bot.quit();
});

bot.on('error', (err) => {
  console.error(`[Test] Connection error: ${err.message}`);
  process.exit(1);
});

bot.on('end', () => {
  console.log('[Test] Disconnected');
  process.exit(0);
});
