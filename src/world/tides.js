// CraftMind Fishing — Tidal System
// Alaska has the second-largest tides in the world (up to 20 feet / ~6 blocks).
// Scaled for gameplay: full cycle in ~20 minutes.

export const TIDAL_PHASES = {
  extreme_low:  { name: 'Extreme Low Tide',   emoji: '🏖️',   level: [0, 1],     exposed: true,  description: 'Tidal flats exposed. Time for geoduck digging and clamming.' },
  low:          { name: 'Low Tide',            emoji: '▼',       level: [1, 2],     exposed: true,  description: 'Shallow water receded. Beachcombing, rock pooling.' },
  incoming:     { name: 'Incoming Tide',       emoji: '↗',       level: [2, 4],     exposed: false, description: 'Water rising. Fish follow the tide in. Good fishing.' },
  high:         { name: 'High Tide',           emoji: '▲',       level: [4, 5.5],   exposed: false, description: 'Deep water. Some spots only reachable now. Boat fishing.' },
  peak:         { name: 'Peak High Tide',      emoji: '▲▲',      level: [5.5, 6],   exposed: false, description: 'Maximum depth. Strong currents in channels.' },
  outgoing:     { name: 'Outgoing Tide',       emoji: '↘',       level: [4, 2],     exposed: false, description: 'Water receding. Fish funnel through channels. Great fishing.' },
};

export class TidalSystem {
  /**
   * @param {object} options
   * @param {number} options.cycleMinutes - Full tidal cycle in game minutes (default 20)
   * @param {number} options.maxRange - Maximum tidal range in blocks (default 6, = ~20 feet)
   */
  constructor(options = {}) {
    this.cycleMinutes = options.cycleMinutes ?? 20;
    this.maxRange = options.maxRange ?? 6;
    this.gameTime = 0; // in-game minutes elapsed
    this.moonPhase = Math.floor(Math.random() * 8); // 0=new, 4=full
  }

  /**
   * Advance time.
   * @param {number} dt - Minutes of game time elapsed
   */
  tick(dt) {
    this.gameTime += dt;
    // Moon drifts: one full lunar cycle ~ 8 in-game days (accelerated)
    this.moonPhase = (this.moonPhase + dt / (8 * 24 * 60) * 8) % 8;
  }

  /** Get current tide state */
  getCurrent() {
    const { level, direction, strength } = this._computeLevel();
    const phase = this._getPhase(level);
    const tideType = this._getTideType();

    return {
      level: Math.round(level * 100) / 100,
      direction, // 'incoming', 'outgoing', 'slack'
      strength,  // 0-1, current strength from tidal flow
      phase,     // current phase name + emoji
      tideType,  // 'spring', 'neap', 'normal'
      moonPhase: Math.floor(this.moonPhase),
      moonPhaseName: this._getMoonPhaseName(),
      maxRange: this.maxRange,
      exposed: phase.exposed,
    };
  }

  /** Get tide level at a future time */
  getTideAt(minutesFromNow) {
    return this._computeLevel(this.gameTime + minutesFromNow);
  }

  /** Get tide table for the next in-game day (24 min) */
  getTideTable() {
    const table = [];
    const dayMinutes = 24 * 60; // 1 in-game day = 24 real minutes
    for (let m = 0; m <= dayMinutes; m += this.cycleMinutes / 4) {
      const { level, direction } = this._computeLevel(this.gameTime + m);
      const phase = this._getPhase(level);
      table.push({
        timeOffset: m,
        level: Math.round(level * 10) / 10,
        direction,
        phase: phase.name,
      });
    }
    return table;
  }

  /** How many blocks of water to add/subtract from depth at current tide */
  getTideDepthModifier() {
    const { level } = this.getCurrent();
    // Level 0 = extreme low (subtract from base depth), 6 = peak high (add to base depth)
    return level - this.maxRange / 2;
  }

  /** Current multiplier for tidal currents in channels */
  getChannelCurrentMultiplier() {
    const { direction, strength } = this.getCurrent();
    if (direction === 'slack') return 0.3;
    return 0.5 + strength * 1.5; // 0.5 to 2.0
  }

  /** Get fishing bite rate multiplier from tide */
  getBiteMultiplier() {
    const { direction, strength, phase } = this.getCurrent();
    let mult = 1.0;
    // Fish feed on moving water
    if (direction === 'incoming' || direction === 'outgoing') mult *= 1.2 + strength * 0.3;
    // Slack water is slower
    if (direction === 'slack') mult *= 0.85;
    // Low tide exposes new food — but only in shallow areas
    if (phase.exposed) mult *= 1.1;
    return mult;
  }

  /** Force moon phase for testing */
  forceMoonPhase(phase) {
    this.moonPhase = phase % 8;
  }

  /** Force game time */
  forceTime(minutes) {
    this.gameTime = minutes;
  }

  // --- Internal ---

  _computeLevel(time = this.gameTime) {
    // Sinusoidal tidal cycle
    const cycleTime = time / this.cycleMinutes * Math.PI * 2;
    // Base sine wave
    const rawSin = Math.sin(cycleTime);
    // Add a smaller harmonic for asymmetry (real tides are not perfect sine)
    const harmonic = Math.sin(cycleTime * 2) * 0.15;
    const normalized = (rawSin + harmonic) / 1.15; // -1 to 1

    // Apply tidal range (spring vs neap)
    const range = this._getRange();

    const level = (normalized + 1) / 2 * range; // 0 to range

    // Direction and strength
    const derivative = Math.cos(cycleTime) + Math.cos(cycleTime * 2) * 0.3;
    let direction, strength;
    if (Math.abs(derivative) < 0.15) {
      direction = 'slack';
      strength = 0.1;
    } else if (derivative > 0) {
      direction = 'incoming';
      strength = derivative;
    } else {
      direction = 'outgoing';
      strength = -derivative;
    }

    return { level, direction, strength: Math.min(1, strength) };
  }

  _getPhase(level) {
    const halfRange = this.maxRange / 2;
    if (level < 1) return TIDAL_PHASES.extreme_low;
    if (level < 2) return TIDAL_PHASES.low;
    if (level > halfRange + halfRange * 0.8) return TIDAL_PHASES.peak;
    if (level > halfRange) return TIDAL_PHASES.high;
    // Determine incoming vs outgoing from derivative
    const { direction } = this._computeLevel();
    return direction === 'incoming' || direction === 'slack'
      ? TIDAL_PHASES.incoming
      : TIDAL_PHASES.outgoing;
  }

  _getTideType() {
    const phase = Math.floor(this.moonPhase) % 8;
    // Spring tides at new (0) and full (4) moon
    if (phase === 0 || phase === 4) return 'spring';
    // Neap tides at quarter moons (2, 6)
    if (phase === 2 || phase === 6) return 'neap';
    return 'normal';
  }

  _getRange() {
    const type = this._getTideType();
    if (type === 'spring') return this.maxRange; // Full range
    if (type === 'neap') return this.maxRange * 0.5; // Half range
    return this.maxRange * 0.75;
  }

  _getMoonPhaseName() {
    return ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'][Math.floor(this.moonPhase) % 8];
  }

  toString() {
    const t = this.getCurrent();
    return `${t.phase.emoji} ${t.phase.name} | Level: ${t.level.toFixed(1)}/${this.maxRange} | ${t.direction} (${t.tideType}) | 🌙 ${t.moonPhaseName}`;
  }
}

export default TidalSystem;
