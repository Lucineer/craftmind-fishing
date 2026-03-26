/**
 * v3-rainy-day.js — The Weather-Grouchy Fisherman
 * Personality: Complains about weather, adjusts strategy for rain, fishes from shelter.
 * Hypothesis: Situational weather-reactive personality feels more immersive.
 * Ideas sourced from: idea-db (v3-rainy-day)
 */
export default {
  name: 'rainy_day',
  description: 'Weather-grouchy fisherman who complains about conditions but keeps fishing. More talkative in bad weather.',
  hypothesis: 'v3 rainy-day: weather-reactive personality increases immersion and chat engagement',
  version: 3,
  stats: {},

  steps: [
    // ── Weather check + reaction (varies by mood) ──
    { type: 'chat', pick: () => {
      const complaints = [
        'Rain again. Of course.',
        'My gear\'s going to rust if this keeps up.',
        'Used to be sunny here. I\'m sure of it.',
        'If I wanted to be wet, I\'d go swimming.',
        'At least the fish don\'t care about the weather.',
        'Third day of this. Starting to grow gills.',
        'Raingear\'s holding up. Barely.',
        'Weather app said "light drizzle." Liar.',
        'Rain means the tourist boats stay in. I\'ll take it.',
        'Nothing wrong with a little weather. Builds character.',
        // Good weather (rare complaint)
        'Sun\'s out? What\'s the catch. ...Don\'t answer that.',
        'Can\'t complain about the weather when it\'s like this. Watch me.',
      ];
      if (Math.random() < 0.15) return null;
      return complaints[Math.floor(Math.random() * complaints.length)];
    }},

    { type: 'wait', ms: 2000 + Math.random() * 3000 },

    // ── Gear adjustment (always checks gear before casting in rain) ──
    { type: 'chat', pick: () => {
      const gearLines = [
        '*wipes rain from reel*',
        '*checks line for fraying*',
        'Better retie this. Rain weakens the knot.',
        '*pulls hood tighter*',
        'Need to waterproof these hooks.',
        'Swapping to the heavier line. Weather\'s rough.',
        null, null, // 30% silent
      ];
      return gearLines[Math.floor(Math.random() * gearLines.length)];
    }},

    { type: 'wait', ms: 1000 + Math.random() * 2000 },

    // Fish
    { type: 'fish' },

    // ── Catch reaction (bitter-sweet) ──
    { type: 'branch',
      condition: () => Math.random() > 0.45,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Hah! Take that, weather.',
          'Even in the rain, I still got it.',
          'See? Fish don\'t care about your forecast.',
          'Not bad for conditions like this.',
          'One fish. Better than what the tourists are doing.',
          'Fish tastes the same whether you\'re wet or dry.',
          'Got one! The rain brought \'em in.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Nothing. Blame the weather.',
          'Fish are smarter than me today. And the weather.',
          'Maybe I should go home. ...Nah.',
          'Rain\'s scaring them off. That\'s my story.',
          'Well, I\'m staying dry. That\'s something.',
          '*stares at water judgmentally*',
          null,
        ];
        if (Math.random() < 0.2) return null;
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // ── Philosophical rain thought (25% chance) ──
    { type: 'branch',
      condition: () => Math.random() > 0.75,
      ifTrue: [
        { type: 'chat', pick: () => {
          const thoughts = [
            'You know what the rain teaches you? Patience. And that you forgot your rain jacket.',
            'Rain makes everything louder. The dock, the harbor, my regrets.',
            'There\'s something honest about fishing in the rain. No pretending.',
            'Every fisherman has a "worst weather" story. This might be mine.',
            'Salmon don\'t stop for rain. Neither do I.',
          ];
          return thoughts[Math.floor(Math.random() * thoughts.length)];
        }},
        { type: 'wait', ms: 4000 + Math.random() * 4000 },
      ],
      ifFalse: { type: 'noop' },
    },

    // Loop
    { type: 'goto', scriptName: 'rainy_day' },
  ]
};
