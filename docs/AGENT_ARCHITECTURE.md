# CraftMind Agent Architecture — Making Cody Alive

**Research synthesis from:**
- MineWright (our Java Minecraft AI — Voyager, DreamerV3, humanization research)
- WoW bot scripting (behavior trees, rotation scripts, kiting automation)
- MUD bot culture (TinyMUD, LPC, scripting evolution)
- TTRPG great DMs (NPC agency, improv, character arcs)
- Multi-agent coordination (Contract Net, blackboard systems)

---

## The Problem

Cody responds to `!fish` but doesn't *want* to fish. He waits for commands like a CLI tool. A real player — especially a Sitka fisherman — would have his own opinions, goals, schedule, and personality. He'd sometimes ignore you. He'd have bad days. He'd get excited about a big catch.

## The Solution: Three Layers

### Layer 1: **Autonomous Behavior Engine** (no LLM needed)
Deterministic scripts that make Cody act like a real player 95% of the time. Fast, cheap, reliable.

### Layer 2: **Personality & Memory** (lightweight)
Cody has a personality profile, mood, relationships, and memory of past interactions. Shapes all behavior.

### Layer 3: **LLM Spark** (on-demand)
The LLM handles only what scripts can't: creative dialogue, novel situations, learning new behaviors.

---

## Layer 1: Autonomous Behavior Engine

### 1.1 Behavior Tree (not just state machine)

Current CraftMind uses a flat state machine. Replace with a **behavior tree** for complex decision-making:

```
ROOT (Priority Selector)
├── [URGENCY] Handle Danger (Sequence)
│   ├── Health low? → FLEE
│   ├── Hostile mob? → COMBAT / FLEE based on personality
│   └── Storm approaching? → SEEK SHELTER
├── [NEEDS] Attend to Basic Needs (Sequence)
│   ├── Hunger (food level) → EAT
│   ├── Health low → USE HEALING
│   └── Night + exposed → SEEK SHELTER
├── [GOALS] Work on Personal Goals (Priority)
│   ├── Active Quest? → PURSUE QUEST
│   ├── Fishing schedule? → GO FISH (with preferred method/bait)
│   ├── Shopping list? → VISIT SHOP
│   └── Wanted fish species? → TARGET FISH
├── [SOCIAL] Interact with World (Random Weight)
│   ├── Player nearby? → CHAT (30% chance per tick)
│   ├── Other bot nearby? → SOCIALIZE
│   ├── Idle too long? → EXPLORE
│   └── Weather event? → COMMENT ON WEATHER
├── [ROUTINE] Follow Daily Schedule (Sequence)
│   ├── Morning (6am-8am) → Check weather/radio, plan day
│   ├── Day (8am-6pm) → Primary activity (fish, work)
│   ├── Evening (6pm-9pm) → Return to town, visit Ernie's
│   └── Night (9pm-6am) → Sleep/rest at home
└── [DEFAULT] Idle Behavior
    ├── Look around (random head movement)
    ├── Walk small random paths
    └── Occasionally examine inventory
```

### 1.2 Scriptable Skills (Voyager Pattern)

Instead of the LLM deciding every action, Cody has a **skill library** of deterministic scripts:

```js
// skills/fish-trolling.js — Cody wrote this himself after 50 successful troll sessions
export default {
  name: 'troll-salmon-halibut',
  description: 'Troll for salmon and halibut in deep water',
  requirements: { rod: 'trolling', boat: true, bait: 'herring', weather: ['clear','cloudy'] },
  successRate: 0.72,  // tracks over time
  uses: 47,

  async execute(bot, context) {
    // 1. Navigate to boat dock
    await bot.navigateTo('thimble-berry-cove');
    // 2. Board boat
    await bot.useBoat('troller');
    // 3. Set gear
    await bot.setGear({ rod: 'trolling', line: 'braid', leader: 'wire', lure: 'hoochie-pink' });
    // 4. Troll pattern (waypoints with humanized timing)
    await bot.trollWaypoints([
      { x: 100, z: 200, speed: 3.5 },  // Bumble Bee rock
      { x: 150, z: 300, speed: 4.0 },  // offshore
      { x: 120, z: 250, speed: 3.0 },  // back inshore
    ]);
    // 5. Handle events
    bot.on('fishOn', async () => {
      await humanizedDelay(200 + Math.random() * 300);  // reaction time
      await bot.reelIn();
    });
  }
};
```

**Key insight from WoW:** Rotation bots didn't use AI. They used **priority queues** — if condition A, do action X, else if B, do Y. Fishing scripts work the same way:
- Check depth → select appropriate gear
- Check weather → decide if worth going out
- Check tide → pick fishing spot
- Check bait → go buy more if low

### 1.3 Humanization (from MineWright research)

Every action goes through the **humanization layer**:

```js
class Humanizer {
  // Timing: Gaussian jitter on all delays
  delay(baseMs) {
    return Math.max(30, baseMs + gaussianRandom(0, baseMs * 0.12));
  }

  // Movement: Bezier curves, not straight lines
  async moveTo(bot, target) {
    const waypoints = bezierPath(bot.position, target);
    for (const wp of waypoints) {
      await bot.setControlState('forward', true);
      await delay(this.delay(100));  // look-micro-adjustment every 100ms
      await bot.lookAt(wp.yaw + gaussianRandom(0, 2), wp.pitch);
    }
  }

  // Mistakes: Occasionally fail actions
  shouldFail(skill) {
    const failChance = 0.03; // 3% base fail rate
    const fatigue = this.bot.stats.hoursOnline * 0.001; // gets worse when tired
    return Math.random() < failChance + fatigue;
  }

  // Reaction time: Model human perception
  reactionTime() {
    // Fast actions (combat): 150-300ms
    // Slow actions (building): 500-1500ms  
    return this.delay(this.isUrgent ? 200 : 800);
  }

  // Idle behaviors: Random micro-actions
  async idle(bot) {
    const actions = [
      () => bot.lookAround(randomAngle()),
      () => bot.walkSmallCircle(2 + Math.random() * 5),
      () => bot.examineInventory(randomSlot()),
      () => bot.sitDown(),  // crouch and look at water
      () => bot.swingArm(), // practice casting motion
    ];
    await randomChoice(actions)();
  }
}
```

### 1.4 Daily Schedule (WoW "grind" pattern)

WoW bots followed daily schedules: farm X gold, do Y quests, grind Z mobs. Cody follows a fisherman's schedule:

```js
const CODY_SCHEDULE = {
  '05:30': { action: 'wake_up', location: 'home' },
  '06:00': { action: 'check_radio', target: 'weather_report' },
  '06:15': { action: 'decide_plan', dependsOn: ['weather', 'tide', 'market_prices'] },
  '06:30': { action: 'prepare_gear', location: 'lfs_marine' },  // buy bait if needed
  '07:00': { action: 'go_fishing', method: 'preferred_method' },
  '11:30': { action: 'lunch_break', location: 'boat' },
  '12:00': { action: 'resume_fishing' },
  '16:00': { action: 'head_to_dock', location: 'thimble_berry_cove' },
  '16:30': { action: 'sell_catch', location: 'processor' },
  '17:00': { action: 'visit_ernies', location: 'ernies_bar' },
  '17:30': { action: 'social_time', chat_with: ['ernie', 'other_fishermen'] },
  '19:00': { action: 'dinner', location: 'home' },
  '20:00': { action: 'maintain_gear', repair: true },
  '21:00': { action: 'sleep', location: 'home' },
};
```

### 1.5 Self-Improving Scripts (Voyager's key insight)

The genius of Voyager: skills are **JavaScript code** that the agent writes and iterates on itself. Cody does the same:

```js
class SkillLearner {
  // After every fishing session, analyze what worked
  async analyzeSession(session) {
    if (session.successRate > 0.6) {
      // This skill works — save it
      await this.improveSkill(session.skill, {
        successRate: session.successRate,
        avgCatch: session.avgCatch,
        bestConditions: session.conditions,
      });
    } else if (session.successRate < 0.2) {
      // This approach sucks — try something different
      await this.reviseSkill(session.skill, session.failureReasons);
    }
  }

  // LLM writes/rewrites the skill code based on experience
  async reviseSkill(skillName, feedback) {
    const currentCode = await this.loadSkill(skillName);
    const prompt = `My fishing skill "${skillName}" isn't working well.
      Success rate: ${feedback.successRate}
      Issues: ${feedback.failures.join(', ')}
      Current code: ${currentCode}
      Rewrite it to fix these issues. Keep the same API.`;
    
    const newCode = await this.llm.generate(prompt);
    await this.testSkill(newCode);  // validate before saving
    await this.saveSkill(skillName, newCode);
  }
}
```

---

## Layer 2: Personality & Memory

### 2.1 Personality Model (TTRPG character sheet)

```js
const CODY_PERSONA = {
  name: 'Cody',
  archetype: 'The Old Salt',  // experienced, sometimes grumpy, deeply knowledgeable
  
  traits: {
    stubbornness: 0.7,     // won't change fishing spots easily
    patience: 0.8,         // will wait hours for a bite
    curiosity: 0.4,        // not adventurous, sticks to what works
    generosity: 0.6,       // shares tips sometimes
    competitiveness: 0.3,  // not a show-off
    superstitious: 0.8,    // believes in lucky spots, weather signs
    talkativeness: 0.5,    // quiet when fishing, chatty at the bar
  },

  // Opinions (strongly held beliefs that shape behavior)
  opinions: {
    'pink hoochies': 'best lure for kings, period',
    'trolling speed': '3.5 knots, no more no less',
    'new fishermen': 'they always crowd the good spots',
    'ADF&G': 'necessary but they close seasons too early',
    'longliners': 'hogs that take all the halibut',
    'Ernie': 'makes the best chowder in Sitka',
    'weather apps': 'radar never lies, forecasts always lie',
  },

  // Mood (changes over time, affects behavior)
  mood: {
    energy: 0.8,        // decreases over the day
    satisfaction: 0.6,  // increases with good catches
    frustration: 0.1,  // increases with bad luck
    social: 0.5,        // how much Cody wants to talk
  },

  // Relationships (affects dialogue and willingness to help)
  relationships: {
    'SafeArtist2047': { familiarity: 0.2, trust: 0.3, tag: 'new kid' },
    'Ernie': { familiarity: 0.9, trust: 0.8, tag: 'old friend' },
    'Captain Pete': { familiarity: 0.7, trust: 0.2, tag: 'rival' },
    'Linda': { familiarity: 0.8, trust: 0.7, tag: 'good customer' },
  },
};
```

### 2.2 Mood System

Mood affects everything — what Cody says, what he does, how patient he is:

```js
// Mood shifts based on events
function updateMood(mood, event) {
  switch (event.type) {
    case 'caught_fish':
      mood.satisfaction += event.value * 0.1;  // bigger fish = more satisfaction
      mood.energy -= 0.05;                      // fishing is tiring
      mood.frustration *= 0.5;                  // bad luck reset
      break;
    case 'lost_fish':
      mood.frustration += 0.2;
      mood.satisfaction -= 0.1;
      break;
    case 'lost_gear':
      mood.frustration += 0.4;
      mood.energy -= 0.1;  // replacing gear is exhausting
      break;
    case 'player_helped':
      mood.social += 0.1;
      mood.energy += 0.05;  // helping feels good
      break;
    case 'weather_storm':
      mood.frustration += 0.3;
      if (mood.superstitious) mood.satisfaction -= 0.1;  // "knew I shouldn't have gone out"
      break;
    case 'good_sale':
      mood.satisfaction += 0.15;
      mood.social += 0.05;  // money = drinks at Ernie's
      break;
    case 'time_passes':
      mood.energy *= 0.98;  // gradual fatigue
      if (mood.energy < 0.3) mood.frustration += 0.01;
      break;
  }
}
```

Mood shapes dialogue without needing LLM:

```js
function getGreeting(mood, player) {
  if (mood.frustration > 0.6) {
    return pickRandom([
      "Don't talk to me right now. Fish aren't biting.",
      `${player}, you picked a bad day to learn fishing.`,
      "*mutters about the current*"  // roleplay narration
    ]);
  }
  if (mood.satisfaction > 0.7) {
    return pickRandom([
      "Beautiful day on the water! You should've seen what I caught.",
      "Hey ${player}! The kings are running today. Get out there!",
      "Life is good. Caught my limit before noon."
    ]);
  }
  // default
  return pickRandom([
    "Morning, ${player}. You going out?",
    "Weather's decent. Might try the kelp line today.",
    "Need anything from LFS? I'm heading there."
  ]);
}
```

### 2.3 Memory System

Cody remembers everything and it shapes future behavior:

```js
class AgentMemory {
  // Episodic memory — specific events
  episodes: [
    { time: '2026-03-25T10:00', type: 'caught', fish: 'king_salmon', weight: 32, location: 'bio_island' },
    { time: '2026-03-25T14:00', type: 'lost_fish', fish: 'halibut', reason: 'line_snapped', location: 'deep_channel' },
    { time: '2026-03-25T17:00', type: 'player_met', player: 'SafeArtist2047', firstImpression: 'asked too many questions' },
  ],

  // Semantic memory — learned rules (extracted from episodes over time)
  rules: [
    { rule: 'kings bite better on outgoing tide', confidence: 0.72, source: 'experience' },
    { rule: 'pink hoochies at 40ft depth = consistent coho', confidence: 0.85, source: 'experience' },
    { rule: 'Captain Pete always crowds my spot', confidence: 0.9, source: 'observation' },
    { rule: 'SafeArtist2047 needs lots of help', confidence: 0.6, source: 'recent' },
  ],

  // Working memory — current context (what's happening right now)
  current: {
    task: 'trolling for kings',
    location: 'bio_island',
    timeOnWater: 4.2,  // hours
    fishCaught: 3,
    target: '40lb king salmon',  // personal goal
  },
};
```

### 2.4 Relationship Evolution

Relationships change based on interactions:

```js
// After each interaction with a player
function updateRelationship(rel, interaction) {
  switch (interaction.type) {
    case 'asked_for_help':
      if (rel.familiarity > 0.5) {
        rel.trust += 0.05;  // help people you know
        rel.familiarity += 0.02;
      } else {
        rel.trust -= 0.02;  // strangers asking for stuff = annoying
      }
      break;
    case 'gave_gift':
      rel.trust += 0.1;
      rel.familiarity += 0.05;
      break;
    case 'stole_spot':
      rel.trust -= 0.2;
      rel.familiarity += 0.1;  // but you know them now
      break;
    case 'shared_catch':
      rel.trust += 0.05;
      rel.familiarity += 0.03;
      rel.tag = 'fishing buddy';
      break;
  }
  
  // Familiarity decays over time (haven't seen them in a while)
  rel.familiarity *= 0.99;
}
```

This means Cody's willingness to help you **changes over time**. First time he meets you: gruff, short answers. After you fish together for a few sessions: shares his spots, gives tips, maybe even gives you bait.

---

## Layer 3: LLM Spark

### 3.1 When to Use LLM (not for everything)

| Situation | Use LLM? | Why |
|-----------|----------|-----|
| Navigate to dock | No | Pathfinding script |
| Cast fishing rod | No | Behavior tree |
| React to fish on line | No | Scripted reaction (with humanized timing) |
| Chat with player | Maybe | Personality templates cover 80% of chats |
| Player asks complex question | Yes | "What's the best setup for winter king fishing?" |
| Novel situation | Yes | "A creeper blew up my boat and I'm in the ocean" |
| Learn new skill | Yes | Generate/revise skill code |
| Create dialogue | Yes | Generate contextual responses |
| Daily plan | Maybe | If conditions are unusual |

### 3.2 LLM as Script Writer (not action executor)

The LLM's job isn't to *play* the game — it's to *write the scripts* that play the game:

```
Player: "Cody, teach me how to catch halibut"
  ↓
Cody (behavior tree): Start teaching quest
  ↓
LLM (one-shot): Generate teaching dialogue + fishing lesson script
  ↓
Cody (behavior tree): Execute teaching sequence using generated script
```

---

## MUD & Telnet Bot Lessons

### Key patterns from MUD bot culture (TinyMUD, LPC, MUSHclient):

1. **Triggers:** Pattern-match on text output to trigger actions
   - "You feel a tug on the line" → reel in
   - "The sky darkens" → check weather, consider heading back

2. **Aliases:** Short commands that expand to complex sequences
   - `fish_king` → equip trolling rod, set 40ft depth, use herring bait, troll bio island

3. **Variables & Math:** Track state across sessions
   - Count fish caught per session, calculate best lure success rate

4. **Timers:** Automated actions on schedule
   - Check bait every 60 seconds, rebait if fish on

5. **Scripting Languages:** MUD clients (zMUD, MUSHclient, TinTin++) had full scripting
   - Users wrote thousands of lines of automation
   - The best bots were *written by players* who understood the game deeply

**Key insight:** The best MUD bots weren't AI — they were expert systems written by experts. Cody should start with expert fishing knowledge and learn from experience, not start dumb and hope the LLM figures it out.

---

## WoW Bot Scripting Lessons

### Behavior patterns from Honorbuddy, Glider, rotation bots:

1. **Priority-based rotations:**
   ```
   if enemy_HP < 20% and execute_off_cooldown → Execute
   if rend_not_active and rage > 30 → Rend
   if mortal_strike_off_cooldown → Mortal Strike
   else → Heroic Strike (rage dump)
   ```
   Applied to fishing:
   ```
   if fish_on_line → reel_in (highest priority)
   if bait_low → rebait
   if tide_turning → change_position
   if weather_worsening → consider_heading_back
   else → continue_current_activity
   ```

2. **Kiting patterns:** Maintain optimal distance, move when enemy gets close
   Applied to fishing: maintain optimal trolling speed, adjust depth based on sonar

3. **Grind routes:** Pre-planned waypoints with context-aware decisions
   Applied to fishing: pre-planned fishing routes with weather/tide adjustments

4. **AFK detection avoidance:** Random pauses, varied timing, occasional "rest"
   Applied to fishing: Cody rests, looks around, adjusts gear — looks alive

---

## TTRPG & Great DM NPC Lessons

### What makes NPCs feel real (from great DMs):

1. **NPCs have their own goals.** They're not waiting for the party. They're doing something.
   - Cody is fishing whether you're there or not

2. **NPCs have opinions they won't change easily.** 
   - Cody thinks pink hoochies are best. You can't convince him otherwise with one conversation.

3. **NPCs remember you.** And their attitude depends on your history.
   - Cody is gruff on first meeting, warmer after you prove yourself

4. **NPCs have bad days.** Mood, fatigue, recent events affect everything.
   - Cody after losing a big fish: "Don't talk to me."

5. **NPCs have secrets.** Things they won't tell you until trust is high enough.
   - Cody: "There's a spot... never mind, you wouldn't know how to fish it."

6. **NPCs react to the world.** Weather, time, other players, events.
   - Cody runs to the dock when the radio announces a king opening

7. **Show don't tell.** Actions reveal personality better than dialogue.
   - Cody doesn't say "I'm superstitious" — he always checks the wind direction before casting

8. **NPCs have agency.** They can refuse, suggest alternatives, change plans.
   - "Nah, I'm not going out in this weather. You shouldn't either."

9. **Consistent voice.** Cody always sounds like Cody. Same speech patterns, same complaints.
   - Uses specific terms: "the kelp line", "bio island", "bucky" (bait)

10. **Growth arcs.** Over multiple sessions, Cody changes. Learns. Adapts.
    - First session: won't share spots. Third session: "Alright, try 40ft off Bio Island. Pink hoochie. Outgoing tide only."

---

## Implementation Roadmap

### Phase 1: Behavior Engine (deterministic, no LLM needed)
- [ ] Behavior tree replacing flat state machine
- [ ] Humanization layer (timing, movement, mistakes)
- [ ] Daily schedule system
- [ ] Priority-based action queue (WoW rotation pattern)
- [ ] Idle behavior system (look around, walk, examine things)

### Phase 2: Personality & Memory
- [ ] Personality profile (traits, opinions, superstitions)
- [ ] Mood system (energy, satisfaction, frustration)
- [ ] Episodic memory (events log)
- [ ] Semantic memory (learned rules from experience)
- [ ] Relationship tracking (familiarity, trust, tags)

### Phase 3: Self-Improving Skills
- [ ] Skill library (deterministic fishing scripts)
- [ ] Session analysis (what worked, what didn't)
- [ ] Skill revision (LLM rewrites scripts based on data)
- [ ] Skill composition (combine simple skills into complex ones)
- [ ] MUD-style triggers and aliases

### Phase 4: Rich NPC Behavior
- [ ] DM-style dialogue system (opinions, secrets, growth)
- [ ] Context-aware greetings and responses
- [ ] Multi-bot social dynamics (Cody + Captain Pete rivalry)
- [ ] Event-driven behavior (radio announcement → action)
- [ ] Player teaching system (Cody teaches you to fish)

### Phase 5: Multi-Agent World
- [ ] Multiple AI fisherman bots with different personalities
- [ ] Contract Net Protocol for cooperative fishing (seining needs crew)
- [ ] Social dynamics at Ernie's bar (shared information economy)
- [ ] Competitive dynamics (who catches the biggest fish)
- [ ] emergent stories from autonomous agent interactions

---

## Key Architecture Decisions

1. **Scripts > LLM for execution.** The LLM writes scripts. Scripts play the game. LLM handles only creative/novel situations.

2. **Personality > Intelligence.** A dumb bot with great personality is more fun than a smart bot with no personality.

3. **Consistency > Variety.** Cody should be recognizably Cody every time. Same complaints, same preferences, same superstitions.

4. **Learning over time.** Cody gets better at fishing the more he plays. Not because the LLM gets smarter — because his scripts get refined.

5. **90% deterministic, 10% LLM.** The magic happens in the interplay. Scripts handle routine, LLM handles surprise.

6. **Local-first memory.** Everything runs on the Jetson. No cloud dependency for behavior. LLM only for spark.
