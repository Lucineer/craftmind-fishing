/**
 * @module craftmind-fishing/mineflayer/actions
 * @description Library of humanized mineflayer movement/action functions.
 * Every action uses the Humanizer for timing, jitter, and natural-looking behavior.
 */

// Lazy imports — pathfinder is in the host craftmind project, not here
let _goals = null;
async function _getGoals() {
  if (!_goals) {
    try {
      _goals = await import('mineflayer-pathfinder/lib/goals.js');
    } catch {
      // Fallback: create no-op goal-like objects
      _goals = {
        GoalBlock: class { constructor(x,y,z) { this.x=x; this.y=y; this.z=z; } },
        GoalNear: class { constructor(x,y,z,r) { this.x=x; this.y=y; this.z=z; this.r=r; } },
      };
    }
  }
  return _goals;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(min, max, val) {
  return Math.max(min, Math.min(max, val));
}

export class Actions {
  /**
   * @param {import('mineflayer').Bot} bot
   * @param {import('../ai/humanizer.js').Humanizer} humanizer
   */
  constructor(bot, humanizer) {
    this.bot = bot;
    this.h = humanizer;
    this._busy = false;
    this._cancelled = false;
  }

  get isBusy() { return this._busy; }
  cancel() { this._cancelled = true; }

  // ── Movement ─────────────────────────────────────────────────────────────

  async walkTo(x, y, z, timeoutMs = 30000) {
    if (!this.bot?.entity || !this.bot?.pathfinder) return false;
    if (this._busy && !this._cancelled) return false;
    this._busy = true;
    this._cancelled = false;

    try {
      const { GoalBlock } = await _getGoals();
      const goal = new GoalBlock(Math.floor(x), Math.floor(y), Math.floor(z));
      await this._humanizedWait(this.h.delay(200));
      if (this._cancelled) return false;

      this.bot.pathfinder.setGoal(goal);
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.bot?.pathfinder?.setGoal?.(null);
          resolve(false);
        }, timeoutMs);

        const cleanup = (result) => {
          clearTimeout(timeout);
          try {
            this.bot?.removeListener?.('goal_reached', onGoal);
            this.bot?.removeListener?.('path_update', onNoPath);
            this.bot?.pathfinder?.setGoal?.(null);
          } catch {}
          resolve(result);
        };

        const onGoal = () => cleanup(true);

        const onNoPath = (result) => {
          if (result === 'noPath') cleanup(false);
        };

        // Also resolve on cancel
        const cancelCheck = setInterval(() => {
          if (this._cancelled) {
            clearInterval(cancelCheck);
            cleanup(false);
          }
        }, 100);

        this.bot.once('goal_reached', onGoal);
        this.bot.on('path_update', onNoPath);

        // Clear cancel interval on natural resolution
        const origGoal = onGoal;
        const origNoPath = onNoPath;
      });
    } catch (err) {
      if (process.env.DEBUG_AI) console.error('[Actions] walkTo error:', err.message);
      return false;
    } finally {
      this._busy = false;
    }
  }

  async walkToBlock(blockName, range = 32) {
    const blocks = this.bot.findBlocks({ matching: blockName, maxDistance: range, count: 5 });
    if (blocks.length === 0) return false;

    const pos = this.bot.entity.position;
    blocks.sort((a, b) => {
      const da = a.distanceTo(pos);
      const db = b.distanceTo(pos);
      return da - db;
    });

    const target = blocks[0];
    return this.walkTo(target.x, target.y + 1, target.z);
  }

  async walkInDirection(distance = 5) {
    if (!this.bot?.entity) return;
    const pos = this.bot.entity.position;
    const yaw = this.bot.entity.yaw;
    const dx = -Math.sin(yaw) * distance;
    const dz = Math.cos(yaw) * distance;
    return this.walkTo(pos.x + dx, pos.y, pos.z + dz);
  }

  async lookAt(x, y, z) {
    if (!this.bot?.entity) return;
    try {
      await this.bot.lookAt(
        { x: x + (Math.random() - 0.5) * 0.5, y, z: z + (Math.random() - 0.5) * 0.5 },
        true
      );
    } catch {
      // ignore
    }
  }

  async lookAround() {
    if (!this.bot?.entity) return;
    this.h.lookAround(this.bot);
  }

  async lookAtEntity(entity) {
    if (!entity?.position || !this.bot.entity) return;
    const pos = entity.position.offset(0, 1.6, 0);
    await this.lookAt(pos.x, pos.y, pos.z);
  }

  // ── Fishing ─────────────────────────────────────────────────────────────

  async equipRod() {
    const items = this.bot.inventory.items();
    const rod = items.find(i => i.name.includes('fishing_rod'));
    if (!rod) {
      this.bot.chat("I can't find my rod...");
      return false;
    }
    try {
      await this.bot.equip(rod, 'hand');
      await this._humanizedWait(this.h.delay(300));
      return true;
    } catch {
      return false;
    }
  }

  async castLine() {
    if (!this.bot?.entity) return false;
    try {
      // Use the fishing rod (right-click)
      this.bot.activateItem();
      await this._humanizedWait(this.h.delay(500));
      return true;
    } catch {
      return false;
    }
  }

  async reelIn() {
    if (!this.bot?.entity) return false;
    try {
      // Activate again to reel in
      this.bot.activateItem();
      await this._humanizedWait(this.h.delay(300));
      return true;
    } catch {
      return false;
    }
  }

  async wait(ms) {
    await this._humanizedWait(this.h.delay(ms));
  }

  // ── Social ──────────────────────────────────────────────────────────────

  async chat(message) {
    await this._humanizedWait(this.h.reactionTime(false));
    try {
      this.bot.chat(message);
    } catch {
      // ignore
    }
  }

  async waveAtPlayer(playerName) {
    if (!this.bot?.entity) return;
    const player = this.bot.players[playerName];
    if (player?.entity) {
      await this.lookAtEntity(player.entity);
      await this._humanizedWait(this.h.delay(200));
      try {
        this.bot.swingArm('right');
      } catch {
        // ignore
      }
    }
  }

  async nod() {
    if (!this.bot?.entity) return;
    try {
      await this.bot.look(this.bot.entity.yaw, Math.PI / 4);
      await this._humanizedWait(200);
      await this.bot.look(this.bot.entity.yaw, -Math.PI / 4);
      await this._humanizedWait(200);
    } catch {
      // ignore
    }
  }

  async shakeHead() {
    if (!this.bot?.entity) return;
    try {
      const baseYaw = this.bot.entity.yaw;
      await this.bot.look(baseYaw - Math.PI / 6, 0);
      await this._humanizedWait(150);
      await this.bot.look(baseYaw + Math.PI / 6, 0);
      await this._humanizedWait(150);
      await this.bot.look(baseYaw, 0);
    } catch {
      // ignore
    }
  }

  async crouch(duration = 2000) {
    if (!this.bot?.entity) return;
    try {
      this.bot.setControlState('sneak', true);
      await this._humanizedWait(duration);
      this.bot.setControlState('sneak', false);
    } catch {
      // ignore
    }
  }

  async jump() {
    if (!this.bot?.entity) return;
    try {
      this.bot.setControlState('jump', true);
      await this._humanizedWait(100);
      this.bot.setControlState('jump', false);
    } catch {
      // ignore
    }
  }

  // ── Environment ─────────────────────────────────────────────────────────

  async useBlock(block) {
    if (!block) return false;
    try {
      await this.bot.activateBlock(block);
      return true;
    } catch {
      return false;
    }
  }

  async interactWithEntity(entity) {
    if (!entity) return false;
    try {
      await this.bot.activateEntity(entity);
      return true;
    } catch {
      return false;
    }
  }

  // ── Utility ─────────────────────────────────────────────────────────────

  async findNearestWater(range = 32) {
    const pos = this.bot?.entity?.position;
    if (!pos) return null;

    const waterBlocks = this.bot.findBlocks({
      matching: ['water', 'flowing_water'],
      maxDistance: range,
      count: 10,
    });

    if (waterBlocks.length === 0) return null;

    // Sort by distance, return nearest
    waterBlocks.sort((a, b) => a.distanceTo(pos) - b.distanceTo(pos));
    return waterBlocks[0];
  }

  findNearestPlayer(range = 32) {
    const pos = this.bot?.entity?.position;
    if (!pos) return null;

    let nearest = null;
    let nearestDist = range;

    for (const entity of Object.values(this.bot.entities)) {
      if (entity.type !== 'player' || entity.username === this.bot.username) continue;
      const dist = entity.position.distanceTo(pos);
      if (dist < nearestDist) {
        nearest = entity;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  getNearbyPlayers(range = 16) {
    if (!this.bot?.entity) return [];
    return Object.values(this.bot.entities).filter(
      e => e.type === 'player' && e.username !== this.bot.username &&
           (this.bot.entity ? e.position.distanceTo(this.bot.entity.position) < range : false)
    );
  }

  getPosition() {
    return this.bot?.entity?.position;
  }

  // ── Full Fishing Sequence ───────────────────────────────────────────────

  /**
   * Complete fishing sequence: walk to water, cast, wait, react to fish.
   * Returns a promise that resolves when the sequence completes or fails.
   */
  async startFishingSequence() {
    if (this._busy) return;

    // 1. Find and walk to water
    const water = await this.findNearestWater();
    if (water) {
      // Walk to block adjacent to water (1 block away, at same level)
      await this.walkTo(water.x, water.y + 1, water.z);
      if (this._cancelled) return;

      // Look at the water
      await this.lookAt(water.x, water.y, water.z);
      await this.wait(800);

      // Superstitious wind check
      if (Math.random() < 0.4) {
        try { this.bot.chat("*checks the wind*"); } catch {}
        await this.lookAround();
        await this.wait(500);
      }
    }

    if (this._cancelled) return;

    // 2. Equip rod
    const hasRod = await this.equipRod();
    if (!hasRod) return;

    // 3. Cast
    await this.castLine();
    try { this.bot.chat(pickRandom([
      "Lines in.",
      "Here we go.",
      "Now we wait.",
    ])); } catch {}
  }

  // ── Idle Animation Loop ─────────────────────────────────────────────────

  /**
   * Perform one idle micro-action. Call periodically.
   */
  async doIdleAction() {
    if (this._busy) return;

    const roll = Math.random();
    if (roll < 0.4) {
      // Look around
      await this.lookAround();
    } else if (roll < 0.55) {
      // Walk a tiny random circle
      this.bot.setControlState('forward', true);
      const turnDir = Math.random() < 0.5 ? 'left' : 'right';
      this.bot.setControlState(turnDir, true);
      await this._humanizedWait(this.h.delay(400));
      this.bot.clearControlStates();
    } else if (roll < 0.65) {
      // Swing arm (practice casting)
      try { this.bot.swingArm('right'); } catch {}
      await this._humanizedWait(this.h.delay(300));
    } else if (roll < 0.75) {
      // Crouch briefly
      await this.crouch(this.h.delay(2000));
    } else if (roll < 0.85) {
      // Jump
      await this.jump();
    } else {
      // Look at nearest player if close
      const player = this.findNearestPlayer(10);
      if (player) {
        await this.lookAtEntity(player);
      } else {
        await this.lookAround();
      }
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────

  async _humanizedWait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || 100));
  }
}

export default Actions;
