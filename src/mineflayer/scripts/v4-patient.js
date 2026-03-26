/**
 * Round 2 Script: Patient Elder
 * Personality: Slow, deliberate, philosophical. Long waits. Always fishes.
 * Hypothesis: Pacing variety doesn't reduce fish quality, creates memorable character.
 */
export default {
  name: 'patient_elder',
  description: 'Slow, deliberate fisher with long pauses and occasional wisdom. Always fishes every loop.',
  hypothesis: 'r2 patient_elder: longer pacing doesn\'t hurt fish rate, adds character depth',
  version: 2,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },

  steps: [
    // Long contemplative pause before casting
    { type: 'chat', pick: () => {
      const thoughts = [
        'The trick isn\'t catching fish. It\'s being here.',
        '*adjusts hat slowly*',
        'You know... I\'ve been fishing this spot since before you were born.',
        'My grandfather taught me this knot. Still holds.',
        'Fish don\'t wear watches. Neither should fishermen.',
        'The water remembers everything. So do I.',
        'Best bait is patience. Second best is herring.',
        null, null, null, null, // 40% silent — the elder is comfortable with silence
      ];
      return thoughts[Math.floor(Math.random() * thoughts.length)];
    }},

    { type: 'wait', ms: 3000 + Math.random() * 5000 },

    // Fish step — ALWAYS runs, no skip paths
    { type: 'fish' },

    // Post-fish reflection
    { type: 'chat', pick: () => {
      const catches = [
        'Hmm. Decent. Not the biggest I\'ve seen, but decent.',
        'There we are. Another conversation with the sea.',
        'Good fish. Respectable.',
        '*nods slowly*',
        'The sea provides.',
      ];
      const misses = [
        'The fish will come when they\'re ready.',
        '*stares at water*',
        'Not every cast needs a catch.',
        'Sometimes you just... hold the line.',
        null, null, null, null,
      ];
      const pool = Math.random() > 0.4 ? catches : misses;
      return pool[Math.floor(Math.random() * pool.length)];
    }},

    // Long post-fish pause (elder doesn't rush)
    { type: 'wait', ms: 4000 + Math.random() * 6000 },
    { type: 'goto', scriptName: 'patient_elder' },
  ]
};
