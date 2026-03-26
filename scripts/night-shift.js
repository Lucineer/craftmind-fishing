#!/usr/bin/env node
/**
 * Night Shift — keeps simulation servers alive and restarts bots if they die
 * Runs as a persistent process, checks every 60 seconds
 */
import { execSync } from 'child_process';

const SERVERS = [
  { port: 25566, rcon: 25576, bot: 'Cody_A' },
  { port: 25567, rcon: 25577, bot: 'Cody_B' },
  { port: 25568, rcon: 25578, bot: 'Cody_C' },
];

const BOT_CMD = 'bash -c \'cd /home/lucineer/projects/craftmind && source .env && node --unhandled-rejections=warn src/bot.js\'';
const PLUGIN = '../craftmind-fishing/src/mineflayer/fishing-plugin.js';

function isProcessRunning(pattern) {
  try {
    const count = parseInt(execSync(`pgrep -f "${pattern}" | wc -l`).toString().trim());
    return count > 0;
  } catch { return false; }
}

function isServerAlive(port) {
  try {
    execSync(`nc -z localhost ${port} -w 2`, { timeout: 3000 });
    return true;
  } catch { return false; }
}

function startBot(server) {
  const escapedBot = server.bot.replace(/'/g, "'\\''");
  const innerCmd = `cd /home/lucineer/projects/craftmind && source .env && node --unhandled-rejections=warn src/bot.js localhost ${server.port} ${escapedBot} --plugin ${PLUGIN}`;
  const cmd = `nohup bash -c '${innerCmd}' > /tmp/bot-${server.port}.log 2>&1 &`;
  execSync(cmd, { shell: '/bin/bash' });
  console.log(`[${new Date().toISOString()}] Started ${server.bot} on port ${server.port}`);
}

function restartServer(server) {
  const dir = `/home/lucineer/projects/craftmind/test-server-${server.port}`;
  try {
    execSync(`cd "${dir}" && nohup java -Xmx512M -Xms256M -jar server.jar nogui > /tmp/server-${server.port}.log 2>&1 &`, { shell: '/bin/bash' });
    console.log(`[${new Date().toISOString()}] Restarted server on port ${server.port}`);
    // Wait for server to boot before starting bot
    setTimeout(() => {
      if (isServerAlive(server.port)) startBot(server);
    }, 50000);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Failed to restart server ${server.port}: ${e.message}`);
  }
}

function healthCheck() {
  const now = new Date().toISOString();
  for (const server of SERVERS) {
    const serverAlive = isServerAlive(server.port);
    const botRunning = isProcessRunning(`bot.js.*${server.port}`);

    if (!serverAlive) {
      console.log(`[${now}] ⚠️ Server ${server.port} DOWN`);
      restartServer(server);
    } else if (!botRunning) {
      console.log(`[${now}] ⚠️ Bot ${server.bot} not running on ${server.port}`);
      startBot(server);
    }
  }
}

console.log('Night shift started. Checking every 60s...\n');
healthCheck(); // Initial check
setInterval(healthCheck, 60000);
