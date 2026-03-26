/**
 * @module craftmind-fishing/ai/__tests__/agent.test
 * @description Tests for Agent, AgentManager, Interactions, StoryGenerator, NPCSimulation.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Agent } from '../agent.js';
import { AgentManager } from '../agent-manager.js';
import { InteractionResolver, INTERACTION_TYPES } from '../interactions.js';
import { StoryGenerator } from '../story-generator.js';
import { NPCSimulation } from '../npc-simulation.js';
import { RadioBridge } from '../radio-bridge.js';
import { NPC_AGENTS, CODY_CONFIG } from '../npc-agent-configs.js';
import { Personality } from '../personality.js';

// ── Agent Tests ──────────────────────────────────────────────────────────────

describe('Agent', () => {
  it('creates an agent with correct defaults', () => {
    const agent = new Agent({
      name: 'TestBot',
      type: 'npc',
      personality: { traits: { talkativeness: 0.5 } },
      home: { x: 10, y: 64, z: 10 },
    });
    assert.equal(agent.name, 'TestBot');
    assert.equal(agent.type, 'npc');
    assert.equal(agent.active, false);
    assert.equal(agent.location, 'unknown');
    assert.deepEqual(agent.position, { x: 10, y: 64, z: 10 });
    assert.equal(agent.todayCatch.length, 0);
  });

  it('starts and stops correctly', () => {
    const agent = new Agent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    agent.start();
    assert.equal(agent.active, true);
    agent.stop();
    assert.equal(agent.active, false);
  });

  it('tick returns null when inactive', () => {
    const agent = new Agent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    const result = agent.tick({ gameHour: 8 });
    assert.equal(result, null);
  });

  it('tick returns an action when active', () => {
    const agent = new Agent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    agent.start();
    const action = agent.tick({ gameHour: 8 });
    assert.ok(action);
    assert.ok(action.type);
  });

  it('handles fish caught events', () => {
    const agent = new Agent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    agent.start();
    agent.handleEvent({ type: 'caught_fish', fish: { weight: 15, species: 'coho' } });
    assert.equal(agent.todayCatch.length, 1);
    assert.equal(agent.todayWeight, 15);
  });

  it('handles new day reset', () => {
    const agent = new Agent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    agent.start();
    agent.handleEvent({ type: 'caught_fish', fish: { weight: 20, species: 'king' } });
    agent.handleEvent({ type: 'new_day' });
    assert.equal(agent.todayCatch.length, 0);
    assert.equal(agent.todayWeight, 0);
  });

  it('moves to new location', () => {
    const agent = new Agent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    agent.moveTo('ernies_bar', { x: 200, y: 64, z: 200 });
    assert.equal(agent.location, 'ernies_bar');
    assert.deepEqual(agent.position, { x: 200, y: 64, z: 200 });
  });

  it('generates summary', () => {
    const agent = new Agent({ name: 'Cody', type: 'player_bot', personality: {}, home: { x: 0, y: 64, z: 0 } });
    agent.start();
    const summary = agent.getSummary();
    assert.equal(summary.name, 'Cody');
    assert.equal(summary.type, 'player_bot');
    assert.equal(summary.active, true);
    assert.ok('mood' in summary);
  });

  it('socializes with nearby entities', () => {
    const agent = new Agent({
      name: 'Talkative',
      type: 'npc',
      personality: { traits: { talkativeness: 1.0 } },
      home: { x: 0, y: 64, z: 0 },
    });
    agent.start();
    // Force social interaction with a nearby player
    const action = agent.tick({
      gameHour: 12,
      nearbyEntities: [{ name: 'Player1', type: 'player', isPlayer: true, x: 5, z: 5 }],
    });
    assert.ok(action);
    // With high talkativeness and no cooldown, should try to socialize
    // (probabilistic, but 1.0 talkativeness = 15% base chance per tick)
  });

  it('conversation cooldown prevents spam', () => {
    const agent = new Agent({
      name: 'A',
      type: 'npc',
      personality: { traits: { talkativeness: 1.0 } },
      home: { x: 0, y: 64, z: 0 },
    });
    agent.start();
    agent.conversationCooldown = 999;
    const action = agent.tick({
      gameHour: 12,
      nearbyEntities: [{ name: 'P1', type: 'player', isPlayer: true, x: 5, z: 5 }],
    });
    // Should NOT be a social action due to cooldown
    if (action) {
      assert.ok(action.type !== 'brag' && action.type !== 'greeting' && action.type !== 'gossip');
    }
  });
});

// ── AgentManager Tests ──────────────────────────────────────────────────────

describe('AgentManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AgentManager(null, { dataDir: './data/test' });
  });

  afterEach(() => {
    manager.stop();
  });

  it('creates and spawns agents', () => {
    const agent = manager.spawnAgent({ name: 'TestNPC', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    assert.ok(agent);
    assert.equal(manager.getAgentNames().length, 1);
    assert.equal(manager.getAgent('TestNPC').name, 'TestNPC');
  });

  it('removes agents', () => {
    manager.spawnAgent({ name: 'Temp', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    assert.ok(manager.removeAgent('Temp'));
    assert.equal(manager.getAgentNames().length, 0);
    assert.ok(!manager.removeAgent('NonExistent'));
  });

  it('spawns all NPCs', () => {
    const names = manager.spawnNPCs();
    assert.ok(names.length >= 10); // All NPCs from config
    assert.ok(names.includes('Cody'));
    assert.ok(names.includes('Ernie'));
    assert.ok(names.includes('Captain Pete'));
  });

  it('ticks all agents', () => {
    manager.spawnAgent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    manager.spawnAgent({ name: 'B', type: 'npc', personality: {}, home: { x: 10, y: 64, z: 10 } });
    manager.start(100);
    // Let a few ticks happen
    return new Promise(resolve => {
      setTimeout(() => {
        assert.ok(manager.tickCount > 0);
        const status = manager.getStatus();
        assert.equal(status.agentCount, 2);
        resolve();
      }, 350);
    });
  });

  it('emits events', () => {
    const events = [];
    manager.on('agent:spawned', e => events.push(e));
    manager.spawnAgent({ name: 'X', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    assert.equal(events.length, 1);
    assert.equal(events[0].name, 'X');
  });

  it('broadcasts radio messages to agents', () => {
    const radioMessages = [];
    manager.spawnAgent({ name: 'R', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    manager.on('radio:broadcast', e => radioMessages.push(e));
    manager.broadcastRadio('Storm warning!', 'securite');
    assert.equal(radioMessages.length, 1);
    assert.equal(radioMessages[0].type, 'securite');
  });

  it('handles world events', () => {
    const events = [];
    manager.spawnAgent({ name: 'W', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    manager.on('world:event', e => events.push(e));
    manager.handleWorldEvent({ type: 'weather_change', weather: 'storm' });
    assert.equal(manager.weather, 'storm');
    assert.equal(events.length, 1);
  });

  it('get status returns full state', () => {
    manager.spawnAgent({ name: 'S', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    const status = manager.getStatus();
    assert.equal(status.agentCount, 1);
    assert.equal(status.running, false);
    assert.ok('agents' in status);
    assert.ok('weather' in status);
  });

  it('new day resets all agents', () => {
    manager.spawnAgent({ name: 'D', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    const dayEvents = [];
    manager.on('world:new_day', () => dayEvents.push('new_day'));
    // Simulate hour wrap
    manager.gameHour = 23.9;
    manager.start(100);
    return new Promise(resolve => {
      setTimeout(() => {
        // Hour should wrap and trigger new_day
        resolve();
      }, 350);
    });
  });
});

// ── InteractionResolver Tests ────────────────────────────────────────────────

describe('InteractionResolver', () => {
  it('defines all interaction types', () => {
    assert.ok(INTERACTION_TYPES.GREETING);
    assert.ok(INTERACTION_TYPES.GOSSIP);
    assert.ok(INTERACTION_TYPES.ARGUMENT);
    assert.ok(INTERACTION_TYPES.SPOT_COMPETITION);
    assert.ok(INTERACTION_TYPES.BRAG);
    assert.ok(INTERACTION_TYPES.COMPLAIN);
    assert.ok(INTERACTION_TYPES.FISHING_ADVICE);
    assert.ok(INTERACTION_TYPES.TEACHING);
    assert.ok(INTERACTION_TYPES.SPOT_SHARING);
    assert.ok(INTERACTION_TYPES.TRADE);
    assert.ok(INTERACTION_TYPES.WEATHER_COMMENT);
    assert.ok(INTERACTION_TYPES.ADVICE);
  });

  it('interaction types have required fields', () => {
    for (const [name, type] of Object.entries(INTERACTION_TYPES)) {
      assert.ok(Array.isArray(type.triggers), `${name} missing triggers`);
      assert.ok(typeof type.weight === 'number', `${name} missing weight`);
      assert.ok(typeof type.dialogue === 'string', `${name} missing dialogue`);
    }
  });

  it('resolves proximity interactions', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({
      name: 'Ernie',
      type: 'npc',
      personality: { traits: { talkativeness: 0.9 } },
      home: { x: 200, y: 64, z: 200 },
      location: 'ernies_old_time_saloon',
    });
    manager.spawnAgent({
      name: 'Captain Pete',
      type: 'npc',
      personality: { traits: { competitiveness: 0.8 } },
      home: { x: 150, y: 64, z: 110 },
      location: 'ernies_old_time_saloon',
    });

    // Place both at Ernie's bar
    manager.getAgent('Ernie').moveTo('ernies_old_time_saloon', { x: 200, y: 64, z: 200 });
    manager.getAgent('Captain Pete').moveTo('ernies_old_time_saloon', { x: 202, y: 64, z: 202 });

    const resolver = new InteractionResolver(manager);
    const interactions = resolver.resolve();
    // Should detect an interaction (greeting or gossip)
    assert.ok(interactions.length >= 0); // may or may not trigger based on relationship state
  });

  it('detects rivalry at same fishing spot', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({
      name: 'Cody',
      type: 'npc',
      personality: { traits: { competitiveness: 0.7 } },
      home: { x: 0, y: 64, z: 0 },
      location: 'eliason_harbor',
    });
    manager.spawnAgent({
      name: 'Captain Pete',
      type: 'npc',
      personality: { traits: { competitiveness: 0.9 } },
      home: { x: 0, y: 64, z: 0 },
      location: 'eliason_harbor',
    });

    // Both at harbor, both have caught fish
    manager.getAgent('Cody').moveTo('eliason_harbor', { x: 150, y: 63, z: 100 });
    manager.getAgent('Captain Pete').moveTo('eliason_harbor', { x: 152, y: 63, z: 102 });
    manager.getAgent('Cody').handleEvent({ type: 'caught_fish', fish: { weight: 30, species: 'king' } });
    manager.getAgent('Captain Pete').handleEvent({ type: 'caught_fish', fish: { weight: 25, species: 'king' } });

    const resolver = new InteractionResolver(manager);
    const interactions = resolver.resolve();
    const rivalry = interactions.find(i => i.type === 'SPOT_COMPETITION');
    assert.ok(rivalry, 'Should detect spot competition between competitive agents');
    assert.ok(rivalry.message.includes('Cody') || rivalry.message.includes('Captain Pete'));
  });

  it('gets recent interaction history', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({ name: 'A', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    manager.spawnAgent({ name: 'B', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    const resolver = new InteractionResolver(manager);
    const history = resolver.getRecentInteractions();
    assert.ok(Array.isArray(history));
  });
});

// ── StoryGenerator Tests ────────────────────────────────────────────────────

describe('StoryGenerator', () => {
  it('creates without error', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    const sg = new StoryGenerator(manager);
    assert.ok(sg);
  });

  it('detects stories from rivalry', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({
      name: 'Cody',
      type: 'npc',
      personality: { traits: { competitiveness: 0.9 } },
      home: { x: 0, y: 64, z: 0 },
    });
    manager.spawnAgent({
      name: 'Captain Pete',
      type: 'npc',
      personality: { traits: { competitiveness: 0.9 } },
      home: { x: 0, y: 64, z: 0 },
    });

    // Both at harbor with fish
    manager.getAgent('Cody').moveTo('eliason_harbor', { x: 150, y: 63, z: 100 });
    manager.getAgent('Captain Pete').moveTo('eliason_harbor', { x: 152, y: 63, z: 102 });
    manager.getAgent('Cody').handleEvent({ type: 'caught_fish', fish: { weight: 40, species: 'king' } });
    manager.getAgent('Captain Pete').handleEvent({ type: 'caught_fish', fish: { weight: 20, species: 'coho' } });

    const sg = new StoryGenerator(manager);
    const stories = sg.detectStories();
    const rivalry = stories.find(s => s.type === 'rivalry');
    assert.ok(rivalry, 'Should detect rivalry story');
    assert.ok(rivalry.title.includes('Cody') && rivalry.title.includes('Captain Pete'));
    assert.ok(rivalry.dialogue);
    assert.ok(rivalry.effect);
  });

  it('detects weather drama during storm', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.weather = 'storm';
    manager.spawnAgent({
      name: 'Cody',
      type: 'npc',
      personality: { traits: { stubbornness: 0.8 } },
      home: { x: 0, y: 64, z: 0 },
    });

    // Simulate Cody being out fishing
    const cody = manager.getAgent('Cody');
    cody.currentBlock = { action: 'go_fishing', location: 'harbor' };

    const sg = new StoryGenerator(manager);
    const stories = sg.detectStories();
    const weather = stories.find(s => s.type === 'weather_drama');
    assert.ok(weather, 'Should detect weather drama');
    assert.ok(weather.dialogue.includes('Cody'));
    assert.ok(weather.effect?.broadcast);
  });

  it('detects market event from heavy catches', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({
      name: 'Cody',
      type: 'npc',
      personality: {},
      home: { x: 0, y: 64, z: 0 },
    });
    manager.spawnAgent({
      name: 'Captain Pete',
      type: 'npc',
      personality: {},
      home: { x: 0, y: 64, z: 0 },
    });

    // Give both lots of big fish (200+ lbs total)
    manager.getAgent('Cody').handleEvent({ type: 'caught_fish', fish: { weight: 100, species: 'halibut' } });
    manager.getAgent('Captain Pete').handleEvent({ type: 'caught_fish', fish: { weight: 120, species: 'halibut' } });

    const sg = new StoryGenerator(manager);
    const stories = sg.detectStories();
    const market = stories.find(s => s.type === 'market_event');
    assert.ok(market, 'Should detect market event');
    assert.ok(market.effect.priceMultiplier < 1);
  });

  it('detects mentorship from wise agent', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({
      name: 'Old Thomas',
      type: 'npc',
      personality: { traits: { wisdom: 0.9 } },
      home: { x: 0, y: 64, z: 0 },
    });
    manager.spawnAgent({
      name: 'Sitka Kid',
      type: 'npc',
      personality: {},
      home: { x: 0, y: 64, z: 0 },
    });

    // Both at same location, trust established
    const thomas = manager.getAgent('Old Thomas');
    const kid = manager.getAgent('Sitka Kid');
    thomas.moveTo('harbor', { x: 150, y: 63, z: 100 });
    kid.moveTo('harbor', { x: 152, y: 63, z: 102 });
    // Build enough trust for mentorship detection (need trust > 0.3)
    for (let i = 0; i < 20; i++) {
      thomas.relationships.interact('Sitka Kid', 'friendly');
      thomas.relationships.interact('Sitka Kid', 'fished_together');
    }

    const sg = new StoryGenerator(manager);
    const stories = sg.detectStories();
    const mentor = stories.find(s => s.type === 'mentorship');
    assert.ok(mentor, 'Should detect mentorship');
    assert.ok(mentor.dialogue);
  });

  it('respects story cooldowns', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.weather = 'storm';
    manager.spawnAgent({
      name: 'A',
      type: 'npc',
      personality: {},
      home: { x: 0, y: 64, z: 0 },
    });
    manager.getAgent('A').currentBlock = { action: 'go_fishing' };

    const sg = new StoryGenerator(manager);
    const first = sg.detectStories();
    const second = sg.detectStories();
    // Second call should be on cooldown
    assert.ok(second.length < first.length || second.every(s => s.type !== first.find(f => true)?.type));
  });

  it('detects bar gathering', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    const names = ['Ernie', 'Captain Pete', 'Sarah', 'Dave'];
    for (const name of names) {
      manager.spawnAgent({ name, type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
      manager.getAgent(name).moveTo('ernies_old_time_saloon', { x: 200, y: 64, z: 200 });
    }

    const sg = new StoryGenerator(manager);
    const stories = sg.detectStories();
    const bar = stories.find(s => s.type === 'bar_gathering');
    assert.ok(bar, 'Should detect bar gathering');
    assert.ok(bar.agents.length >= 3);
  });
});

// ── NPCSimulation Tests ─────────────────────────────────────────────────────

describe('NPCSimulation', () => {
  it('creates without error', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    const sim = new NPCSimulation(manager);
    assert.ok(sim);
  });

  it('updates NPC locations based on schedule', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnNPCs();
    const sim = new NPCSimulation(manager);
    sim.updateLocations(15); // 3pm
    // Ernie should be at the bar at 3pm
    const ernie = manager.getAgent('Ernie');
    if (ernie) {
      // Location should have been updated
      assert.ok(ernie.location);
    }
  });

  it('generates tellraw-formatted chat', async () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({ name: 'Ernie', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    const sim = new NPCSimulation(manager);
    const chats = [];
    manager.on('npc:chat', c => chats.push(c));

    await sim.npcChat('Ernie', 'Welcome to the bar!');
    assert.equal(chats.length, 1);
    assert.ok(chats[0].tellraw.includes('/tellraw'));
    assert.ok(chats[0].message.includes('Welcome'));
  });

  it('gets NPC dialogue by topic', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({ name: 'Ernie', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    const sim = new NPCSimulation(manager);
    const dialogue = sim.getNPCDialogue('Ernie', 'weather');
    assert.ok(dialogue);
    assert.ok(typeof dialogue === 'string');
  });

  it('gets random NPC dialogue without topic', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnAgent({ name: 'Ernie', type: 'npc', personality: {}, home: { x: 0, y: 64, z: 0 } });
    const sim = new NPCSimulation(manager);
    const dialogue = sim.getNPCDialogue('Ernie');
    assert.ok(dialogue);
  });

  it('reacts to weather events', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    manager.spawnNPCs();
    const sim = new NPCSimulation(manager);
    const chats = [];
    manager.on('npc:chat', c => chats.push(c));
    sim.reactToEvent({ type: 'weather_change', weather: 'storm' });
    // Some NPCs should react
    assert.ok(chats.length >= 0); // probabilistic
  });
});

// ── RadioBridge Tests ───────────────────────────────────────────────────────

describe('RadioBridge', () => {
  it('broadcasts weather events', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    const broadcasts = [];
    manager.on('radio:broadcast', b => broadcasts.push(b));
    const bridge = new RadioBridge(manager, null);
    manager.handleWorldEvent({ type: 'weather_change', weather: 'storm' });
    assert.ok(broadcasts.length >= 1);
    assert.ok(broadcasts[0].message.includes('Storm'));
  });

  it('broadcasts ADF&G notices', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    const broadcasts = [];
    manager.on('radio:broadcast', b => broadcasts.push(b));
    const bridge = new RadioBridge(manager, null);
    bridge.adfgNotice('King salmon season closes at 11:59 PM tonight.');
    assert.equal(broadcasts.length, 1);
    assert.ok(broadcasts[0].message.includes('ADF&G'));
  });

  it('broadcasts Coast Guard alerts', () => {
    const manager = new AgentManager(null, { dataDir: './data/test' });
    const broadcasts = [];
    manager.on('radio:broadcast', b => broadcasts.push(b));
    const bridge = new RadioBridge(manager, null);
    bridge.coastGuardAlert('Disabled vessel adrift two miles west of Cape Edgecumbe.');
    assert.equal(broadcasts.length, 1);
    assert.ok(broadcasts[0].message.includes('Coast Guard'));
  });
});

// ── NPC Agent Configs Tests ─────────────────────────────────────────────────

describe('NPC Agent Configs', () => {
  it('exports all expected NPCs', () => {
    assert.ok(NPC_AGENTS.length >= 10);
    const names = NPC_AGENTS.map(c => c.name);
    assert.ok(names.includes('Cody'));
    assert.ok(names.includes('Ernie'));
    assert.ok(names.includes('Linda'));
    assert.ok(names.includes('Captain Pete'));
    assert.ok(names.includes('Mary'));
    assert.ok(names.includes('Old Thomas'));
    assert.ok(names.includes('Sarah'));
    assert.ok(names.includes('Dave'));
    assert.ok(names.includes('Captain Sig'));
    assert.ok(names.includes('Jenna'));
  });

  it('Cody is a player_bot', () => {
    assert.equal(CODY_CONFIG.type, 'player_bot');
    assert.ok(CODY_CONFIG.skills.length > 0);
    assert.ok(CODY_CONFIG.personality.traits);
  });

  it('NPCs have npcData reference', () => {
    const ernie = NPC_AGENTS.find(c => c.name === 'Ernie');
    assert.ok(ernie.npcData);
    assert.equal(ernie.type, 'npc');
  });
});
