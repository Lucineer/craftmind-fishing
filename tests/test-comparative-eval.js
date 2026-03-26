/**
 * Tests for the Comparative Evaluation System.
 * Run: node tests/test-comparative-eval.js
 */

import { SessionRecorder, LiveSession } from '../src/ai/session-recorder.js';
import { ComparativeEvaluator } from '../src/ai/comparative-evaluator.js';
import { ScriptEvolver } from '../src/ai/script-evolver.js';
import { DecisionEngine } from '../src/ai/decision-engine.js';
import { mkdirSync, rmSync } from 'fs';

const TEST_DIR = './data/test-comparative';
let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, label) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function assertApprox(actual, expected, tolerance, label) {
  assert(Math.abs(actual - expected) <= tolerance, `${label} (got ${actual}, expected ~${expected})`);
}

function setup() {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
}

// ── Helper: create a mock session ──────────────────────────────────────────
function makeSession(overrides = {}) {
  return {
    startTime: '2026-03-25T08:00:00Z',
    endTime: '2026-03-25T09:00:00Z',
    duration: 3600,
    skill: 'troll-salmon',
    conditions: {
      weather: 'overcast', tide: 'incoming', timeOfDay: 'morning',
      depth: 40, location: 'kelp_line', bait: 'pink_hoochie', temperature: 48,
      ...overrides.conditions,
    },
    events: [],
    results: { catches: [], totalWeight: 0, speciesCaught: [] },
    outcome: 'failure',
    ...overrides,
  };
}

// ── Session Recorder Tests ──────────────────────────────────────────────────

function testSessionRecorderBasic() {
  setup();
  console.log('\n📋 Session Recorder — Basic');
  const recorder = new SessionRecorder(TEST_DIR);

  const session = makeSession({
    results: { catches: [{ species: 'king', weight: 25, method: 'troll' }], totalWeight: 25, speciesCaught: ['king'] },
    outcome: 'success',
  });

  const id = recorder.recordSession(session);
  assert(typeof id === 'string' && id.startsWith('session_'), 'Returns valid session ID');
  assert(recorder.sessionCount === 1, 'Session count is 1');

  const loaded = recorder.loadSession(id);
  assert(loaded !== null, 'Session can be loaded by ID');
  assert(loaded.skill === 'troll-salmon', 'Loaded session has correct skill');
  assert(loaded.results.catches.length === 1, 'Loaded session has correct catches');
}

function testSessionRecorderValidation() {
  setup();
  console.log('\n📋 Session Recorder — Validation');
  const recorder = new SessionRecorder(TEST_DIR);

  try {
    recorder.recordSession({ startTime: '2026-01-01' });
    assert(false, 'Should throw without skill');
  } catch {
    assert(true, 'Throws without skill');
  }

  try {
    recorder.recordSession({ skill: 'test' });
    assert(false, 'Should throw without conditions');
  } catch {
    assert(true, 'Throws without conditions');
  }
}

function testSessionRecorderQuery() {
  setup();
  console.log('\n📋 Session Recorder — Query');
  const recorder = new SessionRecorder(TEST_DIR);

  recorder.recordSession(makeSession({ skill: 'troll-salmon', outcome: 'success' }));
  recorder.recordSession(makeSession({ skill: 'troll-salmon', outcome: 'failure' }));
  recorder.recordSession(makeSession({
    skill: 'bottom-fish-halibut',
    conditions: { weather: 'sunny', tide: 'outgoing', timeOfDay: 'afternoon', depth: 150, location: 'deep_channel', bait: 'herring', temperature: 50 },
    outcome: 'success',
  }));

  assert(recorder.sessionCount === 3, 'All sessions recorded');

  const bySkill = recorder.querySessions({ skill: 'troll-salmon' });
  assert(bySkill.length === 2, 'Query by skill returns 2');

  const byOutcome = recorder.querySessions({ outcome: 'success' });
  assert(byOutcome.length === 2, 'Query by outcome returns 2');

  const bySpecies = recorder.querySessions({ species: 'king' });
  assert(bySpecies.length === 0, 'Query by missing species returns 0');

  const withLimit = recorder.querySessions({ limit: 2 });
  assert(withLimit.length === 2, 'Query with limit returns 2');
}

function testLiveSession() {
  console.log('\n📋 Session Recorder — LiveSession');
  const recorder = new SessionRecorder(TEST_DIR);
  const live = recorder.createLiveSession('troll-salmon', {
    weather: 'overcast', tide: 'incoming', timeOfDay: 'morning',
    depth: 40, location: 'kelp_line', bait: 'pink_hoochie', temperature: 48,
  });

  live.addCatch('king', 25, 'troll');
  live.addMiss({ reason: 'line broke' });
  live.gearChange({ from: 'hoochie-pink', to: 'hoochie-green' });

  const id = live.finalize();
  assert(typeof id === 'string', 'LiveSession finalizes with ID');

  const loaded = recorder.loadSession(id);
  assert(loaded.events.length === 3, 'Events recorded (catch + miss + gear_change)');
  assert(loaded.results.catches.length === 1, 'Catch recorded');
  assert(loaded.results.catches[0].species === 'king', 'Catch has correct species');
  assert(loaded.outcome === 'partial', 'Outcome defaults based on catches');
}

function testLiveSessionWeatherChange() {
  console.log('\n📋 Session Recorder — LiveSession weather change');
  const recorder = new SessionRecorder(TEST_DIR);
  const live = recorder.createLiveSession('troll-salmon', { weather: 'sunny', tide: 'slack', depth: 30, location: 'shore', bait: 'shrimp', temperature: 50 });

  live.weatherChange({ weather: 'rain' });
  live.addCatch('rockfish', 2, 'cast');

  const id = live.finalize();
  const loaded = recorder.loadSession(id);
  assert(loaded.conditions.weather === 'rain', 'Weather updated in conditions');
}

// ── Comparative Evaluator Tests ─────────────────────────────────────────────

function testScoreSession() {
  console.log('\n📊 Comparative Evaluator — Score');
  const evaluator = new ComparativeEvaluator(TEST_DIR);

  const great = makeSession({
    results: { catches: [{ species: 'king', weight: 30 }, { species: 'coho', weight: 8 }], totalWeight: 38, speciesCaught: ['king', 'coho'] },
    outcome: 'success', duration: 3600,
  });
  const poor = makeSession({
    results: { catches: [], totalWeight: 0, speciesCaught: [] },
    outcome: 'failure', duration: 7200,
  });

  const greatScore = evaluator.scoreSession(great);
  const poorScore = evaluator.scoreSession(poor);
  assert(greatScore > 0.6, `Great session scores high: ${greatScore.toFixed(2)}`);
  assert(poorScore < 0.3, `Poor session scores low: ${poorScore.toFixed(2)}`);
  assert(greatScore > poorScore, 'Great session scores higher than poor');
}

function testConditionSimilarity() {
  console.log('\n📊 Comparative Evaluator — Similarity');
  const evaluator = new ComparativeEvaluator(TEST_DIR);

  const a = { weather: 'overcast', tide: 'incoming', depth: 40, bait: 'pink_hoochie', temperature: 48 };
  const same = { ...a };
  const different = { weather: 'sunny', tide: 'outgoing', depth: 150, bait: 'herring', temperature: 55 };
  const partial = { weather: 'overcast', tide: 'slack', depth: 50, bait: 'pink_hoochie', temperature: 46 };

  const simSame = evaluator._conditionSimilarity(a, same);
  const simDiff = evaluator._conditionSimilarity(a, different);
  const simPartial = evaluator._conditionSimilarity(a, partial);

  assert(simSame === 1, `Same conditions = 1.0 (got ${simSame})`);
  assert(simDiff <= 0.2, `Very different < 0.2 (got ${simDiff})`);
  assert(simPartial > simDiff, `Partial match > completely different`);
}

function testFindSimilarSessions() {
  console.log('\n📊 Comparative Evaluator — Find Similar');
  const evaluator = new ComparativeEvaluator(TEST_DIR);

  const conditions = { weather: 'overcast', tide: 'incoming', depth: 40, bait: 'pink_hoochie' };

  const sessions = [
    makeSession({ conditions: { weather: 'overcast', tide: 'incoming', depth: 40, bait: 'pink_hoochie', temperature: 48 } }),
    makeSession({ conditions: { weather: 'rain', tide: 'outgoing', depth: 150, bait: 'herring', temperature: 50 } }),
    makeSession({ conditions: { weather: 'overcast', tide: 'incoming', depth: 45, bait: 'pink_hoochie', temperature: 47 } }),
  ];

  const similar = evaluator.findSimilarSessions(conditions, sessions);
  assert(similar.length >= 2, `Finds ${similar.length} similar sessions`);
  assert(similar.length < sessions.length, 'Filters out dissimilar sessions');
}

function testEvaluate() {
  console.log('\n📊 Comparative Evaluator — Full Evaluation');
  const evaluator = new ComparativeEvaluator(TEST_DIR);

  // Build history: 5 sessions of troll-salmon, 3 good
  const history = [
    makeSession({ skill: 'troll-salmon', outcome: 'success',
      results: { catches: [{ species: 'king', weight: 25 }], totalWeight: 25, speciesCaught: ['king'] } }),
    makeSession({ skill: 'troll-salmon', outcome: 'success',
      results: { catches: [{ species: 'coho', weight: 10 }], totalWeight: 10, speciesCaught: ['coho'] } }),
    makeSession({ skill: 'troll-salmon', outcome: 'failure' }),
    makeSession({ skill: 'troll-salmon', outcome: 'success',
      results: { catches: [{ species: 'king', weight: 30 }, { species: 'coho', weight: 8 }], totalWeight: 38, speciesCaught: ['king', 'coho'] } }),
    makeSession({ skill: 'troll-salmon', outcome: 'failure' }),
    // Some different skill sessions
    makeSession({ skill: 'bottom-fish',
      conditions: { weather: 'sunny', tide: 'slack', timeOfDay: 'afternoon', depth: 150, location: 'deep', bait: 'herring', temperature: 52 },
      outcome: 'failure' }),
    makeSession({ skill: 'bottom-fish',
      conditions: { weather: 'overcast', tide: 'outgoing', timeOfDay: 'morning', depth: 120, location: 'deep', bait: 'herring', temperature: 48 },
      outcome: 'success',
      results: { catches: [{ species: 'halibut', weight: 80 }], totalWeight: 80, speciesCaught: ['halibut'] } }),
  ];

  const current = makeSession({
    outcome: 'success',
    results: { catches: [{ species: 'king', weight: 20 }], totalWeight: 20, speciesCaught: ['king'] },
  });

  const eval_result = evaluator.evaluate(current, history);
  assert(typeof eval_result.sessionScore === 'number', 'Has sessionScore');
  assert(eval_result.sessionScore > 0, 'Score is positive');
  assert(typeof eval_result.historicalRank === 'number', 'Has historicalRank');
  assert(typeof eval_result.bestScript === 'string', 'Has bestScript');
  assert(Array.isArray(eval_result.insights), 'Has insights array');
  assert(typeof eval_result.scriptRanking === 'object', 'Has scriptRanking');
  assert(eval_result.scriptRanking['troll-salmon'], 'Ranking includes troll-salmon');
}

function testEvaluateNoHistory() {
  console.log('\n📊 Comparative Evaluator — No History');
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const session = makeSession({ outcome: 'success' });
  const result = evaluator.evaluate(session, []);
  assert(result.sessionScore > 0, 'Scores even without history');
  assert(result.historicalRank === 1, 'Rank 1 when no history');
  assert(result.historicalTotal === 1, 'Total 1 when no history');
}

function testSaveAndLoadInsights() {
  console.log('\n📊 Comparative Evaluator — Save/Load Insights');
  const evaluator = new ComparativeEvaluator(TEST_DIR);

  evaluator.saveInsights(['Kings bite on outgoing tide', 'Pink hoochies work 78% of time'], 'test1');
  evaluator.saveInsights(['Halibut hate wind'], 'test2');

  const all = evaluator.getAllInsights();
  assert(all.length === 3, `Loaded ${all.length} insights`);
  assert(all.includes('Kings bite on outgoing tide'), 'First insight present');
}

function testPersistence() {
  console.log('\n📊 Comparative Evaluator — Persistence');
  const evaluator1 = new ComparativeEvaluator(TEST_DIR);

  const session = makeSession({ outcome: 'success' });
  evaluator1.saveComparison('test-persist-123', {
    sessionScore: 0.72,
    historicalRank: 3,
    historicalTotal: 10,
    bestScript: 'troll-salmon',
    bestConditions: { tide: 'incoming' },
    insights: ['Test insight'],
    scriptRanking: { 'troll-salmon': { avgScore: 0.7, uses: 5, successRate: 0.8 } },
  });

  const evaluator2 = new ComparativeEvaluator(TEST_DIR);
  const summary = evaluator2.getScriptPerformanceSummary();
  assert(summary['troll-salmon'], 'Performance summary persisted');
  assert(summary['troll-salmon'].evaluations === 1, 'Evaluation count correct');
}

// ── Script Evolver Tests ────────────────────────────────────────────────────

function testValidateCode() {
  console.log('\n🧬 Script Evolver — Validation');
  const evolver = new ScriptEvolver(TEST_DIR);

  const valid = evolver.validate('const x = 1; function test() { return x; }');
  assert(valid.valid === true, 'Valid JS passes validation');

  const empty = evolver.validate('  ');
  assert(empty.valid === false, 'Empty code fails');

  const short = evolver.validate('x=1');
  assert(short.valid === false, 'Very short code fails');

  const withExports = evolver.validate('export function fish() { return true; }', ['fish']);
  assert(withExports.valid === true, 'ESM with export validates');
}

function testCompareScripts() {
  console.log('\n🧬 Script Evolver — Compare Scripts');
  const evolver = new ScriptEvolver(TEST_DIR);

  const oldCode = 'function fish() { return true; }';
  const newCode = '// Improved: added depth check based on data\nfunction fish(depth) {\n  // Kings bite better at 40ft (78% of sessions)\n  if (depth < 30) return false;\n  return true;\n}';
  const evaluation = { sessionScore: 0.5, currentSuccessRate: 0.4, insights: ['Kings at 40ft'] };

  evolver.compareScripts(oldCode, newCode, evaluation).then(result => {
    assert(typeof result.newIsBetter === 'boolean', 'Returns boolean comparison');
    assert(typeof result.improvement === 'number', 'Returns numeric improvement');
    assert(result.details.length > 0, 'Returns details');
  });
}

function testEvolveWithoutLLM() {
  console.log('\n🧬 Script Evolver — No LLM fallback');
  const evolver = new ScriptEvolver(TEST_DIR);

  evolver.evolve('nonexistent-script', { sessionScore: 0.5, scriptRanking: {} }, null).then(result => {
    assert(result.evolved === false, 'Cannot evolve without script file');
  });
}

// ── Decision Engine Tests ────────────────────────────────────────────────────

async function testDecideWithData() {
  setup();
  console.log('\n🎯 Decision Engine — With Data');
  const recorder = new SessionRecorder(TEST_DIR);
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const engine = new DecisionEngine(evaluator, recorder);

  // Seed some sessions
  recorder.recordSession(makeSession({
    skill: 'troll-salmon', outcome: 'success',
    results: { catches: [{ species: 'king', weight: 25 }], totalWeight: 25, speciesCaught: ['king'] },
  }));
  recorder.recordSession(makeSession({
    skill: 'troll-salmon', outcome: 'success',
    results: { catches: [{ species: 'coho', weight: 12 }], totalWeight: 12, speciesCaught: ['coho'] },
  }));
  recorder.recordSession(makeSession({
    skill: 'bottom-fish',
    conditions: { weather: 'sunny', tide: 'slack', timeOfDay: 'afternoon', depth: 150, location: 'deep', bait: 'herring', temperature: 52 },
    outcome: 'failure',
  }));

  const decision = engine.decide(
    { weather: 'overcast', tide: 'incoming', depth: 40, bait: 'pink_hoochie' },
    { traits: { stubbornness: 0.7 }, mood: { energy: 0.8, frustration: 0.1, satisfaction: 0.6, social: 0.5 } },
    { working: { target: null } },
  );

  assert(decision.action === 'fish', `Action is 'fish' (got '${decision.action}')`);
  assert(decision.script === 'troll-salmon', `Best script is troll-salmon (got '${decision.script}')`);
  assert(decision.confidence > 0, 'Has positive confidence');
  assert(decision.reasoning.length > 0, 'Has reasoning');
  assert(Array.isArray(decision.altScripts), 'Has altScripts');
}

async function testDecideNoData() {
  setup();
  console.log('\n🎯 Decision Engine — No Data');
  const recorder = new SessionRecorder(TEST_DIR);
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const engine = new DecisionEngine(evaluator, recorder);

  const decision = engine.decide({}, {}, {});
  assert(decision.action === 'idle', 'No data → idle');
  assert(decision.script === null, 'No script when idle');
}

async function testDecideFrustrated() {
  setup();
  console.log('\n🎯 Decision Engine — Frustrated Personality');
  const recorder = new SessionRecorder(TEST_DIR);
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const engine = new DecisionEngine(evaluator, recorder);

  // Multiple failures with one script
  for (let i = 0; i < 3; i++) {
    recorder.recordSession(makeSession({ skill: 'troll-salmon', outcome: 'failure' }));
  }
  recorder.recordSession(makeSession({
    skill: 'bottom-fish',
    conditions: { weather: 'sunny', tide: 'slack', timeOfDay: 'afternoon', depth: 150, location: 'deep', bait: 'herring', temperature: 52 },
    outcome: 'success',
    results: { catches: [{ species: 'halibut', weight: 80 }], totalWeight: 80, speciesCaught: ['halibut'] },
  }));

  const decision = engine.decide(
    {},
    { traits: { stubbornness: 0.3 }, mood: { energy: 0.5, frustration: 0.8, satisfaction: 0.2, social: 0.3 } },
    {},
  );

  assert(decision.action !== 'idle', 'Takes action when frustrated');
  // Should bias away from the failing script
  const reasons = decision.reasoning.join(' ').toLowerCase();
  assert(reasons.includes('frustrat') || decision.script !== 'troll-salmon',
    'Frustration affects decision');
}

async function testDecideTired() {
  setup();
  console.log('\n🎯 Decision Engine — Tired');
  const recorder = new SessionRecorder(TEST_DIR);
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const engine = new DecisionEngine(evaluator, recorder);

  recorder.recordSession(makeSession({ skill: 'troll-salmon', outcome: 'success' }));

  const decision = engine.decide(
    {},
    { traits: {}, mood: { energy: 0.1, frustration: 0.2, satisfaction: 0.5, social: 0.3 } },
    {},
  );

  assert(decision.action === 'rest', 'Very tired → rest');
}

async function testAnswerQuestion() {
  setup();
  console.log('\n🎯 Decision Engine — Answer Questions');
  const recorder = new SessionRecorder(TEST_DIR);
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const engine = new DecisionEngine(evaluator, recorder);

  // Seed data
  for (let i = 0; i < 5; i++) {
    recorder.recordSession(makeSession({
      skill: 'troll-salmon',
      outcome: i < 3 ? 'success' : 'failure',
      results: i < 3
        ? { catches: [{ species: 'king', weight: 25 }], totalWeight: 25, speciesCaught: ['king'] }
        : { catches: [], totalWeight: 0, speciesCaught: [] },
    }));
  }

  const summary = engine.answerQuestion('How is fishing going?');
  assert(summary.includes('5 sessions'), `Summary mentions session count: ${summary.slice(0, 80)}`);

  const noData = engine.answerQuestion('Best for halibut?');
  assert(noData.length > 20, 'Gives reasonable response without specific data');
}

async function testStubbornnessBias() {
  setup();
  console.log('\n🎯 Decision Engine — Stubbornness Bias');
  const recorder = new SessionRecorder(TEST_DIR);
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const engine = new DecisionEngine(evaluator, recorder);

  // 10 uses of troll-salmon, 2 uses of new-script
  for (let i = 0; i < 10; i++) {
    recorder.recordSession(makeSession({ skill: 'troll-salmon', outcome: 'success' }));
  }
  for (let i = 0; i < 2; i++) {
    recorder.recordSession(makeSession({
      skill: 'new-experimental',
      conditions: { weather: 'overcast', tide: 'incoming', depth: 40, location: 'shore', bait: 'shrimp', temperature: 48 },
      outcome: 'success',
      results: { catches: [{ species: 'rockfish', weight: 3 }], totalWeight: 3, speciesCaught: ['rockfish'] },
    }));
  }

  const decision = engine.decide(
    { weather: 'overcast', tide: 'incoming', depth: 40, bait: 'pink_hoochie' },
    { traits: { stubbornness: 0.9 }, mood: { energy: 0.8, frustration: 0.1, satisfaction: 0.6, social: 0.5 } },
    {},
  );

  // Stubborn Cody should prefer the proven script
  assert(decision.script === 'troll-salmon', `Stubborn bias: chose '${decision.script}'`);
}

async function testTargetSpecies() {
  setup();
  console.log('\n🎯 Decision Engine — Target Species');
  const recorder = new SessionRecorder(TEST_DIR);
  const evaluator = new ComparativeEvaluator(TEST_DIR);
  const engine = new DecisionEngine(evaluator, recorder);

  recorder.recordSession(makeSession({
    skill: 'troll-salmon', outcome: 'success',
    results: { catches: [{ species: 'king', weight: 25 }], totalWeight: 25, speciesCaught: ['king'] },
  }));
  recorder.recordSession(makeSession({
    skill: 'bottom-fish',
    conditions: { weather: 'overcast', tide: 'slack', depth: 120, location: 'deep', bait: 'herring', temperature: 50 },
    outcome: 'success',
    results: { catches: [{ species: 'halibut', weight: 80 }, { species: 'cod', weight: 15 }], totalWeight: 95, speciesCaught: ['halibut', 'cod'] },
  }));

  const decision = engine.decide(
    {},
    { traits: {}, mood: { energy: 0.8, frustration: 0.1, satisfaction: 0.5, social: 0.5 } },
    { working: { target: 'halibut' } },
  );

  // Should prefer bottom-fish when targeting halibut
  assert(decision.script === 'bottom-fish', `Target species: chose '${decision.script}' for halibut`);
}

// ── Run All Tests ────────────────────────────────────────────────────────────

async function main() {
  console.log('═══ Comparative Evaluation System Tests ═══');
  setup();

  // Session Recorder
  testSessionRecorderBasic();
  testSessionRecorderValidation();
  testSessionRecorderQuery();
  testLiveSession();
  testLiveSessionWeatherChange();

  // Comparative Evaluator
  testScoreSession();
  testConditionSimilarity();
  testFindSimilarSessions();
  testEvaluate();
  testEvaluateNoHistory();
  testSaveAndLoadInsights();
  testPersistence();

  // Script Evolver
  testValidateCode();
  await testCompareScripts();
  await testEvolveWithoutLLM();

  // Decision Engine
  await testDecideWithData();
  await testDecideNoData();
  await testDecideFrustrated();
  await testDecideTired();
  await testAnswerQuestion();
  await testStubbornnessBias();
  await testTargetSpecies();

  teardown();

  console.log(`\n═══ Results: ${passed}/${total} passed, ${failed} failed ═══`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
