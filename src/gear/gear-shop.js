// CraftMind Fishing — NPC Gear Shop
// "Sitka Marine Supply" — where real fishermen buy their gear.

import { ALL_GEAR } from './alaska-gear.js';
import { CRAFTING_TIERS } from './crafting-system.js';

const SHOP_NPC_DIALOGUE = {
  greeting: [
    "Morning. Coffee's hot, fish are biting. What do you need?",
    "Welcome to Sitka Marine Supply. We've got everything but the fish — you gotta catch those yourself.",
    "Hey there. Heading out? Weather's looking decent for a change.",
    "You fish much? Your hands don't look rough enough yet.",
  ],
  halibut_advice: [
    "Going halibut fishing? Circle hooks, 80lb braid, and for God's sake bring a harpoon. Those barn doors will tear your face off if you try to lip-grip 'em.",
    "Halibut? Head west, find some pinnacles on your sounder. 250-350 feet. Herring on a circle hook. Don't use a J-hook — it's illegal and the fish deserve better.",
  ],
  salmon_advice: [
    "Salmon trolling? You want a flasher with a hoochie, 36 inches back. Green and glow for coho, blue and chrome for kings. Downriggers at 40-80 feet.",
    "The pink run's in? Grab some buzz bombs and head to the beach. They'll hit anything that moves.",
  ],
  lingcod_advice: [
    "Lingcod? You want a dinglebar rod and a 16-ounce jig. Find some rocky structure and POUND the bottom. When you feel the crunch — SET THE HOOK HARD.",
    "Lingcod fishing, huh? Put on a wire leader. Their teeth will cut through mono like butter. And watch your rockfish — lingcod will eat them right off your hook.",
  ],
  crab_advice: [
    "Dungeness? Soak your pots 12 hours minimum, bait with herring or salmon carcass. Check the regs — size limit is 6.5 inches across the back.",
    "Shrimping? Spot prawns love cat food. I'm serious. Punch holes in the can and toss it in the pot. Set near rocky structure at 300+ feet.",
  ],
  diving_advice: [
    "Diving? Water's 48 degrees. 5mm wetsuit minimum, hood and gloves. Don't be a hero — a dry suit is worth every penny if you can afford it.",
    "Free diving for abalone? The iron, not a knife. And stay shallow. Those regs are no joke.",
  ],
  weather_warning: [
    "Weather's turning. Don't go past the breakwater today unless you want an adventure.",
    "Wind's picking up from the southeast. Classic Sitka blow coming. Maybe try the inside waters.",
  ],
  farewell: [
    "Tight lines. And don't forget — if you're not catching, you're not drinking enough coffee.",
    "Good luck out there. Come back and tell me what you caught. Or didn't.",
    "Watch the weather. The ocean doesn't care about your plans.",
  ],
};

const SPECIES_PRICES = {
  halibut:          { buy: 8, sell: 6 },
  king_salmon:      { buy: 20, sell: 15 },
  coho_salmon:      { buy: 12, sell: 9 },
  pink_salmon:      { buy: 3, sell: 2 },
  chum_salmon:      { buy: 4, sell: 3 },
  sockeye_salmon:   { buy: 10, sell: 8 },
  lingcod:          { buy: 7, sell: 5 },
  pacific_cod:      { buy: 3, sell: 2 },
  rockfish:         { buy: 5, sell: 4 },
  yelloweye:        { buy: 8, sell: 6 },
  dungeness_crab:   { buy: 10, sell: 7 },
  king_crab:        { buy: 40, sell: 30 },
  tanner_crab:      { buy: 15, sell: 12 },
  spot_prawn:       { buy: 20, sell: 15 },
  giant_octopus:    { buy: 12, sell: 9 },
  abalone:          { buy: 25, sell: 18 },
};

export class GearShop {
  constructor(config = {}) {
    this.name = config.name ?? 'Sitka Marine Supply';
    this.owner = config.owner ?? 'Old Pete';
    this.gold = config.gold ?? 500;
    this.inventory = new Map(); // gearId -> { count, price }
    this.fishBuyback = { ...SPECIES_PRICES };
    this.specialOrders = []; // pending orders
    this.tradeIns = []; // accepted trade-ins
    this.visits = 0;
    this.playerRelationship = 0; // -100 to 100
    this.dailyRefreshTimer = 0;
    this.refreshInventory();
  }

  /** Refresh shop inventory with randomized stock */
  refreshInventory() {
    this.inventory.clear();
    this.dailyRefreshTimer = Date.now();

    for (const [id, gear] of Object.entries(ALL_GEAR)) {
      // Shop sells tier 1-3, tier 4-5 must be crafted
      if (gear.tier > 3) continue;
      if (Math.random() < 0.7) { // 70% chance each item is in stock
        const basePrice = gear.tier * 10 + Math.floor(Math.random() * gear.tier * 5);
        const count = gear.tier === 1 ? 3 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 3);
        this.inventory.set(id, { count, price: basePrice });
      }
    }
  }

  /** Check if inventory needs refresh (daily) */
  checkRefresh() {
    const hours = (Date.now() - this.dailyRefreshTimer) / 3600000;
    if (hours >= 24) {
      this.refreshInventory();
      return true;
    }
    return false;
  }

  /** Buy gear from the shop */
  buy(gearId, quantity = 1) {
    const stock = this.inventory.get(gearId);
    if (!stock) throw new Error(`"${gearId}" not in stock. Come back tomorrow — or craft it yourself.`);
    if (stock.count < quantity) throw new Error(`Only ${stock.count} ${gearId} in stock. Need ${quantity}.`);

    const cost = stock.price * quantity;
    if (this.gold < cost) throw new Error(`Not enough gold. ${gearId} costs ${cost}g, you have ${this.gold}g.`);

    this.gold -= cost;
    stock.count -= quantity;
    if (stock.count <= 0) this.inventory.delete(gearId);

    return {
      gearId,
      name: ALL_GEAR[gearId]?.name ?? gearId,
      emoji: ALL_GEAR[gearId]?.emoji ?? '📦',
      quantity,
      cost,
      remainingGold: this.gold,
    };
  }

  /** Sell fish/catch to the shop */
  sell(speciesId, weight = 1, quality = 1.0) {
    const prices = this.fishBuyback[speciesId];
    if (!prices) throw new Error(`We don't buy ${speciesId}. Try the cannery.`);

    // Quality multiplier: fresh filleted fish sells for more
    const qualityMult = Math.max(0.5, Math.min(2.0, quality));
    const price = Math.round(prices.sell * weight * qualityMult);

    this.gold += price;
    this.playerRelationship = Math.min(100, this.playerRelationship + 0.5);

    return { speciesId, weight, price, qualityMult: qualityMult.toFixed(2), totalGold: this.gold };
  }

  /** Place a special order for gear not in stock */
  order(gearId, budget, daysToComplete = 1) {
    const gear = ALL_GEAR[gearId];
    if (!gear) throw new Error(`Never heard of "${gearId}".`);

    const cost = budget;
    if (this.gold < cost) throw new Error(`Can't afford that order. You have ${this.gold}g, need ${cost}g.`);

    this.gold -= cost;
    const order = {
      gearId,
      name: gear.name,
      cost,
      daysToComplete,
      placedAt: Date.now(),
      readyAt: Date.now() + daysToComplete * 86400000,
      ready: false,
    };
    this.specialOrders.push(order);

    return { message: `Special order placed for ${gear.name}. Come back in ${daysToComplete} day(s). Cost: ${cost}g.`, order };
  }

  /** Check and fulfill special orders */
  checkOrders() {
    const fulfilled = [];
    for (const order of this.specialOrders) {
      if (!order.ready && Date.now() >= order.readyAt) {
        order.ready = true;
        fulfilled.push(order);
      }
    }
    return fulfilled;
  }

  /** Pick up a fulfilled order */
  pickupOrder(orderIndex) {
    const order = this.specialOrders[orderIndex];
    if (!order || !order.ready) throw new Error('Order not ready yet. Be patient.');
    this.specialOrders.splice(orderIndex, 1);
    return { gearId: order.gearId, name: order.name };
  }

  /** Trade in old gear for discount */
  tradeIn(gearId, condition) {
    // condition: 0-100 durability percentage
    const value = Math.round(condition * 0.3); // 30% of condition value
    this.tradeIns.push({ gearId, condition, value, date: Date.now() });
    this.playerRelationship = Math.min(100, this.playerRelationship + 1);
    return { tradeInValue: value, message: `${condition}% condition — I'll give you ${value}g credit.` };
  }

  /** Get NPC dialogue based on context */
  getDialogue(context = {}) {
    const category = context.category ?? 'greeting';
    const lines = SHOP_NPC_DIALOGUE[category] ?? SHOP_NPC_DIALOGUE.greeting;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  /** Get contextual advice about a fishing target */
  getAdvice(targetSpecies) {
    if (targetSpecies === 'halibut') return this.getDialogue({ category: 'halibut_advice' });
    if (['king_salmon', 'coho_salmon', 'pink_salmon', 'sockeye_salmon'].includes(targetSpecies)) return this.getDialogue({ category: 'salmon_advice' });
    if (targetSpecies === 'lingcod') return this.getDialogue({ category: 'lingcod_advice' });
    if (['dungeness_crab', 'king_crab', 'spot_prawn'].includes(targetSpecies)) return this.getDialogue({ category: 'crab_advice' });
    if (targetSpecies === 'diving') return this.getDialogue({ category: 'diving_advice' });
    return "Can't help you with that. Try the old Tlingit guy at the bar — he knows everything.";
  }

  /** Get shop display */
  getShopDisplay() {
    const items = [];
    for (const [id, stock] of this.inventory) {
      const gear = ALL_GEAR[id];
      if (gear) {
        items.push(`${gear.emoji} ${gear.name} — ${stock.price}g (x${stock.count})`);
      }
    }
    return {
      shopName: this.name,
      owner: this.owner,
      greeting: this.getDialogue(),
      items,
      gold: this.gold,
      pendingOrders: this.specialOrders.length,
      relationship: this.playerRelationship,
    };
  }
}

export default GearShop;
