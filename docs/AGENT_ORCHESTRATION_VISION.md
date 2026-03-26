# CraftMind — Agent Orchestration Through Minecraft Games
## Strategic Research Synthesis

**Sources:** LOG-mcp, Steve AI, MineWright, SuperInstance, Equipment-Self-Improvement

---

## The Core Insight

We're not building a Minecraft bot. We're building **a platform where Minecraft is the user interface for agent orchestration**.

The games (Fishing, Studio, Courses, etc.) are each **domains** where players learn to manage, collaborate with, and improve AI agents. Each game teaches a different orchestration pattern:

| Game | Orchestration Pattern Taught |
|------|------------------------------|
| **Fishing** | Autonomous agents with personality, schedule, and self-improving scripts |
| **Studio** | Creative direction → multi-agent collaboration → pipeline management |
| **Courses** | Teaching agents, curriculum design, adaptive difficulty |
| **Researcher** | Hypothesis-driven exploration, experiment design, peer review |
| **Herding** | Multi-agent coordination, flock AI, emergent behavior |
| **Circuits** | Logic composition, signal flow, debugging agent reasoning |
| **Ranch** | Breeding/genetics as optimization, multi-generational improvement |

---

## Key Patterns From Each Repo

### From Steve AI (YuvDwi)
**Natural Language → Structured Action → Minecraft Execution**

Steve's genius is the architecture:
1. Natural language input → LLM with structured action schema
2. LLM outputs typed actions (mine, build, move, combat, etc.)
3. Tick-based action executor prevents game freezing
4. Multi-agent coordination: Steve agents partition work, avoid conflicts
5. Conversation memory provides context for decisions

**Apply to CraftMind:** Instead of hardcoded `!fish` commands, players should be able to say:
- "Cody, let's go catch some kings today"
- "Troll the kelp line at 40 feet with pink hoochies"
- "Teach me how to bottom fish"
And Cody parses the intent, plans the actions, and executes.

### From LOG-mcp (CedarBeach2019)
**Model Routing, Draft Comparison, Comparative Dataset**

LOG-mcp's key insight: **the moat is the comparative dataset** — which model/config wins for which task. This translates perfectly to:
- Which fishing script wins for which conditions (tide/weather/species)
- Which NPC personality works best for teaching
- Which agent coordination pattern works best for herding

**Draft comparison** = trying multiple approaches and picking the best. In fishing: run 3 different trolling scripts, compare catch rates, keep the winner. This IS what self-improving agents should do.

**Apply to CraftMind:** Build a **comparative evaluation layer** — agents don't just try one approach, they try multiple and rank them. Over time, the dataset of "what works best where" becomes the moat.

### From MineWright (SuperInstance)
**Voyager-style skill acquisition, humanization research, behavior trees**

Already deeply studied. Key additions:
- **Skill code is the artifact** — agents write, test, and refine JavaScript skills
- **Humanization is not optional** — without it, agents look robotic and players don't engage
- **Behavior trees over state machines** — complex decisions need composable priority logic
- **Multi-agent coordination** — Contract Net Protocol for task allocation

### From SuperInstance (SuperInstance)
**Theoretical research on agent improvement, game theory, emergent behavior**

Key concepts:
- **Equipment self-improvement**: agents improve their own tools/abilities through use
- **Game-theoretic agent interactions**: agents have utility functions, negotiate, compete
- **Emergent complexity**: simple agent rules create complex world dynamics
- **Agent identity persistence**: agents exist across sessions, grow over time

### From Equipment-Self-Improvement (SuperInstance)
**Agents that improve their own capabilities**

The key insight: agents should not just learn facts — they should **improve their own cognitive architecture**:
- Better action plans through experience
- Better resource allocation through budgeting
- Better coordination through social learning
- Better scripts through self-analysis

---

## The Grand Vision: CraftMind as Agent Orchestration School

### The Player Journey

**Level 1: Single Agent Management (Fishing)**
- Player meets Cody, learns his personality
- Learns to give instructions: "fish here", "use this bait"
- Learns that Cody has his own opinions and schedule
- Discovers that Cody gets better over time (self-improving scripts)
- **Skill learned:** prompt engineering for autonomous agents

**Level 2: Multi-Agent Coordination (Herding)**
- Player manages a team of herding dogs
- Dogs have different personalities (fast, patient, stubborn)
- Player learns to assign roles: lead dog, flanker, backup
- Emergent behavior: dogs coordinate without micromanagement
- **Skill learned:** multi-agent task allocation, role assignment

**Level 3: Creative Direction (Studio)**
- Player directs AI actors in movies
- Actors interpret direction differently based on personality
- Player learns to give creative direction, not specific instructions
- "Make it funnier" vs "Say joke at timestamp 2:14"
- **Skill learned:** delegation, abstraction, quality-over-specificity

**Level 4: Scientific Method (Researcher)**
- Player designs experiments with AI assistants
- AI generates hypotheses, runs experiments, reviews results
- Player learns to evaluate AI output critically
- "This data looks wrong — check your assumptions"
- **Skill learned:** AI-augmented research, critical thinking

**Level 5: Optimization (Ranch)**
- Player breeds animals for optimal traits
- Genetics system = multi-objective optimization
- Player learns trade-offs: speed vs strength, hardiness vs yield
- **Skill learned:** constraint optimization, multi-objective thinking

**Level 6: System Design (Circuits)**
- Player builds logic circuits that control agent behavior
- Redstone = visual programming for agent logic
- "If the fish aren't biting, switch to this pattern"
- **Skill learned:** conditional logic, state machines, feedback loops

**Level 7: Full Orchestration (Cross-Game)**
- Fishing bot uses Studio bot to make fishing documentaries
- Researcher analyzes fishing data from Fishing bot
- Ranch supplies bait from animal products
- Player orchestrates the entire ecosystem
- **Skill learned:** system design, emergent behavior, complexity management

---

## Concrete Implementation Plan

### Phase 1: Steve-Style Natural Language (immediate)
Adopt Steve's architecture for CraftMind:
- Player types natural language, not `!commands`
- LLM parses intent → structured action → mineflayer execution
- Tick-based action executor
- Conversation memory for context

**Impact:** "Cody, let's go fishing" instead of `!fish`

### Phase 2: Comparative Script Evaluation (from LOG-mcp)
Build the comparative dataset:
- Track every fishing session: conditions, script, result
- After each session, rank scripts by performance
- Over time, build "what works best when" dataset
- Use this to auto-select scripts: "Incoming tide, overcast, 40ft depth → troll-salmon script with pink hoochie"

### Phase 3: Multi-Agent Emergent Stories (from MineWright + SuperInstance)
Spawn multiple agents with different personalities:
- Cody (stubborn old salt)
- Captain Pete (competitive show-off)
- Linda (helpful shopkeeper who gives advice)
- Old Thomas (wise elder who shares Tlingit knowledge)
- A kid NPC (eager learner, asks questions)

Emergent dynamics:
- Cody and Pete rivalry at the dock
- Old Thomas teaches the kid about traditional fishing
- Linda gives you gear recommendations based on what's biting
- The kid follows you around, learning from what you do

### Phase 4: Agent Self-Improvement (from Equipment-Self-Improvement)
Cody's scripts literally improve themselves:
1. Execute fishing script → record results
2. After 10 sessions with same script, analyze:
   - What conditions led to success?
   - What conditions led to failure?
   - What adjustments would improve success rate?
3. LLM generates revised script
4. Test revised script against original
5. If improved → keep new version, archive old
6. If worse → keep original, note what didn't work

This is **equipment self-improvement applied to cognitive scripts**.

### Phase 5: Cross-Game Agent Economy
- Fishing bot catches fish → sells at market → earns currency
- Studio bot makes fishing documentary → earns views → earns currency  
- Currency buys better gear in fishing → better catches → better documentary material
- Researcher analyzes catch data → publishes paper → earns reputation
- Reputation unlocks new fishing spots, gear, crew members

The agents are the economy. Players orchestrate the flow.

---

## Technical Architecture (Borrowed Patterns)

### From Steve: Action Schema
```js
// Every action has a type, parameters, and timeout
{ type: 'fish', params: { method: 'troll', location: 'bio_island', depth: 40 }, timeout: 300 }
{ type: 'move', params: { target: [x, y, z] }, timeout: 60 }
{ type: 'chat', params: { message: 'The kings are running!' }, timeout: 5 }
{ type: 'equip', params: { item: 'fishing_rod' }, timeout: 5 }
{ type: 'use', params: { item: 'fishing_rod' }, timeout: 30 }
{ type: 'wait', params: { seconds: 5 }, timeout: 10 }
```

### From LOG-mcp: Comparative Evaluation
```js
// After each session, evaluate against alternatives
const evaluation = {
  script: 'troll-salmon-v3',
  conditions: { tide: 'incoming', weather: 'overcast', depth: 40, bait: 'pink_hoochie' },
  result: { catches: 7, totalWeight: 89, species: ['king', 'coho', 'coho'] },
  alternatives: ['troll-salmon-v2', 'drift-fish-shore'],
  ranking: 1, // best of 3
  confidence: 0.82, // 82% sure this is the best choice for these conditions
};
```

### From SuperInstance: Utility Functions
```js
// Each agent has a utility function that drives decisions
const codyUtility = {
  catchFish: (weight) => weight * 0.1,           // bigger fish = more utility
  avoidWork: (effort) => -effort * 0.05,           // prefers easy fishing
  maintainOpinion: (action) => action === 'proven' ? 0.2 : -0.1,  // stubborn
  socialTime: (hours) => hours > 2 ? 0 : -0.05,    // likes socializing, not too much
  safety: (risk) => -risk * 0.5,                    // risk-averse
};
```

---

## What Makes This Unique

1. **Agent orchestration IS the gameplay.** Not a metaphor — literally managing AI agents in Minecraft.
2. **Self-improving agents.** They get better at their jobs over time through experience.
3. **Comparative evaluation.** Not one model/script — the best one for the current conditions.
4. **Emergent stories.** Multiple agents with personalities create drama without scripting.
5. **Educational by accident.** Kids learn prompt engineering, multi-agent coordination, and optimization while fishing in Sitka Sound.
6. **Cross-game ecosystem.** Agents from different games interact and create emergent complexity.
