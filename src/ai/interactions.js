/**
 * @module craftmind-fishing/ai/interactions
 * @description Interaction types and resolver — how agents interact with each other.
 * Proximity, schedule overlap, opinion conflicts, and fishing dynamics.
 */

import { NPCS } from '../town/sitka-npcs.js';

// ── Interaction Types ────────────────────────────────────────────────────────

export const INTERACTION_TYPES = {
  // Social dynamics
  GREETING: { triggers: ['proximity', 'morning'], weight: 0.8, dialogue: 'greeting' },
  GOSSIP: { triggers: ['idle', 'nearby_agent'], weight: 0.3, dialogue: 'rumors' },
  ADVICE: { triggers: ['player_asks', 'trust_high'], weight: 0.5, dialogue: 'fishing_tips' },
  ARGUMENT: { triggers: ['opinion_conflict', 'nearby_rival'], weight: 0.2, dialogue: 'rivalry' },
  TRADE: { triggers: ['has_item_wanted', 'nearby'], weight: 0.4, dialogue: 'store' },
  TEACHING: { triggers: ['player_low_skill', 'trust_high'], weight: 0.3, dialogue: 'species' },

  // Fishing-specific
  SPOT_COMPETITION: { triggers: ['same_spot', 'personality_competitive'], weight: 0.6, dialogue: 'rivalry' },
  SPOT_SHARING: { triggers: ['same_spot', 'trust_high'], weight: 0.3, dialogue: 'fishing_tips' },
  FISHING_ADVICE: { triggers: ['player_fishing', 'expert'], weight: 0.4, dialogue: 'fishing_tips' },
  BRAG: { triggers: ['good_catch', 'nearby_players'], weight: 0.5, dialogue: 'rivalry' },
  COMPLAIN: { triggers: ['bad_luck', 'nearby_players'], weight: 0.4, dialogue: 'general' },

  // Weather events
  WEATHER_COMMENT: { triggers: ['weather_change', 'nearby'], weight: 0.5, dialogue: 'weather' },
};

// ── Interaction Resolver ─────────────────────────────────────────────────────

export class InteractionResolver {
  /**
   * @param {import('./agent-manager.js').AgentManager} manager
   */
  constructor(manager) {
    this.manager = manager;
    this.activeInteractions = []; // currently ongoing
    this.interactionHistory = []; // for story generation
  }

  /**
   * Check for and resolve agent-agent interactions.
   * Called periodically by the agent manager.
   */
  resolve() {
    const agents = Array.from(this.manager.agents.values());
    const resolved = [];

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];

        // Check proximity
        const dist = this._distance(a.position, b.position);
        if (dist > 30) continue;

        // Check if already interacting
        if (this._alreadyInteracting(a.name, b.name)) continue;

        // Determine interaction type
        const interaction = this._determineInteraction(a, b);
        if (!interaction) continue;

        // Record the interaction
        resolved.push(interaction);
        this.activeInteractions.push({
          agentA: a.name,
          agentB: b.name,
          type: interaction.type,
          startTime: Date.now(),
        });

        // Update relationships
        a.relationships.interact(b.name, interaction.relEffect || 'chat');
        b.relationships.interact(a.name, interaction.relEffect || 'chat');

        // Fire event
        this.manager.emit('interaction', interaction);
        this.interactionHistory.push({
          ...interaction,
          timestamp: Date.now(),
        });
      }
    }

    // Clean up expired interactions (older than 5 minutes)
    this.activeInteractions = this.activeInteractions.filter(
      i => Date.now() - i.startTime < 300000
    );

    // Trim history
    if (this.interactionHistory.length > 500) {
      this.interactionHistory = this.interactionHistory.slice(-500);
    }

    return resolved;
  }

  /**
   * Determine what interaction should happen between two agents.
   */
  _determineInteraction(a, b) {
    const relA = a.relationships.get(b.name);
    const relB = b.relationships.get(a.name);
    const npcA = NPCS[a.name.toLowerCase()] || a.npcData;
    const npcB = NPCS[b.name.toLowerCase()] || b.npcData;

    // Check for rivalry (same fishing spot)
    if (a.location === b.location && a.location !== 'unknown') {
      if (this._isFishingLocation(a.location)) {
        // Same fishing spot
        if (a.personality.traits.competitiveness > 0.5 || b.personality.traits.competitiveness > 0.5) {
          return {
            type: 'SPOT_COMPETITION',
            agents: [a.name, b.name],
            location: a.location,
            message: this._generateRivalryDialogue(a, b),
            relEffect: 'stole_spot',
          };
        }

        if (relA.trust > 0.5 && relB.trust > 0.5) {
          return {
            type: 'SPOT_SHARING',
            agents: [a.name, b.name],
            location: a.location,
            message: this._generateSharingDialogue(a, b),
            relEffect: 'fished_together',
          };
        }
      }
    }

    // Check NPC relationship data for pre-defined dynamics
    const relKeyB = npcA?.relationships?.[b.name.toLowerCase()];
    if (relKeyB?.includes('rival')) {
      return {
        type: 'ARGUMENT',
        agents: [a.name, b.name],
        location: a.location,
        message: this._generateArgumentDialogue(a, b),
        relEffect: 'rude',
      };
    }

    // Default: greeting or gossip
    if (relA.trust > 0.5 || relB.trust > 0.5) {
      return {
        type: 'GOSSIP',
        agents: [a.name, b.name],
        location: a.location,
        message: this._generateGossipDialogue(a, b),
        relEffect: 'chat',
      };
    }

    return {
      type: 'GREETING',
      agents: [a.name, b.name],
      location: a.location,
      message: this._generateGreetingDialogue(a, b),
      relEffect: 'chat',
    };
  }

  /**
   * Is this a fishing-relevant location?
   */
  _isFishingLocation(location) {
    const fishingLocations = ['eliason_harbor', 'boat', 'tidal_flats', 'bio_island', 'kelp_line'];
    return fishingLocations.some(f => location?.includes?.(f)) || fishingLocations.includes(location);
  }

  /**
   * Check if two agents are already interacting.
   */
  _alreadyInteracting(nameA, nameB) {
    return this.activeInteractions.some(
      i => (i.agentA === nameA && i.agentB === nameB)
        || (i.agentA === nameB && i.agentB === nameA)
    );
  }

  _distance(a, b) {
    const dx = (a.x || 0) - (b.x || 0);
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Dialogue Generators ──────────────────────────────────────────

  _generateRivalryDialogue(a, b) {
    const rivalries = [
      `${a.name}: "That's MY spot. Find your own."`,
      `${a.name}: "Biggest fish wins. You're going down."`,
      `${b.name}: "There's enough water for both of us. I'm just better."`,
      `${a.name}: "You're scaring the fish. Move your boat."`,
      `${b.name}: "I was here first. But I'll share... if you ask nice."`,
    ];
    return rivalries[Math.floor(Math.random() * rivalries.length)];
  }

  _generateSharingDialogue(a, b) {
    const sharing = [
      `${a.name}: "They're hitting pretty good here. Pull up alongside."`,
      `${b.name}: "Tried the pink hoochie? Working great today."`,
      `${a.name}: "Good to see you out here. The more the merrier."`,
    ];
    return sharing[Math.floor(Math.random() * sharing.length)];
  }

  _generateArgumentDialogue(a, b) {
    const arguments_ = [
      `${a.name}: "You're doing it wrong. AGAIN."`,
      `${b.name}: "Says the guy who lost a 50-pounder last week."`,
      `${a.name}: "My methods work. Yours are a disaster."`,
    ];
    return arguments_[Math.floor(Math.random() * arguments_.length)];
  }

  _generateGossipDialogue(a, b) {
    const gossip = [
      `${a.name}: "Heard Pete marked a school of big halibut out near the Cape."`,
      `${b.name}: "ADF&G might open the chinook sport fishery early."`,
      `${a.name}: "Some kid caught a 50-pound king from the shore last week."`,
      `${b.name}: "The seiner fleet is heading west. They must know something."`,
      `${a.name}: "Linda's got new gear in. Worth checking out."`,
      `${b.name}: "Mary's handing out fines again. Watch your moorage."`,
    ];
    return gossip[Math.floor(Math.random() * gossip.length)];
  }

  _generateGreetingDialogue(a, b) {
    const greetings = [
      `${a.name}: "Morning."`,
      `${b.name}: "Hey there."`,
      `${a.name}: "Nice weather today."`,
      `${b.name}: "Heading out?"`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get interaction history for story generation.
   */
  getRecentInteractions(sinceMs = 300000) {
    const cutoff = Date.now() - sinceMs;
    return this.interactionHistory.filter(i => i.timestamp > cutoff);
  }
}

export default InteractionResolver;
