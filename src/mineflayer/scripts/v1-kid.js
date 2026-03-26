/**
 * v1-kid.js — The Excited Beginner
 * Personality: Everything is amazing, all caps, lots of exclamation marks.
 * Hypothesis: Most "fun" personality, best for kids (Sitka kids game angle).
 */
export default {
  name: 'kid_fisher',
  description: 'Excited beginner who treats every moment like the best thing ever.',
  hypothesis: 'Most fun personality, best for kids and family gameplay',
  version: 1,
  stats: {},

  steps: [
    { type: 'chat', pick: () => {
      const lines = [
        'I LOVE FISHING!', 'This is gonna be SO COOL!',
        'OKAY HERE WE GO!', 'Are you watching?!',
        'First cast of the day!', 'This is the BEST SPOT EVER!',
        'My mom said I\'d catch something big today!',
        'I\'ve been waiting ALL MORNING for this!',
        'Ready ready ready!', 'GOING FOR IT!',
        'Do you think I\'ll get a big one?!',
        'FISHING IS MY FAVORITE THING!',
        'I brought snacks just in case!',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }},

    { type: 'fish' },

    { type: 'branch',
      condition: () => Math.random() > 0.35,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'WHOA I GOT ONE!!!', 'DID YOU SEE THAT?!?!',
          'IT\'S SO BIG!!!', 'THIS IS THE BEST DAY OF MY LIFE!',
          'I CAN\'T BELIEVE IT!!!', 'LOOK LOOK LOOK!!!',
          'MOM DAD LOOK!!!', 'IT\'S HUGE!!!',
          'I\'M THE BEST FISHERMAN EVER!',
          'Wait wait wait— HA GOT IT!',
          'THIS IS EVEN BETTER THAN LAST TIME!',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Aw... maybe next time!',
          'It\'s okay I\'M NOT GIVING UP!',
          'Where ARE they?!', 'Come onnnn fish!',
          'The fish are HIDING from me!',
          'I\'ll try again! I\'LL TRY A HUNDRED TIMES!',
          'This one\'s definitely gonna work!',
          'They\'re just playing hard to get!',
        ];
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // Random excited interjection
    { type: 'branch',
      condition: () => Math.random() > 0.4,
      ifTrue: { type: 'chat', pick: () => {
        const fillers = [
          'This is SO fun!', 'I could stay here FOREVER!',
          '*jumps up and down*', 'I\'m not cold at ALL!',
          'Best! Day! EVER!', 'Can we come back tomorrow?!',
          'I wanna show EVERYONE my fish!',
          '*wiggles excitedly*', 'Do fish have feelings?',
        ];
        return fillers[Math.floor(Math.random() * fillers.length)];
      }},
      ifFalse: { type: 'noop' },
    },

    { type: 'goto', scriptName: 'kid_fisher' },
  ]
};
