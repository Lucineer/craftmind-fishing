import { ACTION_TYPES, validateAction, validatePlan } from '../../src/ai/action-schema.js';
import { ConversationMemory } from '../../src/ai/conversation-memory.js';
import { ActionPlanner } from '../../src/ai/action-planner.js';
import { ActionExecutor } from '../../src/ai/action-executor.js';

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; errors.push(msg || 'Assertion failed'); }
}

function assertEqual(a, b, msg) {
  if (a === b) { passed++; }
  else { failed++; errors.push(`${msg || ''}: expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); }
}

function assertIncludes(arr, val, msg) {
  if (arr.includes(val)) { passed++; }
  else { failed++; errors.push(`${msg || ''}: ${JSON.stringify(arr)} does not include ${val}`); }
}

// ── Action Schema Tests ──────────────────────────────────────────────────────

console.log('=== Action Schema Tests ===');

// ACTION_TYPES has expected entries
assert(ACTION_TYPES.MOVE, 'MOVE exists');
assert(ACTION_TYPES.FISH, 'FISH exists');
assert(ACTION_TYPES.CAST, 'CAST exists');
assert(ACTION_TYPES.REEL, 'REEL exists');
assert(ACTION_TYPES.CHAT, 'CHAT exists');
assert(ACTION_TYPES.WAIT, 'WAIT exists');
assert(ACTION_TYPES.CHECK, 'CHECK exists');
assert(ACTION_TYPES.SELL, 'SELL exists');
assert(ACTION_TYPES.BUY, 'BUY exists');
assert(ACTION_TYPES.EQUIP, 'EQUIP exists');
assert(ACTION_TYPES.LOOK_AT, 'LOOK_AT exists');
assert(ACTION_TYPES.FOLLOW, 'FOLLOW exists');
assert(ACTION_TYPES.STOP, 'STOP exists');
assert(ACTION_TYPES.USE_ITEM, 'USE_ITEM exists');

// Each has expected shape
for (const [name, def] of Object.entries(ACTION_TYPES)) {
  assert(Array.isArray(def.params), `${name} has params array`);
  assert(typeof def.timeout === 'number' && def.timeout > 0, `${name} has timeout > 0`);
  assert(typeof def.description === 'string' && def.description.length > 0, `${name} has description`);
}

// validateAction
const v1 = validateAction({ type: 'CHAT', params: { message: 'hello' } });
assert(v1.valid, 'Valid CHAT action');
assertEqual(v1.errors.length, 0, 'No errors for valid CHAT');

const v2 = validateAction({ type: 'UNKNOWN_ACTION' });
assert(!v2.valid, 'Unknown type is invalid');
assertIncludes(v2.errors[0], 'Unknown action type');

const v3 = validateAction({});
assert(!v3.valid, 'Empty action is invalid');
assertIncludes(v3.errors[0], 'Missing');

const v4 = validateAction({ type: 'EQUIP', params: {} });
assert(!v4.valid, 'EQUIP without item is invalid');

const v5 = validateAction({ type: 'EQUIP', params: { item: 'rod' } });
assert(v5.valid, 'EQUIP with item is valid');

const v6 = validateAction(null);
assert(!v6.valid, 'Null action is invalid');

const v7 = validateAction({ type: 'WAIT', params: { seconds: 5 } });
assert(v7.valid, 'WAIT with seconds is valid');

const v8 = validateAction({ type: 'CHECK', params: { thing: 'weather' } });
assert(v8.valid, 'CHECK with thing is valid');

const v9 = validateAction({ type: 'CHECK', params: {} });
assert(!v9.valid, 'CHECK without thing is invalid');

// validatePlan
const vp1 = validatePlan({ actions: [{ type: 'CHAT', params: { message: 'hi' } }] });
assert(vp1.valid, 'Valid plan');

const vp2 = validatePlan({ actions: [] });
assert(vp2.valid, 'Empty plan is valid');

const vp3 = validatePlan(null);
assert(!vp3.valid, 'Null plan is invalid');

const vp4 = validatePlan({ actions: [{ type: 'BAD' }] });
assert(!vp4.valid, 'Plan with bad action is invalid');

const vp5 = validatePlan({});
assert(!vp5.valid, 'Plan without actions array is invalid');

// ── Conversation Memory Tests ────────────────────────────────────────────────

console.log('\n=== Conversation Memory Tests ===');

const mem = new ConversationMemory();
assert(mem.history.length === 0, 'Memory starts empty');

mem.add('player', 'hello', { player: 'Steve' });
assertEqual(mem.history.length, 1, 'Memory has 1 message');

mem.add('cody', 'Hey.');
mem.add('player', 'How\'s the weather?', { player: 'Steve' });
assertEqual(mem.history.length, 3, 'Memory has 3 messages');

const recent = mem.getRecent(2);
assertEqual(recent.length, 2, 'getRecent returns 2');
assertEqual(recent[0].message, 'Hey.', 'First recent is correct');

const playerMsgs = mem.getFromPlayer('Steve');
assertEqual(playerMsgs.length, 2, 'getFromPlayer returns 2');

const topics = mem.extractTopics();
assert(Array.isArray(topics), 'extractTopics returns array');

mem.add('player', 'What about salmon fishing?', { player: 'Steve' });
mem.add('player', 'I want to catch halibut', { player: 'Steve' });
const topics2 = mem.extractTopics();
assert(topics2.includes('fish'), 'Topics includes fish');

// detectIntent
const mem2 = new ConversationMemory();
mem2.add('player', 'hello there!', { player: 'S' });
assertEqual(mem2.detectIntent(), 'greeting', 'Greeting intent');

const mem3 = new ConversationMemory();
mem3.add('player', 'What\'s the weather like?', { player: 'S' });
assertEqual(mem3.detectIntent(), 'check_weather', 'Weather intent');

const mem4 = new ConversationMemory();
mem4.add('player', 'teach me how to fish', { player: 'S' });
assertEqual(mem4.detectIntent(), 'learn', 'Learn intent');

const mem5 = new ConversationMemory();
mem5.add('player', 'let\'s go fishing!', { player: 'S' });
assertEqual(mem5.detectIntent(), 'go_fishing', 'Go fishing intent');

// getContext
const ctx = mem.getContext();
assert(ctx.recentMessages.length > 0, 'Context has recent messages');
assert(ctx.messageCount > 0, 'Context has message count');
assert(typeof ctx.playerIntent === 'string', 'Context has playerIntent');

// maxMessages limit
const memSmall = new ConversationMemory(3);
memSmall.add('p', '1');
memSmall.add('p', '2');
memSmall.add('p', '3');
memSmall.add('p', '4');
assertEqual(memSmall.history.length, 3, 'maxMessages trims old messages');

// clear
mem.clear();
assertEqual(mem.history.length, 0, 'clear empties history');

// serialize/deserialize
mem.add('p', 'test');
const serialized = mem.serialize();
const memClone = new ConversationMemory();
memClone.deserialize(serialized);
assertEqual(memClone.history.length, 1, 'Deserialize restores messages');

// ── Action Planner Tests ─────────────────────────────────────────────────────

console.log('\n=== Action Planner Tests ===');

// Planner without LLM — fallback mode
const planner = new ActionPlanner(null, {
  getGameState: () => ({ summary: 'clear, $50' }),
  getPersonality: () => ({ moodSnapshot: { energy: 0.5 } }),
  getMemory: () => null,
  getRelationships: () => null,
});

// Test that plan() returns a fallback
const planResult1 = await planner.plan('What\'s the weather?', 'Steve');
assert(planResult1.fallback, 'Fallback when no LLM');
assert(planResult1.dialogue, 'Has dialogue');
assert(Array.isArray(planResult1.actions), 'Has actions array');
if (planResult1.actions.length > 0) {
  assertEqual(planResult1.actions[0].type, 'CHECK', 'Weather → CHECK action');
}

// Test various fallback patterns
const p2 = await planner.plan('Let\'s go fish', 'Steve');
assert(p2.fallback, 'Fishing fallback');
assert(p2.actions.some(a => a.type === 'FISH' || a.type === 'EQUIP'), 'Fishing → FISH or EQUIP');

const p3 = await planner.plan('How\'s the tide?', 'Steve');
assert(p3.actions.some(a => a.type === 'CHECK'), 'Tide → CHECK');

const p4 = await planner.plan('Sell my fish', 'Steve');
assert(p4.actions.some(a => a.type === 'SELL'), 'Sell → SELL');

const p5 = await planner.plan('Follow me', 'Steve');
assert(p5.actions.some(a => a.type === 'FOLLOW'), 'Follow → FOLLOW');

const p6 = await planner.plan('hi', 'Steve');
assertEqual(p6.actions.length, 0, 'Greeting has no actions');
assert(p6.dialogue, 'Greeting has dialogue');

const p7 = await planner.plan('teach me to fish', 'Steve');
assert(p7.actions.length > 0, 'Teach has actions');
assertEqual(p7.actions[0].type, 'LOOK_AT', 'Teach starts with LOOK_AT');

const p8 = await planner.plan('Stop it', 'Steve');
assert(p8.actions.some(a => a.type === 'STOP'), 'Stop → STOP');

const p9 = await planner.plan('What do I have?', 'Steve');
assert(p9.actions.some(a => a.type === 'CHECK'), 'Inventory → CHECK');

const p10 = await planner.plan('Thanks!', 'Steve');
assertEqual(p10.actions.length, 0, 'Thanks has no actions');

const p11 = await planner.plan('how are you doing?', 'Steve');
assertEqual(p11.actions.length, 0, 'Small talk has no actions');
assert(p11.dialogue, 'Small talk has dialogue');

// Conversation memory integration
assertEqual(planner.memory.history.length, 22, 'Planner recorded all messages in memory');

// ── Action Executor Tests ────────────────────────────────────────────────────

console.log('\n=== Action Executor Tests ===');

// Mock bot
const mockBot = {
  chat: (msg) => { mockBot.lastChat = msg; },
  activateItem: () => { mockBot.activated = true; },
  pathfinder: {
    setGoal: (g) => { mockBot.lastGoal = g; },
  },
  inventory: {
    items: () => [],
  },
  players: {},
  entity: {},
};

const mockHumanizer = { delay: (ms) => ms * 0.5 + 100 };

const mockGame = {
  player: { isFishing: false, inventory: [], gold: 50, gear: [], permits: [] },
  getState: () => ({
    weather: { name: 'clear', emoji: '☀️', windSpeed: 5, seaState: 2 },
    tide: { level: 3.2, direction: 'incoming', phase: 'flood', emoji: '🌊' },
  }),
  startFishing: () => ({ success: true, message: 'Cast!' }),
  haulBack: () => ({ success: false, message: 'Nothing.' }),
  sellAllFish: () => [],
  sellFish: () => ({ message: 'Sold!' }),
  buyGear: () => ({ message: 'Bought!' }),
  weather: { getFishingReport: () => 'Fair conditions.' },
};

const executor = new ActionExecutor(mockBot, mockHumanizer, mockGame);
let chatLog = [];
executor.on({
  onChat: (msg) => chatLog.push(msg),
  onError: (err) => { /* silent */ },
});

// CHAT action
executor.enqueue([{ type: 'CHAT', params: { message: 'Hello there' }, reasoning: 'test' }]);
await new Promise(r => setTimeout(r, 600));
assert(chatLog.includes('Hello there'), 'CHAT action sends message');

// CHECK weather
executor.enqueue([{ type: 'CHECK', params: { thing: 'weather' } }]);
await new Promise(r => setTimeout(r, 600));
assert(chatLog.some(m => m.includes('clear')), 'CHECK weather reports weather');

// CHECK tide
chatLog = [];
executor.enqueue([{ type: 'CHECK', params: { thing: 'tide' } }]);
await new Promise(r => setTimeout(r, 600));
assert(chatLog.some(m => m.includes('Tide') || m.includes('tide')), 'CHECK tide reports tide');

// CHECK gold
chatLog = [];
executor.enqueue([{ type: 'CHECK', params: { thing: 'gold' } }]);
await new Promise(r => setTimeout(r, 600));
assert(chatLog.some(m => m.includes('$') || m.includes('50')), 'CHECK gold reports gold');

// CHECK inventory
chatLog = [];
executor.enqueue([{ type: 'CHECK', params: { thing: 'inventory' } }]);
await new Promise(r => setTimeout(r, 600));
assert(chatLog.some(m => m.includes('Hold') || m.includes('empty')), 'CHECK inventory works');

// SELL all
chatLog = [];
executor.enqueue([{ type: 'SELL', params: { item: 'all' } }]);
await new Promise(r => setTimeout(r, 600));
assert(chatLog.some(m => m.includes('$') || m.includes('Sold')), 'SELL reports result');

// WAIT action
const start = Date.now();
executor.enqueue([{ type: 'WAIT', params: { seconds: 0.1 } }]);
await new Promise(r => setTimeout(r, 300));
assert(Date.now() - start >= 50, 'WAIT respects seconds');

// STOP action
assert(executor.running, 'Executor running before STOP');
executor.enqueue([{ type: 'STOP', params: {} }]);
await new Promise(r => setTimeout(r, 600));
assert(!executor.running, 'Executor stopped after STOP action');

// Restart
executor.enqueue([{ type: 'CHAT', params: { message: 'back' } }]);
assert(executor.running, 'Executor restarts on enqueue');
await new Promise(r => setTimeout(r, 600));

// Unknown action type — should be skipped
executor.enqueue([{ type: 'BOGUS', params: {} }]);
await new Promise(r => setTimeout(r, 600));
assertEqual(executor.queue.length, 0, 'Unknown action skipped');

// Pause/resume
executor.pause();
executor.enqueue([{ type: 'CHAT', params: { message: 'paused' } }]);
await new Promise(r => setTimeout(r, 600));
assert(!chatLog.includes('paused'), 'Paused executor doesn\'t run');
executor.resume();
await new Promise(r => setTimeout(r, 600));
assert(chatLog.includes('paused'), 'Resumed executor runs');

// Status
const status = executor.status;
assert(typeof status.running === 'boolean', 'Status has running');
assert(typeof status.queueLength === 'number', 'Status has queueLength');

// stop() clears everything
executor.stop();
assert(!executor.running, 'stop() stops');
assertEqual(executor.queue.length, 0, 'stop() clears queue');

// ── Full Flow Test ───────────────────────────────────────────────────────────

console.log('\n=== Full Flow Test ===');

const fullPlanner = new ActionPlanner(null, {
  getGameState: () => ({ summary: 'clear, $50' }),
  getPersonality: () => ({ moodSnapshot: {} }),
});
const fullExecutor = new ActionExecutor(mockBot, mockHumanizer, mockGame);
let fullChatLog = [];
fullExecutor.on({
  onChat: (msg) => fullChatLog.push(msg),
});

// Simulate player chat
const result = await fullPlanner.plan("How's the weather?", 'Alex');
assert(result.dialogue, 'Plan has dialogue');
assert(result.fallback, 'Full flow uses fallback');

// Execute the plan
if (result.actions.length > 0) {
  fullExecutor.enqueue(result.actions);
  await new Promise(r => setTimeout(r, 1000));
}

// Simulate "let's fish" flow
const fishPlan = await fullPlanner.plan("Cody, let's go catch some kings!", 'Alex');
assert(fishPlan.actions.length > 0, 'Fish plan has actions');
if (fishPlan.dialogue) fullChatLog.push(fishPlan.dialogue);
fullExecutor.enqueue(fishPlan.actions);
await new Promise(r => setTimeout(r, 1000));

fullExecutor.stop();

// ── Results ──────────────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ ${passed} passed | ❌ ${failed} failed`);
if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(`  - ${e}`));
}
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);
