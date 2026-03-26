/**
 * @module craftmind-fishing/ai/skill-library
 * @description Fishing skill scripts — deterministic behavior functions that take
 * (bot, context) and execute fishing patterns. Includes session analysis and
 * pre-loaded starter skills.
 */

// ── Skill definition ─────────────────────────────────────────────────────────

/**
 * @typedef {object} Skill
 * @property {string} name
 * @property {string} description
 * @property {object} requirements - { rod?, boat?, bait?, weather?, permits? }
 * @property {number} successRate - 0-1, updated after use
 * @property {number} uses - total uses
 * @property {number} successes - total successes
 * @property {function} execute - (bot, context) => Promise<{ success: boolean, data?: object }>
 */

// ── Starter Skills ───────────────────────────────────────────────────────────

const TROLL_SALMON = {
  name: 'troll-salmon',
  description: 'Troll for salmon along the kelp line and bio island area.',
  requirements: { boat: true, bait: 'herring', permits: ['salmon'] },
  successRate: 0.65,
  uses: 0,
  successes: 0,

  async execute(bot, context) {
    // Navigate to fishing area
    if (context.navigateTo) await context.navigateTo('bio_island');
    if (context.chat) context.chat('Heading to the kelp line. Pink hoochies at 40 feet.');

    // Set gear
    if (context.setGear) await context.setGear({ rod: 'trolling', lure: 'hoochie-pink', depth: 40 });

    // Troll waypoints
    const waypoints = [
      { name: 'kelp line', x: 120, z: 250, speed: 3.5 },
      { name: 'bio island', x: 150, z: 300, speed: 3.5 },
      { name: 'inshore', x: 100, z: 200, speed: 3.0 },
    ];

    let totalCatch = [];
    for (const wp of waypoints) {
      if (context.trollTo) await context.trollTo(wp);
      if (context.chat) context.chat(`Trolling past ${wp.name} at ${wp.speed} knots.`);
      // Wait for bites (simulated)
      await new Promise(r => setTimeout(r, 10000));
      if (context.checkBite) {
        const bite = await context.checkBite();
        if (bite) {
          const caught = await context.reelIn();
          totalCatch = totalCatch.concat(caught || []);
        }
      }
    }

    const success = totalCatch.length > 0;
    return { success, data: { catch: totalCatch, waypoints: waypoints.length } };
  },
};

const BOTTOM_FISH_HALIBUT = {
  name: 'bottom-fish-halibut',
  description: 'Bottom fish for halibut in deep water channels.',
  requirements: { boat: true, bait: 'herring', permits: ['halibut'] },
  successRate: 0.50,
  uses: 0,
  successes: 0,

  async execute(bot, context) {
    if (context.navigateTo) await context.navigateTo('deep_channel');
    if (context.chat) context.chat('Setting up for halibut. Circle hooks, 200lb leader.');

    if (context.setGear) await context.setGear({ rod: 'boat', hook: 'circle_hook', leader: '200lb', depth: 150 });

    // Bottom fishing — drop and wait
    if (context.chat) context.chat('Dropping lines to the bottom. Patience.');
    await new Promise(r => setTimeout(r, 20000));

    if (context.checkBite) {
      const bite = await context.checkBite();
      if (bite) {
        const caught = await context.reelIn();
        return { success: caught?.length > 0, data: { catch: caught || [] } };
      }
    }

    return { success: false, data: { catch: [] } };
  },
};

const SPORT_FISH_SHORE = {
  name: 'sport-fish-from-shore',
  description: 'Cast from shore for rockfish and greenling. No boat needed.',
  requirements: { boat: false, bait: 'shrimp' },
  successRate: 0.70,
  uses: 0,
  successes: 0,

  async execute(bot, context) {
    if (context.navigateTo) await context.navigateTo('shore_point');
    if (context.chat) context.chat('Setting up on the rocks. Bait casting rig.');

    if (context.setGear) await context.setGear({ rod: 'spinning', hook: 'bait_hook', bait: 'shrimp' });

    // Multiple casts
    let totalCatch = [];
    for (let i = 0; i < 5; i++) {
      if (context.cast) await context.cast({ distance: 30 + Math.random() * 20 });
      await new Promise(r => setTimeout(r, 5000));
      if (context.checkBite) {
        const bite = await context.checkBite();
        if (bite) {
          const caught = await context.reelIn();
          totalCatch = totalCatch.concat(caught || []);
        }
      }
    }

    return { success: totalCatch.length > 0, data: { catch: totalCatch, casts: 5 } };
  },
};

// ── Skill Library ────────────────────────────────────────────────────────────

export class SkillLibrary {
  constructor() {
    this.skills = new Map();
    this._registerDefaults();
  }

  _registerDefaults() {
    for (const skill of [TROLL_SALMON, BOTTOM_FISH_HALIBUT, SPORT_FISH_SHORE]) {
      this.register({ ...skill, execute: skill.execute });
    }
  }

  /**
   * Register a skill.
   * @param {Skill} skill
   */
  register(skill) {
    this.skills.set(skill.name, {
      ...skill,
      uses: skill.uses || 0,
      successes: skill.successes || 0,
      successRate: skill.successRate || 0.5,
    });
  }

  /**
   * Get a skill by name.
   * @param {string} name
   * @returns {Skill|null}
   */
  get(name) {
    return this.skills.get(name) || null;
  }

  /**
   * Get all skills.
   * @returns {Skill[]}
   */
  getAll() {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills matching criteria.
   * @param {{ hasBoat?: boolean, permits?: string[], minSuccessRate?: number }} criteria
   * @returns {Skill[]}
   */
  findMatching(criteria = {}) {
    return this.getAll().filter(s => {
      if (criteria.hasBoat === false && s.requirements.boat) return false;
      if (criteria.hasBoat === true && s.requirements.boat === false) return false;
      if (criteria.permits) {
        const has = s.requirements.permits || [];
        if (!criteria.permits.every(p => has.includes(p))) return false;
      }
      if (criteria.minSuccessRate && s.successRate < criteria.minSuccessRate) return false;
      return true;
    }).sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Execute a skill and track results.
   * @param {string} name
   * @param {object} bot
   * @param {object} context
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async execute(name, bot, context) {
    const skill = this.skills.get(name);
    if (!skill) throw new Error(`Unknown skill: ${name}`);

    skill.uses++;
    try {
      const result = await skill.execute(bot, context);
      if (result.success) {
        skill.successes++;
        // Update rolling success rate
        skill.successRate = skill.successes / skill.uses;
      } else {
        skill.successRate = skill.successes / skill.uses;
      }
      return result;
    } catch (err) {
      // Skill execution failed
      skill.successRate = skill.successes / skill.uses;
      return { success: false, data: { error: err.message } };
    }
  }

  /**
   * Analyze a fishing session and suggest improvements.
   * @param {{ skillName: string, duration: number, catch: number, targetCatch: number, conditions: object }} session
   * @returns {{ rating: string, suggestions: string[], improvedSkill?: string }}
   */
  analyzeSession(session) {
    const skill = this.skills.get(session.skillName);
    if (!skill) return { rating: 'unknown', suggestions: ['Skill not found'] };

    const catchRate = session.duration > 0 ? session.catch / (session.duration / 3600) : 0;
    const suggestions = [];

    if (catchRate > 5) {
      return {
        rating: 'excellent',
        suggestions: ['Keep doing what you\'re doing. This skill is dialed in.'],
        improvedSkill: session.skillName,
      };
    }

    if (catchRate < 1) {
      suggestions.push('Low catch rate. Try different bait or location.');
      if (session.conditions?.weather === 'storm') {
        suggestions.push('Fishing in storms is rough. Wait for better weather.');
      }
      if (session.conditions?.tide === 'slack') {
        suggestions.push('Fish bite more on moving tides. Try outgoing tide.');
      }
    }

    if (session.catch > session.targetCatch * 0.8) {
      suggestions.push('Good session! Near target catch.');
    }

    if (skill.successRate < 0.3 && skill.uses > 5) {
      suggestions.push('This skill has a low success rate. Consider revising the approach.');
    }

    return {
      rating: catchRate > 3 ? 'good' : catchRate > 1 ? 'okay' : 'poor',
      suggestions,
      improvedSkill: session.skillName,
    };
  }
}

export default SkillLibrary;
