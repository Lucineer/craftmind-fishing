/**
 * @module craftmind-fishing/ai/story-generator
 * @description Detects emergent narrative patterns from agent behavior.
 * Rivalries, mentorships, market events, weather dramas — stories that
 * arise naturally from agent interactions without scripting.
 */

export class StoryGenerator {
  /**
   * @param {import('./agent-manager.js').AgentManager} manager
   */
  constructor(manager) {
    this.manager = manager;
    this.activeStories = new Map();    // id -> story
    this.storyCooldowns = new Map();   // type -> timestamp
    this.storyCount = 0;
  }

  /**
   * Detect emergent story patterns from current agent state.
   * @returns {object[]} detected stories
   */
  detectStories() {
    const stories = [];

    // Check rivalry pattern: competitive agents at same location
    const rivalry = this._detectRivalry();
    if (rivalry) stories.push(rivalry);

    // Check mentorship: wise agent near learning agent
    const mentorship = this._detectMentorship();
    if (mentorship) stories.push(mentorship);

    // Check market event: unusually high catches
    const market = this._detectMarketEvent();
    if (market) stories.push(market);

    // Check weather drama: storm while agents are fishing
    const weather = this._detectWeatherDrama();
    if (weather) stories.push(weather);

    // Check bar gathering: multiple agents at Ernie's
    const barGathering = this._detectBarGathering();
    if (barGathering) stories.push(barGathering);

    // Check brag cascade: multiple good catches
    const bragCascade = this._detectBragCascade();
    if (bragCascade) stories.push(bragCascade);

    return stories;
  }

  /**
   * Detect rivalry between competitive agents.
   */
  _detectRivalry() {
    if (this._onCooldown('rivalry')) return null;

    const agents = Array.from(this.manager.agents.values());
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];

        if (a.location !== b.location || a.location === 'unknown') continue;
        if (a.location !== 'eliason_harbor') continue;

        const compA = a.personality.traits.competitiveness || 0;
        const compB = b.personality.traits.competitiveness || 0;

        if (compA < 0.5 && compB < 0.5) continue;

        // Both have caught fish
        if (a.todayCatch.length > 0 && b.todayCatch.length > 0) {
          const winner = a.todayWeight > b.todayWeight ? a : b;
          const loser = a.todayWeight > b.todayWeight ? b : a;

          this._setCooldown('rivalry', 300000); // 5 min cooldown
          return {
            type: 'rivalry',
            id: `rivalry_${this.storyCount++}`,
            title: `${a.name} vs ${b.name}: Fishing Rivalry`,
            description: `${winner.name} is out-fishing ${loser.name} at the harbor!`,
            agents: [a.name, b.name],
            outcome: 'competitive',
            dialogue: `${winner.name}: "${loser.todayWeight} pounds? That's cute. I've got ${Math.round(winner.todayWeight)}."`,
            effect: {
              agentMoodChange: {
                [winner.name]: { satisfaction: 0.1, frustration: -0.1 },
                [loser.name]: { frustration: 0.15, satisfaction: -0.05 },
              },
            },
          };
        }
      }
    }
    return null;
  }

  /**
   * Detect mentorship: wise agent near another agent.
   */
  _detectMentorship() {
    if (this._onCooldown('mentorship')) return null;

    const agents = Array.from(this.manager.agents.values());
    const wise = agents.find(a => (a.personality.traits.wisdom || 0) > 0.7);
    if (!wise) return null;

    const learner = agents.find(a => a.name !== wise.name && a.location === wise.location);
    if (!learner) return null;

    const rel = wise.relationships.get(learner.name);
    if (rel.trust < 0.3) return null;

    this._setCooldown('mentorship', 600000); // 10 min cooldown
    const wisdomTopics = [
      'The salmon know this river. They were born here, they will die here.',
      'Fish the outgoing tide. Always.',
      'Pink hoochies at 40 feet. Don\'t argue with success.',
      'Patience. The fish will come to you.',
      'Watch the birds. They know where the bait is.',
    ];

    return {
      type: 'mentorship',
      id: `mentorship_${this.storyCount++}`,
      title: `${wise.name} shares wisdom`,
      description: `${wise.name} is teaching ${learner.name} about fishing.`,
      agents: [wise.name, learner.name],
      outcome: 'wisdom',
      dialogue: `${wise.name}: "${wisdomTopics[Math.floor(Math.random() * wisdomTopics.length)]}"`,
      effect: {
        relationshipChange: {
          from: wise.name,
          to: learner.name,
          trust: 0.05,
        },
      },
    };
  }

  /**
   * Detect market event from unusual catch totals.
   */
  _detectMarketEvent() {
    if (this._onCooldown('market_event')) return null;

    let totalCatch = 0;
    let totalWeight = 0;
    for (const agent of this.manager.agents.values()) {
      totalCatch += agent.todayCatch.length;
      totalWeight += agent.todayWeight;
    }

    // If agents have caught a lot, prices should drop
    if (totalWeight > 200) { // 200+ pounds total
      this._setCooldown('market_event', 600000);
      const priceMultiplier = Math.max(0.5, 1 - (totalWeight / 500));

      return {
        type: 'market_event',
        id: `market_${this.storyCount++}`,
        title: 'Market Fluctuation',
        description: `Heavy catches today (${Math.round(totalWeight)} lbs total) — prices are dropping.`,
        effect: {
          priceMultiplier: Math.round(priceMultiplier * 100) / 100,
        },
        agents: [],
        dialogue: `Market Report: Fish prices down ${Math.round((1 - priceMultiplier) * 100)}% on heavy supply. Good time to sell before it drops further.`,
      };
    }

    return null;
  }

  /**
   * Detect weather drama — storm while agents are fishing.
   */
  _detectWeatherDrama() {
    if (this._onCooldown('weather_drama')) return null;
    if (this.manager.weather !== 'storm') return null;

    const fishingAgents = Array.from(this.manager.agents.values()).filter(
      a => a.currentBlock?.action === 'go_fishing' || a.currentBlock?.action === 'resume_fishing'
    );

    if (fishingAgents.length === 0) return null;

    this._setCooldown('weather_drama', 300000);

    const reactions = fishingAgents.map(a => {
      const stubborn = a.personality.traits.stubbornness || 0;
      if (stubborn > 0.7) {
        return `${a.name}: "Storm won't stop me. Seen worse."`;
      }
      return `${a.name}: "Time to head in. Mother Nature wins this round."`;
    });

    return {
      type: 'weather_drama',
      id: `weather_${this.storyCount++}`,
      title: 'Storm Hits Sitka Sound',
      description: `Storm hits while ${fishingAgents.length} agent(s) are out fishing.`,
      agents: fishingAgents.map(a => a.name),
      outcome: fishingAgents.some(a => a.personality.traits.stubbornness > 0.7) ? 'mixed' : 'retreat',
      dialogue: reactions.join(' | '),
      effect: {
        broadcast: 'Weather Alert: Storm approaching from the northwest. All boats return to harbor.',
      },
    };
  }

  /**
   * Detect bar gathering — multiple agents at Ernie's.
   */
  _detectBarGathering() {
    if (this._onCooldown('bar_gathering')) return null;

    const barAgents = Array.from(this.manager.agents.values()).filter(
      a => a.location === 'ernies_old_time_saloon' || a.location === 'ernies_bar'
    );

    if (barAgents.length < 3) return null;

    this._setCooldown('bar_gathering', 600000);
    const names = barAgents.map(a => a.name).join(', ');

    return {
      type: 'bar_gathering',
      id: `bar_${this.storyCount++}`,
      title: "Evening at Ernie's",
      description: `${barAgents.length} regulars gathered at Ernie's Old Time Saloon: ${names}`,
      agents: barAgents.map(a => a.name),
      outcome: 'social',
      dialogue: `The bar is lively tonight. ${names} — all swapping stories and buying rounds.`,
    };
  }

  /**
   * Detect brag cascade — multiple agents caught big fish.
   */
  _detectBragCascade() {
    if (this._onCooldown('brag_cascade')) return null;

    const bigCatchAgents = Array.from(this.manager.agents.values()).filter(
      a => a.todayCatch.some(f => (f.weight || 0) > 20)
    );

    if (bigCatchAgents.length < 2) return null;

    this._setCooldown('brag_cascade', 300000);
    const brags = bigCatchAgents.map(a => {
      const best = a.todayCatch.sort((x, y) => (y.weight || 0) - (x.weight || 0))[0];
      return `${a.name}: "${best.weight}-pound ${best.species || 'fish'}! Beat THAT."`;
    });

    return {
      type: 'brag_cascade',
      id: `brag_${this.storyCount++}`,
      title: 'Big Catch Day',
      description: `Multiple anglers landed trophy fish today.`,
      agents: bigCatchAgents.map(a => a.name),
      outcome: 'celebration',
      dialogue: brags.join(' | '),
    };
  }

  _onCooldown(type) {
    const last = this.storyCooldowns.get(type) || 0;
    return Date.now() - last < 120000; // 2 min minimum between same story types
  }

  _setCooldown(type, ms) {
    this.storyCooldowns.set(type, Date.now() + (ms - 120000));
  }
}

export default StoryGenerator;
