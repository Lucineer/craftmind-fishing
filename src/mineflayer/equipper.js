/**
 * @module craftmind-fishing/mineflayer/equipper
 * @description Equips best available armor/weapons, loots nearby items, loots chests.
 */

const ARMOR_SLOTS = ['head', 'torso', 'legs', 'feet'];
const ARMOR_SLOT_INDICES = { head: 5, torso: 6, legs: 7, feet: 8 };
const ARMOR_PRIORITY = {
  head: ['diamond_helmet', 'iron_helmet', 'chainmail_helmet', 'golden_helmet', 'leather_helmet'],
  torso: ['diamond_chestplate', 'iron_chestplate', 'chainmail_chestplate', 'golden_chestplate', 'leather_chestplate'],
  legs: ['diamond_leggings', 'iron_leggings', 'chainmail_leggings', 'golden_leggings', 'leather_leggings'],
  feet: ['diamond_boots', 'iron_boots', 'chainmail_boots', 'golden_boots', 'leather_boots'],
};
const WEAPON_PRIORITY = [
  'diamond_sword', 'iron_sword', 'golden_sword', 'stone_sword', 'wooden_sword',
  'diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe',
];
const USEFUL_ITEMS = [
  'sword', 'axe', 'pickaxe', 'shield', 'bow', 'arrow',
  'bread', 'cooked_beef', 'cooked_porkchop', 'cooked_salmon', 'cooked_cod', 'apple', 'carrot',
  'helmet', 'chestplate', 'leggings', 'boots',
  'torch', 'lantern', 'bucket',
  'fishing_rod',
];

export class Equipper {
  /**
   * @param {import('mineflayer').Bot} bot
   */
  constructor(bot) {
    this.bot = bot;
  }

  /** Equip the best available armor from inventory */
  equipBestArmor() {
    for (const slot of ARMOR_SLOTS) {
      const slotIndex = ARMOR_SLOT_INDICES[slot];
      const current = this.bot.inventory.slots[slotIndex];
      const currentName = current?.name || '';

      for (const armor of ARMOR_PRIORITY[slot]) {
        if (armor === currentName) break; // already wearing best
        const item = this.bot.inventory.items().find(i => i.name === armor);
        if (item) {
          try {
            this.bot.equip(item, slot);
          } catch {
            // ignore
          }
          break;
        }
      }
    }
  }

  /** Equip best weapon to hand */
  equipBestWeapon() {
    for (const wpn of WEAPON_PRIORITY) {
      const item = this.bot.inventory.items().find(i => i.name === wpn);
      if (item) {
        try {
          this.bot.equip(item, 'hand');
        } catch {
          // ignore
        }
        return true;
      }
    }
    return false;
  }

  /** Loot a nearby chest — take all useful items */
  async lootChest(chestBlock) {
    if (!chestBlock) return false;

    try {
      const chest = await this.bot.openChest(chestBlock);
      const items = chest.containerItems();

      for (const item of items) {
        if (USEFUL_ITEMS.some(u => item.name.includes(u))) {
          try {
            await chest.withdraw(item.type, item.metadata, item.count);
          } catch {
            // ignore
          }
        }
      }

      chest.close();
      return true;
    } catch {
      return false;
    }
  }

  /** Find and loot the nearest chest within range */
  async lootNearestChest(range = 5) {
    if (!this.bot.entity) return false;

    const chestId = this.bot.registry.blocksByName?.chest?.id;
    if (chestId === undefined) return false;

    const chests = this.bot.findBlocks({ matching: chestId, maxDistance: range, count: 5 });
    if (chests.length === 0) return false;

    // Sort by distance
    const pos = this.bot.entity.position;
    chests.sort((a, b) => a.distanceTo(pos) - b.distanceTo(pos));

    const chestBlock = this.bot.blockAt(chests[0]);
    if (!chestBlock) return false;

    return this.lootChest(chestBlock);
  }

  /** Equip everything useful (armor + weapon) */
  equipAll() {
    this.equipBestArmor();
    this.equipBestWeapon();
  }
}

export default Equipper;
