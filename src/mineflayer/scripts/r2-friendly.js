/**
 * Round 2 Script: Friendly Neighbor
 * Personality: Greets others, comments on surroundings, helpful. Always fishes.
 * Hypothesis: Social engagement without skip-paths maintains fishing + adds uniqueness.
 */
export default {
  name: 'friendly_neighbor',
  description: 'Chatty neighbor who greets everyone, comments on surroundings. Always fishes.',
  hypothesis: 'r2 friendly: social engagement without skip-paths maintains fishing rate',
  version: 2,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },

  steps: [
    // Friendly greeting or observation
    { type: 'chat', pick: () => {
      const lines = [
        'Morning! Beautiful day for it.',
        'Hey there. How\'s the water today?',
        'Nice spot you picked.',
        'You get anything yet? I\'m just getting started.',
        'Wind\'s picking up a bit. Might be good for the bite.',
        'Brought extra coffee if anyone wants some.',
        '*waves at the harbor*',
        'Love this time of day. Light on the water.',
        'Anyone else hear that seal last night?',
        null, null, // 20% silent
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }},

    { type: 'wait', ms: 1500 + Math.random() * 2000 },

    // ALWAYS fish
    { type: 'fish' },

    // Post-fish social reaction
    { type: 'chat', pick: () => {
      const catches = [
        'Got one! See? Told you this spot was good.',
        'Hey, I got a bite! ...And it\'s a keeper!',
        'Yes! Anyone else getting action?',
        'First one of the day. Always special.',
        'Not bad! Not bad at all.',
      ];
      const misses = [
        'Nothing yet. That\'s fishing though.',
        'They\'re playing hard to get today.',
        'Should\'ve brought the other rod.',
        'Maybe I need to switch bait.',
        null, null, null,
      ];
      const pool = Math.random() > 0.35 ? catches : misses;
      return pool[Math.floor(Math.random() * pool.length)];
    }},

    { type: 'wait', ms: 1000 + Math.random() * 2000 },
    { type: 'goto', scriptName: 'friendly_neighbor' },
  ]
};
