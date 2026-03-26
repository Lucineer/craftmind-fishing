# CraftMind Fishing — Gameplay Research & Design Document

> Research synthesis on companion design, emergent storytelling, fishing psychology, and teaching mechanics. Practical game design recommendations for Sitka Sound.

---

## 1. Companion Design Principles — 10 Rules for Making NPCs Players Care About

Studied: Fallout 4, Dragon Age: Origins, The Last of Us, Fire Emblem, Stardew Valley, Animal Crossing, BotW/Pikmin

### Rule 1: Give Them an Opinion (And Let It Cost You)

Every companion must have preferences they act on, even when inconvenient. Fallout 4's companions have affinity thresholds that trigger quests — but more importantly, they *disapprove* of things. If Cody thinks trolling for kings at noon is stupid, he says so. Players bond with characters who push back.

**Implementation:** Every NPC has a `utility` function. Cody weighs ease, safety, pride, and results. He'll refuse bad ideas — not to block the player, but because *he wouldn't do that.*

### Rule 2: Banter Over Monologue

Dragon Age's camp banter is legendary. Two NPCs talking to *each other* (not the player) reveals character faster than any exposition dump. When Cody argues with Captain Pete at the dock about who caught the bigger halibut, the player learns both personalities without a single tutorial line.

**Implementation:** Trigger NPC-NPC dialogue when two agents are within range. Weight topics by recent events, time of day, and relationship history. Never repeat the same exchange in a session.

### Rule 3: Schedule Creates Presence

Animal Crossing villagers feel real because they *exist when you're not looking*. They wake up, go places, do things. Stardew Valley NPCs have daily schedules. When a character is always exactly where you left them, they're a prop. When you find Cody at the pub at 6pm because *that's where he goes*, he's alive.

**Implementation:** Every NPC has a daily schedule with variance (±15 min). Schedules shift based on weather, events, and player relationship. If you show up at Cody's boat at 3am, he's asleep. If you wake him, he's grumpy.

### Rule 4: Memory Is the Glue

"Remember when we almost sank in that storm?" — The Last of Us builds Joel and Ellie's bond through accumulated shared history. Fire Emblem's support ranks unlock because you *kept putting them in battle together*. The player didn't choose to bond; the bond emerged from proximity and adversity.

**Implementation:** Agent memory stores: shared events, player preferences demonstrated through action, emotional peaks (biggest catch, worst storm, first fish together). Reference these in future dialogue. "You always reel in too fast, like that time you lost the king at the boat."

### Rule 5: Let Them Fail (And React To It)

Pikmin die. Companions in Fire Emblem can *permanently* die. When an AI can fail, success matters. But more importantly: how they *react* to failure reveals character. Cody loses a big fish? He blames the gear. Then later, quietly, he practices casting when he thinks no one's watching.

**Implementation:** Track agent successes and failures. Generate reactive dialogue. Cody's confidence stat shifts based on recent outcomes — affecting his advice quality and conversational tone.

### Rule 6: Small Consistent Quirks > Big Dramatic Moments

Animal Crossing villagers have signature greetings and furniture preferences. These tiny consistent details create attachment more reliably than any cutscene. Cody always checks the barometer before leaving dock. He has opinions about specific bait colors. He hums sea shanties badly when bored.

**Implementation:** Each NPC has 5-8 persistent quirks. These trigger contextually and never break character. Quirks are the cheapest way to make someone feel real.

### Rule 7: Incremental Disclosure — They Reveal Themselves Over Time

You don't learn everything about a person in one conversation. Dragon Age's companion quests unlock gradually. Stardew's heart events reveal deeper personality at 2, 4, 6, 8, 10 hearts. Trust gates content.

**Implementation:** NPC dialogue tiers based on relationship level. At low trust: surface-level, helpful but guarded. At high trust: personal stories, doubts, humor, vulnerability. Each tier has unique dialogue pools that don't bleed.

### Rule 8: They Must Have Something To Lose

Stardew Valley NPCs have life events — marriage, family, career changes. The Last of Us works because Ellie has everything to lose. A companion with no stakes is a tutorial voice.

**Implementation:** Each NPC has personal goals and fears. Cody fears he's too old to compete in the Sitka Salmon Derby. Linda wants to expand her shop but needs capital. Old Thomas is the last one who knows the old Tlingit fishing grounds. These create quest hooks and emotional investment.

### Rule 9: They Help On Their Own Terms

The best companions feel like they're *choosing* to help, not following a script. In BotW, the King Rhoam ghost doesn't hold your hand — he gives cryptic guidance. Pikmin follow you but also get distracted by nectar. Cody helps because he respects you, not because the game says he must.

**Implementation:** NPC help is gated by relationship AND context. Cody won't give you his secret halibut spot until you've proven yourself. He won't help during a tournament against Captain Pete (rivalry). Help feels earned, not automatic.

### Rule 10: Silence Is Content

Not every moment needs dialogue. The Last of Us is brilliant because Joel and Ellie are sometimes *quiet*. They walk. They exist. When Cody sits at the back of the boat, watching the line, not talking — that's a character moment. Don't fill every second with chatter.

**Implementation:** Agents have "quiet" states. After dialogue, they don't immediately speak again. Environmental context matters — foggy mornings, they're quiet. Storms, they're focused. Only celebrate or commentate on notable events.

---

## 2. Emergent Story Patterns — 5 Event Patterns That Create Memorable Moments

Studied: Dwarf Fortress, RimWorld, The Sims, Crusader Kings, Kenshi

### Pattern 1: The Cascade Failure

**Inspiration:** Dwarf Fortress "Fun" — one thing goes wrong, everything goes wrong.

**In Sitka Sound:** A storm rolls in unexpectedly. Cody's engine stalls (random failure). The anchor drags. You're drifting toward rocks. Captain Pete's boat is visible but he's choosing whether to help (rivalry check). Old Thomas radioed a warning 10 minutes ago but you missed it (if you'd been listening).

**Why it works:** Multiple systems interact. Player agency matters (did you check the weather? maintain the engine? build the relationship with Pete?). The story writes itself.

### Pattern 2: The Rivalry Escalation

**Inspiration:** Crusader Kings dynastic drama — AI characters with competing goals create narrative.

**In Sitka Sound:** Cody and Captain Pete both enter the Sitka Salmon Derby. Their competitive behavior escalates over days: Pete "accidentally" trolls through Cody's spot. Cody spreads a rumor about Pete's bait. The player can mediate, side with one, or exploit both. The winner's confidence changes. The loser gets a new goal ("next year...").

**Why it works:** No scripting required — just give NPCs competing utility functions and let them interact. Player becomes the fulcrum.

### Pattern 3: The Unplanned Friendship

**Inspiration:** The Sims — autonomous social interactions create surprising bonds.

**In Sitka Sound:** The kid NPC starts following Cody around. Cody is annoyed at first ("Go home, kid"). Over time, the kid catches a fish using Cody's advice. Cody is secretly proud but won't admit it. The kid starts calling Cody "Uncle Cody." Other NPCs notice and comment. A genuine relationship emerged from proximity and circumstance.

**Why it works:** NPCs have social behavior independent of the player. The player is an observer who can choose to participate.

### Pattern 4: The Consequence Echo

**Inspiration:** RimWorld — decisions echo. You sold a prisoner? Their faction raids you months later.

**In Sitka Sound:** Early game: you sold a rare fish to Linda instead of sharing it with Cody. Weeks later: Cody won't share his secret spot. You see Linda wearing the fish as decor in her shop. An NPC comments on your greed. A small choice had a long tail.

**Why it works:** Players remember decisions that have delayed, unpredictable consequences. It makes the world feel connected.

### Pattern 5: The Right Place, Right Time

**Inspiration:** Kenshi — the world has things happening whether you're there or not.

**In Sitka Sound:** Old Thomas only appears at a certain cove during low tide on foggy mornings. If you happen to be there, he shares a piece of Tlingit fishing knowledge you can't get anywhere else. If you're not, you hear about it later — "Thomas was down at the cove this morning. Said something about the old way to read the currents." FOMO drives replay and exploration.

**Why it works:** Scarcity and discovery. Not everything is available all the time. Secrets exist.

---

## 3. Trust & Relationship System Design

### Core Mechanics

**Two axes per NPC:**
1. **Trust (0-100):** How much they share, help, and rely on you. Slow to build, slower to lose. Gated by *demonstrated behavior*, not gifts.
2. **Familiarity (0-100):** How well they know your patterns. Fast to build through proximity. Enables memory callbacks and anticipatory help.

**Trust builds through:**
- Keeping promises ("I'll be at the dock at 5" → showing up at 5)
- Shared adversity (surviving storms, losing fish together)
- Respecting boundaries (not pushing when they say no)
- Consistent behavior (doing what you say you'll do)
- Choosing them over alternatives (fishing with Cody vs. Pete)

**Trust decreases through:**
- Broken promises
- Abandoning them in tough situations
- Disrespecting their knowledge
- Taking credit for their work
- Selling shared catches without asking

**Familiarity builds through:**
- Time spent together (nearby)
- Number of fishing trips together
- Repeated interactions (saying good morning 20 times)
- Observing player habits (always trolls, always uses pink bait)

### Specific Milestones (Cody Example)

| Trust | Unlocked | Cody's Behavior |
|-------|----------|-----------------|
| 0-10 | Basic greetings | Short, dismissive. "Yeah?" |
| 10-20 | Will answer questions | Still gruff. Gives minimal advice. |
| 20-30 | Shares fishing tips | Unprompted advice: "Tide's turning, might want to switch to bottom rig." |
| 30-40 | Tells you about the derby | Mentions the competition. His rivalry with Pete becomes visible. |
| 40-50 | Shares a good spot | "Between the kelp beds and the dropoff. Don't tell Pete." |
| 50-60 | Memory callbacks begin | "Remember that coho you lost? Try a lighter leader this time." |
| 60-70 | Personal story #1 | Reveals he used to fish with his brother. Brother moved to Anchorage. |
| 70-80 | Asks for YOUR help | "I can't make it to the supply run. Can you grab 200ft of 30lb monofilament?" |
| 80-90 | Secret spot | Takes you to a hidden cove. "My brother and I found this 30 years ago." |
| 90-100 | Personal story #2 | Opens up about why he stopped fishing commercially. Vulnerability. |

### Familiarity Milestones

| Familiarity | Behavior |
|-------------|----------|
| 0-20 | Uses your username |
| 20-40 | Shortens to nickname |
| 40-60 | Anticipates: has bait ready when you arrive |
| 60-80 | Teases: "Pink hoochies again? You're predictable." |
| 80-100 | Finishes your sentences, knows your preferences |

### Key Design Decisions

- **Trust is NOT symmetric.** Cody might trust you at 70 but you only trust him at 40 because he gave bad advice once.
- **Trust is per-NPC.** Being best friends with Cody doesn't help with Pete — it might hurt (rivalry penalty).
- **Trust gates knowledge, not mechanics.** Low trust doesn't lock you out of fishing. It locks you out of *Cody's* fishing secrets. You can always figure things out yourself.
- **No trust grind.** No "give 50 fish to max relationship." Trust comes from natural play.

---

## 4. Teaching Mechanics — How Cody Teaches Without Feeling Like A Tutorial

### The GLaDOS Principle

Portal's genius: the "tutorial" IS the story. GLaDOS is teaching you to use the portal gun, but she's also establishing character, tone, and the central relationship. You're learning mechanics while falling in love with (and suspicious of) the game.

**Cody's version:** When Cody teaches you to cast, he's also telling you who he is. "Hold the rod at 2 o'clock and snap your wrist — no, not like that. My dead grandmother casts better than that, and she's been dead for fifteen years." You learn the mechanic AND his personality simultaneously.

### The Dark Souls Principle

Dark Souls teaches through *consequence*. The game doesn't tell you "don't go to the graveyard." You go there, you die, you learn. The environment is the teacher.

**Cody's version:** Cody doesn't explain tide charts. But if you go fishing at dead low tide, you catch nothing. Cody comments: "Fishing at slack tide? That's optimistic." The player learns from consequence, but Cody's commentary adds flavor and a hint.

### The Minecraft Principle

Minecraft has no tutorial. The crafting tree teaches you: you see wood, you punch it, you make planks, you see sticks, you make tools. Discovery IS the teaching.

**Cody's version:** Don't explain all fish types upfront. Let the player discover them. When they catch something new, Cody identifies it: "That's a yelloweye. Good eating, but they're protected — you'll want to throw that one back." Discovery + contextual info.

### Teaching Techniques (Ordered From Subtle To Direct)

1. **Environmental teaching:** Fish behavior, tide effects, weather — learn by doing. No explanation needed.
2. **Consequence teaching:** Catch nothing at the wrong time/place. Natural feedback loop.
3. **Commentary teaching:** Cody observes and comments. "You're reeling too fast." Not instruction — observation.
4. **Demonstration teaching:** Cody does it and you watch. "Watch the rod tip — when it dips like that, set the hook." Visual learning.
5. **Requested teaching:** Player asks. "How do you know when the tide's right?" Cody answers in character.
6. **Story teaching:** Old Thomas tells a Tlingit story about fishing that contains practical knowledge. Player absorbs it as culture.
7. **Challenge teaching:** "I bet you can't land a king without losing the bait." Motivation through challenge.

### Anti-Patterns (What NOT To Do)

- **No pop-up tutorials.** Ever.
- **No "press X to cast" prompts after the first time.**
- **No dialogue trees that are clearly teaching moments.** Disguise everything as conversation.
- **No mandatory fishing lessons.** If a player wants to figure it out alone, let them. Cody can comment ("Learning the hard way, huh?") but not block.

---

## 5. Fishing Psychology — Why Fishing Is Fun and How to Maximize It

### Why Fishing in Games Is Universally Appealing

Fishing minigames appear in almost every genre — Stardew Valley, Zelda, Nier Automata, Persona, Final Fantasy. Why?

**1. Variable Ratio Reinforcement (The Slot Machine)**
Real fishing is uncertain. You might catch nothing, or you might catch the fish of a lifetime. This uncertainty is psychologically addictive — it's the same mechanism as loot boxes, but organic. The brain craves the dopamine spike of the unexpected reward.

**Design implication:** Never guarantee a catch. Keep base catch rates lower than players expect. Make rare fish genuinely rare. The big catch should feel *earned by luck*.

**2. The Tension-Release Cycle**
Cast → wait → wait → nibble → BITE → fight → land (or lose). This micro-tension arc is perfectly paced for engagement. The wait builds anticipation. The bite is the climax. The landing is release.

**Design implication:** Don't shortcut the wait. The "boring" part IS the fun part. But keep it short enough (15-45 seconds) that it doesn't become tedious. Weather and conditions should affect wait time.

**3. Pattern Recognition + Mastery**
Fishing rewards knowledge. Which bait for which fish. Which spot at which tide. Which technique for which condition. As players learn patterns, they feel smart. Mastery is intrinsically satisfying.

**Design implication:** The system must be learnable but not trivial. Different fish respond to different conditions. Cody's advice helps, but the player can discover things Cody doesn't know.

**4. The Collection Drive**
"I haven't caught one of those yet." Fishing games naturally support collection mechanics — species, sizes, records. The completionist itch keeps players coming back.

**Design implication:** Track everything. Species catalog, personal bests, seasonal records, rare variants. Display gaps prominently to motivate.

**5. Controlled Relaxation**
Fishing is one of the few game activities that's both engaging and calming. It's low-stakes (usually), atmospheric, and doesn't require twitch reflexes. It's active meditation.

**Design implication:** Make sure there's a "chill fishing" mode — easy spot, pleasant weather, guaranteed (small) catches. Not every session needs to be a tournament.

### What Each Reference Game Does Best

| Game | What It Nails | Apply To CraftMind |
|------|--------------|-------------------|
| **Stardew Valley** | The skill bar minigame — simple to learn, hard to master. Physical tension. | The reel-in minigame: tension management, not reflex. |
| **Dredge** | Atmosphere + dread. Fishing as discovery. Unknown depths. | Night fishing in Sitka Sound. Fog. Things in the water you can't identify. |
| **Moonglow Bay** | Cozy community. Fishing as connection. | NPC reactions to your catches. Community events around fishing. |
| **Fishing Planet** | Deep realism. Gear matters. Conditions matter. | Tackle, bait, line, depth, tide — all affect outcomes. Not decoration. |
| **Nier Automata** | Fishing as unexpected depth. Players who discover it are rewarded. | Secret fishing spots with unique fish. NPCs who fish. Fishing as a way to learn lore. |
| **Animal Crossing** | Casual, low-pressure, seasonal. Fish have seasons and times. | Seasonal migrations in Sitka Sound. Monthly fish. Some only appear in specific conditions. |

### Maximize the Fishing Loop

The ideal fishing session in Sitka Sound:

1. **Preparation** (2-5 min): Check weather. Talk to NPCs for tips. Choose gear. Decide location. This is the *thinking* phase.
2. **Travel** (1-3 min): Boat ride. scenery. Maybe a conversation with Cody. This is the *anticipation* phase.
3. **Fishing** (5-15 min): Cast, wait, engage. Variable outcomes. This is the *core loop*.
4. **Outcome** (1-3 min): What did you catch? How big? NPC reactions. Record keeping. This is the *reward* phase.
5. **Return** (1-3 min): Head back. Process catches. Plan next trip. This is the *reflection* phase.

Total session: 10-30 minutes. Repeatable. Each phase should be satisfying on its own.

---

## 6. Agent Personality Diversity — NPC Profiles

### Cody — The Stubborn Old Salt

**Role:** Primary fishing companion. Mentor figure (grudgingly).

**Personality:** Gruff, opinionated, stubborn, secretly kind. Speaks in short sentences. Hates small talk. Loves fishing more than people. Competitive but tries to hide it.

**Voice markers:**
- Short declarative sentences: "Tide's wrong." "Use the pink one." "That's a stupid idea."
- Fishing metaphors for everything: "This weather's about as reliable as a two-hook rig."
- Old maritime sayings: "Red sky at morning, sailor's warning."
- Gets quieter when emotional. Long silences mean he's thinking about something heavy.

**Secret:** He hasn't spoken to his brother in 8 years. The brother left fishing. Cody stayed.

**Quirks:**
- Always checks the barometer before leaving dock. Always.
- Refuses to use GPS. "I don't need a computer to tell me where I am."
- Hums sea shanties when he thinks no one can hear. Badly.
- Has a lucky hat he never washes.
- Gets genuinely angry when someone mistreats a fish (throwing them on the deck carelessly).

---

### Captain Pete — The Show-Off

**Role:** Rival fisherman. Comic relief and competitive tension.

**Personality:** Loud, confident, boastful, secretly insecure. Wants to be the best fisherman in Sitka. Style over substance. Generous when winning, bitter when losing.

**Voice markers:**
- Everything is a competition: "Bet I can beat you to the kelp beds."
- References his own accomplishments: "Reminds me of the 40-pounder I landed last Tuesday."
- Overuses fishing jargon to sound expert: "You gotta work the thermocline, read the sonar, match the hatch."
- Gets flustered when out-fished: stammers, changes subject, suddenly remembers somewhere else to be.

**Secret:** He's in debt. His boat is mortgaged. He NEEDS to win the derby.

**Quirks:**
- Always arrives at the dock last but makes an entrance.
- His boat is too clean. He spends more time polishing than fishing.
- Brings a cooler of fancy snacks he doesn't share.
- Photographs every catch for "the instagram" (if modern setting) or "the lodge wall" (if period).
- Terrible at backing up his boat to the dock. Everyone watches.

---

### Linda — The Practical One

**Role:** Shopkeeper. Equipment advisor. Grounded perspective.

**Personality:** Warm but no-nonsense. Runs the supply shop. Knows what's biting because everyone tells her. Sees everything at the dock. Mother hen energy but respects competence.

**Voice markers:**
- Practical advice, always: "If you're heading to the north channel, take extra leader — the rocks eat line there."
- Remembers what everyone bought: "Still using the same spinner, huh? Caught anything with it yet?"
- Gentle teasing: "Cody sent you for his usual? That man's more predictable than the tides."
- Gets serious when it matters: weather warnings, safety gear, conservation rules.

**Secret:** She used to be a commercial fisherman. Quit after an accident. Misses it every day.

**Quirks:**
- Always has coffee going. Offers it to everyone.
- Organizes her shop by the fishing calendar, not alphabetically.
- Keeps a whiteboard of "what's biting where" that's usually accurate.
- Refuses to sell certain things to certain people ("No, Pete, you're not buying dynamite").
- Her cat lives in the shop and judges customers.

---

### Old Thomas — The Elder

**Role:** Lore keeper. Tlingit cultural knowledge. Rare, valuable guidance.

**Personality:** Quiet, deliberate, speaks when there's something worth saying. Carries centuries of fishing knowledge. Doesn't give advice — tells stories. Patient. Sad about cultural loss.

**Voice markers:**
- Stories that take a while to get to the point: "My grandfather told me about a place where the current swirls like a whirlpool. It was down past the second point, where the eagle nests..."
- References to Tlingit values: respect for the fish, taking only what you need, the river provides.
- Simple but profound: "The fish were here before us. They'll be here after. The question is whether we learn to listen."
- Sometimes speaks in Lingít phrases, then translates. Or doesn't.

**Secret:** He's the last one who knows where the old village fishing grounds are. He's choosing who to pass this to.

**Quirks:**
- Appears at specific times and places. Never predictable enough to farm.
- Carries a carved wooden fish that's very old.
- Pauses to watch eagles. Always.
- Knows the Tlingit names for every fish, current, and rock formation.
- The younger NPCs (even Cody) treat him with quiet respect.

---

### Maya — The Kid

**Role:** Eager learner. Player surrogate. Relationship catalyst between NPCs.

**Personality:** Enthusiastic, curious, asks too many questions, not good at fishing yet but trying. 12-14 years old. Looks up to everyone. Oblivious to adult tensions.

**Voice markers:**
- Questions, constantly: "Why do you use two hooks instead of one?" "Can I try?" "What's the biggest fish you ever caught?"
- Gets excited about everything: "OH MY GOD WAS THAT A SEAL?!"
- Terrible at lying: covers mouth with hand, avoids eye contact
- Recites "facts" she learned from NPCs that are slightly wrong: "Cody says halibut can pull your boat under!"
- Growing confidence: starts shy, gets bolder as she learns

**Secret:** Her dad was a fisherman who died at sea. She's trying to learn to feel close to him.

**Quirks:**
- Has a beat-up tackle box that's way too big for her.
- Keeps a journal of every fish she's seen (not just caught).
- Draws pictures of the fish. They're bad but enthusiastic.
- Follows Cody around until he gives in and teaches her something.
- Names every fish she catches.

---

### Sergei — The Outsider

**Role:** Visiting sport fisherman. Brings outside perspective. Unfamiliar with local ways.

**Personality:** Russian or Eastern European. Big game hunter energy applied to fishing. Means well but is clueless about local etiquette. Loud. Generous. Finds everything amazing.

**Voice markers:**
- Everything is "in Russia, we..." followed by something absurdly hardcore.
- Enthusiastic about the wrong things: "This fog! Is beautiful! In Novosibirsk, fog means the bears are sleeping!"
- Asks about sizes first: "How BIG is the salmon here? I want the BIG one."
- Has no concept of conservation: needs to be corrected (gently or not)

**Secret:** He's here because his wife told him to "go find himself" for a month. He's genuinely having the time of his life and will cry when he leaves.

**Quirks:**
- Brought entirely wrong gear for the conditions. Huge deep-sea rod for a sheltered sound.
- Cooks everything he catches. Badly. Offers it to everyone.
- Takes photos of EVERYTHING. Seagulls. Rocks. His own boots.
- Knows impressive (but irrelevant) knots and insists on showing people.
- Gets genuinely moved by beautiful scenery and goes quiet. Then ruins it with a loud comment.

---

## 7. Memorable Moments Design — 10 "Holy Shit" Moments

These are moments the game's systems should be capable of generating. Not scripted cutscenes — emergent events from agent behavior, weather, and player action.

### 1. The Storm Rescue
**Setup:** Major storm rolls in. Player is far from harbor. Boat engine fails (random event). Cody (or another NPC) appears through the fog, having come to find you despite the danger.
**Why it hits:** Shared adversity. An NPC chose to risk themselves for you. Trust earned in the most visceral way.
**System triggers:** Weather event + player distance from harbor + engine durability + NPC relationship check.

### 2. The Hundred-Pound Halibut
**Setup:** Player hooks something enormous. The fight takes 10+ minutes. Line is groaning. Cody (if present) goes uncharacteristically quiet and still. The whole dock watches when you return.
**Why it hits:** The rarity + the tension + the communal reaction. Everyone remembers the day someone landed the big one.
**System triggers:** Rare fish spawn + gear quality check + fight duration mechanic + NPC awareness radius.

### 3. Thomas Takes You to the Old Grounds
**Setup:** After months of building trust, Old Thomas leads you to a hidden location. The fishing is incredible. He tells you the Tlingit name for the place. He asks you not to tell the others.
**Why it hits:** Exclusive knowledge. Cultural depth. You've been chosen.
**System triggers:** Trust threshold (Thomas, 80+) + correct time/location + random opportunity.

### 4. The Derby Bet
**Setup:** Sitka Salmon Derby. Cody bets Pete his lucky hat. Pete bets his boat's nameplate. The player becomes the tiebreaker. Your catch determines who wins. The loser's reaction depends on your relationship with them.
**Why it hits:** Player agency in NPC drama. Real stakes. Someone wins, someone loses, and it's your fault.
**System triggers:** Annual/monthly tournament event + NPC rivalry active + player participation.

### 5. Maya Catches Her First Fish
**Setup:** Maya's been trying for days. She's frustrated. You and Cody are fishing nearby. Suddenly her rod bends. She screams. It's a decent fish — not big, but HERS. Cody pretends not to care but you catch him smiling.
**Why it hits:** Witnessing someone else's joy. The gruff mentor softening. Pure heart.
**System triggers:** Maya's fishing attempts counter + random success event + NPC proximity.

### 6. The Whale
**Setup:** While fishing quietly, a humpback whale surfaces 30 yards from your boat. Time slows. All NPCs in range stop what they're doing. Thomas says something in Lingít. Nobody speaks for a full minute.
**Why it hits:** Awe. Nature. Shared experience that transcends the game loop. The whale doesn't DO anything — its presence is enough.
**System triggers:** Random rare event + time of day + weather conditions + player stillness (not casting/reeing).

### 7. Pete's Boat Breaks Down
**Setup:** Pete's over-polished engine gives out. He's drifting. He'd rather die than ask for help. The player can help, laugh, or ignore. Your choice affects both Pete and Cody's opinions.
**Why it hits:** Moral choice with immediate social consequences. No "right" answer — just consequences.
**System triggers:** Random failure event + Pete's location + player proximity + relationship checks.

### 8. The Forbidden Spot
**Setup:** An NPC mentions a spot that's technically off-limits (marine reserve, private property, dangerous waters). Do you go? If caught, you face consequences with multiple NPCs. If not, you wonder what was there.
**Why it hits:** Temptation and consequence. The forbidden is always more interesting.
**System triggers:** Rumor dialogue from NPC + player choice to investigate + consequence system.

### 9. Sergei's Last Day
**Setup:** Sergei's month is up. He's leaving. He throws a farewell dinner (terrible food) and gives everyone gifts. His gift to the player is something genuinely useful — a piece of gear or knowledge from Russia. He cries. He tries to hide it.
**Why it hits:** Loss. A character you've grown to like is gone. Makes you appreciate the NPCs who stay.
**System triggers:** Timed event (30 days after Sergei arrival) + relationship check for gift quality.

### 10. The Legend
**Setup:** After a year of in-game time, NPCs start telling stories about YOUR fishing. "Remember when [player] landed that king during the blow?" Your actions have become part of Sitka Sound's lore. New NPCs reference your reputation before meeting you.
**Why it hits:** Legacy. The world acknowledges what you've done. You've become part of the story.
**System triggers:** Cumulative player actions over time + NPC dialogue system updating with player history.

---

## 8. Progression System — How the Player's Relationship With the World Evolves

### Layer 1: The Newcomer (Days 1-7)

**Player state:** Doesn't know anyone. Doesn't know where to fish. Catches nothing.
**World state:** NPCs are polite but distant. Weather seems random. Everything is mysterious.
**Goals:** Catch your first fish. Learn one name. Figure out the tide chart.
**NPC behavior:** Brief greetings. No one offers help unprompted. Cody says "yeah?" when you talk to him.
**Unlocked:** Basic casting, one fishing spot (the easy one near dock), basic bait.

### Layer 2: The Regular (Weeks 1-4)

**Player state:** Catching fish sometimes. Knows the basic spots. Recognizes NPCs.
**World state:** NPCs start remembering you. Weather patterns are emerging. Some fish are still mysterious.
**Goals:** Catch a salmon. Learn a secret spot. Get Cody to trust you.
**NPC behavior:** Nicknames start. "Morning, fisherman." Linda asks about your last trip. Maya follows you around.
**Unlocked:** Trolling, new bait types, tide chart, weather radio.

### Layer 3: The Fisherman (Months 1-3)

**Player state:** Consistent catches. Knows when and where. Starting to understand the system.
**World state:** Seasonal changes. Fish migration patterns. NPCs have opinions about your skill.
**Goals:** Enter the derby. Explore the far waters. Build real trust with one NPC.
**NPC behavior:** Real conversations. Cody shares tips. Pete challenges you. Thomas appears more often.
**Unlocked:** Deep water fishing, new gear, tournament system, NPC quest lines.

### Layer 4: The Old Hand (Months 3-6)

**Player state:** Expert angler. Knows things new players don't. Has stories.
**World state:** You're part of the community. New NPCs ask YOU for advice. The world responds to your reputation.
**Goals:** Win the derby. Find Thomas's old grounds. Help Maya become a fisherman. Resolve Cody's story.
**NPC behavior:** Deep relationships. Personal quests active. NPCs rely on you. Rivalry with Pete is intense.
**Unlocked:** All fishing spots, advanced gear, secret locations, the full story.

### Layer 5: The Legend (Months 6+)

**Player state:** You've seen it all. Caught the rare fish. Weathered the storms. Know the Sound like the back of your hand.
**World state:** Your actions are history. NPCs tell your stories. The world has changed because of you.
**Goals:** Whatever you want. The training wheels are off.
**NPC behavior:** They're proud of you. Some have grown alongside you (Maya can fish now). Some are fading (Thomas is old).
**Unlocked:** Everything. Including the ability to change the world (preserve the old grounds? Open a charter? Train the next generation?).

### Meta-Progression (Across Sessions)

This game uses Minecraft as a platform — progression persists across play sessions:

- **Agent memory persists.** Cody remembers you from last session. Thomas remembers what you promised.
- **World state persists.** Seasons change. The derby happens monthly. Rare fish spawn based on cumulative calendar.
- **Script improvement persists.** Cody's fishing scripts literally get better over time (the self-improvement loop from the vision doc). A player who's been playing for 6 months has a genuinely better Cody than a new player.
- **Player reputation persists.** NPCs in other CraftMind games might reference your fishing achievements. "The guy who caught the hundred-pound halibut."

### The Progression Philosophy

**Horizontal > Vertical.** Progression isn't about bigger numbers (damage, stats). It's about deeper relationships, more knowledge, more options, richer stories. A new player and an old player face the same fishing — but the old player has context, history, and connections that make every catch mean more.

**Time Is the Currency.** The rarest rewards can't be grinded — they require being present over time. Thomas's trust takes months. The whale might only appear once a season. The legend status requires a year of play. This makes absence meaningful.

**Loss Is Progression.** Losing a big fish. A storm destroying gear. An NPC being disappointed in you. These aren't setbacks — they're story material. The progression system should embrace failure as narrative fuel.

---

## Appendix: Quick Reference — What Each Game Teaches Us

| Game | Key Lesson | Apply To |
|------|-----------|----------|
| Fallout 4 | Companion affinity unlocks character depth | Trust milestones |
| The Last of Us | AI partner that enhances, doesn't interrupt | Cody's fishing behavior |
| Fire Emblem | Proximity + adversity = relationship | Familiarity system |
| Dragon Age | Approval gates conversations and quests | Trust gates knowledge |
| Stardew Valley | Schedules + gifts + heart events = attachment | NPC daily routines |
| Animal Crossing | Personality types + memory + quirks = character feel | Agent personality diversity |
| Dwarf Fortress | Simple rules → complex emergent stories | Cascade failure pattern |
| RimWorld | AI storyteller creates dynamic difficulty | Weather/event pacing |
| The Sims | Autonomous social behavior creates surprise | NPC-NPC interactions |
| Crusader Kings | Competing AI goals create drama | Rivalry escalation |
| Portal | Teaching through character, not tutorial | Cody's dialogue design |
| Dark Souls | Teaching through consequence | Environmental learning |
| Minecraft | Teaching through discovery | Fish variety and conditions |
| Stardew fishing | Skill bar = physical tension | Reel-in minigame |
| Dredge | Atmosphere + unknown = dread | Night fishing |
| Factorio | Teaching through necessity | Gear progression |

---

*Document generated from gameplay research synthesis. Last updated: March 2026.*