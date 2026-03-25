// CraftMind Fishing — Game Theory Simulation
// Tragedy of the Commons, Prisoner's Dilemma, Optimal Foraging, Arms Race.
// These EMERGE from gameplay — never explicitly taught through text.

/**
 * Track fishing pressure on shared resources to detect Tragedy of the Commons.
 */
export class TragedyOfTheCommons {
  constructor() {
    this.spotHistory = new Map(); // spotId → { fishermen: Set, depletionRate, capacity, events: [] }
    this.lessons = [];
  }

  /** Record fishing activity at a shared spot */
  recordActivity(spotId, fishermanId, fishCaught, spotCapacity) {
    if (!this.spotHistory.has(spotId)) {
      this.spotHistory.set(spotId, {
        fishermen: new Set(),
        depletionRate: 0,
        capacity: spotCapacity ?? 100,
        events: [],
        peakFishermen: 0,
        totalCaught: 0,
        totalEffort: 0,
      });
    }

    const spot = this.spotHistory.get(spotId);
    spot.fishermen.add(fishermanId);
    spot.totalCaught += fishCaught;
    spot.totalEffort++;
    spot.events.push({
      fisherman: fishermanId, caught: fishCaught,
      fishermenCount: spot.fishermen.size, timestamp: Date.now(),
    });

    // Keep last 200 events
    if (spot.events.length > 200) spot.events.shift();

    spot.peakFishermen = Math.max(spot.peakFishermen, spot.fishermen.size);

    return this._checkTragedy(spotId, spot);
  }

  /** Check if tragedy of the commons is occurring */
  _checkTragedy(spotId, spot) {
    if (spot.events.length < 20) return null;

    const recent = spot.events.slice(-20);
    const recentRate = recent.reduce((s, e) => s + e.caught, 0) / recent.length;
    const early = spot.events.slice(0, 20);
    const earlyRate = early.reduce((s, e) => s + e.caught, 0) / early.length;

    // Tragedy: more fishermen, lower per-fisherman catch rate
    const recentFishermen = recent[recent.length - 1]?.fishermenCount ?? 1;
    const earlyFishermen = early[0]?.fishermenCount ?? 1;

    if (recentFishermen >= 3 && recentRate < earlyRate * 0.5) {
      const lesson = {
        type: 'tragedy_of_commons',
        spotId,
        description: null, // Intentionally null — player discovers through gameplay
        data: {
          fishermanCount: recentFishermen,
          catchRateDrop: Math.round((1 - recentRate / earlyRate) * 100),
          totalEffort: spot.totalEffort,
        },
        timestamp: Date.now(),
        silent: true, // This is a SYSTEM observation, not a message to the player
      };
      this.lessons.push(lesson);
      return lesson;
    }

    return null;
  }

  /** Get tragedy observations */
  getLessons() {
    return this.lessons.filter(l => l.type === 'tragedy_of_commons');
  }
}

/**
 * Track cooperation/defection between fishermen (Prisoner's Dilemma).
 */
export class PrisonersDilemma {
  constructor() {
    this.interactions = []; // { fishermanA, fishermanB, actionA, actionB, outcomeA, outcomeB, timestamp }
    this.pairHistory = new Map(); // "A|B" → { cooperate, defect, total }
  }

  /**
   * Record an interaction between two fishermen.
   * @param {string} fishermanA
   * @param {string} fishermanB
   * @param {'cooperate'|'defect'} actionA - share spot info vs hoard
   * @param {'cooperate'|'defect'} actionB
   * @param {number} outcomeA - payoff for A
   * @param {number} outcomeB - payoff for B
   */
  record(fishermanA, fishermanB, actionA, actionB, outcomeA, outcomeB) {
    const interaction = {
      fishermanA, fishermanB, actionA, actionB,
      outcomeA, outcomeB, timestamp: Date.now(),
    };
    this.interactions.push(interaction);
    if (this.interactions.length > 500) this.interactions.shift();

    const key = [fishermanA, fishermanB].sort().join('|');
    const pair = this.pairHistory.get(key) ?? { cooperate: 0, defect: 0, total: 0, outcomes: [] };
    pair.total++;
    if (actionA === 'cooperate' && actionB === 'cooperate') pair.cooperate++;
    else pair.defect++;
    pair.outcomes.push({ actionA, actionB, outcomeA, outcomeB });
    if (pair.outcomes.length > 50) pair.outcomes.shift();
    this.pairHistory.set(key, pair);
  }

  /** Get cooperation rate across all interactions */
  getCooperationRate() {
    if (this.interactions.length < 5) return null;
    const recent = this.interactions.slice(-50);
    const coopCount = recent.filter(i => i.actionA === 'cooperate' && i.actionB === 'cooperate').length;
    return coopCount / recent.length;
  }

  /** Check if a tit-for-tat strategy is emerging naturally */
  detectTitForTat() {
    for (const [, pair] of this.pairHistory) {
      if (pair.outcomes.length < 10) continue;
      const recent = pair.outcomes.slice(-10);
      let titForTatCount = 0;
      for (let i = 1; i < recent.length; i++) {
        // Did player B copy player A's previous action?
        if (recent[i].actionB === recent[i - 1].actionA) titForTatCount++;
      }
      if (titForTatCount >= 7) {
        return {
          pattern: 'tit_for_tat',
          pair: pair.outcomes[0],
          accuracy: titForTatCount / 9,
        };
      }
    }
    return null;
  }
}

/**
 * Optimal Foraging Theory — fish balance energy spent vs calories gained.
 * Players discover: "Why don't fish bite when the bait isn't worth the energy?"
 */
export class OptimalForaging {
  constructor() {
    this.encounters = []; // { species, baitType, approached, bit, energyCost, caloricGain, timestamp }
    this.speciesEfficiency = new Map(); // speciesId → { approachRate, biteRate, avgGain }
  }

  /**
   * Record a foraging encounter.
   */
  record(encounter) {
    this.encounters.push({ ...encounter, timestamp: Date.now() });
    if (this.encounters.length > 500) this.encounters.shift();
    this._updateEfficiency(encounter);
  }

  _updateEfficiency(encounter) {
    const key = `${encounter.species}_${encounter.baitType}`;
    const eff = this.speciesEfficiency.get(key) ?? {
      approaches: 0, bites: 0, misses: 0,
      totalGain: 0, totalCost: 0,
    };
    eff.approaches++;
    if (encounter.bit) eff.bites++;
    else eff.misses++;
    eff.totalGain += encounter.caloricGain ?? 0;
    eff.totalCost += encounter.energyCost ?? 1;
    this.speciesEfficiency.set(key, eff);
  }

  /** Get foraging efficiency for a species-bait combo */
  getEfficiency(species, baitType) {
    const eff = this.speciesEfficiency.get(`${species}_${baitType}`);
    if (!eff || eff.approaches < 3) return null;
    return {
      approachRate: eff.approaches / (eff.approaches + eff.misses),
      biteRate: eff.bites / eff.approaches,
      netEfficiency: (eff.totalGain - eff.totalCost) / eff.approaches,
      sampleSize: eff.approaches,
    };
  }

  /** Find the optimal bait for a species based on foraging theory */
  getOptimalBait(speciesId) {
    let best = null, bestEff = -Infinity;
    for (const [key, eff] of this.speciesEfficiency) {
      if (!key.startsWith(speciesId)) continue;
      if (eff.approaches < 3) continue;
      const netEff = (eff.totalGain - eff.totalCost) / eff.approaches;
      if (netEff > bestEff) {
        bestEff = netEff;
        best = { baitType: key.split('_').slice(1).join('_'), efficiency: netEff, biteRate: eff.bites / eff.approaches };
      }
    }
    return best;
  }

  /** Check if fish are showing optimal foraging behavior (rejecting low-value bait) */
  detectOptimalForaging() {
    for (const [key, eff] of this.speciesEfficiency) {
      if (eff.approaches < 20) continue;
      const biteRate = eff.bites / eff.approaches;
      const netEff = (eff.totalGain - eff.totalCost) / eff.approaches;
      // Fish are being selective — low bite rate but high efficiency when they do bite
      if (biteRate < 0.3 && netEff > 2) {
        return {
          species: key.split('_')[0],
          bait: key.split('_').slice(1).join('_'),
          biteRate: Math.round(biteRate * 100) + '%',
          selectivity: 'high',
        };
      }
    }
    return null;
  }
}

/**
 * Evolutionary Arms Race — fish evolve counter-strategies to fishing techniques.
 * "We started using Glow Berries, now the fish avoid them"
 */
export class EvolutionaryArmsRace {
  constructor() {
    this.techniqueEffectiveness = new Map(); // technique → [effectiveness over time]
    this.counterStrategies = []; // { technique, counterAction, timestamp }
    this.maxHistory = 100;
  }

  /** Record how effective a fishing technique was */
  recordEffectiveness(technique, effectiveness) {
    if (!this.techniqueEffectiveness.has(technique)) {
      this.techniqueEffectiveness.set(technique, []);
    }
    const history = this.techniqueEffectiveness.get(technique);
    history.push({ value: effectiveness, timestamp: Date.now() });
    if (history.length > this.maxHistory) history.shift();

    return this._detectArmsRace(technique, history);
  }

  /** Record that fish developed a counter-strategy */
  recordCounterStrategy(technique, counterAction) {
    this.counterStrategies.push({ technique, counterAction, timestamp: Date.now() });
  }

  /** Check if effectiveness of a technique is declining (fish adapting) */
  _detectArmsRace(technique, history) {
    if (history.length < 30) return null;

    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));

    const earlyAvg = firstHalf.reduce((s, h) => s + h.value, 0) / firstHalf.length;
    const lateAvg = secondHalf.reduce((s, h) => s + h.value, 0) / secondHalf.length;

    // Significant decline in effectiveness
    if (earlyAvg > 0.3 && lateAvg < earlyAvg * 0.6) {
      return {
        technique,
        earlyEffectiveness: Math.round(earlyAvg * 100) + '%',
        currentEffectiveness: Math.round(lateAvg * 100) + '%',
        adaptationDetected: true,
        decline: Math.round((1 - lateAvg / earlyAvg) * 100) + '%',
      };
    }
    return null;
  }

  /** Get all detected arms races */
  getActiveArmsRaces() {
    const races = [];
    for (const [technique, history] of this.techniqueEffectiveness) {
      if (history.length < 30) continue;
      const race = this._detectArmsRace(technique, history);
      if (race) races.push(race);
    }
    return races;
  }
}

/**
 * Combined game theory simulation.
 */
export class GameTheorySim {
  constructor() {
    this.tragedy = new TragedyOfTheCommons();
    this.dilemma = new PrisonersDilemma();
    this.foraging = new OptimalForaging();
    this.armsRace = new EvolutionaryArmsRace();
  }

  /** Get a summary of all active game theory observations */
  getSummary() {
    return {
      tragedyOfCommons: this.tragedy.getLessons().length > 0,
      armsRaces: this.armsRace.getActiveArmsRaces(),
      optimalForaging: this.foraging.detectOptimalForaging(),
      cooperationRate: this.dilemma.getCooperationRate(),
      titForTat: this.dilemma.detectTitForTat(),
    };
  }
}

export default GameTheorySim;
