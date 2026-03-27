#!/usr/bin/env node
/**
 * Night Shift v3 — CJS Rewrite
 * Monitors and restarts dead fishing bot processes
 *
 * Pure CommonJS — no import/export, uses require/module.exports
 */

const { execSync, exec } = require('child_process');
const { createRequire } = require('module');

// Bot configuration
const BOTS = [
  { name: 'Cody_A', port: 25566 },
  { name: 'Cody_B', port: 25567 },
  { name: 'Cody_C', port: 25568 },
];

const RCON_PASSWORD = 'fishing42';
const CHECK_INTERVAL = 60000; // 60 seconds
const PLUGIN = '../craftmind-fishing/src/mineflayer/fishing-plugin.js';

/**
 * Log with timestamp
 */
function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

/**
 * Check if bot process is running via pgrep
 */
function isBotRunning(botName) {
  try {
    const pattern = `node src/bot.js localhost.*${botName}`;
    const output = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8' });
    return output.trim().length > 0;
  } catch (error) {
    // pgrep returns non-zero exit code when no processes found
    return false;
  }
}

/**
 * Give supplies via RCON (fishing rod and bread)
 */
async function giveSupplies(botName, rconPort) {
  try {
    // Use createRequire to load ESM rcon-client module
    const req = createRequire(__filename);
    const { Rcon } = req('/home/lucineer/projects/craftmind/node_modules/rcon-client');

    const rcon = await Rcon.connect({
      host: 'localhost',
      port: rconPort,
      password: RCON_PASSWORD
    });

    // Give fishing rod (5) and bread (64)
    await rcon.send(`give ${botName} fishing_rod 5`);
    await rcon.send(`give ${botName} bread 64`);

    await rcon.end();
    log(`✅ ${botName}: supplies given via RCON`);

  } catch (error) {
    log(`❌ ${botName}: RCON failed - ${error.message}`);
  }
}

/**
 * Start bot process via exec (async, non-blocking)
 */
function startBot(botName, port) {
  // First, give supplies via RCON
  const rconPort = port + 10000;
  giveSupplies(botName, rconPort);

  // Build bot start command
  const escapedName = botName.replace(/'/g, "'\\''");
  const innerCmd = `cd /home/lucineer/projects/craftmind && SERVER_PORT=${port} node src/bot.js localhost ${port} ${escapedName} --plugin ${PLUGIN}`;
  const cmd = `nohup bash -c '${innerCmd}' > /tmp/bot-${port}.log 2>&1 &`;

  // Use exec for async start (doesn't block the loop)
  exec(cmd, { shell: '/bin/bash' }, (error, stdout, stderr) => {
    if (error) {
      log(`❌ ${botName}: failed to start - ${error.message}`);
    } else {
      log(`🚀 ${botName}: started on port ${port}`);
    }
  });
}

/**
 * Main health check loop
 */
function healthCheck() {
  log('🔍 Checking bot health...');

  for (const bot of BOTS) {
    const isRunning = isBotRunning(bot.name);

    if (!isRunning) {
      log(`⚠️ ${bot.name}: bot not running, restarting...`);
      startBot(bot.name, bot.port);
    } else {
      log(`✅ ${bot.name}: running`);
    }
  }
}

/**
 * Start the night shift daemon
 */
function main() {
  log('🌙 Night Shift v3 started (CJS)');
  log(`Checking ${BOTS.length} bots every ${CHECK_INTERVAL / 1000}s...`);
  console.log();

  // Run initial check
  healthCheck();

  // Start monitoring loop
  setInterval(healthCheck, CHECK_INTERVAL);
}

// Start the daemon
main();
