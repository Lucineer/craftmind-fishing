#!/usr/bin/env node
/**
 * Quick telemetry check — fast status of all test servers
 */
import { execSync } from 'child_process';

const SERVERS = [
  { port: 25566, name: 'Alpha', bot: 'Cody_A', log: '/tmp/server-25566.log' },
  { port: 25567, name: 'Beta',  bot: 'Cody_B', log: '/tmp/server-25567.log' },
  { port: 25568, name: 'Gamma', bot: 'Cody_C', log: '/tmp/server-25568.log' },
];

function sCount(file, pattern) {
  try {
    return parseInt(execSync(`strings "${file}" 2>/dev/null | grep -c "${pattern}"`, { timeout: 8000 }).toString().trim()) || 0;
  } catch { return 0; }
}

const now = new Date().toISOString().slice(11, 16);
console.log(`\n📊 Telemetry ${now} AKDT`);
console.log('─'.repeat(60));

let totalFish = 0, totalChats = 0, totalDeaths = 0;
for (const s of SERVERS) {
  const fish = sCount(s.log, 'Fishy Business');
  const chats = sCount(s.log, `<${s.bot}>`);
  const deaths = sCount(s.log, 'was slain');
  totalFish += fish; totalChats += chats; totalDeaths += deaths;
  
  const botLog = `/tmp/bot-${s.port}.log`;
  const running = sCount(botLog, 'Running:');
  const casting = sCount(botLog, 'Casting');
  const errors = sCount(botLog, 'Error');
  
  const status = fish > 0 ? '🎣' : casting > 0 ? '🔄' : running > 0 ? '💬' : '❌';
  console.log(`  ${status} ${s.name} (${s.bot}): ${fish} fish | ${chats} chats | ${deaths} deaths | ${casting} casts | ${running} scripts | ${errors} errors`);
}

console.log('─'.repeat(60));
console.log(`  Totals: ${totalFish} fish | ${totalChats} chats | ${totalDeaths} deaths`);
console.log(`  Verdict: ${totalFish > 0 ? '✅ Fish being caught!' : totalChats > 50 ? '💬 Active (no fish yet)' : '⚠️ Check bots'}`);
console.log();
