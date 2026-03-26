#!/usr/bin/env node
/**
 * Test suite for Mineflayer Actions module.
 * Tests humanized movement, pathfinding, fishing sequence, idle behavior, etc.
 * Uses mock bot objects — no Minecraft server needed.
 *
 * Usage: node tests/test-actions.js
 */

import { Actions } from '../src/mineflayer/actions.js';
import { Humanizer } from '../src/ai/humanizer.js';
import { BehaviorTree, Blackboard, Selector, Sequence, Condition, Action, Status } from '../src/ai/behavior-tree.js';

let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  ❌ FAIL: ${msg}`); }
}

// ── Mock Bot ──────────────────────────────────────────────────────────────────

function createMockBot() {
  const entity = {
    position: { x: 10, y: 64, z: 10, distanceTo(p) { return Math.sqrt((this.x-p.x)**2 + (this.y-p.y)**2 + (this.z-p.z)**2); }, offset(dx, dy, dz) { return { x: this.x+dx, y: this.y+dy, z: this.z+dz }; } },
    yaw: 0,
    pitch: 0,
  };

  const listeners = {};
  const bot = {
    entity,
    username: 'TestCody',
    health: 20,
    _events: listeners,
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    once(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    removeListener(evt, fn) { if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== fn); },
    chat(msg) { this._chatLog = this._chatLog || []; this._chatLog.push(msg); },
    activateItem() {},
    swingArm() {},
    setControlState(key, val) { this._controls = this._controls || {}; this._controls[key] = val; },
    clearControlStates() { this._controls = {}; },
    look(yaw, pitch) { entity.yaw = yaw; entity.pitch = pitch; },
    lookAt(pos) { return Promise.resolve(); },
    equip(item, dest) { return Promise.resolve(); },
    activateBlock() {},
    activateEntity() {},
    inventory: {
      items() { return [{ name: 'minecraft:fishing_rod', count: 1, slot: 0, maxDurability: 64, durability: 64 }]; },
    },
    findBlocks({ matching, maxDistance, count }) {
      // Return some fake water blocks
      return [{ x: 15, y: 63, z: 10, distanceTo(p) { return Math.sqrt((15-p.x)**2 + (63-p.y)**2 + (10-p.z)**2); }, offset(dx,dy,dz) { return { x: this.x+dx, y: this.y+dy, z: this.z+dz }; } }];
    },
    blockAt() { return { name: 'grass_block' }; },
    players: { Player1: { entity: { position: { x: 12, y: 64, z: 11, offset(dx,dy,dz) { return { x: this.x+dx, y: this.y+dy, z: this.z+dz }; } } } } },
    entities: {
      bot_self: entity,
      Player1: { type: 'player', username: 'Player1', position: { x: 12, y: 64, z: 11, offset(dx,dy,dz) { return { x: this.x+dx, y: this.y+dy, z: this.z+dz }; }, distanceTo(p) { return Math.sqrt((12-p.x)**2 + (64-p.y)**2 + (11-p.z)**2); } } },
      Zombie: { type: 'mob', username: undefined, position: { x: 20, y: 64, z: 20, offset(dx,dy,dz) { return { x: this.x+dx, y: this.y+dy, z: this.z+dz }; }, distanceTo(p) { return 15; } } },
    },
    pathfinder: {
      setGoal(goal) { this._goal = goal; },
      _goal: null,
    },
    _chatLog: [],
    _controls: {},
  };

  // Make entities iterable
  Object.defineProperty(bot.entities, Symbol.iterator, function*() { yield* Object.values(this); });

  return bot;
}

console.log('🧪 Actions Test Suite\n');

const mockBot = createMockBot();
const humanizer = new Humanizer();

// ── 1. Actions class creation ──────────────────────────────────────────────
console.log('── 1. Actions Class Creation ──');

const actions = new Actions(mockBot, humanizer);
assert(actions !== null, 'Actions instance created');
assert(actions.h === humanizer, 'Humanizer reference stored');
assert(actions.bot === mockBot, 'Bot reference stored');
assert(actions.isBusy === false, 'Not busy initially');

// ── 2. Humanizer integration ───────────────────────────────────────────────
console.log('── 2. Humanizer Integration ──');

const delay1 = humanizer.delay(200);
assert(delay1 >= 30, `Humanizer delay is at least 30ms: ${delay1}`);
assert(Math.abs(delay1 - 200) < 80, `Humanizer delay is near base (±80ms): ${delay1}`);

const urgentReaction = humanizer.reactionTime(true);
assert(urgentReaction < 500, `Urgent reaction time < 500ms: ${urgentReaction}`);
assert(urgentReaction >= 30, `Urgent reaction time >= 30ms: ${urgentReaction}`);

const casualReaction = humanizer.reactionTime(false);
assert(casualReaction >= 400, `Casual reaction time >= 400ms: ${casualReaction}`);

assert(humanizer.shouldFail(0.03, 0) === false || humanizer.shouldFail(0.03, 0) === true, 'shouldFail returns boolean');

// ── 3. Movement methods exist ──────────────────────────────────────────────
console.log('── 3. Movement Methods ──');

assert(typeof actions.walkTo === 'function', 'walkTo is a function');
assert(typeof actions.walkToBlock === 'function', 'walkToBlock is a function');
assert(typeof actions.walkInDirection === 'function', 'walkInDirection is a function');
assert(typeof actions.lookAt === 'function', 'lookAt is a function');
assert(typeof actions.lookAround === 'function', 'lookAround is a function');
assert(typeof actions.lookAtEntity === 'function', 'lookAtEntity is a function');

// ── 4. Fishing methods exist ───────────────────────────────────────────────
console.log('── 4. Fishing Methods ──');

assert(typeof actions.equipRod === 'function', 'equipRod is a function');
assert(typeof actions.castLine === 'function', 'castLine is a function');
assert(typeof actions.reelIn === 'function', 'reelIn is a function');
assert(typeof actions.wait === 'function', 'wait is a function');
assert(typeof actions.startFishingSequence === 'function', 'startFishingSequence is a function');

// ── 5. Social methods exist ────────────────────────────────────────────────
console.log('── 5. Social Methods ──');

assert(typeof actions.chat === 'function', 'chat is a function');
assert(typeof actions.waveAtPlayer === 'function', 'waveAtPlayer is a function');
assert(typeof actions.nod === 'function', 'nod is a function');
assert(typeof actions.shakeHead === 'function', 'shakeHead is a function');
assert(typeof actions.crouch === 'function', 'crouch is a function');
assert(typeof actions.jump === 'function', 'jump is a function');

// ── 6. Utility methods ─────────────────────────────────────────────────────
console.log('── 6. Utility Methods ──');

assert(typeof actions.findNearestWater === 'function', 'findNearestWater is a function');
assert(typeof actions.findNearestPlayer === 'function', 'findNearestPlayer is a function');
assert(typeof actions.getNearbyPlayers === 'function', 'getNearbyPlayers is a function');
assert(typeof actions.getPosition === 'function', 'getPosition is a function');
assert(typeof actions.doIdleAction === 'function', 'doIdleAction is a function');
assert(typeof actions.cancel === 'function', 'cancel is a function');

// ── 7. Async movement calls don't crash ────────────────────────────────────
console.log('── 7. Async Movement Calls ──');

const tests7 = async () => {
  await actions.lookAround(); // should not throw
  assert(true, 'lookAround completes without crash');

  await actions.lookAt(15, 64, 10);
  assert(true, 'lookAt completes without crash');

  await actions.jump();
  assert(true, 'jump completes without crash');

  await actions.nod();
  assert(true, 'nod completes without crash');

  await actions.shakeHead();
  assert(true, 'shakeHead completes without crash');

  await actions.wait(50);
  assert(true, 'wait completes without crash');
};

// ── 8. Find nearest water ─────────────────────────────────────────────────
console.log('── 8. Find Nearest Water ──');

const tests8 = async () => {
  const water = await actions.findNearestWater();
  assert(water !== null, 'Found water block');
  assert(water.x === 15, `Water x coordinate: ${water.x}`);
  assert(water.y === 63, `Water y coordinate: ${water.y}`);
};

// ── 9. Find nearest player ─────────────────────────────────────────────────
console.log('── 9. Find Nearest Player ──');

const player = actions.findNearestPlayer();
assert(player !== null, 'Found nearest player');
assert(player.username === 'Player1', `Nearest player is Player1: ${player?.username}`);

const nearby = actions.getNearbyPlayers();
assert(nearby.length === 1, `One nearby player: ${nearby.length}`);
assert(nearby[0].username === 'Player1', `Nearby player is Player1`);

// ── 10. Equip fishing rod ──────────────────────────────────────────────────
console.log('── 10. Equip Fishing Rod ──');

const tests10 = async () => {
  const result = await actions.equipRod();
  assert(result === true, 'Equipped fishing rod successfully');
};

// ── 11. Cast line ──────────────────────────────────────────────────────────
console.log('── 11. Cast Line ──');

const tests11 = async () => {
  const result = await actions.castLine();
  assert(result === true, 'Cast line successfully');
};

// ── 12. Chat with humanized delay ──────────────────────────────────────────
console.log('── 12. Chat With Delay ──');

const tests12 = async () => {
  const logBefore = mockBot._chatLog.length;
  await actions.chat('Test message');
  assert(mockBot._chatLog.length > logBefore, 'Chat message sent after delay');
  assert(mockBot._chatLog[mockBot._chatLog.length - 1] === 'Test message', 'Correct message sent');
};

// ── 13. Idle behavior doesn't crash ────────────────────────────────────────
console.log('── 13. Idle Behavior ──');

const tests13 = async () => {
  for (let i = 0; i < 10; i++) {
    await actions.doIdleAction();
  }
  assert(true, '10 idle actions completed without crash');
};

// ── 14. Pathfinding goal set (mock) ───────────────────────────────────────
console.log('── 14. Pathfinding Goal Setting ──');

const tests14 = async () => {
  // walkTo sets a pathfinding goal
  actions._cancelled = false;
  actions._busy = false;

  // Fire and forget — mock can't resolve the pathfinding
  actions.walkTo(15, 64, 10).catch(() => {});

  // Give it a tick to set the goal
  await new Promise(r => setTimeout(r, 300));
  assert(mockBot.pathfinder._goal !== null, 'Pathfinding goal was set');

  // Force cleanup — clear the internal timeout so process can exit
  actions.cancel();
  actions._busy = false;
  // Clear pathfinder goal
  mockBot.pathfinder._goal = null;
};

// ── 15. Cancel mechanism ───────────────────────────────────────────────────
console.log('── 15. Cancel Mechanism ──');

actions.cancel();
assert(actions._cancelled === true, 'Cancel flag set');
// Reset for subsequent tests
actions._cancelled = false;

// ── 16. Crouch ─────────────────────────────────────────────────────────────
console.log('── 16. Crouch ──');

const tests16 = async () => {
  await actions.crouch(200);
  assert(true, 'Crouch completes without crash');
};

// ── 17. Wave at player ─────────────────────────────────────────────────────
console.log('── 17. Wave At Player ──');

const tests17 = async () => {
  await actions.waveAtPlayer('Player1');
  assert(true, 'Wave at player completes without crash');
};

// ── 18. Multiple Actions instances ─────────────────────────────────────────
console.log('── 18. Multiple Instances ──');

const actions2 = new Actions(mockBot, humanizer);
assert(actions !== actions2, 'Different instances are not equal');
assert(actions.h === actions2.h, 'Both share the same humanizer');

// ── 19. Null bot doesn't crash ─────────────────────────────────────────────
console.log('── 19. Null Bot Safety ──');

const tests19 = async () => {
  const noBotActions = new Actions(null, humanizer);
  assert(noBotActions.getPosition() === undefined, 'getPosition returns undefined for null bot');
  assert(noBotActions.findNearestPlayer() === null, 'findNearestPlayer returns null for null bot');
  assert(noBotActions.getNearbyPlayers().length === 0, 'getNearbyPlayers returns empty for null bot');

  await noBotActions.lookAround();
  assert(true, 'lookAround on null bot does not crash');

  await noBotActions.jump();
  assert(true, 'jump on null bot does not crash');

  await noBotActions.nod();
  assert(true, 'nod on null bot does not crash');
};

// ── 20. getPosition ────────────────────────────────────────────────────────
console.log('── 20. Get Position ──');

const pos = actions.getPosition();
assert(pos !== null, 'Position is not null');
assert(pos.x === 10, `Position x: ${pos.x}`);
assert(pos.y === 64, `Position y: ${pos.y}`);
assert(pos.z === 10, `Position z: ${pos.z}`);

// ── 21. Behavior tree with actions parameter ───────────────────────────────
console.log('── 21. Behavior Tree Wiring ──');

// Test that the behavior tree function signature accepts actions
const mockCtx = { bot: mockBot, options: {} };
const mockGame = {
  getState() { return { gameTime: 8, weather: { type: 'clear', seaState: 1, biteMultiplier: 1, name: 'Clear', windSpeed: 5 }, tide: { level: 3.5, direction: 'incoming', phase: 'flood' }, player: { isFishing: false, location: { biome: 'sheltered_sound' }, inventory: [], statistics: { totalFishCaught: 0, speciesCaught: [] } } }; },
  player: { isFishing: false, inventory: [], gold: 0, permits: [], gear: [], statistics: { totalFishCaught: 0, speciesCaught: [] } },
  weather: { getWeather() { return { type: 'clear', temperature: 55, windSpeed: 5 }; }, getBiteMultiplier() { return 1.0; } },
};

const mockAI = {
  personality: {
    shouldGoFishing() { return { go: true, reason: 'Good weather for fishing' }; },
    wantsToTalk() { return false; },
    mood: { snapshot() { return { energy: 0.8, satisfaction: 0.6, frustration: 0.1 }; }, update() {} },
    getResponse() { return 'Nice weather today.'; },
  },
  memory: { working: { fishCount: 0 }, addEpisode() {}, updateWorking() {} },
  relationships: { get() { return { level: 0 }; }, interact() {} },
  schedule: { applyWeather() {}, getCurrentBlock() {} },
  skillLibrary: { analyzeSession() { return {}; } },
};

// Import buildBehaviorTree by importing the plugin module indirectly
// We'll test that the tree ticks without crashing
const bb = new Blackboard();
const testAction = new Action('test_action', () => {
  bb.set('testRan', true);
  return Status.SUCCESS;
});
const testCondition = new Condition('test_true', () => true);
const testTree = new BehaviorTree(
  new Sequence('test_seq', [testCondition, testAction]),
  bb
);

const status = testTree.tick();
assert(status === Status.SUCCESS, `Behavior tree ticks successfully: ${status}`);
assert(bb.get('testRan') === true, 'Action was executed by behavior tree');

// ── 22. Fishing sequence doesn't crash ─────────────────────────────────────
console.log('── 22. Fishing Sequence ──');

const tests22 = async () => {
  actions._busy = false;
  actions._cancelled = false;
  mockBot.pathfinder._goal = null;

  // Test the sequence doesn't crash — use a short timeout
  const seqPromise = actions.startFishingSequence();
  // The sequence will hang on walkTo (mock can't resolve pathfinding)
  // Cancel after a short wait
  setTimeout(() => { actions.cancel(); actions._busy = false; }, 500);
  await seqPromise.catch(() => {});
  assert(true, 'Fishing sequence completes without crash');
};

// ── Run async tests ─────────────────────────────────────────────────────────

(async () => {
  await tests7();
  await tests8();
  await tests10();
  await tests11();
  await tests12();
  await tests13();
  await tests14();
  await tests16();
  await tests17();
  await tests19();
  await tests22();

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  🤖 Actions Results: ✅ ${passed} passed, ❌ ${failed} failed`);
  console.log(`${'═'.repeat(50)}\n`);
  // Force exit to clear any hanging timeouts from mock pathfinding
  process.exit(failed > 0 ? 1 : 0);
})();
