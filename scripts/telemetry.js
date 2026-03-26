#!/usr/bin/env node
// Telemetry collector v2 — reads per-server stat files + server logs
// Outputs to /tmp/sim-telemetry.jsonl (append-only JSON lines)
import fs from 'fs';
import { execSync } from 'child_process';

const SERVERS = [
  { port: 25566, name: 'Alpha', log: '/tmp/server-25566.log', botName: 'Cody_A' },
  { port: 25567, name: 'Beta', log: '/tmp/server-25567.log', botName: 'Cody_B' },
  { port: 25568, name: 'Gamma', log: '/tmp/server-25568.log', botName: 'Cody_C' },
];

const OUTFILE = '/tmp/sim-telemetry.jsonl';

function countPattern(file, pattern) {
  try {
    return parseInt(execSync(`strings "${file}" 2>/dev/null | grep -c "${pattern}"`, { timeout: 10000 }).toString().trim()) || 0;
  } catch { return 0; }
}

function uniqueChatLines(file, botName) {
  try {
    return parseInt(execSync(`strings "${file}" 2>/dev/null | grep "Not Secure.*<${botName}>" | sed 's/.*] //' | sort -u | wc -l`).toString().trim()) || 0;
  } catch { return 0; }
}

function topChatLines(file, botName, n = 5) {
  try {
    return execSync(`strings "${file}" 2>/dev/null | grep "Not Secure.*<${botName}>" | sed 's/.*] //' | sort | uniq -c | sort -rn | head -${n}`).toString().trim();
  } catch { return ''; }
}

function readPerServerStats(port) {
  try {
    const data = fs.readFileSync(`/tmp/stats-${port}.json`, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function collect() {
  const timestamp = new Date().toISOString();
  const snapshot = { timestamp, servers: {} };

  for (const s of SERVERS) {
    // Read per-server stats from bot's own telemetry (accurate fish count)
    const botStats = readPerServerStats(s.port);
    
    // Also scrape server logs for chat data (can't get this client-side easily)
    const logChats = countPattern(s.log, `<${s.botName}>`);
    const logUnique = uniqueChatLines(s.log, s.botName);
    const logDeaths = countPattern(s.log, 'was slain\\|died\\|blew up');
    const logTopLines = topChatLines(s.log, s.botName, 3);

    snapshot.servers[s.name] = {
      // Client-side stats (accurate)
      fishCaught: botStats?.fishCaught || 0,
      currentScript: botStats?.currentScript || 'unknown',
      mood: botStats?.mood || '0.50',
      energy: botStats?.energy || '1.00',
      botUptime: botStats?.uptime || 0,
      server: botStats?.server || s.name,
      // Log-scraped stats
      totalChats: logChats,
      uniqueChats: logUnique,
      deaths: logDeaths,
      topLines: logTopLines,
      // Computed
      fishPerMinute: botStats?.uptime > 60 ? ((botStats.fishCaught || 0) / (botStats.uptime / 60)).toFixed(1) : '—',
    };
  }

  const line = JSON.stringify(snapshot) + '\n';
  fs.appendFileSync(OUTFILE, line);
  
  // Summary line
  const summary = Object.entries(snapshot.servers).map(([name, s]) =>
    `${name}:🐟${s.fishCaught} 💬${s.totalChats}(${s.uniqueChats}u) ${s.fishPerMinute}/min 😊${s.mood} [${s.currentScript}]`
  ).join(' | ');
  console.log(`[${timestamp}] ${summary}`);
}

// Collect once, then every 60s
collect();
setInterval(collect, 60000);
