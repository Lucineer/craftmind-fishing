/**
 * v3-drunk-ernie.js — The Friendly Bartender Fisherman
 * Personality: Tipsy, cheerful, gives questionable advice, offers "drinks", the life of the dock.
 * Hypothesis: A humorous NPC personality creates viral moments and memorable social interaction.
 * Ideas sourced from: idea-db (v3-drunk-ernie)
 */
export default {
  name: 'drunk_ernie',
  description: 'Tipsy dock regular who dispenses wisdom, questionable advice, and imaginary drinks.',
  hypothesis: 'v3 drunk-ernie: humorous personality creates high-engagement social moments and memorable chat',
  version: 3,
  stats: {},

  steps: [
    // ── Opening: Ernie energy ──
    { type: 'chat', pick: () => {
      const greetings = [
        'HEY! You\'re here! *gestures broadly*',
        'Come sit down. I saved you a spot. It\'s all spots. The dock\'s empty.',
        'You know what I love about fishing? No boss. No wife. No... wait, what was the third thing?',
        'My therapist said I need a hobby. I said "fishing." She said "that\'s already your hobby." So I got a new therapist.',
        '*sips from thermos* It\'s coffee. Definitely coffee.',
        'Best time to fish is when the bar\'s closed. Which is never, in Sitka.',
        'I\'m not drunk. I\'m... maritimely enhanced.',
        'You fish? I fish. We should fish together. I mean, separately. Together. You know what I mean.',
        'The secret to catching fish? Be here when they\'re biting. And be... *gestures* ...here.',
        'Morning! Or afternoon! Or evening! Who can tell in Alaska!',
      ];
      if (Math.random() < 0.1) return null;
      return greetings[Math.floor(Math.random() * greetings.length)];
    }},

    { type: 'wait', ms: 2000 + Math.random() * 3000 },

    // ── Offer something (15% chance) ──
    { type: 'branch',
      condition: () => Math.random() > 0.85,
      ifTrue: { type: 'chat', pick: () => {
        const offers = [
          'Want a sip? ...It\'s hot chocolate. From this morning. Room temperature now.',
          'I brought sandwiches! *checks bag* I forgot the sandwiches.',
          'I have extra bait. It\'s mostly just lunch meat at this point.',
          'Here, hold this. *hands over invisible object* Don\'t drop it, it\'s sentimental.',
          'I packed coffee but I\'m out of cups. So. Use your hands? No? Fair.',
        ];
        return offers[Math.floor(Math.random() * offers.length)];
      }},
      ifFalse: { type: 'noop' },
    },

    { type: 'wait', ms: 1000 + Math.random() * 2000 },

    // Fish
    { type: 'fish' },

    // ── Catch reaction (ernie-style) ──
    { type: 'branch',
      condition: () => Math.random() > 0.45,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'FISH ON! That\'s what I\'m TALKING about! *spills thermos* Worth it.',
          'Hey hey HEY! Look at that! I\'m the best fisherman on this dock! I\'m the only fisherman on this dock!',
          'Beautiful! That fish has good taste. It chose ME.',
          'You see that?! Did you see it?! Neither did I. But I felt it.',
          'Ha! Take THAT, fish! ...I love you, fish. I\'m sorry, fish.',
          'That\'s going in my memoir. "Chapter 7: The Big One."',
          'I should open a restaurant. "Ernie\'s." Catch of the day: whatever I just caught.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Nothing. Fish are on strike. Union issues.',
          'The fish here are too smart. They went to college.',
          'Maybe I should just buy fish. ...Where\'s the fun in that?',
          'Dry run. Must be my aftershave. Fish hate Old Spice.',
          '*stares at water* I can feel them mocking me.',
          'You know who catches a lot of fish? Bears. I should be a bear.',
          null,
        ];
        if (Math.random() < 0.2) return null;
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // ── Questionable advice (30% chance) ──
    { type: 'branch',
      condition: () => Math.random() > 0.7,
      ifTrue: [
        { type: 'chat', pick: () => {
          const advice = [
            'You know the trick? Talk to the fish. They like compliments.',
            'My uncle swore by putting a penny in the bait. He caught nothing but he was very wealthy in spirit.',
            'Best bait? Regret. Fish can smell it.',
            'Fish at night. Can\'t see what you\'re missing that way.',
            'If you haven\'t caught anything in an hour, you\'re doing it wrong. Or the fish are doing it right.',
            'Always fish on an empty stomach. Or a full one. Actually, stomach\'s not important.',
          ];
          return advice[Math.floor(Math.random() * advice.length)];
        }},
        { type: 'wait', ms: 3000 + Math.random() * 4000 },
      ],
      ifFalse: { type: 'noop' },
    },

    // Loop
    { type: 'goto', scriptName: 'drunk_ernie' },
  ]
};
