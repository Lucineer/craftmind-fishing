/**
 * @module craftmind-fishing/ai/decision-engine
 * @description Uses comparative evaluation data to make smart fishing decisions.
 * Factors in conditions, personality, mood, and goals.
 */

export class DecisionEngine {
  /**
   * @param {import('./comparative-evaluator.js').ComparativeEvaluator} evaluator
   * @param {import('./session-recorder.js').SessionRecorder} recorder
   */
  constructor(evaluator, recorder) {
    this.evaluator = evaluator;
    this.recorder = recorder;
  }

  /**
   * Given current conditions, personality, and memory, decide what to do.
   * @param {object} conditions - current fishing conditions
   * @param {object} personality - { traits, mood }
   * @param {object} memory - { working: { target, fishCount, ... } }
   * @returns {{ action: string, script: string|null, confidence: number, reasoning: string[], altScripts: string[] }}
   */
  decide(conditions, personality, memory) {
    const traits = personality.traits || personality || {};
    const mood = personality.mood || { energy: 0.5, satisfaction: 0.5, frustration: 0.1, social: 0.5 };
    const working = memory?.working || memory || {};

    // Load all sessions and get performance data
    const allSessions = this.recorder.getAllSessions();
    const insights = this.evaluator.getAllInsights();
    const perfSummary = this.evaluator.getScriptPerformanceSummary();

    // 1. Find best script for current conditions
    const candidates = this._scoreScripts(conditions, allSessions, perfSummary);

    if (candidates.length === 0) {
      return {
        action: 'idle',
        script: null,
        confidence: 0,
        reasoning: ['No data available yet. Need to record some fishing sessions first.'],
        altScripts: [],
      };
    }

    // 2. Apply personality modifiers
    this._applyPersonalityModifiers(candidates, traits, mood, working, allSessions);

    // 3. Sort by final score
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    const altScripts = candidates.slice(1, 4).map(c => c.name);

    // 4. Determine action
    let action = 'fish';
    const reasoning = [...best.reasons];

    // Very low confidence → explore or wait
    if (best.score < 0.3) {
      if (mood.frustration > 0.5) {
        action = 'explore';
        reasoning.push('Low confidence + frustrated → trying something new');
      } else {
        action = 'wait';
        reasoning.push('Low confidence in available scripts. Wait for better conditions.');
      }
    }

    // Very tired → go home
    if (mood.energy < 0.2) {
      action = 'rest';
      reasoning.push('Too tired to fish effectively.');
    }

    // Include relevant insights
    const relevantInsights = this._findRelevantInsights(insights, conditions);
    reasoning.push(...relevantInsights.slice(0, 2));

    return {
      action,
      script: best.name,
      confidence: best.score,
      reasoning: [...new Set(reasoning)],
      altScripts,
    };
  }

  /**
   * Score each script for the given conditions.
   */
  _scoreScripts(conditions, allSessions, perfSummary) {
    // Get unique scripts from sessions
    const scriptNames = [...new Set(allSessions.map(s => s.skill))];
    if (scriptNames.length === 0) return [];

    return scriptNames.map(name => {
      const scriptSessions = allSessions.filter(s => s.skill === name);
      const score = this._calculateScriptScore(name, conditions, scriptSessions, perfSummary);
      return score;
    });
  }

  /**
   * Calculate a 0-1 score for how well a script fits current conditions.
   */
  _calculateScriptScore(scriptName, conditions, scriptSessions, perfSummary) {
    const reasons = [];
    let score = 0.3; // base score — having any data at all

    if (scriptSessions.length === 0) {
      return { name: scriptName, score: 0.1, reasons: ['No prior sessions with this script.'] };
    }

    // Overall success rate
    const successes = scriptSessions.filter(s => s.outcome === 'success' || s.outcome === 'partial').length;
    const successRate = successes / scriptSessions.length;
    score += successRate * 0.3;
    reasons.push(`${scriptName}: ${(successRate * 100).toFixed(0)}% success rate (${scriptSessions.length} uses)`);

    // Performance summary average
    const perf = perfSummary[scriptName];
    if (perf && perf.evaluations > 0) {
      const avgScore = perf.totalScore / perf.evaluations;
      score += avgScore * 0.2;
    }

    // Condition matching
    const similar = this.evaluator.findSimilarSessions(conditions, scriptSessions);
    if (similar.length > 0) {
      const similarSuccesses = similar.filter(s => s.outcome === 'success' || s.outcome === 'partial').length;
      const similarRate = similarSuccesses / similar.length;
      score += similarRate * 0.2;
      if (similar.length >= 3) {
        reasons.push(`${similar.length} similar past sessions, ${similarRate * 100 > 60 ? 'good' : 'mixed'} results`);
      }
    }

    // Species targeting
    if (conditions.targetSpecies) {
      const speciesSessions = scriptSessions.filter(s =>
        s.results?.speciesCaught?.includes(conditions.targetSpecies)
      );
      if (speciesSessions.length > 0) {
        const speciesRate = speciesSessions.filter(s => s.outcome !== 'failure').length / speciesSessions.length;
        score += speciesRate * 0.15;
        reasons.push(`Targets ${conditions.targetSpecies}: ${(speciesRate * 100).toFixed(0)}% catch rate`);
      }
    }

    // Recency bonus — recent sessions weighted more
    const recentSessions = scriptSessions.slice(-5);
    if (recentSessions.length >= 2) {
      const recentRate = recentSessions.filter(s => s.outcome !== 'failure').length / recentSessions.length;
      if (recentRate > 0.6) {
        score += 0.1;
        reasons.push('Recently performing well');
      }
    }

    return {
      name: scriptName,
      score: Math.min(1, Math.max(0, score)),
      reasons,
    };
  }

  /**
   * Apply personality and mood modifiers to candidate scores.
   */
  _applyPersonalityModifiers(candidates, traits, mood, working, allSessions) {
    const stubbornness = traits.stubbornness || 0;
    const curiosity = traits.curiosity || 0;
    const competitiveness = traits.competitiveness || 0;

    // Stubbornness: bias toward proven (more uses) scripts
    if (stubbornness > 0.5) {
      for (const c of candidates) {
        const uses = allSessions.filter(s => s.skill === c.name).length;
        if (uses >= 5) {
          c.score += 0.05 * stubbornness;
        } else if (uses <= 1) {
          c.score -= 0.05 * stubbornness;
          c.reasons.push('Not enough history to trust (stubborn bias)');
        }
      }
    }

    // Frustration: try something different from recent failures
    if (mood.frustration > 0.5) {
      const recentFails = allSessions
        .filter(s => s.outcome === 'failure')
        .slice(-3)
        .map(s => s.skill);
      for (const c of candidates) {
        if (recentFails.includes(c.name)) {
          c.score -= 0.15 * mood.frustration;
        } else {
          c.score += 0.05 * mood.frustration;
          c.reasons.push('Trying something different (frustrated with recent approach)');
        }
      }
    }

    // Curiosity: small bonus for less-used scripts
    if (curiosity > 0.5) {
      for (const c of candidates) {
        const uses = allSessions.filter(s => s.skill === c.name).length;
        if (uses <= 2) {
          c.score += 0.03 * curiosity;
        }
      }
    }

    // Target species from memory
    if (working.target) {
      for (const c of candidates) {
        const sessions = allSessions.filter(s => s.skill === c.name);
        const hasTarget = sessions.some(s => s.results?.speciesCaught?.includes(working.target));
        if (hasTarget) {
          c.score += 0.1;
        }
      }
    }
  }

  /**
   * Find insights relevant to current conditions.
   */
  _findRelevantInsights(insights, conditions) {
    const relevant = [];
    const condKeys = Object.keys(conditions).filter(k => conditions[k] !== undefined);

    for (const insight of insights) {
      const lower = insight.toLowerCase();
      const isRelevant = condKeys.some(k => lower.includes(conditions[k]?.toString().toLowerCase()));
      if (isRelevant) relevant.push(insight);
    }

    return relevant;
  }

  /**
   * Answer a natural language question about fishing performance.
   * @param {string} question
   * @returns {string}
   */
  answerQuestion(question) {
    const sessions = this.recorder.getAllSessions();
    const insights = this.evaluator.getAllInsights();
    const perf = this.evaluator.getScriptPerformanceSummary();

    if (sessions.length < 3) {
      return "Not enough data yet. Need at least a few fishing sessions to start finding patterns.";
    }

    const q = question.toLowerCase();

    // "best script for X"
    const bestMatch = q.match(/best.*(?:script|method|approach).*for\s+(.+)/i);
    if (bestMatch) {
      const target = bestMatch[1].trim();
      return this._findBestFor(target, sessions, perf, insights);
    }

    // "why does X fail"
    const failMatch = q.match(/why.*(fail|bad|poor|suck)/i);
    if (failMatch) {
      return this._explainFailure(question, sessions, insights);
    }

    // General summary
    return this._generateSummary(sessions, perf, insights);
  }

  _findBestFor(target, sessions, perf, insights) {
    // Parse target conditions from question
    const scriptStats = {};
    for (const s of sessions) {
      const name = s.skill;
      if (!scriptStats[name]) scriptStats[name] = { scores: [], count: 0, catches: [] };
      scriptStats[name].scores.push(this.evaluator.scoreSession(s));
      scriptStats[name].count++;
      scriptStats[name].catches.push(...(s.results?.catches || []));
    }

    let best = null;
    let bestScore = 0;
    for (const [name, stats] of Object.entries(scriptStats)) {
      const avg = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
      if (avg > bestScore) { bestScore = avg; best = { name, ...stats, avgScore: avg }; }
    }

    if (!best) return "No data available for that query.";

    const relevantInsights = insights.filter(i => {
      const lower = i.toLowerCase();
      return target.split(/\s+/).some(word => word.length > 2 && lower.includes(word.toLowerCase()));
    });

    let response = `Based on ${sessions.length} sessions, the best approach is "${best.name}" with an average score of ${(best.avgScore * 100).toFixed(0)}%.`;
    if (relevantInsights.length > 0) {
      response += ` Key insight: ${relevantInsights[0]}`;
    }
    return response;
  }

  _explainFailure(question, sessions, insights) {
    const failSessions = sessions.filter(s => s.outcome === 'failure');
    if (failSessions.length === 0) return "No failures recorded yet!";

    const failConditions = {};
    for (const s of failSessions) {
      for (const [k, v] of Object.entries(s.conditions || {})) {
        if (v === undefined) continue;
        if (!failConditions[k]) failConditions[k] = {};
        failConditions[k][v] = (failConditions[k][v] || 0) + 1;
      }
    }

    let response = `Looking at ${failSessions.length} failed sessions: `;
    const patterns = [];
    for (const [cond, vals] of Object.entries(failConditions)) {
      const worst = Object.entries(vals).sort((a, b) => b[1] - a[1])[0];
      if (worst[1] >= 2) patterns.push(`${cond}="${worst[0]}" (${worst[1]} failures)`);
    }

    response += patterns.length > 0 ? patterns.slice(0, 3).join(', ') + '.' : 'no strong patterns detected yet.';

    const relevantInsights = insights.filter(i => i.toLowerCase().includes('fail') || i.toLowerCase().includes('worse') || i.toLowerCase().includes('drop'));
    if (relevantInsights.length > 0) {
      response += ` Data shows: ${relevantInsights[0]}`;
    }
    return response;
  }

  _generateSummary(sessions, perf, insights) {
    const total = sessions.length;
    const successes = sessions.filter(s => s.outcome !== 'failure' && s.outcome !== 'aborted').length;
    const totalCatch = sessions.reduce((sum, s) => sum + (s.results?.catches?.length || 0), 0);

    let response = `Recorded ${total} sessions with ${successes} successes (${(successes / total * 100).toFixed(0)}%). Total catch: ${totalCatch} fish.`;

    if (insights.length > 0) {
      response += ` Top insight: ${insights[0]}`;
    }

    const scripts = Object.entries(perf);
    if (scripts.length > 0) {
      const best = scripts.sort((a, b) => (b[1].totalScore / b[1].evaluations) - (a[1].totalScore / a[1].evaluations))[0];
      response += ` Best overall script: ${best[0]}.`;
    }

    return response;
  }
}

export default DecisionEngine;
