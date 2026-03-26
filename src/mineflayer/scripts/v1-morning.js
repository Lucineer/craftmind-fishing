/**
 * v1-morning.js — The Early Bird
 * Personality: Loves mornings, chatty at dawn, tired by afternoon.
 * Hypothesis: Best for realistic day-long sessions.
 */
export default {
  name: 'morning_fisher',
  description: 'Early riser who loves dawn fishing. Gets tired and quiet by afternoon.',
  hypothesis: 'Best for realistic day-long sessions with natural energy curve',
  version: 1,
  stats: {},

  steps: [
    // Energy depends on time of day (simulated via random state)
    { type: 'set', key: 'morningPhase', value: () => Math.random() > 0.4 },

    { type: 'chat', pick: () => {
      const isMorning = true; // would check actual game time in real impl
      const morningLines = [
        'Beautiful morning.', 'Nothing like dawn on the water.',
        'Early bird gets the worm.', 'Crisp air, perfect fishing.',
        'Look at that light.', 'Best time of day for fishing.',
        'Morning coffee and a fishing rod. Can\'t beat it.',
        'The world is quiet. Just me and the fish.',
        'Sun\'s barely up and I\'m already here. Dedicated.',
        'Love this time of day.', 'Fresh start.',
        'Mornings were made for this.',
      ];
      const afternoonLines = [
        'Getting a bit tired...', '*yawns*',
        'Maybe one more cast.', 'Starting to slow down.',
        'The morning fish are gone.', 'Should probably head in soon.',
        'That sun is getting warm.', 'Fading fast.',
        'Think I got my fill today.', 'Winding down.',
      ];
      const pool = isMorning ? morningLines : afternoonLines;
      return Math.random() > 0.3 ? pool[Math.floor(Math.random() * pool.length)] : null;
    }},

    { type: 'fish' },

    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Good morning to me!', 'Dawn patrol pays off!',
          'That\'s what early rising gets you.',
          'Worth getting up for.', 'Perfect start to the day.',
          'The fish are awake too, apparently.',
          'Morning bite is always the best.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Hmm. Maybe I\'m too early.', 'Quiet out here.',
          'The fish are sleeping in too.', 'Patience.',
          'They\'ll wake up soon.', 'It\'s peaceful at least.',
          'Just enjoying the morning.', 'No rush.',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // Afternoon breaks become more likely
    { type: 'branch',
      condition: () => Math.random() > 0.6,
      ifTrue: [
        { type: 'chat', pick: () => {
          const breaks = [
            '*sips coffee*', 'Taking a breather.',
            'Letting the line soak.', '*stretches*',
            'Enjoying the view.', 'Quiet moment.',
          ];
          return breaks[Math.floor(Math.random() * breaks.length)];
        }},
        { type: 'wait', ms: 6000 },
      ],
      ifFalse: { type: 'noop' },
    },

    { type: 'goto', scriptName: 'morning_fisher' },
  ]
};
