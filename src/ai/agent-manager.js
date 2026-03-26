/**
 * @module craftmind-fishing/ai/agent-manager
 * @description Orchestrates multiple agents in the world. Ticks them, detects
 * agent-agent interactions, and fires events for emergent story generation.
 */

import { EventEmitter } from 'events';
import { Agent } from './agent.js';
import { NPC_AGENTS } from './npc-agent-configs.js';
import { InteractionResolver } from './interactions.js';
import { StoryGenerator } from './story-generator.js';
import { NPCSimulation } from './npc-simulation.js';

export class AgentManager extends EventEmitter {
  /**
   * @param {object} [server] - mineflayer server or bot reference
   * @param {object} [options]
   * @param {object} [options.radio] - MarineRadio instance for broadcasts
   * @param {string} [options.dataDir]
   */
  constructor(server, options = {}) {
    super();
    this.server = server;
    this.agents = new Map();       // name -> Agent
    this.radio = options.radio || null;
    this.dataDir = options.dataDir || './data/memory';

    // Sub-systems
    this.interactions = new InteractionResolver(this);
    this.storyGenerator = new StoryGenerator(this);
    this.npcSimulation = options.npcSimulation || null;

    // Tick state
    this.tickCount = 0;
    this.gameHour = 8;
    this.weather = 'clear';
    this.running = false;
    this._tickInterval = null;
  }

  /**
   * Spawn an agent from config.
   * @param {object} config - agent config (name, personality, schedule, etc.)
   * @returns {Agent}
   */
  spawnAgent(config) {
    const agent = new Agent({
      ...config,
      dataDir: this.dataDir,
    });
    this.agents.set(config.name, agent);
    agent.start();
    this.emit('agent:spawned', { name: config.name, type: config.type });
    return agent;
  }

  /**
   * Spawn all configured NPC agents.
   */
  spawnNPCs() {
    const spawned = [];
    for (const config of NPC_AGENTS) {
      const agent = this.spawnAgent(config);
      spawned.push(agent.name);
    }
    this.npcSimulation = this.npcSimulation || new NPCSimulation(this);
    this.emit('npcs:spawned', { count: spawned.length, names: spawned });
    return spawned;
  }

  /**
   * Remove an agent.
   * @param {string} name
   */
  removeAgent(name) {
    const agent = this.agents.get(name);
    if (!agent) return false;
    agent.stop();
    this.agents.delete(name);
    this.emit('agent:removed', { name });
    return true;
  }

  /**
   * Get an agent by name.
   * @param {string} name
   * @returns {Agent|undefined}
   */
  getAgent(name) {
    return this.agents.get(name);
  }

  /**
   * Get all agent names.
   */
  getAgentNames() {
    return Array.from(this.agents.keys());
  }

  /**
   * Main tick — called every game tick (50ms).
   * @param {object} [context] - { gameHour, weather, world }
   */
  tick(context = {}) {
    if (!this.running) return;
    this.tickCount++;

    // Update world state
    if (context.gameHour !== undefined) this.gameHour = context.gameHour;
    if (context.weather !== undefined) this.weather = context.weather;

    const nearbyEntities = this._getNearbyEntities();

    // Tick each agent
    for (const agent of this.agents.values()) {
      try {
        const action = agent.tick({
          gameHour: this.gameHour,
          weather: this.weather,
          nearbyEntities: this._filterEntitiesForAgent(agent, nearbyEntities),
          world: context.world || {},
        });

        if (action) {
          this.emit('agent:action', { agent: agent.name, action });
        }
      } catch (err) {
        this.emit('agent:error', { agent: agent.name, error: err.message });
      }
    }

    // Resolve agent-agent interactions every 10 ticks
    if (this.tickCount % 10 === 0) {
      this.interactions.resolve();
    }

    // Check for emergent stories every 50 ticks (~2.5s)
    if (this.tickCount % 50 === 0) {
      const stories = this.storyGenerator.detectStories();
      for (const story of stories) {
        this.emit('story:emergent', story);
      }
    }

    // Simulate NPC movement/location every 200 ticks (~10s)
    if (this.tickCount % 200 === 0 && this.npcSimulation) {
      this.npcSimulation.updateLocations(this.gameHour);
    }
  }

  /**
   * Start the agent manager ticking.
   * @param {number} [intervalMs=2000] - tick interval in ms
   */
  start(intervalMs = 2000) {
    this.running = true;
    this._tickInterval = setInterval(() => {
      // Advance game hour (simplified: 1 real second = ~1 game minute)
      this.gameHour += (intervalMs / 1000) / 60;
      if (this.gameHour >= 24) {
        this.gameHour -= 24;
        this._newDay();
      }
      this.tick({ gameHour: this.gameHour, weather: this.weather });
    }, intervalMs);
    this.emit('manager:started');
  }

  /**
   * Stop the agent manager.
   */
  stop() {
    this.running = false;
    if (this._tickInterval) clearInterval(this._tickInterval);
    for (const agent of this.agents.values()) agent.stop();
    this.emit('manager:stopped');
  }

  /**
   * Broadcast a radio message to all agents.
   * @param {string} message
   * @param {string} [type] - broadcast type
   */
  broadcastRadio(message, type = 'general') {
    if (this.radio) {
      this.radio.broadcast(type, message);
    }

    // Each agent reacts to the broadcast
    for (const agent of this.agents.values()) {
      agent.handleEvent({
        type: 'radio_broadcast',
        message,
        broadcastType: type,
      });
    }

    this.emit('radio:broadcast', { message, type });
  }

  /**
   * Handle a global event (weather change, market update, etc.)
   */
  handleWorldEvent(event) {
    if (event.weather) {
      this.weather = event.weather;
    }

    for (const agent of this.agents.values()) {
      agent.handleEvent(event);
      if (event.weather) {
        agent.schedule.applyWeather(event.weather);
      }
    }

    this.emit('world:event', event);
  }

  /**
   * Get status summary of all agents.
   */
  getStatus() {
    const agents = [];
    for (const agent of this.agents.values()) {
      agents.push(agent.getSummary());
    }
    return {
      tickCount: this.tickCount,
      gameHour: this.gameHour,
      weather: this.weather,
      running: this.running,
      agentCount: agents.length,
      agents,
    };
  }

  /**
   * New day — reset schedules and moods.
   */
  _newDay() {
    for (const agent of this.agents.values()) {
      agent.handleEvent({ type: 'new_day' });
    }
    this.emit('world:new_day');
  }

  /**
   * Get all entities visible to agents (other agents + known players).
   */
  _getNearbyEntities() {
    const entities = [];
    for (const agent of this.agents.values()) {
      entities.push({
        name: agent.name,
        type: 'agent',
        isAgent: true,
        position: agent.position,
        location: agent.location,
      });
    }
    // Players would be added from server.getPlayerEntities() in real impl
    return entities;
  }

  /**
   * Filter entities to those near a specific agent.
   */
  _filterEntitiesForAgent(agent, entities) {
    return entities.filter(e => e.name !== agent.name);
  }
}

export default AgentManager;
