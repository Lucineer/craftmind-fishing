/**
 * @module craftmind-fishing/ai/action-executor
 * @description Tick-based action executor that runs actions sequentially with humanized timing.
 * Bridges structured actions to mineflayer bot and game engine operations.
 */

import { ACTION_TYPES } from './action-schema.js';

export class ActionExecutor {
  /**
   * @param {Object} bot - Mineflayer bot instance
   * @param {Object} humanizer - Humanizer instance for natural timing
   * @param {Object} game - SitkaFishingGame instance (optional)
   * @param {Object} actions - Actions module instance (for movements)
   */
  constructor(bot, humanizer, game = null, actions = null) {
    this.bot = bot;
    this.humanizer = humanizer;
    this.game = game;
    this.actions = actions;

    /** @type {Array<{type: string, params: Object, reasoning: string}>} */
    this.queue = [];
    /** @type {Object|null} */
    this.current = null;
    this.running = false;
    this.paused = false;

    /** @type {number} */
    this._tickTimer = null;
    /** @type {number} */
    this._tickInterval = 500; // ms
    /** @type {Function} */
    this._onChat = null;
    /** @type {Function} */
    this._onComplete = null;
    /** @type {Function} */
    this._onError = null;
  }

  /**
   * Set callbacks.
   * @param {Object} callbacks
   * @param {Function} [callbacks.onChat] - Called when CHAT action executes: (message) => void
   * @param {Function} [callbacks.onComplete] - Called when all actions finish
   * @param {Function} [callbacks.onError] - Called on action error: (error, action) => void
   * @param {Function} [callbacks.onActionStart] - Called when an action starts: (action) => void
   */
  on(callbacks) {
    if (callbacks.onChat) this._onChat = callbacks.onChat;
    if (callbacks.onComplete) this._onComplete = callbacks.onComplete;
    if (callbacks.onError) this._onError = callbacks.onError;
    if (callbacks.onActionStart) this._onActionStart = callbacks.onActionStart;
  }

  /**
   * Enqueue a plan of actions.
   * @param {Array<{type: string, params: Object, reasoning: string}>} actions
   */
  enqueue(actions) {
    this.queue.push(...actions);
    if (!this.running) this.start();
  }

  /**
   * Clear the queue and stop execution.
   */
  stop() {
    this.running = false;
    this.current = null;
    this.queue = [];
    if (this._tickTimer) {
      clearInterval(this._tickTimer);
      this._tickTimer = null;
    }
    // Cancel bot pathfinder
    if (this.bot?.pathfinder) {
      this.bot.pathfinder.setGoal(null);
    }
  }

  /**
   * Pause execution (current action finishes, next won't start).
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume execution.
   */
  resume() {
    this.paused = false;
    if (!this.running && this.queue.length > 0) this.start();
  }

  /**
   * Start the tick loop.
   */
  start() {
    if (this.running) return;
    this.running = true;
    this._tickTimer = setInterval(() => this.tick(), this._tickInterval);
  }

  /**
   * Execute one tick: pick next action or continue current.
   */
  async tick() {
    if (!this.running || this.paused) return;

    try {
      // Pick next action
      if (!this.current && this.queue.length > 0) {
        this.current = this.queue.shift();
        if (this._onActionStart) this._onActionStart(this.current);
      }

      if (this.current) {
        const done = await this.executeOne(this.current);
        if (done) {
          this.current = null;
          // Check if queue is empty
          if (this.queue.length === 0 && this._onComplete) {
            this._onComplete();
            // Keep running in case more actions get queued
          }
        }
      }
    } catch (err) {
      if (this._onError) {
        this._onError(err, this.current);
      }
      this.current = null; // Skip failed action
    }
  }

  /**
   * Execute a single action.
   * @param {{type: string, params: Object, reasoning: string}} action
   * @returns {Promise<boolean>} true if action completed
   */
  async executeOne(action) {
    const { type, params = {} } = action;

    switch (type) {
      case 'MOVE':
        return await this._execMove(params);
      case 'FISH':
        return await this._execFish(params);
      case 'CAST':
        return await this._execCast(params);
      case 'REEL':
        return await this._execReel(params);
      case 'EQUIP':
        return await this._execEquip(params);
      case 'USE_ITEM':
        return await this._execUseItem(params);
      case 'CHAT':
        return await this._execChat(params);
      case 'WAIT':
        return await this._execWait(params);
      case 'LOOK_AT':
        return await this._execLookAt(params);
      case 'FOLLOW':
        return await this._execFollow(params);
      case 'SELL':
        return await this._execSell(params);
      case 'BUY':
        return await this._execBuy(params);
      case 'CHECK':
        return await this._execCheck(params);
      case 'STOP':
        this.stop();
        return true;
      default:
        // Unknown action type — skip
        return true;
    }
  }

  // ── Action Implementations ───────────────────────────────────────────────

  async _execMove(params) {
    const { target } = params;
    if (!target) return true;

    if (this.actions?.walkTo && typeof target === 'object' && target.x != null) {
      await this.actions.walkTo(target.x, target.y, target.z);
      return true;
    }

    if (this.actions?.walkTo && typeof target === 'string') {
      // Walk to named location — try to resolve
      await this.actions.walkTo(parseFloat(target) || 0, 64, 0);
      return true;
    }

    return true;
  }

  async _execFish(params) {
    const { method, location, bait, depth } = params;

    if (this.game) {
      const fishMethod = method || 'salmon_trolling';
      const result = this.game.startFishing(fishMethod);

      if (result.success && this.actions) {
        // Start fishing sequence (walk to water, look, cast)
        this.actions.startFishingSequence?.().catch(() => {});
      }

      if (this._onChat) {
        this._onChat(result.message || 'Lines in the water.');
      }
    }
    return true;
  }

  async _execCast() {
    if (this.actions?.equipRod) {
      await this.actions.equipRod().catch(() => {});
    }
    if (this.bot) {
      this.bot.activateItem?.();
    }
    return true;
  }

  async _execReel() {
    if (this.game?.player?.isFishing) {
      const result = this.game.haulBack();
      if (this._onChat && result.message) {
        this._onChat(result.message);
      }
    }
    return true;
  }

  async _execEquip(params) {
    const { item } = params;
    if (!item) return true;

    if (this.actions?.equipRod && /rod|fishing/i.test(item)) {
      await this.actions.equipRod().catch(() => {});
      return true;
    }

    // Try to equip from inventory
    if (this.bot) {
      const items = this.bot.inventory?.items?.() || [];
      const match = items.find(i => i.name.includes(item.toLowerCase()));
      if (match) {
        await this.bot.equip(match, 'hand').catch(() => {});
      }
    }
    return true;
  }

  async _execUseItem(params) {
    // Generic item use — activate held item or right-click
    if (this.bot) {
      this.bot.activateItem?.();
    }
    return true;
  }

  async _execChat(params) {
    const { message } = params;
    if (message && this._onChat) {
      this._onChat(message);
    }
    return true;
  }

  async _execWait(params) {
    const seconds = parseFloat(params.seconds) || 2;
    const delay = this.humanizer?.delay ? this.humanizer.delay(seconds * 1000) : seconds * 1000;
    await new Promise(resolve => setTimeout(resolve, Math.min(delay, 30000)));
    return true;
  }

  async _execLookAt(params) {
    const { target } = params;
    if (!target) return true;

    if (this.actions?.lookAtEntity && typeof target === 'string') {
      // Try to find player entity
      const player = this.actions.findNearestPlayer?.(32);
      if (player && player.username.toLowerCase().includes(target.toLowerCase())) {
        await this.actions.lookAtEntity(player).catch(() => {});
        return true;
      }
    }

    if (this.actions?.lookAround) {
      await this.actions.lookAround();
    }
    return true;
  }

  async _execFollow(params) {
    const { entity } = params;
    if (!entity || !this.bot) return true;

    // Use pathfinder to follow the player
    const player = this.bot.players?.[entity];
    if (player?.entity) {
      const { GoalFollow } = await import('mineflayer-pathfinder/lib/goals.js').catch(() => ({}));
      if (GoalFollow) {
        this.bot.pathfinder?.setGoal(new GoalFollow(player.entity, 3));
        // Keep following — don't return true yet
        return false; // Stay on this action
      }
    }
    return true;
  }

  async _execSell(params) {
    const { item } = params;
    if (this.game) {
      if (item === 'all') {
        const results = this.game.sellAllFish();
        if (this._onChat) {
          this._onChat(`💰 Sold. Gold: $${this.game.player.gold}`);
        }
      } else {
        const result = this.game.sellFish(item);
        if (this._onChat && result?.message) {
          this._onChat(result.message);
        }
      }
    }
    return true;
  }

  async _execBuy(params) {
    const { item } = params;
    if (this.game && item) {
      const result = this.game.buyGear(item);
      if (this._onChat && result?.message) {
        this._onChat(result.message);
      }
    }
    return true;
  }

  async _execCheck(params) {
    const { thing } = params;
    if (!thing || !this._onChat) return true;

    const t = thing.toLowerCase();
    let reply = '';

    if (this.game) {
      if (t === 'weather') {
        const state = this.game.getState();
        const w = state.weather;
        reply = `${w.emoji || ''} ${w.name || 'clear'}, wind ${w.windSpeed}kts, sea ${w.seaState}. ${this.game.weather.getFishingReport?.() || ''}`;
      } else if (t === 'tide') {
        const state = this.game.getState();
        const tide = state.tide;
        reply = `${tide.emoji || ''} Tide: ${tide.level.toFixed(1)}ft ${tide.direction} — ${tide.phase}`;
      } else if (t === 'inventory' || t === 'fish') {
        const inv = this.game.player.inventory;
        if (inv.length === 0) {
          reply = "Hold's empty.";
        } else {
          const summary = inv.map(f => f.speciesId).join(', ');
          reply = `${inv.length} fish in the hold: ${summary}`;
        }
      } else if (t === 'gold' || t === 'money') {
        reply = `$${this.game.player.gold} in the pocket.`;
      } else if (t === 'gear') {
        const gear = this.game.player.gear.map(g => g.id).join(', ') || 'nothing';
        reply = `Gear: ${gear}. Gold: $${this.game.player.gold}`;
      } else if (t === 'permits') {
        const permits = this.game.player.permits.join(', ') || 'none';
        reply = `Permits: ${permits}`;
      } else {
        reply = `Checking ${thing}... not sure what that is.`;
      }
    } else {
      reply = "Game's not running.";
    }

    this._onChat(reply);
    return true;
  }

  /**
   * Get current status.
   * @returns {{running: boolean, paused: boolean, queueLength: number, currentAction: Object|null}}
   */
  get status() {
    return {
      running: this.running,
      paused: this.paused,
      queueLength: this.queue.length,
      currentAction: this.current,
    };
  }
}
