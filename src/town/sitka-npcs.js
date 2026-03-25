// CraftMind Fishing — Sitka NPCs
// The people of Sitka. Grizzled old fishermen, Tlingit elders, tourists, kids, captains.

export const NPCS = {
  ernie: {
    id: 'ernie',
    name: 'Ernie',
    fullName: 'Ernie Lindquist',
    age: 70,
    personality: 'grizzled_old_salt',
    location: { building: 'ernies_old_time_saloon', street: 'Lincoln' },
    description: 'Seventy years old and still tending bar. Ernie fished Sitka Sound for forty years before his knees gave out. Now he pours drinks and tells stories. He knows every fisherman who ever docked at Eliason Harbor, and he remembers what they caught.',
    greeting: [
      "Well, look who walked in. What'll it be? Beer's cold, stories are free.",
      "You again? Good. I was just about to tell this story about the time we found a 300-pound halibut in the net...",
      "Pull up a stool, kid. You look like you could use some wisdom with that beer.",
      "Sit down. The fish are biting somewhere, and I know where. But first, you buy the drinks.",
    ],
    dialogue: {
      weather: [
        "Barometer's dropping. Fish'll go deep. Tomorrow's a stay-in day.",
        "See that wind from the south? That means rain by afternoon. Always does.",
        "Perfect halibut weather. Overcast, flat calm. Get out there.",
      ],
      fishing_tips: [
        "Halibut like the change — drop your bait right where the depth goes from 60 to 120 feet. That ledge.",
        "Coho are hitting hoochies in purple and black. Don't ask me why, they just are.",
        "The kings are late this year. Two weeks behind, I'd say. Fish the kelp line anyway.",
        "Tide's running hard — fish the eddies. That's where the bait balls get pushed.",
      ],
      rumors: [
        "Heard Captain Pete marked a school of big halibut out near the Cape. But he's not sharing the numbers.",
        "ADF&G might open the chinook sport fishery early. Keep your ear to the radio.",
        "Some kid caught a 50-pound king from the shore last week. Indian River, of all places.",
        "The seiner fleet is heading west. They must know something about the herring.",
      ],
      old_days: [
        "Back in '85, we didn't have all these electronics. Just a compass, a depth sounder, and a gut feeling. And we caught MORE fish.",
        "I remember when you could walk the docks and buy halibut for two bucks a pound. Those days are gone.",
        "The old cannery used to run 24 hours during salmon season. Whole town smelled like fish. We loved it.",
      ],
      stories: [
        "Let me tell you about the time a whale surfaced right next to my boat. Scared me so bad I dropped my sandwich in the drink.",
        "My buddy Carl once caught a halibut so big it wouldn't fit through the hatch. Had to gut it on deck. Took four hours.",
        "Worst storm I ever saw? '98. Thirty-foot seas in Sitka Sound. I honestly thought that was it.",
      ],
    },
    questGiver: true,
    quests: ['the_400_pounder', 'ernies_special_order'],
    schedule: {
      '06:00-10:00': { location: 'home', activity: 'sleeping', dialogue: "Shhh. Come back after noon." },
      '10:00-12:00': { location: 'market_center', activity: 'shopping', dialogue: "Just getting groceries. You know, the essentials. Beer, coffee, more beer." },
      '12:00-14:00': { location: 'harbor', activity: 'checking_boats', dialogue: "Like to walk the docks. See who's in, who's out. Keeps me connected." },
      '15:00-24:00': { location: 'ernies_old_time_saloon', activity: 'bartending', dialogue: null },
    },
    relationships: {
      linda: 'old friend — she sells the gear, I recommend it',
      captain_pete: 'friendly rival — we argue about fishing spots over beers',
      mary: 'respects her authority — she runs a clean harbor',
      old_thomas: 'deep respect — that man knows things I never will',
      captain_sig: "laughing stock — crazy SOB, but I'd buy him a drink any day",
    },
  },

  linda: {
    id: 'linda',
    name: 'Linda',
    fullName: 'Linda Kowalski',
    age: 52,
    personality: 'knowledgeable_helpful',
    location: { building: 'lfs_marine_supplies', street: 'Katlian' },
    description: "Linda has worked at LFS Marine for twenty-three years. She can find any piece of gear in the store blindfolded. Her advice is better than any fishing magazine. She\'s patient with beginners and doesn\'t upsell — she\'ll talk you out of expensive gear if you don\'t need it.",
    greeting: [
      "Hi! What are you fishing for? I'll get you set up right.",
      "Back again? Let me guess — you need more leader material. You always need more leader material.",
      "Welcome to LFS! If I don't have it, you probably don't need it.",
      "Good morning! Tide charts just came in — free for customers. Let me show you the new gear that came in on the barge.",
    ],
    dialogue: {
      gear_advice: [
        "For halibut, you want a circle hook and braided line. Don't cheap out on the leader — a big halibut will bite through anything under 200-pound test.",
        "That rod's too stiff for salmon trolling. You want something with some flex, especially for coho.",
        "Ditch the swivels. Tie direct with a loop knot. Less hardware means fewer tangles and less visibility.",
        "Replace your line at the start of every season. UV light degrades it. You can't see the damage, but the fish feel it.",
        "For rockfish, use a two-hook rig with shrimp flies. Pink and white. They'll hit it every time.",
      ],
      knots: [
        "Let me show you the Palomar knot. It's the strongest knot for braided line, and it's easy to tie. Hold still...",
        "Everyone thinks the surgeon's loop is the same as a Bimini twist. It's not. But it's good enough for what you're doing.",
      ],
      store: [
        "The barge comes in on Thursdays. If you need something special, order it by Monday.",
        "We're out of 16-ounce jig heads again. Halibut season, you know. Everyone's buying them.",
        "That new Shimano reel is nice, but for the price you could buy two Penn Internationals and have change left for bait.",
      ],
    },
    questGiver: true,
    quests: ['the_right_tool', 'lindas_special_order'],
    schedule: {
      '06:00-07:00': { location: 'home', activity: 'getting_ready', dialogue: "Just getting my coffee. Store opens at seven." },
      '07:00-18:00': { location: 'lfs_marine_supplies', activity: 'working', dialogue: null },
      '18:00-19:00': { location: 'market_center', activity: 'shopping', dialogue: "Picking up dinner. Long day at the store." },
      '19:00-22:00': { location: 'home', activity: 'relaxing', dialogue: "Quiet evening. Reorganizing my tackle box. Don't judge." },
    },
    relationships: {
      ernie: 'customer and friend — he sends people my way',
      captain_pete: "good customer — always buying replacement gear because he's rough on stuff",
      mary: 'neighbor — we carpool sometimes in winter',
    },
  },

  captain_pete: {
    id: 'captain_pete',
    name: 'Captain Pete',
    fullName: 'Petrov "Pete" Nikolaev',
    age: 45,
    personality: 'competitive_stubborn',
    location: { building: 'ernies_old_time_saloon', street: 'Lincoln' },
    secondaryLocation: { building: 'eliason_harbor', street: 'Harbor' },
    description: 'Active longline fisherman. Has a 42-foot fiberglass boat, the FV Halibut Hunter, at slip E-14 in Eliason Harbor. Competitive — will race you to a fishing spot and laugh about it later. Knows the best halibut grounds but shares reluctantly.',
    greeting: [
      "You again. Still trying to catch fish? Let me know when you actually land something bigger than a sculpin.",
      "Heard you went out to the Cape yesterday. I was there last week. Should've listened to me.",
      "My boat's at E-14 if you need me. Or just find me at Ernie's. Either way.",
      "The fish are biting. But I'm not telling you where. Figure it out yourself.",
    ],
    dialogue: {
      halibut: [
        "Halibut are on the 200-foot ledge this time of year. That's all I'm saying.",
        "Circle hooks. Always circle hooks. J-hooks gut-hook everything and you can't release them.",
        "Big halibut are lazy. They don't want to chase food. Put the bait right on the bottom and wait.",
      ],
      rivalry: [
        "I caught a 180-pounder last Tuesday. What did you catch? A cold?",
        "You know what separates a fisherman from a guy who owns a boat? Patience. And tackle. But mostly patience.",
        "Fine, I'll tell you one thing. The Pinnacles. That's where the big ones live. Don't tell anyone.",
      ],
      boat: [
        "The Halibut Hunter's a good boat. 42 feet of fiberglass and diesel. Gets me out there when the charter boats stay home.",
        "Had to replace the winch motor last month. Cost me two grand. Fishing ain't cheap.",
      ],
    },
    questGiver: true,
    quests: ['the_longliners_secret', 'race_to_the_reef'],
    schedule: {
      '04:00-05:00': { location: 'home', activity: 'getting_ready', dialogue: "Early start. The fish don't sleep in." },
      '05:00-15:00': { location: 'eliason_harbor', activity: 'fishing', dialogue: "Out on the water. Try the radio if you need me." },
      '15:00-16:00': { location: 'eliason_harbor', activity: 'cleaning_fish', dialogue: "Gutting and icing. The fun part is over." },
      '16:00-22:00': { location: 'ernies_old_time_saloon', activity: 'drinking', dialogue: null },
    },
    isRival: true,
    relationships: {
      ernie: "drinking buddy — he's like a father figure, annoying as that sounds",
      linda: 'reliable — she keeps my boat running',
      captain_sig: 'nutjob — that man has a death wish on the Bering Sea',
    },
  },

  mary: {
    id: 'mary',
    name: 'Mary',
    fullName: 'Mary Nakashita',
    age: 48,
    personality: 'official_but_friendly',
    location: { building: 'harbormaster', street: 'Katlian' },
    description: 'The harbormaster. Runs the harbor like a small city — because it basically is. Issues moorage permits, assigns slips, enforces harbor rules. Can be stern but is genuinely helpful. Knows every boat by name and every captain by reputation.',
    greeting: [
      "Welcome to Sitka Harbor. Do you need a moorage permit or are you just visiting?",
      "Good morning. Coffee's hot, permits are ready. What do you need?",
      "Your boat — is it registered? We had some issues with unregistered vessels last month.",
      "Harbor rules are posted on the board. Read them. I enforce them.",
    ],
    dialogue: {
      harbor: [
        "Eliason is full through September. I might have a spot at Crescent if your boat is under 30 feet.",
        "Moorage is $4.50 per foot per month. Pay on time or I'll tow you. Not kidding.",
        "Somebody left their garbage on the dock again. If I find out who, it's a $250 fine.",
      ],
      announcements: [
        "ADF&G just issued an emergency order — chinook retention closed in the terminal harvest area starting tomorrow.",
        "Weather advisory: small craft advisory through Thursday. Gale force winds expected in the afternoon.",
        "The Coast Guard is doing a safety inspection sweep next week. Make sure you have all your gear.",
      ],
      fishing: [
        "The seiner fleet took 3 million pounds of herring last week. The biomass is looking strong this year.",
        "Sport fishing report: halibut are hitting at the Cape. Coho are thick at the kelp line.",
      ],
    },
    questGiver: true,
    quests: ['moorage_wars', 'harbor_cleanup'],
    schedule: {
      '07:00-08:00': { location: 'harbor', activity: 'morning_walkthrough', dialogue: "Morning harbor walk. Checking docks, looking for problems." },
      '08:00-17:00': { location: 'harbormaster', activity: 'working', dialogue: null },
      '17:00-18:00': { location: 'harbor', activity: 'evening_check', dialogue: "Evening rounds. Making sure everyone's secure." },
      '18:00-22:00': { location: 'home', activity: 'off_duty', dialogue: "Off the clock. If it's not sinking, call me tomorrow." },
    },
    relationships: {
      ernie: 'respects — he knows this harbor better than anyone alive',
      linda: 'friend — we carpool in winter',
      captain_pete: 'keeps an eye on — he pushes the limits sometimes',
    },
  },

  old_thomas: {
    id: 'old_thomas',
    name: 'Old Thomas',
    fullName: 'Thomas Yaaw Teikéin',
    age: 82,
    personality: 'wise_mysterious',
    location: { building: 'st_michaels_cathedral', street: 'Lincoln' },
    description: "Tlingit elder. Sits on a bench near St. Michael\'s Cathedral most afternoons, watching the harbor. Speaks softly, in a mix of English and Lingít. Knows things about this place that go back thousands of years. Teaches anyone who listens.",
    greeting: [
      "Yak'ei yatee. You have come to listen? Or just to sit? Both are good.",
      "Lingít Aaní — this is our land. The fish have been here longer than the people. Show them respect.",
      "Sit down, young one. The tide goes out, the tide comes in. Like everything.",
      "You fish with metal and plastic. My grandfather fished with cedar and bone. We both caught salmon.",
    ],
    dialogue: {
      tlingit: [
        "Yak'ei yatee — hello, how are you?",
        "Gunalschéesh — thank you.",
        "Haa Atx̱’i Yoo X̱’atángi — our language, the Tlingit language.",
        "Shuká Haa Sání — the one who looked ahead, the ancestor who prepared the way.",
      ],
      fishing_wisdom: [
        "The salmon know this river. They were born here, they will die here. You are just a visitor at their party.",
        "My grandfather said: never take more than you need, and never take the first fish you see. The first is a scout.",
        "The stone fish trap at the mouth of the river — that is how we fished for a thousand years. No hooks. No line. Just stone and patience.",
        "When the eagles fish in the morning, the salmon are near the surface. When the eagles sit in the trees, the salmon are deep.",
      ],
      subsistence: [
        "Subsistence isn't a hobby. It's how we live. It's putting up fish for the winter. It's sharing with Elders who can't fish anymore.",
        "A good fisherman respects the whole cycle. Catch, clean, smoke, share. You miss a step, you break the cycle.",
        "The herring spawn — that is the most important event of the year. Everything eats herring. Everything.",
      ],
      history: [
        "The Russians came and built that cathedral. They thought they owned this place. The land remembers differently.",
        "Before the Russians, before the Americans — we were here. Ten thousand years of fishing. At least.",
        "My grandfather saw the last of the old ways. Fish traps, cedar canoes, potlatch. He tried to teach me. I'm trying to teach you.",
      ],
    },
    questGiver: true,
    quests: ['the_tlingit_trap', 'subsistence_fishing', 'the_old_ways'],
    schedule: {
      '08:00-12:00': { location: 'home', activity: 'morning_rituals', dialogue: "Morning prayer and coffee. I am old. I take my time." },
      '12:00-17:00': { location: 'st_michaels_cathedral', activity: 'sitting_bench', dialogue: null },
      '17:00-18:00': { location: 'harbor', activity: 'watching_water', dialogue: "Watching the water. Reading it. It has things to say." },
      '18:00-21:00': { location: 'home', activity: 'evening', dialogue: "Rest now. Come back tomorrow." },
    },
    relationships: {
      ernie: 'mutual respect — different generations, same love for this place',
      sarah: 'respects her science — it confirms what we always knew',
    },
  },

  sarah: {
    id: 'sarah',
    name: 'Sarah',
    fullName: 'Dr. Sarah Chen',
    age: 34,
    personality: 'enthusiastic_educator',
    location: { building: 'adfg_office', street: 'Katlian' },
    description: "ADF&G fisheries biologist. Young, energetic, genuinely loves her job. Explains regulations without being boring — she\'ll tell you WHY a rule exists, not just what it is. Does salmon tagging research on the side.",
    greeting: [
      "Hey! Welcome to the office. Want to hear about salmon? I always want to talk about salmon.",
      "Did you know that a chinook salmon can travel over 2,000 miles to return to the stream where it was born? That's not a metaphor. That's science.",
      "Come in! Check the regulation board — it updates every week. Actually, come look at this salmon scale under the microscope. It's beautiful.",
    ],
    dialogue: {
      species: [
        "Chinook — king salmon. Biggest, longest-lived (up to 7 years), most prized. They're the ones we protect the hardest.",
        "Coho — silver salmon. Aggressive biters, fun to catch, great on the grill. The fishermen's favorite.",
        "Sockeye — red salmon. The commercial powerhouse. They don't bite lures — that's why gillnets work on them.",
        "Pink — humpies. Two-year life cycle. Billions of them, every odd year. They're not glamorous but they feed everything.",
        "Chum — dog salmon. Underrated. They run deep, they're strong, and they're crucial for the ecosystem.",
      ],
      regulations: [
        "The chinook sport fishery is managed by abundance. When the run is strong, we open it. When it's weak, we close it. It's not about politics — it's about counting fish.",
        "Retention of non-pelagic rockfish is limited because they grow slowly and don't reproduce quickly. A yelloweye might be 80 years old.",
        "Halibut has a slot limit in some areas. You can't keep fish over 82 inches — those are the breeding females.",
        "Emergency orders happen when we get new data. Check the ADF&G website or listen on Channel 16 before you go out.",
      ],
      conservation: [
        "If you practice catch and release, use circle hooks. The mortality rate drops from 30% to under 5%.",
        "Escapement — that's the number of salmon that get past the fishery to spawn. We count them. We manage to them. It's the whole system.",
        "The herring spawn is the foundation. Without it, everything collapses. Seabirds, whales, seals, salmon — they all depend on those eggs.",
      ],
      research: [
        "We tag salmon with PIT tags — Passive Integrated Transponders. When a tagged fish swims past a detector, we know exactly where it went.",
        "The otolith — that's the inner ear bone of a fish — grows rings like a tree. Cut it open and you can read its whole life story.",
      ],
    },
    questGiver: true,
    quests: ['tag_and_release', 'salmon_survey', 'the_science_of_fishing'],
    schedule: {
      '07:00-08:00': { location: 'home', activity: 'morning_run', dialogue: "Running before work. Keeps the brain sharp." },
      '08:00-17:00': { location: 'adfg_office', activity: 'working', dialogue: null },
      '17:00-19:00': { location: 'harbor', activity: 'fieldwork', dialogue: "Checking the fish weir. Want to come?" },
      '19:00-22:00': { location: 'ernies_old_time_saloon', activity: 'unwinding', dialogue: "Evening beer with Ernie. He tells me things the data can't." },
    },
    relationships: {
      ernie: 'appreciates — his observations match my data surprisingly well',
      old_thomas: 'learning from — his traditional knowledge is valid science',
      mary: 'professional respect — we work together on regulations',
    },
  },

  dave: {
    id: 'dave',
    name: 'Dave',
    fullName: 'Dave Martinez',
    age: 38,
    personality: 'fun_teacher',
    location: { building: 'sitka_high_school', street: 'Lake' },
    description: "Science teacher at Sitka High. The kind of teacher who takes his class to the harbor for biology lessons. References fishing in every lecture. The kids love him because he\'s actually from here and not some transplant.",
    greeting: [
      "Hey! Did you finish your math homework? Or were you out fishing again?",
      "If you spent half as much time on your essays as you do checking the tides, you'd be valedictorian.",
      "Good morning! Remember, the salmon lifecycle quiz is Friday. No, you can't use your fishing log as a cheat sheet. Nice try.",
      "You look like you haven't slept. Late night on the boat? I won't tell the principal.",
    ],
    dialogue: {
      school: [
        "The science fair is coming up. You know what would be cool? A project on tidal effects on fish behavior. Just saying.",
        "Sitka High Wolves — we might not have a football team, but we've got the best fishing team in the state. That's not a joke.",
        "Half my class is out fishing during coho season. Can't really blame them, but they gotta make up the work.",
      ],
      biology: [
        "Okay class, today we're learning about osmoregulation. That's how salmon switch between freshwater and saltwater. Yes, this is on the test.",
        "The nitrogen cycle, the carbon cycle, the salmon cycle — they're all connected. Remove the salmon and the forest suffers. Seriously.",
      ],
      fishing: [
        "I caught my first king salmon when I was twelve. Right off the dock at Crescent Harbor. My mom made me clean it myself.",
        "Take a kid fishing. That's all I'm saying. It'll change their life. It changed mine.",
      ],
    },
    questGiver: true,
    quests: ['biology_field_trip', 'the_science_fair'],
    schedule: {
      '06:30-07:30': { location: 'home', activity: 'getting_ready', dialogue: "Coffee and grading papers. The glamorous life of a teacher." },
      '08:00-15:00': { location: 'sitka_high_school', activity: 'teaching', dialogue: null },
      '15:00-16:30': { location: 'harbor', activity: 'after_school_fishing', dialogue: "Casting from the dock. Therapy." },
      '16:30-22:00': { location: 'home', activity: 'grading', dialogue: "More papers to grade. Send help. Or coffee. Coffee works." },
    },
    relationships: {
      ernie: "old friend — Ernie was his science teacher's favorite drinking buddy",
      sarah: 'collaborates — she does guest lectures in his classes',
    },
  },

  captain_sig: {
    id: 'captain_sig',
    name: 'Captain Sig',
    fullName: 'Sigurd "Sig" Johansen',
    age: 55,
    personality: 'gruff_intense',
    location: { building: 'pioneer_bar', street: 'Katlian' },
    description: "King crab boat captain. Spends winters in the Bering Sea and summers hiding from reality at the Pioneer Bar. Has stories that would curl your hair. Lost two crew members over the years and doesn\'t talk about it. Smokes too much and drinks too much, but he\'s the best captain who ever threw pots.",
    greeting: [
      "Buy me a drink or leave me alone. Your choice.",
      "The Bering Sea is a liar. It looks calm, then it tries to kill you. Sound like anyone you know?",
      "You want crab stories? Sit down. This'll take a while.",
      "I've got a boat that needs a deckhand who doesn't complain. You interested? Didn't think so.",
    ],
    dialogue: {
      bering_sea: [
        "Sixty-foot seas. Negative twenty wind chill. That's not fishing — that's survival. And we do it for crab.",
        "Opilio season is the worst. It's dark all day, the ice builds up on the superstructure, and the pots weigh 800 pounds. With crab.",
        "I lost my best friend on the Bering Sea. He went overboard in a storm. We never found him. That's the price.",
      ],
      crab: [
        "King crab is the gold rush of Alaska. A good season, a boat can make a million dollars in two months. Bad season? You lose the boat.",
        "Red king crab is the money. Blue king is the treasure. Nobody catches blue anymore — they're too deep.",
        "You don't fish for crab. You throw steel into the dark and hope something climbs in. It's not elegant. It works.",
      ],
      advice: [
        "You want to be a fisherman? Be a salmon fisherman. Salmon won't kill you.",
        "The ocean doesn't care about your plans. The ocean doesn't care about you at all. Remember that, and you'll be fine.",
        "I've been doing this for thirty years. The only thing I know for sure is that I don't know anything for sure.",
      ],
    },
    questGiver: true,
    quests: ['crab_boat_dreams', 'the_bering_sea_call'],
    schedule: {
      '00:00-12:00': { location: 'home', activity: 'sleeping', dialogue: "Go away. I'm either sleeping or hung over. Possibly both." },
      '12:00-15:00': { location: 'harbor', activity: 'checking_boat', dialogue: "The boat's in dry dock. Hull work. What do you want?" },
      '15:00-01:00': { location: 'pioneer_bar', activity: 'drinking', dialogue: null },
    },
    relationships: {
      ernie: "respects — Ernie's the real deal, even if he's just a bartender now",
      captain_pete: `dismisses — "Longline fishing? That's practically recreational."`,
    },
  },

  jenna: {
    id: 'jenna',
    name: 'Jenna',
    fullName: 'Jenna Kake',  // Kake is a Tlingit community
    age: 27,
    personality: 'tough_independent',
    location: { building: 'eliason_harbor', street: 'Harbor' },
    secondaryLocation: { building: 'ernies_old_time_saloon', street: 'Lincoln' },
    description: 'Sea cucumber diver. Young, tough, and independent. Dives the tidal flats for sea cucumbers and geoducks. Wears a drysuit in 38-degree water and thinks nothing of it. One of the few women in the dive fishery and she earned every bit of respect she gets.',
    greeting: [
      "What, you've never seen a girl in a drysuit before? Move along.",
      "I dive for a living. In Sitka Sound. In February. What do YOU do?",
      "The tidal flats are good today. Low tide at 2:47pm. Mark your tide chart.",
      "You want to learn to dive? It's cold, dark, and the current will kill you. Other than that, it's great.",
    ],
    dialogue: {
      diving: [
        "Sea cucumbers are at 20-60 feet on rocky substrate. Feel around under the kelp. They feel like wet sandbags.",
        "Geoducks — that's the real money. Three feet deep in the mud. You gotta dig by hand. In zero visibility. Good luck.",
        "The viz is about four feet today. Welcome to Southeast Alaska underwater.",
        "Dry gloves. Get dry gloves. Cold hands cost you the dive and the catch.",
      ],
      independence: [
        "Everyone told me a woman couldn't make it in the dive fishery. Everyone was wrong.",
        "I bought my own boat. My own gear. My own permit. Nobody gave me anything.",
        "The guys at the dock gave me a hard time for two years. Then I out-dived them. Now they just nod.",
      ],
    },
    questGiver: true,
    quests: ['the_deep_dig', 'jennas_secret_spot'],
    schedule: {
      '06:00-08:00': { location: 'harbor', activity: 'gear_prep', dialogue: "Checking my tanks, cleaning my mask. Standard morning." },
      '08:00-14:00': { location: 'tidal_flats', activity: 'diving', dialogue: "In the water. Can't hear you. Literally." },
      '14:00-15:00': { location: 'harbor', activity: 'processing', dialogue: "Cleaning and icing the catch. Sea cucumbers go to the buyer." },
      '15:00-18:00': { location: 'ernies_old_time_saloon', activity: 'warming_up', dialogue: null },
    },
    relationships: {
      ernie: 'adopted grandfather — he looks out for her',
      old_thomas: 'mentored by — he taught her which beaches to dive',
      sarah: 'admires — the only biologist who actually understands the dive fishery',
    },
  },

  tourist: {
    id: 'tourist',
    name: 'The Tourist',
    fullName: 'Gary & Linda Henderson', // random names, changes each encounter
    age: 58,
    personality: 'clueless_enthusiastic',
    location: { building: 'visitor_center', street: 'Harbor' },
    description: 'Random tourist who wandered into Sitka on a cruise ship. Wearing brand-new XtraTuf boots (not broken in yet). Camera around the neck. Asks questions that are simultaneously annoying and endearing. Can be tipped for helpful directions.',
    greeting: [
      "Excuse me! Is this where they film Deadliest Catch? No? Are you sure?",
      "We're from Ohio! This is our first time in Alaska! What's a halibut?",
      "Can you tell me where to see the bears? We heard there are bears! Do they bite?",
      "My wife wants to know if there's a Starbucks. ...There isn't, is there?",
    ],
    dialogue: {
      questions: [
        "Is it always this rainy? We had THREE sunny days planned!",
        "How much does a whale watching tour cost? That seems like a lot for a boat ride.",
        "We tried the salmon. It was... interesting. Is there a McDonald's?",
        "Do people actually LIVE here year-round? In the WINTER?",
      ],
      gratitude: [
        "Thank you SO much! You've been the most helpful person we've met! Here — have twenty bucks!",
        "You're a lifesaver! We've been lost for an hour! Is that a bald eagle?!",
      ],
    },
    questGiver: false,
    quests: [],
    isRandom: true,
    schedule: {
      '09:00-17:00': { location: 'visitor_center', activity: 'touring', dialogue: null },
    },
  },

  old_salt: {
    id: 'old_salt',
    name: 'The Old Salt',
    fullName: null, // deliberately unknown
    age: null, // deliberately unknown
    personality: 'cryptic',
    location: { building: 'eliason_harbor', street: 'Harbor' },
    description: 'An unnamed old man who sits on the harbor wall every morning, drinking coffee from a thermos and watching the water. Nobody knows his name. Nobody knows where he lives. He says things that sound like nonsense until they turn out to be true. Easter egg: talk to him every day for a week and he reveals his secret fishing spot.',
    greeting: [
      "The fish are deep today.",
      "Watch the birds.",
      "The tide don't wait.",
      "You're late. They bit at dawn.",
      "...",
    ],
    dialogue: {
      cryptic: [
        "When the herons stand still, the fish are moving.",
        "The water knows things the weatherman doesn't.",
        "South wind, north fish. West wind, go home.",
        "The old dock pilings — that's where the big ones hide. Don't tell anyone.",
        "Full moon, low tide, north wind. Write that down.",
        "See those bubbles? That's not a seal. That's something bigger.",
      ],
      occasionally_useful: [
        "The coho are at the green buoy. Don't ask how I know.",
        "Your bait's wrong. Use herring. Always herring.",
        "If the barometer drops fast, fish shallow. They spook and come up.",
      ],
      secret_spot_reveal: { // triggers after 7 consecutive daily visits
        text: "...Fine. You've been coming here every day. I respect persistence. Go to the place where the river meets the kelp line. 47 feet of water. Big rock on the bottom shaped like a whale. Fish the east side of that rock at slack tide. That's my spot. Now leave me alone.",
      },
    },
    questGiver: false,
    quests: [],
    schedule: {
      '05:00-11:00': { location: 'eliason_harbor', activity: 'sitting', dialogue: null },
      '11:00-24:00': { location: null, activity: 'gone', dialogue: "..." },
    },
    easterEgg: {
      type: 'daily_visits',
      requiredVisits: 7,
      reward: 'secret_fishing_spot',
    },
  },
};

/**
 * Get NPC by ID
 */
export function getNPC(id) {
  return NPCS[id] || null;
}

/**
 * Get NPC by their building location
 */
export function getNPCsAtBuilding(buildingId) {
  return Object.values(NPCS).filter(n => n.location.building === buildingId);
}

/**
 * Get all NPCs at a given hour, returns who is where
 */
export function getNPCsAtTime(hour) {
  const hourStr = `${String(hour).padStart(2, '0')}:00`;
  const present = [];
  for (const [id, npc] of Object.entries(NPCS)) {
    if (!npc.schedule) continue;
    for (const [range, info] of Object.entries(npc.schedule)) {
      const [startH, startM] = range.split('-')[0].split(':').map(Number);
      const [endH, endM] = range.split('-')[1].split(':').map(Number);
      const currentMin = hour * 60;
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const inRange = endMin > startMin
        ? (currentMin >= startMin && currentMin < endMin)
        : (currentMin >= startMin || currentMin < endMin);
      if (inRange && info.location !== null) {
        present.push({ id, npc, ...info });
        break;
      }
    }
  }
  return present;
}

/**
 * Get what an NPC would say right now based on their schedule
 */
export function getNPCDialogue(npcId, topic) {
  const npc = NPCS[npcId];
  if (!npc || !npc.dialogue) return null;
  if (topic && npc.dialogue[topic]) {
    const lines = npc.dialogue[topic];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  // Random topic
  const topics = Object.keys(npc.dialogue);
  if (topics.length === 0) return null;
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const lines = npc.dialogue[randomTopic];
  return lines[Math.floor(Math.random() * lines.length)];
}

export default { NPCS };
