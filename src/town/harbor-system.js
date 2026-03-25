// CraftMind Fishing — Harbor & Moorage System
// Three harbors, boat docking, moorage fees, daily reports, coffee row intel.

export const HARBORS = {
  eliason: {
    id: 'eliason',
    name: 'Eliason Harbor',
    description: "Sitka's main harbor. Hundreds of boats — seiners, longliners, trollers, charter boats, recreational vessels, and the occasional visiting yacht. This is where it all happens.",
    slips: {
      total: 320,
      available: () => Math.floor(Math.random() * 15) + 2,
      pricePerFoot: 4.50, // monthly
      maxBoatLength: 65,
    },
    features: ['fuel_dock', 'boat_ramp', 'harbormaster_office', 'ice_plant', 'fish_cleaning_station', 'parking'],
    atmosphere: "Diesel, kelp, and coffee. Old fishermen on the dock at 6am drinking thermos coffee and sharing intel — that's 'coffee row.'",
    position: { x: 10, y: 62, z: 90 },
  },
  anb: {
    id: 'anb',
    name: 'ANB Harbor',
    description: 'Commercial fishing harbor. Named after the Alaska Native Brotherhood. Bigger boats, industrial feel. Seiners and longliners call this home.',
    slips: {
      total: 80,
      available: () => Math.floor(Math.random() * 5) + 1,
      pricePerFoot: 3.75,
      maxBoatLength: 100,
    },
    features: ['fuel_dock', 'crane', 'net_loft', 'ice_plant', 'industrial_dock'],
    atmosphere: 'Work boats only. Forklifts, net spreads, the sound of hydraulic winches. This is the serious harbor.',
    position: { x: 55, y: 63, z: 78 },
  },
  crescent: {
    id: 'crescent',
    name: 'Crescent Harbor',
    description: 'Small boat harbor near downtown. Recreational fleet, small skiffs, a few charter boats. Quieter, more protected.',
    slips: {
      total: 150,
      available: () => Math.floor(Math.random() * 20) + 5,
      pricePerFoot: 3.25,
      maxBoatLength: 35,
    },
    features: ['boat_ramp', 'parking', 'dock'],
    atmosphere: 'Quiet mornings, families launching boats, kids with fishing rods. The weekend warrior harbor.',
    position: { x: 45, y: 62, z: 95 },
  },
};

/**
 * SitkaHarbor — manages all three harbors, moorage, and daily activity
 */
export class SitkaHarbor {
  constructor() {
    this.dockedBoats = new Map(); // boatId -> { name, harbor, slip, length, owner }
    this.dailyLog = [];
    this.moorageRecords = new Map(); // boatId -> { harbor, slip, paidThrough, cost }
    this.coffeeRowIntel = [];
    this._generateCoffeeRowIntel();
  }

  /**
   * Dock a boat at a specific harbor and slip
   */
  dock(boatId, options = {}) {
    const { name = boatId, harbor = 'eliason', slip = null, length = 25, owner = 'player' } = options;
    const harborData = HARBORS[harbor];
    if (!harborData) return { success: false, message: `Unknown harbor: ${harbor}` };

    if (length > harborData.slips.maxBoatLength) {
      return { success: false, message: `Boat too long for ${harborData.name}. Max ${harborData.slips.maxBoatLength}ft.` };
    }

    const assignedSlip = slip || this._assignSlip(harbor);
    if (!assignedSlip) {
      return { success: false, message: `No slips available at ${harborData.name}.` };
    }

    this.dockedBoats.set(boatId, { name, harbor, slip: assignedSlip, length, owner });
    return {
      success: true,
      message: `${name} docked at slip ${assignedSlip}, ${harborData.name}.`,
      slip: assignedSlip,
      harbor: harborData.name,
    };
  }

  /**
   * Check where a boat is docked
   */
  checkMoorage(boatId) {
    const boat = this.dockedBoats.get(boatId);
    if (!boat) return { docked: false, message: `${boatId} is not currently docked.` };
    const harborData = HARBORS[boat.harbor];
    return {
      docked: true,
      harbor: harborData.name,
      slip: boat.slip,
      message: `${boat.name} is at slip ${boat.slip}, ${harborData.name}.`,
    };
  }

  /**
   * Pay for moorage (monthly)
   */
  payMoorage(boatId, months = 1) {
    const boat = this.dockedBoats.get(boatId);
    if (!boat) return { success: false, message: 'Boat not found in harbor.' };
    const harborData = HARBORS[boat.harbor];
    const cost = boat.length * harborData.slips.pricePerFoot * months;
    const record = this.moorageRecords.get(boatId) || { harbor: boat.harbor, slip: boat.slip, paidThrough: 0, cost: 0 };
    record.paidThrough += months;
    record.cost += cost;
    this.moorageRecords.set(boatId, record);
    return { success: true, cost, message: `Moorage paid: $${cost.toFixed(2)} for ${months} month(s).` };
  }

  /**
   * Undock / launch a boat
   */
  undock(boatId) {
    const boat = this.dockedBoats.get(boatId);
    if (!boat) return { success: false, message: `${boatId} is not docked.` };
    this.dockedBoats.delete(boatId);
    return { success: true, message: `${boat.name} has left ${boat.slip}. Fair winds.` };
  }

  /**
   * Generate NPC docked boats for atmosphere
   */
  generateHarborTraffic() {
    const npcBoats = [
      { name: 'FV Halibut Hunter', harbor: 'eliason', slip: 'E-14', length: 42, owner: 'captain_pete' },
      { name: 'FV Northern Pride', harbor: 'eliason', slip: 'E-22', length: 58, owner: 'npc_longliner' },
      { name: 'FV Sitka Rose', harbor: 'eliason', slip: 'E-7', length: 36, owner: 'npc_seiner' },
      { name: 'FV Early Dawn', harbor: 'eliason', slip: 'E-31', length: 32, owner: 'npc_troller' },
      { name: 'FV Deep Six', harbor: 'anb', slip: 'A-3', length: 78, owner: 'npc_seiner' },
      { name: 'FV Constellation', harbor: 'anb', slip: 'A-8', length: 64, owner: 'npc_longliner' },
      { name: 'FV Silver Wave', harbor: 'crescent', slip: 'C-45', length: 22, owner: 'npc_recreational' },
      { name: 'FV Second Chance', harbor: 'crescent', slip: 'C-12', length: 18, owner: 'npc_recreational' },
    ];
    for (const boat of npcBoats) {
      this.dockedBoats.set(boat.name, boat);
    }
    return npcBoats.length;
  }

  /**
   * Daily harbor report — who's in, who's out, conditions
   */
  getDailyReport() {
    const weather = this._generateWeather();
    const fishing = this._generateFishingReport();
    const arrivals = this._generateArrivals();
    const departures = this._generateDepartures();

    const report = {
      date: new Date().toLocaleDateString(),
      weather,
      fishing,
      docked: this.dockedBoats.size,
      arrivals,
      departures,
      coffeeRowIntel: this._getTodayIntel(),
      harbormasterNotice: this._getHarbormasterNotice(),
    };
    this.dailyLog.push(report);
    return report;
  }

  /**
   * Coffee row — the old-timers sharing intel on the dock
   */
  getCoffeeRowIntel() {
    return this._getTodayIntel();
  }

  // ── Private helpers ──

  _assignSlip(harbor) {
    const prefix = harbor === 'eliason' ? 'E' : harbor === 'anb' ? 'A' : 'C';
    const existingSlips = new Set();
    for (const boat of this.dockedBoats.values()) {
      if (boat.harbor === harbor) existingSlips.add(boat.slip);
    }
    for (let i = 1; i <= HARBORS[harbor].slips.total; i++) {
      const slip = `${prefix}-${i}`;
      if (!existingSlips.has(slip)) return slip;
    }
    return null;
  }

  _generateCoffeeRowIntel() {
    this.coffeeRowIntel = [
      "Heard the kings are thick off Biorka Island. Chad said he limited out in two hours.",
      "ADF&G is gonna open Section 11 next week. Maybe. Depends on the test fishery.",
      "There's a pod of humpbacks between the island and the cape. Look for the blows.",
      "Somebody hit a 200-pound halibut at the Pinnacles yesterday. I saw the picture at Ernie's.",
      "The trollers are getting coho at the kelp line. Green and white hoochies.",
      "Bear sighting at Indian River. A sow with two cubs. Stay on the trail.",
      "Fuel's going up again. Delta Western raised diesel by fifteen cents.",
      "The seiner fleet caught the herring spawn at Redoubt Bay. Eight hundred ton.",
      "Weather's gonna turn Thursday. South wind, rain, small craft advisory.",
      "New restaurant opening on Lincoln Street next month. Another pizza place.",
    ];
  }

  _getTodayIntel() {
    // Pick 2-4 random intel items for today
    const shuffled = [...this.coffeeRowIntel].sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * 3) + 2;
    return shuffled.slice(0, count);
  }

  _generateWeather() {
    const conditions = ['Overcast', 'Light rain', 'Rain', 'Fog', 'Partly cloudy', 'Sunny', 'Windy', 'Calm'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    return {
      condition,
      wind: condition === 'Windy' ? 'SE 25kt' : 'Variable 5-10kt',
      temp: `${Math.floor(Math.random() * 10) + 42}°F`,
      visibility: condition === 'Fog' ? '1/4 mile' : condition === 'Rain' ? '3 miles' : '10+ miles',
    };
  }

  _generateFishingReport() {
    const species = [
      { name: 'halibut', location: 'The Pinnacles', rating: () => Math.random() > 0.3 ? 'good' : 'fair' },
      { name: 'chinook', location: 'Kelp line, Cape Edgecumbe', rating: () => Math.random() > 0.5 ? 'fair' : 'slow' },
      { name: 'coho', location: 'Biorka Island', rating: () => Math.random() > 0.3 ? 'good' : 'excellent' },
      { name: 'lingcod', location: 'Rocky points', rating: () => Math.random() > 0.4 ? 'fair' : 'good' },
      { name: 'rockfish', location: 'Deep structure', rating: () => 'good' },
    ];
    return species.map(s => ({
      species: s.name,
      location: s.location,
      rating: s.rating(),
    }));
  }

  _generateArrivals() {
    const count = Math.floor(Math.random() * 3);
    if (count === 0) return [];
    const boats = ['FV Evening Star', 'FV Last Resort', 'FV Fish Whisperer', 'FV Tidal Bore'];
    return boats.slice(0, count).map(b => ({ boat: b, time: 'this morning', note: 'from the grounds' }));
  }

  _generateDepartures() {
    const count = Math.floor(Math.random() * 3);
    if (count === 0) return [];
    const boats = ['FV Northern Light', 'FV Wayward Son', 'FV Sitka Dream'];
    return boats.slice(0, count).map(b => ({ boat: b, time: 'before dawn', note: 'heading west' }));
  }

  _getHarbormasterNotice() {
    const notices = [
      "All vessels: moorage fees due by the 1st. Late fees apply.",
      "Reminder: speed limit 5 knots in the harbor. No wake zone.",
      "Annual harbor cleanup is next Saturday. Volunteers needed.",
      "Boat owners: check your bilge pumps before you leave the dock.",
      "Fuel spill reported at slip A-5. Area closed for cleanup.",
      "New regulations posted on the bulletin board. Read them.",
      "Safety inspection sweep by the Coast Guard next week. Be prepared.",
    ];
    return notices[Math.floor(Math.random() * notices.length)];
  }
}

export default { HARBORS, SitkaHarbor };
