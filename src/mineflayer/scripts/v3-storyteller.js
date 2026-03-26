/**
 * v3-storyteller.js — The Old Salt
 * Personality: References past catches, tells tall tales, builds narrative across sessions.
 * Hypothesis: Narrative personality creates memorable interactions and repeat engagement.
 * Ideas sourced from: idea-db (v3-storyteller)
 */
export default {
  name: 'storyteller',
  description: 'Old salt who tells fishing stories, exaggerates past catches, and name-drops fish.',
  hypothesis: 'v3 storyteller: narrative personality increases repeat player engagement through memorable stories',
  version: 3,
  stats: {},

  steps: [
    // ── Opening: Pick a story theme ──
    { type: 'chat', pick: () => {
      const stories = [
        // The Big One (7 lines)
        'Back in \'09, I hooked a 60-pound halibut right off this dock. Took me 40 minutes.',
        'I\'ve told you about the salmon, right? The one that got away? No? Good, because I\'m telling you again.',
        'Biggest fish I ever caught was this thick. *holds hands wide apart* No, wider.',
        'My grandfather fished this same spot. Said the fish were bigger then. Said everything was bigger then.',
        // Tall tales (5 lines)
        'Once fought a seal for a fish. We both lost. The fish won.',
        'I\'m not saying I\'ve caught every species in Sitka Sound. I\'m saying I\'ve caught almost every species.',
        'Caught a fish so big it pulled me halfway to Juneau. Had to walk back.',
        'There was this one time during a storm — no, you had to be there.',
        'The tourists always ask "what\'s the biggest fish here?" I say "me."',
        // Nostalgia (5 lines)
        'This dock used to be crowded every morning. Now it\'s just me and the seagulls.',
        'Old Earl used to fish right where you\'re standing. Caught a 40-pound king on his last day.',
        'I remember when you could catch dinner in 20 minutes. Now it\'s a sport.',
        'The harbor master and I go back 30 years. Don\'t tell her I said that.',
        'Used to sell fish off this dock. Now everyone wants organic whatever.',
      ];
      if (Math.random() < 0.1) return null;
      return stories[Math.floor(Math.random() * stories.length)];
    }},

    { type: 'wait', ms: 4000 + Math.random() * 4000 },

    // Fish
    { type: 'fish' },

    // ── Catch/miss reaction (story-integrated) ──
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'That\'s nothing. You should\'ve seen the one last Tuesday.',
          'Decent. But I once caught three that size before breakfast.',
          'Reminds me of a fish I caught in Ketchikan. Similar markings.',
          'Not bad. That one goes in the book.',
          'See? The dock knows me. It provides.',
          'This spot\'s been good to me for 20 years.',
          'Add that to the tally. I\'m keeping count.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Ah, they\'re playing hard to get. Like my ex-wife.',
          'Story of my life: the ones I remember are the ones that got away.',
          'Didn\'t catch anything. But I got a good story out of it.',
          'The fish here are educated. I blame the schools.',
          'Nothing. But my grandfather always said "a bad day fishing still beats a good day working."',
          '*sighs dramatically* The fish are conspiring against me.',
          null,
        ];
        if (Math.random() < 0.15) return null;
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // ── Story continuation (35% chance of follow-up) ──
    { type: 'branch',
      condition: () => Math.random() > 0.65,
      ifTrue: [
        { type: 'chat', pick: () => {
          const followups = [
            'You know what that reminds me of?',
            'Speaking of fish stories...',
            'Oh! I forgot to tell you —',
            'Wait, did I ever tell you about the time...',
            'Anyway, where was I? Right.',
            'And that\'s not even the best part.',
          ];
          return followups[Math.floor(Math.random() * followups.length)];
        }},
        { type: 'wait', ms: 2000 + Math.random() * 2000 },
        { type: 'chat', pick: () => {
          const punchlines = [
            'Never mind. You had to be there.',
            'Actually, I\'ll save that one for later.',
            'On second thought, some stories are better left to the imagination.',
            'It\'s a long one. Maybe when the fish start biting.',
            'Actually, let me focus. I\'m losing my edge.',
            null,
          ];
          if (Math.random() < 0.3) return null;
          return punchlines[Math.floor(Math.random() * punchlines.length)];
        }},
        { type: 'wait', ms: 3000 + Math.random() * 3000 },
      ],
      ifFalse: { type: 'noop' },
    },

    // Loop
    { type: 'goto', scriptName: 'storyteller' },
  ]
};
