// CraftMind Fishing — ASCII Map Renderer
// Renders Sitka Sound as a text-based map.

import { BIOMES } from './sitka-sound.js';

const BIOME_CHARS = {
  open_ocean:       '.',
  sheltered_sound:  '~',
  kelp_forest:      '*',
  rocky_pinnacles:  '^',
  river_estuary:    ',',
  freshwater_river: '=',
  alpine_lake:      'o',
  tidal_flats:      '_',
  coral_reef:       '#',
  deep_trench:      ' ',
  land:             ' ',
  mountain:         'M',
  town:             '+',
};

const LANDMARK_CHARS = {
  island:    '~',
  town:      '+',
  mountain:  '^',
  volcano:   'V',
  lake:      'o',
  water:     '~',
  channel:   '!',
  fishing:   'F',
  cove:      'c',
  trench:    ' ',
};

export class MapRenderer {
  constructor(world) {
    this.world = world;
  }

  /** Render full map to string */
  renderFull(width = 80, height = 30) {
    if (!this.world.generated) throw new Error('World not generated. Call generate() first.');

    const scaleX = this.world.width / width;
    const scaleZ = this.world.height / height;

    let output = '';
    for (let vz = 0; vz < height; vz++) {
      let row = '';
      for (let vx = 0; vx < width; vx++) {
        const wx = Math.floor(vx * scaleX);
        const wz = Math.floor(vz * scaleZ);
        const biome = this.world.getBiome(wx, wz);

        // Check for landmark override
        const lm = this.world.getLandmark(wx, wz);
        const lmDist = lm ? Math.sqrt((wx - lm.cx) ** 2 + (wz - lm.cz) ** 2) : Infinity;

        let ch;
        if (lm && lmDist < lm.radius * 0.3 && (lm.type === 'town' || lm.type === 'volcano')) {
          ch = LANDMARK_CHARS[lm.type] ?? BIOME_CHARS[biome] ?? '?';
        } else if (lm && lmDist < lm.radius * 0.2 && lm.type === 'lake') {
          ch = 'o';
        } else if (lm && lmDist < lm.radius * 0.3 && (lm.type === 'fishing' || lm.type === 'trench')) {
          ch = LANDMARK_CHARS[lm.type] ?? BIOME_CHARS[biome] ?? '?';
        } else {
          ch = BIOME_CHARS[biome] ?? '?';
        }

        row += ch;
      }
      output += row + '\n';
    }
    return output;
  }

  /** Render minimap (smaller, with legend) */
  renderMinimap(width = 50, height = 25, playerX = null, playerZ = null) {
    if (!this.world.generated) throw new Error('World not generated. Call generate() first.');

    const scaleX = this.world.width / width;
    const scaleZ = this.world.height / height;

    let output = '';
    // Top border
    output += '╔' + '═'.repeat(width) + '╗\n';

    for (let vz = 0; vz < height; vz++) {
      let row = '║';
      for (let vx = 0; vx < width; vx++) {
        const wx = Math.floor(vx * scaleX);
        const wz = Math.floor(vz * scaleZ);

        // Player position
        if (playerX != null && playerZ != null) {
          const pw = Math.floor(playerX / scaleX);
          const pz = Math.floor(playerZ / scaleZ);
          if (pw === vx && pz === vz) {
            row += 'X';
            continue;
          }
        }

        const biome = this.world.getBiome(wx, wz);
        const depth = this.world.getDepth(wx, wz);

        // Depth-based shading for water
        if (biome === 'open_ocean') {
          row += depth > 70 ? ' ' : '.';
        } else if (biome === 'deep_trench') {
          row += ' ';
        } else if (biome === 'mountain') {
          row += 'M';
        } else if (biome === 'town') {
          row += '+';
        } else if (biome === 'land') {
          row += '▓';
        } else {
          row += BIOME_CHARS[biome] ?? '~';
        }
      }
      row += '║\n';
      output += row;
    }

    output += '╚' + '═'.repeat(width) + '╝\n';
    output += '\n  ═══ SITKA SOUND ═══\n';
    output += '  ~ Sound  * Kelp  . Ocean  M Mountain\n';
    output += '  + Town   _ Flats  o Lake  ^ Pinnacle\n';
    output += '  = River  , Estuary # Reef  V Volcano\n';
    output += '  F Fishing spot  X Player\n';

    return output;
  }

  /** Render local area around a point */
  renderLocal(cx, cz, radius = 10) {
    if (!this.world.generated) throw new Error('World not generated. Call generate() first.');

    let output = '';
    output += '    LOCAL MAP (center: ' + cx + ', ' + cz + ')\n';
    output += '    ' + '-'.repeat(radius * 2 + 1) + '\n';

    for (let dz = -radius; dz <= radius; dz++) {
      let row = '    ';
      for (let dx = -radius; dx <= radius; dx++) {
        const wx = cx + dx;
        const wz = cz + dz;
        if (dx === 0 && dz === 0) {
          row += 'X';
          continue;
        }
        const biome = this.world.getBiome(wx, wz);
        row += BIOME_CHARS[biome] ?? '?';
      }
      output += row + '\n';
    }

    // Info about center tile
    const biome = this.world.getBiome(cx, cz);
    const depth = this.world.getDepth(cx, cz);
    const temp = this.world.getTemperature(cx, cz);
    const lm = this.world.getLandmark(cx, cz);

    output += `    Biome: ${biome} | Depth: ${depth} | Temp: ${temp.toFixed(0)}°F\n`;
    if (lm) {
      const dist = Math.round(Math.sqrt((cx - lm.cx) ** 2 + (cz - lm.cz) ** 2));
      output += `    Near: ${lm.emoji} ${lm.name} (${dist} blocks away)\n`;
    }

    return output;
  }

  /** Render depth map */
  renderDepthMap(width = 50, height = 25) {
    if (!this.world.generated) throw new Error('World not generated. Call generate() first.');

    const scaleX = this.world.width / width;
    const scaleZ = this.world.height / height;
    const depthChars = ' .-:=+*#%@';

    let output = '';
    for (let vz = 0; vz < height; vz++) {
      let row = '';
      for (let vx = 0; vx < width; vx++) {
        const wx = Math.floor(vx * scaleX);
        const wz = Math.floor(vz * scaleZ);
        const biome = this.world.getBiome(wx, wz);
        if (biome === 'land' || biome === 'mountain' || biome === 'town') {
          row += '█';
        } else {
          const depth = this.world.getDepth(wx, wz);
          const idx = Math.min(depthChars.length - 1, Math.floor(depth / 15));
          row += depthChars[idx];
        }
      }
      output += row + '\n';
    }
    output += '  DEPTH MAP (█=land, .=shallow, @=deep)\n';
    return output;
  }
}

export default MapRenderer;
