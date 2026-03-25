// CraftMind Fishing — Sitka Species Database
// REAL Alaska species. Someone from Sitka should read this and go "yes, that's right."

import { EXPANDED_SPECIES } from '../species/expanded-species.js';

export const SPECIES_CATEGORIES = {
  salmon:    { name: 'Salmon',       emoji: '🐟' },
  groundfish: { name: 'Groundfish',  emoji: '🐠' },
  shellfish: { name: 'Shellfish',    emoji: '🦀' },
  pelagic:   { name: 'Pelagics',     emoji: '🐡' },
  shark:     { name: 'Sharks',       emoji: '🦈' },
  bottom:    { name: 'Bottom Fish',  emoji: '🐡' },
  easter_egg:{ name: 'Rare & Special', emoji: '✨' },
};

export const ALASKA_SPECIES = [
  // ═══ SALMON — THE defining fish of Alaska ═══
  {
    id: 'king_salmon', name: 'King (Chinook) Salmon', scientificName: 'Oncorhynchus tshawytscha',
    category: 'salmon', emoji: '👑', rarity: 'Epic',
    description: 'The king of salmon. Largest of the five species, and every Alaskan\'s white whale.',
    personality: 'Proud and powerful. Does not give up. Ever.',
    biomes: ['sheltered_sound', 'river_estuary', 'freshwater_river', 'open_ocean'],
    preferredDepth: [3, 40], preferredSeason: ['summer'], peakMonth: [6, 7],
    sizeRange: [15, 50], avgWeight: 30, fightStrength: 9, speed: 8,
    baseValue: 50, cookValue: 120, marketDemand: 'high',
    preferredBait: ['herring', 'squid', 'plug'],
    schools: false, predators: ['salmon_shark', 'orca'],
    notes: 'The Kenai River record is 97 lbs. In Sitka, 30-50 lbs is a great fish.',
  },
  {
    id: 'coho_salmon', name: 'Coho (Silver) Salmon', scientificName: 'Oncorhynchus kisutch',
    category: 'salmon', emoji: '🪙', rarity: 'Rare',
    description: 'The angler\'s salmon. Aggressive, acrobatic, and the reason people buy expensive rods.',
    personality: 'Hot-tempered and acrobatic. Will leap, tail-walk, and spit the hook.',
    biomes: ['sheltered_sound', 'river_estuary', 'kelp_forest', 'freshwater_river'],
    preferredDepth: [2, 25], preferredSeason: ['summer', 'fall'], peakMonth: [8, 9],
    sizeRange: [6, 20], avgWeight: 12, fightStrength: 8, speed: 9,
    baseValue: 25, cookValue: 65, marketDemand: 'high',
    preferredBait: ['herring', 'spinner', 'plug'],
    schools: true, predators: ['salmon_shark', 'orca'],
    notes: 'Silvers are the most fun salmon to catch. They hit lures like they\'re angry.',
  },
  {
    id: 'sockeye_salmon', name: 'Sockeye (Red) Salmon', scientificName: 'Oncorhynchus nerka',
    category: 'salmon', emoji: '🔴', rarity: 'Rare',
    description: 'The best-eating salmon. Turns brilliant red when spawning. Lake-spawning.',
    personality: 'Determined and focused. Swimming to its death with purpose.',
    biomes: ['river_estuary', 'freshwater_river', 'sheltered_sound'],
    preferredDepth: [1, 15], preferredSeason: ['summer'], peakMonth: [7, 8],
    sizeRange: [5, 12], avgWeight: 7, fightStrength: 6, speed: 7,
    baseValue: 20, cookValue: 80, marketDemand: 'very_high',
    preferredBait: ['bead', 'fly'],
    schools: true, predators: ['bear'],
    notes: 'Bristol Bay gets millions. In Sitka, they\'re common in blue lake system.',
  },
  {
    id: 'pink_salmon', name: 'Pink (Humpy) Salmon', scientificName: 'Oncorhynchus gorbuscha',
    category: 'salmon', emoji: '🩷', rarity: 'Common',
    description: 'Smallest, most numerous salmon. Odd-year runs are massive in Southeast Alaska.',
    personality: 'Humble and numerous. Every other year, they\'re everywhere.',
    biomes: ['sheltered_sound', 'river_estuary', 'freshwater_river', 'kelp_forest'],
    preferredDepth: [1, 10], preferredSeason: ['summer', 'fall'], peakMonth: [7, 8],
    sizeRange: [3, 8], avgWeight: 4, fightStrength: 3, speed: 5,
    baseValue: 5, cookValue: 12, marketDemand: 'low',
    preferredBait: ['pink_wiggle', 'spinner', 'anything'],
    schools: true, predators: ['everything'],
    notes: 'Odd years in Southeast are huge runs. Even years, not so much. Great for smoking.',
  },
  {
    id: 'chum_salmon', name: 'Chum (Dog) Salmon', scientificName: 'Oncorhynchus keta',
    category: 'salmon', emoji: '🐕', rarity: 'Uncommon',
    description: 'The dog salmon. Strong fighters, get weird tiger stripes when spawning.',
    personality: 'Stubborn brawler. Not glamorous, but won\'t quit.',
    biomes: ['river_estuary', 'freshwater_river'],
    preferredDepth: [1, 12], preferredSeason: ['fall'], peakMonth: [9, 10],
    sizeRange: [8, 20], avgWeight: 12, fightStrength: 7, speed: 6,
    baseValue: 8, cookValue: 18, marketDemand: 'low',
    preferredBait: ['egg', 'fly'],
    schools: true, predators: ['bear', 'eagle'],
    notes: 'Called "dog salmon" because sled dogs ate them. Still smoked by locals.',
  },

  // ═══ GROUNDFISH ═══
  {
    id: 'halibut', name: 'Pacific Halibut', scientificName: 'Hippoglossus stenolepis',
    category: 'groundfish', emoji: '🐟', rarity: 'Rare',
    description: 'THE prize of Alaska fishing. Flat, powerful, and worth more per pound than gold.',
    personality: 'A locomotive with fins. Once hooked, you don\'t reel in a halibut — you negotiate.',
    biomes: ['open_ocean', 'rocky_pinnacles', 'deep_trench'],
    preferredDepth: [30, 120], preferredSeason: ['summer', 'fall'], peakMonth: [6, 7, 8],
    sizeRange: [15, 300], avgWeight: 40, fightStrength: 10, speed: 4,
    baseValue: 40, cookValue: 100, marketDemand: 'very_high',
    preferredBait: ['herring', 'octopus', 'cod'],
    schools: false, predators: ['orca', 'sixgill_shark'],
    notes: '"Barn door" halibut are 100+ lbs. The IGFA record is 459 lbs. In Sitka, 50+ lbs is a great day.',
  },
  {
    id: 'pacific_cod', name: 'Pacific Cod', scientificName: 'Gadus macrocephalus',
    category: 'groundfish', emoji: '🐟', rarity: 'Common',
    description: 'The workhorse fish. Common, good eating, always willing to bite.',
    personality: 'Unpretentious and reliable. The backbone of the fishery.',
    biomes: ['sheltered_sound', 'open_ocean', 'rocky_pinnacles'],
    preferredDepth: [10, 60], preferredSeason: ['spring', 'summer', 'fall'], peakMonth: [5, 6, 7],
    sizeRange: [5, 30], avgWeight: 10, fightStrength: 4, speed: 3,
    baseValue: 8, cookValue: 20, marketDemand: 'high',
    preferredBait: ['herring', 'shrimp', 'squid'],
    schools: true, predators: ['halibut', 'lingcod'],
    notes: 'Not as glamorous as halibut, but a staple. Fish and chips royalty.',
  },
  {
    id: 'sablefish', name: 'Sablefish (Black Cod)', scientificName: 'Anoplopoma fimbria',
    category: 'groundfish', emoji: '🖤', rarity: 'Uncommon',
    description: 'Butter on the plate. High oil content makes it the richest fish in Alaska waters.',
    personality: 'Mysterious deep-dweller. Doesn\'t know it\'s delicious.',
    biomes: ['open_ocean', 'deep_trench', 'rocky_pinnacles'],
    preferredDepth: [40, 100], preferredSeason: ['spring', 'fall'], peakMonth: [3, 4, 10, 11],
    sizeRange: [5, 40], avgWeight: 15, fightStrength: 5, speed: 3,
    baseValue: 35, cookValue: 90, marketDemand: 'very_high',
    preferredBait: ['squid', 'herring'],
    schools: false, predators: ['sleeper_shark'],
    notes: 'Misoyaki black cod is maybe the best fish dish on earth. Worth every effort.',
  },
  {
    id: 'lingcod', name: 'Lingcod', scientificName: 'Ophiodon elongatus',
    category: 'groundfish', emoji: '🦷', rarity: 'Uncommon',
    description: 'The meanest fish in Alaska. Ambush predator with a face only a mother could love.',
    personality: 'AGGRESSIVE. Will eat your rockfish while you\'re reeling it in. No mercy.',
    biomes: ['rocky_pinnacles', 'kelp_forest'],
    preferredDepth: [10, 60], preferredSeason: ['spring', 'summer', 'fall'], peakMonth: [5, 6, 7],
    sizeRange: [10, 80], avgWeight: 25, fightStrength: 9, speed: 5,
    baseValue: 15, cookValue: 40, marketDemand: 'moderate',
    preferredBait: ['jig', 'herring', 'rockfish'],
    schools: false, predators: ['seal'],
    notes: 'Dinglebar fishing on pinnacles. They hit like a freight train and their teeth are nightmarish.',
  },
  {
    id: 'yelloweye_rockfish', name: 'Yelloweye Rockfish', scientificName: 'Sebastes ruberrimus',
    category: 'groundfish', emoji: '👁️', rarity: 'Uncommon',
    description: 'Bright red, deep-water dweller. Locals call it "red snapper" (it\'s not).',
    personality: 'Old soul. These fish can live 100+ years. Respect your elders.',
    biomes: ['rocky_pinnacles', 'deep_trench'],
    preferredDepth: [30, 80], preferredSeason: ['summer', 'fall'], peakMonth: [6, 7, 8],
    sizeRange: [5, 20], avgWeight: 10, fightStrength: 6, speed: 3,
    baseValue: 18, cookValue: 45, marketDemand: 'moderate',
    preferredBait: ['herring', 'shrimp'],
    schools: false, predators: ['halibut'],
    notes: 'Rockfish can\'t handle catch-and-release (barotrauma). If you catch one, keep it. Old ones are 100+ years.',
  },
  {
    id: 'quillback_rockfish', name: 'Quillback Rockfish', scientificName: 'Sebastes maliger',
    category: 'groundfish', emoji: '🦔', rarity: 'Uncommon',
    description: 'Territorial rocky reef dweller. Quill-like dorsal fin gives it away.',
    personality: 'Homebody. Stays on the same rock pile its whole life.',
    biomes: ['rocky_pinnacles', 'kelp_forest'],
    preferredDepth: [5, 40], preferredSeason: ['summer'], peakMonth: [6, 7],
    sizeRange: [3, 8], avgWeight: 4, fightStrength: 5, speed: 3,
    baseValue: 12, cookValue: 30, marketDemand: 'low',
    preferredBait: ['shrimp', 'jig'],
    schools: false, predators: ['lingcod'],
    notes: 'Named for the quill-like dorsal spines. Good eating but not heavily targeted.',
  },
  {
    id: 'black_rockfish', name: 'Black Rockfish', scientificName: 'Sebastes melanops',
    category: 'groundfish', emoji: '⬛', rarity: 'Common',
    description: 'The most common rockfish. Schools near the surface. Everyone catches them.',
    personality: 'Social and approachable. The friend of every fisherman.',
    biomes: ['sheltered_sound', 'kelp_forest', 'rocky_pinnacles'],
    preferredDepth: [2, 25], preferredSeason: ['summer'], peakMonth: [6, 7, 8],
    sizeRange: [2, 6], avgWeight: 3, fightStrength: 4, speed: 5,
    baseValue: 6, cookValue: 15, marketDemand: 'low',
    preferredBait: ['jig', 'herring'],
    schools: true, predators: ['lingcod', 'salmon'],
    notes: 'Cast a jig near kelp and you\'ll catch these all day. Not glamorous, but fun.',
  },
  {
    id: 'china_rockfish', name: 'China Rockfish', scientificName: 'Sebastes nebulosus',
    category: 'groundfish', emoji: '🎨', rarity: 'Rare',
    description: 'Beautiful markings. Rare, prized by those who know.',
    personality: 'Elusive masterpiece. If you see one, you\'re in the right place.',
    biomes: ['rocky_pinnacles', 'kelp_forest'],
    preferredDepth: [5, 30], preferredSeason: ['summer'], peakMonth: [7, 8],
    sizeRange: [2, 5], avgWeight: 3, fightStrength: 5, speed: 3,
    baseValue: 40, cookValue: 80, marketDemand: 'moderate',
    preferredBait: ['shrimp', 'small_jig'],
    schools: false, predators: ['lingcod'],
    notes: 'Easter egg species. Beautiful blue-black coloring with yellow spots. A fisherman\'s trophy.',
  },
  {
    id: 'tiger_rockfish', name: 'Tiger Rockfish', scientificName: 'Sebastes nigrocinctus',
    category: 'groundfish', emoji: '🐯', rarity: 'Rare',
    description: 'Striped like a tiger, deep-dwelling, and mysterious.',
    personality: 'Deep and secretive. The ghost of the reef.',
    biomes: ['rocky_pinnacles', 'deep_trench'],
    preferredDepth: [20, 60], preferredSeason: ['fall'], peakMonth: [9, 10],
    sizeRange: [1, 4], avgWeight: 2, fightStrength: 4, speed: 3,
    baseValue: 50, cookValue: 100, marketDemand: 'low',
    preferredBait: ['shrimp'],
    schools: false, predators: ['lingcod'],
    notes: 'Deep water easter egg. Striped orange and black. Very rare catch.',
  },
  {
    id: 'canary_rockfish', name: 'Canary Rockfish', scientificName: 'Sebastes pinniger',
    category: 'groundfish', emoji: '💛', rarity: 'Uncommon',
    description: 'Yellow-orange deep rockfish. One of several "red snapper" imposters.',
    personality: 'Deep thinker. Lives in the middle depths.',
    biomes: ['rocky_pinnacles', 'open_ocean'],
    preferredDepth: [25, 60], preferredSeason: ['summer', 'fall'], peakMonth: [7, 8],
    sizeRange: [3, 8], avgWeight: 5, fightStrength: 5, speed: 3,
    baseValue: 15, cookValue: 35, marketDemand: 'moderate',
    preferredBait: ['herring', 'squid'],
    schools: true, predators: ['halibut'],
    notes: 'Yellow-orange coloration. Another victim of the "red snapper" misnomer.',
  },

  // ═══ SHELLFISH ═══
  {
    id: 'dungeness_crab', name: 'Dungeness Crab', scientificName: 'Metacarcinus magister',
    category: 'shellfish', emoji: '🦀', rarity: 'Common',
    description: 'THE crab of Southeast Alaska. Sweet meat, winter season, pot fishing.',
    personality: 'Grumpy and delicious. Worth every frozen finger setting pots.',
    biomes: ['sheltered_sound', 'tidal_flats', 'kelp_forest'],
    preferredDepth: [2, 20], preferredSeason: ['winter', 'fall'], peakMonth: [12, 1, 2],
    sizeRange: [1.5, 3], avgWeight: 2, fightStrength: 2, speed: 2,
    baseValue: 15, cookValue: 40, marketDemand: 'high',
    preferredBait: ['herring', 'chicken'],
    schools: false, predators: ['octopus', 'otter'],
    notes: 'Winter is crab season. Set pots, wait, pull. Simple as that. Mandatory size limit.',
  },
  {
    id: 'king_crab', name: 'Red King Crab', scientificName: 'Paralithodes camtschaticus',
    category: 'shellfish', emoji: '👑', rarity: 'Epic',
    description: 'The king of crabs. Deep water, big boat, big danger, big reward.',
    personality: 'King of the deep. One leg is worth a meal at a restaurant.',
    biomes: ['open_ocean', 'deep_trench'],
    preferredDepth: [40, 100], preferredSeason: ['winter'], peakMonth: [1, 2],
    sizeRange: [6, 15], avgWeight: 8, fightStrength: 3, speed: 1,
    baseValue: 80, cookValue: 200, marketDemand: 'very_high',
    preferredBait: ['herring', 'cod'],
    schools: false, predators: ['octopus'],
    notes: 'Dangerous to catch. Need a real boat. But that first bite of king crab makes it all worth it.',
  },
  {
    id: 'tanner_crab', name: 'Tanner Crab', scientificName: 'Chionoecetes bairdi',
    category: 'shellfish', emoji: '🦀', rarity: 'Uncommon',
    description: 'Smaller cousin of king crab. Deep water pot fishing.',
    personality: 'The working crab. Not as flashy as king, but reliable.',
    biomes: ['open_ocean', 'deep_trench'],
    preferredDepth: [30, 80], preferredSeason: ['winter', 'spring'], peakMonth: [2, 3],
    sizeRange: [1, 4], avgWeight: 2, fightStrength: 2, speed: 1,
    baseValue: 20, cookValue: 50, marketDemand: 'moderate',
    preferredBait: ['herring', 'squid'],
    schools: false, predators: ['octopus'],
    notes: 'Bairdi Tanner is the good one. Opilio is the other one. Both tasty.',
  },
  {
    id: 'shrimp', name: 'Spot Shrimp', scientificName: 'Pandalus platyceros',
    category: 'shellfish', emoji: '🦐', rarity: 'Uncommon',
    description: 'The biggest, sweetest shrimp in Alaska. Pot fishing in deep water.',
    personality: 'Tiny and sweet. The secret ingredient no one talks about.',
    biomes: ['sheltered_sound', 'rocky_pinnacles'],
    preferredDepth: [15, 50], preferredSeason: ['summer', 'fall'], peakMonth: [6, 7, 8],
    sizeRange: [0.1, 0.3], avgWeight: 0.15, fightStrength: 0, speed: 2,
    baseValue: 10, cookValue: 30, marketDemand: 'moderate',
    preferredBait: ['cat_food', 'herring'],
    schools: true, predators: ['rockfish', 'lingcod'],
    notes: 'Spot shrimp pots. Pull them up and it\'s like Christmas. Sweet as candy.',
  },
  {
    id: 'geoduck', name: 'Geoduck', scientificName: 'Panopea generosa',
    category: 'shellfish', emoji: '🐚', rarity: 'Rare',
    description: 'HUGE clam buried 3+ feet in sand. Must dive and dig. The hardest fishery.',
    personality: 'Old, buried, and unbothered. Getting one out is an achievement.',
    biomes: ['tidal_flats'],
    preferredDepth: [0, 3], preferredSeason: ['spring', 'summer'], peakMonth: [4, 5, 6],
    sizeRange: [1, 3], avgWeight: 1.5, fightStrength: 1, speed: 0,
    baseValue: 30, cookValue: 80, marketDemand: 'high',
    preferredBait: ['digging'],
    schools: false, predators: ['sea_otter'],
    notes: 'Low tide only. You dig a hole and chase it down. It looks inappropriate. It\'s delicious.',
  },
  {
    id: 'sea_cucumber', name: 'Sea Cucumber', scientificName: 'Parastichopus californicus',
    category: 'shellfish', emoji: '🥒', rarity: 'Common',
    description: 'Slow-moving dive fishery. Pick them up by hand. Exported to Asia.',
    personality: 'The Zen master. Doesn\'t move fast, doesn\'t need to.',
    biomes: ['kelp_forest', 'sheltered_sound', 'tidal_flats'],
    preferredDepth: [1, 20], preferredSeason: ['fall', 'winter'], peakMonth: [10, 11, 12],
    sizeRange: [0.5, 2], avgWeight: 0.8, fightStrength: 0, speed: 0,
    baseValue: 8, cookValue: 5, marketDemand: 'high',
    preferredBait: ['hands'],
    schools: false, predators: ['sea_otter', 'sunflower_star'],
    notes: 'Dive fishery. Pick them off the bottom. Dried sea cucumber is worth real money.',
  },
  {
    id: 'butter_clam', name: 'Butter Clam', scientificName: 'Saxidomus gigantea',
    category: 'shellfish', emoji: '🧈', rarity: 'Common',
    description: 'Large, meaty tidal flat clam. Dig at low tide.',
    personality: 'Stays put. The tide comes and goes, and the clam doesn\'t care.',
    biomes: ['tidal_flats'],
    preferredDepth: [0, 2], preferredSeason: ['spring', 'summer'], peakMonth: [5, 6],
    sizeRange: [0.2, 0.5], avgWeight: 0.3, fightStrength: 0, speed: 0,
    baseValue: 4, cookValue: 12, marketDemand: 'moderate',
    preferredBait: ['shovel'],
    schools: false, predators: ['sea_otter'],
    notes: 'Buttery and sweet. Clam chowder material. Dig at minus tides.',
  },
  {
    id: 'littleneck_clam', name: 'Littleneck Clam', scientificName: 'Protothaca staminea',
    category: 'shellfish', emoji: '🐚', rarity: 'Common',
    description: 'Small, sweet tidal flat clam. The classic beach clam.',
    personality: 'Small but mighty. The foundation of many a chowder.',
    biomes: ['tidal_flats'],
    preferredDepth: [0, 2], preferredSeason: ['spring', 'summer'], peakMonth: [5, 6, 7],
    sizeRange: [0.05, 0.15], avgWeight: 0.08, fightStrength: 0, speed: 0,
    baseValue: 3, cookValue: 8, marketDemand: 'moderate',
    preferredBait: ['shovel'],
    schools: false, predators: ['sea_otter', 'bird'],
    notes: 'Classic beach clamming. Low tide, bucket, shovel, done.',
  },
  {
    id: 'mussel', name: 'Blue Mussel', scientificName: 'Mytilus trossulus',
    category: 'shellfish', emoji: '🪨', rarity: 'Common',
    description: 'Intertidal mussel. Easy harvesting from rocks.',
    personality: 'Hanging on for dear life. Harvest responsibly.',
    biomes: ['tidal_flats', 'rocky_pinnacles'],
    preferredDepth: [0, 3], preferredSeason: ['year_round'], peakMonth: [6, 7, 8],
    sizeRange: [0.05, 0.2], avgWeight: 0.1, fightStrength: 0, speed: 0,
    baseValue: 2, cookValue: 6, marketDemand: 'low',
    preferredBait: ['hands'],
    schools: true, predators: ['sea_otter', 'starfish', 'bird'],
    notes: 'Steamed in garlic butter. Paradise. Check for PSP (paralytic shellfish poisoning) in summer.',
  },
  {
    id: 'abalone', name: 'Northern Abalone', scientificName: 'Haliotis kamtschatkana',
    category: 'shellfish', emoji: '🐚', rarity: 'Legendary',
    description: 'Rare, endangered, poached. Finding one is an event. Let it live.',
    personality: 'Endangered beauty. If you find one, consider it a gift from the ocean.',
    biomes: ['rocky_pinnacles'],
    preferredDepth: [1, 15], preferredSeason: ['summer'], peakMonth: [7, 8],
    sizeRange: [0.5, 2], avgWeight: 1, fightStrength: 1, speed: 1,
    baseValue: 100, cookValue: 0, marketDemand: 'illegal',
    preferredBait: ['hands'],
    schools: false, predators: ['sea_otter', 'octopus'],
    notes: 'Easter egg species. ILLEGAL to harvest. Finding one is a karma event.',
  },
  {
    id: 'scallop', name: 'Weathervane Scallop', scientificName: 'Patinopecten caurinus',
    category: 'shellfish', emoji: '🪭', rarity: 'Uncommon',
    description: 'Dive fishery scallop. Swims away when approached.',
    personality: 'Nervous and delicious. Will clap its shells and swim.',
    biomes: ['sheltered_sound', 'rocky_pinnacles'],
    preferredDepth: [5, 30], preferredSeason: ['summer', 'fall'], peakMonth: [7, 8, 9],
    sizeRange: [0.5, 2], avgWeight: 0.8, fightStrength: 1, speed: 4,
    baseValue: 15, cookValue: 50, marketDemand: 'high',
    preferredBait: ['hands', 'dive'],
    schools: false, predators: ['sea_otter', 'octopus'],
    notes: 'Dive for them. They swim! Sear in a hot pan with butter. transcendent.',
  },

  // ═══ PELAGICS ═══
  {
    id: 'albacore_tuna', name: 'Albacore Tuna', scientificName: 'Thunnus alalunga',
    category: 'pelagic', emoji: '🐟', rarity: 'Rare',
    description: 'Offshore summer visitor. Trolling with feather jigs.',
    personality: 'Speed demon. Long-range traveler who doesn\'t visit often.',
    biomes: ['open_ocean'],
    preferredDepth: [10, 50], preferredSeason: ['summer', 'fall'], peakMonth: [8, 9],
    sizeRange: [10, 40], avgWeight: 20, fightStrength: 8, speed: 10,
    baseValue: 20, cookValue: 45, marketDemand: 'high',
    preferredBait: ['feather_jig', 'trolling_lure'],
    schools: true, predators: ['shark'],
    notes: 'They show up in late summer. Troll offshore. Chunky white meat for canning.',
  },
  {
    id: 'yellowfin_tuna', name: 'Yellowfin Tuna', scientificName: 'Thunnus albacares',
    category: 'pelagic', emoji: '🐟', rarity: 'Epic',
    description: 'Rare warm-current visitor. Big, fast, and worth the trip offshore.',
    personality: 'Tropical tourist. Rarely makes it this far north.',
    biomes: ['open_ocean'],
    preferredDepth: [10, 60], preferredSeason: ['summer'], peakMonth: [7, 8],
    sizeRange: [30, 200], avgWeight: 80, fightStrength: 9, speed: 10,
    baseValue: 60, cookValue: 150, marketDemand: 'very_high',
    preferredBait: ['trolling_lure', 'live_bait'],
    schools: true, predators: ['shark'],
    notes: 'Very rare in Alaska. Warm current event. If you find one, it\'s a story.',
  },
  {
    id: 'bluefin_tuna', name: 'Pacific Bluefin Tuna', scientificName: 'Thunnus orientalis',
    category: 'pelagic', emoji: '💙', rarity: 'Legendary',
    description: 'THE legendary catch. Ultra-rare, way offshore, 200-1000+ lbs.',
    personality: 'A god among fish. If you hook one, your life changes.',
    biomes: ['open_ocean', 'deep_trench'],
    preferredDepth: [10, 80], preferredSeason: ['fall'], peakMonth: [9, 10],
    sizeRange: [200, 1000], avgWeight: 400, fightStrength: 10, speed: 10,
    baseValue: 500, cookValue: 1000, marketDemand: 'legendary',
    preferredBait: ['anything'],
    schools: false, predators: ['orca'],
    notes: 'Ultra-rare easter egg. Maybe one in a million. The fish of a lifetime.',
  },
  {
    id: 'mackerel', name: 'Pacific Mackerel', scientificName: 'Scomber japonicus',
    category: 'pelagic', emoji: '🐟', rarity: 'Common',
    description: 'Common schooling fish. Bait for everything bigger.',
    personality: 'The everyman fish. School in huge numbers, eaten by everyone.',
    biomes: ['sheltered_sound', 'open_ocean'],
    preferredDepth: [1, 30], preferredSeason: ['summer', 'fall'], peakMonth: [7, 8, 9],
    sizeRange: [1, 4], avgWeight: 1.5, fightStrength: 3, speed: 7,
    baseValue: 2, cookValue: 5, marketDemand: 'low',
    preferredBait: ['small_lure', 'sabiki'],
    schools: true, predators: ['salmon', 'tuna', 'halibut'],
    notes: 'Bait fish. Catch a bunch, use them for halibut bait. Circle of life.',
  },
  {
    id: 'herring', name: 'Pacific Herring', scientificName: 'Clupea pallasii',
    category: 'pelagic', emoji: '🐟', rarity: 'Common',
    description: 'The basis of the food chain. Spring spawn in massive schools.',
    personality: 'Tiny but mighty. Without herring, everything starves.',
    biomes: ['sheltered_sound', 'river_estuary', 'kelp_forest'],
    preferredDepth: [1, 15], preferredSeason: ['spring'], peakMonth: [4, 5],
    sizeRange: [0.2, 0.5], avgWeight: 0.3, fightStrength: 1, speed: 5,
    baseValue: 1, cookValue: 2, marketDemand: 'low',
    preferredBait: ['net'],
    schools: true, predators: ['everything'],
    notes: 'Spring spawn is massive. Seines fill up in minutes. The engine of Southeast Alaska.',
  },
  {
    id: 'squid', name: 'Pacific Squid', scientificName: 'Loligo opalescens',
    category: 'pelagic', emoji: '🦑', rarity: 'Uncommon',
    description: 'Night fishing target. Jigging under lights. Best bait in the world.',
    personality: 'Mysterious night creature. Glows and squirms.',
    biomes: ['sheltered_sound', 'open_ocean', 'kelp_forest'],
    preferredDepth: [2, 30], preferredSeason: ['summer', 'fall'], peakMonth: [7, 8, 9],
    sizeRange: [0.2, 1], avgWeight: 0.4, fightStrength: 2, speed: 4,
    baseValue: 3, cookValue: 8, marketDemand: 'moderate',
    preferredBait: ['squid_jig'],
    schools: true, predators: ['halibut', 'lingcod', 'salmon'],
    notes: 'Squid jigging at night under dock lights. Meditative and productive.',
  },

  // ═══ SHARKS ═══
  {
    id: 'salmon_shark', name: 'Salmon Shark', scientificName: 'Lamna ditropis',
    category: 'shark', emoji: '🦈', rarity: 'Epic',
    description: 'Mako\'s cousin. 200-600 lbs, FAST, eats salmon. Sport fishing only.',
    personality: 'Speed and hunger. The salmon\'s worst nightmare.',
    biomes: ['open_ocean', 'sheltered_sound'],
    preferredDepth: [5, 60], preferredSeason: ['summer'], peakMonth: [7, 8],
    sizeRange: [200, 600], avgWeight: 300, fightStrength: 10, speed: 10,
    baseValue: 0, cookValue: 0, marketDemand: 'sport_only',
    preferredBait: ['salmon', 'herring'],
    schools: false, predators: ['orca'],
    notes: 'Catch and release only. They\'re like salmon-colored makos. Exhilarating fight.',
  },
  {
    id: 'sleeper_shark', name: 'Pacific Sleeper Shark', scientificName: 'Somniosus pacificus',
    category: 'shark', emoji: '😴', rarity: 'Legendary',
    description: 'Deep water ghost. 10-20 feet, rarely seen. Easter egg.',
    personality: 'Ancient and slow. Hasn\'t changed since the dinosaurs.',
    biomes: ['deep_trench'],
    preferredDepth: [80, 200], preferredSeason: ['year_round'], peakMonth: [1, 2, 3],
    sizeRange: [200, 1000], avgWeight: 500, fightStrength: 7, speed: 2,
    baseValue: 0, cookValue: 0, marketDemand: 'none',
    preferredBait: ['anything_on_bottom'],
    schools: false, predators: ['orca'],
    notes: 'Easter egg. They eat salmon whole. Toxic meat. Just... appreciate it.',
  },
  {
    id: 'spiny_dogfish', name: 'Spiny Dogfish', scientificName: 'Squalus acanthias',
    category: 'shark', emoji: '🦈', rarity: 'Common',
    description: 'Small shark, common nuisance. Spines on dorsal fins. Mildly venomous.',
    personality: 'Annoying little cousin of real sharks. Gets into everything.',
    biomes: ['sheltered_sound', 'open_ocean'],
    preferredDepth: [5, 60], preferredSeason: ['year_round'], peakMonth: [6, 7, 8],
    sizeRange: [2, 8], avgWeight: 4, fightStrength: 4, speed: 5,
    baseValue: 1, cookValue: 2, marketDemand: 'low',
    preferredBait: ['anything'],
    schools: true, predators: ['salmon_shark'],
    notes: 'Nuisance bycatch. They\'ll steal your bait. Good for fish and chips if you\'re desperate.',
  },
  {
    id: 'sixgill_shark', name: 'Bluntnose Sixgill Shark', scientificName: 'Hexanchus griseus',
    category: 'shark', emoji: '🦈', rarity: 'Legendary',
    description: 'Prehistoric deep-sea shark. Six gills instead of five. Massive. Easter egg.',
    personality: 'From another era. A living fossil that predates dinosaurs.',
    biomes: ['deep_trench'],
    preferredDepth: [100, 200], preferredSeason: ['year_round'], peakMonth: [5, 6, 7],
    sizeRange: [300, 1500], avgWeight: 800, fightStrength: 8, speed: 3,
    baseValue: 0, cookValue: 0, marketDemand: 'none',
    preferredBait: ['large_bait'],
    schools: false, predators: [],
    notes: 'Deep trench easter egg. Prehistoric. If you see one, take a picture and count yourself blessed.',
  },
  {
    id: 'skate', name: 'Big Skate', scientificName: 'Raja binoculata',
    category: 'shark', emoji: '🦑', rarity: 'Uncommon',
    description: 'Flat, bottom-dwelling cartilaginous fish. Common in deep water.',
    personality: 'Flat and unbothered. Living on the bottom since forever.',
    biomes: ['open_ocean', 'deep_trench'],
    preferredDepth: [20, 80], preferredSeason: ['year_round'], peakMonth: [6, 7, 8],
    sizeRange: [5, 30], avgWeight: 10, fightStrength: 3, speed: 2,
    baseValue: 2, cookValue: 5, marketDemand: 'low',
    preferredBait: ['herring', 'squid'],
    schools: false, predators: ['halibut'],
    notes: 'Common bycatch. Sometimes used for bait. Wings are edible (skate wings).',
  },

  // ═══ BOTTOM FISH / MISC ═══
  {
    id: 'greenling', name: 'Kelp Greenling', scientificName: 'Hexagrammos decagrammus',
    category: 'bottom', emoji: '🐟', rarity: 'Common',
    description: 'Kelp forest regular. Fun to catch, decent eating. Always around.',
    personality: 'Friendly neighborhood fish. The golden retriever of kelp forests.',
    biomes: ['kelp_forest', 'tidal_flats', 'sheltered_sound'],
    preferredDepth: [1, 15], preferredSeason: ['year_round'], peakMonth: [6, 7, 8],
    sizeRange: [0.5, 3], avgWeight: 1.5, fightStrength: 3, speed: 4,
    baseValue: 4, cookValue: 10, marketDemand: 'low',
    preferredBait: ['shrimp', 'small_jig'],
    schools: false, predators: ['lingcod'],
    notes: 'Good for kids to catch. Bright colors on the males. Overlooked but fun.',
  },
  {
    id: 'wolffish', name: 'Wolf-eel', scientificName: 'Anarrhichthys ocellatus',
    category: 'bottom', emoji: '👹', rarity: 'Rare',
    description: 'Not a wolf, not an eel. Ugly with big teeth. Deep water easter egg.',
    personality: 'Ugly but lovable. Those teeth? For crushing urchins. Not for you. Probably.',
    biomes: ['rocky_pinnacles', 'deep_trench'],
    preferredDepth: [20, 60], preferredSeason: ['fall', 'winter'], peakMonth: [10, 11],
    sizeRange: [5, 40], avgWeight: 15, fightStrength: 7, speed: 3,
    baseValue: 15, cookValue: 35, marketDemand: 'low',
    preferredBait: ['urchin', 'crab'],
    schools: false, predators: [],
    notes: 'Easter egg. Looks terrifying, actually gentle. Eats urchins. If you find one, say hi.',
  },
  {
    id: 'sand_lance', name: 'Pacific Sand Lance', scientificName: 'Ammodytes hexapterus',
    category: 'bottom', emoji: '🪱', rarity: 'Common',
    description: 'Sand eels. Burrow in sand. Critical bait fish.',
    personality: 'Invisible. Burrows in sand. Everything eats them.',
    biomes: ['tidal_flats', 'sheltered_sound'],
    preferredDepth: [0, 10], preferredSeason: ['year_round'], peakMonth: [5, 6, 7],
    sizeRange: [0.05, 0.2], avgWeight: 0.1, fightStrength: 0, speed: 5,
    baseValue: 1, cookValue: 1, marketDemand: 'bait',
    preferredBait: ['net'],
    schools: true, predators: ['salmon', 'halibut', 'cod', 'bird'],
    notes: 'The most important bait fish nobody talks about. Salmon key in on them.',
  },
  {
    id: 'eulachon', name: 'Eulachon (Candlefish)', scientificName: 'Thaleichthys pacificus',
    category: 'bottom', emoji: '🕯️', rarity: 'Uncommon',
    description: 'Smelt run in spring. So oily you can light them on fire. Hence "candlefish."',
    personality: 'Oily and important. First food of spring for everything.',
    biomes: ['river_estuary', 'freshwater_river'],
    preferredDepth: [1, 8], preferredSeason: ['spring'], peakMonth: [3, 4],
    sizeRange: [0.1, 0.3], avgWeight: 0.15, fightStrength: 1, speed: 4,
    baseValue: 2, cookValue: 5, marketDemand: 'moderate',
    preferredBait: ['net'],
    schools: true, predators: ['salmon', 'seal', 'bird'],
    notes: 'First Nations dried them for oil. "Candlefish" because they literally burn.',
  },
  {
    id: 'sturgeon', name: 'White Sturgeon', scientificName: 'Acipenser transmontanus',
    category: 'bottom', emoji: '🦕', rarity: 'Legendary',
    description: 'Prehistoric. Huge. Easter egg in Alaska waters. Not native but... stories exist.',
    personality: 'Dinosaur. Has seen ice ages come and go. Unimpressed by you.',
    biomes: ['freshwater_river', 'river_estuary', 'deep_trench'],
    preferredDepth: [5, 30], preferredSeason: ['summer'], peakMonth: [7, 8],
    sizeRange: [50, 500], avgWeight: 100, fightStrength: 9, speed: 4,
    baseValue: 0, cookValue: 0, marketDemand: 'none',
    preferredBait: ['eulachon', 'herring'],
    schools: false, predators: [],
    notes: 'Easter egg. Not common in Sitka but Columbia River fish migrate. Catch and release.',
  },

  // ═══ EASTER EGG SPECIES ═══
  {
    id: 'giant_octopus', name: 'Giant Pacific Octopus', scientificName: 'Enteroctopus dofleini',
    category: 'easter_egg', emoji: '🐙', rarity: 'Epic',
    description: 'Largest octopus in the world. Intelligent. Lives in kelp caves. Can steal your gear.',
    personality: 'Smarter than your dog. Will steal your crab pot. Houdini of the sea.',
    biomes: ['kelp_forest', 'rocky_pinnacles'],
    preferredDepth: [5, 40], preferredSeason: ['fall', 'winter'], peakMonth: [10, 11, 12],
    sizeRange: [10, 80], avgWeight: 30, fightStrength: 7, speed: 4,
    baseValue: 0, cookValue: 0, marketDemand: 'none',
    preferredBait: ['crab_bait'],
    schools: false, predators: ['seal', 'shark'],
    notes: 'Easter egg encounter. It might grab your gear. If you\'re diving... good luck.',
  },
  {
    id: 'sea_otter', name: 'Sea Otter', scientificName: 'Enhydra lutris',
    category: 'easter_egg', emoji: '🦦', rarity: 'Epic',
    description: 'Mist Cove easter egg. Playful, eats urchins, wraps in kelp. Do not catch.',
    personality: 'Adorable menace. Eats $50 of crab bait per day. Worth every penny.',
    biomes: ['kelp_forest', 'sheltered_sound'],
    preferredDepth: [1, 20], preferredSeason: ['year_round'], peakMonth: [6, 7, 8],
    sizeRange: [30, 80], avgWeight: 50, fightStrength: 0, speed: 3,
    baseValue: 0, cookValue: 0, marketDemand: 'protected',
    preferredBait: ['none'],
    schools: true, predators: ['orca'],
    notes: 'NOT a fish. Protected marine mammal. Mist Cove easter egg. If you find a raft, consider your day made.',
  },
  {
    id: 'orca', name: 'Orca', scientificName: 'Orcinus orca',
    category: 'easter_egg', emoji: '🐋', rarity: 'Legendary',
    description: 'Pass through in pods. Amazing to see. Scary for fishing. They eat everything.',
    personality: 'Apex. Beautiful. Terrifying if you\'re a salmon. Or a seal. Or anything, really.',
    biomes: ['open_ocean', 'sheltered_sound'],
    preferredDepth: [1, 60], preferredSeason: ['summer', 'fall'], peakMonth: [7, 8, 9],
    sizeRange: [3000, 8000], avgWeight: 5000, fightStrength: 0, speed: 8,
    baseValue: 0, cookValue: 0, marketDemand: 'protected',
    preferredBait: ['none'],
    schools: true, predators: [],
    notes: 'Transient pods eat mammals. Resident pods eat salmon. If they show up, stop fishing and watch.',
  },
  {
    id: 'humpback_whale', name: 'Humpback Whale', scientificName: 'Megaptera novaeangliae',
    category: 'easter_egg', emoji: '🐳', rarity: 'Legendary',
    description: 'Bubble-net feeding easter event. The most spectacular thing in Southeast Alaska.',
    personality: 'Gentle giant. Bubble nets are the ocean\'s greatest show.',
    biomes: ['open_ocean', 'sheltered_sound'],
    preferredDepth: [5, 50], preferredSeason: ['summer', 'fall'], peakMonth: [7, 8, 9],
    sizeRange: [20000, 40000], avgWeight: 30000, fightStrength: 0, speed: 5,
    baseValue: 0, cookValue: 0, marketDemand: 'protected',
    preferredBait: ['none'],
    schools: true, predators: [],
    notes: 'Easter event: bubble-net feeding. If you see a circle of bubbles, GET READY. Humpbacks erupt through the middle.',
  },
  {
    id: 'sea_turtle', name: 'Sea Turtle', scientificName: 'Chelonia mydas (various)',
    category: 'easter_egg', emoji: '🐢', rarity: 'Legendary',
    description: 'Ultra-rare. Seven species drift to Alaska. Catch-and-release only. Massive karma.',
    personality: 'Lost and ancient. Not supposed to be here. But here it is. Protect it.',
    biomes: ['open_ocean', 'kelp_forest'],
    preferredDepth: [2, 30], preferredSeason: ['summer'], peakMonth: [8, 9],
    sizeRange: [50, 300], avgWeight: 150, fightStrength: 2, speed: 3,
    baseValue: 0, cookValue: 0, marketDemand: 'protected',
    preferredBait: ['none'],
    schools: false, predators: ['shark', 'orca'],
    notes: 'Ultra-rare easter egg. Warm current drift. Catch-and-release ONLY. Massive karma bonus.',
  },
  {
    id: 'sunfish', name: 'Ocean Sunfish (Mola Mola)', scientificName: 'Mola mola',
    category: 'easter_egg', emoji: '🌞', rarity: 'Legendary',
    description: 'Offshore easter egg. Bizarre-looking. Looks like God\'s first draft of a fish.',
    personality: 'Weird and wonderful. Floats around looking alien. Harmless.',
    biomes: ['open_ocean'],
    preferredDepth: [5, 40], preferredSeason: ['summer'], peakMonth: [7, 8],
    sizeRange: [200, 2000], avgWeight: 1000, fightStrength: 1, speed: 2,
    baseValue: 0, cookValue: 0, marketDemand: 'none',
    preferredBait: ['none'],
    schools: false, predators: ['shark', 'orca'],
    notes: 'Easter egg. Looks like a giant floating head. Harmless. Bizarre. Wonderful.',
  },
  {
    id: 'narwhal', name: 'Narwhal', scientificName: 'Monodon monoceros',
    category: 'easter_egg', emoji: '🦄', rarity: 'Legendary',
    description: 'Ultra-ultra rare fantasy easter egg. Not real in Sitka waters. But Alaska mythology...',
    personality: 'The unicorn of the sea. Mythical. If real... you\'re dreaming.',
    biomes: ['deep_trench', 'open_ocean'],
    preferredDepth: [20, 80], preferredSeason: ['winter'], peakMonth: [1, 2],
    sizeRange: [1000, 3500], avgWeight: 1500, fightStrength: 0, speed: 5,
    baseValue: 0, cookValue: 0, marketDemand: 'mythical',
    preferredBait: ['none'],
    schools: true, predators: ['orca'],
    notes: 'ULTRA fantasy easter egg. Obviously not real in Sitka. But the Inupiat have stories. And sometimes stories are true enough.',
  },

  // ── Expanded species (from species/expanded-species.js) ──
  ...EXPANDED_SPECIES,
];

/** Build a lookup map */
const speciesMap = new Map();
for (const sp of ALASKA_SPECIES) {
  speciesMap.set(sp.id, sp);
}

export class SitkaSpeciesRegistry {
  /** Get species by id */
  static get(id) { return speciesMap.get(id) ?? null; }

  /** Get all species */
  static all() { return [...ALASKA_SPECIES]; }

  /** Get species by category */
  static byCategory(category) {
    return ALASKA_SPECIES.filter(s => s.category === category);
  }

  /** Get species by rarity */
  static byRarity(rarity) {
    return ALASKA_SPECIES.filter(s => s.rarity === rarity);
  }

  /** Get species for a biome */
  static forBiome(biome) {
    return ALASKA_SPECIES.filter(s => s.biomes.includes(biome));
  }

  /** Get species for a season */
  static forSeason(season) {
    return ALASKA_SPECIES.filter(s =>
      s.preferredSeason.includes(season) || s.preferredSeason.includes('year_round')
    );
  }

  /** Get species for a depth range */
  static forDepth(depth) {
    return ALASKA_SPECIES.filter(s => depth >= s.preferredDepth[0] && depth <= s.preferredDepth[1]);
  }

  /** Weighted random selection */
  static select({ biome, season, depth, excludeCategories = [] } = {}) {
    let candidates = [...ALASKA_SPECIES];
    if (excludeCategories.length > 0) {
      candidates = candidates.filter(s => !excludeCategories.includes(s.category));
    }
    if (biome) candidates = candidates.filter(s => s.biomes.includes(biome));
    if (season) candidates = candidates.filter(s =>
      s.preferredSeason.includes(season) || s.preferredSeason.includes('year_round')
    );
    if (depth != null) candidates = candidates.filter(s =>
      depth >= s.preferredDepth[0] && depth <= s.preferredDepth[1]
    );
    if (candidates.length === 0) return null;

    const weights = { Common: 50, Uncommon: 25, Rare: 10, Epic: 3, Legendary: 1 };
    const total = candidates.reduce((s, c) => s + (weights[c.rarity] ?? 10), 0);
    let roll = Math.random() * total;
    for (const sp of candidates) {
      roll -= weights[sp.rarity] ?? 10;
      if (roll <= 0) return sp;
    }
    return candidates[candidates.length - 1];
  }

  /** Salmon species only */
  static get salmon() { return this.byCategory('salmon'); }

  /** Count */
  static get count() { return ALASKA_SPECIES.length; }
}

export default SitkaSpeciesRegistry;
