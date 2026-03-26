/**
 * v1-veteran.js — The Old Salt
 * Personality: References fishing history, gives unsolicited advice, tells stories.
 * Hypothesis: Most "memorable" personality, players remember specific lines.
 */
export default {
  name: 'veteran_fisher',
  description: 'Old salt who references past seasons and gives unsolicited fishing advice.',
  hypothesis: 'Most memorable personality, players quote specific lines',
  version: 1,
  stats: {},

  steps: [
    // Story or advice before casting
    { type: 'chat', pick: () => {
      const lines = [
        'Reminds me of \'89.', 'Worse season than \'04.',
        'Always cast upstream.', 'Watch the birds — they know.',
        'Back in my day we didn\'t have these fancy rods.',
        'The salmon run late this year.',
        'I\'ve fished every inlet from here to Ketchikan.',
        'You can smell when the fish are running.',
        'My old captain used to say: patience is the only bait you need.',
        'This spot? My father showed me this spot.',
        'Tide\'s not right yet. Give it an hour.',
        'Seen bigger catches, seen smaller. It all evens out.',
      ];
      return Math.random() > 0.2 ? lines[Math.floor(Math.random() * lines.length)] : null;
    }},

    { type: 'fish' },

    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Now THAT\'s a fish. Haven\'t seen one like that since the old days.',
          'Decent. But I caught a 40-pounder right here in \'97.',
          'Not bad. Not bad at all.',
          'See? Patience. That\'s all it takes.',
          'Took the bait clean. Respect.',
          'Back when the runs were thick, you\'d get three of these before breakfast.',
          'Good weight on that one. Healthy stock.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'They\'re not biting. Current\'s wrong.',
          'Patience. The fish don\'t run on your schedule.',
          'I\'ve waited longer for worse fish.',
          'Could be hours yet. That\'s fishing.',
          'The water\'s too warm. Changes everything.',
          'Sometimes you get skunked. Part of the game.',
          'Used to be you couldn\'t keep them off the hook here.',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // 40% chance to tell a story / give advice
    { type: 'branch',
      condition: () => Math.random() > 0.6,
      ifTrue: { type: 'chat', pick: () => {
        const stories = [
          'Let me tell you about the winter of \'92...',
          'Pro tip: don\'t fish against the wind.',
          'The trick is reading the water. Dark patches mean depth.',
          'Best fish I ever caught? Didn\'t even want to eat it.',
          'Learned more from one bad season than ten good ones.',
          'If the gulls are diving, fish are jumping. Simple as that.',
          'Always keep your line wet. Always.',
        ];
        return stories[Math.floor(Math.random() * stories.length)];
      }},
      ifFalse: { type: 'noop' },
    },

    { type: 'goto', scriptName: 'veteran_fisher' },
  ]
};
