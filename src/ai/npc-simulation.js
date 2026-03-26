/**
 * @module craftmind-fishing/ai/npc-simulation
 * @description Simulates NPCs that aren't connected via mineflayer.
 * They move between locations based on schedule, broadcast chat via RCON/tellraw,
 * and react to world events.
 */

import { NPCS, getNPCsAtTime } from '../town/sitka-npcs.js';

export class NPCSimulation {
  /**
   * @param {import('./agent-manager.js').AgentManager} manager
   */
  constructor(manager) {
    this.manager = manager;
    this.lastLocations = new Map(); // npc name -> last location
  }

  /**
   * Update NPC locations based on their schedule.
   * @param {number} gameHour
   */
  updateLocations(gameHour) {
    // Use the existing getNPCsAtTime function
    const hour = Math.floor(gameHour);
    const presentNPCs = getNPCsAtTime(hour);

    for (const { id, npc, location, activity, dialogue } of presentNPCs) {
      const agent = this.manager.getAgent(npc.name);
      if (!agent || agent.type === 'player_bot') continue;

      const lastLoc = this.lastLocations.get(npc.name);
      const newLocation = location || npc.location?.building || 'unknown';

      // Only update if location changed
      if (lastLoc !== newLocation) {
        agent.moveTo(newLocation, this._getBuildingPosition(newLocation));
        this.lastLocations.set(npc.name, newLocation);

        // Announce movement if someone might notice
        if (activity !== 'sleeping' && activity !== 'gone') {
          this.manager.emit('npc:moved', {
            name: npc.name,
            from: lastLoc,
            to: newLocation,
            activity,
          });
        }
      }
    }
  }

  /**
   * Simulate an NPC sending a chat message.
   * @param {string} npcName
   * @param {string} message
   * @param {string} [target] - specific player, or null for broadcast
   */
  async npcChat(npcName, message, target = null) {
    // Format as /tellraw for Minecraft
    const npc = NPCS[npcName.toLowerCase()];
    const displayName = npc?.fullName || npcName;

    const color = this._getNPCColor(npcName);
    const formatted = `${displayName}: ${message}`;

    // In real implementation, this would use RCON:
    // await rcon.send(`/tellraw @a {"text":"${formatted}","color":"${color}"}`)
    // For now, emit an event that the server bridge can consume
    this.manager.emit('npc:chat', {
      npcName,
      displayName,
      message,
      target,
      tellraw: `/tellraw ${target || '@a'} {"text":"${formatted.replace(/"/g, '\\"')}","color":"${color}"}`,
    });

    return formatted;
  }

  /**
   * React to a world event with NPC dialogue.
   * @param {object} event - world event
   */
  reactToEvent(event) {
    const reactions = [];

    for (const agent of this.manager.agents.values()) {
      if (agent.type === 'player_bot') continue;

      const npcData = agent.npcData;
      if (!npcData?.dialogue) continue;

      let message = null;

      switch (event.type) {
        case 'weather_change':
          if (npcData.dialogue.weather) {
            message = npcData.dialogue.weather[Math.floor(Math.random() * npcData.dialogue.weather.length)];
          }
          break;

        case 'big_catch':
          if (agent.personality.traits.competitiveness > 0.6) {
            message = "I could've caught bigger.";
          } else if (agent.personality.traits.generosity > 0.6) {
            message = "Nice fish! Well done.";
          }
          break;

        case 'market_change':
          if (npcData.dialogue.fishing_tips) {
            message = "Market's shifting. Might want to sell now.";
          }
          break;

        case 'radio_broadcast':
          if (event.message?.includes('storm') || event.message?.includes('weather')) {
            message = this._getWeatherReaction(agent, event);
          }
          break;
      }

      if (message) {
        this.npcChat(agent.name, message);
        reactions.push({ npc: agent.name, message });
      }
    }

    return reactions;
  }

  /**
   * Get contextual dialogue for an NPC based on their current state.
   * Used when a player is near an NPC.
   * @param {string} npcName
   * @param {string} [topic]
   * @returns {string|null}
   */
  getNPCDialogue(npcName, topic) {
    const npc = NPCS[npcName.toLowerCase()];
    if (!npc?.dialogue) return null;

    if (topic && npc.dialogue[topic]) {
      return npc.dialogue[topic][Math.floor(Math.random() * npc.dialogue[topic].length)];
    }

    // Pick a random topic, weighted by situation
    const topics = Object.keys(npc.dialogue);
    if (topics.length === 0) return null;
    const topic_ = topics[Math.floor(Math.random() * topics.length)];
    return npc.dialogue[topic_][Math.floor(Math.random() * npc.dialogue[topic_].length)];
  }

  /**
   * Get NPC-specific chat color.
   */
  _getNPCColor(npcName) {
    const colors = {
      'Ernie': 'gold',
      'Captain Pete': 'red',
      'Linda': 'aqua',
      'Mary': 'blue',
      'Old Thomas': 'dark_green',
      'Sarah': 'green',
      'Dave': 'yellow',
      'Captain Sig': 'dark_red',
      'Jenna': 'light_purple',
      'Cody': 'gray',
    };
    return colors[npcName] || 'white';
  }

  /**
   * Get approximate position for a building.
   */
  _getBuildingPosition(building) {
    const positions = {
      'ernies_old_time_saloon': { x: 200, y: 64, z: 200 },
      'ernies_bar': { x: 200, y: 64, z: 200 },
      'lfs_marine_supplies': { x: 180, y: 64, z: 150 },
      'eliason_harbor': { x: 150, y: 63, z: 100 },
      'harbormaster': { x: 170, y: 64, z: 120 },
      'st_michaels_cathedral': { x: 220, y: 64, z: 180 },
      'adfg_office': { x: 190, y: 64, z: 160 },
      'sitka_high_school': { x: 250, y: 64, z: 200 },
      'pioneer_bar': { x: 210, y: 64, z: 210 },
      'visitor_center': { x: 160, y: 64, z: 130 },
      'home': { x: 230, y: 64, z: 190 },
      'market_center': { x: 185, y: 64, z: 155 },
      'tidal_flats': { x: 120, y: 62, z: 80 },
      'harbor': { x: 150, y: 63, z: 100 },
    };
    return positions[building] || { x: 200, y: 64, z: 200 };
  }

  /**
   * Weather reaction based on personality.
   */
  _getWeatherReaction(agent, event) {
    const stubborn = agent.personality.traits.stubbornness || 0;
    if (stubborn > 0.7) return "Storm? I've seen worse.";
    if (stubborn > 0.4) return "Might want to head in soon.";
    return "Time to tie up the boat.";
  }
}

export default NPCSimulation;
