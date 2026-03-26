/**
 * @module craftmind-fishing/ai/comparative-evaluator
 * @description Evaluates a fishing session against historical data to rank scripts,
 * extract insights, and build a comparative dataset of what works best when.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * @typedef {object} EvaluationResult
 * @property {number} sessionScore - normalized 0-1 performance score
 * @property {number} historicalRank - rank among similar sessions (1 = best)
 * @property {number} historicalTotal - total similar sessions
 * @property {string} bestScript - script with best performance under similar conditions
 * @property {object} bestConditions - conditions associated with best performance
 * @property {string[]} insights - extracted rules
 * @property {object} scriptRanking - { [scriptName]: { avgScore, uses, successRate } }
 */

export class ComparativeEvaluator {
  /**
   * @param {string} [dataDir]
   */
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.comparisonsDir = join(dataDir, 'comparisons');
    this.insightsDir = join(dataDir, 'insights');
    this._ensureDir(this.comparisonsDir);
    this._ensureDir(this.insightsDir);
  }

  _ensureDir(dir) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  /**
   * Score a session on 0-1 scale.
   * Considers: catch count, total weight, species diversity, outcome, duration efficiency.
   * @param {object} session
   * @returns {number}
   */
  scoreSession(session) {
    const catches = session.results?.catches?.length || 0;
    const weight = session.results?.totalWeight || 0;
    const species = (session.results?.speciesCaught?.length) || 0;
    const duration = session.duration || 1; // seconds

    // Outcome base score
    const outcomeScores = { success: 0.8, partial: 0.5, failure: 0.1, aborted: 0.0 };
    let score = outcomeScores[session.outcome] || 0.1;

    // Catch efficiency: catches per hour, normalized (5+ per hour is great)
    const catchesPerHour = (catches / duration) * 3600;
    score += Math.min(0.3, catchesPerHour * 0.06);

    // Weight bonus (50+ lbs total is great)
    score += Math.min(0.2, (weight / 50) * 0.2);

    // Species diversity bonus
    score += Math.min(0.1, species * 0.03);

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Find sessions with similar conditions.
   * @param {object} conditions
   * @param {object[]} allSessions
   * @returns {object[]} sessions sorted by similarity
   */
  findSimilarSessions(conditions, allSessions) {
    return allSessions
      .map(session => ({
        session,
        similarity: this._conditionSimilarity(conditions, session.conditions),
      }))
      .filter(({ similarity }) => similarity >= 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .map(({ session }) => session);
  }

  /**
   * Compute similarity between two condition sets (0-1).
   */
  _conditionSimilarity(a, b) {
    if (!a || !b) return 0;
    let matches = 0;
    let total = 0;

    // Exact match fields
    const exactFields = ['weather', 'tide', 'timeOfDay', 'location', 'bait'];
    for (const field of exactFields) {
      if (a[field] !== undefined || b[field] !== undefined) {
        total++;
        if (a[field] === b[field]) matches++;
      }
    }

    // Numeric fields with tolerance
    const numericFields = [
      { key: 'depth', tolerance: 20 },
      { key: 'temperature', tolerance: 10 },
      { key: 'windSpeed', tolerance: 5 },
    ];
    for (const { key, tolerance } of numericFields) {
      if (a[key] !== undefined && b[key] !== undefined) {
        total++;
        if (Math.abs(a[key] - b[key]) <= tolerance) matches++;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Evaluate a session against historical data.
   * @param {object} session - the session to evaluate
   * @param {object[]} history - all past sessions
   * @returns {EvaluationResult}
   */
  evaluate(session, history) {
    const score = this.scoreSession(session);

    // Find similar sessions
    const similar = this.findSimilarSessions(session.conditions, history);

    // Score all similar sessions
    const scored = similar.map(s => ({
      session: s,
      score: this.scoreSession(s),
    }));

    // Rank the current session among similar
    const betterThan = scored.filter(s => s.score > score).length;
    const historicalRank = betterThan + 1;
    const historicalTotal = scored.length + 1;

    // Rank scripts by performance under similar conditions
    const scriptStats = {};
    for (const s of scored) {
      const name = s.session.skill;
      if (!scriptStats[name]) scriptStats[name] = { scores: [], uses: 0, successes: 0 };
      scriptStats[name].scores.push(s.score);
      scriptStats[name].uses++;
      if (s.session.outcome === 'success' || s.session.outcome === 'partial') {
        scriptStats[name].successes++;
      }
    }

    // Include current session in stats
    const currentName = session.skill;
    if (!scriptStats[currentName]) scriptStats[currentName] = { scores: [], uses: 0, successes: 0 };
    scriptStats[currentName].scores.push(score);
    scriptStats[currentName].uses++;
    if (session.outcome === 'success' || session.outcome === 'partial') {
      scriptStats[currentName].successes++;
    }

    const scriptRanking = {};
    let bestScript = currentName;
    let bestAvg = 0;
    for (const [name, stats] of Object.entries(scriptStats)) {
      const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
      const successRate = stats.successes / stats.uses;
      scriptRanking[name] = { avgScore, uses: stats.uses, successRate };
      if (avgScore > bestAvg) {
        bestAvg = avgScore;
        bestScript = name;
      }
    }

    // Extract best conditions from top sessions
    const bestConditions = this._extractBestConditions(scored.slice(0, 5));

    // Generate insights
    const insights = this._generateInsights(scored, scriptStats);

    return {
      sessionScore: score,
      historicalRank,
      historicalTotal,
      bestScript,
      bestConditions,
      insights,
      scriptRanking,
    };
  }

  /**
   * Extract conditions associated with top-performing sessions.
   */
  _extractBestConditions(topSessions) {
    if (topSessions.length === 0) return {};
    const conditions = {};

    // Most common condition values among top sessions
    const fields = ['tide', 'bait', 'depth', 'weather', 'location'];
    for (const field of fields) {
      const values = topSessions.map(s => s.session.conditions?.[field]).filter(Boolean);
      if (values.length === 0) continue;

      if (typeof values[0] === 'number') {
        conditions[field] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      } else {
        // Most common value
        const freq = {};
        for (const v of values) freq[v] = (freq[v] || 0) + 1;
        conditions[field] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
      }
    }

    return conditions;
  }

  /**
   * Generate human-readable insights from data.
   */
  _generateInsights(scored, scriptStats) {
    const insights = [];
    if (scored.length < 3) return insights;

    // Group by condition values to find patterns
    const conditionsOfInterest = ['tide', 'weather', 'bait', 'timeOfDay'];

    for (const cond of conditionsOfInterest) {
      const groups = {};
      for (const s of scored) {
        const val = s.session.conditions?.[cond];
        if (!val) continue;
        if (!groups[val]) groups[val] = [];
        groups[val].push(s);
      }

      // Compare top vs bottom groups
      const groupStats = Object.entries(groups)
        .map(([val, sessions]) => ({
          value: val,
          avgScore: sessions.reduce((a, s) => a + s.score, 0) / sessions.length,
          count: sessions.length,
        }))
        .filter(g => g.count >= 2)
        .sort((a, b) => b.avgScore - a.avgScore);

      if (groupStats.length >= 2) {
        const best = groupStats[0];
        const worst = groupStats[groupStats.length - 1];
        const ratio = best.avgScore / Math.max(0.01, worst.avgScore);
        if (ratio >= 1.5) {
          insights.push(`${cond}="${best.value}" performs ${ratio.toFixed(1)}x better than "${worst.value}" (${best.count} vs ${worst.count} sessions)`);
        }
      }
    }

    // Script comparison insight
    const sorted = Object.entries(scriptStats).sort((a, b) => b[1].avgScore - a[1].avgScore);
    if (sorted.length >= 2 && sorted[0][1].uses >= 3) {
      const [best, second] = sorted;
      insights.push(`Best script: ${best[0]} (${(best[1].successRate * 100).toFixed(0)}% success, ${best[1].uses} uses)`);
    }

    return insights.slice(0, 10);
  }

  /**
   * Save a comparison result.
   * @param {string} sessionId
   * @param {EvaluationResult} evaluation
   */
  saveComparison(sessionId, evaluation) {
    const filePath = join(this.comparisonsDir, `${sessionId}.json`);
    writeFileSync(filePath, JSON.stringify({
      sessionId,
      ...evaluation,
      evaluatedAt: new Date().toISOString(),
    }, null, 2));
  }

  /**
   * Save extracted insights.
   * @param {string[]} insights
   * @param {string} [id]
   */
  saveInsights(insights, id) {
    if (!id) id = `insights_${Date.now()}`;
    const filePath = join(this.insightsDir, `${id}.json`);
    writeFileSync(filePath, JSON.stringify({
      id,
      insights,
      createdAt: new Date().toISOString(),
    }, null, 2));
  }

  /**
   * Load all saved insights.
   * @returns {string[]}
   */
  getAllInsights() {
    if (!existsSync(this.insightsDir)) return [];
    return readdirSync(this.insightsDir)
      .filter(f => f.endsWith('.json'))
      .flatMap(f => {
        try {
          const data = JSON.parse(readFileSync(join(this.insightsDir, f), 'utf-8'));
          return data.insights || [];
        } catch { return []; }
      });
  }

  /**
   * Get aggregate script performance across all comparisons.
   * @returns {object}
   */
  getScriptPerformanceSummary() {
    if (!existsSync(this.comparisonsDir)) return {};
    const summary = {};
    for (const f of readdirSync(this.comparisonsDir).filter(f => f.endsWith('.json'))) {
      try {
        const data = JSON.parse(readFileSync(join(this.comparisonsDir, f), 'utf-8'));
        if (!data.scriptRanking) continue;
        for (const [name, stats] of Object.entries(data.scriptRanking)) {
          if (!summary[name]) summary[name] = { totalScore: 0, totalUses: 0, totalSuccesses: 0, evaluations: 0 };
          summary[name].totalScore += stats.avgScore;
          summary[name].totalUses += stats.uses;
          summary[name].totalSuccesses += Math.round(stats.successRate * stats.uses);
          summary[name].evaluations++;
        }
      } catch { continue; }
    }
    return summary;
  }
}

export default ComparativeEvaluator;
