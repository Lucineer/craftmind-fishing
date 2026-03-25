// CraftMind Fishing — Town Events & Festivals
// Annual Sitka events, random town happenings, and seasonal gameplay changes.

export const ANNUAL_EVENTS = {
  // ── Spring Events ──
  herring_spawn: {
    id: 'herring_spawn',
    name: 'Herring Spawn',
    month: 3, // March
    dayRange: [15, 31], // late March
    duration: 7, // days
    type: 'natural',
    description: 'The most important natural event in Sitka Sound. Pacific herring spawn in massive numbers, turning the water milky white with milt and eggs. Everything eats herring — whales, eagles, sea lions, halibut, salmon. The whole ecosystem goes crazy.',
    effects: [
      'Herring schools appear in shallow water — seine fishery opens',
      'Whale sightings increase dramatically',
      'All predator fish feed aggressively near spawning grounds',
      'Sea birds mass in the bays',
      'Seine boat fleet descends on Sitka Sound',
      'Eagle activity peaks — hundreds of eagles at spawning beaches',
    ],
    gameplayChanges: {
      herringSpawnRate: 10,
      whaleEncounterChance: 0.3,
      eagleActivity: 'very_high',
      fishAggression: 2.0, // multiplier
      seineFisheryOpen: true,
    },
    radioMessage: '"All stations, ADF&G: herring spawn detected in Sitka Sound, all seiners report to Section 11 for opening announcement."',
    atmosphere: 'The water turns milky. Eagles scream from every tree. Whale blows everywhere you look. The seine fleet anchors offshore. This is the event that feeds everything.',
  },

  sitka_salmon_derby: {
    id: 'sitka_salmon_derby',
    name: 'Sitka Salmon Derby',
    month: 5, // May
    dayRange: [1, 31],
    duration: 14,
    type: 'tournament',
    description: 'The big spring fishing tournament. Cash prizes for the largest king salmon. Hundreds of anglers compete. The whole town is focused on who\'s going to win.',
    effects: [
      'Tournament fishing — biggest king salmon wins cash prize',
      'Charter boats are fully booked',
      'Town is busy with fishermen from around Alaska',
      'Daily weigh-ins at the harbor',
      'Radio chatter about tournament catches',
    ],
    gameplayChanges: {
      tournament: {
        type: 'biggest_fish',
        species: 'chinook',
        prize: 5000,
        entryFee: 50,
      },
      charterDemand: 'high',
      townActivity: 'busy',
    },
    radioMessage: '"Attention all stations, this is Sitka Salmon Derby headquarters, the derby is ON! Daily weigh-ins at Crescent Harbor, lines in the water!"',
    atmosphere: 'The harbor is packed. Every charter boat is out. People comparing fish stories. The weigh-in board changes daily. Everyone wants to catch The Big One.',
  },

  // ── Summer Events ──
  july_4th: {
    id: 'july_4th',
    name: '4th of July Celebration',
    month: 7,
    dayRange: [4, 4],
    duration: 1,
    type: 'festival',
    description: "Sitka does the 4th right. Parade on Lincoln Street, boat races in the harbor, fireworks over the sound, community barbecue. The whole town parties.",
    effects: [
      'Parade on Lincoln Street — road blocked',
      'Boat races in the harbor',
      'Fireworks display at night',
      'Community barbecue at the harbor',
      'All shops closed (except bars)',
      'Tourist town is PACKED',
    ],
    gameplayChanges: {
      lincolnStreetBlocked: true,
      harborActivity: 'festival',
      townActivity: 'party',
      shopOpen: false,
      barOpen: true,
    },
    radioMessage: '"Good morning Sitka! Happy Fourth of July! Parade starts at 10am on Lincoln Street, boat races at 2pm in the harbor, fireworks at 11pm. Have a safe and happy Independence Day!"',
    atmosphere: 'Red white and blue everywhere. Firecrackers. The smell of burgers and hot dogs from the harbor barbecue. Kids running around. Boats decorated with flags racing in the harbor.',
  },

  halibut_tournament: {
    id: 'halibut_tournament',
    name: 'Sitka Halibut Tournament',
    month: 6,
    dayRange: [15, 30],
    duration: 7,
    type: 'tournament',
    description: 'Summer halibut tournament. Biggest halibut wins. Charter boats compete. The deep water gets crowded.',
    effects: [
      'Biggest halibut wins prize',
      'Charter boats targeting halibut exclusively',
      'Deep water spots are crowded with boats',
      'Daily weigh-ins at Eliason Harbor',
    ],
    gameplayChanges: {
      tournament: {
        type: 'biggest_fish',
        species: 'halibut',
        prize: 3000,
        entryFee: 75,
      },
      charterDemand: 'high',
      crowdedSpots: ['pinnacles', 'cape_edgecumbe', '200_foot_ledge'],
    },
    radioMessage: '"Attention all halibut fishermen, Sitka Halibut Tournament begins today! Weigh-ins at Eliason Harbor slip A-1, biggest fish takes the pot!"',
    atmosphere: 'The deep water spots are packed with boats. Everyone\'s dropping bait to the bottom and waiting. The weigh-in board shows who\'s ahead.',
  },

  silver_salmon_derby: {
    id: 'silver_salmon_derby',
    name: 'Silver Salmon Derby',
    month: 8,
    dayRange: [1, 31],
    duration: 14,
    type: 'tournament',
    description: 'Late summer coho tournament. The silvers are running and the town is fishing hard. Tagged fish mean bonus prizes.',
    effects: [
      'Coho are thick in the sound',
      'Tagged fish worth bonus prizes',
      'Good fishing from shore AND boat',
      'Town is in full fishing mode',
    ],
    gameplayChanges: {
      tournament: {
        type: 'biggest_fish',
        species: 'coho',
        prize: 4000,
        entryFee: 40,
        taggedFishBonus: 500,
      },
      cohoSpawnRate: 5,
      shoreFishingBonus: true,
    },
    radioMessage: '"Attention Sitka, the Silver Salmon Derby is LIVE! Coho are thick in the sound, tagged fish are worth bonus prizes, get your lines wet!"',
    atmosphere: 'Silver salmon jumping everywhere. Boats trolling the kelp line. People fishing from the docks. The weigh-in board at the harbor gets updated every hour.',
  },

  // ── Fall Events ──
  alaska_day: {
    id: 'alaska_day',
    name: 'Alaska Day',
    month: 10,
    dayRange: [18, 18],
    duration: 1,
    type: 'festival',
    description: 'October 18th — commemorates the transfer of Alaska from Russia to the United States in 1867. This is HUGE in Sitka because the transfer happened HERE. The biggest event of the year.',
    effects: [
      'Period costume parade on Lincoln Street',
      'Reenactment of the flag-raising at Castle Hill',
      'Russian Orthodox ceremony at St. Michael\'s Cathedral',
      'Festival food, music, dancing',
      'Town absolutely packed with visitors',
      'Schools closed — everyone celebrates',
    ],
    gameplayChanges: {
      lincolnStreetBlocked: true,
      townActivity: 'maximum',
      stMichaelsActive: true,
      specialNPCDialogue: true,
      atmosphere: 'historical',
    },
    radioMessage: '"Good morning Sitka! Happy Alaska Day! Transfer ceremony reenactment at Castle Hill at noon, parade on Lincoln Street at 2pm, fireworks at dark. Alaska Day in Sitka — where it all happened!"',
    atmosphere: "This is Sitka's biggest day. Russian dancers, period costumes, the flag ceremony. Tlingit and Russian history side by side. The whole town smells like fry bread and salmon.",
  },

  sitka_whale_fest: {
    id: 'sitka_whale_fest',
    name: 'Sitka Whale Fest',
    month: 11,
    dayRange: [1, 7],
    duration: 7,
    type: 'festival',
    description: 'A week of whale watching, marine science lectures, and community celebration. Scientists come from around the world. Whale watching boats run constantly.',
    effects: [
      'Whale watching trips daily',
      'Marine biology lectures at the community center',
      'Whale sighting rates at peak',
      'Scientist NPCs visit town',
      'Town busy with eco-tourists',
    ],
    gameplayChanges: {
      whaleEncounterChance: 0.5,
      whaleWatchingTours: true,
      scientistNPCs: true,
      townActivity: 'busy',
    },
    radioMessage: '"Attention all stations, Sitka Whale Fest begins today! Daily whale watching tours departing from Crescent Harbor dock, evening lectures at Harrigan Centennial Hall."',
    atmosphere: 'Whales everywhere. Scientists with binoculars. Lectures about whale migration. The town embraces its connection to the ocean.',
  },

  // ── Winter Events ──
  rondy: {
    id: 'rondy',
    name: 'Sitka Rondy',
    month: 2,
    dayRange: [15, 28],
    duration: 7,
    type: 'festival',
    description: 'Winter festival. When it\'s dark and rainy, Sitkans make their own fun.Snowshoe races (if there\'s snow), beard contests, survival competitions.',
    effects: [
      'Winter festival events',
      'Fewer tourists — locals only',
      'Indoor activities (bars are busy)',
      'Winter fishing for rockfish and cod',
    ],
    gameplayChanges: {
      townActivity: 'quiet_festive',
      barActivity: 'high',
      winterFishing: true,
    },
    radioMessage: '"Good morning Sitka! Rondy week is here! Events at the community center, survival competition Saturday, beard contest at Ernie\'s Sunday night. Bundle up!"',
    atmosphere: 'Dark and rainy but the town makes its own light. The bars are warm. Laughter and bad decisions. Winter in Southeast Alaska.',
  },
};

// Random town events — can happen any day
export const RANDOM_EVENTS = [
  {
    id: 'supply_ship',
    name: 'Supply Ship Arrived!',
    weight: 5,
    description: 'The monthly barge from Seattle docked. Rare items available at stores for a limited time.',
    effects: ['Rare gear items at LFS Marine for 2 days', 'Special grocery items at Sea Mart', 'Hardware restock at Ace'],
    duration: 2,
    gameplayChanges: { rareItemsAvailable: true, storeInventoryBonus: true },
  },
  {
    id: 'fleets_in',
    name: "The Fleet's In!",
    weight: 3,
    description: 'All the Bering Sea boats are back in port. The town is BUSY. Every bar is full. Stories are told.',
    effects: ['All bars are full', 'Captain Sig is at the Pioneer Bar', 'Extra NPCs at harbor', 'Lots of gossip'],
    duration: 3,
    gameplayChanges: { townActivity: 'maximum', barActivity: 'maximum', captainSigInTown: true },
  },
  {
    id: 'cruise_ship',
    name: 'Cruise Ship Day',
    weight: 8,
    description: 'A cruise ship docked. Tourists flood downtown. Locals avoid Lincoln Street.',
    effects: ['Tourists everywhere downtown', 'Gift shops do well', 'Restaurants crowded', 'Locals annoyed'],
    duration: 1,
    gameplayChanges: { touristCount: 'high', downtownCrowded: true, localMood: 'annoyed' },
    dialogue: {
      ernie: "Tourists. Don't get me started.",
      linda: "Business is good today, at least.",
      old_thomas: "Many visitors. The land can hold them all.",
    },
  },
  {
    id: 'power_outage',
    name: 'Power Outage!',
    weight: 2,
    description: 'A windstorm knocked out the power. Sitka goes dark. Generator time.',
    effects: ['No lights in town', 'Stores close', 'Bar runs on candles and coolers', 'Radio works (battery powered)'],
    duration: 1,
    gameplayChanges: { shopsClosed: true, barsOpen: true, atmosphere: 'dark_cozy' },
    dialogue: {
      ernie: "Power's out. So? We've got candles and cold beer. What more do you need?",
      linda: "Store's closed. Can't run the register without power. Come back tomorrow.",
      mary: "Backup generator at the harbormaster office. We're fine. Boats first.",
    },
  },
  {
    id: 'mudslide',
    name: 'Mudslide on Halibut Point Road',
    weight: 2,
    description: 'Heavy rain caused a mudslide. Halibut Point Road is closed. Can\'t reach Ace, Sea Mart, or the charters.',
    effects: ['Halibut Point Road blocked', 'No access to industrial area', 'Must use downtown stores', 'Charter boats can\'t leave from road-side ramps'],
    duration: 1,
    gameplayChanges: { halibutPointRoadClosed: true, industrialAccess: false },
    dialogue: {
      mary: "Halibut Point Road is closed due to mudslide. Use alternate routes if possible. Crews are on it.",
      ernie: "Mudslide. Happens every spring. They'll have it cleared by tomorrow.",
    },
  },
  {
    id: 'bear_in_town',
    name: 'Bear in Town!',
    weight: 3,
    description: 'A black bear wandered into downtown Sitka. Happens a few times a year. Fish & Game will relocate it.',
    effects: ['Black bear wandering Lincoln Street area', 'People watching from safe distance', 'Bear closes some businesses temporarily'],
    duration: 1,
    gameplayChanges: { bearSighting: true, downtownAlert: true },
    dialogue: {
      ernie: "There's a bear outside. Just a little one. Don't feed it.",
      dave: "The kids are SO excited. Best biology lesson ever.",
      old_thomas: "The bear was here before the town. We are guests in their home.",
      sarah: "ADF&G is on it. We'll dart it and relocate it to the north end of the island.",
    },
  },
  {
    id: 'new_restaurant',
    name: 'New Restaurant Opening!',
    weight: 1,
    description: 'A new eatery opened on Lincoln Street. The town is buzzing about it.',
    effects: ['New restaurant on Lincoln Street', 'Grand opening specials', 'Everyone wants to try it'],
    duration: 5,
    gameplayChanges: { newBuilding: true, townActivity: 'busy' },
  },
  {
    id: 'good_fishing_day',
    name: 'The Bite Is On!',
    weight: 6,
    description: 'Fishing is incredible today. Everyone is catching fish. The radio is buzzing.',
    effects: ['All fish species are biting aggressively', 'Every boat is catching limits', 'Stories at Ernie\'s tonight'],
    duration: 1,
    gameplayChanges: { fishBiteMultiplier: 3.0, allSpeciesActive: true },
    radioMessage: '"Good morning Sitka! The bite is ON! I\'m marking fish everywhere — halibut on the bottom, coho at the kelp line, kings at the green can. Get out there!"',
  },
  {
    id: 'storm_warning',
    name: 'Storm Warning',
    weight: 4,
    description: 'A big storm is rolling in. Smart fishermen stay home. Adventurous ones... well.',
    effects: ['High winds, big seas, heavy rain', 'Harbor is crowded with boats seeking shelter', 'Bars are full of fishermen who decided to stay in', 'Dangerous conditions offshore'],
    duration: 1,
    gameplayChanges: { weather: 'storm', offshoreDanger: 'extreme', barActivity: 'high', harborFull: true },
    dialogue: {
      ernie: "Smart fishermen stay home on days like this. Pull up a stool.",
      captain_sig: "This? This is Tuesday on the Bering Sea. You want to see weather? I'll tell you about weather.",
      mary: "All vessels secure in harbor. Do NOT attempt to leave. Gale warning through tonight.",
    },
  },
  {
    id: 'banana_belt_day',
    name: 'Banana Belt Day',
    weight: 3,
    description: 'Rare sunny day in Sitka! The "banana belt" of Southeast Alaska. Everyone is outside.',
    effects: ['Sunny and calm — rare for Sitka!', 'Everyone is happy', 'Tourists taking photos', 'Perfect fishing weather'],
    duration: 1,
    gameplayChanges: { weather: 'sunny', townMood: 'excellent', touristActivity: 'high' },
    dialogue: {
      ernie: "Sunshine in Sitka. Don't get used to it. Enjoy it while it lasts.",
      old_thomas: "The sun shines on everyone equally. Even in Southeast Alaska.",
    },
  },
];

/**
 * TownEventManager — handles annual events, random events, and seasonal changes
 */
export class TownEventManager {
  constructor() {
    this.activeEvents = [];
    this.eventHistory = [];
    this.currentDate = null;
  }

  /**
   * Set the current in-game date and check for events
   */
  setDate(month, day) {
    this.currentDate = { month, day };
    this.activeEvents = [];

    // Check annual events
    for (const [id, event] of Object.entries(ANNUAL_EVENTS)) {
      if (month === event.month && day >= event.dayRange[0] && day <= event.dayRange[1]) {
        this.activeEvents.push({ ...event, active: true });
      }
    }

    return this.activeEvents;
  }

  /**
   * Roll for random daily events (call once per in-game day)
   */
  rollDailyEvents() {
    const events = [];
    const totalWeight = RANDOM_EVENTS.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const event of RANDOM_EVENTS) {
      roll -= event.weight;
      if (roll <= 0) {
        events.push({ ...event, triggered: true, dayTriggered: this.currentDate });
        this.eventHistory.push(event.id);
        this.activeEvents.push({ ...event, active: true });
        break; // Only one random event per day (usually)
      }
    }

    return events;
  }

  /**
   * Get active events and their gameplay changes
   */
  getActiveEvents() {
    return this.activeEvents;
  }

  /**
   * Get all gameplay changes from active events
   */
  getGameplayChanges() {
    const changes = {};
    for (const event of this.activeEvents) {
      if (event.gameplayChanges) {
        Object.assign(changes, event.gameplayChanges);
      }
    }
    return changes;
  }

  /**
   * Get active events' radio messages
   */
  getRadioMessages() {
    return this.activeEvents
      .filter(e => e.radioMessage)
      .map(e => e.radioMessage);
  }

  /**
   * Get NPC dialogue modifications for active events
   */
  getEventDialogue(npcId) {
    const dialogues = [];
    for (const event of this.activeEvents) {
      if (event.dialogue && event.dialogue[npcId]) {
        dialogues.push(event.dialogue[npcId]);
      }
    }
    return dialogues;
  }
}

export default { ANNUAL_EVENTS, RANDOM_EVENTS, TownEventManager };
