// CraftMind Fishing — Rotating Fishing Tips System

const TIPS = [
  'Different bait attracts different fish. Try changing bait!',
  'Frozen Char love cold biomes. Try fishing near ice!',
  'Rain increases bite rates. Fish love a drizzle!',
  'Full moon = legendary fish might appear...',
  'Dawn and dusk are golden hours for fishing.',
  'Deep ocean fish are heavier. The Abyssal Trench holds monsters.',
  'Don\'t sell everything — some fish are worth more cooked!',
  'The Nether Magma Lake has unique species you won\'t find elsewhere.',
  'Luck of the Sea enchantment boosts rare fish chance.',
  'Fish populations recover over time. Don\'t overfish one spot!',
  'Thunderstorms are dangerous but amazing for rare catches.',
  'A Trophy Lure dramatically increases rare fish odds.',
  'Glow Berries are premium bait for night fishing.',
  'Diamond rods can handle the biggest fish in the sea.',
  'The Void Sea hides creatures from between dimensions.',
  'Patience pays off — bigger fish take longer to bite.',
  'Water quality drops with fishing pressure. Rotate spots!',
  'Blaze Rod Shavings attract Nether species like nothing else.',
  'Overworld Carp is common, but a big one is still a trophy.',
  'Nautilus Shell Bait is expensive but worth every emerald.',
];

const RARE_CATCH_TIPS = [
  '🌟 RARE CATCH! That\'s your first rare fish!',
  '🌟 The rarer the fish, the bigger the payout!',
  '🌟 Rare fish appear more often during storms.',
  '🌟 Your Luck of the Sea enchantment is working!',
];

const JUNK_LINES = [
  'The fish are laughing at you.',
  'You hear distant fish giggling.',
  'Even the seaweed looks embarrassed for you.',
  'A nearby fish gives you a pitying look.',
  'The pond gurgles with barely suppressed laughter.',
  'You consider retiring from fishing.',
  'The other fishermen pretend they didn\'t see that.',
  'A seagull steals your junk before you can throw it back.',
  'You briefly question your life choices.',
  'The bobber judges you silently.',
];

const JUNK_ITEMS = [
  { name: 'A soggy boot', emoji: '🥾' },
  { name: 'Tangled fishing line', emoji: '🧶' },
  { name: 'An old bottle with a note... it\'s blank', emoji: '🍶' },
  { name: 'A rubber duck', emoji: '🦆' },
  { name: 'A tin can', emoji: '🥫' },
  { name: 'Seaweed that waves at you mockingly', emoji: '🌿' },
  { name: 'A smooth rock. Just a rock.', emoji: '🪨' },
  { name: 'Someone\'s lost sandwich (half-eaten)', emoji: '🥪' },
  { name: 'A cork that definitely wasn\'t yours', emoji: '🟤' },
  { name: 'A single glove. Where\'s the other?', emoji: '🧤' },
];

export class TipsSystem {
  constructor() {
    this.tipIndex = 0;
    this.jokeIndex = 0;
    this.usedRareTips = new Set();
  }

  /** Get next fishing tip */
  getTip() {
    const tip = TIPS[this.tipIndex % TIPS.length];
    this.tipIndex++;
    return tip;
  }

  /** Get a random junk item */
  getRandomJunk() {
    return JUNK_ITEMS[Math.floor(Math.random() * JUNK_ITEMS.length)];
  }

  /** Get a random junk joke */
  getJunkJoke() {
    const joke = JUNK_LINES[this.jokeIndex % JUNK_LINES.length];
    this.jokeIndex++;
    return joke;
  }

  /** Get first-rare-catch tip (only shows once per rarity tier) */
  getFirstRareTip(rarity) {
    const key = `first_${rarity}`;
    if (this.usedRareTips.has(key)) return null;
    this.usedRareTips.add(key);
    return RARE_CATCH_TIPS[Math.floor(Math.random() * RARE_CATCH_TIPS.length)];
  }

  /** Get rarity emoji */
  static rarityEmoji(rarity) {
    return { Common: '🐟', Uncommon: '🐠', Rare: '🌟', Epic: '💫', Legendary: '👑' }[rarity] ?? '🐟';
  }

  /** Get rarity display string */
  static rarityDisplay(rarity) {
    if (rarity === 'Legendary') return '👑 🏆 LEGENDARY CATCH!!!';
    if (rarity === 'Epic') return '💫 EPIC catch!';
    if (rarity === 'Rare') return '🌟 Rare find!';
    if (rarity === 'Uncommon') return '🐠 Uncommon!';
    return '🐟';
  }

  /** Weather emoji */
  static weatherEmoji(weather, thundering) {
    if (thundering) return '⛈️';
    if (weather === 'rain') return '🌧️';
    if (weather === 'cloudy') return '⛅';
    return '☀️';
  }

  /** Moon emoji */
  static moonEmoji(phase) {
    return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][Math.floor(phase) % 8];
  }
}

export { TIPS, JUNK_ITEMS, JUNK_LINES };
export default TipsSystem;
