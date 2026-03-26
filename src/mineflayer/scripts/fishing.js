/**
 * Cody's Fishing Scripts
 * Each script is a sequence of steps with weighted random chat at key points.
 */

export function createFishingScripts(bot) {
  const waterId = bot.registry.blocksByName.water?.id;

  function findWater() {
    return bot.findBlock({ matching: waterId, maxDistance: 10 });
  }

  function hasRod() {
    return bot.inventory.items().some(i => i.name.includes('fishing_rod'));
  }

  function equipRod() {
    const rod = bot.inventory.items().find(i => i.name.includes('fishing_rod'));
    if (rod) return bot.equip(rod, 'hand');
    return Promise.resolve();
  }

  return [
    // Main fishing loop — the bread and butter
    {
      name: 'afternoon_fish',
      steps: [
        { type: 'action', name: 'walk_to_water', fn: async () => {
          const water = findWater();
          if (water && bot.pathfinder) {
            // Just look at water, don't pathfind (too slow, causes issues)
            bot.lookAt(water.position);
          }
        }},
        { type: 'chat', pick: () => weightedRandom({
          0.35: '*gets rod ready*',
          0.25: 'Lines in.',
          0.15: 'Here we go.',
          0.10: 'Quiet out here.',
          0.08: 'This spot\'s been good to me.',
          0.07: null, // sometimes silent
        })},
        { type: 'fish' },
        { type: 'branch', condition: () => bot.inventory.items().some(i => 
          ['cod', 'salmon', 'tropical_fish', 'pufferfish'].includes(i.name)
        ), ifTrue: { type: 'chat', pick: () => weightedRandom({
          0.35: 'Got one!',
          0.20: 'Not bad.',
          0.15: 'Fish on!',
          0.10: 'There we go.',
          0.08: '*holds up catch*',
          0.07: 'Decent size.',
          0.05: null, // just nod
        })}, ifFalse: { type: 'chat', pick: () => weightedRandom({
          0.30: 'Nothing.',
          0.25: 'Patience.',
          0.15: '*checks line*',
          0.10: 'They\'re not biting.',
          0.10: 'Dry run.',
          0.10: null, // just reel in silently
        })}},
        // Sometimes fish again, sometimes do something else
        { type: 'branch', condition: () => Math.random() > 0.35,
          ifTrue: { type: 'goto', scriptName: 'afternoon_fish' },
          ifFalse: { type: 'chat', pick: () => weightedRandom({
            0.30: 'Maybe a different spot.',
            0.30: '*stretches*',
            0.20: 'Taking a breather.',
            0.20: null,
          })}
        },
      ]
    },

    // Brief look-around between fishing sessions
    {
      name: 'look_around',
      steps: [
        { type: 'action', name: 'look_around', fn: () => {
          // Look in random directions
          const yaw = Math.random() * Math.PI * 2;
          bot.look(yaw, 0);
        }},
        { type: 'chat', pick: () => weightedRandom({
          0.30: '*scans the horizon*',
          0.25: '*checks the sky*',
          0.20: 'Nice day.',
          0.15: null,
          0.10: 'Hm.',
        })},
        { type: 'wait', ms: 3000 },
        { type: 'goto', scriptName: 'afternoon_fish' },
      ]
    },

    // Take a break — sit (crouch), look at water
    {
      name: 'take_break',
      steps: [
        { type: 'action', name: 'crouch', fn: () => {
          bot.setControlState('sneak', true);
          setTimeout(() => bot.setControlState('sneak', false), 5000);
        }},
        { type: 'chat', pick: () => weightedRandom({
          0.30: '*sits down*',
          0.25: 'Needed that.',
          0.15: 'Ahh.',
          0.15: 'Getting tired.',
          0.15: null,
        })},
        { type: 'wait', ms: 8000 },
        { type: 'chat', pick: () => weightedRandom({
          0.40: 'Back to it.',
          0.30: 'Alright.',
          0.20: '*stands up*',
          0.10: null,
        })},
        { type: 'goto', scriptName: 'afternoon_fish' },
      ]
    },

    // Greet a player
    {
      name: 'greet_player',
      steps: [
        { type: 'action', name: 'face_player', fn: () => {
          const player = bot.nearestPlayer();
          if (player?.entity) bot.lookAt(player.entity.position);
        }},
        { type: 'chat', pick: () => weightedRandom({
          0.25: 'Hey.',
          0.20: 'Morning.',
          0.15: 'What brings you out here?',
          0.10: 'Haven\'t seen you in a while.',
          0.10: '*nods*',
          0.10: 'Welcome to Sitka.',
          0.05: 'Catch anything?',
          0.05: null,
        })},
        { type: 'goto', scriptName: 'afternoon_fish' },
      ]
    },
  ];
}

function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [w]) => s + parseFloat(w), 0);
  let roll = Math.random() * total;
  for (const [w, outcome] of entries) {
    roll -= parseFloat(w);
    if (roll <= 0) return outcome;
  }
  return entries[entries.length - 1][1];
}
