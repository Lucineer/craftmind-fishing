/**
 * v2-veteran.js — The Old Salt (Improved)
 * Personality: Retired fisherman with decades of stories, gives advice, waxes nostalgic.
 * Improvements over v1:
 *   - Longer stories with more specific historical details
 *   - Seasonal/time awareness in chat
 *   - Better pacing with variable waits (some very long pauses for storytelling effect)
 *   - 5 themes: memories, advice, stories, observations, dry humor
 *   - 30+ unique chat lines
 */
export default {
  name: 'veteran_fisher_v2',
  description: 'Retired Sitka fisherman with decades of stories. Slow, deliberate, memorable.',
  hypothesis: 'v2 veteran: more memorable through specific stories and deliberate pacing',
  version: 2,
  stats: {},

  steps: [
    // ── Opening: story, advice, or observation (11 lines) ──
    { type: 'chat', pick: () => {
      const lines = [
        // Memories (4)
        'Reminds me of the winter of \'89. Cold enough to freeze your line solid.',
        'My old captain could read the water like a book. Me, I\'m still on chapter one.',
        'Fifty years I\'ve been standing on docks. This one\'s my favorite.',
        'Caught my first king right here. Must\'ve been... \'72? No, \'71.',
        // Advice (3)
        'Watch the birds. When they dive, the bait\'s up, and the fish follow.',
        'Rule number one: the fish don\'t care about your plans.',
        'Best bait? Patience. Second best? Fresh herring.',
        // Observations (4)
        'The light\'s changing. Silver hour coming.',
        'Different kind of quiet today. The mountains feel closer.',
        'Spring comes slow in Sitka. But it comes.',
        'Harbor\'s half-empty. Everyone\'s out on the water already.',
      ];
      // 25% chance of silence — old men don't always speak
      if (Math.random() < 0.25) return null;
      return lines[Math.floor(Math.random() * lines.length)];
    }},

    // Deliberate pause — the veteran doesn't rush
    { type: 'wait', ms: 3000 + Math.random() * 5000 },

    { type: 'fish' },

    // ── Catch reaction (8 lines) ──
    { type: 'branch',
      condition: () => Math.random() > 0.35,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Now THAT\'s a fish. Haven\'t seen one like that in years.',
          'Decent. I caught bigger back in the day, but this\'ll do.',
          'Look at the color on that. Wild, no doubt.',
          'The old hands still work. Not bad for an old man.',
          'That\'s what showing up gets you.',
          'Clean catch. The river provides.',
          'Patience. That\'s the whole secret right there.',
          'Hmm. That one\'s got some weight. Respect.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      // ── Miss reaction (7 lines) ──
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Nothing. The water owes us nothing.',
          'Been skunked before. Will be skunked again.',
          'Patience. The fish run on their schedule.',
          'I\'ve waited longer for worse.',
          'Current\'s wrong. Tomorrow maybe.',
          'The fish know something we don\'t. Clearly.',
          'Sometimes you just hold the line and watch the world.',
        ];
        // 30% silent on miss — the veteran accepts it
        if (Math.random() < 0.3) return null;
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // ── Story break (9 lines, long pause after) ──
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: [
        { type: 'chat', pick: () => {
          const stories = [
            'Let me tell you about the time we lost the rudder in a blow...',
            'Back when the runs were thick, you could practically reach in.',
            'My father used to say: a bad day fishing beats a good day working.',
            'Pro tip from forty years: fish the edges. Always the edges.',
            'Worst storm I ever fished in was \'96. Lost three pots.',
            'Learned more from one terrible season than ten good ones.',
            'If you\'re not losing gear occasionally, you\'re not fishing hard enough.',
            'The trick isn\'t catching. It\'s knowing when to go home.',
            'Somebody asked me once why I still fish. I said "because I don\'t know how to stop."',
          ];
          if (Math.random() < 0.15) return null;
          return stories[Math.floor(Math.random() * stories.length)];
        }},
        // Long storytelling pause
        { type: 'wait', ms: 5000 + Math.random() * 5000 },
      ],
      ifFalse: [
        { type: 'chat', pick: () => {
          const dry = [
            'Hmm.',
            '*adjusts hat*',
            '*watches the water*',
          ];
          return dry[Math.floor(Math.random() * dry.length)];
        }},
        { type: 'wait', ms: 2000 + Math.random() * 3000 },
      ],
    },

    // Loop
    { type: 'goto', scriptName: 'veteran_fisher_v2' },
  ]
};
