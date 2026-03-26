/**
 * @module craftmind-fishing/tests/test-ai-engine
 * @description Tests for the AI behavior engine: behavior tree, humanizer,
 * personality, memory, relationships, skill library, and integration.
 */

import {
  BehaviorTree, Blackboard, Selector, Sequence, Parallel, Decorator,
  Condition, Action, Status,
} from '../src/ai/behavior-tree.js';
import { Humanizer } from '../src/ai/humanizer.js';
import { DailySchedule } from '../src/ai/schedule.js';
import { Personality, Mood, CODY_TRAITS, CODY_OPINIONS } from '../src/ai/personality.js';
import { Memory } from '../src/ai/memory.js';
import { Relationships } from '../src/ai/relationships.js';
import { SkillLibrary } from '../src/ai/skill-library.js';

// ── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(msg || 'Assertion failed');
  }
}

function assertEqual(actual, expected, msg) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    errors.push(`${msg || 'assertEqual'}: expected ${expected}, got ${actual}`);
  }
}

function assertApprox(actual, expected, tolerance, msg) {
  if (Math.abs(actual - expected) <= tolerance) {
    passed++;
  } else {
    failed++;
    errors.push(`${msg || 'assertApprox'}: expected ~${expected}, got ${actual} (±${tolerance})`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// BEHAVIOR TREE TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Behavior Tree Tests ---');

// Selector: succeeds on first success
{
  const sel = new Selector('test_sel', [
    new Action('fail1', () => Status.FAILURE),
    new Action('fail2', () => Status.FAILURE),
    new Action('success1', () => Status.SUCCESS),
    new Action('never', () => Status.SUCCESS),
  ]);
  sel.tick(new Blackboard());
  assertEqual(sel.status, Status.SUCCESS, 'Selector succeeds on first success');
  assertEqual(sel._childIndex, 0, 'Selector resets child index after success');
}

// Selector: fails if all children fail
{
  const sel = new Selector('all_fail', [
    new Action('f1', () => Status.FAILURE),
    new Action('f2', () => Status.FAILURE),
  ]);
  sel.tick(new Blackboard());
  assertEqual(sel.status, Status.FAILURE, 'Selector fails if all children fail');
}

// Selector: runs if child is running
{
  const sel = new Selector('running', [
    new Action('r', () => Status.RUNNING),
    new Action('never', () => Status.SUCCESS),
  ]);
  sel.tick(new Blackboard());
  assertEqual(sel.status, Status.RUNNING, 'Selector runs if child is running');
}

// Sequence: succeeds if all children succeed
{
  const seq = new Sequence('all_pass', [
    new Action('s1', () => Status.SUCCESS),
    new Action('s2', () => Status.SUCCESS),
    new Action('s3', () => Status.SUCCESS),
  ]);
  seq.tick(new Blackboard());
  assertEqual(seq.status, Status.SUCCESS, 'Sequence succeeds if all succeed');
}

// Sequence: fails on first failure
{
  const seq = new Sequence('mid_fail', [
    new Action('s1', () => Status.SUCCESS),
    new Action('f1', () => Status.FAILURE),
    new Action('never', () => Status.SUCCESS),
  ]);
  seq.tick(new Blackboard());
  assertEqual(seq.status, Status.FAILURE, 'Sequence fails on first failure');
}

// Sequence: runs if child is running
{
  const seq = new Sequence('seq_running', [
    new Action('s1', () => Status.SUCCESS),
    new Action('r', () => Status.RUNNING),
  ]);
  seq.tick(new Blackboard());
  assertEqual(seq.status, Status.RUNNING, 'Sequence runs if child is running');
  assertEqual(seq._childIndex, 1, 'Sequence resumes from running child');
}

// Sequence: resumes from running child on next tick
{
  let callCount = 0;
  const seq = new Sequence('resume', [
    new Action('s1', () => { callCount++; return Status.SUCCESS; }),
    new Action('r', () => { callCount++; return Status.RUNNING; }),
    new Action('s2', () => { callCount++; return Status.SUCCESS; }),
  ]);
  seq.tick(new Blackboard());
  assertEqual(callCount, 2, 'Sequence calls first two children');
  assertEqual(seq.status, Status.RUNNING, 'Sequence is running');
  assertEqual(seq._childIndex, 1, 'Sequence child index is at running child');
  // On second tick, second child returns RUNNING again, then third child never runs
  // So callCount stays at 4 after two ticks (s1, r, r) — no, s1 doesn't rerun
  // Actually tick 2: resumes from child 1 (running), calls it → RUNNING. Total: 3 calls
  seq.tick(new Blackboard());
  assertEqual(callCount, 3, 'Sequence resumes from running child');
  assertEqual(seq.status, Status.RUNNING, 'Still running since child stays running');
}

// Parallel: require_all
{
  const par = new Parallel('all', [
    new Action('s', () => Status.SUCCESS),
    new Action('s2', () => Status.SUCCESS),
    new Action('f', () => Status.FAILURE),
  ], 'require_all');
  par.tick(new Blackboard());
  assertEqual(par.status, Status.FAILURE, 'Parallel require_all fails if any fails');
}

{
  const par = new Parallel('all2', [
    new Action('s', () => Status.SUCCESS),
    new Action('r', () => Status.RUNNING),
  ], 'require_all');
  par.tick(new Blackboard());
  assertEqual(par.status, Status.RUNNING, 'Parallel require_all runs if no failures and some running');
}

{
  const par = new Parallel('all3', [
    new Action('s', () => Status.SUCCESS),
    new Action('s2', () => Status.SUCCESS),
  ], 'require_all');
  par.tick(new Blackboard());
  assertEqual(par.status, Status.SUCCESS, 'Parallel require_all succeeds if all succeed');
}

// Parallel: require_one
{
  const par = new Parallel('one', [
    new Action('f', () => Status.FAILURE),
    new Action('s', () => Status.SUCCESS),
    new Action('f2', () => Status.FAILURE),
  ], 'require_one');
  par.tick(new Blackboard());
  assertEqual(par.status, Status.SUCCESS, 'Parallel require_one succeeds if any succeeds');
}

{
  const par = new Parallel('one2', [
    new Action('f', () => Status.FAILURE),
    new Action('f2', () => Status.FAILURE),
  ], 'require_one');
  par.tick(new Blackboard());
  assertEqual(par.status, Status.FAILURE, 'Parallel require_one fails if none succeed');
}

// Decorator: inverter
{
  const inv = new Decorator('inv', new Action('s', () => Status.SUCCESS), 'inverter');
  inv.tick(new Blackboard());
  assertEqual(inv.status, Status.FAILURE, 'Inverter: success → failure');
}

{
  const inv = new Decorator('inv2', new Action('f', () => Status.FAILURE), 'inverter');
  inv.tick(new Blackboard());
  assertEqual(inv.status, Status.SUCCESS, 'Inverter: failure → success');
}

// Decorator: succeeder
{
  const succ = new Decorator('succ', new Action('f', () => Status.FAILURE), 'succeeder');
  succ.tick(new Blackboard());
  assertEqual(succ.status, Status.SUCCESS, 'Succeeder always succeeds');
}

// Decorator: repeater with max
{
  let count = 0;
  const rep = new Decorator('rep', new Action('s', () => { count++; return Status.SUCCESS; }), 'repeater', 3);
  // Tick 4 times: 1st tick runs child (count=1, RUNNING), 2nd (count=2, RUNNING), 3rd (count=3, SUCCESS)
  rep.tick(new Blackboard());
  rep.tick(new Blackboard());
  rep.tick(new Blackboard());
  assertEqual(count, 3, 'Repeater stops after max repeats');
  const status = rep.status;
  assertEqual(status, Status.SUCCESS, 'Repeater succeeds after max');
}

// Decorator: until_fail
{
  let n = 0;
  const uf = new Decorator('uf', new Action('uf_child', () => { n++; return n < 3 ? Status.SUCCESS : Status.FAILURE; }), 'until_fail');
  uf.tick(new Blackboard());
  assertEqual(uf.status, Status.RUNNING, 'Until-fail runs while child succeeds');
  uf.tick(new Blackboard());
  assertEqual(uf.status, Status.RUNNING, 'Until-fail continues');
  uf.tick(new Blackboard());
  assertEqual(uf.status, Status.SUCCESS, 'Until-fail succeeds when child fails');
}

// Condition
{
  const cond = new Condition('true', () => true);
  cond.tick(new Blackboard());
  assertEqual(cond.status, Status.SUCCESS, 'Condition returns success when check is true');
}

{
  const cond = new Condition('false', () => false);
  cond.tick(new Blackboard());
  assertEqual(cond.status, Status.FAILURE, 'Condition returns failure when check is false');
}

// Condition with blackboard
{
  const bb = new Blackboard();
  bb.set('health', 5);
  const cond = new Condition('low_health', (b) => b.get('health') < 10);
  cond.tick(bb);
  assertEqual(cond.status, Status.SUCCESS, 'Condition reads from blackboard');
}

// Action that throws
{
  const act = new Action('throw', () => { throw new Error('oops'); });
  act.tick(new Blackboard());
  assertEqual(act.status, Status.FAILURE, 'Action catches thrown errors as failure');
}

// Blackboard
{
  const bb = new Blackboard();
  bb.set('x', 42);
  assertEqual(bb.get('x'), 42, 'Blackboard set/get');
  assert(bb.has('x'), 'Blackboard has');
  bb.delete('x');
  assert(!bb.has('x'), 'Blackboard delete');
  bb.set('a', 1); bb.set('b', 2);
  const snap = bb.snapshot();
  assertEqual(snap.a, 1, 'Blackboard snapshot');
  bb.clear();
  assertEqual(bb.get('a'), undefined, 'Blackboard clear');
}

// BehaviorTree wrapper
{
  const tree = new BehaviorTree(
    new Selector('root', [new Action('s', () => Status.SUCCESS)]),
    new Blackboard()
  );
  const status = tree.tick();
  assertEqual(status, Status.SUCCESS, 'BehaviorTree tick returns status');
  assertEqual(tree.tickCount, 1, 'BehaviorTree increments tick count');
  assert(tree.getLog().length > 0, 'BehaviorTree logs ticks');
  tree.clearLog();
  assertEqual(tree.getLog().length, 0, 'BehaviorTree clears log');
  tree.reset();
  assertEqual(tree.tickCount, 0, 'BehaviorTree reset clears tick count');
}

// BehaviorTree print
{
  const tree = new BehaviorTree(
    new Selector('root', [
      new Condition('c', () => false),
      new Action('a', () => Status.RUNNING),
    ])
  );
  tree.tick();
  const printed = tree.print();
  assert(printed.includes('RUNNING'), 'BehaviorTree print shows running state');
}

// ═════════════════════════════════════════════════════════════════════════════
// HUMANIZER TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Humanizer Tests ---');

{
  const h = new Humanizer();
  const d = h.delay(200);
  assert(d >= 30, `Humanizer delay minimum floor (${d})`);
  assert(d < 500, `Humanizer delay not unreasonably high (${d})`);
}

{
  const h = new Humanizer();
  const urgent = h.reactionTime(true);
  const casual = h.reactionTime(false);
  assert(urgent < casual, `Urgent (${urgent}) should be faster than casual (${casual})`);
  assert(urgent >= 30, `Urgent reaction time floor (${urgent})`);
}

{
  const h = new Humanizer();
  let fails = 0;
  for (let i = 0; i < 1000; i++) {
    if (h.shouldFail(0.03, 0)) fails++;
  }
  assertApprox(fails, 30, 15, 'Humanizer failure rate ~3%');
}

{
  const h = new Humanizer();
  h.updateFatigue(10);
  let fails = 0;
  for (let i = 0; i < 1000; i++) {
    if (h.shouldFail(0.03, h._fatigue)) fails++;
  }
  assertApprox(h._fatigue, 0.4, 0.05, 'Fatigue after 10 hours');
  assert(fails > 30, 'Fatigue increases failure rate');
}

{
  const h = new Humanizer();
  const ms = h.wait(50);
  assert(ms instanceof Promise, 'Humanizer wait returns a promise');
}

// ═════════════════════════════════════════════════════════════════════════════
// PERSONALITY TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Personality Tests ---');

{
  const p = new Personality();
  assertApprox(p.traits.patience, 0.8, 0.01, 'Default patience trait');
  assertApprox(p.traits.superstitious, 0.8, 0.01, 'Default superstitious trait');
}

{
  const m = new Mood();
  m.update({ type: 'caught_fish', value: 0.5 });
  assert(m.satisfaction > 0.6, 'Mood: caught fish increases satisfaction');
  assert(m.frustration < 0.1, 'Mood: caught fish reduces frustration');
}

{
  const m = new Mood();
  m.update({ type: 'lost_fish' });
  assert(m.frustration > 0.2, 'Mood: lost fish increases frustration');
}

{
  const m = new Mood();
  m.update({ type: 'lost_gear' });
  assert(m.frustration > 0.3, 'Mood: lost gear increases frustration significantly');
}

{
  const m = new Mood();
  for (let i = 0; i < 100; i++) m.update({ type: 'time_passes' });
  assert(m.energy < 0.6, 'Mood: time passes decays energy');
}

{
  const m = new Mood();
  m.update({ type: 'good_sale', value: 0.5 });
  assert(m.satisfaction > 0.6, 'Mood: good sale increases satisfaction');
}

{
  const m = new Mood();
  m.update({ type: 'player_helped' });
  assert(m.social > 0.5, 'Mood: helping increases social');
}

{
  const m = new Mood();
  m.frustration = 0.8;
  m.update({ type: 'caught_fish', value: 0.3 });
  assert(m.frustration < 0.5, 'Mood: catching fish halves frustration');
}

{
  const m = new Mood();
  m.update({ type: 'weather_storm' });
  assert(m.frustration > 0.3, 'Mood: storm increases frustration');
}

{
  const p = new Personality();
  p.mood.frustration = 0.8;
  const greeting = p.getGreeting('TestPlayer');
  assert(typeof greeting === 'string' && greeting.length > 0, 'Greeting returns string');
  assert(greeting !== 'GREETING_BUG', 'Greeting is valid');
}

{
  const p = new Personality();
  p.mood.satisfaction = 0.9;
  const greeting = p.getGreeting('TestPlayer');
  assert(typeof greeting === 'string' && greeting.length > 0, 'Satisfied greeting works');
}

{
  const p = new Personality();
  const rel = { familiarity: 0.1, trust: 0.2, tag: 'new kid' };
  const greeting = p.getGreeting('Newbie', rel);
  assert(typeof greeting === 'string', 'Greeting with low familiarity works');
}

{
  const p = new Personality();
  const rel = { familiarity: 0.8, trust: 0.8, tag: 'fishing buddy' };
  const greeting = p.getGreeting('Buddy', rel);
  assert(typeof greeting === 'string', 'Greeting with high trust works');
}

{
  const p = new Personality();
  const resp = p.getResponse('caught_fish', { weight: 25 });
  assert(typeof resp === 'string' && resp.length > 0, 'Response for caught big fish');
}

{
  const p = new Personality();
  const resp = p.getResponse('weather', { weatherType: 'clear' });
  assert(typeof resp === 'string', 'Response for weather');
}

{
  const p = new Personality();
  const resp = p.getResponse('tip');
  assert(typeof resp === 'string' && resp.length > 5, 'Response for tip');
}

{
  const p = new Personality();
  const resp = p.getResponse('opinion', { subject: 'pink hoochies' });
  assert(typeof resp === 'string', 'Response for opinion');
}

{
  const p = new Personality();
  const resp = p.getResponse('no_bites');
  assert(typeof resp === 'string', 'Response for no bites');
}

{
  const p = new Personality();
  let talks = 0;
  for (let i = 0; i < 100; i++) {
    if (p.wantsToTalk()) talks++;
  }
  assert(talks > 0 && talks < 100, `Wants to talk occasionally (${talks}%)`);
}

{
  const p = new Personality();
  const pat = p.patienceLevel();
  assert(pat > 0.5, 'Patience level reasonable');
  p.mood.frustration = 0.9;
  const pat2 = p.patienceLevel();
  assert(pat2 < pat, 'Frustration reduces patience');
}

{
  const p = new Personality();
  const d = p.shouldGoFishing({ weatherType: 'clear', seaState: 1 });
  assert(d.go === true, 'Should fish in clear weather');
}

{
  const p = new Personality();
  const d = p.shouldGoFishing({ weatherType: 'storm', seaState: 5 });
  assert(d.go === false, 'Should not fish in storm');
}

{
  const p = new Personality();
  p.mood.energy = 0.1;
  const d = p.shouldGoFishing({ weatherType: 'clear', seaState: 0 });
  assert(d.go === false, 'Too tired to fish');
}

{
  const p = new Personality();
  const d = p.shouldGoFishing({ weatherType: 'heavy_rain', seaState: 3 });
  // Stubbornness is 0.7, threshold is 0.5 → should go
  assert(d.go === true, 'Goes fishing in rain due to stubbornness');
}

{
  const p = new Personality();
  const json = p.toJSON();
  assert(json.traits.stubbornness === 0.7, 'Personality JSON serialization');
  assert(json.mood.energy !== undefined, 'Mood in JSON');
}

{
  const p = new Personality();
  p.fromJSON({ traits: { stubbornness: 0.9 }, mood: { energy: 0.3, satisfaction: 0.2, frustration: 0.8, social: 0.1 } });
  assertEqual(p.traits.stubbornness, 0.9, 'Personality fromJSON updates traits');
  assertApprox(p.mood.energy, 0.3, 0.01, 'Personality fromJSON updates mood');
}

// ═════════════════════════════════════════════════════════════════════════════
// MEMORY TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Memory Tests ---');

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addEpisode({ type: 'test', data: { x: 1 } });
  assertEqual(mem.episodes.length, 1, 'Memory adds episode');
  assertEqual(mem.episodes[0].type, 'test', 'Episode has type');
  assert(mem.episodes[0].timestamp > 0, 'Episode has timestamp');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addEpisode({ type: 'a' });
  mem.addEpisode({ type: 'b' });
  mem.addEpisode({ type: 'a' });
  const results = mem.queryEpisodes({ type: 'a' });
  assertEqual(results.length, 2, 'Query episodes by type');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  const now = Date.now();
  mem.addEpisode({ type: 'old', data: { t: 'old' } });
  // Simulate old episode
  mem.episodes[0].timestamp = now - 100000;
  mem.addEpisode({ type: 'new', data: { t: 'new' } });
  mem.episodes[1].timestamp = now;
  const results = mem.queryEpisodes({ since: now - 1000 });
  assertEqual(results.length, 1, 'Query episodes since time');
  assertEqual(results[0].data.t, 'new', 'Returns correct episode');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addEpisode({ type: 'fishing', tags: ['salmon', 'good'] });
  mem.addEpisode({ type: 'fishing', tags: ['halibut', 'good'] });
  mem.addEpisode({ type: 'fishing', tags: ['salmon'] });
  const results = mem.queryEpisodes({ tags: ['salmon'] });
  assertEqual(results.length, 2, 'Query episodes by tag');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  for (let i = 0; i < 5; i++) mem.addEpisode({ type: 'test' });
  const recent = mem.recent(3);
  assertEqual(recent.length, 3, 'Recent returns last N');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addRule({ rule: 'kings bite on outgoing tide', confidence: 0.7 });
  assertEqual(mem.rules.length, 1, 'Memory adds rule');
  assertEqual(mem.rules[0].confidence, 0.7, 'Rule has confidence');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addRule({ rule: 'test rule', confidence: 0.5 });
  mem.addRule({ rule: 'test rule', confidence: 0.9 });
  assertEqual(mem.rules.length, 1, 'Duplicate rules merge');
  assert(mem.rules[0].confidence > 0.5, 'Merged confidence increases');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addRule({ rule: 'high conf', confidence: 0.9 });
  mem.addRule({ rule: 'low conf', confidence: 0.3 });
  const results = mem.queryRules({ minConfidence: 0.7 });
  assertEqual(results.length, 1, 'Query rules by min confidence');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addRule({ rule: 'salmon like outgoing tide', confidence: 0.7, tags: ['salmon'] });
  mem.addRule({ rule: 'halibut like deep water', confidence: 0.8, tags: ['halibut'] });
  const results = mem.queryRules({ tags: ['salmon'] });
  assertEqual(results.length, 1, 'Query rules by tag');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.addRule({ rule: 'fish near kelp', confidence: 0.5 });
  mem.reinforceRule('fish near kelp');
  assert(mem.rules[0].confidence > 0.5, 'Reinforce increases confidence');
  assertEqual(mem.rules[0].reinforced, 1, 'Reinforced count');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.updateWorking({ task: 'fishing', fishCount: 3 });
  const w = mem.getWorking();
  assertEqual(w.task, 'fishing', 'Working memory set');
  assertEqual(w.fishCount, 3, 'Working memory get');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  mem.updateWorking({ task: 'fishing', fishCount: 5 });
  mem.resetSession();
  const w = mem.getWorking();
  assertEqual(w.task, null, 'Session reset clears working memory');
  assertEqual(w.fishCount, 0, 'Session reset clears fish count');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  // Add some catch episodes for rule extraction
  const now = Date.now();
  for (let i = 0; i < 4; i++) {
    mem.addEpisode({
      type: 'caught_fish',
      data: { species: 'salmon', location: 'bio_island', tide: 'outgoing', weight: 20 },
      tags: ['fishing', 'success'],
    });
    mem.episodes[mem.episodes.length - 1].timestamp = now;
  }
  mem.extractRulesFromEpisodes();
  assert(mem.rules.length > 0, 'Extracts rules from episodes');
}

{
  const mem = new Memory('./test-data/memory-' + Date.now());
  // Test save/load
  mem.addEpisode({ type: 'persist_test' });
  mem.addRule({ rule: 'persist rule', confidence: 0.5 });
  mem.save();

  const mem2 = new Memory(mem.dataDir);
  assertEqual(mem2.episodes.length, 1, 'Memory persists episodes');
  assertEqual(mem2.rules.length, 1, 'Memory persists rules');
}

// ═════════════════════════════════════════════════════════════════════════════
// RELATIONSHIPS TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Relationships Tests ---');

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  const p = rel.get('TestPlayer');
  assertEqual(p.tag, 'new kid', 'New player gets default tag');
  assert(p.firstMet !== null, 'New player has firstMet timestamp');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  rel.interact('Alice', 'chat');
  rel.interact('Alice', 'chat');
  rel.interact('Alice', 'friendly');
  assert(rel.get('Alice').familiarity > 0, 'Chat increases familiarity');
  assert(rel.get('Alice').trust >= 0.3, 'Chat maintains trust baseline');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  rel.interact('Bob', 'gave_gift');
  const r = rel.get('Bob');
  assert(r.trust > 0.3, 'Gift increases trust');
  assert(r.familiarity > 0, 'Gift increases familiarity');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  rel.interact('Thief', 'stole_spot', { location: 'bio_island' });
  const r = rel.get('Thief');
  assert(r.trust < 0.3, 'Stealing spot decreases trust');
  assertEqual(r.tag, 'spot thief', 'Spot stealer tagged correctly');
  assert(r.notes.length > 0, 'Spot theft recorded in notes');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  // Build up trust then share catch
  for (let i = 0; i < 20; i++) rel.interact('Buddy', 'fished_together');
  rel.interact('Buddy', 'shared_catch');
  const r = rel.get('Buddy');
  assert(r.trust > 0.5, 'Fishing together builds trust');
  assert(r.tag === 'fishing buddy', 'Shared catch promotes to buddy');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  assert(!rel.wouldShare('Newbie', 'secret_spots'), "Won't share secret spots with new player");
  assert(rel.wouldShare('Newbie', 'casual_chat'), 'Will casual chat with anyone');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  for (let i = 0; i < 20; i++) rel.interact('Trusted', 'gave_gift');
  assert(rel.wouldShare('Trusted', 'good_spots'), 'Shares spots with high trust');
  assert(rel.wouldShare('Trusted', 'secret_spots'), 'Shares secret spots with very high trust');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  rel.interact('A', 'chat');
  rel.interact('B', 'gave_gift');
  const all = rel.getAll();
  assert(all.length === 2, 'getAll returns all players');
  // B should be higher familiarity due to gift
  assert(all[0].name === 'B', 'getAll sorts by familiarity');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  for (let i = 0; i < 5; i++) rel.interact('Decayer', 'chat');
  const before = rel.get('Decayer').familiarity;
  rel.decay();
  const after = rel.get('Decayer').familiarity;
  assert(after < before, 'Familiarity decays over time');
}

{
  const rel = new Relationships('./test-data/rel-' + Date.now());
  rel.interact('Persist', 'gave_gift');
  rel.save();
  const rel2 = new Relationships(rel.dataDir);
  assertEqual(rel2.get('Persist').trust, rel.get('Persist').trust, 'Relationships persist trust');
}

// ═════════════════════════════════════════════════════════════════════════════
// SKILL LIBRARY TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Skill Library Tests ---');

{
  const lib = new SkillLibrary();
  const skills = lib.getAll();
  assertEqual(skills.length, 3, 'Default skills loaded');
  assert(skills.find(s => s.name === 'troll-salmon'), 'troll-salmon skill exists');
  assert(skills.find(s => s.name === 'bottom-fish-halibut'), 'bottom-fish-halibut skill exists');
  assert(skills.find(s => s.name === 'sport-fish-from-shore'), 'sport-fish-from-shore skill exists');
}

{
  const lib = new SkillLibrary();
  const skill = lib.get('troll-salmon');
  assert(skill !== null, 'Get skill by name');
  assertEqual(skill.name, 'troll-salmon', 'Got correct skill');
}

{
  const lib = new SkillLibrary();
  assert(lib.get('nonexistent') === null, 'Get nonexistent returns null');
}

{
  const lib = new SkillLibrary();
  lib.register({
    name: 'custom-skill',
    description: 'test',
    requirements: {},
    successRate: 0.5,
    execute: async () => ({ success: true }),
  });
  assertEqual(lib.getAll().length, 4, 'Register adds skill');
}

{
  const lib = new SkillLibrary();
  const matching = lib.findMatching({ hasBoat: true });
  assert(matching.length >= 2, 'Find matching with boat requirement');
  const noBoat = lib.findMatching({ hasBoat: false });
  assert(noBoat.length >= 1, 'Find matching without boat');
}

{
  const lib = new SkillLibrary();
  const result = lib.execute('troll-salmon', {}, { chat: () => {} });
  // Returns a promise
  assert(result instanceof Promise, 'Execute returns promise');
}

{
  const lib = new SkillLibrary();
  const analysis = lib.analyzeSession({
    skillName: 'troll-salmon',
    duration: 3600, // 1 hour
    catch: 8,
    targetCatch: 10,
    conditions: { weather: 'clear', tide: 'outgoing' },
  });
  assert(['good', 'excellent'].includes(analysis.rating), 'Session analysis rates good session');
}

{
  const lib = new SkillLibrary();
  const analysis = lib.analyzeSession({
    skillName: 'troll-salmon',
    duration: 3600,
    catch: 0,
    targetCatch: 10,
    conditions: { weather: 'storm', tide: 'slack' },
  });
  assertEqual(analysis.rating, 'poor', 'Session analysis rates poor session');
  assert(analysis.suggestions.length > 0, 'Poor session has suggestions');
}

{
  const lib = new SkillLibrary();
  try {
    await lib.execute('nonexistent', {}, {});
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('Unknown skill'), 'Execute throws for unknown skill');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SCHEDULE TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Schedule Tests ---');

{
  const sched = new DailySchedule();
  const block = sched.getCurrentBlock(6.0);
  assertEqual(block.action, 'check_radio', '6am = check radio');
}

{
  const sched = new DailySchedule();
  const block = sched.getCurrentBlock(7.5);
  assertEqual(block.action, 'go_fishing', '7:30am = go fishing');
}

{
  const sched = new DailySchedule();
  const block = sched.getCurrentBlock(17.5);
  assertEqual(block.action, 'visit_ernies', '5:30pm = visit Ernie\'s');
}

{
  const sched = new DailySchedule();
  const block = sched.getCurrentBlock(22.0);
  assertEqual(block.action, 'sleep', '10pm = sleep');
}

{
  const sched = new DailySchedule();
  const block = sched.getCurrentBlock(2.0);
  assertEqual(block.action, 'sleep', '2am = sleep');
}

{
  const sched = new DailySchedule();
  sched.applyWeather('storm');
  assert(sched.delayMinutes > 0, 'Storm adds delay');
  assert(sched.skipFishing, 'Storm cancels fishing');
}

{
  const sched = new DailySchedule();
  sched.applyWeather('rain');
  assert(sched.delayMinutes > 0, 'Rain adds small delay');
  assert(!sched.skipFishing, 'Rain doesn\'t cancel fishing');
}

{
  const sched = new DailySchedule();
  sched.applyWeather('storm');
  const block = sched.getCurrentBlock(10.0);
  assertEqual(block.action, 'visit_ernies', 'Cancelled fishing goes to Ernie\'s');
}

{
  const sched = new DailySchedule();
  sched.resetDay();
  assertEqual(sched.delayMinutes, 0, 'Reset clears delay');
  assert(!sched.skipFishing, 'Reset clears skip fishing');
}

{
  const sched = new DailySchedule();
  const summary = sched.getSummary();
  assert(summary.includes('Cody'), 'Summary has name');
}

// ═════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('--- Integration Tests ---');

// Full tick cycle through behavior tree
{
  const bb = new Blackboard();
  bb.set('health', 20);
  bb.set('gameHour', 10); // 10am = fishing time
  bb.set('isStorm', false);

  const tree = new BehaviorTree(
    new Selector('root', [
      new Sequence('danger', [
        new Condition('storm', (b) => b.get('isStorm')),
        new Action('flee', () => Status.SUCCESS),
      ]),
      new Sequence('fish', [
        new Condition('daytime', (b) => { const h = b.get('gameHour'); return h >= 7 && h < 16; }),
        new Action('cast', () => {
          bb.set('fishing', true);
          return Status.RUNNING;
        }),
      ]),
      new Action('idle', () => {
        bb.set('idle', true);
        return Status.RUNNING;
      }),
    ]),
    bb
  );

  // Tick a few times
  for (let i = 0; i < 10; i++) tree.tick();
  assertEqual(tree.tickCount, 10, 'Integration: 10 ticks');
  assert(bb.get('fishing'), 'Integration: entered fishing action');
  assert(!bb.get('idle'), 'Integration: did not enter idle');
}

// Personality + Memory integration
{
  const p = new Personality();
  const mem = new Memory('./test-data/integ-' + Date.now());

  // Simulate a fishing session
  mem.resetSession();
  mem.updateWorking({ task: 'fishing', fishCount: 0 });

  // Catch a fish
  p.mood.update({ type: 'caught_fish', value: 0.3 });
  mem.addEpisode({ type: 'caught_fish', data: { species: 'king_salmon', weight: 28, location: 'bio_island' }, tags: ['fishing'] });
  mem.updateWorking({ fishCount: 1 });

  // Lose a fish
  p.mood.update({ type: 'lost_fish' });
  mem.addEpisode({ type: 'lost_fish', data: { reason: 'line_snapped' }, tags: ['fishing'] });

  // Player interaction
  const rels = new Relationships('./test-data/integ-rel-' + Date.now());
  rels.interact('Player1', 'chat');
  rels.interact('Player1', 'fished_together');
  rels.interact('Player1', 'shared_catch');
  mem.updateWorking({ interactions: 3 });

  assert(mem.working.fishCount === 1, 'Integration: fish count tracked');
  assert(p.mood.frustration > 0.1, 'Integration: frustration from lost fish');
  assert(p.mood.satisfaction > 0.5, 'Integration: satisfaction from caught fish');
  assert(rels.get('Player1').familiarity > 0.05, 'Integration: familiarity from interactions');
}

// Behavior tree with blackboard-driven conditions
{
  const bb = new Blackboard();

  const tree = new BehaviorTree(
    new Selector('root', [
      new Sequence('greet', [
        new Condition('has_visitor', (b) => b.get('visitor') !== undefined),
        new Action('wave', () => { bb.set('greeted', true); return Status.SUCCESS; }),
      ]),
      new Action('wait', () => Status.RUNNING),
    ]),
    bb
  );

  // No visitor — waits
  tree.tick();
  assert(!bb.get('greeted'), 'No greet without visitor');

  // Visitor arrives
  bb.set('visitor', 'Alice');
  tree.reset();
  tree.tick();
  assert(bb.get('greeted'), 'Greets when visitor present');
}

// ═════════════════════════════════════════════════════════════════════════════
// RESULTS
// ═════════════════════════════════════════════════════════════════════════════

console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══`);
if (errors.length > 0) {
  console.log('FAILURES:');
  for (const e of errors) console.log(`  ✗ ${e}`);
}

process.exit(failed > 0 ? 1 : 0);
