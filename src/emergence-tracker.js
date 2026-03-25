// CraftMind Fishing — Emergence Tracker
// Detects patterns that NO individual script explicitly creates.
// The game's "discovery" system — watches for emergent behaviors.

/**
 * An observed emergent behavior.
 * @typedef {Object} EmergentBehavior
 * @property {string} id
 * @property {string} name - Human-readable name
 * @property {string} description
 * @property {string} category - "formation", "migration", "cooperation", "strategy", "ecology"
 * @property {Object} evidence - Data that triggered detection
 * @property {number} timestamp
 * @property {number} confidence - 0-1, how confident we are this is real
 * @property {boolean} confirmed - Has been observed multiple times
 * @property {number} observationCount
 */

export class EmergenceTracker {
  constructor(options = {}) {
    this.behaviors = new Map();     // id → EmergentBehavior
    this.patternBuffers = new Map(); // patternId → recent observations
    this.discoveredBehaviors = new Set();
    this.callbacks = [];
    this.tickCount = 0;

    this._initKnownPatterns();
  }

  /**
   * Known emergence patterns to watch for.
   * Each has a detection function and a description.
   */
  _initKnownPatterns() {
    // Formation patterns
    this.patternBuffers.set('rotating_circle', { observations: [], window: 60 });
    this.patternBuffers.set('diamond_formation', { observations: [], window: 40 });
    this.patternBuffers.set('line_formation', { observations: [], window: 40 });

    // Migration patterns
    this.patternBuffers.set('depth_migration', { observations: [], window: 100 });
    this.patternBuffers.set('horizontal_migration', { observations: [], window: 100 });
    this.patternBuffers.set('seasonal_movement', { observations: [], window: 200 });

    // Cooperation patterns
    this.patternBuffers.set('convergent_fishing', { observations: [], window: 30 });
    this.patternBuffers.set('coordinated_flee', { observations: [], window: 20 });
    this.patternBuffers.set('bait_sharing', { observations: [], window: 50 });

    // Strategy patterns
    this.patternBuffers.set('bait_adaptation', { observations: [], window: 80 });
    this.patternBuffers.set('depth_adaptation', { observations: [], window: 80 });
    this.patternBuffers.set('schedule_adaptation', { observations: [], window: 100 });

    // Ecology patterns
    this.patternBuffers.set('population_recovery', { observations: [], window: 100 });
    this.patternBuffers.set('predator_prey_cycle', { observations: [], window: 200 });
    this.patternBuffers.set('trophic_cascade', { observations: [], window: 200 });
  }

  /**
   * Feed raw observation data from the simulation.
   * Called every tick with school positions, fishing data, etc.
   */
  observe(data) {
    this.tickCount++;

    // Detect formations
    if (data.schoolPositions) this._detectFormations(data.schoolPositions);
    if (data.fleeEvents) this._detectCoordinatedFlee(data.fleeEvents);
    if (data.fishingActivity) this._detectConvergentFishing(data.fishingActivity);
    if (data.scriptChanges) this._detectStrategyAdaptation(data.scriptChanges);
    if (data.populations) this._detectEcologicalPatterns(data.populations);
    if (data.depthDistribution) this._detectDepthMigration(data.depthDistribution);
  }

  /** Get all discovered emergent behaviors */
  getDiscoveries() {
    return [...this.behaviors.values()]
      .filter(b => b.observationCount >= 3)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /** Get unconfirmed behaviors (potential discoveries) */
  getUnconfirmed() {
    return [...this.behaviors.values()]
      .filter(b => b.observationCount < 3)
      .sort((a, b) => b.observationCount - a.observationCount);
  }

  /** Check if a specific behavior has been discovered */
  isDiscovered(behaviorId) {
    return this.discoveredBehaviors.has(behaviorId);
  }

  /** Get discovery progress (X/N confirmed) */
  getDiscoveryProgress() {
    return {
      confirmed: this.discoveredBehaviors.size,
      total: this._knownBehaviorCount(),
    };
  }

  /** Register callback for new discoveries */
  onDiscovery(callback) {
    this.callbacks.push(callback);
  }

  // --- Detection methods ---

  _detectFormations(schoolPositions) {
    for (const [schoolId, positions] of Object.entries(schoolPositions)) {
      if (positions.length < 5) continue;

      const center = this._centroid(positions);
      const distances = positions.map(p => this._dist2D(p, center));
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
      const distVariance = distances.reduce((sum, d) => sum + (d - avgDist) ** 2, 0) / distances.length;

      // Check for circular formation (low variance in distance from center)
      const circularity = distVariance < avgDist * avgDist * 0.3;
      if (circularity && avgDist > 2) {
        this._recordObservation('rotating_circle', {
          schoolId, center, avgDist, count: positions.length,
        });
      }

      // Check for line formation (high variance in one axis, low in another)
      if (distances.length >= 5) {
        const xVariance = positions.reduce((s, p) => s + (p.x - center.x) ** 2, 0) / positions.length;
        const zVariance = positions.reduce((s, p) => s + (p.z - center.z) ** 2, 0) / positions.length;
        const ratio = Math.max(xVariance, zVariance) / (Math.min(xVariance, zVariance) + 0.01);
        if (ratio > 5) {
          this._recordObservation('line_formation', {
            schoolId, axis: xVariance > zVariance ? 'x' : 'z', count: positions.length,
          });
        }
      }
    }
  }

  _detectCoordinatedFlee(fleeEvents) {
    // Multiple schools fleeing simultaneously = coordinated response
    const recentFlees = fleeEvents.filter(e => Date.now() - e.timestamp < 5000);
    const uniqueSchools = new Set(recentFlees.map(e => e.schoolId));
    if (uniqueSchools.size >= 2) {
      this._recordObservation('coordinated_flee', {
        schoolCount: uniqueSchools.size,
        events: recentFlees.length,
      });
    }
  }

  _detectConvergentFishing(activity) {
    // Multiple fishermen at same spot without explicit coordination
    const recentCasts = activity.filter(a => Date.now() - a.timestamp < 30000);
    const spotCounts = new Map();
    for (const cast of recentCasts) {
      const spotKey = `${Math.round(cast.x / 5)},${Math.round(cast.z / 5)}`;
      spotCounts.set(spotKey, (spotCounts.get(spotKey) ?? 0) + 1);
    }
    for (const [, count] of spotCounts) {
      if (count >= 3) {
        this._recordObservation('convergent_fishing', {
          fishermanCount: count,
          spotActivity: count,
        });
      }
    }
  }

  _detectStrategyAdaptation(scriptChanges) {
    // Fish scripts being modified in response to fishing pressure
    const recentChanges = scriptChanges.filter(c => Date.now() - c.timestamp < 60000);
    if (recentChanges.length >= 2) {
      const categories = new Set(recentChanges.map(c => c.category));
      if (categories.has('depth') || categories.has('bait')) {
        this._recordObservation(categories.has('bait') ? 'bait_adaptation' : 'depth_adaptation', {
          changeCount: recentChanges.length,
          categories: [...categories],
        });
      }
    }
  }

  _detectEcologicalPatterns(populations) {
    // Population recovery after depletion
    for (const [speciesId, history] of Object.entries(populations)) {
      if (history.length < 20) continue;
      const recent = history.slice(-5);
      const older = history.slice(-20, -5);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      if (olderAvg < recentAvg * 0.5 && recentAvg > 10) {
        this._recordObservation('population_recovery', {
          species: speciesId,
          from: Math.round(olderAvg),
          to: Math.round(recentAvg),
        });
      }

      // Predator-prey cycles (oscillation)
      if (history.length >= 50) {
        const half1 = history.slice(0, 25);
        const half2 = history.slice(25, 50);
        const avg1 = half1.reduce((a, b) => a + b, 0) / half1.length;
        const avg2 = half2.reduce((a, b) => a + b, 0) / half2.length;
        if (Math.abs(avg1 - avg2) > Math.max(avg1, avg2) * 0.3) {
          this._recordObservation('predator_prey_cycle', {
            species: speciesId,
            phase1: Math.round(avg1),
            phase2: Math.round(avg2),
          });
        }
      }
    }
  }

  _detectDepthMigration(depthDistribution) {
    // Track if average depth changes significantly over time
    const buf = this.patternBuffers.get('depth_migration');
    if (!buf) return;
    buf.observations.push({
      avgDepth: depthDistribution.avgDepth ?? 0,
      timestamp: Date.now(),
    });
    if (buf.observations.length > buf.window) buf.observations.shift();

    if (buf.observations.length >= 20) {
      const first = buf.observations.slice(0, 10);
      const last = buf.observations.slice(-10);
      const firstAvg = first.reduce((s, o) => s + o.avgDepth, 0) / first.length;
      const lastAvg = last.reduce((s, o) => s + o.avgDepth, 0) / last.length;
      if (Math.abs(lastAvg - firstAvg) > 5) {
        this._recordObservation('depth_migration', {
          from: Math.round(firstAvg),
          to: Math.round(lastAvg),
          direction: lastAvg > firstAvg ? 'deeper' : 'shallower',
        });
      }
    }
  }

  // --- Internal ---

  _recordObservation(patternId, evidence) {
    const buf = this.patternBuffers.get(patternId);
    if (!buf) return;

    buf.observations.push({ ...evidence, timestamp: Date.now() });
    if (buf.observations.length > buf.window) buf.observations.shift();

    const behaviorId = `emergence_${patternId}`;
    const existing = this.behaviors.get(behaviorId);

    if (!existing) {
      const behavior = {
        id: behaviorId,
        name: this._humanName(patternId),
        description: this._humanDescription(patternId),
        category: this._category(patternId),
        evidence,
        timestamp: Date.now(),
        confidence: 0.3,
        confirmed: false,
        observationCount: 1,
      };
      this.behaviors.set(behaviorId, behavior);
    } else {
      existing.observationCount++;
      existing.evidence = evidence;
      existing.confidence = Math.min(1, existing.confidence + 0.15);
      existing.timestamp = Date.now();

      if (existing.observationCount >= 3 && !existing.confirmed) {
        existing.confirmed = true;
        this.discoveredBehaviors.add(behaviorId);
        for (const cb of this.callbacks) {
          try { cb(existing); } catch (_) {}
        }
      }
    }
  }

  _humanName(patternId) {
    const names = {
      rotating_circle: 'Circular Defense Formation',
      diamond_formation: 'Diamond Formation',
      line_formation: 'Line Formation',
      depth_migration: 'Depth Migration',
      horizontal_migration: 'Horizontal Migration',
      seasonal_movement: 'Seasonal Movement',
      convergent_fishing: 'Convergent Fishing',
      coordinated_flee: 'Coordinated Escape',
      bait_sharing: 'Bait Knowledge Sharing',
      bait_adaptation: 'Bait Counter-Strategy',
      depth_adaptation: 'Depth Counter-Strategy',
      schedule_adaptation: 'Schedule Adaptation',
      population_recovery: 'Natural Population Recovery',
      predator_prey_cycle: 'Predator-Prey Cycle',
      trophic_cascade: 'Trophic Cascade',
    };
    return names[patternId] ?? patternId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  _humanDescription(patternId) {
    const descs = {
      rotating_circle: 'Fish form a rotating circle around a threat — no individual rule creates this pattern',
      diamond_formation: 'Fish arrange themselves in a diamond shape while moving — an efficient formation',
      line_formation: 'Fish swim in a line formation to reduce water resistance',
      depth_migration: 'The school collectively moves to a different depth — survival adaptation',
      convergent_fishing: 'Multiple fishermen independently converge on the same spot — emergent cooperation',
      coordinated_flee: 'Multiple schools flee simultaneously in response to a single threat',
      bait_adaptation: 'Fish evolve to avoid commonly-used bait types — evolutionary arms race',
      depth_adaptation: 'Fish change depth preferences to avoid fishing pressure',
      population_recovery: 'Fish population naturally recovers after being depleted',
      predator_prey_cycle: 'Predator and prey populations oscillate in sync',
    };
    return descs[patternId] ?? 'An emergent behavior observed in the ecosystem';
  }

  _category(patternId) {
    if (['rotating_circle', 'diamond_formation', 'line_formation'].includes(patternId)) return 'formation';
    if (['depth_migration', 'horizontal_migration', 'seasonal_movement'].includes(patternId)) return 'migration';
    if (['convergent_fishing', 'coordinated_flee', 'bait_sharing'].includes(patternId)) return 'cooperation';
    if (['bait_adaptation', 'depth_adaptation', 'schedule_adaptation'].includes(patternId)) return 'strategy';
    return 'ecology';
  }

  _knownBehaviorCount() {
    return this.patternBuffers.size;
  }
}

export default EmergenceTracker;
