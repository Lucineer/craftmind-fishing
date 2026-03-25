// CraftMind Fishing — Alaska Boat Types
// Real Southeast Alaska fishing vessels. Each has its own character, crew requirements, and compatible methods.

/** Alaska-specific boat types with authentic descriptions */
export const ALASKA_BOAT_TYPES = {
  skiff: {
    id: 'skiff',
    name: '14ft Aluminum Skiff',
    description: 'The workhorse of Southeast Alaska. Every fisherman starts here. Every old salt still has one tied to the dock.',
    icon: '🚣',
    speed: 2,
    seaWorthiness: 1,       // 1-10 — do NOT take this offshore
    capacity: 1,
    crewRequired: 1,
    maxCrew: 2,
    hull: 'aluminum',
    fuelConsumption: 2,     // gallons per hour
    fishHold: 100,          // pounds
    cost: 500,
    upgradeSlots: 1,
    compatibleMethods: ['bait_casting', 'pot_dungeness', 'river_fishing', 'trolling_light'],
    upgrades: ['engine', 'electronics', 'hull'],
    flavor: 'A 14-foot aluminum skiff with a 25-horse Yamaha and a couple of rod holders. Gets you to the fishing grounds and back — if the weather holds. Don\'t even think about crossing the bar in anything over 4-foot seas.',
  },

  charter: {
    id: 'charter',
    name: '28ft Charter Boat',
    description: 'The Sitka sport fishing standard. Takes 6 clients out for halibut and salmon. Heated cabin, head, and a beer cooler.',
    icon: '🚤',
    speed: 4,
    seaWorthiness: 5,
    capacity: 6,
    crewRequired: 1,
    maxCrew: 7,
    hull: 'fiberglass',
    fuelConsumption: 8,
    fishHold: 500,
    cost: 5000,
    upgradeSlots: 3,
    compatibleMethods: ['halibut_longlining', 'salmon_trolling', 'dinglebar_jigging', 'pot_dungeness', 'river_fishing'],
    upgrades: ['engine', 'electronics', 'downriggers', 'radar', 'hull'],
    flavor: '"Capt. Cody\'s Sport Fishing" painted on the transom in tasteful gold lettering. Clients show up at 5 AM with coffee and excitement. By noon they\'re puking over the rail and you\'re hand-feeding them saltines. This is the charter life.',
  },

  seiner: {
    id: 'seiner',
    name: '58ft Purse Seiner',
    description: 'A salmon-catching machine. The net alone is worth more than some boats. Summer only — these boats sit idle the rest of the year.',
    icon: '🥅',
    speed: 3,
    seaWorthiness: 6,
    capacity: 4,
    crewRequired: 4,
    maxCrew: 5,
    hull: 'wood_or_steel',
    fuelConsumption: 15,
    fishHold: 40000,        // pounds — they hold THOUSANDS
    cost: 50000,
    upgradeSlots: 4,
    compatibleMethods: ['purse_seining'],
    upgrades: ['engine', 'sonar', 'power_block', 'net', 'hydraulics', 'electronics'],
    deckLayout: {
      bow: 'skiff_davit',
      port: 'net_reel',
      starboard: 'power_block',
      stern: 'fish_hold',
      below: 'engine_room',
    },
    flavor: 'Fifty-eight feet of purpose-built salmon-catching fury. The net reel dominates the deck. The skiff hangs off the stern on a davit, ready to launch at a moment\'s notice. In July, this boat is a money printer. In January, it\'s an expensive dock ornament.',
  },

  longliner: {
    id: 'longliner',
    name: '42ft Longliner',
    description: 'The halibut boat. Not fast, not fancy, but it\'ll sit on the grounds all day while 100 hooks soak. Hydraulic hauler does the heavy lifting.',
    icon: '🪝',
    speed: 3,
    seaWorthiness: 5,
    capacity: 3,
    crewRequired: 2,
    maxCrew: 3,
    hull: 'fiberglass',
    fuelConsumption: 10,
    fishHold: 5000,
    cost: 30000,
    upgradeSlots: 3,
    compatibleMethods: ['halibut_longlining', 'pot_dungeness', 'dinglebar_jigging'],
    upgrades: ['engine', 'hauler', 'electronics', 'radar', 'hull'],
    deckLayout: {
      bow: 'anchor',
      port: 'line_hauler',
      starboard: 'bait_station',
      stern: 'gangway',
      below: 'fish_hold',
    },
    flavor: 'The longliner doesn\'t look like much. Fiberglass hull with peeling paint, a hydraulic hauler bolted to the deck, and a bait station that smells like death warmed over. But when those hooks come up full of halibut, you forget the smell. You forget the 14-hour shifts. You remember why you do this.',
  },

  crabber: {
    id: 'crabber',
    name: '107ft Crab Boat',
    description: 'The Bering Sea warrior. Built for punishment. Takes a beating and keeps fishing. The bridge is five stories above the water.',
    icon: '🦀',
    speed: 3,
    seaWorthiness: 9,
    capacity: 4,
    crewRequired: 4,
    maxCrew: 6,
    hull: 'steel',
    fuelConsumption: 40,
    fishHold: 100000,
    cost: 100000,
    upgradeSlots: 5,
    compatibleMethods: ['king_crab', 'pot_king', 'longlining_heavy'],
    upgrades: ['engine', 'crane', 'pot_puller', 'radar', 'ice_pumps', 'hull_reinforcement'],
    deckLayout: {
      bow: 'anchor_windlass',
      port: 'pot_launcher',
      starboard: 'pot_stack',
      stern: 'pot_puller',
      bridge: 'wheelhouse_5_stories',
      below: 'engine_room_hold',
    },
    flavor: 'A hundred and seven feet of steel built for one purpose: survive the Bering Sea and come back full of crab. The crane groans under the weight of pots. The pot puller never stops. The crew works 30-hour shifts and sleeps in bunks that smell like diesel and sweat. This boat has saved lives. This boat has ended careers. This boat is everything.',
  },

  dive_tender: {
    id: 'dive_tender',
    name: '24ft Dive Tender',
    description: 'Small, stable, purpose-built for dive fisheries. Platform on the stern, tank racks, and a heater. Nothing fancy.',
    icon: '🤿',
    speed: 3,
    seaWorthiness: 4,
    capacity: 2,
    crewRequired: 1,
    maxCrew: 3,
    hull: 'aluminum',
    fuelConsumption: 5,
    fishHold: 500,
    cost: 3000,
    upgradeSlots: 2,
    compatibleMethods: ['dive_sea_cucumber', 'dive_geoduck'],
    upgrades: ['engine', 'platform', 'heater', 'tank_racks'],
    flavor: 'A bare-bones aluminum hull with a dive platform bolted to the transom. Tank racks along the gunwale. A propane heater in the tiny cabin. The tender bobs while the divers are below, the tender operator watching their bubbles and counting the minutes. Quiet work. Dangerous if you\'re not careful.',
  },

  troller: {
    id: 'troller',
    name: '50ft Troller',
    description: 'The gentleman\'s fishing boat. Trolls slowly through Southeast Alaska\'s Inside Passage, pulling gear at 2 knots. Patience pays.',
    icon: '🎣',
    speed: 2,
    seaWorthiness: 6,
    capacity: 3,
    crewRequired: 2,
    maxCrew: 3,
    hull: 'wood',
    fuelConsumption: 6,
    fishHold: 2000,
    cost: 25000,
    upgradeSlots: 3,
    compatibleMethods: ['salmon_trolling'],
    upgrades: ['engine', 'downriggers', 'electronics', 'gurdies', 'hull'],
    deckLayout: {
      bow: 'pulpit',
      port: 'gurdy_1',
      starboard: 'gurdy_2',
      stern: 'kelp_roller',
      cabin: 'wheelhouse',
      below: 'fish_hold',
    },
    flavor: 'Wooden trollers are a dying breed in Southeast Alaska, but the ones still fishing carry on a tradition that goes back a hundred years. The gurdies (winches) click rhythmically as the lines play out behind the boat. Salmon strike the trolled herring and the gurdy screams. The troller captain doesn\'t rush. Never rushes. The fish will come.',
  },

  skiff_wood: {
    id: 'skiff_wood',
    name: '16ft Wooden Skiff',
    description: 'Hand-built, leaky, and perfect. The kind of boat your grandfather would approve of. Slow but soulful.',
    icon: '🛶',
    speed: 1.5,
    seaWorthiness: 1,
    capacity: 1,
    crewRequired: 1,
    maxCrew: 1,
    hull: 'wood',
    fuelConsumption: 1,
    fishHold: 50,
    cost: 200,
    upgradeSlots: 0,
    compatibleMethods: ['bait_casting', 'river_fishing'],
    upgrades: [],
    flavor: 'Cedar planks, copper rivets, and about a hundred hours of work. She leaks a little, but every wooden skiff does. Paddles better than she motors. Catches fish anyway. Some things don\'t need to be fast. They just need to float.',
  },
};

/** Get boat types compatible with a fishing method */
export function getBoatsForMethod(methodId) {
  return Object.values(ALASKA_BOAT_TYPES).filter(b => b.compatibleMethods.includes(methodId));
}

/** Check if a boat can operate in given conditions */
export function canBoatOperate(boatType, conditions = {}) {
  const boat = ALASKA_BOAT_TYPES[boatType];
  if (!boat) return { canOperate: false, reason: 'Unknown boat type' };

  const seaState = conditions.seaState ?? 0; // 0-10 (Beaufort-like)
  const wind = conditions.wind ?? 0;         // knots

  if (seaState > boat.seaWorthiness * 1.2) {
    return { canOperate: false, reason: `Seas too rough for ${boat.name} (sea state ${seaState} vs rating ${boat.seaWorthiness})` };
  }
  if (wind > 30 && boat.seaWorthiness < 4) {
    return { canOperate: false, reason: 'Wind too strong for small boat' };
  }

  return { canOperate: true };
}

/** Boat upgrade definitions */
export const BOAT_UPGRADES = {
  engine: {
    name: 'Engine Upgrade',
    levels: [
      { name: 'Stock', effect: { speed: 0 }, cost: 0 },
      { name: 'Repowered', effect: { speed: 1, fuelConsumption: -0.5 }, cost: 2000 },
      { name: 'Turbo Diesel', effect: { speed: 2, fuelConsumption: -1 }, cost: 8000 },
    ],
  },
  electronics: {
    name: 'Electronics Package',
    levels: [
      { name: 'None', effect: { radarRange: 0 }, cost: 0 },
      { name: 'Basic Fish Finder', effect: { radarRange: 10 }, cost: 500 },
      { name: 'GPS + Sonar', effect: { radarRange: 20 }, cost: 2000 },
      { name: 'Full Suite', effect: { radarRange: 40 }, cost: 6000 },
    ],
  },
  radar: {
    name: 'Radar System',
    levels: [
      { name: 'None', effect: { radarRange: 0 }, cost: 0 },
      { name: 'Small Dome', effect: { radarRange: 15 }, cost: 1500 },
      { name: 'Open Array', effect: { radarRange: 30 }, cost: 5000 },
    ],
  },
  hull: {
    name: 'Hull Reinforcement',
    levels: [
      { name: 'Stock', effect: { seaWorthiness: 0 }, cost: 0 },
      { name: 'Reinforced', effect: { seaWorthiness: 1 }, cost: 3000 },
      { name: 'Ice Class', effect: { seaWorthiness: 2 }, cost: 10000 },
    ],
  },
  downriggers: {
    name: 'Downriggers',
    levels: [
      { name: 'None', effect: { downriggerCount: 0 }, cost: 0 },
      { name: 'Manual', effect: { downriggerCount: 1 }, cost: 800 },
      { name: 'Electric x2', effect: { downriggerCount: 2 }, cost: 2500 },
    ],
  },
  ice_pumps: {
    name: 'Ice Prevention System',
    levels: [
      { name: 'None', effect: {}, cost: 0 },
      { name: 'Basic', effect: { iceResistance: 50 }, cost: 5000 },
      { name: 'Full System', effect: { iceResistance: 90 }, cost: 15000 },
    ],
  },
};

export default ALASKA_BOAT_TYPES;
