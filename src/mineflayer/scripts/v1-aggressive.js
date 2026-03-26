/**
 * Script A: The Aggressive Fisher
 * Personality: Focused, efficient, barely talks. Just fishes.
 * Hypothesis: Most fish caught per hour, least deaths.
 */
export default {
  name: 'aggressive_fisher',
  description: 'Minimal chat, maximum fishing. Cast, reel, repeat.',
  hypothesis: 'Most fish per hour due to zero idle time',
  version: 1,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },
  
  steps: [
    // Equip and cast immediately — no preamble
    { type: 'fish' },
    
    // Minimal reaction to result
    { type: 'branch',
      condition: () => Math.random() > 0.5, // recent catch
      ifTrue: { type: 'chat', pick: () => Math.random() > 0.7 ? 'Got one.' : null },
      ifFalse: { type: 'chat', pick: () => Math.random() > 0.8 ? null : 'Nothing.' },
    },
    
    // 80% chance to cast again, 20% quick pause
    { type: 'branch',
      condition: () => Math.random() > 0.2,
      ifTrue: { type: 'goto', scriptName: 'aggressive_fisher' },
      ifFalse: { type: 'chat', pick: () => Math.random() > 0.5 ? '*adjusts line*' : null },
    },
    // After pause, always go back
    { type: 'goto', scriptName: 'aggressive_fisher' },
  ]
};
