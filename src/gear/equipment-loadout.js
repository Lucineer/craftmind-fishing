// CraftMind Fishing — Equipment Loadout Manager
// Slot-based gear matching, compatibility checks, species recommendations.

import { ALL_GEAR, getRecommendedGear } from './alaska-gear.js';

const LOADOUT_SLOTS = ['rod', 'reel', 'main_line', 'leader', 'terminal', 'bait', 'attractor', 'specialty'];

const PRESET_LOADOUTS = {
  halibut_setup: {
    name: 'Halibut Setup',
    emoji: '🐟',
    slots: {
      rod: 'halibut_rod',
      reel: 'shimano_talica',
      main_line: 'braid_80lb',
      leader: 'wire_leader_100lb',
      terminal: 'circle_hook',
      bait: 'herring',
      attractor: null,
      specialty: 'harpoon',
    },
    description: 'The barn door hunter. Circle hook, 80lb braid, Talica lever drag.',
  },
  trolling_spread: {
    name: 'Trolling Spread',
    emoji: '🚤',
    slots: {
      rod: 'trolling_rod',
      reel: 'daiwa_sea_line',
      main_line: 'mono_20lb',
      leader: null,
      terminal: 'hoochie',
      bait: null,
      attractor: 'flasher',
      specialty: 'downrigger',
    },
    description: 'Flasher and hoochie behind a downrigger. The Sitka charter standard.',
  },
  lingcod_jigging: {
    name: 'Lingcod Jigging',
    emoji: '🪓',
    slots: {
      rod: 'dinglebar_rod',
      reel: 'shimano_talica',
      main_line: 'braid_80lb',
      leader: 'wire_leader_80lb',
      terminal: 'dinglebar_hook',
      bait: null,
      attractor: null,
      specialty: null,
    },
    description: 'Pound the bottom with 16oz jigs. Wire leader is mandatory.',
  },
  mooching_kings: {
    name: 'Mooching Kings',
    emoji: '🎣',
    slots: {
      rod: 'heavy_mooching_rod',
      reel: 'level_wind_reel',
      main_line: 'dacron_30lb',
      leader: 'mono_20lb',
      terminal: 'mooching_rig',
      bait: 'herring',
      attractor: null,
      specialty: null,
    },
    description: 'Drift with cut-plug herring. Old school. Still works.',
  },
  beach_day: {
    name: 'Beach Day',
    emoji: '🏖️',
    slots: {
      rod: 'medium_spin_rod',
      reel: 'spinning_reel',
      main_line: 'mono_20lb',
      leader: null,
      terminal: 'buzz_bomb',
      bait: null,
      attractor: null,
      specialty: null,
    },
    description: 'Pink salmon from shore with a buzz bomb. Cast and retrieve. Simple.',
  },
  dive_rig: {
    name: 'Dive Rig',
    emoji: '🤿',
    slots: {
      rod: null,
      reel: null,
      main_line: null,
      leader: null,
      terminal: null,
      bait: null,
      attractor: null,
      specialty: 'spear',
    },
    description: 'Free-dive spearfishing. Bring a 5mm wetsuit, mask, fins, dive knife.',
  },
  crab_pot_set: {
    name: 'Crab Pot Set',
    emoji: '🦀',
    slots: {
      rod: null,
      reel: 'hand_reel',
      main_line: 'pot_line',
      leader: null,
      terminal: null,
      bait: 'herring',
      attractor: null,
      specialty: 'dungeness_pot',
    },
    description: 'Soak pots overnight. Check at dawn. Bring bait cooler.',
  },
  river_fly: {
    name: 'River Fly',
    emoji: '🪰',
    slots: {
      rod: 'fly_rod',
      reel: 'fly_reel',
      main_line: 'mono_10lb',
      leader: 'mono_10lb',
      terminal: null,
      bait: null,
      attractor: null,
      specialty: null,
    },
    description: 'Dolly Varden and cutthroat on the fly. Peaceful.',
  },
};

// ─── Compatibility Rules ──────────────────────────────────────────────

const COMPATIBILITY = {
  // { slotA: value, slotB: value, warning: string, penalty: number }
  rod_reel_mismatch: {
    check: (slots) => {
      const rod = ALL_GEAR[slots.rod];
      const reel = ALL_GEAR[slots.reel];
      if (!rod || !reel) return null;
      if (rod.maxLineWeight && reel.maxLineWeight && rod.maxLineWeight > reel.maxLineWeight * 2) {
        return { warning: `Your ${rod.name} needs a stronger reel. ${reel.name} max drag might not hold.`, penalty: 0.3 };
      }
      return null;
    },
  },
  line_rod_mismatch: {
    check: (slots) => {
      const line = ALL_GEAR[slots.main_line];
      const rod = ALL_GEAR[slots.rod];
      if (!line || !rod) return null;
      if (line.breakStrength && rod.maxLineWeight && line.breakStrength > rod.maxLineWeight * 1.5) {
        return { warning: `${line.name} is overkill for your ${rod.name}. You'll break the rod before the line.`, penalty: 0.2 };
      }
      return null;
    },
  },
  no_wire_for_lingcod: {
    check: (slots, targetSpecies) => {
      if (targetSpecies === 'lingcod' && slots.leader && slots.leader !== 'wire_leader_40lb' && slots.leader !== 'wire_leader_80lb' && slots.leader !== 'wire_leader_100lb') {
        return { warning: 'Lingcod teeth will cut through that leader. Use wire.', penalty: 0.5 };
      }
      return null;
    },
  },
  no_circle_hook_halibut: {
    check: (slots, targetSpecies) => {
      if (targetSpecies === 'halibut' && slots.terminal && slots.terminal !== 'circle_hook') {
        return { warning: 'ALASKA REGULATION: You MUST use circle hooks for halibut. This is not a suggestion.', penalty: 0.9 };
      }
      return null;
    },
  },
  flasher_without_hoochie: {
    check: (slots) => {
      if (slots.attractor === 'flasher' && slots.terminal !== 'hoochie' && slots.terminal !== 'mooching_rig' && slots.terminal !== 'herring_rigs') {
        return { warning: 'Flasher works best with a hoochie or herring rig behind it.', penalty: 0.1 };
      }
      return null;
    },
  },
  mono_for_deep_halibut: {
    check: (slots, targetSpecies) => {
      if (targetSpecies === 'halibut' && slots.main_line?.startsWith('mono_')) {
        return { warning: 'Mono stretches too much at 300 feet. Switch to braid for halibut.', penalty: 0.3 };
      }
      return null;
    },
  },
};

export class Loadout {
  constructor(name = 'Custom') {
    this.name = name;
    this.slots = { rod: null, reel: null, main_line: null, leader: null, terminal: null, bait: null, attractor: null, specialty: null };
    this.savedLoadouts = new Map();
  }

  /** Equip gear into a slot */
  equip(slot, gearId) {
    if (!LOADOUT_SLOTS.includes(slot)) throw new Error(`Unknown slot: ${slot}`);
    if (gearId !== null && !ALL_GEAR[gearId]) throw new Error(`Unknown gear: ${gearId}`);
    this.slots[slot] = gearId;
    return true;
  }

  /** Unequip a slot */
  unequip(slot) {
    this.slots[slot] = null;
  }

  /** Get gear in a slot */
  getSlot(slot) {
    return this.slots[slot] ? ALL_GEAR[this.slots[slot]] : null;
  }

  /** Validate the loadout, returning warnings and penalties */
  validate(targetSpecies = null) {
    const warnings = [];
    let totalPenalty = 0;

    for (const [, rule] of Object.entries(COMPATIBILITY)) {
      const result = rule.check(this.slots, targetSpecies);
      if (result) {
        warnings.push(result.warning);
        totalPenalty += result.penalty;
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
      effectivenessPenalty: totalPenalty,
      effectivenessMult: Math.max(0.1, 1.0 - totalPenalty),
    };
  }

  /** Get recommendations for a target species */
  getRecommendation(speciesId) {
    const recommended = getRecommendedGear(speciesId);
    const byCategory = {};
    for (const gear of recommended) {
      const cat = gear.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(gear);
    }

    // Map categories to slots
    const suggestions = {};
    const slotMap = {
      rod: ['rod'],
      reel: ['reel'],
      main_line: ['line'],
      leader: ['line'],
      terminal: ['hook'],
      attractor: ['specialty'],
      specialty: ['specialty', 'net', 'trap', 'boat', 'dive'],
    };

    for (const [slot, categories] of Object.entries(slotMap)) {
      for (const cat of categories) {
        const match = byCategory[cat]?.find(g => g.tier <= 3);
        if (match) {
          suggestions[slot] = match.id;
          break;
        }
      }
    }

    return suggestions;
  }

  /** Auto-equip for a species */
  autoEquip(speciesId) {
    const suggestions = this.getRecommendation(speciesId);
    for (const [slot, gearId] of Object.entries(suggestions)) {
      this.slots[slot] = gearId;
    }
    return suggestions;
  }

  /** Save current loadout */
  save(name) {
    this.savedLoadouts.set(name, { ...this.slots });
    return true;
  }

  /** Load a saved loadout */
  load(name) {
    const saved = this.savedLoadouts.get(name);
    if (!saved) return false;
    this.slots = { ...saved };
    this.name = name;
    return true;
  }

  /** Load a preset */
  loadPreset(presetId) {
    const preset = PRESET_LOADOUTS[presetId];
    if (!preset) return false;
    this.slots = { ...preset.slots };
    this.name = preset.name;
    return { name: preset.name, description: preset.description };
  }

  /** Get list of saved loadouts */
  listSaved() {
    return [...this.savedLoadouts.keys()];
  }

  /** Get display of current loadout */
  getDisplay() {
    const lines = [`📦 ${this.name}`];
    for (const slot of LOADOUT_SLOTS) {
      const gear = this.getSlot(slot);
      const slotLabel = slot.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      lines.push(`  ${slotLabel}: ${gear ? `${gear.emoji} ${gear.name} [T${gear.tier}]` : '(empty)'}`);
    }
    return lines.join('\n');
  }

  /** Get available presets */
  static getPresetNames() {
    return Object.keys(PRESET_LOADS);
  }

  /** Get all presets */
  static getPreset(id) {
    return PRESET_LOADOUTS[id] ?? null;
  }

  /** Get all presets */
  static getAllPresets() {
    return { ...PRESET_LOADOUTS };
  }
}

export { LOADOUT_SLOTS, PRESET_LOADOUTS };
export default Loadout;
