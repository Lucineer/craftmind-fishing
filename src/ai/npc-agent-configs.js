/**
 * @module craftmind-fishing/ai/npc-agent-configs
 * @description Full agent configurations for all NPCs, bridging sitka-npcs.js
 * data into the agent system.
 */

import { NPCS } from '../town/sitka-npcs.js';
import { CODY_TRAITS, CODY_OPINIONS } from './personality.js';

// ── Cody (player_bot — mineflayer connected) ─────────────────────────────────

const CODY_CONFIG = {
  name: 'Cody',
  type: 'player_bot',
  personality: {
    traits: { ...CODY_TRAITS },
    opinions: { ...CODY_OPINIONS },
  },
  home: { x: 100, y: 64, z: 100 },
  location: 'home',
  skills: ['troll-salmon', 'bottom-fish-halibut', 'sport-fish-shore'],
};

// ── NPC configs derived from sitka-npcs.js ───────────────────────────────────

function npcConfig(npcId) {
  const npc = NPCS[npcId];
  if (!npc) return null;
  return {
    name: npc.name,
    type: 'npc',
    personality: null, // derived from npcData in Agent constructor
    home: { x: 200, y: 64, z: 200 }, // default, overridden per-NPC below
    location: npc.location?.building || 'unknown',
    skills: [],
    npcData: npc,
  };
}

const NPC_AGENTS = [
  CODY_CONFIG,
  {
    ...npcConfig('ernie'),
    home: { x: 200, y: 64, z: 200 },
  },
  {
    ...npcConfig('linda'),
    home: { x: 180, y: 64, z: 150 },
  },
  {
    ...npcConfig('captain_pete'),
    home: { x: 150, y: 64, z: 110 },
  },
  {
    ...npcConfig('mary'),
    home: { x: 170, y: 64, z: 125 },
  },
  {
    ...npcConfig('old_thomas'),
    home: { x: 220, y: 64, z: 180 },
  },
  {
    ...npcConfig('sarah'),
    home: { x: 190, y: 64, z: 165 },
  },
  {
    ...npcConfig('dave'),
    home: { x: 250, y: 64, z: 205 },
  },
  {
    ...npcConfig('captain_sig'),
    home: { x: 210, y: 64, z: 215 },
  },
  {
    ...npcConfig('jenna'),
    home: { x: 155, y: 64, z: 105 },
  },
  {
    ...npcConfig('old_salt'),
    home: { x: 145, y: 64, z: 95 },
  },
].filter(Boolean);

export { NPC_AGENTS, CODY_CONFIG };
export default NPC_AGENTS;
