/**
 * Round 2 Script: Pure Fisher (baseline)
 * Hypothesis: Minimal chat, maximum fishing. Sets the performance ceiling.
 * Every loop: fish. That's it.
 */
export default {
  name: 'pure_fisher',
  description: 'Baseline. Minimal personality, maximum fishing output.',
  hypothesis: 'r2 pure_fisher: sets the fish/min ceiling for comparison',
  version: 2,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },

  steps: [
    { type: 'fish' },
    // Small silence between casts for natural pacing
    { type: 'wait', ms: 1000 + Math.random() * 500 },
    { type: 'goto', scriptName: 'pure_fisher' },
  ]
};
