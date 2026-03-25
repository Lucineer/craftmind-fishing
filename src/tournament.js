// CraftMind Fishing — Tournament System
// Compete in fishing tournaments across multiple modes.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export const TOURNAMENT_MODES = {
  speed_fishing: {
    name: 'Speed Fishing', description: 'Catch the most fish in the time limit',
    scoring: (catches) => catches.length,
  },
  trophy_hunt: {
    name: 'Trophy Hunt', description: 'Catch the biggest and rarest fish',
    scoring: (catches) => catches.reduce((score, c) => score + (c.weight * c.species.rarityInfo.valueMultiplier), 0),
  },
  species_collection: {
    name: 'Species Collection', description: 'Catch the most unique species',
    scoring: (catches) => new Set(catches.map(c => c.species.id)).size,
  },
  total_weight: {
    name: 'Total Weight', description: 'Heaviest total catch wins',
    scoring: (catches) => catches.reduce((sum, c) => sum + c.weight, 0),
  },
};

export class Tournament {
  constructor(options = {}) {
    this.id = options.id ?? `tourn_${Date.now()}`;
    this.name = options.name ?? 'Fishing Tournament';
    this.mode = options.mode ?? 'speed_fishing';
    this.duration = options.duration ?? 600000; // 10 min default
    this.maxParticipants = options.maxParticipants ?? 16;
    this.participants = new Map();
    this.started = false;
    this.ended = false;
    this.startTime = 0;
    this.endTime = 0;
    this.saveDir = options.saveDir ?? './data/persistence';
  }

  addParticipant(bot) {
    if (this.participants.size >= this.maxParticipants) return false;
    this.participants.set(bot.name, { bot, catches: [], score: 0 });
    return true;
  }

  start() {
    if (this.participants.size < 1) return false;
    this.started = true;
    this.startTime = Date.now();
    this.endTime = this.startTime + this.duration;
    return true;
  }

  /** Check if tournament is still running */
  isActive() {
    return this.started && !this.ended && Date.now() < this.endTime;
  }

  /** Get remaining time in ms */
  getRemainingTime() {
    return Math.max(0, this.endTime - Date.now());
  }

  /** Record a catch for a participant */
  recordCatch(participantName, caught) {
    const entry = this.participants.get(participantName);
    if (!entry || !this.isActive()) return false;
    entry.catches.push(caught);
    return true;
  }

  /** End tournament and calculate scores */
  end() {
    this.ended = true;
    const modeInfo = TOURNAMENT_MODES[this.mode];
    for (const [, entry] of this.participants) {
      entry.score = modeInfo.scoring(entry.catches);
    }
    return this.getLeaderboard();
  }

  /** Get sorted leaderboard */
  getLeaderboard() {
    const entries = [...this.participants.values()].sort((a, b) => b.score - a.score);
    return entries.map((e, i) => ({
      rank: i + 1, name: e.bot.name, score: Math.round(e.score),
      catches: e.catches.length,
      bestCatch: e.catches.reduce((best, c) => (!best || c.weight > best.weight ? c : best), null),
      uniqueSpecies: new Set(e.catches.map(c => c.species.id)).size,
    }));
  }

  /** Get tournament summary */
  getSummary() {
    return {
      id: this.id, name: this.name, mode: TOURNAMENT_MODES[this.mode].name,
      participants: this.participants.size, active: this.isActive(),
      remaining: this.formatTime(this.getRemainingTime()),
    };
  }

  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }

  /** Save leaderboard to disk */
  saveLeaderboard() {
    if (!existsSync(this.saveDir)) mkdirSync(this.saveDir, { recursive: true });
    const lb = this.getLeaderboard();
    writeFileSync(`${this.saveDir}/leaderboard_${this.id}.json`, JSON.stringify({
      tournament: { id: this.id, name: this.name, mode: this.mode },
      leaderboard: lb, date: new Date().toISOString(),
    }, null, 2));
    return lb;
  }
}

export default Tournament;
