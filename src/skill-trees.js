// CraftMind Fishing — Skill Trees
// Method mastery with levels, perks, titles, and legendary catches.

const SKILL_MILESTONES = [
  { level: 1,  perk: 'Basic access',                        icon: '📖', bonusType: 'unlock' },
  { level: 3,  perk: 'Gear recipe discovery bonus',          icon: '📝', bonusType: 'recipe_discovery', value: 2 },
  { level: 5,  perk: 'Reduced gear wear (-20%)',             icon: '🛡️', bonusType: 'gear_wear', value: 0.8 },
  { level: 7,  perk: 'Shop discount (10%)',                  icon: '🏪', bonusType: 'shop_discount', value: 0.9 },
  { level: 10, perk: 'Species-specific bonuses',             icon: '🎯', bonusType: 'species_bonus', value: 1.3 },
  { level: 12, perk: 'Crafting tier unlock (Tier 2)',        icon: '🔨', bonusType: 'crafting_tier', value: 2 },
  { level: 15, perk: 'Exclusive techniques unlocked',        icon: '🔮', bonusType: 'exclusive' },
  { level: 17, perk: 'Crafting tier unlock (Tier 3)',        icon: '⚒️', bonusType: 'crafting_tier', value: 3 },
  { level: 20, perk: 'MASTER — legendary catches possible',  icon: '👑', bonusType: 'legendary', value: 0.05 },
];

const METHOD_MASTERY = {
  bait_casting: {
    name: 'Bait Casting Mastery',
    title: ['Novice Angler', 'Apprentice Caster', 'Skilled Angler', 'Expert Caster', 'Master Bait Caster'],
    masterTitle: 'Lord of the Cast',
    xpPerAction: 10,   // XP per tick of activity
    xplevels: [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000,
               100000, 200000, 400000, 800000, 1600000, 3200000, 6400000,
               12800000, 25600000, 51200000],
  },
  crab_pots: {
    name: 'Crab Pot Mastery',
    title: ['Pot Beginner', 'Pot Planner', 'Crab Strategist', 'Bait Master', 'Crab Baron'],
    masterTitle: 'King of the Pots',
    xpPerAction: 5,
    xplevels: [0, 80, 250, 600, 1200, 2500, 5000, 10000, 20000, 40000,
               80000, 160000, 320000, 640000, 1280000, 2560000, 5120000,
               10240000, 20480000, 40960000],
  },
  lobster_traps: {
    name: 'Deep Trap Mastery',
    title: ['Shallow Diver', 'Depth Explorer', 'Trap Technician', 'Abyssal Hunter', 'Deep Sea Baron'],
    masterTitle: 'Abyssal Diver',
    xpPerAction: 8,
    xplevels: [0, 90, 280, 650, 1400, 2800, 5600, 11200, 22400, 44800,
               89600, 179200, 358400, 716800, 1433600, 2867200, 5734400,
               11468800, 22937600, 45875200],
  },
  longlining: {
    name: 'Longlining Mastery',
    title: ['Line Handler', 'Hook Setter', 'Fleet Baiter', 'Master Liner', 'Ocean Strategist'],
    masterTitle: 'King of the Longline',
    xpPerAction: 6,
    xplevels: [0, 85, 260, 620, 1300, 2700, 5400, 10800, 21600, 43200,
               86400, 172800, 345600, 691200, 1382400, 2764800, 5529600,
               11059200, 22118400, 44236800],
  },
  trolling: {
    name: 'Trolling Mastery',
    title: ['Deckhand', 'Line Watcher', 'Speed Captain', 'Pelagic Hunter', 'Ocean Pioneer'],
    masterTitle: 'Admiral of the Trolls',
    xpPerAction: 7,
    xplevels: [0, 88, 270, 640, 1350, 2750, 5500, 11000, 22000, 44000,
               88000, 176000, 352000, 704000, 1408000, 2816000, 5632000,
               11264000, 22528000, 45056000],
  },
  trawling: {
    name: 'Trawling Mastery',
    title: ['Net Boy', 'Net Manager', 'Hold Captain', 'Industrial Fisher', 'Ocean Harvester'],
    masterTitle: 'The Devastator',
    xpPerAction: 4,
    xplevels: [0, 75, 230, 550, 1150, 2400, 4800, 9600, 19200, 38400,
               76800, 153600, 307200, 614400, 1228800, 2457600, 4915200,
               9830400, 19660800, 39321600],
  },
  free_diving: {
    name: 'Free Diving Mastery',
    title: ['Surface Breather', 'Shallow Diver', 'Depth Seeker', 'Breath Holder', 'Ocean Phantom'],
    masterTitle: 'The Silent Hunter',
    xpPerAction: 12,
    xplevels: [0, 110, 340, 800, 1700, 3400, 6800, 13600, 27200, 54400,
               108800, 217600, 435200, 870400, 1740800, 3481600, 6963200,
               13926400, 27852800, 55705600],
  },
  scuba_diving: {
    name: 'SCUBA Mastery',
    title: ['Tank Novice', 'Wreck Diver', 'Deep Explorer', 'Cave Diver', 'Abyssal Pioneer'],
    masterTitle: 'Lord of the Deep',
    xpPerAction: 9,
    xplevels: [0, 95, 300, 710, 1500, 3000, 6000, 12000, 24000, 48000,
               96000, 192000, 384000, 768000, 1536000, 3072000, 6144000,
               12288000, 24576000, 49152000],
  },
  jigging: {
    name: 'Jigging Mastery',
    title: ['Rhythm Beginner', 'Beat Keeper', 'Jig Artist', 'Rhythm Master', 'The Percussionist'],
    masterTitle: 'Master Jigger',
    xpPerAction: 11,
    xplevels: [0, 105, 330, 770, 1600, 3200, 6400, 12800, 25600, 51200,
               102400, 204800, 409600, 819200, 1638400, 3276800, 6553600,
               13107200, 26214400, 52428800],
  },
  ice_fishing: {
    name: 'Ice Fishing Mastery',
    title: ['Ice Beginner', 'Hole Digger', 'Frozen Angler', 'Winter Fisher', 'Arctic Master'],
    masterTitle: 'Lord of the Frozen Deep',
    xpPerAction: 8,
    xplevels: [0, 90, 280, 650, 1400, 2800, 5600, 11200, 22400, 44800,
               89600, 179200, 358400, 716800, 1433600, 2867200, 5734400,
               11468800, 22937600, 45875200],
  },
  surf_casting: {
    name: 'Surf Casting Mastery',
    title: ['Beach Newbie', 'Wave Reader', 'Surf Caster', 'Storm Chaser', 'Tide Master'],
    masterTitle: 'Rider of Storms',
    xpPerAction: 10,
    xplevels: [0, 100, 300, 700, 1500, 3000, 6000, 12000, 24000, 48000,
               96000, 192000, 384000, 768000, 1536000, 3072000, 6144000,
               12288000, 24576000, 49152000],
  },
  spearfishing: {
    name: 'Spearfishing Mastery',
    title: ['Spear Novice', 'Aim Learner', 'Lead Shooter', 'Deep Hunter', 'The Phantom'],
    masterTitle: 'The Spear Saint',
    xpPerAction: 15,
    xplevels: [0, 120, 380, 900, 1900, 3800, 7600, 15200, 30400, 60800,
               121600, 243200, 486400, 972800, 1945600, 3891200, 7782400,
               15564800, 31129600, 62259200],
  },
};

export class SkillTree {
  constructor(methodId) {
    this.methodId = methodId;
    this.data = METHOD_MASTERY[methodId];
    if (!this.data) throw new Error(`Unknown method: ${methodId}`);
    this.xp = 0;
    this.level = 1;
    this.totalXpGained = 0;
  }

  /** Add XP from using the method */
  addXp(amount = 1) {
    const gained = amount * this.data.xpPerAction;
    this.xp += gained;
    this.totalXpGained += gained;
    this._recalcLevel();
    return gained;
  }

  /** Recalculate level from XP */
  _recalcLevel() {
    const levels = this.data.xplevels;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (this.xp >= levels[i]) {
        if (i + 1 > this.level) {
          this.level = i + 1;
          return true; // leveled up
        }
        this.level = i + 1;
        return false;
      }
    }
    this.level = 1;
    return false;
  }

  /** Get XP needed for next level */
  xpToNextLevel() {
    if (this.level >= 20) return 0;
    const nextXp = this.data.xplevels[this.level];
    return Math.max(0, nextXp - this.xp);
  }

  /** Get current milestone info */
  getCurrentMilestone() {
    for (let i = SKILL_MILESTONES.length - 1; i >= 0; i--) {
      if (this.level >= SKILL_MILESTONES[i].level) return SKILL_MILESTONES[i];
    }
    return SKILL_MILESTONES[0];
  }

  /** Get next milestone */
  getNextMilestone() {
    for (const m of SKILL_MILESTONES) {
      if (this.level < m.level) return m;
    }
    return null;
  }

  /** Get gear wear multiplier (based on level 5 milestone) */
  getGearWearMultiplier() {
    return this.level >= 5 ? 0.8 : 1.0;
  }

  /** Get species bonus multiplier (based on level 10 milestone) */
  getSpeciesBonus() {
    return this.level >= 10 ? 1.3 : 1.0;
  }

  /** Can catch legendary fish? (level 20) */
  get canLegendary() { return this.level >= 20; }

  /** Has exclusive techniques? (level 15) */
  get hasExclusiveTechniques() { return this.level >= 15; }

  /** Get current title */
  getTitle() {
    if (this.level >= 20) return this.data.masterTitle;
    const idx = Math.min(Math.floor((this.level - 1) / 4), this.data.title.length - 1);
    return this.data.title[idx];
  }

  /** Get progress bar */
  getProgressBar() {
    const total = this.level >= 20 ? 1 : this.xpToNextLevel();
    const prevXp = this.data.xplevels[this.level - 1] ?? 0;
    const nextXp = this.data.xplevels[this.level] ?? this.xp;
    const progress = this.level >= 20 ? 1 : (this.xp - prevXp) / (nextXp - prevXp);
    const filled = Math.round(progress * 20);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    return `[${bar}] ${this.level}/20`;
  }

  /** Get full summary */
  getSummary() {
    return {
      method: this.methodId,
      name: this.data.name,
      level: this.level,
      title: this.getTitle(),
      xp: this.xp,
      xpToNext: this.xpToNextLevel(),
      progress: this.getProgressBar(),
      currentMilestone: this.getCurrentMilestone(),
      nextMilestone: this.getNextMilestone(),
      canLegendary: this.canLegendary,
      hasExclusive: this.hasExclusiveTechniques,
      gearWearMult: this.getGearWearMultiplier(),
      speciesBonus: this.getSpeciesBonus(),
    };
  }

  toString() {
    const s = this.getSummary();
    const lines = [
      `${s.name} — Level ${s.level} "${s.title}"`,
      `  Progress: ${s.progress}`,
      `  Current perk: ${s.currentMilestone.icon} ${s.currentMilestone.perk}`,
      `  ${s.nextMilestone ? `Next: ${s.nextMilestone.icon} Lvl ${s.nextMilestone.level} — ${s.nextMilestone.perk}` : 'MAX LEVEL!'}`,
    ];
    return lines.join('\n');
  }
}

export class SkillSystem {
  constructor() {
    this.trees = new Map(); // methodId -> SkillTree
  }

  /** Get or create a skill tree for a method */
  getTree(methodId) {
    if (!this.trees.has(methodId)) {
      this.trees.set(methodId, new SkillTree(methodId));
    }
    return this.trees.get(methodId);
  }

  /** Add XP to a method */
  addXp(methodId, amount = 1) {
    return this.getTree(methodId).addXp(amount);
  }

  /** Get all skill summaries */
  getAllSummaries() {
    const summaries = {};
    for (const [id, tree] of this.trees) {
      summaries[id] = tree.getSummary();
    }
    return summaries;
  }

  /** Get highest title across all methods */
  getBestTitle() {
    let best = null, bestLevel = 0;
    for (const [, tree] of this.trees) {
      if (tree.level > bestLevel) {
        bestLevel = tree.level;
        best = { method: tree.methodId, title: tree.getTitle(), level: tree.level };
      }
    }
    return best;
  }
}

export { METHOD_MASTERY, SKILL_MILESTONES };
export default SkillSystem;
