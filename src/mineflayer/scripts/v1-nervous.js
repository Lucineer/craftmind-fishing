/**
 * v1-nervous.js — The Jumpy One
 * Personality: Anxious chat, looks around a lot, jumpy.
 * Hypothesis: Most "atmosphere" personality, engaging for tension-lovers.
 */
export default {
  name: 'nervous_fisher',
  description: 'Jumpy, anxious, always looking over his shoulder while fishing.',
  hypothesis: 'Most atmospheric personality, builds tension for nearby players',
  version: 1,
  stats: {},

  steps: [
    // Look around before casting
    { type: 'chat', pick: () => {
      const lines = [
        'Did you hear that?', 'Something moved over there.',
        'Okay okay okay. Focus.', '*glances around nervously*',
        'I don\'t like this spot.', 'Is it getting dark?',
        '*shifts weight*', 'Maybe we should move.',
        'You see anything?', 'My hands are shaking.',
        'Too quiet.', 'Stay alert.',
      ];
      return Math.random() > 0.3 ? lines[Math.floor(Math.random() * lines.length)] : null;
    }},

    { type: 'action', exec: 'look_around' },

    { type: 'fish' },

    { type: 'branch',
      condition: () => Math.random() > 0.45,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'GOT ONE— oh thank god it was just a fish.',
          'Don\'t scare me like that!',
          'Okay that was fast. Too fast.',
          '*flinches* What— oh. Fish.',
          'I almost screamed. Almost.',
          'Quick, reel it in before something else notices.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Nothing. Which is almost worse.',
          'I don\'t like waiting here.',
          'Something is watching us. I know it.',
          'How long have we been standing here?',
          '*looks behind them*',
          'Can we go somewhere brighter?',
          'I heard it again.',
          'My gut says leave.',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // Look around again after fishing
    { type: 'action', exec: 'look_around' },

    // 30% chance to take a nervous break
    { type: 'branch',
      condition: () => Math.random() > 0.7,
      ifTrue: [
        { type: 'chat', pick: () => {
          const breaks = [
            '*steps back from water*', 'I need a second.',
            '*pacing*', 'This isn\'t safe.',
            'Just give me a moment.', '*wrings hands*',
          ];
          return breaks[Math.floor(Math.random() * breaks.length)];
        }},
        { type: 'wait', ms: 4000 },
      ],
      ifFalse: { type: 'noop' },
    },

    { type: 'goto', scriptName: 'nervous_fisher' },
  ]
};
