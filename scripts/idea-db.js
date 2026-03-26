#!/usr/bin/env node
/**
 * Script Idea Database — lightweight key-value store for script ideas, experiments, and patterns
 * 
 * Uses a simple JSON file with tagging and scoring. No vector DB needed.
 * Fast lookup by tag, game, score range, or keyword search.
 * 
 * Usage:
 *   node scripts/idea-db.js add --game fishing --type personality --name "v3-rainy" --tags "weather,mood,situational" --score 0 --notes "Reacts to rain, different behavior patterns"
 *   node scripts/idea-db.js search --game fishing --tag personality
 *   node scripts/idea-db.js top --game fishing --n 5
 *   node scripts/idea-db.js prune --max-age 7d
 */
import fs from 'fs';
import path from 'path';

const DB_PATH = '/home/lucineer/.openclaw/workspace/experiments/idea-db.json';

function load() {
  if (!fs.existsSync(DB_PATH)) return { ideas: [], meta: { created: new Date().toISOString() } };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function add(args) {
  const db = load();
  const idea = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    created: new Date().toISOString(),
    game: args.game || 'fishing',
    type: args.type || 'personality', // personality, mechanic, reaction, system, cross-game
    name: args.name || 'unnamed',
    tags: (args.tags || '').split(',').map(t => t.trim()),
    score: parseFloat(args.score || '0'), // -100 to 100
    tested: args.tested === 'true',
    file: args.file || null, // path to script file if implemented
    notes: args.notes || '',
    result: null, // filled after testing
  };
  db.ideas.push(idea);
  save(db);
  console.log(`✅ Added: ${idea.name} (${idea.id.slice(0,8)})`);
  return idea;
}

function search(args) {
  const db = load();
  let results = db.ideas;
  if (args.game) results = results.filter(i => i.game === args.game);
  if (args.type) results = results.filter(i => i.type === args.type);
  if (args.tag) results = results.filter(i => i.tags.includes(args.tag));
  if (args.keyword) {
    const kw = args.keyword.toLowerCase();
    results = results.filter(i => 
      i.name.toLowerCase().includes(kw) || 
      i.notes.toLowerCase().includes(kw) ||
      i.tags.some(t => t.includes(kw))
    );
  }
  if (args.tested !== undefined) {
    const wantTested = args.tested === 'true';
    results = results.filter(i => !!i.tested === wantTested);
  }
  // Sort by score descending
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  console.log(`Found ${results.length} ideas:`);
  for (const i of results.slice(0, args.n ? parseInt(args.n) : 20)) {
    const tested = i.tested ? '✅' : '🔄';
    console.log(`  ${tested} [${i.score || '?'}] ${i.name} (${i.game}/${i.type}) — ${i.tags.join(', ')}`);
    if (i.notes) console.log(`     ${i.notes.slice(0, 80)}`);
  }
  return results;
}

function top(args) {
  args.n = args.n || '10';
  args.tested = 'true';
  return search(args);
}

function untested(args) {
  args.tested = 'false';
  return search(args);
}

function prune(args) {
  const db = load();
  const maxAge = parseDuration(args.maxAge || '30d');
  const cutoff = Date.now() - maxAge;
  const before = db.ideas.length;
  
  // Keep: high-scoring, recently tested, recent additions, cross-game patterns
  db.ideas = db.ideas.filter(i => {
    const age = Date.now() - new Date(i.created).getTime();
    if (age < cutoff) return false; // Too old
    if ((i.score || 0) > 50) return true; // High score
    if (i.tags.includes('cross-game')) return true; // Cross-game patterns
    if (i.tested && (i.score || 0) > -20) return true; // Decent tested
    if (age < cutoff / 2) return true; // Keep newer stuff
    return false;
  });
  
  const removed = before - db.ideas.length;
  save(db);
  console.log(`Pruned ${removed} ideas (kept ${db.ideas.length})`);
}

function seed() {
  const db = load();
  
  const seeds = [
    // Fishing ideas
    { game: 'fishing', type: 'personality', name: 'v3-rainy-day', tags: 'weather,mood,situational', score: 0, notes: 'Different behavior in rain — complains about gear, fishes from shelter, talks about barometric pressure' },
    { game: 'fishing', type: 'personality', name: 'v3-storyteller', tags: 'social,depth,memory', score: 0, notes: 'References past catches by name, tells tall tales, builds narrative across session' },
    { game: 'fishing', type: 'reaction', name: 'weather-reaction', tags: 'weather,reactive', score: 0, notes: 'Chat triggers on weather changes — "Storm coming in", "Sun\'s breaking through"' },
    { game: 'fishing', type: 'reaction', name: 'wildlife-sighting', tags: 'wildlife,reactive,sitka', score: 0, notes: 'Random chance to spot whale/eagle/otter, comment on it' },
    { game: 'fishing', type: 'mechanic', name: 'tide-awareness', tags: 'tide,mechanic,sitka', score: 0, notes: 'Check game time for tide, adjust chat — "Incoming tide, fish should be moving"' },
    { game: 'fishing', type: 'personality', name: 'v3-drunk-ernie', tags: 'npc,character,social', score: 0, notes: 'Based on Ernie the bartender. Shows up at dock sometimes, offers "advice", gets philosophical' },
    { game: 'fishing', type: 'system', name: 'script-combiner', tags: 'ml,system,meta', score: 0, notes: 'Merge two scripts together — take chat pools from both, weight by source scores' },
    { game: 'fishing', type: 'system', name: 'context-aware-switching', tags: 'ml,system,adaptive', score: 0, notes: 'Auto-switch personality based on context: players nearby → social, alone → stoic, night → contemplative' },
    
    // Herding ideas
    { game: 'herding', type: 'personality', name: 'v2-puppy', tags: 'young,energy,playful', score: 0, notes: 'Overeager puppy, zoomies, doesn\'t listen but accidentally helpful' },
    { game: 'herding', type: 'mechanic', name: 'pack-coordination', tags: 'multi-agent,coordination', score: 0, notes: 'Two dogs work together — one flanks, one drives. Communication barks.' },
    
    // Disc Golf ideas
    { game: 'discgolf', type: 'personality', name: 'v2-heckler', tags: 'social,fun,reactive', score: 0, notes: 'Comments on player shots, "Nice shank!", "That\'s in the bushes." Annoying but funny.' },
    { game: 'discgolf', type: 'mechanic', name: 'score-prediction', tags: 'ai,prediction', score: 0, notes: 'Predicts player score before throw based on distance/wind/disc' },
    
    // Cross-game
    { game: 'all', type: 'cross-game', name: 'energy-loop', tags: 'cross-game,mood,system', score: 0, notes: 'Universal energy system: action costs energy, rest recovers. All scripts reference same pool.' },
    { game: 'all', type: 'cross-game', name: 'player-memory', tags: 'cross-game,memory,social', score: 0, notes: 'Remember player names, preferences, past interactions. Shared across all games.' },
    { game: 'all', type: 'cross-game', name: 'time-of-day-cycle', tags: 'cross-game,time,system', score: 0, notes: 'Script behavior shifts with game time: morning energized, afternoon steady, evening tired' },
    { game: 'all', type: 'system', name: 'failure-recovery', tags: 'cross-game,resilience', score: 0, notes: 'When a script step fails, have fallback behaviors instead of crashing' },
  ];
  
  for (const s of seeds) {
    if (!db.ideas.find(i => i.name === s.name)) {
      add(s);
    }
  }
  
  console.log(`\nSeeded ${seeds.length} ideas. Total: ${db.ideas.length}`);
}

function parseDuration(str) {
  const match = str.match(/^(\d+)(d|h|m)$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // default 30d
  const num = parseInt(match[1]);
  switch (match[2]) {
    case 'd': return num * 24 * 60 * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'm': return num * 60 * 1000;
  }
}

// CLI
const args = process.argv.slice(2);
const cmd = args[0];

const namedArgs = {};
let i = 1;
while (i < args.length) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const next = args[++i];
    namedArgs[key] = next || true;
  }
  i++;
}

switch (cmd) {
  case 'add': add(namedArgs); break;
  case 'search': search(namedArgs); break;
  case 'top': top(namedArgs); break;
  case 'untested': untested(namedArgs); break;
  case 'prune': prune(namedArgs); break;
  case 'seed': seed(); break;
  case 'count': console.log(load().ideas.length + ' ideas'); break;
  default:
    console.log(`Usage: node idea-db.js <add|search|top|untested|prune|seed|count> [--flags]`);
    console.log('  add     --game --type --name --tags --score --notes [--tested] [--file]');
    console.log('  search  [--game] [--type] [--tag] [--keyword] [--tested] [--n]');
    console.log('  top     [--game] [--n]');
    console.log('  untested [--game]');
    console.log('  prune   [--max-age 30d]');
    console.log('  seed    (populate with starter ideas)');
}
