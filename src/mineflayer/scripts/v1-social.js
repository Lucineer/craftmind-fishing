/**
 * Script B: The Social Fisher  
 * Personality: Chatty, friendly, gives fishing advice. Loves company.
 * Hypothesis: Most unique chat lines, moderate fishing.
 */
export default {
  name: 'social_fisher',
  description: 'Talks a lot, offers advice, reacts to everything. Fishing is secondary to conversation.',
  hypothesis: 'Most unique chat lines, engaging for human players',
  version: 1,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },

  steps: [
    // Always announce intentions
    { type: 'chat', pick: () => {
      const lines = [
        'Lines in.', 'Here we go.', 'Getting started.',
        'Alright.', '*casts*', 'Let\'s see what\'s biting.',
        'Good spot here.', 'Quiet morning.', 'One more cast.',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }},
    
    { type: 'fish' },
    
    // Talkative reaction
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Got one! Not bad at all.',
          'Fish on! This one\'s fighting.',
          'Hey, check that out.',
          'Nice! That\'s a keeper.',
          'Yes! Finally.',
          'There we go. Knew this spot was good.',
          '*holds up catch*',
          'This is why I love it out here.',
          'Boom! First cast even.',
          'Solid fish. Respect.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Nothing. Story of my life.',
          'Dry spell.',
          'Maybe I need a different bait.',
          'Hmm. They moved on.',
          'Patience is the game.',
          '*checks line*',
          'Still here though. Wouldn\'t be anywhere else.',
          'Takes a special kind of person to enjoy this.',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },
    
    // Random interjection (50% chance)
    { type: 'branch',
      condition: () => Math.random() > 0.5,
      ifTrue: { type: 'chat', pick: () => {
        const filler = [
          'You know what they say about Sitka fishing...',
          'My grandpa used to fish these waters.',
          'The trick is patience. And coffee.',
          '*stretches* Getting stiff.',
          'Should\'ve brought a thermos.',
          'Nice day for it though.',
          'I could do this all day.',
          'Weather\'s looking good for halibut.',
          '*looks at mountains* Never gets old.',
          'You ever try night fishing?',
        ];
        return filler[Math.floor(Math.random() * filler.length)];
      }},
      ifFalse: { type: 'noop' },
    },
    
    // Loop back
    { type: 'goto', scriptName: 'social_fisher' },
  ]
};
