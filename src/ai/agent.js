/**
 * @module craftmind-fishing/ai/agent
 * @description Individual agent — personality, memory, relationships, schedule, skills.
 * Each NPC is a full agent with autonomous behavior.
 */

import { Personality, Mood } from './personality.js';
import { Relationships } from './relationships.js';
import { DailySchedule } from './schedule.js';
import { Memory } from './memory.js';

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

// ── Agent ────────────────────────────────────────────────────────────────────

export class Agent {
  /**
   * @param {object} config
   * @param {string} config.name
   * @param {string} config.type - 'player_bot' (mineflayer) | 'npc' (simulated)
   * @param {object} config.personality - { traits, opinions }
   * @param {object} config.schedule - schedule config
   * @param {object} config.home - { x, y, z }
   * @param {string} config.location - current location name
   * @param {string[]} [config.skills]
   * @param {object} [config.bot] - mineflayer bot instance (for player_bot type)
   * @param {string} [config.dataDir]
   * @param {object} [config.npcData] - raw NPC data from sitka-npcs.js
   */
  constructor(config) {
    this.name = config.name;
    this.type = config.type; // 'player_bot' or 'npc'
    this.bot = config.bot || null;

    // Core AI systems
    this.personality = this._buildPersonality(config.personality);
    this.memory = new Memory(config.dataDir);
    this.relationships = new Relationships(config.dataDir);
    this.schedule = new DailySchedule();
    this.skills = config.skills || [];

    // Location
    this.home = config.home || { x: 0, y: 64, z: 0 };
    this.location = config.location || 'unknown';
    this.position = { ...this.home };

    // State
    this.currentAction = null;
    this.currentBlock = null;
    this.visibleTo = new Set();
    this.active = false;
    this.lastInteractedWith = new Map(); // name -> timestamp
    this.conversationCooldown = 0;

    // NPC data reference (for dialogue, greetings, etc.)
    this.npcData = config.npcData || null;

    // Catch tracking for emergent events
    this.todayCatch = [];
    this.todayWeight = 0;
  }

  /**
   * Build personality from config or NPC data.
   */
  _buildPersonality(config) {
    if (!config) {
      // Derive from npcData
      const npc = this.npcData;
      if (!npc) return new Personality();

      const traitMap = {
        'grizzled_old_salt': { talkativeness: 0.9, generosity: 0.7, humor: 0.8, stubbornness: 0.4, wisdom: 0.6 },
        'knowledgeable_helpful': { talkativeness: 0.8, generosity: 0.9, humor: 0.4, patience: 0.9, stubbornness: 0.2 },
        'competitive_stubborn': { talkativeness: 0.7, generosity: 0.3, competitiveness: 0.9, stubbornness: 0.8, humor: 0.5 },
        'official_but_friendly': { talkativeness: 0.6, generosity: 0.5, patience: 0.7, stubbornness: 0.6 },
        'wise_mysterious': { talkativeness: 0.3, generosity: 0.6, wisdom: 0.95, patience: 0.95 },
        'enthusiastic_educator': { talkativeness: 0.85, generosity: 0.8, curiosity: 0.9, humor: 0.6 },
        'fun_teacher': { talkativeness: 0.8, generosity: 0.7, humor: 0.8, patience: 0.8 },
        'gruff_intense': { talkativeness: 0.4, generosity: 0.3, stubbornness: 0.9, humor: 0.2 },
        'tough_independent': { talkativeness: 0.6, generosity: 0.4, stubbornness: 0.7, humor: 0.3 },
        'clueless_enthusiastic': { talkativeness: 0.95, generosity: 0.6, curiosity: 0.9 },
        'cryptic': { talkativeness: 0.15, wisdom: 0.9, stubbornness: 0.5 },
      };

      const traits = traitMap[npc.personality] || {};
      return new Personality(traits);
    }

    // If config has traits directly (Cody-style)
    if (config.traits) {
      const p = new Personality();
      Object.assign(p.traits, config.traits);
      return p;
    }

    // If config has opinions
    if (config.opinions) {
      const p = new Personality();
      p.opinions = { ...p.opinions, ...config.opinions };
      return p;
    }

    return new Personality(config);
  }

  /**
   * Start the agent.
   */
  start() {
    this.active = true;
    this.currentAction = 'idle';
  }

  /**
   * Stop the agent.
   */
  stop() {
    this.active = false;
    this.currentAction = null;
  }

  /**
   * Main tick — called every game tick.
   * @param {object} context - { gameHour, weather, nearbyEntities, world }
   * @returns {object|null} action to perform
   */
  tick(context = {}) {
    if (!this.active) return null;

    const { gameHour = 12, weather = 'clear', nearbyEntities = [], world = {} } = context;

    // Decrement cooldown
    if (this.conversationCooldown > 0) this.conversationCooldown--;

    // Update schedule
    const block = this.schedule.getCurrentBlock(gameHour, {
      weather,
      biteMultiplier: world.biteMultiplier,
      fishCount: this.todayCatch.length,
    });
    this.currentBlock = block;

    // Get nearby entities
    const nearby = this._filterNearby(nearbyEntities);

    // Check if social interaction should happen
    const shouldSocialize = nearby.length > 0
      && this.conversationCooldown <= 0
      && this._wantsToSocialize(nearby);

    if (shouldSocialize) {
      return this._handleSocial(nearby, context);
    }

    // Execute scheduled action
    return this._executeAction(block, context);
  }

  /**
   * Filter nearby entities to only relevant ones.
   */
  _filterNearby(nearbyEntities) {
    return nearbyEntities.filter(e => {
      if (e.name === this.name) return false;
      const dist = this._distance(e.position || e);
      return dist < 30; // 30-block interaction radius
    });
  }

  /**
   * Distance calculation.
   */
  _distance(other) {
    const dx = this.position.x - (other.x || 0);
    const dz = this.position.z - (other.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Should this agent initiate social interaction?
   */
  _wantsToSocialize(nearby) {
    const talkativeness = this.personality.traits.talkativeness || 0.5;
    const base = talkativeness * 0.15;

    // Mood modifiers
    const mood = this.personality.mood;
    const moodMod = mood.frustration > 0.6 ? -0.1 : mood.satisfaction > 0.7 ? 0.05 : 0;
    const energyMod = mood.energy > 0.5 ? 0.02 : -0.05;

    return Math.random() < base + moodMod + energyMod;
  }

  /**
   * Handle social interaction with nearby entities.
   * @returns {object} social action
   */
  _handleSocial(nearby, context) {
    const target = nearby[0]; // interact with closest
    const targetName = target.name || target.playerName || 'someone';
    const rel = this.relationships.get(targetName);
    const lastInteracted = this.lastInteractedWith.get(targetName) || 0;
    const timeSince = Date.now() - lastInteracted;

    // Cooldown: don't spam the same person
    if (timeSince < 15000) {
      return this._executeAction(this.currentBlock, context);
    }

    this.lastInteractedWith.set(targetName, Date.now());
    this.conversationCooldown = 60; // ~3 seconds between conversations

    // Pick interaction type
    const interaction = this._pickInteraction(target, rel, context);

    // Record the interaction
    this.relationships.interact(targetName, interaction.type);
    this.memory.addEpisode({
      type: 'social',
      target: targetName,
      interaction: interaction.type,
      location: this.location,
    });

    this.currentAction = interaction;
    return interaction;
  }

  /**
   * Pick what kind of interaction to have.
   */
  _pickInteraction(target, rel, context) {
    const trust = rel.trust;
    const isPlayer = target.type === 'player' || target.isPlayer;
    const isAgent = target.type === 'agent' || target.isAgent;

    // Rivalry check
    if (isAgent && this.personality.traits.competitiveness > 0.6) {
      const isRival = this.npcData?.relationships?.[target.name]?.includes('rival')
        || this.personality.traits.competitiveness > 0.8;
      if (isRival && this.todayCatch.length > 0) {
        return {
          type: 'brag',
          target: target.name,
          message: this._generateBrag(),
        };
      }
    }

    // Trust-based interactions
    if (trust > 0.7) {
      const options = isPlayer
        ? ['share_tip', 'greeting_warm', 'share_rumor']
        : ['gossip', 'greeting_warm'];
      return { type: pickRandom(options), target: target.name, message: this._generateDialogue(options) };
    }

    if (trust > 0.4) {
      return {
        type: pickRandom(['greeting', 'gossip', 'fishing_chat']),
        target: target.name,
        message: this._generateDialogue(['greeting', 'gossip', 'fishing_chat']),
      };
    }

    // Low trust / stranger
    return {
      type: 'greeting_cold',
      target: target.name,
      message: this._generateDialogue(['greeting_cold']),
    };
  }

  /**
   * Generate a brag message based on today's catch.
   */
  _generateBrag() {
    const best = this.todayCatch.sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
    if (!best) return pickRandom([
      "You should see what I caught yesterday.",
      "The fish are running. Just saying.",
    ]);
    return pickRandom([
      `Caught a ${best.weight}-pounder today. No big deal.`,
      `${best.species}, ${best.weight} pounds. That's how it's done.`,
      `Biggest ${best.species} of the season right here.`,
    ]);
  }

  /**
   * Generate dialogue from NPC data or personality.
   */
  _generateDialogue(types) {
    // Try NPC data first
    if (this.npcData) {
      // Greetings
      if (types.includes('greeting_warm') && this.npcData.greeting?.length) {
        return pickRandom(this.npcData.greeting);
      }
      // Random dialogue topic
      if (this.npcData.dialogue) {
        const topics = Object.keys(this.npcData.dialogue);
        if (topics.length > 0) {
          const topic = pickRandom(topics);
          return pickRandom(this.npcData.dialogue[topic]);
        }
      }
    }

    // Fall back to personality-based response
    return this.personality.getResponse('general');
  }

  /**
   * Execute the current scheduled action.
   */
  _executeAction(block, context) {
    if (!block) {
      this.currentAction = { type: 'sleep', message: '...' };
      return this.currentAction;
    }

    const action = {
      type: block.action,
      location: block.location,
      message: null,
    };

    // Generate location-appropriate messages
    if (this.npcData?.schedule) {
      const scheduleEntry = this._getCurrentScheduleDialogue(block.action);
      if (scheduleEntry) action.message = scheduleEntry;
    }

    this.currentAction = action;
    return action;
  }

  /**
   * Get schedule dialogue from NPC data.
   */
  _getCurrentScheduleDialogue(action) {
    if (!this.npcData?.schedule) return null;
    for (const info of Object.values(this.npcData.schedule)) {
      if (info.activity === action || info.location === this.location) {
        return info.dialogue;
      }
    }
    return null;
  }

  /**
   * Handle an event (fish caught, weather change, etc.)
   */
  handleEvent(event) {
    this.personality.mood.update(event);
    this.memory.addEpisode(event);

    if (event.type === 'caught_fish') {
      this.todayCatch.push(event.fish || { weight: event.value || 1, species: 'unknown' });
      this.todayWeight += (event.fish?.weight || event.value || 1);
    }

    if (event.type === 'new_day') {
      this.schedule.resetDay();
      this.personality.mood.resetDay();
      this.todayCatch = [];
      this.todayWeight = 0;
    }
  }

  /**
   * Move agent to a location.
   */
  moveTo(location, position) {
    this.location = location;
    if (position) this.position = { ...position };
  }

  /**
   * Get a summary of the agent's state.
   */
  getSummary() {
    return {
      name: this.name,
      type: this.type,
      active: this.active,
      location: this.location,
      currentAction: this.currentAction?.type || 'idle',
      mood: this.personality.mood.snapshot(),
      todayCatch: this.todayCatch.length,
      todayWeight: Math.round(this.todayWeight * 10) / 10,
      relationships: Object.keys(this.relationships.players).length,
    };
  }
}

export default Agent;
