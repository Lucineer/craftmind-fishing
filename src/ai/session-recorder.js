/**
 * @module craftmind-fishing/ai/session-recorder
 * @description Records every fishing session in detail for comparative analysis.
 * Persists to JSON files in data/sessions/.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const MAX_EVENTS = 500;

/**
 * @typedef {object} SessionConditions
 * @property {string} weather - 'sunny' | 'overcast' | 'rain' | 'storm' | 'fog'
 * @property {string} tide - 'incoming' | 'outgoing' | 'slack' | 'ebb'
 * @property {string} timeOfDay - 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night'
 * @property {number} depth - fishing depth in feet
 * @property {string} location - fishing location name
 * @property {string} bait - bait/lure used
 * @property {number} temperature - water temperature °F
 * @property {number} [windSpeed] - knots
 * @property {number} [swell] - feet
 * @property {object} [extra] - any additional condition fields
 */

/**
 * @typedef {object} SessionEvent
 * @property {number} time - ms since session start
 * @property {string} type - 'catch' | 'miss' | 'gear_change' | 'weather_change' | 'location_change' | 'bite' | 'snag'
 * @property {object} detail - event-specific data
 */

/**
 * @typedef {object} FishingSession
 * @property {string} id - unique session ID
 * @property {string} startTime - ISO timestamp
 * @property {string} endTime - ISO timestamp
 * @property {number} duration - seconds
 * @property {string} skill - skill script name used
 * @property {SessionConditions} conditions
 * @property {SessionEvent[]} events
 * @property {{ catches: Array<{species: string, weight: number, method: string}>, totalWeight: number, speciesCaught: string[] }} results
 * @property {'success'|'partial'|'failure'|'aborted'} outcome
 */

export class SessionRecorder {
  /**
   * @param {string} [dataDir] - base data directory
   */
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.sessionsDir = join(dataDir, 'sessions');
    this._ensureDir(this.sessionsDir);
  }

  _ensureDir(dir) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  /**
   * Generate a unique session ID.
   * @returns {string}
   */
  _generateId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Record a completed fishing session.
   * @param {FishingSession} session
   * @returns {string} the session ID
   */
  recordSession(session) {
    const id = session.id || this._generateId();
    const full = { ...session, id, recordedAt: new Date().toISOString() };

    // Validate structure
    if (!full.skill) throw new Error('Session must have a skill name');
    if (full.conditions === undefined || full.conditions === null) throw new Error('Session must have conditions');
    if (!full.results) full.results = { catches: [], totalWeight: 0, speciesCaught: [] };
    if (!full.events) full.events = [];
    if (!full.outcome) full.outcome = 'failure';

    // Trim events if too large
    if (full.events.length > MAX_EVENTS) {
      full.events = full.events.slice(-MAX_EVENTS);
    }

    // Compute total weight if missing
    if (full.results.totalWeight === undefined || full.results.totalWeight === null) {
      full.results.totalWeight = (full.results.catches || []).reduce((sum, c) => sum + (c.weight || 0), 0);
    }
    // Extract species caught if missing
    if (!full.results.speciesCaught) {
      full.results.speciesCaught = [...new Set((full.results.catches || []).map(c => c.species).filter(Boolean))];
    }

    const filePath = join(this.sessionsDir, `${id}.json`);
    writeFileSync(filePath, JSON.stringify(full, null, 2));
    return id;
  }

  /**
   * Load a session by ID.
   * @param {string} id
   * @returns {FishingSession|null}
   */
  loadSession(id) {
    const filePath = join(this.sessionsDir, `${id}.json`);
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  /**
   * Get all recorded sessions, sorted by startTime.
   * @returns {FishingSession[]}
   */
  getAllSessions() {
    if (!existsSync(this.sessionsDir)) return [];
    const files = readdirSync(this.sessionsDir).filter(f => f.endsWith('.json'));
    return files.map(f => JSON.parse(readFileSync(join(this.sessionsDir, f), 'utf-8')))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }

  /**
   * Query sessions by criteria.
   * @param {{ skill?: string, outcome?: string, since?: string, before?: string, species?: string, limit?: number, minCatches?: number }} query
   * @returns {FishingSession[]}
   */
  querySessions(query = {}) {
    let results = this.getAllSessions();

    if (query.skill) {
      results = results.filter(s => s.skill === query.skill);
    }
    if (query.outcome) {
      results = results.filter(s => s.outcome === query.outcome);
    }
    if (query.since) {
      const t = new Date(query.since).getTime();
      results = results.filter(s => new Date(s.startTime).getTime() >= t);
    }
    if (query.before) {
      const t = new Date(query.before).getTime();
      results = results.filter(s => new Date(s.startTime).getTime() < t);
    }
    if (query.species) {
      results = results.filter(s => s.results.speciesCaught.includes(query.species));
    }
    if (query.minCatches) {
      results = results.filter(s => s.results.catches.length >= query.minCatches);
    }
    if (query.limit) {
      results = results.slice(-query.limit);
    }

    return results;
  }

  /**
   * Get total session count.
   * @returns {number}
   */
  get sessionCount() {
    if (!existsSync(this.sessionsDir)) return 0;
    return readdirSync(this.sessionsDir).filter(f => f.endsWith('.json')).length;
  }

  /**
   * Create a live session tracker for building up events during a session.
   * @param {string} skill
   * @param {SessionConditions} conditions
   * @returns {LiveSession}
   */
  createLiveSession(skill, conditions) {
    return new LiveSession(skill, conditions, this);
  }
}

/**
 * Helper to build a session incrementally during fishing.
 */
export class LiveSession {
  /**
   * @param {string} skill
   * @param {SessionConditions} conditions
   * @param {SessionRecorder} recorder
   */
  constructor(skill, conditions, recorder) {
    this.skill = skill;
    this.conditions = conditions;
    this.recorder = recorder;
    this.startTime = new Date();
    this.events = [];
    this._catches = [];
    this._outcome = 'failure';
  }

  /**
   * Add an event.
   * @param {string} type
   * @param {object} [detail]
   */
  addEvent(type, detail = {}) {
    this.events.push({ time: Date.now() - this.startTime.getTime(), type, detail });
  }

  /** Record a catch */
  addCatch(species, weight, method = 'unknown') {
    this._catches.push({ species, weight, method });
    this.addEvent('catch', { species, weight, method });
  }

  /** Record a missed fish */
  addMiss(detail = {}) {
    this.addEvent('miss', detail);
  }

  /** Record a gear change */
  gearChange(detail) {
    this.addEvent('gear_change', detail);
  }

  /** Record a weather change */
  weatherChange(detail) {
    this.addEvent('weather_change', detail);
    if (detail.weather) this.conditions.weather = detail.weather;
  }

  /** Set the outcome */
  setOutcome(outcome) {
    this._outcome = outcome;
  }

  /**
   * Finalize and record the session.
   * @returns {string} session ID
   */
  finalize() {
    const endTime = new Date();
    const duration = (endTime.getTime() - this.startTime.getTime()) / 1000;

    const outcome = this._catches.length > 0
      ? (this._outcome === 'failure' ? 'partial' : this._outcome)
      : this._outcome;

    return this.recorder.recordSession({
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      skill: this.skill,
      conditions: { ...this.conditions },
      events: this.events,
      results: {
        catches: this._catches,
        totalWeight: this._catches.reduce((sum, c) => sum + (c.weight || 0), 0),
        speciesCaught: [...new Set(this._catches.map(c => c.species).filter(Boolean))],
      },
      outcome,
    });
  }
}

export default SessionRecorder;
