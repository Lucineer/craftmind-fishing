/**
 * v2-social.js — The Sitka Regular (Improved)
 * Personality: Chatty local who knows everyone, asks questions, tells Sitka stories.
 * Improvements over v1:
 *   - Variable pacing (wait steps 2-8s)
 *   - 5 conversation themes (weather, wildlife, local gossip, fishing wisdom, jokes)
 *   - More natural silence (15-25% null returns)
 *   - Mix of reactions: not just catch/miss but also observations
 *   - 30+ unique chat lines
 */
export default {
  name: 'social_fisher_v2',
  description: 'Chatty Sitka local who treats the dock like a social club. Variable pacing, diverse topics.',
  hypothesis: 'v2 social: better engagement through topic variety and natural pacing',
  version: 2,
  stats: {},

  steps: [
    // ── Opening theme (5 topics, weighted random) ──
    { type: 'chat', pick: () => {
      const lines = [
        // Weather & conditions (5 lines)
        'Rain\'s coming. You can taste it.',
        'Clear skies today. Got lucky.',
        'Wind shifted overnight. Different drift now.',
        'Nice out here. Even the tourists are quiet.',
        'Barometer\'s dropping. Fish know it too.',
        // Wildlife (4 lines)
        'Saw a bald eagle circling earlier. Good sign.',
        'Seals are out. Means the herring are running.',
        'Sea otter floated right past me this morning.',
        'Whale spout off the point. Tourist season\'s starting.',
        // Local gossip (4 lines)
        'Heard the ferry\'s running late again.',
        'New coffee shop opened on Lincoln Street. Not bad.',
        'Old Peters finally sold his boat. End of an era.',
        'Someone tagged the boardwalk. Downtown\'s changing.',
        // Fishing wisdom (4 lines)
        'Dark water\'s where the big ones hide.',
        'If the gulls are sitting, the fish are deep.',
        'Secret\'s in the retrieve speed. Too fast, they spook.',
        'Half the catch is showing up at the right time.',
        // Jokes & casual (5 lines)
        'I don\'t always fish. But when I do, I exaggerate.',
        'Why did the fisherman fall asleep? He was a rock bass.',
        'My wife says I fish too much. I said "that\'s a lot of bass."',
        'Fish are like opinions — everyone\'s got one.',
        'If fishing was easy, they\'d call it catching.',
      ];
      // 20% chance of silence
      if (Math.random() < 0.2) return null;
      return lines[Math.floor(Math.random() * lines.length)];
    }},

    // Variable pause — sometimes quick, sometimes thoughtful
    { type: 'branch',
      condition: () => Math.random() > 0.5,
      ifTrue: { type: 'wait', ms: 3000 + Math.random() * 3000 },
      ifFalse: { type: 'noop' },
    },

    // Fish with error handling wrapper
    { type: 'action', name: 'safe_fish', fn: function(bot) {
      if (bot.fishing) return Promise.resolve(); // already fishing
      return bot.fish().catch(() => {}); // ignore errors
    }},

    // ── Catch reaction (7 unique lines) ──
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Got one! Not bad for a Thursday.',
          'Fish on! There we go.',
          'Decent pull. Respect to the fish.',
          'Bright chrome on that one. Ocean fresh.',
          'See? Patience pays.',
          'That\'s going on the grill tonight.',
          'Not bad! The dock\'s been kind today.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      // ── Miss reaction (7 unique lines) ──
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Dry run. They\'re being picky today.',
          'Nothing. Story of my life.',
          'Well, it\'s the fishing, not the catching.',
          'Skunked again. Classic.',
          'Maybe I need better bait. Or a better attitude.',
          'The fish union called a strike, apparently.',
          'Nothing. But hey, the view\'s free.',
        ];
        // 25% chance of silence on miss
        if (Math.random() < 0.25) return null;
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // ── Mid-session filler (diverse observations, 8 lines) ──
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: [
        { type: 'chat', pick: () => {
          const fillers = [
            'You ever just sit and listen to the water?',
            'I could do this every day. Oh wait, I do.',
            'This dock has seen some sunsets.',
            'Sitka in the spring. Can\'t beat it.',
            'Anyone want coffee? I brought a thermos.',
            '*checks watch* Time flies when you\'re not catching.',
            'The harbor\'s quiet today. I like that.',
            'Sun should be coming around the mountain soon.',
          ];
          if (Math.random() < 0.15) return null;
          return fillers[Math.floor(Math.random() * fillers.length)];
        }},
        // Variable break: 3-7 seconds
        { type: 'wait', ms: 3000 + Math.random() * 4000 },
      ],
      ifFalse: { type: 'noop' },
    },

    // Loop
    { type: 'goto', scriptName: 'social_fisher_v2' },
  ]
};
