/**
 * v5-tree-veteran.js — The Old Salt (Tree Mode)
 *
 * Tree-based hierarchical version of the veteran personality.
 * Demonstrates how skill trees provide:
 * - Clearer structure with named sub-goals
 * - Preconditions and postconditions for flow control
 * - Better composability and reusability
 *
 * Hypothesis: Tree mode enables more complex, realistic behaviors
 * while maintaining the same personality as flat scripts.
 */
export default {
  name: 'tree_veteran',
  description: 'Old salt personality in hierarchical skill tree mode',
  hypothesis: 'Tree mode provides better structure while maintaining memorable personality',
  version: 5,

  // ── TREE DEFINITION ─────────────────────────────────────────────────────────────

  tree: {
    root: 'master_fisher',

    nodes: {
      /**
       * ROOT: Master Fisher
       * The main goal — catch fish while being an old salt personality
       */
      'master_fisher': {
        description: 'The veteran angler who always has a story',
        children: ['pre_fishing_routine', 'casting_and_waiting', 'post_catch_reaction'],
        preconditions: ['has_rod'],
        postconditions: ['session_complete']
      },

      /**
       * PHASE 1: Pre-Fishing Routine
       * Share wisdom before casting
       */
      'pre_fishing_routine': {
        description: 'Share old wisdom before casting',
        steps: [
          {
            type: 'chat',
            pick: () => {
              const wisdom = [
                'Reminds me of \'89.',
                'Worse season than \'04.',
                'Always cast upstream.',
                'Watch the birds — they know.',
                'Back in my day we didn\'t have these fancy rods.',
                'The salmon run late this year.',
                'I\'ve fished every inlet from here to Ketchikan.',
                'You can smell when the fish are running.',
                'My old captain used to say: patience is the only bait you need.',
                'This spot? My father showed me this spot.',
                'Tide\'s not right yet. Give it an hour.',
                'Seen bigger catches, seen smaller. It all evens out.',
              ];
              return Math.random() > 0.2 ? wisdom[Math.floor(Math.random() * wisdom.length)] : null;
            }
          },
          { type: 'wait', ms: 2000 },
        ],
        postconditions: ['wisdom_shared']
      },

      /**
       * PHASE 2: Casting and Waiting
       * The actual fishing action
       */
      'casting_and_waiting': {
        description: 'Cast the line and wait for a bite',
        children: ['cast_line', 'wait_for_bite'],
        preconditions: ['wisdom_shared', 'at_water'],
        postconditions: ['hooked_fish']
      },

      'cast_line': {
        description: 'Cast the fishing line',
        steps: [
          { type: 'fish' },
          { type: 'set', key: 'has_rod', value: true },
          { type: 'set', key: 'at_water', value: true },
        ],
        postconditions: ['line_cast']
      },

      'wait_for_bite': {
        description: 'Wait patiently for fish to bite',
        steps: [
          { type: 'wait', ms: 3000 },
        ],
        preconditions: ['line_cast'],
        postconditions: ['hooked_fish']
      },

      /**
       * PHASE 3: Post-Catch Reaction
       * React based on whether we caught something
       */
      'post_catch_reaction': {
        description: 'Share thoughts on the catch (or lack thereof)',
        children: ['celebrate_catch', 'lament_miss'],
        preconditions: ['hooked_fish'],
        postconditions: ['reaction_complete']
      },

      'celebrate_catch': {
        description: 'Celebrate a successful catch',
        steps: [
          {
            type: 'branch',
            condition: () => Math.random() > 0.4,
            ifTrue: {
              type: 'chat',
              pick: () => {
                const catches = [
                  'Now THAT\'s a fish. Haven\'t seen one like that since the old days.',
                  'Decent. But I caught a 40-pounder right here in \'97.',
                  'Not bad. Not bad at all.',
                  'See? Patience. That\'s all it takes.',
                  'Took the bait clean. Respect.',
                  'Back when the runs were thick, you\'d get three of these before breakfast.',
                  'Good weight on that one. Healthy stock.',
                ];
                return catches[Math.floor(Math.random() * catches.length)];
              }
            },
            ifFalse: { type: 'noop' }
          },
        ],
        preconditions: ['fish_caught'],
        postconditions: ['celebrated']
      },

      'lament_miss': {
        description: 'Share wisdom when fish aren\'t biting',
        steps: [
          {
            type: 'branch',
            condition: () => Math.random() > 0.4,
            ifTrue: {
              type: 'chat',
              pick: () => {
                const misses = [
                  'They\'re not biting. Current\'s wrong.',
                  'Patience. The fish don\'t run on your schedule.',
                  'I\'ve waited longer for worse fish.',
                  'Could be hours yet. That\'s fishing.',
                  'The water\'s too warm. Changes everything.',
                  'Sometimes you get skunked. Part of the game.',
                  'Used to be you couldn\'t keep them off the hook here.',
                ];
                return misses[Math.floor(Math.random() * misses.length)];
              }
            },
            ifFalse: { type: 'noop' }
          },
        ],
        preconditions: ['fish_missed'],
        postconditions: ['lamented']
      },

      /**
       * OPTIONAL: Share Stories
       * 40% chance to share additional wisdom
       */
      'share_stories': {
        description: 'Share a story or advice (optional)',
        steps: [
          {
            type: 'branch',
            condition: () => Math.random() > 0.6,
            ifTrue: {
              type: 'chat',
              pick: () => {
                const stories = [
                  'Let me tell you about the winter of \'92...',
                  'Pro tip: don\'t fish against the wind.',
                  'The trick is reading the water. Dark patches mean depth.',
                  'Best fish I ever caught? Didn\'t even want to eat it.',
                  'Learned more from one bad season than ten good ones.',
                  'If the gulls are diving, fish are jumping. Simple as that.',
                  'Always keep your line wet. Always.',
                ];
                return stories[Math.floor(Math.random() * stories.length)];
              }
            },
            ifFalse: { type: 'noop' }
          },
        ],
        preconditions: ['reaction_complete'],
        postconditions: ['stories_shared']
      },
    }
  },

  // ── LEGACY FLAT MODE (for comparison) ────────────────────────────────────────────
  // This is what the same personality looks like in flat mode
  // Note: Tree mode provides:
  // 1. Named sub-goals (e.g., 'pre_fishing_routine', 'celebrate_catch')
  // 2. Explicit preconditions (e.g., 'has_rod', 'hooked_fish')
  // 3. Better composability (can reorder/reuse sub-skills)
  // 4. Progress tracking per skill node
  // 5. Clear failure/retry paths per sub-goal

  stats: {},
};
