// CraftMind Fishing — Landmarks & Discovery System
// Points of interest that players discover by exploring Sitka Sound.

export const DISCOVERABLE_LOCATIONS = [
  {
    id: 'halibut_hole',
    name: 'Halibut Hole',
    emoji: '🐟',
    type: 'fishing_spot',
    tier: 'legendary',
    cx: 250, cz: 180, radius: 10,
    description: 'A famous deep pocket near shore where trophy halibut gather.',
    discoveryText: 'You found Halibut Hole! A deep pocket where the big flatties wait. Local knowledge says 100+ lb barn doors live here.',
    benefits: { halibutSpawnBonus: 2.0, trophyChance: 0.15, depthBonus: 30 },
    hints: ['Old salts talk about a deep hole south of Baranof...', 'Follow the charter boats at dawn. They know something.'],
  },
  {
    id: 'whales_mouth',
    name: "The Whale's Mouth",
    emoji: '🐋',
    type: 'cave',
    tier: 'legendary',
    cx: 300, cz: 270, radius: 8,
    description: 'An underwater cave system where rare species shelter.',
    discoveryText: "You found The Whale's Mouth! An underwater cave entrance shaped like... well. Rare species shelter in the darkness within.",
    benefits: { rareSpeciesBonus: 1.5, uniqueSpecies: ['wolffish', 'sleeper_shark'], depthRange: [15, 45] },
    hints: ['Something dark lurks beneath the surface near The Gut...', 'If you see bubbles rising from nowhere, investigate.'],
  },
  {
    id: 'old_cannery',
    name: 'Old Cannery',
    emoji: '🏭',
    type: 'ruins',
    tier: 'rare',
    cx: 170, cz: 250, radius: 10,
    description: 'An abandoned cannery from the 1920s fish boom. Gear and lore remain.',
    discoveryText: 'You found the Old Cannery! Abandoned since the 1920s salmon boom. There\'s rusted gear here, and maybe something useful.',
    benefits: { gearLoot: true, lore: 'cannery_history', salvageItems: ['old_net', 'rusty_hook', 'cannery_key'] },
    hints: ['The old-timers mention a cannery that burned down decades ago...', 'Wood pilings visible at low tide on the south shore.'],
  },
  {
    id: 'tlingit_fish_trap',
    name: 'Tlingit Fish Trap',
    emoji: '🏛️',
    type: 'historical',
    tier: 'rare',
    cx: 155, cz: 275, radius: 6,
    description: 'An ancient stone fish trap built by the Tlingit people. Still works.',
    discoveryText: 'You discovered a Tlingit Fish Trap! Ancient stone walls guide salmon into a natural pocket. Ingenious. This trap has worked for centuries.',
    benefits: { passiveSalmonCatch: true, culturalBonus: true, salmonSpawnBonus: 1.3 },
    hints: ['Elders speak of stone walls in the shallows that catch fish without lines...', 'At extreme low tide, look for unusual rock formations.'],
  },
  {
    id: 'shipwreck_cove',
    name: 'Shipwreck Cove',
    emoji: '🚢',
    type: 'wreck',
    tier: 'epic',
    cx: 350, cz: 190, radius: 8,
    description: 'A sunken fishing boat. Sharks gather around the wreck. Treasure?',
    discoveryText: 'You found Shipwreck Cove! A 40-foot fishing boat rests on the bottom. Sharks circle the wreck. Something glints in the hold...',
    benefits: { sharkSpawnBonus: 2.0, treasureChance: 0.1, uniqueSpecies: ['sixgill_shark'] },
    hints: ['A boat went down near Kruzof in \'98. Never salvaged.', 'Depth finder shows a hard return that doesn\'t match the charts.'],
  },
  {
    id: 'hot_springs',
    name: 'The Hot Springs',
    emoji: '♨️',
    type: 'natural',
    tier: 'rare',
    cx: 95, cz: 310, radius: 6,
    description: 'Underwater thermal vent. Warm water attracts unusual species.',
    discoveryText: 'You found The Hot Springs! A thermal vent warms the water here. Strange creatures gather in the warmth. The water feels like bathwater.',
    benefits: { uniqueSpecies: ['scallop', 'shrimp'], warmthBonus: true, healingEffect: true },
    hints: ['The water feels warmer near this cove...', 'Steam rises from the surface on cold mornings.'],
  },
  {
    id: 'edgecumbe_ring',
    name: 'Edgecumbe Ring',
    emoji: '🌋',
    type: 'fishing_ring',
    tier: 'epic',
    cx: 320, cz: 140, radius: 25,
    description: 'Volcanic ring of incredible fishing around Mount Edgecumbe.',
    discoveryText: 'You mapped the Edgecumbe Ring! The volcanic seamounts around Mount Edgecumbe create upwelling that feeds everything. This is world-class fishing.',
    benefits: { allSpeciesBonus: 1.3, rockfishBonus: 2.0, lingcodBonus: 1.5 },
    hints: ['The best fishing in Sitka isn\'t in the Sound — it\'s around the volcano.', 'Follow the birds circling Mount Edgecumbe. They know where the bait is.'],
  },
  {
    id: 'sea_otter_raft',
    name: 'Sea Otter Raft',
    emoji: '🦦',
    type: 'wildlife',
    tier: 'rare',
    cx: 180, cz: 320, radius: 8,
    description: 'A family of sea otters gathered in Mist Cove. Adorable and amazing.',
    discoveryText: 'You found the Sea Otter Raft! A dozen otters float in a circle in Mist Cove, wrapping themselves in kelp. Pups play while mothers crack urchins on their bellies. This is why you came to Alaska.',
    benefits: { karmaBonus: 50, otterPhotos: true, uniqueSpecies: ['sea_otter'] },
    hints: ['Mist Cove is shrouded in fog most days. But sometimes you hear splashing...', 'Local kayakers know a place where otters gather. They won\'t share the location.'],
  },
  {
    id: 'the_hatchery',
    name: 'Medvejie Hatchery',
    emoji: '🏗️',
    type: 'facility',
    tier: 'uncommon',
    cx: 165, cz: 240, radius: 8,
    description: 'A working salmon hatchery. Buy fry, learn about the salmon lifecycle.',
    discoveryText: 'You found Medvejie Hatchery! Salmon cycle through here — eggs, fry, smolt, and release. The biologist has tips about where the fish go.',
    benefits: { buyFry: true, salmonKnowledge: true, fishIdentification: true },
    hints: ['Follow Indian River upstream from town...', 'The hatchery has been releasing salmon since the 1970s.'],
  },
  {
    id: 'the_lighthouse',
    name: 'Sitka Lighthouse',
    emoji: '🗼',
    type: 'viewpoint',
    tier: 'uncommon',
    cx: 140, cz: 260, radius: 5,
    description: 'Coastal lighthouse with weather station and the best fishing tip board.',
    discoveryText: 'You found the Sitka Lighthouse! The keeper posts daily fishing reports, weather warnings, and sea conditions. The tip board is gold.',
    benefits: { weatherReport: true, fishingTips: true, mapReveal: true },
    hints: ['The old lighthouse still operates. The keeper knows more than any sonar...', 'Climb the path past the cemetery at the edge of town.'],
  },
  {
    id: 'iceberg_alley',
    name: 'Iceberg Alley',
    emoji: '🧊',
    type: 'natural',
    tier: 'epic',
    cx: 400, cz: 100, radius: 15,
    description: 'Calved icebergs from nearby glaciers. Cold water species thrive here.',
    discoveryText: 'You found Iceberg Alley! Massive chunks of glacier ice float in the frigid water. The cold upwelling brings deep-water species to the surface. Watch for ice.'
    ,
    benefits: { coldWaterSpecies: true, uniqueSpecies: ['sablefish', 'sleeper_shark'], visibilityReduced: true },
    hints: ['North of Kruzof, the water turns milky blue. That\'s glacial flour.', 'Icebergs mean cold water. Cold water means big fish.'],
  },
  {
    id: 'volcanic_vent',
    name: 'Volcanic Vent',
    emoji: '🔥',
    type: 'natural',
    tier: 'legendary',
    cx: 330, cz: 130, radius: 5,
    description: 'Deep volcanic vent near Mount Edgecumbe. Exotic warm-water species.',
    discoveryText: 'You found the Volcanic Vent! A crack in the seafloor near Edgecumbe vents superheated water. Exotic species that don\'t belong in Alaska gather here. The water shimmers with heat.',
    benefits: { uniqueSpecies: ['sunfish', 'sea_turtle', 'tiger_rockfish'], exoticBonus: 3.0 },
    hints: ['The bottom temp near Edgecumbe is wrong. Too warm. Something\'s down there.', 'Sonar shows heat blooms on the bottom. Dive at your own risk.'],
  },
];

export class LandmarkSystem {
  constructor() {
    this.discovered = new Set();
    this.discoveryLog = [];
  }

  /** Discover a landmark */
  discover(locationId) {
    const loc = DISCOVERABLE_LOCATIONS.find(l => l.id === locationId);
    if (!loc) return { success: false, message: `Unknown location: ${locationId}` };
    if (this.discovered.has(locationId)) {
      return { success: false, message: `Already discovered: ${loc.name}`, location: loc };
    }

    this.discovered.add(locationId);
    this.discoveryLog.push({
      id: locationId,
      name: loc.name,
      tier: loc.tier,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: loc.discoveryText,
      location: loc,
      totalDiscovered: this.discovered.size,
      totalLocations: DISCOVERABLE_LOCATIONS.length,
    };
  }

  /** Check if a position discovers anything */
  checkPosition(x, z) {
    for (const loc of DISCOVERABLE_LOCATIONS) {
      if (this.discovered.has(loc.id)) continue;
      const dx = x - loc.cx, dz = z - loc.cz;
      if (Math.sqrt(dx * dx + dz * dz) <= loc.radius) {
        return this.discover(loc.id);
      }
    }
    return null;
  }

  /** Get a hint for an undiscovered location */
  getHint() {
    const undiscovered = DISCOVERABLE_LOCATIONS.filter(l => !this.discovered.has(l.id));
    if (undiscovered.length === 0) return null;
    const loc = undiscovered[Math.floor(Math.random() * undiscovered.length)];
    const hint = loc.hints[Math.floor(Math.random() * loc.hints.length)];
    return { location: loc.name, hint };
  }

  /** Get all discoverable locations */
  static getAllLocations() { return [...DISCOVERABLE_LOCATIONS]; }

  /** Get discovered locations */
  getDiscovered() { return [...this.discovered]; }

  /** Get discovery progress */
  getProgress() {
    return {
      discovered: this.discovered.size,
      total: DISCOVERABLE_LOCATIONS.length,
      percent: Math.round(this.discovered.size / DISCOVERABLE_LOCATIONS.length * 100),
      byTier: Object.fromEntries(
        DISCOVERABLE_LOCATIONS.filter(l => this.discovered.has(l.id))
          .reduce((m, l) => m.set(l.tier, (m.get(l.tier) ?? 0) + 1), new Map())
      ),
    };
  }

  /** Get location details */
  static getLocation(id) {
    return DISCOVERABLE_LOCATIONS.find(l => l.id === id) ?? null;
  }
}

export default LandmarkSystem;
