/**
 * @module craftmind-fishing/world-manager
 * @description Runtime world management — biome detection, weather, fishing spots.
 */

import { SITKA_LOCATIONS } from './sitka-world.js';

export class WorldManager {
  constructor(rconClient) {
    this.rcon = rconClient;
    this.locations = SITKA_LOCATIONS;
  }

  getNearestLocation(x, y, z) {
    let nearest = null;
    let minDist = Infinity;
    for (const [key, loc] of Object.entries(this.locations)) {
      const dist = Math.sqrt((x - loc.x) ** 2 + (y - loc.y) ** 2 + (z - loc.z) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = { key, ...loc, distance: dist };
      }
    }
    return nearest;
  }

  getBiomeAt(x, y, z) {
    const nearest = this.getNearestLocation(x, y, z);

    // Town area
    if (nearest.distance < 40 && (nearest.type === 'town' || nearest.type === 'building')) return 'town';

    // Deep water
    if (y < 55) return 'deep_water';

    // Beach/shore
    if (y >= 62 && y <= 65) return 'shore';

    // River
    if (nearest.type === 'fishing_spot' && nearest.name === 'Indian River Mouth' && nearest.distance < 30) return 'river';

    // Kelp forest
    if (nearest.name === 'Kelp Line' && nearest.distance < 30) return 'kelp_forest';

    // Ocean
    if (y >= 55 && y < 62) return 'ocean';

    // Tidal flat
    if (y >= 62 && y <= 63 && nearest.distance > 30) return 'tidal_flat';

    return 'ocean';
  }

  async send(cmd) {
    if (!this.rcon) return null;
    if (typeof this.rcon.send === 'function') return this.rcon.send(cmd);
    return null;
  }

  async spawnStructure(locationName) {
    const loc = Object.entries(this.locations).find(([k]) => k === locationName)?.[1];
    if (!loc) return false;
    // Place a marker sign at location
    await this.send(`/setblock ${loc.x} ${loc.y + 2} ${loc.z} oak_sign`);
    const escaped = JSON.stringify({ text: loc.name });
    await this.send(`/data merge block ${loc.x} ${loc.y + 2} ${loc.z} {front_text: {messages: [${escaped},"","",""]}}`);
    return true;
  }

  async setStorm() {
    await this.send('/weather thunder 9999');
    await this.send('/time set 18000');
  }

  async setClear() {
    await this.send('/weather clear 9999');
    await this.send('/time set 6000');
  }

  async setTide(level) {
    // Fill/remove water to simulate tide (level 0 = low, 1 = normal, 2 = high)
    const baseY = 62;
    const targetY = baseY + level - 1;
    // Fill a large water area
    await this.send(`/fill -200 ${targetY} -200 300 ${targetY} 300 water replace air`);
  }

  async spawnFishSchool(species, x, y, z) {
    // Use salmon entity for fish
    const entityMap = {
      salmon: 'salmon',
      cod: 'cod',
      pufferfish: 'pufferfish',
      tropical_fish: 'tropical_fish',
    };
    const entityType = entityMap[species] || 'salmon';
    const count = 5 + Math.floor(Math.random() * 6);
    const commands = [];
    for (let i = 0; i < count; i++) {
      const ox = x + Math.floor(Math.random() * 10) - 5;
      const oy = y + Math.floor(Math.random() * 4);
      const oz = z + Math.floor(Math.random() * 10) - 5;
      commands.push(`/summon ${entityType} ${ox} ${oy} ${oz}`);
    }
    for (const cmd of commands) {
      await this.send(cmd);
    }
    return count;
  }
}
