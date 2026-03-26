# Scripting Paradigm: Beyond Behavior Trees for Cody

> Research into superinstance repos and synthesis for a stochastic scripting approach to Minecraft bot behavior.
> Generated: 2026-03-25

## Repo Summaries

### 1. spreadsheet-moment

**What it is:** A Univer-based spreadsheet platform with optional AI agent integration. Built on TypeScript/React, provides standard spreadsheet features (formulas, collaboration, state management) with optional hooks to a "claw backend" for agent-powered automation (e.g., `=AGENT_COMPUTE(data, model)`).

**Honest assessment:** It's a spreadsheet app. The "moment" branding is aspirational (like moment.js for time — "moment" for spreadsheets). The agent integration is bolted on, not core. The repo is well-structured but the agent features appear to be API stubs pending backend work.

**Relevance to bot behavior:** Low directly. But the *idea* of cells that react to changes is interesting — imagine bot behaviors as reactive cells in a grid where state changes propagate.

### 2. constraint-theory

**What it is:** A Rust framework for snapping continuous values to a discrete manifold of Pythagorean triples via KD-trees. Core concept: if you constrain your output space to valid states, invalid outputs become impossible by construction. Uses a Φ-folding operator to map continuous vectors to nearest valid geometric state in O(log n).

**Honest assessment:** This is early-stage academic research. It's mathematically rigorous but currently limited to 2D Pythagorean lattices. The claims about "deterministic output guarantees" and "zero hallucination" apply only within the geometric constraint engine, not to general AI. It's the most intellectually interesting repo but also the most abstract.

**Relevance to bot behavior:** The core insight — **constrain the output space so invalid behavior is impossible** — is directly applicable. Instead of a behavior tree that CAN produce bad states and needs guards everywhere, define the valid behavior space and snap to it.

### 3. claw (superinstance/claw)

**What it is:** This is actually OpenClaw (the same project I'm running on). The superinstance/claw repo appears to be a fork/mirror of openclaw/openclaw. It's a multi-channel AI assistant platform with gateway, skills, companion apps, etc.

**Honest assessment:** Not a superinstance original project. No new insights for bot behavior scripting beyond what OpenClaw already is.

## Key Insights

### The Pattern (What's Actually Useful)

Across these repos, there's a recurring idea that's more implicit than explicit:

1. **Constraints over commands:** Instead of saying "do X then Y then Z" (BT), say "here's the space of valid actions; pick from it" (constraint-theory)
2. **Reactive state propagation:** Cells that respond to changes without explicit orchestration (spreadsheet-moment's model)
3. **Valid-by-construction:** Make bad states impossible rather than detecting and rejecting them (constraint-theory's Φ-folding)

This is NOT a ready-made framework we can adopt. But the *principles* suggest a different way to think about bot scripting.

## Proposed Paradigm: Stochastic Constraint Scripts

### The Core Idea

Replace behavior trees with **weighted action spaces constrained by context**:

```
Behavior Tree:     IF hungry THEN eat ELSE wander
Our approach:      actions = [eat: 0.7, wander: 0.2, chat: 0.1] WHERE hunger > 0.5
```

Instead of a tree of boolean decisions, define:
- **A set of possible actions** with weights (probabilities)
- **Constraints** that modify which actions are available and their weights
- **Stochastic selection** — pick randomly according to weights
- **State as cells** — internal state variables that update reactively

### What This Looks Like Conceptually

#### A "Script" for Fishing

```
state:
  rod_equipped: false
  patience: 100
  mood: "chill"
  last_chat: 0

constraints:
  can_fish: rod_equipped AND standing_near_water
  will_chat: (ticks - last_chat) > random(200, 600) AND nearby_players > 0

actions:
  [0.6] fish: IF can_fish
    - cast_rod()
    - wait random(5, 30) ticks
    - IF bite: reel() with 0.95 chance, ELSE miss()
    
  [0.15] idle_look_around:
    - rotate_head random(-30, 30) degrees
    - wait random(20, 60) ticks
    
  [0.15] chat: IF will_chat
    - pick from weighted_responses based on mood
    - last_chat = ticks
    
  [0.1] stretch_reposition:
    - walk random(1, 3) blocks
    - wait random(10, 30) ticks
    
mood_drift:
  every 100 ticks: mood shifts toward "bored" if fishing too long
  every catch: mood shifts toward "excited" briefly
  patience decreases 0.1/tick, resets on catch
```

#### A "Script" for Chatting

```
state:
  social_energy: 100
  topic_bias: null
  last_message_age: 0

constraints:
  will_respond: social_energy > 20 AND not_already_talking
  response_style: 
    IF social_energy > 80 → "chatty" (longer responses, asks questions)
    IF social_energy > 40 → "casual" (short, natural)
    ELSE → "brief" (one word, maybe ignore)

actions:
  [0.5] respond: IF will_respond
    - pick template from mood-weighted pool
    - fill slots with context (player name, nearby items)
    - add random filler words with 0.3 probability
    
  [0.3] continue_conversation:
    - IF someone talked in last 30 seconds
    - ask follow-up or acknowledge
    
  [0.2] ignore: 
    - IF message from unfamiliar player OR low social_energy
    - just continue current activity
```

### The DSL Concept

A DSL for this could look like YAML or TOML (human-writable, fast to parse):

```yaml
name: cody_fishing
version: 1

state:
  patience: { type: float, init: 100, min: 0, max: 100, decay: 0.01/tick }
  mood: { type: enum, values: [chill, bored, excited, annoyed], init: chill }

actions:
  fish:
    weight: 0.6
    requires: [near_water, has_rod]
    cooldown: 10-30 ticks
    on_complete:
      - mood: excited
      - patience: +20
    on_fail:
      - patience: -5
      - IF patience < 20: mood: annoyed

  chat:
    weight: 0.15
    requires: [nearby_player]
    cooldown: 200-600 ticks  # stochastic cooldown
    templates:
      chill: ["nice weather", "been here a while", "got anything good?"]
      bored: ["...", "this is taking forever", "*yawns*"]
      excited: ["YES! got one!", "fishing is great today!", "you should try this spot!"]
```

## Comparison: BT vs Stochastic Constraint Scripts

| Aspect | Behavior Tree | Stochastic Constraint Script |
|--------|--------------|------------------------------|
| **Determinism** | Same input → same output | Same input → different outputs (natural) |
| **Emergent behavior** | None (everything is explicit) | High (random selection + constraint interaction) |
| **Complexity** | Scales poorly (tree explosion) | Scales well (add actions, add weights) |
| **Natural feel** | Robotic (predictable patterns) | Human-like (variety, mood drift) |
| **Debuggability** | Hard (which node fired?) | Easy (weight distribution is observable) |
| **Speed** | Fast (boolean logic) | Fast (random + weight lookup) |
| **Guard conditions** | Scattered throughout tree | Centralized constraints |
| **Invalid states** | Possible, need guards | Impossible by construction (if constraints are right) |

## Concrete Plan for Cody

### Phase 1: Replace fishing BT with stochastic script
- Define action set: fish, idle, chat, reposition, equip rod, stow rod
- Define constraints: near water, has rod, inventory full, time of day
- Add mood/patience state that drifts and affects weights
- Result: Cody fishes differently each session without any LLM calls

### Phase 2: Chat system
- Template pools per mood context
- Weighted random selection with context injection
- Stochastic response timing (not instant, not delayed — varied)
- Social energy that depletes and recharges

### Phase 3: Combat
- Constraint-based: valid moves defined by health, weapon, range
- Stochastic weapon switching, dodging patterns
- "Skill expression" through weight distributions that shift based on opponent

### Phase 4 (Maybe): Full DSL
- If the above works, formalize into a YAML-based DSL
- Hot-reload scripts without bot restart
- Visual debugging (show current weights, state, constraints)

## What We Should NOT Take From These Repos

- The mathematical formalism of constraint-theory is overkill. We don't need Pythagorean manifolds to snap to. We just need the *idea*: constrain the space, then sample.
- The spreadsheet cell model is interesting but doesn't map cleanly to real-time bot behavior at 20 tps.
- claw/OpenClaw is a chat assistant, not a bot scripting framework.

## Conclusion

The superinstance repos don't give us a ready-made solution. They're a mix of:
- A spreadsheet app (spreadsheet-moment) — well-built but not relevant
- Academic math research (constraint-theory) — intellectually interesting, core idea useful, code not applicable
- OpenClaw fork (claw) — irrelevant

**But the synthesis is valuable:** The real insight is that behavior trees are the wrong abstraction. We don't need deterministic decision trees. We need **constrained probability distributions over actions** — define what's possible, weight what's preferred, and let randomness create naturalness.

This is simpler than a BT, more natural than an LLM, and fast enough for 20 ticks/second. It's just... weighted random choice with smart constraints. Sometimes the answer is that simple.
