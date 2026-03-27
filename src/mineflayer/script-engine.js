/**
 * Stochastic Script Engine for Cody
 *
 * Instead of behavior trees, Cody runs SCRIPTS with weighted random choices
 * at strategic points. This creates natural variation without LLM calls.
 *
 * MODES:
 * 1. Flat Mode (default): Traditional linear step sequences
 * 2. Tree Mode: Hierarchical skill trees with preconditions/postconditions
 *
 * Usage:
 *   // Flat mode
 *   const script = Script.define('fish', [
 *     Step.action('equip_rod', () => bot.equip(rod, 'hand')),
 *     Step.chat({ 0.5: 'Lines in.', 0.3: '*casts*', 0.2: null }),
 *     Step.fish(),
 *   ]);
 *   runner.run(script);
 *
 *   // Tree mode
 *   const treeScript = Script.define('fish', {
 *     tree: {
 *       root: 'master_fisher',
 *       nodes: {
 *         'master_fisher': { children: ['equip_and_position', 'fishing_session'] },
 *         'equip_and_position': { steps: [{type:'equip_rod'}, {type:'move_to_water'}] },
 *         'fishing_session': { children: ['cast_and_wait', 'reel_and_process'] },
 *         'cast_and_wait': { steps: [{type:'fish'}, {type:'wait', ms:3000}] },
 *         'reel_and_process': { steps: [{type:'chat', pick:()=>'Nice catch!'}] }
 *       }
 *     }
 *   });
 *   runner.run(treeScript);
 */

import { SkillTree, createSkillTree } from './skill-tree.js';


// Access pathfinder goals via bot instance (avoid dual ESM/CJS loading)
function getGoals(bot) { return bot?.pathfinder?.goals; }

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
    this.energy = Math.max(0.1, this.energy - 0.0002); // very slow drain (was 0.0005)
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
    this.pluginCtx = options.pluginCtx || null; // Fishing plugin context for verbose/achievements
    this.context = {
      fishCaught: 0,
      totalEarned: 0,
      playersSeen: new Set(),
      lastChatTime: 0,
      lastActionTime: 0,
      currentScript: null,
      interrupted: false,
      combatCooldown: 0,
      // Tree mode context
      has_rod: false,
      ready_to_fish: false,
      hooked_fish: false,
      at_water: false,
    };
    this._running = false;
    this._currentScript = null;
    this._isFishing = false;
    this._tickInterval = null;
    // Tree mode support
    this._skillTree = null;
    this._treeMode = false;
    this._treeLoopInterval = null;

    // Built-in action handlers (for step.exec strings)
    this.actions = {
      look_around: () => {
        this.bot.look(
          this.bot.entity.yaw + (Math.random() - 0.5) * Math.PI,
          Math.PI / 6 + Math.random() * Math.PI / 6,
        );
      },
      equip_rod: () => {
        const rod = this.bot.inventory.items().find(i => i.name === 'fishing_rod');
        if (rod) this.bot.equip(rod, 'hand');
      },
    };

    // Wire up events
    this.bot.on('playerCollect', (collector, entity) => {
      if (collector.username === this.bot.username) {
        this.context.fishCaught++;
        this.mood.shift(0.05);
        this.mood.energy = Math.min(1.0, this.mood.energy + 0.05); // recover energy on catch
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
    console.log(`[ScriptRunner] ✅ Registered script: ${script.name} (${script.steps?.length || 0} steps)`);
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

    // Check if script uses tree mode
    if (script.tree) {
      this._treeMode = true;
      console.log(`[ScriptRunner] 🌳 Running in TREE mode: ${script.name}`);
      await this._runTreeMode(script);
    } else {
      this._treeMode = false;
      console.log(`[ScriptRunner] ▶ Running in FLAT mode: ${script.name} (${script.steps?.length || 0} steps)`);
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
  }

  /**
   * Run script in tree mode (hierarchical skill execution)
   * @private
   */
  async _runTreeMode(script) {
    try {
      // Create skill tree from script
      this._skillTree = createSkillTree(this.bot.username, script);

      console.log(`[SkillTree] ${this._skillTree.toASCII()}`);

      // Start the tree loop
      this._startTreeLoop();

    } catch (err) {
      if (err.message !== 'INTERRUPTED') {
        console.error(`[ScriptRunner] Tree mode error in ${script.name}:`, err.message);
      }
    } finally {
      this._currentScript = null;
      this.context.currentScript = null;
      this._running = false;
      this._treeMode = false;
    }
  }

  /**
   * Start the tree execution loop
   * @private
   */
  _startTreeLoop() {
    if (this._treeLoopInterval) {
      clearInterval(this._treeLoopInterval);
    }

    this._treeLoopInterval = setInterval(async () => {
      if (!this._running || !this._skillTree) {
        clearInterval(this._treeLoopInterval);
        return;
      }

      // Check if tree is complete
      if (this._skillTree.isComplete()) {
        console.log('[SkillTree] 🌳 Tree execution complete! Restarting...');
        this._skillTree.reset();
        this._skillTree.start(this._skillTree.root.name);
        return;
      }

      // Get next step to execute
      const step = this._skillTree.advance();

      if (!step) {
        // No current step - waiting for children or tree complete
        return;
      }

      // Execute the step
      try {
        await this._executeStep(step);

        // Mark step as completed
        this._skillTree.completeStep(true);

        // Check if node is complete
        const currentNode = this._skillTree.currentNode;
        if (currentNode && currentNode.currentStepIndex >= currentNode.steps.length) {
          this._skillTree.completeNode(true, 'All steps executed');
        }

      } catch (err) {
        if (err.message === 'INTERRUPTED') {
          this._skillTree.completeNode(false, 'Interrupted');
        } else {
          console.error(`[SkillTree] Step execution error:`, err.message);
          this._skillTree.completeStep(false);
        }
      }
    }, 1000); // Check every second
  }

  /**
   * Stop tree execution loop
   */
  _stopTreeLoop() {
    if (this._treeLoopInterval) {
      clearInterval(this._treeLoopInterval);
      this._treeLoopInterval = null;
    }
  }

  interrupt(reason) {
    this._running = false;
    this.context.interrupted = true;
    this.context.interruptedReason = reason;

    // Stop tree loop if running
    if (this._treeMode) {
      this._stopTreeLoop();
      if (this._skillTree?.currentNode) {
        this._skillTree.completeNode(false, `Interrupted: ${reason}`);
      }
    }
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
      try {
        this.mood.tick();
        if (!this._running) {
          this._pickNextScript();
        }
      } catch (e) {
        console.error('[ScriptRunner] Auto-run error:', e.message);
      }
    }, tickMs);
  }

  stopAutoRun() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
    // Also stop tree loop
    this._stopTreeLoop();
  }

  _pickNextScript() {
    if (this.context.combatCooldown > Date.now()) {
      return;
    }

    // If we have registered scripts, pick from them (weighted by mood/context)
    if (this.scripts.size > 0) {
      const hasPlayers = this.context?.playersSeen instanceof Set ? this.context.playersSeen.size > 0 : false;
      const energy = this.mood.energy;
      
      // Build weighted choices from registered scripts
      const choices = [];
      for (const [name, script] of this.scripts) {
        let weight = 1.0;
        // Prefer fishing scripts when no players around
        if (name.includes('fish') && !hasPlayers) weight *= 1.5;
        // Prefer social scripts when players are near
        if (name.includes('social') && hasPlayers) weight *= 1.5;
        // Reduce weight for tired-specific scripts when energy is high
        if (name.includes('lazy') || name.includes('break')) {
          weight *= (1.2 - energy);
        }
        choices.push({ w: Math.max(weight, 0.1), script: name });
      }
      
      const total = choices.reduce((s, c) => s + c.w, 0);
      let roll = Math.random() * total;
      for (const c of choices) {
        roll -= c.w;
        if (roll <= 0) {
          console.log(`[ScriptRunner] 🎲 Auto-picked script: ${c.script} (energy: ${this.mood.energy.toFixed(2)}, players: ${this.context.playersSeen.size})`);
          this.run(c.script);
          return;
        }
      }
    }

    // Fallback: try the legacy script names if they exist
    const fallback = this.scripts.has('afternoon_fish') ? 'afternoon_fish' :
                     [...this.scripts.keys()][0] || null;
    if (fallback) {
      console.log(`[ScriptRunner] 🔄 Fallback to script: ${fallback}`);
      this.run(fallback);
    }
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

    // Debug logging for step execution
    if (process.env.DEBUG_SCRIPTS || step.type === 'fish') {
      console.log(`[ScriptRunner] 🔧 Executing step: ${step.type}${step.name ? ` (${step.name})` : ''}${step.scriptName ? ` -> ${step.scriptName}` : ''}`);
    }

    // ── Verbose Narration ───────────────────────────────────────
    // If verbose mode is on, narrate the action before executing
    if (this.pluginCtx?._verbose && this.bot?.chat) {
      const narration = this._narrateStep(step);
      if (narration && narration.length < 80) {
        this.bot.chat(narration);
      }
    }

    switch (step.type) {
      case 'action':
        try {
          if (step.fn) {
            await step.fn();
          } else if (step.exec && this.actions && this.actions[step.exec]) {
            await this.actions[step.exec]();
          } else {
            console.warn(`[ScriptRunner] Action "${step.name || step.exec}" has no fn/exec handler`);
          }
        } catch (e) {
          console.error(`[ScriptRunner] Action "${step.name || step.exec}" error:`, e.message);
        }
        break;

      case 'chat': {
        // Check chattiness — sometimes just don't say anything
        if (Math.random() > this.mood.chattiness) break;
        // Rate limit: don't chat more than once every 3 seconds
        if (Date.now() - this.context.lastChatTime < 5000) break;
        const msg = step.pick();
        if (msg && typeof msg === 'string') {
          await new Promise(r => setTimeout(r, Math.random() * 2000));
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
          // Equip fishing rod (gather + craft if missing)
          let rod = this.bot.inventory.items().find(i => i.name.includes('fishing_rod'));
          if (!rod) {
            // Throttle: only try every 30s to avoid log spam
            const now = Date.now();
            if (!this._lastRodAttempt || now - this._lastRodAttempt > 30000) {
              this._lastRodAttempt = now;
              console.log('[ScriptRunner] No fishing rod — gathering materials...');
              try {
                // 1. Gather wood if needed
                const logTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'mangrove_log'];
                const hasLogs = this.bot.inventory.items().some(i => logTypes.includes(i.name));
                const hasPlanks = this.bot.inventory.items().some(i => i.name.includes('planks'));
                if (!hasLogs && !hasPlanks) {
                  // Find and chop a tree
                  const treeBlock = this.bot.findBlock({
                    matching: logTypes.map(l => this.bot.registry.blocksByName[l]?.id).filter(Boolean),
                    maxDistance: 20,
                  });
                  if (treeBlock) {
                    const pg = this.bot.pathfinder.goals;
                    this.bot.pathfinder.setGoal(new pg.GoalBlock(treeBlock.x, treeBlock.y, treeBlock.z));
                    await this._wait(5000);
                    // Break the block
                    const targetBlock = this.bot.blockAt(treeBlock.position);
                    if (targetBlock) {
                      await this.bot.dig(targetBlock);
                      console.log('[ScriptRunner] Chopped a tree');
                      // Collect drops
                      this.bot.setControlState('forward', true);
                      await this._wait(1000);
                      this.bot.setControlState('forward', false);
                    }
                  } else {
                    console.warn('[ScriptRunner] No trees nearby! Cannot get wood.');
                  }
                }
                // 2. Craft planks from logs
                const logItem = this.bot.inventory.items().find(i => logTypes.includes(i.name));
                if (logItem && !hasPlanks) {
                  const plankRecipe = this.bot.recipesFor(logItem.name, null, 1, null);
                  if (plankRecipe?.length) {
                    await this.bot.craft(plankRecipe[0], 1);
                    console.log('[ScriptRunner] Crafted planks');
                  }
                }
                // 3. Craft sticks from planks
                const plankItem = this.bot.inventory.items().find(i => i.name.includes('planks'));
                if (plankItem) {
                  const stickRecipe = this.bot.recipesFor('stick', null, 1, null);
                  if (stickRecipe?.length) {
                    await this.bot.craft(stickRecipe[0], 4);
                    console.log('[ScriptRunner] Crafted sticks');
                  }
                }
                // 4. Try craft fishing rod (needs 3 sticks + 2 strings + 1 plank — but skip if no string)
                // Fishing rod is shaped, needs crafting table. Find one or skip.
                const stringCount = this.bot.inventory.items().filter(i => i.name === 'string').reduce((s, i) => s + i.count, 0);
                if (stringCount >= 2) {
                  const craftingTableId = this.bot.registry.blocksByName.crafting_table?.id;
                  let tableBlock = null;
                  if (craftingTableId) {
                    tableBlock = this.bot.findBlock({ matching: craftingTableId, maxDistance: 6 });
                  }
                  if (tableBlock) {
                    const rodRecipe = this.bot.recipesFor('fishing_rod', null, 1, tableBlock);
                    if (rodRecipe?.length) {
                      await this.bot.craft(rodRecipe[0], 1);
                      rod = this.bot.inventory.items().find(i => i.name.includes('fishing_rod'));
                      console.log('[ScriptRunner] Crafted fishing rod! 🎣');
                    }
                  } else {
                    // No crafting table nearby — craft one from planks
                    if (plankItem) {
                      const tableRecipe = this.bot.recipesFor('crafting_table', null, 1, null);
                      if (tableRecipe?.length) {
                        await this.bot.craft(tableRecipe[0], 1);
                        console.log('[ScriptRunner] Crafted crafting table');
                        // Place it
                        const tableItem = this.bot.inventory.items().find(i => i.name === 'crafting_table');
                        if (tableItem) {
                          await this.bot.equip(tableItem, 'hand');
                          const placePos = this.bot.entity.position.offset(0, 0, 2);
                          const placeBlock = this.bot.blockAt(placePos);
                          if (placeBlock) {
                            await this.bot.placeBlock(placeBlock, this.bot.entity.position);
                            console.log('[ScriptRunner] Placed crafting table');
                            const rodRecipe = this.bot.recipesFor('fishing_rod', null, 1, this.bot.blockAt(placePos));
                            if (rodRecipe?.length) {
                              await this.bot.craft(rodRecipe[0], 1);
                              rod = this.bot.inventory.items().find(i => i.name.includes('fishing_rod'));
                              console.log('[ScriptRunner] Crafted fishing rod! 🎣');
                            }
                          }
                        }
                      }
                    }
                  }
                } else {
                  console.log(`[ScriptRunner] Need 2 string for fishing rod (have ${stringCount}) — killing spiders needed`);
                }
              } catch (gatherErr) {
                console.warn(`[ScriptRunner] Gather/craft failed: ${gatherErr.message}`);
              }
            }
            if (!rod) {
              this._isFishing = false;
              // Wait 30s before trying again to avoid spam loop
              console.log('[ScriptRunner] No rod available — waiting 30s');
              await this._wait(30000);
              break;
            }
          }
          await this.bot.equip(rod, 'hand');
          // Find water — MUST be within 6 blocks
          const waterId = this.bot.registry.blocksByName.water?.id;
          if (!waterId) {
            console.warn('[ScriptRunner] Water block ID not found in registry!');
            this._isFishing = false;
            break;
          }
          const waterBlock = this.bot.findBlock({
            matching: waterId,
            maxDistance: 12,
          });
          if (!waterBlock) {
            console.warn(`[ScriptRunner] No water within 6 blocks (pos: ${this.bot.entity.position})`);
            // No water nearby — use pathfinder to find water or return to dock
            try {
              // First try: find any water within 32 blocks
              let farWater = this.bot.findBlock({
                matching: waterId,
                maxDistance: 32,
                useExtraInfo: false,
              });
              let goalPos;
              if (farWater) {
                goalPos = farWater.position;
              } else {
                // Fallback: walk toward origin dock area
                goalPos = this.bot.entity.position.offset(
                  -this.bot.entity.position.x, 0, -this.bot.entity.position.z
                );
                goalPos = goalPos.normalize().scale(8);
              }
              const pg = this.bot.pathfinder.goals;
              this.bot.pathfinder.setGoal(new pg.GoalNear(goalPos.x, goalPos.y, goalPos.z, 3));
              console.log(`[ScriptRunner] Pathing to water at (${goalPos.x.toFixed(1)}, ${goalPos.y.toFixed(1)}, ${goalPos.z.toFixed(1)})`);
              await this._wait(8000); // Give pathfinder time to navigate
              this.bot.pathfinder.setGoal(null); // Clear goal
            } catch (e) {
              console.error('[ScriptRunner] Find-water path error:', e.message);
            }
            this._isFishing = false;
            break;
          }
          this.bot.lookAt(waterBlock.position);
          // Wait a beat before casting
          await this._wait(800);
          if (!this._running) throw new Error('INTERRUPTED');
          // Cast with timeout (Minecraft fishing can hang in test servers)
          console.log('[ScriptRunner] Casting line...');
          const fishPromise = this.bot.fish();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fishing timeout (90s)')), 90000)
          );
          await Promise.race([fishPromise, timeoutPromise]);
          console.log('[ScriptRunner] Line reeled in');
        } catch (e) {
          if (e.message !== 'INTERRUPTED') {
            console.error('[ScriptRunner] Fish error:', e.message);
          }
          // Back off after cancellation to avoid rapid re-cast loop
          if (e.message?.includes('cancelled')) {
            await this._wait(2000 + Math.random() * 3000);
          }
        } finally {
          this._isFishing = false;
        }
        // Brief pause between fishing attempts to let server settle
        await this._wait(500);
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

  /**
   * Generate a narration message for a step (used in verbose mode)
   * @param {Object} step - Step object
   * @returns {string|null} Narration message or null
   */
  _narrateStep(step) {
    const mood = this.mood;
    const moodText = mood?.energy > 0.7 ? 'feeling energetic' :
                     mood?.happiness > 0.7 ? 'feeling happy' :
                     mood?.energy < 0.3 ? 'feeling tired' : 'feeling okay';

    switch (step.type) {
      case 'fish':
        const fishReasons = [
          `I see water nearby, going to cast my line.`,
          `Time to fish. ${moodText}, hoping for a bite.`,
          `Going to cast here. ${moodText}.`,
          `Fishing now. Let's see what I catch.`,
        ];
        return fishReasons[Math.floor(Math.random() * fishReasons.length)];

      case 'chat':
        return null; // Don't narrate chat steps (the chat itself is the output)

      case 'wait':
        const waitReasons = [
          `Taking a short break to observe.`,
          `Waiting a moment. ${moodText}.`,
          `Pausing briefly.`,
        ];
        return waitReasons[Math.floor(Math.random() * waitReasons.length)];

      case 'action':
        if (step.name === 'look_around') {
          return `Looking around to check my surroundings.`;
        }
        if (step.name === 'equip_rod') {
          return `Getting my fishing rod ready.`;
        }
        return `Taking action: ${step.name || 'unknown'}.`;

      case 'branch':
        return `Making a decision based on conditions.`;

      case 'goto':
        return `Moving to script: ${step.scriptName}.`;

      default:
        return null;
    }
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

  // ── Tree Mode Methods ─────────────────────────────────────

  /**
   * Check if currently running in tree mode
   */
  isTreeMode() {
    return this._treeMode && this._skillTree !== null;
  }

  /**
   * Get skill tree status for display
   * @returns {Object|null} Tree status or null if not in tree mode
   */
  getTreeStatus() {
    if (!this._skillTree) return null;
    return this._skillTree.getStatus();
  }

  /**
   * Get skill tree status formatted for chat
   * @returns {string} Formatted status message
   */
  getTreeStatusMessage() {
    if (!this._skillTree) return 'Not in tree mode';
    return this._skillTree.getStatusMessage();
  }

  /**
   * Get skill tree ASCII representation
   * @returns {string} ASCII tree diagram
   */
  getTreeASCII() {
    if (!this._skillTree) return 'No active skill tree';
    return this._skillTree.toASCII();
  }
}
