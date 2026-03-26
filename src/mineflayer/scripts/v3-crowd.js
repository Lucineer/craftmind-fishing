/**
 * v3-crowd.js — The Dock Crowd (DeepSeek-generated, refined)
 * Personality: Group of Sitka dock regulars fishing and chatting together.
 * Features: 6 themes, gear failures, player reactions, varied pacing.
 * 50+ unique chat lines.
 */
export default {
    name: 'crowd_fisher_v3',
    description: 'A group of Sitka dock regulars fishing and chatting. Multiple voices, authentic dock atmosphere.',
    hypothesis: 'v3 crowd: lively dock atmosphere through varied themes, gear failures, and natural pacing',
    version: 3,
    stats: {},

    steps: [
        // ── Gear failure (10% chance) ──
        {
            type: 'branch',
            condition: () => Math.random() < 0.1,
            ifTrue: [
                {
                    type: 'chat',
                    pick: () => {
                        const lines = [
                            'Dangit, snagged on the pilings again.',
                            'Lost another Pixie to the kelp bed.',
                            "My line's frayed—should've checked it yesterday.",
                            "That's the third hook today. Bottom's hungry.",
                            'Need to retie this leader. Got carried away talking.',
                        ];
                        return lines[Math.floor(Math.random() * lines.length)];
                    }
                },
                { type: 'set', key: 'gearFail', value: true },
                { type: 'wait', ms: 3000 + Math.random() * 2000 },
            ],
            ifFalse: { type: 'noop' },
        },

        // ── React to players (if any seen) ──
        {
            type: 'branch',
            condition: function(ctx) { return this?.context?.playersSeen?.size > 0; },
            ifTrue: [
                {
                    type: 'chat',
                    pick: () => {
                        const lines = [
                            "Hey there, tryin' your luck?",
                            "Watch the tide—it'll turn in an hour.",
                            "They're bitin' on herring today.",
                            "Careful of the sea lions—they'll steal your catch.",
                            'Nice day for it, eh?',
                            'Saw a big one break water near the breakwater earlier.',
                        ];
                        if (Math.random() < 0.2) return null;
                        return lines[Math.floor(Math.random() * lines.length)];
                    }
                },
                { type: 'wait', ms: 2000 + Math.random() * 2000 },
            ],
            ifFalse: { type: 'noop' },
        },

        // ── Main chat: 6 themed pools (25% silence) ──
        {
            type: 'branch',
            condition: () => Math.random() < 0.25,
            ifTrue: { type: 'noop' },
            ifFalse: [
                {
                    type: 'chat',
                    pick: () => {
                        const sitkaHistory = [
                            "My grandpa worked at the old sawmill where the college is now.",
                            "Remember when the Russian Bishop's House was still falling apart? Glad they fixed it up.",
                            'Sheldon Jackson used to have that old tramp steamer tied up here.',
                            "The whole waterfront burned in '66. Rebuilt everything you see.",
                            'Used to be cannery noise day and night. Different kind of quiet now.',
                        ];
                        const wildlife = [
                            'Saw a humpback breeching off Japonski this morning. Full breach.',
                            "Eagle's nest up in that spruce by Swan Lake. Two chicks this year.",
                            'River otters been raiding crab pots again. Cheeky little thieves.',
                            'Black bear crossed Halibut Point Road yesterday. Big fella.',
                            'Sea lions hauled out on the buoy by the Coast Guard station.',
                        ];
                        const weather = [
                            "Fog's gonna roll in off the sound by evening.",
                            "Barometer's dropping. Might get some rain tomorrow.",
                            "Sun's out but that east wind's still chilly.",
                            "Tide's running fast today. Six-knot current at the narrows.",
                            "Cleared up nice. Can see Edgecumbe's whole snowcap.",
                        ];
                        const fishingTechnique = [
                            'Jigging works better when the tide is slack.',
                            "I like a green-and-white hoochie for silvers.",
                            'Let it sink to bottom, then three cranks up.',
                            'Feel that tap-tap? Do not set the hook yet.',
                            'Keep your drag loose—kings run hard here.',
                        ];
                        const gossip = [
                            'Heard the charter guys limited out by Biorka yesterday.',
                            "Mike's boat's in dry dock again. Transmission trouble.",
                            'New seafood truck on Lincoln Street—halibut is fresh.',
                            "Tourist season's starting early this year.",
                            "They're talking about fixing the SeaMart dock finally.",
                        ];
                        const humor = [
                            "My wife says I love fishing more than her. I said, 'I love you more than golf.'",
                            'This is my exercise program: lifting beers and reeling fish.',
                            'I come here for the peace and quiet. And to get away from my peace and quiet.',
                            "Fish are not biting? Must be the fisherman.",
                            "My luck is so bad, if I fell in the water, I'd come up with a boot.",
                        ];

                        const allLines = [
                            ...sitkaHistory,
                            ...wildlife,
                            ...weather,
                            ...fishingTechnique,
                            ...gossip,
                            ...humor,
                        ];

                        return allLines[Math.floor(Math.random() * allLines.length)];
                    }
                },
                // ── Conversation follow-up (40% chance) ──
                {
                    type: 'branch',
                    condition: () => Math.random() < 0.4,
                    ifTrue: [
                        { type: 'wait', ms: 1500 + Math.random() * 1500 },
                        {
                            type: 'chat',
                            pick: () => {
                                const responses = [
                                    "Ain't that the truth.",
                                    'Tell me about it.',
                                    'You got that right.',
                                    'Same thing happened to me last week.',
                                    'I believe it.',
                                    'No kidding?',
                                    "Weather's part of the deal up here.",
                                    "That's Sitka for you.",
                                ];
                                if (Math.random() < 0.15) return null;
                                return responses[Math.floor(Math.random() * responses.length)];
                            }
                        },
                    ],
                    ifFalse: { type: 'noop' },
                },
            ],
        },

        { type: 'fish' },

        // ── Catch reaction (varied energy) ──
        {
            type: 'branch',
            condition: () => Math.random() > 0.4,
            ifTrue: {
                type: 'chat',
                pick: () => {
                    const reactions = [
                        'There we go.',
                        'Nice little one.',
                        "That'll do.",
                        'Alright!',
                        'Gotcha.',
                        'Hey, not bad!',
                        "Dinner's looking better.",
                        "Keep 'em coming.",
                        'Another for the cooler.',
                        'Good fighter on that one.',
                        'Solid hit.',
                        'Right in the corner—perfect hookset.',
                    ];
                    return reactions[Math.floor(Math.random() * reactions.length)];
                },
            },
            // ── Miss reaction (30% silence) ──
            ifFalse: {
                type: 'chat',
                pick: () => {
                    const misses = [
                        'Nothing. They are being picky today.',
                        'Dry cast.',
                        'Well, gave it a shot.',
                        'Moving on.',
                        'The dock does not owe me anything.',
                    ];
                    if (Math.random() < 0.3) return null;
                    return misses[Math.floor(Math.random() * misses.length)];
                },
            },
        },

        // ── Quiet moment (30% chance) ──
        {
            type: 'branch',
            condition: () => Math.random() < 0.3,
            ifTrue: [
                { type: 'wait', ms: 4000 + Math.random() * 3000 },
                {
                    type: 'branch',
                    condition: () => Math.random() < 0.7,
                    ifTrue: {
                        type: 'chat',
                        pick: () => {
                            const quietLines = [
                                'Quiet today.',
                                'Just the gulls and us.',
                                'Good day to be out here.',
                                'Pass me another from the cooler, would ya?',
                                "Think I'll try a different spot tomorrow.",
                                "Water's calm.",
                                'Sun feels good.',
                                'No rush.',
                            ];
                            if (Math.random() < 0.2) return null;
                            return quietLines[Math.floor(Math.random() * quietLines.length)];
                        }
                    },
                    ifFalse: { type: 'noop' },
                },
            ],
            ifFalse: { type: 'noop' },
        },

        { type: 'wait', ms: 2000 + Math.random() * 3000 },

        { type: 'goto', scriptName: 'crowd_fisher_v3' },
    ]
};
