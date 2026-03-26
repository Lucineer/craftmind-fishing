/**
 * v1-troller.js — The Sitka Troller
 * Personality: Real Sitka fishing references, gear talk, practical and no-nonsense.
 * Hypothesis: Most "authentic" for real fishermen, educational by accident.
 */
export default {
  name: 'troller_fisher',
  description: 'Sitka troller with real gear knowledge and local references.',
  hypothesis: 'Most authentic for real fishermen, educational by accident',
  version: 1,
  stats: {},

  steps: [
    { type: 'chat', pick: () => {
      const lines = [
        'Trolling for kings out past the breakwater.',
        'Need to get past the kelp line.',
        'Running a blue label hoochie today.',
        'Switched to a flasher — see if that helps.',
        'Downrigger\'s set at 45 feet.',
        'Copper spoons have been producing.',
        'Water temp\'s holding at 48. Not bad.',
        'Watch for the tide change — that\'s when they move.',
        'Need to check the gear after this pass.',
        'Conditions are right for coho today.',
        'Dragging a herring behind a dodger.',
        'The herring are thick in the channel.',
        'Heading toward the cape for the afternoon pull.',
        'Got my limit yesterday. Today\'s just for fun.',
      ];
      return Math.random() > 0.25 ? lines[Math.floor(Math.random() * lines.length)] : null;
    }},

    { type: 'fish' },

    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Bright chromer. Ocean-fresh.',
          'That\'s a feeder king. Nice.',
          'Good color on that one. Wild fish for sure.',
          'Solid hookset. He\'s in the box.',
          'That\'s why you troll the edge.',
          'Coho! They fight mean but they\'re delicious.',
          'Hoochie did its job.',
          'Headed to the smoker with this one.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Short strike. They\'re just nipping.',
          'Time to change the bait.',
          'Gear might be fouled. Need to pull it.',
          'Need to drop deeper.',
          'Wrong tide. Fish aren\'t moving.',
          'Spent an hour on that drift. Zilch.',
          'Current\'s ripping. Hard to hold depth.',
          'Maybe try mooching instead.',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // Gear check
    { type: 'branch',
      condition: () => Math.random() > 0.6,
      ifTrue: { type: 'chat', pick: () => {
        const gear = [
          '*checks downrigger cable*',
          'Retie that leader.',
          'Making a pass toward the rockpile.',
          'Might need to swap to a green flasher.',
          '*adjusts speed* Two knots, maybe two and a half.',
          'Sharp hooks only. I check every time.',
        ];
        return gear[Math.floor(Math.random() * gear.length)];
      }},
      ifFalse: { type: 'noop' },
    },

    { type: 'goto', scriptName: 'troller_fisher' },
  ]
};
