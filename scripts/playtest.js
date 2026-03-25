#!/usr/bin/env node
/**
 * Playtest launcher — starts Minecraft server (if needed), connects the bot
 * with the fishing plugin, and sets up the starting experience.
 *
 * Usage: node scripts/playtest.js [--no-server] [--headless]
 *
 * Options:
 *   --no-server  Skip server startup check (assume it's already running)
 *   --headless   Don't wait for stdin (run until Ctrl+C)
 */

import net from 'net';
import { spawn } from 'child_process';

// ── Config ────────────────────────────────────────────────────────────────────

const SERVER_HOST = 'localhost';
const SERVER_PORT = 25565;
const RCON_PORT = 25575;
const RCON_PASSWORD = 'craftmind';
const BOT_NAME = 'Cody';
const CRAFTMIND_DIR = new URL('../../craftmind', import.meta.url).pathname;

const args = process.argv.slice(2);
const noServer = args.includes('--no-server');
const headless = args.includes('--headless');

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function waitForPort(host, port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const sock = net.createConnection(port, host);
      sock.once('connect', () => { sock.destroy(); resolve(true); });
      sock.once('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Port ${port} not responding after ${timeout}ms`));
        } else {
          setTimeout(check, 1000);
        }
      });
      sock.on('error', () => {}); // suppress unhandled
    };
    check();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('🎣 CraftMind Fishing — Playtest Launcher');
  log('━'.repeat(50));

  // Step 1: Check/Start server
  if (!noServer) {
    log(`Checking Minecraft server at ${SERVER_HOST}:${SERVER_PORT}...`);
    try {
      await waitForPort(SERVER_HOST, SERVER_PORT, 5000);
      log('✅ Server is running');
    } catch {
      log('⚠️  Server not detected. Start it manually:');
      log(`   cd ${CRAFTMIND_DIR}/server && java -jar server.jar nogui`);
      log('   Then re-run: node scripts/playtest.js --no-server');
      process.exit(1);
    }
  } else {
    log('Skipping server check (--no-server)');
  }

  // Step 2: Launch bot
  log(`Connecting bot "${BOT_NAME}" to ${SERVER_HOST}:${SERVER_PORT}...`);

  const botProcess = spawn('node', [
    'src/bot.js',
    SERVER_HOST,
    String(SERVER_PORT),
    BOT_NAME,
  ], {
    cwd: CRAFTMIND_DIR,
    env: {
      ...process.env,
      CRAFTMIND_FISHING_PLUGIN: new URL('../src/mineflayer/fishing-plugin.js', import.meta.url).pathname,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  botProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      log(`[BOT] ${line}`);
    }
  });

  botProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      log(`[BOT:ERR] ${line}`);
    }
  });

  botProcess.on('close', (code) => {
    log(`Bot process exited with code ${code}`);
  });

  // Step 3: Wait for spawn
  log('Waiting for bot to spawn...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  log('━'.repeat(50));
  log('✅ Playtest ready! Bot is in Sitka Sound.');
  log('  Commands: !fish, !reel, !check, !sell, !gear, !weather, !tide, !radio, !permit');
  log('  Ctrl+C to stop.');
  log('━'.repeat(50));

  // Keep alive
  if (!headless) {
    process.stdin.resume();
    process.stdin.on('data', (data) => {
      const cmd = data.toString().trim();
      if (cmd === 'quit' || cmd === 'exit') {
        botProcess.kill('SIGINT');
        process.exit(0);
      }
    });
  }
}

main().catch(err => {
  log(`Fatal: ${err.message}`);
  process.exit(1);
});
