/**
 * v1-contemplative.js — The Philosopher
 * Personality: Reflective chat, long pauses, sometimes just stands still.
 * Hypothesis: Most "depth" — appeals to older players, memorable quotes.
 */
export default {
  name: 'contemplative_fisher',
  description: 'Quiet philosopher who finds meaning in fishing. Long pauses, deep thoughts.',
  hypothesis: 'Most depth and memorable quotes, appeals to reflective players',
  version: 1,
  stats: {},

  steps: [
    // Preamble — always reflective
    { type: 'chat', pick: () => {
      const lines = [
        'You know, fishing is a lot like life.',
        'The sea doesn\'t care about your plans.',
        'There\'s something honest about waiting.',
        'Stillness has its own kind of wisdom.',
        'The water remembers everything.',
        'Some things you can\'t rush.',
        'We spend so much time running. It\'s nice to stand still.',
        'Every cast is a small act of hope.',
        'The fish don\'t know about our problems.',
        'Maybe the point isn\'t the catch.',
        'Silence teaches you things noise never could.',
        'This river has seen empires rise and fall.',
      ];
      return Math.random() > 0.35 ? lines[Math.floor(Math.random() * lines.length)] : null;
    }},

    // Sometimes just stand still looking at water
    { type: 'branch',
      condition: () => Math.random() > 0.6,
      ifTrue: [
        { type: 'noop' },
        { type: 'wait', ms: 5000 },
      ],
      ifFalse: { type: 'noop' },
    },

    { type: 'fish' },

    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Hmm. Life finds a way.',
          'A gift from the deep.',
          'Every fish is a small miracle.',
          'The water gives, and the water takes.',
          'And just like that, patience is rewarded.',
          'Beautiful. In its own quiet way.',
          'Makes you appreciate the small things.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Nothing. But that\'s okay.',
          'Emptiness has its own truth.',
          'Sometimes the fish teach you patience.',
          'Maybe today isn\'t about catching.',
          'The void stares back, and I smile.',
          'Stillness isn\'t failure.',
          'The river owes us nothing.',
          'We ask too much and appreciate too little.',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // Long contemplative pause between cycles
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const thoughts = [
          'I wonder if the fish feel the same stillness.',
          'Time moves differently out here.',
          'The mountains don\'t judge.',
          'Some questions only silence can answer.',
          'This is enough. This is more than enough.',
        ];
        return thoughts[Math.floor(Math.random() * thoughts.length)];
      }},
      ifFalse: { type: 'noop' },
    },

    { type: 'goto', scriptName: 'contemplative_fisher' },
  ]
};
