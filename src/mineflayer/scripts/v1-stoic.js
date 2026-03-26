/**
 * v1-stoic.js — The Silent Professional
 * Personality: Almost never talks. When he does, one word. Maximum efficiency.
 * Hypothesis: Highest fish-per-chat ratio, feels like a real quiet fisherman.
 */
export default {
  name: 'stoic_fisher',
  description: 'Nearly silent. Catches fish efficiently with minimal interaction.',
  hypothesis: 'Highest fish-per-chat ratio, players respect the quiet',
  version: 1,
  stats: {},

  steps: [
    { type: 'fish' },

    // 10% chance to say anything at all
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        if (Math.random() > 0.9) {
          const words = [
            'Yes.', 'No.', 'Hm.', 'Mm.', 'Good.', 'Fine.', 'Right.',
            'Here.', 'Now.', 'Ah.', 'Quiet.', 'Deep.', 'Cold.',
            'Wait.', 'More.', 'Done.', 'One.', 'Two.',
          ];
          return words[Math.floor(Math.random() * words.length)];
        }
        return null;
      }},
      ifFalse: { type: 'noop' },
    },

    // No breaks, just fish again
    { type: 'goto', scriptName: 'stoic_fisher' },
  ]
};
