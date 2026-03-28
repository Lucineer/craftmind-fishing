/**
 * Game commands for the fishing plugin — NPC, shop, quests, leaderboard.
 * ESM module.
 *
 * Usage in fishing-plugin.js:
 *   import { registerGameCommands } from './game-commands.js';
 *   registerGameCommands(fishingCommands, ctx);
 */

// ── NPC Dialogue ───────────────────────────────────────────────────────────
const GUSTAV_LINES = [
  "Nice day for fishing. The salmon are running deep today.",
  "I've been fishing this cove for thirty years. Still surprises me.",
  "You know what they say — the worst day fishing beats the best day working.",
  "Try casting near the rocks. Lurker bass hide in the shadows.",
  "A patient angler always beats a lucky one. Well... mostly.",
  "Back in my day, we didn't have fancy rods. Just a stick and some string.",
  "The tides change everything. Fish move with the moon, not the sun.",
  "I once caught something this big. No, bigger.",
  "Keep at it. Every cast is a fresh start.",
  "The sea gives and the sea takes. Today, she's feeling generous.",
];

const RILEY_LINES = [
  "Saw a pod of whales yesterday! Well, I think they were whales. Might've been really big fish.",
  "I'm painting the sunset later. Want to watch?",
  "Art and fishing aren't so different. Both require patience.",
  "Some people come here for the fish. I come for the light on the water.",
  "Found a perfect skipping stone this morning. Seven skips!",
  "The harbor seals are back! They've been stealing everyone's catch.",
  "You ever notice how fish taste better when you caught them yourself?",
];

const NANA_LINES = [
  "Hello dear. Don't forget to stay warm out here.",
  "I made fish stew yesterday. Would you like the recipe?",
  "My grandson used to fish here. He moved to the city. Miss him.",
  "Take your time. The fish aren't going anywhere fast.",
  "Bring me a nice salmon and I'll knit you a scarf.",
  "Been knitting while I fish. Keeps the hands busy between bites.",
  "The old stories say there's a giant fish under the dock. I believe them.",
];

const NPC_MAP = {
  gustav: GUSTAV_LINES,
  riley: RILEY_LINES,
  nana: NANA_LINES,
};

// ── Fish prices ─────────────────────────────────────────────────────────────
const FISH_PRICES = {
  cod: 3, raw_cod: 2,
  salmon: 5, raw_salmon: 4,
  tropical_fish: 8,
  pufferfish: 10,
};

// ── Quests ──────────────────────────────────────────────────────────────────
const QUESTS = [
  { name: 'First Catch', desc: 'Catch your first fish', reward: 10 },
  { name: 'Five Alive', desc: 'Catch 5 fish', reward: 25 },
  { name: 'Decathlon', desc: 'Catch 10 fish', reward: 50 },
  { name: 'Salmon Run', desc: 'Catch 5 salmon', reward: 35 },
  { name: 'The Big One', desc: 'Catch a pufferfish', reward: 40 },
];

/**
 * Register game commands by pushing into the fishingCommands array.
 * @param {Array} fishingCommands - command array (mutated in place)
 * @param {object} ctx - plugin context (needs ctx._economy, ctx.bot, ctx.reply)
 */
export function registerGameCommands(fishingCommands, ctx) {
  const economy = ctx._economy;

  // NPC commands
  for (const [npcName, lines] of Object.entries(NPC_MAP)) {
    const displayName = npcName.charAt(0).toUpperCase() + npcName.slice(1);
    fishingCommands.push({
      name: npcName,
      description: `Talk to ${displayName}`,
      usage: `!${npcName}`,
      execute(ctx) {
        const line = lines[Math.floor(Math.random() * lines.length)];
        ctx.reply(`[${displayName}] ${line}`);
      },
    });
  }

  // !shop
  fishingCommands.push({
    name: 'shop',
    description: 'Browse the fishing shop',
    usage: '!shop',
    execute(ctx) {
      ctx.reply('📋 Fishing Shop:\n  fishing_rod: 10c (Basic rod)\n  enchanted_fishing_rod: 50c (Lures rare fish)\n  bucket: 3c\n  name_tag: 5c\nUse !buy <item>');
    },
  });

  // !balance
  fishingCommands.push({
    name: 'balance',
    description: 'Check your credits',
    usage: '!balance',
    aliases: ['money', 'credits', 'bal'],
    execute(ctx) {
      const name = ctx._economy?.botName || ctx.bot?.username || 'unknown';
      const bal = economy?.getBalance?.(name) ?? 0;
      ctx.reply(`💰 ${name}: ${bal} credits`);
    },
  });

  // !quests
  fishingCommands.push({
    name: 'quests',
    description: 'View available quests',
    usage: '!quests',
    aliases: ['missions'],
    execute(ctx) {
      const lines = QUESTS.map(q => `  ${q.name} — ${q.desc} (${q.reward}c)`);
      ctx.reply('📜 Quests:\n' + lines.join('\n'));
    },
  });

  // !top
  fishingCommands.push({
    name: 'top',
    description: 'Leaderboard',
    usage: '!top',
    aliases: ['leaderboard', 'ranks', 'lb'],
    execute(ctx) {
      if (!economy?._data?.balances) return ctx.reply('🏆 No data yet');
      const sorted = Object.entries(economy._data.balances)
        .sort((a, b) => (b[1].balance || 0) - (a[1].balance || 0))
        .slice(0, 5);
      if (sorted.length === 0) return ctx.reply('🏆 No players yet. Start fishing!');
      const lines = sorted.map(([name, d], i) => `  ${i + 1}. ${name}: ${d.balance || 0}c`);
      ctx.reply('🏆 Leaderboard:\n' + lines.join('\n'));
    },
  });

  // !sell
  fishingCommands.push({
    name: 'sell',
    description: 'Sell fish for credits',
    usage: '!sell',
    execute(ctx) {
      const items = ctx.bot?.inventory?.items?.() || [];
      const fish = items.filter(i => Object.keys(FISH_PRICES).some(f => i.name.includes(f)));
      if (fish.length === 0) return ctx.reply('🐟 No fish to sell!');

      let total = 0;
      for (const item of fish) {
        const key = Object.keys(FISH_PRICES).find(f => item.name.includes(f));
        if (key) total += FISH_PRICES[key] * item.count;
      }

      const name = ctx.bot?.username || 'unknown';
      economy?.addCurrency?.(name, total, 'shop:sell');
      ctx.reply(`💰 Sold ${fish.reduce((s, i) => s + i.count, 0)} fish for ${total} credits!`);
    },
  });

  // !stats
  fishingCommands.push({
    name: 'stats',
    description: 'View your fishing stats',
    usage: '!stats',
    execute(ctx) {
      const name = ctx.bot?.username || 'unknown';
      const bal = economy?.getBalance?.(name) ?? 0;
      const caught = ctx._scriptRunner?.context?.fishCaught ?? 0;
      ctx.reply(`📊 ${name}: ${caught} fish caught, ${bal} credits`);
    },
  });

  console.log('[GameCommands] Registered: !gustav, !riley, !nana, !shop, !balance, !quests, !top, !sell, !stats');
}
