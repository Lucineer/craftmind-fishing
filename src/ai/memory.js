/**
 * @module craftmind-fishing/ai/memory
 * @description Three-layer memory system: episodic (events), semantic (rules),
 * and working (current context). Persists to JSON between sessions.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Memory Store ─────────────────────────────────────────────────────────────

const MAX_EPISODES = 1000;
const MAX_RULES = 200;
const DECAY_INTERVAL = 86400000; // 24 hours

export class Memory {
  /**
   * @param {string} [dataDir] - directory for persistence
   */
  constructor(dataDir = './data/memory') {
    this.dataDir = dataDir;
    this._filePath = join(dataDir, 'memory.json');

    // Episodic memory: specific events
    this.episodes = [];

    // Semantic memory: learned rules
    this.rules = [];

    // Working memory: current context
    this.working = {
      task: null,
      location: null,
      timeOnWater: 0,
      fishCount: 0,
      target: null,
      sessionStart: Date.now(),
      fishCaught: [],     // this session
      fishLost: [],       // this session
      goldEarned: 0,
      interactions: 0,    // player interactions this session
    };

    this._load();
  }

  // ── Episodic Memory ──────────────────────────────────────────

  /**
   * Record an event.
   * @param {{ type: string, data?: object, tags?: string[] }} episode
   */
  addEpisode(episode) {
    const entry = {
      ...episode,
      time: new Date().toISOString(),
      timestamp: Date.now(),
    };
    this.episodes.push(entry);
    if (this.episodes.length > MAX_EPISODES) {
      this.episodes = this.episodes.slice(-MAX_EPISODES);
    }
    this._dirty = true;
    return entry;
  }

  /**
   * Query episodes by type, time range, or tags.
   * @param {{ type?: string, since?: number, before?: number, tags?: string[], limit?: number }} query
   * @returns {Array}
   */
  queryEpisodes(query = {}) {
    let results = this.episodes;

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }
    if (query.since) {
      results = results.filter(e => e.timestamp >= query.since);
    }
    if (query.before) {
      results = results.filter(e => e.timestamp <= query.before);
    }
    if (query.tags?.length) {
      results = results.filter(e =>
        e.tags && query.tags.some(t => e.tags.includes(t))
      );
    }

    if (query.limit) {
      results = results.slice(-query.limit);
    }

    return results;
  }

  /**
   * Get recent episodes (last N).
   * @param {number} [n=10]
   * @returns {Array}
   */
  recent(n = 10) {
    return this.episodes.slice(-n);
  }

  // ── Semantic Memory ──────────────────────────────────────────

  /**
   * Add a learned rule.
   * @param {{ rule: string, confidence: number, source?: string, tags?: string[] }} rule
   */
  addRule(rule) {
    // Check for duplicates
    const existing = this.rules.find(r => r.rule === rule.rule);
    if (existing) {
      // Merge confidence
      existing.confidence = Math.min(1, (existing.confidence + rule.confidence) / 2 + 0.01);
      return existing;
    }

    const entry = {
      ...rule,
      confidence: clamp(0, 1, rule.confidence || 0.5),
      source: rule.source || 'experience',
      tags: rule.tags || [],
      createdAt: new Date().toISOString(),
      reinforced: 0,
    };
    this.rules.push(entry);
    if (this.rules.length > MAX_RULES) {
      this.rules.sort((a, b) => b.confidence - a.confidence);
      this.rules = this.rules.slice(0, MAX_RULES);
    }
    this._dirty = true;
    return entry;
  }

  /**
   * Query rules by tag or keyword.
   * @param {{ tags?: string[], minConfidence?: number, keyword?: string }} query
   * @returns {Array}
   */
  queryRules(query = {}) {
    let results = this.rules;

    if (query.minConfidence) {
      results = results.filter(r => r.confidence >= query.minConfidence);
    }
    if (query.tags?.length) {
      results = results.filter(r =>
        r.tags && query.tags.some(t => r.tags.includes(t))
      );
    }
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      results = results.filter(r => r.rule.toLowerCase().includes(kw));
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Reinforce a rule (it was confirmed by experience).
   * @param {string} ruleText
   */
  reinforceRule(ruleText) {
    const rule = this.rules.find(r => r.rule === ruleText);
    if (rule) {
      rule.confidence = Math.min(1, rule.confidence + 0.05);
      rule.reinforced++;
      this._dirty = true;
    }
  }

  // ── Working Memory ───────────────────────────────────────────

  /**
   * Update working memory.
   * @param {object} updates
   */
  updateWorking(updates) {
    Object.assign(this.working, updates);
  }

  /**
   * Get working memory snapshot.
   * @returns {object}
   */
  getWorking() {
    return { ...this.working };
  }

  /**
   * Reset working memory for a new session.
   */
  resetSession() {
    this.working = {
      task: null,
      location: null,
      timeOnWater: 0,
      fishCount: 0,
      target: null,
      sessionStart: Date.now(),
      fishCaught: [],
      fishLost: [],
      goldEarned: 0,
      interactions: 0,
    };
  }

  // ── Rule Extraction (from episodes) ──────────────────────────

  /**
   * Simple rule extraction from recent episodes.
   * Looks for patterns like "caught X in Y conditions" and creates rules.
   */
  extractRulesFromEpisodes() {
    const recentCatches = this.queryEpisodes({ type: 'caught_fish', since: Date.now() - 7 * 86400000 });
    if (recentCatches.length < 3) return;

    // Group by location + conditions
    const groups = {};
    for (const ep of recentCatches) {
      const key = `${ep.data?.location || 'unknown'}_${ep.data?.tide || 'unknown'}_${ep.data?.weather || 'unknown'}`;
      if (!groups[key]) groups[key] = { count: 0, totalWeight: 0, species: new Set() };
      groups[key].count++;
      groups[key].totalWeight += ep.data?.weight || 0;
      groups[key].species.add(ep.data?.species || 'unknown');
    }

    // Extract high-confidence rules
    for (const [key, data] of Object.entries(groups)) {
      if (data.count >= 3) {
        const rule = `Good fishing at ${key.replace(/_/g, ' ')} (${data.count} catches)`;
        this.addRule({
          rule,
          confidence: Math.min(0.9, data.count * 0.1),
          source: 'pattern',
          tags: ['fishing_spot'],
        });
      }
    }
  }

  // ── Persistence ──────────────────────────────────────────────

  _dirty = false;

  save() {
    try {
      mkdirSync(this.dataDir, { recursive: true });
      const data = {
        episodes: this.episodes,
        rules: this.rules,
        savedAt: new Date().toISOString(),
      };
      writeFileSync(this._filePath, JSON.stringify(data, null, 2));
      this._dirty = false;
    } catch (err) {
      console.error('[Memory] Save failed:', err.message);
    }
  }

  _load() {
    try {
      if (!existsSync(this._filePath)) return;
      const data = JSON.parse(readFileSync(this._filePath, 'utf-8'));
      if (data.episodes) this.episodes = data.episodes;
      if (data.rules) this.rules = data.rules;
    } catch (err) {
      console.error('[Memory] Load failed:', err.message);
    }
  }
}

function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

export default Memory;
