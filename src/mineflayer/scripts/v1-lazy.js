/**
 * Script C: The Lazy Fisher
 * Personality: Takes lots of breaks, stretches, complains, fishes when he feels like it.
 * Hypothesis: Most natural-feeling behavior. Lowest fish count but highest "personality score".
 */
export default {
  name: 'lazy_fisher',
  description: 'Lots of breaks, stretching, complaining. Fishing is casual.',
  hypothesis: 'Most natural-feeling despite fewer fish',
  version: 1,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },

  steps: [
    // 30% chance to just idle first
    { type: 'branch',
      condition: () => Math.random() > 0.3,
      ifTrue: { type: 'noop' },
      ifFalse: { type: 'chat', pick: () => {
        const idle = ['*yawns*', 'Mm.', 'Give me a second.', '*stretches*', '...'];
        return idle[Math.floor(Math.random() * idle.length)];
      }},
    },
    
    // Crotchety preamble
    { type: 'chat', pick: () => {
      const lines = [
        'Alright, fine.',
        'Suppose I should fish.',
        '*grabs rod reluctantly*',
        'Here we go I guess.',
        'One more cast. Then I\'m done.',
        '*sighs*',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }},
    
    { type: 'fish' },
    
    // Reaction
    { type: 'branch',
      condition: () => Math.random() > 0.45,
      ifTrue: { type: 'chat', pick: () => {
        const hits = [
          'Huh. Look at that.',
          'Not bad for an old man.',
          'Took long enough.',
          'About time.',
          'Finally. This spot owes me.',
          'Eh, it\'s a living.',
        ];
        return hits[Math.floor(Math.random() * hits.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Of course.',
          'Typical.',
          '*shakes head*',
          'Waste of time.',
          'They\'re mocking me.',
          'I should\'ve stayed home.',
          'Don\'t know why I bother.',
          'Same as always.',
          'Maybe tomorrow.',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },
    
    // 40% chance to take a break after each cast
    { type: 'branch',
      condition: () => Math.random() > 0.6,
      ifTrue: { type: 'goto', scriptName: 'lazy_fisher' },
      ifFalse: [
        { type: 'chat', pick: () => {
          const breaks = [
            '*sits down*', 'Need a minute.', 'My back.', '*rubs eyes*',
            'Taking five.', 'Getting coffee.', '*stretches back*',
            'Hate this part.', 'Would kill for a sandwich.',
          ];
          return breaks[Math.floor(Math.random() * breaks.length)];
        }},
        { type: 'wait', ms: 5000 },
        { type: 'goto', scriptName: 'lazy_fisher' },
      ],
    },
  ]
};
