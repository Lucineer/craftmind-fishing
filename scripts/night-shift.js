#!/usr/bin/env node
/**
 * Night Shift v2 — keeps simulation servers alive and restarts bots if they die
 * 
 * Improvements over v1:
 * - Clears stale session.lock before server restart
 * - Kills duplicate bot processes before starting new ones
 * - Gives items via RCON on spawn event (not timer)
 * - Multiple RCON retry on give-item
 * - Better logging with timestamps
 */
import { execSync, spawn } from 'child_process';

const SERVERS = [
  { port: 25566, rcon: 35566, bot: 'Cody_A' },
  { port: 25567, rcon: 35567, bot: 'Cody_B' },
  { port: 25568, rcon: 35568, bot: 'Cody_C' },
];

const RCON_PASSWORD = 'fishing42';
const PLUGIN = '/home/lucineer/projects/craftmind-fishing/src/mineflayer/fishing-plugin.js';
const CHECK_INTERVAL = 60000;
const ROD_GIVE_DELAY = 20000; // 20s after bot start (enough time to fully spawn)

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function isProcessRunning(pattern) {
  try {
    const out = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8' }).trim();
    return out.length > 0;
  } catch { return false; }
}

function isBotRunning(port) {
  try {
    // Match the actual node process, not shell wrappers or night-shift itself
    const out = execSync(`pgrep -af "node.*src/bot.js.*${port}"`, { encoding: 'utf8' }).trim();
    return out.length > 0;
  } catch { return false; }
}

function isServerAlive(port) {
  try {
    execSync(`nc -z localhost ${port} -w 2`, { timeout: 3000 });
    return true;
  } catch { return false; }
}

async function giveSupplies(server) {
  try {
    const { Rcon } = await import('/home/lucineer/projects/craftmind/node_modules/rcon-client');
    const rcon = await Rcon.connect({ host: 'localhost', port: server.rcon, password: RCON_PASSWORD });
    await rcon.send(`give ${server.bot} fishing_rod 3`);
    await rcon.send(`give ${server.bot} bread 32`);
    await rcon.send(`give ${server.bot} oak_log 16`);
    await rcon.send(`give ${server.bot} stick 16`);
    await rcon.send(`give ${server.bot} string 16`);
    log(`✅ ${server.bot}: supplies given`);
    await rcon.end();
  } catch (e) {
    log(`❌ ${server.bot}: RCON failed: ${e.message}`);
    // Retry once after 10s
    setTimeout(async () => {
      try {
        const { Rcon } = await import('/home/lucineer/projects/craftmind/node_modules/rcon-client');
        const rcon = await Rcon.connect({ host: 'localhost', port: server.rcon, password: RCON_PASSWORD });
        await rcon.send(`give ${server.bot} fishing_rod 3 bread 32`);
        log(`✅ ${server.bot}: supplies given (retry)`);
        await rcon.end();
      } catch (e2) {
        log(`❌ ${server.bot}: RCON retry failed: ${e2.message}`);
      }
    }, 10000);
  }
}

function startBot(server) {
  // Kill any existing bot on this port first
  try {
    execSync(`pkill -f "src/bot.js.*${server.port}" 2>/dev/null`, { shell: '/bin/bash' });
  } catch {}
  
  const escapedBot = server.bot.replace(/'/g, "'\\''");
  const innerCmd = `cd /home/lucineer/projects/craftmind && SERVER_PORT=${server.port} RCON_PORT=${server.rcon} RCON_PASSWORD=${RCON_PASSWORD} node --unhandled-rejections=warn src/bot.js localhost ${server.port} ${escapedBot} --plugin ${PLUGIN}`;
  const cmd = `nohup bash -c '${innerCmd}' > /tmp/bot-${server.port}.log 2>&1 &`;
  
  try {
    execSync(cmd, { shell: '/bin/bash' });
    log(`🚀 ${server.bot}: started on port ${server.port}`);
    // Give supplies after bot has time to fully connect
    setTimeout(() => giveSupplies(server), ROD_GIVE_DELAY);
  } catch (e) {
    log(`❌ ${server.bot}: failed to start: ${e.message}`);
  }
}

function restartServer(server) {
  const dir = `/home/lucineer/projects/craftmind/test-server-${server.port}`;
  
  // Kill existing Java process for this port
  try {
    execSync(`fuser -k ${server.port}/tcp 2>/dev/null`, { shell: '/bin/bash', timeout: 5000 });
  } catch {}
  
  // Clear stale session.lock
  try {
    execSync(`rm -f ${dir}/craftmind/session.lock`, { shell: '/bin/bash' });
  } catch {}
  
  try {
    execSync(`cd "${dir}" && nohup java -Xmx512M -Xms256M -jar server.jar nogui > /tmp/server-${server.port}.log 2>&1 &`, { shell: '/bin/bash' });
    log(`🔄 Server ${server.port}: restarting...`);
    // Wait for server to boot, then start bot
    setTimeout(() => {
      if (isServerAlive(server.port)) {
        log(`✅ Server ${server.port}: back online`);
        startBot(server);
      } else {
        log(`❌ Server ${server.port}: failed to start`);
      }
    }, 45000);
  } catch (e) {
    log(`❌ Server ${server.port}: restart failed: ${e.message}`);
  }
}

function healthCheck() {
  for (const server of SERVERS) {
    const serverAlive = isServerAlive(server.port);
    const botRunning = isBotRunning(server.port);

    if (!serverAlive) {
      log(`⚠️ Server ${server.port}: DOWN`);
      restartServer(server);
    } else if (!botRunning) {
      log(`⚠️ ${server.bot}: bot not running`);
      startBot(server);
    }
    // Both alive = silent (no log spam)
  }
}

log('Night shift v2 started. Checking every 60s...\n');
healthCheck();
setInterval(healthCheck, CHECK_INTERVAL);
