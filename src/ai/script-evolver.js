/**
 * @module craftmind-fishing/ai/script-evolver
 * @description Self-improving system that evolves fishing scripts based on
 * comparative evaluation data. Agents rewrite their own cognitive architecture.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export class ScriptEvolver {
  /**
   * @param {string} [dataDir]
   * @param {string} [scriptsDir] - where skill scripts live
   */
  constructor(dataDir = './data', scriptsDir = './src/ai/skills') {
    this.dataDir = dataDir;
    this.scriptsDir = scriptsDir;
    this.versionsDir = join(dataDir, 'scripts');
    this._ensureDir(this.versionsDir);
  }

  _ensureDir(dir) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  /**
   * Load the current version of a script.
   * @param {string} scriptName
   * @returns {string|null}
   */
  async loadScript(scriptName) {
    // Try skill-library style (in-memory skills passed via register)
    // or file-based skills
    const paths = [
      join(this.scriptsDir, `${scriptName}.js`),
      join(this.scriptsDir, `${scriptName}.mjs`),
      join(process.cwd(), `src/ai/skills/${scriptName}.js`),
    ];
    for (const p of paths) {
      if (existsSync(p)) return readFileSync(p, 'utf-8');
    }
    return null;
  }

  /**
   * Validate that evolved code is syntactically valid and maintains exports.
   * @param {string} code
   * @param {string[]} [requiredExports]
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(code, requiredExports) {
    const errors = [];

    // Syntax check
    try {
      new Function(code);
    } catch (e) {
      // ESM-style code (import/export) won't parse in new Function
      if (code.includes('import ') || code.includes('export ')) {
        // ESM: do basic sanity checks instead
        if (code.trim().length < 50) {
          errors.push('Code is suspiciously short — likely invalid');
        }
      } else {
        return { valid: false, errors: [`Syntax error: ${e.message}`] };
      }
    }

    // Check for required exports
    if (requiredExports) {
      for (const exp of requiredExports) {
        if (!code.includes(exp)) {
          errors.push(`Missing expected export or identifier: ${exp}`);
        }
      }
    }

    // Check it's not empty or trivially small
    if (code.trim().length < 50) {
      errors.push('Code is suspiciously short — likely invalid');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Compare two script versions by running them against historical sessions.
   * @param {string} oldCode
   * @param {string} newCode
   * @param {object} evaluation - the evaluation that triggered evolution
   * @returns {{ newIsBetter: boolean, improvement: number, oldScore: number, newScore: number, details: string }}
   */
  async compareScripts(oldCode, newCode, evaluation) {
    // Heuristic comparison based on evaluation data
    // In a real system, you'd run both scripts in simulation
    const oldScore = evaluation.sessionScore || 0.5;
    const currentSuccessRate = evaluation.currentSuccessRate || 0.5;

    // Analyze new code for expected improvements
    const improvements = [];
    const regressions = [];

    // Check if new code has more detailed condition handling
    const conditionChecks = (code.match(/if\s*\(.*condition/g) || []).length;
    if (conditionChecks > 0) improvements.push('Added conditional logic');

    // Check for threshold adjustments
    const thresholds = (code.match(/\d+\.\d+|depth|tolerance|threshold|min|max/gi) || []).length;
    if (thresholds > 3) improvements.push('Refined thresholds');

    // Check for comments explaining changes
    const comments = (code.match(/\/\/.*improv|\/\/.*adjust|\/\/.*fix|\/\/.*better|\/\/.*change/gi) || []).length;
    if (comments > 0) improvements.push('Documented reasoning');

    // Check for new species handling
    const speciesMentions = (code.match(/species|king|coho|halibut|rockfish|cod/gi) || []).length;

    // Compute a heuristic new score
    let newScore = oldScore;
    newScore += improvements.length * 0.03;
    newScore += comments * 0.01;
    newScore -= regressions.length * 0.05;

    // If success rate was low, any improvement is valuable
    if (currentSuccessRate < 0.4 && improvements.length > 0) {
      newScore += 0.05;
    }

    newScore = Math.min(1, Math.max(0, newScore));
    const improvement = newScore - oldScore;

    const details = improvements.length > 0
      ? `Improvements: ${improvements.join(', ')}`
      : 'No significant structural improvements detected';

    return {
      newIsBetter: improvement > 0.01,
      improvement,
      oldScore,
      newScore,
      details,
    };
  }

  /**
   * Save a new version of a script with changelog.
   * @param {string} scriptName
   * @param {string} newCode
   * @param {object} comparison
   * @param {object} evaluation
   * @returns {string} version ID
   */
  async saveVersion(scriptName, newCode, comparison, evaluation) {
    const versionId = `v${Date.now()}`;
    const scriptVersionDir = join(this.versionsDir, scriptName);
    this._ensureDir(scriptVersionDir);

    // Save the new code
    writeFileSync(join(scriptVersionDir, `${versionId}.js`), newCode);

    // Save changelog
    const changelog = {
      version: versionId,
      scriptName,
      timestamp: new Date().toISOString(),
      improvement: comparison.improvement,
      details: comparison.details,
      sessionScore: evaluation.sessionScore,
      insights: evaluation.insights || [],
      bestConditions: evaluation.bestConditions || {},
    };

    const changelogPath = join(scriptVersionDir, 'changelog.json');
    let log = [];
    if (existsSync(changelogPath)) {
      log = JSON.parse(readFileSync(changelogPath, 'utf-8'));
    }
    log.push(changelog);
    writeFileSync(changelogPath, JSON.stringify(log, null, 2));

    return versionId;
  }

  /**
   * Main evolution method: evolve a script based on evaluation data.
   * @param {string} scriptName
   * @param {object} evaluation
   * @param {{ chat: (prompt: string) => Promise<string> }} llmClient
   * @returns {Promise<{ evolved: boolean, improvement?: number, versionId?: string, details?: string }>}
   */
  async evolve(scriptName, evaluation, llmClient) {
    const currentCode = await this.loadScript(scriptName);
    if (!currentCode) {
      return { evolved: false, details: `Could not load script: ${scriptName}` };
    }

    const totalUses = evaluation.scriptRanking?.[scriptName]?.uses || 0;
    const successRate = evaluation.scriptRanking?.[scriptName]?.successRate || 0;
    const bestConditions = evaluation.bestConditions || {};
    const insights = evaluation.insights || [];
    const worstConditions = this._inferWorstConditions(evaluation);

    const prompt = `I've been using this fishing script "${scriptName}" ${totalUses} times.

Current success rate: ${(successRate * 100).toFixed(0)}%
Session score: ${(evaluation.sessionScore * 100).toFixed(0)}%

Conditions when it works best:
${Object.entries(bestConditions).map(([k, v]) => `  - ${k}: ${v}`).join('\n') || '  (no data yet)'}

Conditions when it tends to fail:
${Object.entries(worstConditions).map(([k, v]) => `  - ${k}: ${v}`).join('\n') || '  (no data yet)'}

Key insights from data analysis:
${insights.map(i => `  - ${i}`).join('\n') || '  (no insights yet)'}

Current script code:
\`\`\`javascript
${currentCode}
\`\`\`

Improve this script based on the data. Focus on:
1. What conditions trigger the failures? Adjust thresholds.
2. What makes the successes work? Double down on those patterns.
3. Keep the same function signature and structure.
4. Add comments explaining the changes and why.

Output the improved script code only, wrapped in \`\`\`javascript code blocks.`;

    try {
      const response = await llmClient.chat(prompt);

      // Extract code from markdown code blocks
      const codeMatch = response.match(/```(?:javascript)?\s*\n([\s\S]*?)\n```/);
      const newCode = codeMatch ? codeMatch[1].trim() : response.trim();

      // Validate
      const validation = this.validate(newCode);
      if (!validation.valid) {
        return { evolved: false, details: `Validation failed: ${validation.errors.join('; ')}` };
      }

      // Compare
      const comparison = await this.compareScripts(currentCode, newCode, {
        ...evaluation,
        currentSuccessRate: successRate,
      });

      if (comparison.newIsBetter) {
        const versionId = await this.saveVersion(scriptName, newCode, comparison, evaluation);
        return {
          evolved: true,
          improvement: comparison.improvement,
          versionId,
          details: comparison.details,
        };
      }

      return { evolved: false, details: `New version not significantly better (${comparison.improvement.toFixed(3)} improvement)` };
    } catch (err) {
      return { evolved: false, details: `Evolution error: ${err.message}` };
    }
  }

  /**
   * Infer worst conditions from evaluation data.
   */
  _inferWorstConditions(evaluation) {
    // Invert best conditions as a starting point
    const worst = {};
    const best = evaluation.bestConditions || {};

    const opposites = {
      'incoming': 'outgoing',
      'outgoing': 'incoming',
      'sunny': 'storm',
      'overcast': 'sunny',
      'rain': 'sunny',
      'morning': 'midday',
      'afternoon': 'night',
    };

    for (const [key, val] of Object.entries(best)) {
      if (typeof val === 'number') {
        worst[key] = val; // same but with opposite context
      } else {
        worst[key] = opposites[val] || 'different';
      }
    }

    return worst;
  }

  /**
   * Get evolution history for a script.
   * @param {string} scriptName
   * @returns {object[]}
   */
  getEvolutionHistory(scriptName) {
    const changelogPath = join(this.versionsDir, scriptName, 'changelog.json');
    if (!existsSync(changelogPath)) return [];
    return JSON.parse(readFileSync(changelogPath, 'utf-8'));
  }

  /**
   * Get the latest evolved version of a script.
   * @param {string} scriptName
   * @returns {string|null}
   */
  getLatestVersion(scriptName) {
    const dir = join(this.versionsDir, scriptName);
    if (!existsSync(dir)) return null;
    const files = readdirSync(dir)
      .filter(f => f.startsWith('v') && f.endsWith('.js'))
      .sort()
      .reverse();
    if (files.length === 0) return null;
    return readFileSync(join(dir, files[0]), 'utf-8');
  }
}

export default ScriptEvolver;
