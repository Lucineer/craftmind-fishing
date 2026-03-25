/**
 * @module craftmind-fishing/onboarding
 * @description First-time player experience for Sitka Sound fishing.
 * Welcome from Old Thomas, tutorial quest, starting gear, compass directions.
 */

export const ONBOARDING_COMPLETE_KEY = 'craftmind_fishing_onboarded';

/**
 * Build the onboarding welcome sequence for a new player.
 * @param {Object} ctx - { bot, game, reply, memory }
 * @returns {boolean} Whether onboarding was triggered (false = already done).
 */
export function tryOnboarding(ctx) {
  if (ctx.memory?.getMeta?.(ONBOARDING_COMPLETE_KEY)) return false;

  // Mark immediately to prevent double-trigger
  ctx.memory?.setMeta?.(ONBOARDING_COMPLETE_KEY, true);

  // Phase 1: Welcome from Old Thomas
  const welcome = [
    '§6§l-- ⊱ ────── {.· ✯ ── ⊰ ────── ⊰ --',
    '§eOld Thomas §7waves from the dock.',
    '§f"Welcome to Sitka, fisherman. I am Old Thomas."',
    '§f"The salmon are running and the halibut are biting."',
    '§f"This harbor has fed our people for generations."',
    '§f"Let me show you the ropes..."',
    '§6§l-- ⊱ ────── {.· ✯ ── ⊰ ────── ⊰ --',
  ];

  for (const line of welcome) {
    ctx.bot?.chat?.(line);
  }

  // Phase 2: Tutorial quest
  setTimeout(() => {
    const tutorial = [
      '§a§l━━ Tutorial: Catch Your First Fish ━━',
      '§7Step 1: §fType §e!fish §fto cast your line',
      '§7Step 2: §fWait for a bite (watch the chat)',
      '§7Step 3: §fType §e!reel §fto haul in your catch',
      '§7Step 4: §fType §e!sell §fto sell your fish',
      '§7',
      '§7Try §e!check §f anytime to see your status.',
      '§7Try §e!weather §f to see conditions.',
      '§a§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ];
    for (const line of tutorial) {
      ctx.bot?.chat?.(line);
    }
  }, 4000);

  // Phase 3: Point to key locations
  setTimeout(() => {
    const locations = [
      '§e📍 §7Ernie\'s Bar §f— Buy gear and hear rumors. §e!gear buy hoochie',
      '§e📍 §7Harbor §f— Buy boats and check conditions. §e!permit',
      '§e📍 §7ADF&G Office §f— Get fishing permits. §e!permit buy salmon',
      '§e📍 §7Fish Processor §f— Sell your catch. §e!sell all',
      '§e🧭 §7Compass: §fNorth = Open Ocean, East = River, South = Harbor, West = Kelp Forest',
    ];
    for (const line of locations) {
      ctx.bot?.chat?.(line);
    }
  }, 8000);

  // Phase 4: Grant starting permit
  setTimeout(() => {
    const game = ctx.game;
    if (game) {
      if (!game.player.permits.includes('sport_fishing')) {
        game.player.permits.push('sport_fishing');
        try { game.permitSystem.acquire('sport_fishing', { source: 'quest', cost: 0 }); } catch {}
      }
      game.player.gold = Math.max(game.player.gold, 500);
      game.player.gear.push({ id: 'basic_rod', durability: 100 });

      ctx.bot?.chat?.('§a🎁 You received: Sport Fishing Permit, $500, Basic Fishing Rod');
    }

    // Mark onboarding complete
    ctx.memory?.setMeta?.(ONBOARDING_COMPLETE_KEY, true);
  }, 12000);

  return true;
}

/**
 * Generate Old Thomas dialogue based on game state.
 * @param {Object} gameState - From SitkaFishingGame.getState()
 * @returns {string[]}
 */
export function oldThomasDialogue(gameState) {
  const lines = [];

  if (!gameState) return ['"The sea provides for those who respect it."'];

  // Weather-aware
  if (gameState.weather?.type === 'storm') {
    lines.push('"Storm is coming. The old ways say: when the gulls fly low, seek shelter."');
  } else if (gameState.weather?.type === 'fog') {
    lines.push('"The fog is the sea\'s breath. Fish are calm in fog. Good time to cast."');
  } else {
    lines.push('"Clear skies today. The elders say clear water means honest fish."');
  }

  // Tide-aware
  if (gameState.tide) {
    if (gameState.tide.direction === 'incoming') {
      lines.push('"The tide is coming in. Salmon follow the tide. Cast now."');
    } else {
      lines.push('"The tide is going out. Wait for the turn — that\'s when the big ones feed."');
    }
  }

  // Player stats
  if (gameState.player?.statistics?.totalFishCaught === 0) {
    lines.push('"You haven\'t caught anything yet? Patience, child. The fish will come."');
  } else if (gameState.player?.statistics?.totalFishCaught > 10) {
    lines.push('"You are learning well. The sea respects a patient fisherman."');
  }

  // Species caught
  if (gameState.player?.statistics?.speciesCaught?.length > 5) {
    lines.push('"Many species in your hold. My grandfather would be proud."');
  }

  return lines;
}

export default { tryOnboarding, oldThomasDialogue };
