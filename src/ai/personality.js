/**
 * @module craftmind-fishing/ai/personality
 * @description Cody's personality: traits, opinions, mood, and dialogue generation.
 * Mood drives behavior and shapes chat responses without LLM.
 */

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

// ── Cody's Personality ───────────────────────────────────────────────────────

export const CODY_TRAITS = {
  stubbornness: 0.7,
  patience: 0.8,
  curiosity: 0.4,
  generosity: 0.6,
  competitiveness: 0.3,
  superstitious: 0.8,
  talkativeness: 0.5,
};

export const CODY_OPINIONS = {
  'pink hoochies': { stance: 'positive', quote: 'Best lure for kings, period.', confidence: 0.95 },
  'trolling speed': { stance: 'fixed', quote: '3.5 knots, no more no less.', confidence: 0.90 },
  'new fishermen': { stance: 'negative', quote: 'They always crowd the good spots.', confidence: 0.7 },
  'ADF&G': { stance: 'neutral', quote: 'Necessary but they close seasons too early.', confidence: 0.6 },
  'longliners': { stance: 'negative', quote: 'Hogs that take all the halibut.', confidence: 0.8 },
  'Ernie': { stance: 'positive', quote: 'Makes the best chowder in Sitka.', confidence: 0.95 },
  'weather apps': { stance: 'mixed', quote: 'Radar never lies, forecasts always lie.', confidence: 0.85 },
  'bio island': { stance: 'positive', quote: 'My spot. Don\'t crowd it.', confidence: 0.9 },
  'bucky': { stance: 'positive', quote: 'Good bucktail, worth the money.', confidence: 0.8 },
  'kelp line': { stance: 'positive', quote: 'Fish the edge. Always the edge.', confidence: 0.85 },
};

// ── Mood ─────────────────────────────────────────────────────────────────────

export class Mood {
  constructor() {
    this.energy = 0.8;
    this.satisfaction = 0.6;
    this.frustration = 0.1;
    this.social = 0.5;
  }

  /**
   * Update mood based on an event.
   * @param {{ type: string, value?: number, context?: object }} event
   */
  update(event) {
    switch (event.type) {
      case 'caught_fish':
        this.satisfaction = clamp(0, 1, this.satisfaction + (event.value || 0.1));
        this.energy = clamp(0, 1, this.energy - 0.05);
        this.frustration *= 0.5;
        break;
      case 'lost_fish':
        this.frustration = clamp(0, 1, this.frustration + 0.2);
        this.satisfaction = clamp(0, 1, this.satisfaction - 0.1);
        break;
      case 'lost_gear':
        this.frustration = clamp(0, 1, this.frustration + 0.4);
        this.energy = clamp(0, 1, this.energy - 0.1);
        break;
      case 'player_helped':
        this.social = clamp(0, 1, this.social + 0.1);
        this.energy = clamp(0, 1, this.energy + 0.05);
        break;
      case 'weather_storm':
        this.frustration = clamp(0, 1, this.frustration + 0.3);
        if (CODY_TRAITS.superstitious > 0.5) {
          this.satisfaction = clamp(0, 1, this.satisfaction - 0.1);
        }
        break;
      case 'good_sale':
        this.satisfaction = clamp(0, 1, this.satisfaction + 0.15);
        this.social = clamp(0, 1, this.social + 0.05);
        break;
      case 'time_passes':
        this.energy = clamp(0, 1, this.energy * 0.98);
        if (this.energy < 0.3) this.frustration = clamp(0, 1, this.frustration + 0.01);
        break;
      case 'good_weather':
        this.satisfaction = clamp(0, 1, this.satisfaction + 0.05);
        break;
      case 'warden_check':
        this.frustration = clamp(0, 1, this.frustration + 0.1);
        break;
    }
  }

  /** Reset for a new day */
  resetDay() {
    this.energy = 0.8;
    this.satisfaction = 0.6;
    this.frustration = 0.1;
    this.social = 0.5;
  }

  snapshot() {
    return { energy: this.energy, satisfaction: this.satisfaction, frustration: this.frustration, social: this.social };
  }
}

// ── Dialogue Generator ───────────────────────────────────────────────────────

const GREETINGS = {
  frustrated: [
    "Don't talk to me right now. Fish aren't biting.",
    "You picked a bad day to bother me.",
    "*mutters about the current*",
  ],
  satisfied: [
    "Beautiful day on the water! Should've seen what I caught.",
    "The kings are running today. Get out there!",
    "Life is good. Caught my limit before noon.",
  ],
  default: [
    "Morning. You going out?",
    "Weather's decent. Might try the kelp line today.",
    "Need anything from LFS? I'm heading there.",
    "Early bird gets the worm. Or in my case, the king.",
  ],
};

const FISHING_COMMENTS = {
  caught_big: [
    "Now THAT'S a fish! Look at the shoulders on that one.",
    "Been waiting all day for a bite like that.",
    "Pink hoochie. Forty feet. Outgoing tide. Never fails.",
  ],
  caught_small: [
    "Shaker. Back you go, little guy.",
    "Too small. Let him grow up a bit.",
    "Not worth the bait, but the sport's the thing.",
  ],
  lost_fish: [
    "DAMNIT! That was a big one too!",
    "Gotta set the hook harder next time.",
    "*stares at the water*",
  ],
  no_bites: [
    "They're just not biting today.",
    "Maybe I should try a different spot...",
    "Patience. They'll come around.",
  ],
};

const WEATHER_COMMENTS = {
  storm: [
    "Shouldn't have gone out. Called it.",
    "Mother Nature always wins.",
    "Time to tie up and wait it out.",
  ],
  rain: [
    "Rain don't bother fish. Or fishermen.",
    "At least it's not a blow.",
  ],
  clear: [
    "Perfect fishing weather. Not a cloud in the sky.",
    "Days like this are why I live here.",
    "Flat calm. Kings should be on the surface.",
  ],
};

const TIPS_FOR_NEWBIES = [
  "Fish the outgoing tide. Always.",
  "Pink hoochies at 40 feet. Don't argue.",
  "Keep your drag loose until they run, then button it down.",
  "If the birds are working, the fish are under them.",
  "Don't crowd other boats. That's how you lose friends.",
  "Watch the kelp line — fish the edge.",
  "Herring bait. Frozen is fine, fresh is better.",
];

// ── Personality System ───────────────────────────────────────────────────────

export class Personality {
  constructor() {
    this.traits = { ...CODY_TRAITS };
    this.opinions = JSON.parse(JSON.stringify(CODY_OPINIONS));
    this.mood = new Mood();
  }

  /**
   * Get a greeting for a player based on mood.
   * @param {string} playerName
   * @param {object} [playerRel] - { familiarity, trust, tag }
   * @returns {string}
   */
  getGreeting(playerName, playerRel) {
    const m = this.mood;
    let pool;

    if (m.frustration > 0.6) {
      pool = GREETINGS.frustrated;
    } else if (m.satisfaction > 0.7) {
      pool = GREETINGS.satisfied;
    } else {
      pool = GREETINGS.default;
    }

    let greeting = pickRandom(pool).replace('${player}', playerName);

    // Adjust based on relationship
    if (playerRel) {
      if (playerRel.trust > 0.7) {
        greeting = greeting.replace('Morning', 'Hey ' + playerName);
      } else if (playerRel.familiarity < 0.2) {
        greeting = pickRandom([
          "...Can I help you?",
          "You new around here?",
          "Don't touch my gear.",
        ]);
      }
    }

    return greeting;
  }

  /**
   * Get a context-appropriate chat response.
   * @param {string} topic - 'fishing', 'weather', 'gear', 'help', 'general'
   * @param {object} [context] - additional context
   * @returns {string}
   */
  getResponse(topic, context = {}) {
    switch (topic) {
      case 'caught_fish':
        if (context.weight > 20) return pickRandom(FISHING_COMMENTS.caught_big);
        return pickRandom(FISHING_COMMENTS.caught_small);
      case 'lost_fish':
        return pickRandom(FISHING_COMMENTS.lost_fish);
      case 'no_bites':
        return pickRandom(FISHING_COMMENTS.no_bites);
      case 'weather':
        return pickRandom(WEATHER_COMMENTS[context.weatherType] || WEATHER_COMMENTS.clear);
      case 'tip':
        return pickRandom(TIPS_FOR_NEWBIES);
      case 'opinion':
        return this._opinionResponse(context.subject);
      default:
        return pickRandom(GREETINGS.default);
    }
  }

  /**
   * Should Cody initiate conversation? Based on talkativeness + mood.
   * @returns {boolean}
   */
  wantsToTalk() {
    const base = this.traits.talkativeness * 0.3;
    const socialBoost = this.mood.social * 0.3;
    const moodMod = this.mood.frustration > 0.5 ? -0.2 : 0;
    return Math.random() < base + socialBoost + moodMod;
  }

  /**
   * How patient is Cody right now? 0-1, affects how long he'll wait for bites.
   * @returns {number}
   */
  patienceLevel() {
    const base = this.traits.patience;
    const energyMod = this.mood.energy * 0.2;
    const frustrationMod = -this.mood.frustration * 0.3;
    return clamp(0, 1, base + energyMod + frustrationMod);
  }

  /**
   * Should Cody go out fishing despite conditions?
   * @param {object} conditions - { weatherType, seaState, energy }
   * @returns {{ go: boolean, reason: string }}
   */
  shouldGoFishing(conditions) {
    const { weatherType = 'clear', seaState = 0 } = conditions;

    // Stubborn — goes out in bad weather
    if (weatherType === 'storm' || seaState > 4) {
      return this.traits.stubbornness > 0.8
        ? { go: true, reason: "Storm won't stop me. Seen worse." }
        : { go: false, reason: "Even I'm not going out in that." };
    }

    if (weatherType === 'heavy_rain') {
      return this.traits.stubbornness > 0.5
        ? { go: true, reason: "Rain's just water. Fish don't care." }
        : { go: false, reason: "Not worth getting soaked." };
    }

    // Superstitious — bad signs
    if (this.traits.superstitious > 0.7 && conditions.badOmen) {
      return { go: false, reason: "Something don't feel right today. Staying in." };
    }

    // Low energy
    if (this.mood.energy < 0.3) {
      return { go: false, reason: "Too tired. Need my rest." };
    }

    return { go: true, reason: "Good day to fish." };
  }

  _opinionResponse(subject) {
    const opinion = this.opinions[subject];
    if (!opinion) return pickRandom(["Don't have an opinion on that.", "Never thought about it."]);
    return opinion.quote;
  }

  /** Serialize for persistence */
  toJSON() {
    return {
      traits: this.traits,
      mood: this.mood.snapshot(),
    };
  }

  /** Restore from persisted data */
  fromJSON(data) {
    if (data.traits) Object.assign(this.traits, data.traits);
    if (data.mood) {
      this.mood.energy = data.mood.energy ?? this.mood.energy;
      this.mood.satisfaction = data.mood.satisfaction ?? this.mood.satisfaction;
      this.mood.frustration = data.mood.frustration ?? this.mood.frustration;
      this.mood.social = data.mood.social ?? this.mood.social;
    }
  }
}

export default Personality;
