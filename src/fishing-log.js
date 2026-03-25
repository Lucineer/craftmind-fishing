// CraftMind Fishing — Fishing Log (Narrative Session Summaries)

import { TipsSystem } from './tips.js';

export class FishingLog {
  constructor() {
    this.sessionStart = Date.now();
    this.catches = [];
    this.junkCaught = [];
    this.misses = 0;
    this.totalCasts = 0;
    this.personalBests = {};
    this.achievements = [];
    this.goldEarned = 0;
    this.level = 1;
    this.xp = 0;
    this.junkCollection = new Set();
    this.firstRares = {};
  }

  /** Record a fish catch */
  recordCatch(caught, saleValue) {
    // Check personal best BEFORE updating
    const spId = caught.species.id;
    const prevBest = this.personalBests[spId];

    this.catches.push(caught);
    this.goldEarned += saleValue;
    this.totalCasts++;

    // XP: common=10, uncommon=25, rare=60, epic=150, legendary=500
    const xpTable = { Common: 10, Uncommon: 25, Rare: 60, Epic: 150, Legendary: 500 };
    this.xp += xpTable[caught.species.rarity] ?? 10;

    // Personal best tracking
    if (!this.personalBests[spId] || caught.size > this.personalBests[spId]) {
      this.personalBests[spId] = caught.size;
    }

    // Level up check (100 XP per level)
    const newLevel = Math.floor(this.xp / 100) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.achievements.push(`Level ${this.level}`);
    }

    // Return personal best info
    return { wasPersonalBest: prevBest != null && caught.size > prevBest, previousSize: prevBest };
  }

  /** Record a miss */
  recordMiss() {
    this.misses++;
    this.totalCasts++;
  }

  /** Record junk */
  recordJunk(junkName) {
    this.junkCaught.push(junkName);
    this.junkCollection.add(junkName);
    this.totalCasts++;
  }

  /** Get catch rate */
  get catchRate() {
    return this.totalCasts > 0 ? Math.round((this.catches.length / this.totalCasts) * 100) : 0;
  }

  /** Check if size is in top 10% of species range */
  static isBigOne(caught) {
    const [min, max] = caught.species.sizeRange;
    const threshold = max - (max - min) * 0.1;
    return caught.size >= threshold;
  }

  /** Get personal best announcement or null */
  getPersonalBestAnnouncement(caught) {
    const spId = caught.species.id;
    const prev = this.personalBests[spId];
    if (prev && caught.size > prev) {
      return `Personal best ${caught.species.name}! (was ${prev.toFixed(2)}m, now ${caught.size.toFixed(2)}m)`;
    }
    return null;
  }

  /** Generate the fisherman's log narrative */
  generateLog() {
    const duration = Math.round((Date.now() - this.sessionStart) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Count by rarity
    const rarityCount = {};
    for (const c of this.catches) {
      rarityCount[c.species.rarity] = (rarityCount[c.species.rarity] || 0) + 1;
    }

    // Unique species
    const species = new Set(this.catches.map(c => c.species.name));

    // Best catch
    const bestCatch = this.catches.reduce((best, c) =>
      (!best || c.weight > best.weight) ? c : best, null);

    // Notable catches (non-common)
    const notable = this.catches.filter(c => c.species.rarity !== 'Common');

    // Generate personality text
    let mood, detail;
    if (this.catches.length === 0) {
      mood = 'The fish won today. Every last one of them.';
      detail = this.junkCaught.length > 0
        ? 'At least I hauled up some... creative items.'
        : 'Not even a nibble. I blame the weather.';
    } else if (notable.length >= 3) {
      mood = 'What a day! The rare fish were practically jumping onto my line.';
    } else if (bestCatch?.species.rarity === 'Legendary') {
      mood = `I caught a LEGENDARY ${bestCatch.species.name}. I\'m never washing this rod.`;
    } else if (notable.length === 0) {
      mood = this.catches.length > 5
        ? 'Mostly carp today. But a bad day fishing is better than a good day working.'
        : 'A quiet day on the water. The fish were shy.';
    } else {
      mood = `Caught my first ${notable[0]?.species.name} — a beauty worth remembering.`;
    }

    // Lessons learned
    let lesson = '';
    if (this.junkCaught.length >= 2) {
      lesson = 'Maybe I should check my bait more often.';
    } else if (this.misses > this.catches.length) {
      lesson = 'Patience is a virtue. I need more of it.';
    } else if (species.size >= 5) {
      lesson = 'Variety is the spice of fishing!';
    } else if (bestCatch && bestCatch.weight > 5) {
      lesson = `That ${bestCatch.weight.toFixed(1)}kg monster is going to make a great story.`;
    } else {
      lesson = 'Every master was once a beginner.';
    }

    // Build the log
    const lines = [
      '',
      '══════════════════════════════════════',
      `📝 FISHERMAN'S LOG — Day ${Math.floor(Math.random() * 30) + 1}`,
      '══════════════════════════════════════',
      `Session time: ${timeStr}`,
      `Total casts: ${this.totalCasts} | Catches: ${this.catches.length} | Misses: ${this.misses}`,
      `Catch rate: ${this.catchRate}%`,
      '',
      mood,
    ];

    if (bestCatch) {
      lines.push('');
      lines.push(`Personal best: ${bestCatch.species.name}, ${bestCatch.weight.toFixed(2)}kg`);
    }

    if (notable.length > 0) {
      lines.push(`Notable catches: ${notable.map(c => `${c.species.name} [${c.species.rarity}]`).join(', ')}`);
    }

    if (this.junkCaught.length > 0) {
      lines.push(`Junk hauled up: ${this.junkCaught.length} item${this.junkCaught.length > 1 ? 's' : ''}`);
    }

    lines.push('');
    lines.push(`💰 Gold earned: ${this.goldEarned.toFixed(2)} emeralds`);
    lines.push(`⬆️ Level: ${this.level} (${this.xp} XP)`);
    lines.push(`🎯 Unique species: ${species.size}`);
    lines.push(`Lessons learned: "${lesson}"`);

    if (this.junkCollection.size >= 3) {
      lines.push(`🗑️ Junk collection: ${this.junkCollection.size}/10 items`);
    }

    lines.push('══════════════════════════════════════');
    lines.push('');

    return lines.join('\n');
  }
}

export default FishingLog;
