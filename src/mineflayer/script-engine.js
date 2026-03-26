/**
 * Stochastic Script Engine for Cody
 * 
 * Instead of behavior trees, Cody runs SCRIPTS with weighted random choices
 * at strategic points. This creates natural variation without LLM calls.
 * 
 * Usage:
 *   const script = Script.define('fish', [
 *     Step.action('equip_rod', () => bot.equip(rod, 'hand')),
 *     Step.chat({ 0.5: 'Lines in.', 0.3: '*casts*', 0.2: null }),
 *     Step.fish(),
 *     Step.branch(
 *       () => caughtFish,
 *       Step.chat({ 0.6: 'Got one!', 0.4: 'Nice.' }),
 *       Step.chat({ 0.5: 'Nothing.', 0.3: 'Patience.', 0.2: null })
 *     ),
 *   ]);
 *   runner.run(script);
 */

export function weightedRandom(weights) {
  // Weights as Map or object. Keys are cumulative probabilities, values are outcomes.
  const entries = weights instanceof Map ? [...weights.entries()] : Object.entries(weights);
  const total = entries.reduce((s, [w]) => s + parseFloat(w), 0);
  if (total <= 0) return entries[0]?.[1] ?? null;
  let roll = Math.random() * total;
  for (const [w, outcome] of entries) {
    roll -= parseFloat(w);
    if (roll <= 0) return outcome;
  }
  return entries[entries.length - 1][1];
}

export class Step {
  static action(name, fn) {
    return { type: 'action', name, fn };
  }

  static chat(msgs) {
    // msgs can be a string, array of strings (uniform), or weighted map
    return {
      type: 'chat',
      pick: () => {
        if (typeof msgs === 'string') return msgs;
        if (Array.isArray(msgs)) return msgs[Math.floor(Math.random() * msgs.length)];
        return weightedRandom(msgs);
      }
    };
  }

  static wait(ms) {
    return { type: 'wait', ms };
  }

  static fish() {
    return { type: 'fish' };
  }

  static branch(condition, ifTrue, ifFalse) {
    return { type: 'branch', condition, ifTrue, ifFalse };
  }

  static goto(scriptName) {
    return { type: 'goto', scriptName };
  }

  static noop() {
    return { type: 'noop' };
  }

  static set(key, value) {
    return { type: 'set', key, value };
  }
}

export class MoodSystem {
  constructor() {
    this.mood = 0.5; // 0=miserable, 0.5=neutral, 1=elated
    this.energy = 1.0; // decreases over time, recovers on break
  }

  /**
   * Shift mood by amount. Clamped to 0-1.
   * Positive = good event, negative = bad event.
   */
  shift(amount, delay = 0) {
    const shift = () => {
      this.mood = Math.max(0, Math.min(1, this.mood + amount));
    };
    if (delay > 0) setTimeout(shift, delay);
    else shift();
  }

  /** How chatty should Cody be? 0-1. Higher mood = more chatty. */
  get chattiness() {
    return Math.max(0.1, Math.min(0.9, this.mood * 1.2));
  }

  /** Multiplier for action speed. Tired = slower, energetic = faster. */
  get speedMultiplier() {
    return 0.6 + this.energy * 0.8; // 0.6x to 1.4x
  }

  /** Natural decay: mood drifts toward neutral, energy drains */
  tick() {
    this.mood += (0.5 - this.mood) * 0.01; // drift toward neutral
    this.energy = Math.max(0.1, this.energy - 0.0005); // slow drain
  }
}

export class Script {
  constructor(name, steps) {
    this.name = name;
    this.steps = steps;
  }

  static define(name, steps) {
    return new Script(name, steps);
  }
}

export class ScriptRunner {
  constructor(bot, options = {}) {
    this.bot = bot;
    this.scripts = new Map();
    this.mood = options.mood || new MoodSystem();
    this.context = {
      fishCaught: 0,
      totalEarned: 0,
      playersSeen: new Set(),
      lastChatTime: 0,
      lastActionTime: 0,
      currentScript: null,
      interrupted: false,
      combatCooldown: 0,
    };
    this._running = false;
    this._currentScript = null;
    this._isFishing = false;
    this._tickInterval = null;

    // Wire up events
    this.bot.on('playerCollect', (collector, entity) => {
      if (collector.username === this.bot.username) {
        this.context.fishCaught++;
        this.mood.shift(0.05);
      }
    });

    this.bot.on('playerJoined', (player) => {
      if (player.username !== this.bot.username) {
        const isNew = !this.context.playersSeen.has(player.username);
        this.context.playersSeen.add(player.username);
        if (isNew) this.mood.shift(0.03);
      }
    });

    this.bot.on('entityHurt', (entity) => {
      if (entity === this.bot.entity) {
        this.mood.shift(-0.15);
        // Interrupt current script for combat
        this.interrupt('combat');
      }
    });

    this.bot.on('death', () => {
      this.mood.shift(-0.25);
      this.interrupt('death');
    });

    this.bot.on('respawn', () => {
      this.mood.shift(0.1);
      this.context.fishCaught = 0;
    });
  }

  register(script) {
    this.scripts.set(script.name, script);
    return this;
  }

  async run(scriptNameOrScript) {
    const script = typeof scriptNameOrScript === 'string'
      ? this.scripts.get(scriptNameOrScript)
      : scriptNameOrScript;

    if (!script) {
      console.error(`[ScriptRunner] Script not found: ${scriptNameOrScript}`);
      return;
    }

    this._currentScript = script;
    this.context.currentScript = script.name;
    this._running = true;

    try {
      await this._executeSteps(script.steps);
    } catch (err) {
      if (err.message !== 'INTERRUPTED') {
        console.error(`[ScriptRunner] Error in ${script.name}:`, err.message);
      }
    } finally {
      this._currentScript = null;
      this.context.currentScript = null;
      this._running = false;
    }
  }

  interrupt(reason) {
    this._running = false;
    this.context.interrupted = true;
    this.context.interruptedReason = reason;
  }

  get isRunning() {
    return this._running;
  }

  get currentScript() {
    return this._currentScript?.name;
  }

  /** Auto-run: picks next script based on context after current finishes */
  startAutoRun(tickMs = 2000) {
    this._tickInterval = setInterval(() => {
      this.mood.tick();
      if (!this._running) {
        this._pickNextScript();
      }
    }, tickMs);
  }

  stopAutoRun() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  _pickNextScript() {
    if (this.context.combatCooldown > Date.now()) {
      // Recently in combat, just idle briefly
      return;
    }

    const hasPlayers = this.context.playersSeen.size > 0;
    const energy = this.mood.energy;
    const mood = this.mood.mood;

    // Weighted choice of what to do next
    const choices = [];

    // Fishing is always an option
    choices.push({ w: 0.45, script: 'afternoon_fish' });

    // Social if players around and mood is good
    if (hasPlayers && mood > 0.3) {
      choices.push({ w: 0.20, script: 'greet_player' });
    }

    // Break if tired
    if (energy < 0.4) {
      choices.push({ w: 0.25, script: 'take_break' });
    }

    // Wander around sometimes
    choices.push({ w: 0.10, script: 'look_around' });

    // Normalize weights
    const total = choices.reduce((s, c) => s + c.w, 0);
    let roll = Math.random() * total;
    for (const c of choices) {
      roll -= c.w;
      if (roll <= 0) {
        this.run(c.script);
        return;
      }
    }
    this.run('afternoon_fish');
  }

  async _executeSteps(steps) {
    for (let i = 0; i < steps.length; i++) {
      if (!this._running) throw new Error('INTERRUPTED');
      await this._executeStep(steps[i]);
      // Natural delay between steps (affected by mood/energy)
      await this._naturalDelay();
    }
  }

  async _executeStep(step) {
    if (!this._running) throw new Error('INTERRUPTED');

    switch (step.type) {
      case 'action':
        try {
          await step.fn();
        } catch (e) {
          console.error(`[ScriptRunner] Action "${step.name}" error:`, e.message);
        }
        break;

      case 'chat': {
        // Check chattiness — sometimes just don't say anything
        if (Math.random() > this.mood.chattiness) break;
        // Rate limit: don't chat more than once every 3 seconds
        if (Date.now() - this.context.lastChatTime < 3000) break;
        const msg = step.pick();
        if (msg && typeof msg === 'string') {
          this.bot.chat(msg);
          this.context.lastChatTime = Date.now();
        }
        break;
      }

      case 'wait':
        await this._wait(step.ms * (2 - this.mood.speedMultiplier));
        break;

      case 'fish':
        if (!this._running) throw new Error('INTERRUPTED');
        if (this._isFishing) break; // Prevent concurrent bot.fish() calls
        try {
          this._isFishing = true;
          // Equip fishing rod
          const rod = this.bot.inventory.items().find(i => i.name.includes('fishing_rod'));
          if (!rod) {
            this._isFishing = false;
            break; // No rod, skip fishing
          }
          await this.bot.equip(rod, 'hand');
          // Find water — MUST be within 6 blocks
          const waterBlock = this.bot.findBlock({
            matching: this.bot.registry.blocksByName.water?.id,
            maxDistance: 6,
          });
          if (!waterBlock) {
            // No water nearby — move toward spawn/dock
            this._isFishing = false;
            break;
          }
          this.bot.lookAt(waterBlock.position);
          // Wait a beat before casting
          await this._wait(800);
          if (!this._running) throw new Error('INTERRUPTED');
          // Cast
          await this.bot.fish();
        } catch (e) {
          if (e.message !== 'INTERRUPTED') {
            console.error('[ScriptRunner] Fish error:', e.message);
          }
        } finally {
          this._isFishing = false;
        }
        break;

      case 'branch': {
        const result = step.condition();
        const branch = result ? step.ifTrue : step.ifFalse;
        // Branch target can be a single step or an array
        if (Array.isArray(branch)) {
          await this._executeSteps(branch);
        } else {
          await this._executeStep(branch);
        }
        break;
      }

      case 'goto': {
        const target = this.scripts.get(step.scriptName);
        if (target) {
          this._currentScript = target;
          this.context.currentScript = target.name;
          await this._executeSteps(target.steps);
        }
        break;
      }

      case 'set':
        this.context[step.key] = step.value;
        break;

      case 'noop':
        break;
    }
  }

  _naturalDelay() {
    const base = 400;
    const variance = this.mood.speedMultiplier * 600;
    const ms = base + Math.random() * variance;
    return this._wait(ms);
  }

  _wait(ms) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      // Store rejector for interrupts
      this._interruptReject = () => {
        clearTimeout(timeout);
        reject(new Error('INTERRUPTED'));
      };
    });
  }

  // ── Hot-Swap Support ──────────────────────────────────────

  /**
   * Switch to a new script by name. Stops current, pauses briefly, then starts new.
   * @param {string} name - Script name
   * @param {string} [transitionChat] - Optional chat message during transition
   */
  async switchScript(name, transitionChat = null) {
    const script = this.scripts.get(name);
    if (!script) {
      console.error(`[ScriptRunner] switchScript: not found: ${name}`);
      return;
    }

    const oldName = this._currentScript?.name;
    this.interrupt('switch');

    // Brief pause for natural transition
    if (transitionChat && this.bot) {
      this.bot.chat(transitionChat);
    }
    await new Promise(r => setTimeout(r, 1500));

    console.log(`[ScriptRunner] Switch: ${oldName} → ${name}`);
    this.context.interrupted = false;
    this.run(script);
  }

  /**
   * Switch to a v1-format script (loaded from registry).
   * Registers it under its name if not already registered, then switches.
   * @param {{ steps: Array, stats: Object, name?: string }} scriptData
   */
  async switchToV1(scriptData, transitionChat = null) {
    if (!scriptData || !scriptData.steps) return;

    // Create a Script object and register it
    const name = scriptData.name || `v1_${Date.now()}`;
    if (!this.scripts.has(name)) {
      this.register(new Script(name, scriptData.steps));
    }

    await this.switchScript(name, transitionChat);
  }

  /** Pick a random script and switch to it (for A/B testing). */
  async randomSwitch(registry = null, transitionChat = null) {
    let name;
    if (registry && typeof registry.pick === 'function') {
      name = registry.pick();
    } else {
      // Fallback: random from registered scripts
      const names = [...this.scripts.keys()];
      if (names.length === 0) return;
      name = names[Math.floor(Math.random() * names.length)];
    }

    const chat = transitionChat || 'Alright, switching it up.';
    await this.switchScript(name, chat);
  }
}
