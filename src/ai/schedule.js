/**
 * @module craftmind-fishing/ai/schedule
 * @description Cody's fisherman daily schedule with flexible timing.
 * Weather, tide, and fishing success can delay or extend activities.
 */

// ── Schedule blocks ───────────────────────────────────────────────────────────

const SCHEDULE_BLOCKS = [
  { hour: 5.5,  action: 'wake_up',        location: 'home',     duration: 30,  flexible: false },
  { hour: 6.0,  action: 'check_radio',    location: 'home',     duration: 15,  flexible: false },
  { hour: 6.25, action: 'decide_plan',    location: 'home',     duration: 15,  flexible: true  },
  { hour: 6.5,  action: 'prepare_gear',   location: 'lfs_marine', duration: 30, flexible: true  },
  { hour: 7.0,  action: 'go_fishing',     location: null,       duration: 270, flexible: true  }, // 7am-11:30am
  { hour: 11.5, action: 'lunch_break',    location: 'boat',     duration: 30,  flexible: true  },
  { hour: 12.0, action: 'resume_fishing', location: null,       duration: 240, flexible: true  }, // 12pm-4pm
  { hour: 16.0, action: 'head_to_dock',   location: null,       duration: 30,  flexible: true  },
  { hour: 16.5, action: 'sell_catch',     location: 'processor', duration: 30, flexible: true  },
  { hour: 17.0, action: 'visit_ernies',   location: 'ernies_bar', duration: 120, flexible: true },
  { hour: 19.0, action: 'dinner',         location: 'home',     duration: 60,  flexible: true  },
  { hour: 20.0, action: 'maintain_gear',  location: 'home',     duration: 60,  flexible: true  },
  { hour: 21.0, action: 'sleep',          location: 'home',     duration: 510, flexible: false }, // 9pm-5:30am
];

// ── Weather overrides ─────────────────────────────────────────────────────────

const WEATHER_OVERRIDES = {
  storm:   { delayStart: 120, cancelFishing: true,  mood: 'grumpy' },
  heavy_rain: { delayStart: 60, cancelFishing: false, mood: 'irritated' },
  rain:    { delayStart: 30,  cancelFishing: false, mood: 'mildly_annoyed' },
  fog:     { delayStart: 0,   cancelFishing: false, mood: 'cautious' },
  clear:   { delayStart: 0,   cancelFishing: false, mood: 'eager' },
};

// ── DailySchedule ─────────────────────────────────────────────────────────────

export class DailySchedule {
  constructor() {
    this.blocks = SCHEDULE_BLOCKS.map(b => ({ ...b }));
    this.currentBlock = null;
    this.blockStartTime = 0;
    this.delayMinutes = 0;       // weather delay
    this.extended = false;       // good fishing extended the day
    this.skipFishing = false;    // weather cancelled fishing
    this._originalStartHour = 7.0;
  }

  /**
   * Get the current block based on game hour (0-24).
   * @param {number} gameHour - decimal hour (e.g. 7.5 = 7:30am)
   * @param {object} [context] - { weather, biteMultiplier, fishCount }
   * @returns {object|null} current schedule block
   */
  getCurrentBlock(gameHour, context = {}) {
    const adjustedHour = gameHour - (this.delayMinutes / 60);

    // If fishing was cancelled by weather, jump to social/evening
    if (this.skipFishing && adjustedHour >= 7 && adjustedHour < 17) {
      return this.blocks.find(b => b.action === 'visit_ernies') || null;
    }

    // If fishing is going great, extend it
    if (this.extended && adjustedHour >= 16 && adjustedHour < 17) {
      if (context.biteMultiplier > 1.5 || (context.fishCount || 0) < 3) {
        return this.blocks.find(b => b.action === 'resume_fishing');
      }
    }

    // Find matching block by time
    for (const block of this.blocks) {
      const endHour = block.hour + (block.duration / 60);
      if (adjustedHour >= block.hour && adjustedHour < endHour) {
        if (this.currentBlock !== block.action) {
          this.currentBlock = block.action;
          this.blockStartTime = Date.now();
        }
        return block;
      }
    }

    // Default: sleep if nothing matches
    return this.blocks.find(b => b.action === 'sleep') || null;
  }

  /**
   * Apply weather impact to schedule.
   * @param {string} weatherType - 'storm', 'heavy_rain', 'rain', 'fog', 'clear'
   */
  applyWeather(weatherType) {
    const override = WEATHER_OVERRIDES[weatherType];
    if (!override) return;

    if (override.cancelFishing && !this.extended) {
      this.skipFishing = true;
      this.delayMinutes += override.delayStart;
    } else {
      this.delayMinutes += override.delayStart;
    }
  }

  /**
   * Extend fishing if conditions are good.
   * @param {boolean} extend
   */
  setExtendedFishing(extend) {
    this.extended = extend;
  }

  /**
   * Get a summary string of today's schedule.
   * @returns {string}
   */
  getSummary() {
    const lines = this.blocks.map(b => {
      const h = Math.floor(b.hour);
      const m = Math.round((b.hour - h) * 60);
      const ampm = h >= 12 ? 'pm' : 'am';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const status = this.currentBlock === b.action ? ' ◄' : '';
      return `${h12}:${String(m).padStart(2, '0')}${ampm} — ${b.action}${status}`;
    });
    let summary = `📋 Cody's Schedule${this.delayMinutes > 0 ? ` (delayed ${this.delayMinutes}min)` : ''}:\n`;
    summary += lines.join('\n');
    return summary;
  }

  /**
   * Reset for a new day.
   */
  resetDay() {
    this.delayMinutes = 0;
    this.extended = false;
    this.skipFishing = false;
    this.currentBlock = null;
    this.blockStartTime = 0;
  }
}

export default DailySchedule;
