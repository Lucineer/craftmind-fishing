/**
 * Script Registry
 * Auto-discovers v1-*.js scripts, loads them dynamically, tracks stats.
 */
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ScriptRegistry {
  constructor() {
    this._scripts = new Map(); // name → { meta, module }
  }

  /**
   * Scan the scripts/ directory and import all v1-*.js files.
   */
  async loadAll() {
    const files = await readdir(__dirname);
    const vFiles = files.filter(f => /^v[0-9]+-.*\.js$/.test(f));

    for (const file of vFiles) {
      try {
        const mod = await import(`file://${join(__dirname, file)}`);
        const script = mod.default;
        if (!script || !script.name || !Array.isArray(script.steps)) {
          console.warn(`[Registry] Skipping ${file}: missing name or steps`);
          continue;
        }
        this._scripts.set(script.name, {
          meta: {
            name: script.name,
            description: script.description || '',
            hypothesis: script.hypothesis || '',
            version: script.version || 1,
            filename: file,
          },
          stats: script.stats || { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },
          steps: script.steps,
        });
        console.log(`[Registry] Loaded ${script.name} from ${file}`);
      } catch (err) {
        console.warn(`[Registry] Failed to load ${file}:`, err.message);
      }
    }

    return this._scripts.size;
  }

  /** Returns array of all script metadata. */
  list() {
    return [...this._scripts.values()].map(s => ({ ...s.meta, ...s.stats }));
  }

  /** Get a script by name. Returns { steps, stats } or null. */
  get(name) {
    const entry = this._scripts.get(name);
    return entry ? { steps: entry.steps, stats: entry.stats } : null;
  }

  /** Get steps for a script by name. */
  getSteps(name) {
    return this.get(name)?.steps ?? null;
  }

  /** Random weighted pick — scripts with better fish rates get more weight. */
  pick() {
    const entries = [...this._scripts.values()];
    if (entries.length === 0) return null;
    if (entries.length === 1) return entries[0].meta.name;

    const weights = entries.map(e => {
      const s = e.stats;
      // Base weight 1, bonus for fish caught, penalty for deaths
      const fishRate = s.totalChats > 0 ? (s.fishCaught / Math.max(s.totalChats, 1)) * 5 : 1;
      const deathPenalty = s.deaths * 2;
      return Math.max(0.1, 1 + fishRate - deathPenalty);
    });

    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < entries.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return entries[i].meta.name;
    }
    return entries[entries.length - 1].meta.name;
  }

  /** Update stats for a script. */
  updateStats(name, delta) {
    const entry = this._scripts.get(name);
    if (!entry) return;
    Object.assign(entry.stats, delta);
  }
}
