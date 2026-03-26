#!/usr/bin/env node
/**
 * Script Comparison Tool
 * Reads telemetry from /tmp/sim-telemetry.jsonl, groups by script, ranks by composite score.
 * 
 * Usage: node scripts/compare-scripts.js [--json] [--top N]
 */
import fs from 'node:fs';

const TELEMETRY_FILE = '/tmp/sim-telemetry.jsonl';
const STATS_FILE = '/tmp/sim-stats.json';

function loadTelemetry() {
  if (!fs.existsSync(TELEMETRY_FILE)) return [];
  return fs.readFileSync(TELEMETRY_FILE, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function loadCurrentStats() {
  try {
    return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch { return null; }
}

function groupByScript(snapshots) {
  const groups = {};

  for (const snap of snapshots) {
    if (!snap.servers) continue;
    for (const [serverName, data] of Object.entries(snap.servers)) {
      // Read current script from stats file or use server name as identifier
      const scriptName = data.currentScript || serverName;
      if (!groups[scriptName]) {
        groups[scriptName] = { entries: [], name: scriptName };
      }
      groups[scriptName].entries.push({
        ...data,
        timestamp: snap.timestamp,
        server: serverName,
      });
    }
  }

  return Object.values(groups);
}

function computeMetrics(group) {
  const entries = group.entries;
  if (entries.length === 0) return null;

  // Get the first and last timestamps to compute duration
  const first = new Date(entries[0].timestamp);
  const last = new Date(entries[entries.length - 1].timestamp);
  const hours = Math.max(0.01, (last - first) / 3600000);

  const totalFish = entries.reduce((s, e) => s + (e.fishCaught || 0), 0);
  const totalDeaths = entries.reduce((s, e) => s + (e.deaths || 0), 0);
  const totalChats = entries.reduce((s, e) => s + (e.totalChats || 0), 0);
  const totalUnique = entries.reduce((s, e) => s + (parseInt(e.uniqueChats) || 0), 0);

  // Also check current stats file for live data
  const live = loadCurrentStats();

  return {
    name: group.name,
    samples: entries.length,
    hours: hours.toFixed(1),
    fishPerHour: (totalFish / hours).toFixed(1),
    deathsPerHour: (totalDeaths / hours).toFixed(2),
    chatsPerHour: (totalChats / hours).toFixed(1),
    uniqueChats: totalUnique,
    totalFish,
    totalDeaths,
    totalChats,
    // Composite score: fish rate * 0.4 + unique chats * 0.3 - deaths * 0.3
    composite: ((totalFish / hours) * 0.4 + totalUnique * 0.3 - (totalDeaths / hours) * 0.3).toFixed(2),
    live: live ? {
      script: live.currentScript,
      mood: live.mood,
      energy: live.energy,
      uptime: live.uptime ? `${(live.uptime / 3600).toFixed(1)}h` : '?',
    } : null,
  };
}

function printTable(metrics, topN = Infinity) {
  const sorted = metrics
    .filter(Boolean)
    .sort((a, b) => parseFloat(b.composite) - parseFloat(a.composite))
    .slice(0, topN);

  if (sorted.length === 0) {
    console.log('No telemetry data found. Run servers first to collect data.');
    console.log(`Expected: ${TELEMETRY_FILE}`);
    return;
  }

  console.log('\n📊 Script Comparison Results');
  console.log('═'.repeat(90));
  console.log(
    'Rank  Script'.padEnd(22) +
    'Fish/hr'.padEnd(10) +
    'Death/hr'.padEnd(10) +
    'Chat/hr'.padEnd(10) +
    'Unique'.padEnd(8) +
    'Samples'.padEnd(8) +
    'Score'
  );
  console.log('─'.repeat(90));

  sorted.forEach((m, i) => {
    const rank = `#${i + 1}`.padEnd(5);
    console.log(
      `${rank}${m.name.padEnd(17)}` +
      `${m.fishPerHour.padEnd(10)}` +
      `${m.deathsPerHour.padEnd(10)}` +
      `${m.chatsPerHour.padEnd(10)}` +
      `${String(m.uniqueChats).padEnd(8)}` +
      `${String(m.samples).padEnd(8)}` +
      `${m.composite}`
    );
  });

  console.log('═'.repeat(90));
  console.log(`Score = fish/hr × 0.4 + unique_chats × 0.3 - deaths/hr × 0.3\n`);

  // Show live stats if available
  const live = loadCurrentStats();
  if (live) {
    console.log('📡 Live Stats:');
    console.log(`   Script: ${live.currentScript} | Mood: ${live.mood} | Energy: ${live.energy} | Uptime: ${(live.uptime / 3600).toFixed(1)}h`);
  }
}

function printJSON(metrics) {
  console.log(JSON.stringify(metrics.filter(Boolean), null, 2));
}

// ── Main ──
const args = process.argv.slice(2);
const json = args.includes('--json');
const topIdx = args.indexOf('--top');
const topN = topIdx >= 0 ? parseInt(args[topIdx + 1], 10) : Infinity;

const snapshots = loadTelemetry();
const groups = groupByScript(snapshots);
const metrics = groups.map(computeMetrics);

if (json) {
  printJSON(metrics);
} else {
  printTable(metrics, topN);
}
