/**
 * Round 2 Script: Competitive Angler
 * Personality: Keeps score, celebrates milestones, gets fired up.
 * Always fishes every loop — no skip paths.
 */
export default {
  name: 'competitive_angler',
  description: 'Keeps score, celebrates milestones, trash-talks. Always fishes.',
  hypothesis: 'r2 competitive: milestone celebrations increase engagement without reducing fishing rate',
  version: 2,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },

  steps: [
    // Pre-fish hype or complaint (never skip fishing)
    { type: 'chat', pick: () => {
      const count = 0; // Will be set by script engine
      const lines = [
        'Let\'s go. Another one.',
        'Focus. Rod in hand, eye on the float.',
        'This is the one. I can feel it.',
        '*cracks knuckles*',
        'They don\'t call me the dock master for nothing.',
        'One more. Then maybe one more after that.',
        null, null, // 20% silent
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }},

    { type: 'wait', ms: 500 + Math.random() * 1500 },

    // THE FISH STEP — always runs
    { type: 'fish' },

    // Post-catch reaction
    { type: 'chat', pick: () => {
      const catches = [
        'That\'s what I\'m talking about!',
        'Boom. Count it.',
        'Another one for the board.',
        'They can\'t stop me today.',
        'Fish don\'t stand a chance.',
        '*adds to mental tally*',
        'Getting warmed up.',
        null, null, null, // 30% silent — not every catch needs commentary
      ];
      const misses = [
        'Hmm. Next one.',
        'Fine. Your turn, fish.',
        'They\'re getting smarter.',
        'I\'ll give them that one.',
        null, null, null,
      ];
      // Use branch for catch/miss if available, otherwise random pick
      const pool = Math.random() > 0.4 ? catches : misses;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return pick;
    }},

    { type: 'wait', ms: 1000 + Math.random() * 2000 },
    { type: 'goto', scriptName: 'competitive_angler' },
  ]
};
