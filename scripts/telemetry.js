#!/usr/bin/env node
// Telemetry collector — scrapes all test servers every 60s
// Outputs to /tmp/sim-telemetry.jsonl (append-only JSON lines)
import fs from 'fs';
import { execSync } from 'child_process';

const SERVERS = [
  { port: 25566, rcon: 25576, name: 'Alpha', log: '/tmp/server-25566.log' },
  { port: 25567, rcon: 25577, name: 'Beta', log: '/tmp/server-25567.log' },
  { port: 25568, rcon: 25578, name: 'Gamma', log: '/tmp/server-25568.log' },
];

const OUTFILE = '/tmp/sim-telemetry.jsonl';

function countPattern(file, pattern) {
  try {
    return parseInt(execSync(`grep -c "${pattern}" "${file}" 2>/dev/null`).toString().trim()) || 0;
  } catch { return 0; }
}

function uniqueChatLines(file, botName) {
  try {
    return execSync(`grep "Not Secure.*<${botName}>" "${file}" 2>/dev/null | sed 's/.*] //' | sort -u | wc -l`).toString().trim();
  } catch { return '0'; }
}

function topChatLines(file, botName, n = 5) {
  try {
    return execSync(`grep "Not Secure.*<${botName}>" "${file}" 2>/dev/null | sed 's/.*] //' | sort | uniq -c | sort -rn | head -${n}`).toString().trim();
  } catch { return ''; }
}

function collect() {
  const timestamp = new Date().toISOString();
  const snapshot = { timestamp, servers: {} };

  for (const s of SERVERS) {
    const botName = `Cody_${s.name[0]}`; // Cody_A, Cody_B, Cody_C
    snapshot.servers[s.name] = {
      fishCaught: countPattern(s.log, 'Fishy Business'),
      deaths: countPattern(s.log, 'was slain\\|died\\|blew up'),
      totalChats: countPattern(s.log, `<${botName}>`),
      uniqueChats: uniqueChatLines(s.log, botName),
      advancements: countPattern(s.log, 'Advancement'),
      topLines: topChatLines(s.log, botName, 3),
    };
  }

  const line = JSON.stringify(snapshot) + '\n';
  fs.appendFileSync(OUTFILE, line);
  console.log(`[${timestamp}] ${JSON.stringify(snapshot.servers)}`);
}

// Collect once, then every 60s
collect();
setInterval(collect, 60000);
