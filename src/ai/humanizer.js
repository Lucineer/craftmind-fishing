/**
 * @module craftmind-fishing/ai/humanizer
 * @description Humanization layer: timing jitter, movement curves, failure simulation,
 * and idle micro-behaviors to make the bot feel alive.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function gaussianRandom(mean = 0, stddev = 1) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(Math.max(1e-10, u1))) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(min, max, val) {
  return Math.max(min, Math.min(max, val));
}

// ── Humanizer ────────────────────────────────────────────────────────────────

export class Humanizer {
  constructor() {
    this._fatigue = 0;
    this._lastAction = Date.now();
  }

  /**
   * Add Gaussian jitter to a base delay. Never below 30ms.
   * @param {number} baseMs
   * @returns {number} milliseconds with jitter
   */
  delay(baseMs) {
    const jittered = baseMs + gaussianRandom(0, baseMs * 0.12);
    return Math.max(30, Math.round(jittered));
  }

  /**
   * Human reaction time. Urgent = 150-300ms, casual = 500-1500ms.
   * @param {boolean} isUrgent
   * @returns {number} milliseconds
   */
  reactionTime(isUrgent = false) {
    if (isUrgent) {
      return this.delay(Math.round(150 + Math.random() * 150));
    }
    return this.delay(Math.round(500 + Math.random() * 1000));
  }

  /**
   * Should this action fail? Base 3% + fatigue.
   * @param {number} [baseChance=0.03]
   * @param {number} [fatigue] - 0 to 1
   * @returns {boolean}
   */
  shouldFail(baseChance = 0.03, fatigue) {
    const f = fatigue ?? this._fatigue;
    return Math.random() < baseChance + f * 0.05;
  }

  /**
   * Update fatigue (call periodically).
   * @param {number} hoursActive - hours since start of activity
   */
  updateFatigue(hoursActive) {
    this._fatigue = clamp(0, 1, hoursActive * 0.04);
  }

  /**
   * Move bot to a target with Bezier-like curves and micro-look adjustments.
   * @param {object} bot - mineflayer bot
   * @param {{x: number, y?: number, z: number}} target
   */
  async moveTo(bot, target) {
    if (!bot?.entity) return;

    const start = {
      x: bot.entity.position.x,
      y: bot.entity.position.y,
      z: bot.entity.position.z,
    };

    // Generate Bezier waypoints with a random control point
    const cp = {
      x: (start.x + target.x) / 2 + (Math.random() - 0.5) * 4,
      z: (start.z + target.z) / 2 + (Math.random() - 0.5) * 4,
    };

    const waypoints = [];
    const steps = Math.max(3, Math.ceil(start.x !== undefined ? 1 : 1));
    for (let t = 0; t <= 1; t += 0.2) {
      const mt = 1 - t;
      waypoints.push({
        x: mt * mt * start.x + 2 * mt * t * cp.x + t * t * target.x,
        z: mt * mt * start.z + 2 * mt * t * cp.z + t * t * target.z,
      });
    }

    // Walk along waypoints
    bot.setControlState('forward', true);
    for (const wp of waypoints) {
      if (!bot.entity) break;
      try {
        await bot.lookAt(
          wp.x + gaussianRandom(0, 1.5),
          bot.entity.position.y,
          wp.z + gaussianRandom(0, 1.5)
        );
      } catch {
        // lookAt may not be available in all contexts
      }
      await this.wait(this.delay(100));
    }
    bot.clearControlStates();
    this._lastAction = Date.now();
  }

  /**
   * Random look-around head movement.
   * @param {object} bot
   */
  lookAround(bot) {
    if (!bot?.entity) return;
    const yaw = (Math.random() - 0.5) * 120;
    const pitch = (Math.random() - 0.5) * 40;
    try {
      bot.look(
        bot.entity.yaw + yaw * (Math.PI / 180),
        clamp(-80, 80, bot.entity.pitch + pitch * (Math.PI / 180))
      );
    } catch {
      // ignore
    }
    this._lastAction = Date.now();
  }

  /**
   * Practice casting motion (arm swing).
   * @param {object} bot
   */
  swingArm(bot) {
    if (!bot?.entity) return;
    try {
      bot.activateItem(); // swing arm in mc
    } catch {
      // ignore
    }
    this._lastAction = Date.now();
  }

  /**
   * Random idle micro-action.
   * @param {object} bot
   */
  async idle(bot) {
    const actions = [
      () => this.lookAround(bot),
      () => this.swingArm(bot),
      () => {
        // Walk a tiny random circle
        if (bot.entity) {
          bot.setControlState('forward', true);
          setTimeout(() => {
            bot.setControlState('left', true);
            setTimeout(() => bot.clearControlStates(), 300);
          }, 400);
        }
      },
      () => {
        // Crouch (sit down)
        try { bot.setControlState('sneak', true); } catch {}
        setTimeout(() => { try { bot.setControlState('sneak', false); } catch {} }, 2000);
      },
    ];
    pickRandom(actions)();
    this._lastAction = Date.now();
  }

  /**
   * Promise-based wait with humanized delay.
   * @param {number} [ms]
   * @returns {Promise<void>}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || this.delay(200)));
  }
}

export default Humanizer;
