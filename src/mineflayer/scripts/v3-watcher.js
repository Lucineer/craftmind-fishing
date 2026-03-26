/**
 * v3-watcher.js — The Wildlife Watcher
 * Personality: Sitka naturalist who fishes but gets distracted by eagles, whales, otters.
 * Features: 70% wildlife observations, 20% fishing, 10% nature philosophy.
 * 40+ unique chat lines.
 */
export default {
  name: 'watcher_fisher_v3',
  description: 'Sitka naturalist who fishes but is equally interested in eagles, whales, and tide pools.',
  hypothesis: 'v3 watcher: memorable wildlife observations create engaging personality',
  version: 3,
  stats: {},

  steps: [
    // ── Opening: wildlife observation (8 lines) ──
    { type: 'chat', pick: () => {
      const lines = [
        'Is that a sea otter cracking a clam on its belly?',
        "A bald eagle just took a fish not fifty yards from here!",
        'Humpback blow! Due east, past the channel marker.',
        'Harbor seal pup on the rocks. Do not startle it.',
        "The raven's been following me all morning. Smart bird.",
        'Sea otter raft out there. Must be twenty of them.',
        'Eagle nest is active again. Saw both adults circling.',
        'Dall porpoise surfing the wake of a tour boat. Gorgeous.',
      ];
      if (Math.random() < 0.2) return null;
      return lines[Math.floor(Math.random() * lines.length)];
    }},

    // ── 30% chance: get distracted, forget to fish ──
    { type: 'branch',
      condition: () => Math.random() < 0.3,
      ifTrue: [
        { type: 'chat', pick: () => {
          const distractions = [
            'Hold on—look at that. That whale is breaching!',
            'The otters are playing. Watch—see how they twirl?',
            'Eagle just dove. Missed. Trying again.',
            'Bear on the shoreline! Far enough. But still.',
            'The tide pools are incredible right now. Starfish everywhere.',
            'Two ravens doing a midair dance. Courting behavior.',
            'Seals popping up like periscopes. Curious little guys.',
            'There is a hermit crab the size of my fist under that rock.',
            'The kelp forest is swaying like underwater trees.',
            'A kingfisher! Flash of blue. Gone.',
          ];
          if (Math.random() < 0.1) return null;
          return distractions[Math.floor(Math.random() * distractions.length)];
        }},
        // Long distracted pause instead of fishing
        { type: 'wait', ms: 6000 + Math.random() * 6000 },
        { type: 'goto', scriptName: 'watcher_fisher_v3' },
      ],
      ifFalse: { type: 'noop' },
    },

    { type: 'wait', ms: 1000 + Math.random() * 2000 },
    { type: 'fish' },

    // ── Fishing reaction (while watching wildlife) ──
    { type: 'branch',
      condition: () => Math.random() > 0.45,
      ifTrue: { type: 'chat', pick: () => {
        const catches = [
          'Oh! A fish. Was not expecting that—was watching the eagle.',
          'Salmon on! Pink run maybe?',
          'Got one! The wildlife was a lucky charm.',
          'Nice. That is a wild coho, see the spots?',
          'Caught one while that otter watched. Felt judged.',
          'Pull! This one is strong. Must be fresh from the ocean.',
        ];
        return catches[Math.floor(Math.random() * catches.length)];
      }},
      ifFalse: { type: 'chat', pick: () => {
        const misses = [
          'Nothing. The fish are hiding from the eagles too.',
          'No bite. But I saw a whale fluke while waiting, so.',
          'Skunked. The tide pools were more productive anyway.',
          'Quiet line. Might be watching otters instead of fish.',
        ];
        if (Math.random() < 0.3) return null;
        return misses[Math.floor(Math.random() * misses.length)];
      }},
    },

    // ── Nature philosophy (10% of the time) ──
    { type: 'branch',
      condition: () => Math.random() < 0.15,
      ifTrue: [
        { type: 'chat', pick: () => {
          const philosophy = [
            'Everything is connected out here. The salmon feed the eagles.',
            'Sitka without wildlife would just be pretty scenery.',
            'Fishing teaches you to pay attention to the small things.',
            'The ocean does not care about us. That is what makes it holy.',
            'I do not come here for the fish. I come here for this.',
            'Every tide pool is a universe.',
          ];
          return philosophy[Math.floor(Math.random() * philosophy.length)];
        }},
        { type: 'wait', ms: 5000 + Math.random() * 3000 },
      ],
      ifFalse: [
        // ── More wildlife observations ──
        { type: 'chat', pick: () => {
          const more = [
            'Saw a salmon leaping upstream earlier. Spawning run starting.',
            'Moon jellyfish in the shallows. Translucent and perfect.',
            'The gulls are going crazy. Bait ball must be near.',
            'Whale spout again. Sounds like a steam engine.',
            'Stellar sea lion checking me out. Big boy.',
            'Cormorant drying its wings on the channel marker.',
            'The tide is pulling out fast. Revealing a lot of beach.',
            'Pair of harlequin ducks in the kelp. Stunning colors.',
          ];
          if (Math.random() < 0.25) return null;
          return more[Math.floor(Math.random() * more.length)];
        }},
        { type: 'wait', ms: 3000 + Math.random() * 4000 },
      ],
    },

    // Loop
    { type: 'goto', scriptName: 'watcher_fisher_v3' },
  ]
};
