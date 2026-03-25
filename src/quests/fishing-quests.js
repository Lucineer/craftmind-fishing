// CraftMind Fishing — RPG Quest System
// Alaska stories, gear tutorials, and skill challenges.

export const QUEST_CATEGORIES = {
  gear:   { name: 'Gear Quests',    emoji: '🔧', description: 'Learn to craft and use fishing gear.' },
  story:  { name: 'Story Quests',   emoji: '📖', description: 'Alaska narratives with real Sitka flavor.' },
  skill:  { name: 'Skill Quests',   emoji: '🏆', description: 'Demonstrate mastery of fishing methods.' },
};

const QUESTS = {
  // ── Gear Quests ─────────────────────────────────────────
  first_cast: {
    id: 'first_cast',
    name: 'First Cast',
    category: 'gear',
    icon: '🎣',
    tier: 1,
    description: 'Catch any fish with basic gear. Everyone starts somewhere.',
    objective: 'Catch 1 fish with a light spin rod.',
    target: { type: 'catch', species: 'any', method: 'any', count: 1, gearRequired: ['light_spin_rod'] },
    rewards: { gold: 10, xp: 50, items: ['mono_20lb x2'] },
    dialogue: {
      start: "First time fishing? Here — take this rod. Just cast it in the water and wait. When you feel a tug, yank. That's literally it. Well... mostly.",
      progress: "See? Something's interested. Don't let it get away!",
      complete: "You caught a fish! I've seen worse first casts. Come back when you want to learn what you're actually doing.",
    },
    unlocks: ['the_right_tool'],
  },
  the_right_tool: {
    id: 'the_right_tool',
    name: 'The Right Tool',
    category: 'gear',
    icon: '🏪',
    tier: 1,
    description: 'Visit the gear shop and buy something. A fisherman is only as good as their gear.',
    objective: 'Visit Sitka Marine Supply and purchase any item.',
    target: { type: 'shop_visit', action: 'buy', count: 1 },
    rewards: { gold: 5, xp: 30 },
    dialogue: {
      start: "You can't catch halibut on 10lb mono. Head over to Sitka Marine Supply — Old Pete's got what you need. Tell him I sent you. Actually, don't. He doesn't like me.",
      progress: "Old Pete's got a lot of stuff. Don't let him upsell you on the electric reel.",
      complete: "Now you've got gear. That's step one. Step two is not losing it all on the first trip.",
    },
    unlocks: ['crafty_angler'],
  },
  crafty_angler: {
    id: 'crafty_angler',
    name: 'Crafty Angler',
    category: 'gear',
    icon: '🔨',
    tier: 1,
    description: 'Craft your first piece of gear at the anvil or loom.',
    objective: 'Craft any piece of gear.',
    target: { type: 'craft', any: true, count: 1 },
    rewards: { gold: 20, xp: 75, recipes: ['buzz_bomb', 'zig_zag'] },
    dialogue: {
      start: "Buying gear is fine, but a real fisherman makes their own. Hit the anvil and bend some iron. Start simple — a circle hook. Two iron ingots and some string.",
      progress: "There you go. Feels different when you made it yourself, doesn't it?",
      complete: "You're a crafty one. I'll teach you the good patterns — ones they don't sell in stores.",
    },
    unlocks: ['the_trollers_spread'],
  },
  the_trollers_spread: {
    id: 'the_trollers_spread',
    name: "The Troller's Spread",
    category: 'gear',
    icon: '🚤',
    tier: 2,
    description: 'Set up a proper trolling spread with downriggers, flashers, and hoochies.',
    objective: 'Equip a trolling rod, flasher, hoochie, and downrigger. Catch 3 salmon.',
    target: { type: 'catch', species: ['king_salmon', 'coho_salmon', 'pink_salmon'], method: 'trolling', count: 3, gearRequired: ['trolling_rod', 'flasher', 'hoochie', 'downrigger'] },
    rewards: { gold: 100, xp: 300, recipes: ['point_wilson_dart', 'crippled_herring'] },
    dialogue: {
      start: "Trolling isn't just dragging a line. You need a spread. Downrigger on port side, flasher and hoochie 36 inches back, running at 40-80 feet. That's how Sitka was BUILT.",
      progress: "See the flasher spinning? Salmon can see that from 100 feet away. They're curious — and angry.",
      complete: "NOW you're trolling. That's a proper spread. The charter boats charge $200 a head for what you just set up for free.",
    },
    unlocks: ['pot_watcher'],
  },
  pot_watcher: {
    id: 'pot_watcher',
    name: 'Pot Watcher',
    category: 'gear',
    icon: '🦀',
    tier: 2,
    description: 'Deploy 5 crab pots and check them. Patience pays.',
    objective: 'Deploy and check 5 crab pots. Keep at least 3 Dungeness.',
    target: { type: 'catch', species: 'dungeness_crab', method: 'crab_pots', count: 3, deployments: 5 },
    rewards: { gold: 75, xp: 200, items: ['shrimp_pot'] },
    dialogue: {
      start: "Crabbing's simple — bait a pot, drop it, wait. Check it in 12 hours. The hard part is finding the right spot. Try near rocky structure in 50-100 feet of water.",
      progress: "Check your buoys! Nothing worse than pulling a pot full of nothing. Well, pulling a pot full of decorator crabs. Almost worse.",
      complete: "Not bad! You've got a few keepers. Size limit's 6.5 inches across the back — measure carefully, fish and game's watching.",
    },
    unlocks: ['deep_diver'],
  },
  deep_diver: {
    id: 'deep_diver',
    name: 'Deep Diver',
    category: 'gear',
    icon: '🤿',
    tier: 2,
    description: 'Dive below 30 blocks with proper gear. The ocean gets weird down there.',
    objective: 'Reach depth 30+ blocks underwater while wearing dive gear.',
    target: { type: 'depth', minimum: 30, gearRequired: ['wetsuit_5mm', 'mask', 'fins'] },
    rewards: { gold: 80, xp: 250, recipes: ['wetsuit_7mm'] },
    dialogue: {
      start: "The deep water changes a man. Or a woman. Or whatever you are. Point is — put on your 5mm, check your mask, and go down past 30 blocks. Bring a light.",
      progress: "The water gets dark. You feel the cold through your suit. There's stuff down here that doesn't come up to the light.",
      complete: "You went deeper than most people ever will. Respect. The ocean doesn't let everyone come back.",
    },
    unlocks: ['the_longline'],
  },
  the_longline: {
    id: 'the_longline',
    name: 'The Longline',
    category: 'gear',
    icon: '🪝',
    tier: 3,
    description: 'Deploy a longline with 20+ hooks. Quantity over quality.',
    objective: 'Deploy a longline with at least 20 baited hooks and reel it in.',
    target: { type: 'deploy', gear: 'longline', hooks: 20 },
    rewards: { gold: 200, xp: 500, recipes: ['hydraulic_hooker'] },
    dialogue: {
      start: "Longlining's how the commercial guys do it. A groundline with 20-50 hooks, baited, soaking on the bottom. You'll catch everything — cod, rockfish, maybe a skate, probably a dogfish.",
      progress: "Setting the line... remember to bait every hook. Nothing worse than pulling 40 hooks and finding 5 empty ones because you got lazy.",
      complete: "That's a haul. Sort through the bycatch, keep what's legal, and throw back the rest. Welcome to longlining.",
    },
    unlocks: ['seine_team'],
  },
  seine_team: {
    id: 'seine_team',
    name: 'Seine Team',
    category: 'gear',
    icon: '🛥️',
    tier: 4,
    description: 'Participate in a purse seine operation. Industrial fishing.',
    objective: 'Help set a purse seine net and haul in a school of salmon.',
    target: { type: 'event', gear: 'purse_seine_net', crewRequired: 4 },
    rewards: { gold: 500, xp: 1000, recipes: ['trawl_net'] },
    dialogue: {
      start: "A seine boat needs a crew. You'll be on the power skiff, setting the net around the school. When the skipper yells 'BRING IT IN,' you pull. No questions.",
      progress: "The net's in the water... there's a school in there, I can see them on the sounder. Hundred fish easy.",
      complete: "THAT is commercial fishing. Net full of salmon, deckhands hip-deep in fish. It's brutal work but there's nothing like it.",
    },
  },

  // ── Story Quests ────────────────────────────────────────
  the_old_salt: {
    id: 'the_old_salt',
    name: 'The Old Salt',
    category: 'story',
    icon: '👴',
    tier: 2,
    description: 'An old Tlingit fisherman at the bar tells you about a legendary halibut hole. Find it.',
    objective: 'Talk to the old fisherman at the Sawmill Creek Bar, then locate the halibut hole.',
    target: { type: 'story', steps: ['talk_old_salt', 'find_location', 'catch_legendary'] },
    rewards: { gold: 150, xp: 400, items: ['braid_130lb'] },
    dialogue: {
      start: "\"You want to know where the big ones are?\" The old Tlingit man sets down his beer. His eyes are the color of the ocean on an overcast day. \"My grandfather showed me a place. West of the volcano. Where the bottom drops off into nothing. The halibut there... they've been waiting a long time.\"",
      step_talk_old_salt: "\"Go west until your sounder shows a wall. Drop your gear on the edge — not the top, not the bottom — the EDGE. That's where they hunt.\"",
      step_find_location: "You found it. The bottom drops from 200 feet to 600 feet in the length of a football field. Your fish finder is LIT with arches.",
      complete: "\"You found it.\" The old man grins. \"My grandfather would be proud. He caught a 400-pounder there in 1962. Didn't have a camera. Nobody believed him.\" You believe him now.",
    },
    unlocks: ['the_salmon_run'],
  },
  the_salmon_run: {
    id: 'the_salmon_run',
    name: 'The Salmon Run',
    category: 'story',
    icon: '🐟',
    tier: 2,
    description: 'Follow the salmon upriver to their spawning grounds. Witness the cycle.',
    objective: 'Travel up the Indian River, follow the salmon, reach the spawning grounds.',
    target: { type: 'story', steps: ['find_river', 'follow_salmon', 'reach_spawning', 'witness_cycle'] },
    rewards: { gold: 100, xp: 300, items: ['fly_rod'] },
    dialogue: {
      start: "Every summer, the salmon come home. Kings first, then sockeye, then pinks by the millions. They've been swimming for weeks — thousands of miles from the open ocean — to die in the same stream where they were born.",
      step_find_river: "The Indian River is choked with salmon. You can walk across on their backs — almost. The water's red with them.",
      step_follow_salmon: "They're scarred, battered, dying. But they won't stop. Nothing stops them. Not rapids, not bears, not exhaustion.",
      step_reach_spawning: "The spawning grounds. The males fight for territory. The females dig redds with their tails. The eggs are bright orange. Everything smells like life and death.",
      complete: "You watched the cycle. They'll die here, their bodies feeding the stream, feeding the insects, feeding the next generation of fry. Next year, their children will make this same journey. That's Alaska.",
    },
    unlocks: ['ghost_of_the_cannery'],
  },
  ghost_of_the_cannery: {
    id: 'ghost_of_the_cannery',
    name: 'Ghost of the Cannery',
    category: 'story',
    icon: '👻',
    tier: 3,
    description: 'Explore the abandoned cannery at night. What happened to the workers?',
    objective: 'Sneak into the old Thlinket Packing cannery after dark. Investigate the sounds.',
    target: { type: 'story', steps: ['enter_cannery', 'find_records', 'discover_truth'], timeRestriction: 'night' },
    rewards: { gold: 200, xp: 500, items: ['fillet_knife'] },
    dialogue: {
      start: "The old Thlinket Packing cannery's been abandoned since '58. Nobody goes there. Well — kids dare each other to. Some come back different. They say you can still hear the machinery running at night...",
      step_enter_cannery: "The door creaks. Inside, rusting machinery looms in the moonlight. And there IS a sound — a rhythmic clanking, like a conveyor belt that never stopped.",
      step_find_records: "In the manager's office, you find ledgers. Names, dates, catch weights. And a final entry: \"Last boat September 15th. Lost at sea. No survivors. Company closed.\"",
      complete: "It wasn't ghosts. It was the sound of the sea through broken windows, moving old machinery. But the sadness is real. The cannery processed 50 million pounds of salmon in its lifetime. Now it's just rust and silence.",
    },
  },
  volcano_edge: {
    id: 'volcano_edge',
    name: "Volcano's Edge",
    category: 'story',
    icon: '🌋',
    tier: 4,
    description: "Fish around Mount Edgecumbe during an eruption event. Legendary catches possible.",
    objective: 'Reach the waters near Mount Edgecumbe during an eruption. Catch something incredible.',
    target: { type: 'story', steps: ['see_eruption', 'reach_volcano', 'fish_eruption'], weatherRequired: 'eruption' },
    rewards: { gold: 500, xp: 1500, items: ['braid_200lb'] },
    dialogue: {
      start: "Mount Edgecumbe's smoking again. The old-timers say fish go CRAZY during eruptions — something about the minerals and heat. Also, you might die. But the fish...",
      step_see_eruption: "The volcano belches ash and steam. The water around it is discolored — greenish, like something bloomed. Your sounder shows fish EVERYWHERE.",
      step_fish_eruption: "The water's warm. Warm! In Alaska! Your hook hits the water and IMMEDIATELY something slams it. This is NOT a normal fish.",
      complete: "You caught something that shouldn't exist. Warm-water species, displaced by the eruption, confused and aggressive. The biologists will want to see this. Or maybe not. Some things are better left in the deep.",
    },
  },
  otters_gift: {
    id: 'otters_gift',
    name: "The Otter's Gift",
    category: 'story',
    icon: '🦦',
    tier: 2,
    description: 'Save an injured sea otter. It leads you to a secret fishing spot.',
    objective: 'Find and help an injured sea otter. Follow it to a hidden cove.',
    target: { type: 'story', steps: ['find_otter', 'help_otter', 'follow_otter', 'discover_cove'] },
    rewards: { gold: 80, xp: 350, unlocksSpot: 'otters_cove' },
    dialogue: {
      start: "There's a sea otter tangled in old fishing line near the breakwater. It's struggling. Most people would leave it — too dangerous, too much hassle. But you're not most people.",
      step_find_otter: "The otter's wrapped in monofilament, one flipper pinned. It watches you with dark, intelligent eyes. Not scared — hopeful.",
      step_help_otter: "You cut the line. The otter tests its flipper, looks at you once more, and dives. But then it surfaces, watching you, waiting.",
      step_follow_otter: "The otter leads you around the point to a cove you've never seen. The water's crystal clear, full of rockfish and greenling. Nobody knows about this place.",
      complete: "The otter bobs once, dives, and is gone. You cast your line and catch a trophy rockfish on the first try. Some gifts don't need wrapping paper.",
    },
  },
  crab_boat_dreams: {
    id: 'crab_boat_dreams',
    name: 'Crab Boat Dreams',
    category: 'story',
    icon: '🌊',
    tier: 5,
    description: "Work a shift on a king crab boat in the Bering Sea. Survive.",
    objective: 'Board the FV Northwestern, survive 24 hours of king crab fishing in heavy seas.',
    target: { type: 'story', steps: ['board_boat', 'set_pots', 'survive_storm', 'pull_pots'], riskLevel: 'extreme' },
    rewards: { gold: 1000, xp: 2000, items: ['king_crab_pot'] },
    dialogue: {
      start: "\"You want to crab the Bering?\" The captain squints at you. \"In February?\" He laughs. \"Fine. You'll work the pot launcher. It's simple — throw heavy steel pots into freezing water in 30-foot seas. What could go wrong?\"",
      step_board_boat: "The boat pitches. You grab a railing. The Bering Sea in winter is not a place — it's a test.",
      step_set_pots: "Eighty-pound pots, one after another. Your arms burn. Salt spray freezes on your face. The pot launcher clangs like a cannon.",
      step_survive_storm: "The radio screams: 'WEATHER WARNING — 60 KNOT WINDS, 25-FOOT SEAS.' The captain just nods. He's seen worse. You haven't.",
      complete: "You survived. The hold is full of king crab. Your hands are bleeding, you haven't slept, and you're pretty sure you cried once. But you survived. That's more than some can say.",
    },
    easterEgg: true,
  },
  deer_lake_mystery: {
    id: 'deer_lake_mystery',
    name: 'Deer Lake Mystery',
    category: 'story',
    icon: '🔍',
    tier: 3,
    description: 'Why do the salmon in Deer Lake grow so big? Dive in and find out.',
    objective: 'Investigate Deer Lake. Discover the reason for the oversized salmon.',
    target: { type: 'story', steps: ['visit_lake', 'observe_fish', 'dive_investigate', 'find_cause'] },
    rewards: { gold: 150, xp: 400, unlocksSpot: 'deer_lake_hotspot' },
    dialogue: {
      start: "Fishermen talk about Deer Lake. The salmon there are twice the size of normal — 40-pound kings where 20-pounders are typical. Nobody knows why. The biologists have theories. You have a mask and fins.",
      step_visit_lake: "Deer Lake is quiet, hemmed in by mountains. You see a salmon jump that's easily 40 pounds. It's wrong. It's beautiful.",
      step_dive_investigate: "Underwater, you find it. There's a thermal vent on the lake bottom — warm water seeping up, rich in minerals. The salmon feed here, growing fat year-round.",
      complete: "A volcanic hot spring, feeding the lake from below. The warm water keeps the salmon feeding through winter. It's not magic — it's geology. But it might as well be magic. These are the biggest freshwater salmon in Southeast Alaska.",
    },
  },
  the_tlingit_trap: {
    id: 'the_tlingit_trap',
    name: 'The Tlingit Trap',
    category: 'story',
    icon: '🪨',
    tier: 3,
    description: 'Find the ancient stone fish trap. It still works.',
    objective: 'Locate the ancient Tlingit fish trap near Old Sitka. Use it to catch salmon.',
    target: { type: 'story', steps: ['find_trap', 'restore_trap', 'catch_salmon'] },
    rewards: { gold: 120, xp: 350, items: ['beach_seine'] },
    dialogue: {
      start: "Before there were nets, before there were pots, the Tlingit people built stone traps. V-shaped walls of rock in the shallows — salmon swim in, can't swim out. There's supposed to be one near Old Sitka. If you can find it, it might still work.",
      step_find_trap: "At low tide, you see it — barely. Stones arranged in a V, partially buried in sediment. Hundreds of years old. The engineering is perfect — the opening faces the current.",
      step_restore_trap: "You clear some rocks, rebuild a section. The trap is functional again. You wait for the tide to come in.",
      complete: "The tide rises. Salmon pour through the opening, following the current straight into the V. When the tide turns, they're trapped. You pick salmon out of the shallows by hand. The old ways still work.",
    },
  },
  mist_cove_secret: {
    id: 'mist_cove_secret',
    name: 'Mist Cove Secret',
    category: 'story',
    icon: '🌫️',
    tier: 3,
    description: 'Only accessible in thick fog. What\'s out there?',
    objective: 'Navigate to Mist Cove during heavy fog. Discover what lies hidden.',
    target: { type: 'story', steps: ['enter_fog', 'navigate_blind', 'find_cove', 'discover_secret'], weatherRequired: 'fog' },
    rewards: { gold: 180, xp: 450, unlocksSpot: 'mist_cove' },
    dialogue: {
      start: "Mist Cove doesn't appear on charts. The old fishermen know about it — you can only find it in thick fog, when the GPS gets confused and you navigate by instinct. There's something there. Nobody talks about what.",
      step_enter_fog: "Visibility: zero. Your GPS flickers. The compass spins. You navigate by the sound of waves against rock.",
      step_find_cove: "The fog thins — just enough. You see a hidden cove, ringed by cliffs. The water is impossibly clear. And there are fish. ENORMOUS fish. Just... sitting there.",
      complete: "It's a thermal upwelling. Warm water rising from the deep, carrying nutrients. Fish congregate here to feed. In the fog, no one can find it. But now YOU know. And knowing is half the battle.",
    },
  },
  hatchery_heist: {
    id: 'hatchery_heist',
    name: 'Hatchery Heist',
    category: 'story',
    icon: '🕵️',
    tier: 3,
    description: "Someone's stealing salmon from the hatchery. Investigate.",
    objective: 'Investigate the Medvejie Hatchery. Find the thief. Confront them.',
    target: { type: 'story', steps: ['investigate_hatchery', 'find_clues', 'confront_thief', 'resolve'] },
    rewards: { gold: 200, xp: 500 },
    dialogue: {
      start: "The hatchery manager is frantic. They're losing hundreds of salmon every night — and it's not bears. The fence is intact, the holding pens are locked, but fish keep vanishing. Something's not right.",
      step_find_clues: "Boot prints in the mud. Commercial fishing net fibers on the fence. And a trail leading to the water...",
      step_confront_thief: "It's a guy from the other side of the island. Running an illegal net across the hatchery outflow pipe. He's desperate — lost his boat, can't afford gear, family to feed.",
      complete: "You don't turn him in. Instead, you talk to the hatchery manager. They agree to hire him — legitimate work, steady pay. Sometimes the best catch isn't a fish.",
    },
  },
  the_400_pounder: {
    id: 'the_400_pounder',
    name: 'The 400-Pounder',
    category: 'story',
    icon: '📸',
    tier: 4,
    description: "An old photo shows a 400lb halibut. Catch one bigger.",
    objective: 'Catch a halibut over 400 pounds.',
    target: { type: 'catch', species: 'halibut', minimumWeight: 400 },
    rewards: { gold: 2000, xp: 5000, title: 'Barn Door Slayer' },
    dialogue: {
      start: "There's a photo on the wall of the Sawmill Creek Bar. A man in rubber boots, grinning like he won the lottery, holding a halibut that's bigger than he is. The caption says '428 lbs, 1962.' The regulars say it's the biggest ever caught in Sitka waters. They're probably lying. Probably.",
      complete: "Four hundred and... you can barely lift it. The photo on the bar wall has competition now. Someone grabs a camera. Someone else grabs a beer. This is what it's all about.",
    },
  },
  seven_seas: {
    id: 'seven_seas',
    name: 'Seven Seas',
    category: 'story',
    icon: '🐢',
    tier: 5,
    description: 'Find all 7 species of sea turtle that occasionally visit Southeast Alaska waters.',
    objective: 'Encounter and document all 7 sea turtle species.',
    target: { type: 'collection', species: ['loggerhead', 'green', 'leatherback', 'hawksbill', 'kemp_ridley', 'olive_ridley', 'flatback'], count: 7 },
    rewards: { gold: 5000, xp: 10000, title: 'Chelonian Scholar', easterEgg: true },
    dialogue: {
      start: "Sea turtles in Alaska? Don't be ridiculous... except they DO show up occasionally, carried by warm currents. Seven species have been documented in Southeast Alaska waters. Finding all seven would be... unprecedented.",
      complete: "You found them all. Seven sea turtles in Alaskan waters. Marine biologists are going to have a field day with your documentation. You're not a fisherman anymore — you're a legend.",
    },
    easterEgg: true,
  },

  // ── Skill Quests ────────────────────────────────────────
  one_of_each: {
    id: 'one_of_each',
    name: 'One of Each',
    category: 'skill',
    icon: '🐟',
    tier: 3,
    description: 'Catch every species of salmon in a single day.',
    objective: 'Catch king, coho, pink, chum, and sockeye salmon within 24 hours.',
    target: { type: 'collection', species: ['king_salmon', 'coho_salmon', 'pink_salmon', 'chum_salmon', 'sockeye_salmon'], timeLimit: 86400000 },
    rewards: { gold: 300, xp: 800, title: 'Salmon Grand Slam' },
    dialogue: {
      start: "The salmon grand slam. Five species in one day. Kings in the deep, coho behind the kelp, pinks on the beach, chum in the estuary, sockeye in the river. You'll need to move fast.",
      complete: "Five salmon species. One day. You just completed a feat that most Alaskan fishermen spend a lifetime trying for. That's not fishing — that's art.",
    },
  },
  the_bottom: {
    id: 'the_bottom',
    name: 'The Bottom',
    category: 'skill',
    icon: '🕳️',
    tier: 3,
    description: 'Catch something from every depth zone.',
    objective: 'Catch fish at surface (0-30), mid (30-100), deep (100-300), and trench (300+) zones.',
    target: { type: 'achievement', zones: ['surface', 'mid', 'deep', 'trench'] },
    rewards: { gold: 200, xp: 600, items: ['braid_130lb'] },
    dialogue: {
      start: "The ocean's not one place — it's four. Surface, midwater, deep, and the trench. Different fish live at each depth. Catch something from all four and you'll understand the sea like few do.",
      complete: "Surface to trench and back. You've fished every layer of the ocean. Most people only ever see the top thirty feet. You've seen it all.",
    },
  },
  weather_worker: {
    id: 'weather_worker',
    name: 'Weather Worker',
    category: 'skill',
    icon: '⛈️',
    tier: 3,
    description: 'Successfully fish in every weather type.',
    objective: 'Catch a fish in clear, rain, storm, fog, and snow conditions.',
    target: { type: 'achievement', weatherTypes: ['clear', 'rain', 'storm', 'fog', 'snow'] },
    rewards: { gold: 250, xp: 700, title: 'Storm Chaser' },
    dialogue: {
      start: "Fair-weather fishermen stay home when it blows. Real fishermen fish in anything. Rain, snow, fog, 20-foot seas — the fish don't care about the weather. Neither should you.",
      complete: "You've fished through it all. Rain, snow, fog, and storms. The fish bit in every condition. You don't wait for good weather — you MAKE it good weather.",
    },
  },
  lingcod_lord: {
    id: 'lingcod_lord',
    name: 'Lingcod Lord',
    category: 'skill',
    icon: '🐲',
    tier: 4,
    description: 'Catch a 50lb+ lingcod on a dinglebar.',
    objective: 'Catch a lingcod over 50 pounds using a dinglebar hook.',
    target: { type: 'catch', species: 'lingcod', minimumWeight: 50, gearRequired: ['dinglebar_hook'] },
    rewards: { gold: 400, xp: 1200, title: 'Lingcod Lord' },
    dialogue: {
      start: "A 50-pound lingcod is a MONSTER. They're aggressive, they're ugly, and they'll eat anything that fits in their mouth — including your other fish. Dinglebar only. No cowards.",
      complete: "FIFTY POUNDS. That lingcod's got teeth like a dinosaur and an attitude to match. You earned that title. Lingcod Lord. Wear it proud.",
    },
  },
  halibut_hunter: {
    id: 'halibut_hunter',
    name: 'Halibut Hunter',
    category: 'skill',
    icon: '🐟',
    tier: 4,
    description: 'Catch a "barn door" halibut — 100 pounds or more.',
    objective: 'Catch a halibut over 100 pounds.',
    target: { type: 'catch', species: 'halibut', minimumWeight: 100 },
    rewards: { gold: 500, xp: 1500, title: 'Barn Door Hunter' },
    dialogue: {
      start: "A hundred-pound halibut is called a 'barn door' because that's about how big they are. Catching one requires the right gear, the right spot, and about 30 minutes of pure suffering as you crank it up from 300 feet.",
      complete: "BARN DOOR. You just hauled a fish the size of a coffee table off the ocean floor. Your arms are shaking, your back is screaming, and you're grinning like an idiot. That's halibut fishing.",
    },
  },
  crab_pot_millionaire: {
    id: 'crab_pot_millionaire',
    name: 'Crab Pot Millionaire',
    category: 'skill',
    icon: '💰',
    tier: 4,
    description: 'Earn 10,000 gold from crab pots alone.',
    objective: 'Accumulate 10,000 gold earnings exclusively from crab pot catches.',
    target: { type: 'earnings', method: 'crab_pots', amount: 10000 },
    rewards: { gold: 1000, xp: 2000, items: ['king_crab_pot'], title: 'Crab Baron' },
    dialogue: {
      start: "Ten thousand gold from crab pots. That's a lot of Dungeness. Or a few king crab, if you're lucky. Either way, it's a grind. Soak pots, pull pots, count crabs, repeat.",
      complete: "You did it. Ten grand from crab pots alone. You're not a fisherman anymore — you're a crab baron. Old Pete's going to need a bigger cash register.",
    },
  },
  the_artisan: {
    id: 'the_artisan',
    name: 'The Artisan',
    category: 'skill',
    icon: '🔨',
    tier: 5,
    description: 'Craft every tier of gear at least once.',
    objective: 'Craft at least one item from each of the 5 crafting tiers.',
    target: { type: 'achievement', tiers: [1, 2, 3, 4, 5] },
    rewards: { gold: 500, xp: 2000, title: 'Master Artisan' },
    dialogue: {
      start: "From iron hooks to legendary harpoons — craft one item from every tier. It's not about the gear. It's about knowing the craft. Understanding what goes into every piece.",
      complete: "You've worked every material, every workstation, every tier. From a simple circle hook to gear most fishermen will never see. You're not just a fisherman — you're a craftsman.",
    },
  },
};

// ─── Quest System ─────────────────────────────────────────────────────

export class QuestSystem {
  constructor() {
    this.active = new Map();     // questId -> { progress, startedAt }
    this.completed = new Set();  // completed quest IDs
    this.available = new Set();  // available quest IDs
    this.discovered = new Set(); // quest IDs the player knows about
    this.available.add('first_cast'); // starter quest
    this.discovered.add('first_cast');
  }

  /** Get quest data */
  getQuest(questId) {
    return QUESTS[questId] ?? null;
  }

  /** Get all known quests */
  getAllQuests() {
    return Object.values(QUESTS).filter(q => this.discovered.has(q.id));
  }

  /** Get available quests */
  getAvailableQuests() {
    return Object.values(QUESTS).filter(q => this.available.has(q.id) && !this.completed.has(q.id));
  }

  /** Get active quests */
  getActiveQuests() {
    return [...this.active.entries()].map(([id, state]) => ({
      ...QUESTS[id],
      progress: state.progress,
      startedAt: state.startedAt,
    }));
  }

  /** Discover a new quest */
  discoverQuest(questId) {
    if (!QUESTS[questId]) return false;
    this.discovered.add(questId);
    // Check prerequisites
    if (this._canAccept(questId)) {
      this.available.add(questId);
    }
    return true;
  }

  /** Check if a quest can be accepted */
  _canAccept(questId) {
    const quest = QUESTS[questId];
    if (!quest) return false;
    // Check unlocks from completed quests
    for (const completedId of this.completed) {
      if (QUESTS[completedId]?.unlocks?.includes(questId)) return true;
    }
    // Quests with no prerequisites
    if (!QUESTS[questId].unlocks || QUESTS[questId].tier <= 1) return true;
    return false;
  }

  /** Accept a quest */
  accept(questId) {
    if (!this.available.has(questId)) throw new Error(`Quest "${questId}" is not available.`);
    if (this.active.has(questId)) throw new Error('Quest already active.');
    if (this.completed.has(questId)) throw new Error('Quest already completed.');

    this.active.set(questId, {
      progress: 0,
      startedAt: Date.now(),
      currentStep: 0,
    });
    return QUESTS[questId];
  }

  /** Update quest progress */
  updateProgress(questId, progress) {
    const state = this.active.get(questId);
    if (!state) return false;
    state.progress = progress;
    return true;
  }

  /** Complete a quest */
  complete(questId) {
    const quest = QUESTS[questId];
    const state = this.active.get(questId);
    if (!quest || !state) throw new Error('Cannot complete this quest.');

    this.active.delete(questId);
    this.completed.add(questId);

    // Unlock next quests
    if (quest.unlocks) {
      for (const nextId of quest.unlocks) {
        if (QUESTS[nextId]) {
          this.discoverQuest(nextId);
        }
      }
    }

    return {
      quest,
      rewards: quest.rewards,
      dialogue: quest.dialogue?.complete ?? 'Quest complete!',
    };
  }

  /** Get completion summary */
  getSummary() {
    const total = this.discovered.size;
    const completed = this.completed.size;
    const active = this.active.size;
    const available = this.available.size - completed;

    const byCategory = {};
    for (const catId of Object.keys(QUEST_CATEGORIES)) {
      byCategory[catId] = {
        ...QUEST_CATEGORIES[catId],
        total: [...this.discovered].filter(id => QUESTS[id]?.category === catId).length,
        completed: [...this.completed].filter(id => QUESTS[id]?.category === catId).length,
      };
    }

    return {
      total,
      completed,
      active,
      available,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
    };
  }
}

export { QUESTS };
export default QuestSystem;
