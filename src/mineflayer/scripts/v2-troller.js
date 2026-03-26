/**
 * v2-troller.js — The Sitka Troller (Improved)
 * Personality: Real commercial troller with gear knowledge, local conditions, and practical focus.
 * Improvements over v1:
 *   - Added gear failure scenarios and equipment management
 *   - Tide/current awareness in chat
 *   - Better pacing with variable waits
 *   - More authentic commercial fishing language
 *   - 30+ unique chat lines across 5 themes
 */
export default {
  name: 'troller_fisher_v2',
  description: 'Commercial troller with deep gear knowledge, Sitka-specific conditions, and practical focus.',
  hypothesis: 'v2 troller: more authentic commercial fishing feel through gear detail and condition awareness',
  version: 2,
  stats: {},

  steps: [
    // ── Opening: gear setup or condition check (8 lines) ──
    { type: 'chat', pick: () => {
      const lines = [
        // Gear (4)
        'Running a flasher and hoochie today. Classic setup.',
        'Switched to a glow spoon. Low light conditions.',
        'Downrigger\'s at 45 feet. See what\'s down there.',
        'Need to re-tie that leader. Frayed from last trip.',
        // Conditions (4)
        'Tide\'s ebbing. Fish should be moving.',
        'Water temp\'s 48 degrees. Right in the zone.',
        'Bar\'s choppy out past the breakwater. Careful.',
        'Sky\'s that color. Weather\'s coming in four hours.',
      ];
      if (Math.random() < 0.15) return null;
      return lines[Math.floor(Math.random() * lines.length)];
    }},

    { type: 'wait', ms: 2000 + Math.random() * 3000 },

    { type: 'fish' },

    // ── Catch reaction: commercial fisherman style (8 lines) ──
    { type: 'branch',
      condition: () => Math.random() > 0.35,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Bright chromer. Ocean-bright. That\'s the money fish.',
          'Coho! Put him on ice.',
          'Good flash on that one. Wild, not hatchery.',
          'Clean hookset. He\'s in the box.',
          'That\'s a feeder king. Nice color.',
          'Solid pull. Gear held.',
          'Kings running deep today. Downrigger was right.',
          'That\'s what a properly tuned setup gets you.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      // ── Miss: practical, not emotional (7 lines) ──
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Short strike. They\'re nipping, not hitting.',
          'Gear might be fouled. Need to pull and check.',
          'Wrong phase of the tide. Fish aren\'t moving yet.',
          'Current\'s ripping. Hard to hold the depth.',
          'Bait\'s washed out. Time to re-rig.',
          'Too bright out there. They\'re holding deep.',
          'Nothing on the sounder either. Move to the next spot.',
        ];
        if (Math.random() < 0.2) return null;
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // ── Gear check / boat management (7 lines) ──
    { type: 'branch',
      condition: () => Math.random() > 0.45,
      ifTrue: [
        { type: 'chat', pick: () => {
          const gear = [
            '*checks downrigger cable* Still clean.',
            '*adjusts throttle* Two knots. Maybe two and a half.',
            'Sharp hooks only. I check every pull.',
            'Fuel\'s good for another four hours at least.',
            'Making a pass toward the rock pile.',
            'That flasher needs a new skirt. Faded.',
            'Need to check the bait roll. Might be spinning.',
          ];
          if (Math.random() < 0.2) return null;
          return gear[Math.floor(Math.random() * gear.length)];
        }},
        { type: 'wait', ms: 4000 + Math.random() * 4000 },
      ],
      ifFalse: { type: 'noop' },
    },

    // Loop
    { type: 'goto', scriptName: 'troller_fisher_v2' },
  ]
};
