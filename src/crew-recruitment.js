// CraftMind Fishing — Crew Recruitment / Tavern System
// Hire crew with personalities, skills, and backstories.

export const PERSONALITIES = {
  cautious:     { name: 'Cautious',    desc: 'Avoids dangerous spots, rarely takes risks', riskMult: 0.6, catchMult: 0.8, survivalMult: 1.4 },
  reckless:     { name: 'Reckless',    desc: 'Dives into danger, finds rare fish but gets hurt', riskMult: 1.8, catchMult: 1.3, survivalMult: 0.6 },
  methodical:   { name: 'Methodical',  desc: 'Efficient and predictable, steady catch rate', riskMult: 0.8, catchMult: 1.1, survivalMult: 1.1 },
  lucky:        { name: 'Lucky',       desc: 'Finds rare things by chance', riskMult: 1.0, catchMult: 1.0, survivalMult: 1.0, luckBoost: 0.3 },
  veteran:      { name: 'Veteran',     desc: 'Experienced and steady under pressure', riskMult: 0.9, catchMult: 1.2, survivalMult: 1.3 },
};

const FIRST_NAMES = ['Old Salty', 'Ironbeard', 'Seaweed', 'Barnacle', 'Marina', 'Tidecaller',
  'Stormchaser', 'Pearldiver', 'Deepfin', 'Wavecrest', 'Coraltooth', 'Saltbeard',
  'Starfish', 'Anchovy', 'Lighthouse', 'Clamdigger', 'Shipwright', 'Barnaby'];

const BACKSTORIES = [
  'A retired navy captain who misses the sea.',
  'A young adventurer seeking fortune and glory.',
  'A marine biologist who knows every fish species.',
  'An ex-pirate reformed after a close call with a Leviathan.',
  'A fish whisperer who claims to understand sea creatures.',
  'A merchant who lost everything and turned to fishing.',
  'A mysterious stranger who appeared at the docks one foggy morning.',
  'The child of a legendary fisherman, carrying on the family trade.',
];

export class CrewMember {
  constructor(options = {}) {
    this.id = options.id ?? `crew_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.name = options.name ?? FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    this.role = options.role ?? ['scout', 'tanker', 'support', 'specialist'][Math.floor(Math.random() * 4)];
    this.skill = options.skill ?? 3 + Math.floor(Math.random() * 5); // 3-7
    this.maxSkill = 10;
    this.personality = options.personality ?? Object.keys(PERSONALITIES)[Math.floor(Math.random() * 5)];
    this.backstory = options.backstory ?? BACKSTORIES[Math.floor(Math.random() * BACKSTORIES.length)];

    this.salary = options.salary ?? this._calcSalary();
    this.hireCost = options.hireCost ?? Math.round(this.salary * 5);
    this.hiredAt = Date.now();

    // State
    this.hp = 100;
    this.maxHp = 100;
    this.morale = 80;
    this.xp = 0;
    this.level = 1;
    this.catches = 0;
    this.rareCatches = 0;
    this.voyagesSurvived = 0;
    this.status = 'available'; // available, hired, lost, poached
    this.relationship = 0; // -100 to 100
  }

  _calcSalary() {
    const base = 10 + this.skill * 5;
    const riskMult = PERSONALITIES[this.personality]?.riskMult ?? 1;
    return Math.round(base * riskMult);
  }

  /** Gain XP and possibly level up. */
  gainXP(amount) {
    this.xp += amount;
    const newLevel = Math.floor(this.xp / 200) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.skill = Math.min(this.maxSkill, this.skill + 0.3);
      this.maxHp = 100 + this.level * 10;
      return true;
    }
    return false;
  }

  /** Adjust morale. */
  adjustMorale(amount) {
    this.morale = Math.max(0, Math.min(100, this.morale + amount));
  }

  /** Adjust relationship. */
  adjustRelationship(amount) {
    this.relationship = Math.max(-100, Math.min(100, this.relationship + amount));
  }

  /** Check if crew member is satisfied. */
  isSatisfied() {
    return this.morale > 30 && this.relationship > -50;
  }

  /** Chance of being poached by rival. */
  poachChance() {
    if (this.morale > 80) return 0;
    return Math.max(0, (80 - this.morale) / 200);
  }

  /** Get personality modifier for a stat. */
  getPersonalityMod(stat) {
    const p = PERSONALITIES[this.personality];
    if (!p) return 1;
    const mods = { risk: p.riskMult, catch: p.catchMult, survival: p.survivalMult, luck: p.luckBoost ?? 0 };
    return mods[stat] ?? 1;
  }

  toJSON() {
    return {
      id: this.id, name: this.name, role: this.role, skill: this.skill,
      personality: this.personality, salary: this.salary, morale: this.morale,
      level: this.level, catches: this.catches, rareCatches: this.rareCatches,
      status: this.status, relationship: this.relationship, backstory: this.backstory,
    };
  }
}

export class Tavern {
  constructor(options = {}) {
    this.name = options.name ?? 'The Salty Anchor';
    this.availableCrew = [];
    this.maxAvailable = options.maxAvailable ?? 8;
    this.lastRefresh = 0;
    this.refreshInterval = options.refreshInterval ?? 300000; // 5 min
    this.rotationCount = 0;
  }

  /** Get current recruits. Refresh if needed. */
  getRecruits() {
    this._maybeRefresh();
    return [...this.availableCrew];
  }

  /** Hire a crew member by ID. Returns the member or null. */
  hire(memberId) {
    const idx = this.availableCrew.findIndex(m => m.id === memberId);
    if (idx === -1) return null;
    const member = this.availableCrew.splice(idx, 1)[0];
    member.status = 'hired';
    member.hiredAt = Date.now();
    return member;
  }

  /** Add a custom crew member to the tavern. */
  addCrew(member) {
    if (this.availableCrew.length >= this.maxAvailable) return false;
    this.availableCrew.push(member instanceof CrewMember ? member : new CrewMember(member));
    return true;
  }

  /** Get crew filtered by role. */
  getByRole(role) {
    this._maybeRefresh();
    return this.availableCrew.filter(m => m.role === role);
  }

  /** Get crew filtered by personality. */
  getByPersonality(personality) {
    this._maybeRefresh();
    return this.availableCrew.filter(m => m.personality === personality);
  }

  /** Generate a random crew member. */
  _generateCrew(options = {}) {
    return new CrewMember(options);
  }

  /** Refresh available crew if interval has passed. */
  _maybeRefresh() {
    if (Date.now() - this.lastRefresh < this.refreshInterval) return;
    this.lastRefresh = Date.now();
    this.rotationCount++;

    // Remove some, add some
    const removeCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < removeCount && this.availableCrew.length > 0; i++) {
      this.availableCrew.splice(Math.floor(Math.random() * this.availableCrew.length), 1);
    }

    const addCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < addCount && this.availableCrew.length < this.maxAvailable; i++) {
      this.availableCrew.push(this._generateCrew());
    }
  }

  /** Force refresh (for testing). */
  refresh() {
    this.lastRefresh = 0;
    this._maybeRefresh();
  }

  /** Get tavern summary. */
  getSummary() {
    return {
      name: this.name,
      availableCrew: this.availableCrew.length,
      roles: Object.fromEntries(
        ['scout', 'tanker', 'support', 'specialist'].map(r =>
          [r, this.availableCrew.filter(m => m.role === r).length])
      ),
      rotations: this.rotationCount,
    };
  }
}

export default Tavern;
