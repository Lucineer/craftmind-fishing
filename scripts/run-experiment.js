#!/usr/bin/env node
/**
 * Experiment Runner — automated script A/B testing
 * 
 * Usage: node scripts/run-experiment.js [--duration 1500] [--scripts v1-aggressive,v1-social]
 * 
 * Deploys scripts to test servers, runs for duration, collects results, writes to experiments/raw/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPERIMENTS_DIR = '/home/lucineer/.openclaw/workspace/experiments';

const SERVERS = [
  { port: 25566, rcon: 25576, name: 'Alpha', bot: 'Cody_A' },
  { port: 25567, rcon: 25577, name: 'Beta',  bot: 'Cody_B' },
  { port: 25568, rcon: 25578, name: 'Gamma', bot: 'Cody_C' },
];

const DURATION = parseInt(process.argv.find(a => a.startsWith('--duration'))?.split('=')[1] || '1500'); // 25 min default
const SCRIPTS_ARG = process.argv.find(a => a.startsWith('--scripts'))?.split('=')[1] || '';
const SCRIPTS = SCRIPTS_ARG ? SCRIPTS_ARG.split(',') : ['v1-aggressive', 'v1-social', 'v1-lazy'];

function timestamp() { return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); }

function createRunDir() {
  const runDir = path.join(EXPERIMENTS_DIR, 'raw', 'fishing', `run-${timestamp()}`);
  fs.mkdirSync(runDir, { recursive: true });
  return runDir;
}

function writeConfig(runDir, scripts) {
  const config = {
    timestamp: new Date().toISOString(),
    game: 'fishing',
    duration: DURATION,
    scripts: scripts.map((s, i) => ({ server: SERVERS[i]?.name || `Server${i}`, script: s })),
    servers: SERVERS.map(s => s.port),
  };
  fs.writeFileSync(path.join(runDir, 'config.json'), JSON.stringify(config, null, 2));
  return config;
}

function countPattern(file, pattern) {
  try {
    return parseInt(require('child_process').execSync(`grep -c "${pattern}" "${file}" 2>/dev/null`).toString().trim()) || 0;
  } catch { return 0; }
}

function uniqueChatLines(file, botName) {
  try {
    const result = require('child_process').execSync(
      `grep "Not Secure.*<${botName}>" "${file}" 2>/dev/null | sed 's/.*] //' | sort -u`
    ).toString().trim();
    return result.split('\n').filter(Boolean);
  } catch { return []; }
}

function collectTelemetry(serverLog, botName) {
  const totalChats = countPattern(serverLog, `<${botName}>`);
  const fishCaught = countPattern(serverLog, 'Fishy Business');
  const deaths = countPattern(serverLog, `was slain\\|blew up`);
  const unique = uniqueChatLines(serverLog, botName);
  const topLines = {};
  try {
    const result = require('child_process').execSync(
      `grep "Not Secure.*<${botName}>" "${serverLog}" 2>/dev/null | sed 's/.*] //' | sort | uniq -c | sort -rn | head -20`
    ).toString().trim();
    for (const line of result.split('\n')) {
      const [count, ...text] = line.trim().split(' ');
      topLines[text.join(' ')] = parseInt(count);
    }
  } catch {}

  // Shannon entropy
  const total = Object.values(topLines).reduce((a, b) => a + b, 0) || 1;
  const entropy = Object.values(topLines).reduce((h, count) => {
    const p = count / total;
    return h - p * Math.log2(p);
  }, 0);

  return {
    fishCaught,
    deaths,
    totalChats,
    uniqueChats: unique.length,
    uniqueLines: unique,
    shannonEntropy: Math.round(entropy * 100) / 100,
    topLines,
    chatPerFish: fishCaught > 0 ? Math.round(totalChats / fishCaught) : 0,
  };
}

async function runExperiment() {
  const runDir = createRunDir();
  const config = writeConfig(runDir, SCRIPTS);
  console.log(`\n🧪 Experiment started: ${path.basename(runDir)}`);
  console.log(`   Duration: ${DURATION}s (${Math.round(DURATION/60)} min)`);
  console.log(`   Scripts: ${SCRIPTS.join(', ')}`);
  console.log(`   Servers: ${SERVERS.map(s => s.port).join(', ')}`);
  console.log(`   Data dir: ${runDir}\n`);

  // Wait for experiment to run
  const startTime = Date.now();
  const checkInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const pct = Math.round((elapsed / DURATION) * 100);
    process.stdout.write(`\r⏳ ${elapsed}/${DURATION}s (${pct}%)`);
  }, 5000);

  await new Promise(resolve => setTimeout(resolve, DURATION * 1000));
  clearInterval(checkInterval);
  console.log('\n\n📊 Collecting results...');

  // Collect telemetry from each server
  const results = {};
  for (let i = 0; i < SERVERS.length; i++) {
    const server = SERVERS[i];
    const scriptName = SCRIPTS[i] || 'unknown';
    const serverLog = `/tmp/server-${server.port}.log`;
    const botName = server.bot;

    const telemetry = collectTelemetry(serverLog, botName);
    telemetry.scriptName = scriptName;
    telemetry.server = server.name;
    telemetry.port = server.port;
    telemetry.bot = botName;
    telemetry.duration = DURATION;

    // Compute composite score
    const fishPerHour = (telemetry.fishCaught / (DURATION / 3600));
    const deathsPerHour = (telemetry.deaths / (DURATION / 3600));
    const chatPerHour = (telemetry.totalChats / (DURATION / 3600));
    const engagement = telemetry.totalChats > 0 ? telemetry.uniqueChats / telemetry.totalChats : 0;
    
    telemetry.scores = {
      fishPerHour: Math.round(fishPerHour * 10) / 10,
      deathsPerHour: Math.round(deathsPerHour * 10) / 10,
      chatPerHour: Math.round(chatPerHour * 10) / 10,
      engagement: Math.round(engagement * 100) / 100,
      entropy: telemetry.shannonEntropy,
      composite: 0, // computed after all results
    };

    results[server.name] = telemetry;

    // Write per-server data
    fs.writeFileSync(
      path.join(runDir, `server-${server.port}.json`),
      JSON.stringify(telemetry, null, 2)
    );

    // Copy chat log
    try {
      const chatLog = require('child_process').execSync(
        `grep "Not Secure.*<${botName}>" "${serverLog}" 2>/dev/null`
      ).toString();
      fs.writeFileSync(path.join(runDir, `chat-${server.name}.txt`), chatLog);
    } catch {}

    console.log(`   ${server.name} (${scriptName}): ${telemetry.fishCaught} fish, ${telemetry.deaths} deaths, ${telemetry.uniqueChats} unique lines, entropy ${telemetry.shannonEntropy}`);
  }

  // Compute composite scores
  for (const [name, r] of Object.entries(results)) {
    const s = r.scores;
    // Composite: fish production + chat quality - deaths - too much/too little chat
    s.composite = Math.round((
      s.fishPerHour * 2 +
      s.entropy * 5 +
      s.engagement * 20 +
      Math.min(s.chatPerHour, 30) * 0.5 -
      s.deathsPerHour * 5
    ) * 10) / 10;
    console.log(`   ${name} composite score: ${s.composite}`);
  }

  // Write summary
  const summary = {
    run: path.basename(runDir),
    timestamp: config.timestamp,
    duration: DURATION,
    results,
    rankings: Object.entries(results)
      .sort((a, b) => b[1].scores.composite - a[1].scores.composite)
      .map(([name, r]) => ({ rank: 0, server: name, script: r.scriptName, score: r.scores.composite, fish: r.fishCaught, deaths: r.deaths, unique: r.uniqueChats, entropy: r.shannonEntropy })),
  };
  summary.rankings.forEach((r, i) => r.rank = i + 1);

  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\n🏆 Rankings:`);
  for (const r of summary.rankings) {
    console.log(`   #${r.rank} ${r.script} (${r.server}): score ${r.score} — ${r.fish} fish, ${r.unique} unique lines, entropy ${r.entropy}`);
  }

  // Append to master results log
  const masterLog = path.join(EXPERIMENTS_DIR, 'all-results.jsonl');
  fs.appendFileSync(masterLog, JSON.stringify(summary) + '\n');

  console.log(`\n✅ Results saved to ${runDir}`);
  console.log(`   Appended to ${masterLog}`);
  return summary;
}

runExperiment().catch(e => {
  console.error('Experiment failed:', e);
  process.exit(1);
});
