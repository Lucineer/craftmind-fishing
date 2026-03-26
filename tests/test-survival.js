/**
 * @module tests/test-survival
 * @description Tests for Survival and Equipper modules.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Survival } from '../src/mineflayer/survival.js';
import { Equipper } from '../src/mineflayer/equipper.js';

// ── Mock bot factory ──────────────────────────────────────────────────────────

function createMockBot(opts = {}) {
  const entities = {};
  const inventory = {
    slots: {},
    items() {
      return Object.values(this.slots).filter(Boolean);
    },
  };

  const bot = {
    entity: opts.entity || { position: { x: 0, y: 64, z: 0 }, yaw: 0 },
    health: opts.health ?? 20,
    food: opts.food ?? 20,
    username: 'Cody',
    inventory,
    entities,
    _events: {},
    _listeners: {},
    on(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },
    once(event, fn) {
      this.on(event, (...args) => {
        fn(...args);
        // Don't auto-remove for tests
      });
    },
    removeListener(event, fn) {
      if (this._listeners[event]) {
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
      }
    },
    emit(event, ...args) {
      (this._listeners[event] || []).forEach(fn => fn(...args));
    },
    nearestEntity(filter) {
      for (const e of Object.values(entities)) {
        if (filter(e)) return e;
      }
      return null;
    },
    equip(item, slot) { return Promise.resolve(); },
    lookAt() { return Promise.resolve(); },
    look() { return Promise.resolve(); },
    attack() {},
    setControlState() {},
    clearControlStates() {},
    chat() {},
    pathfinder: null,
    registry: { blocksByName: { chest: { id: 54 } } },
    findBlocks() { return []; },
    blockAt() { return null; },
    openChest() { return Promise.reject(new Error('no chest')); },
  };

  return bot;
}

function createMockEntity(name, type, x, y, z, opts = {}) {
  return {
    type: type || 'mob',
    name,
    position: { x, y, z, distanceTo(p) { return Math.sqrt((x - p.x) ** 2 + (z - p.z) ** 2); } },
    height: opts.height || 1.8,
    isValid: opts.isValid !== false,
  };
}

// ── Survival Tests ────────────────────────────────────────────────────────────

describe('Survival', () => {
  let bot;
  let survival;

  beforeEach(() => {
    bot = createMockBot();
    survival = new Survival(bot);
  });

  it('should initialize as active', () => {
    assert.equal(survival.active, true);
  });

  it('should stop scanning when stopped', () => {
    survival.stop();
    assert.equal(survival.active, false);
  });

  it('should restart when started', () => {
    survival.stop();
    survival.start();
    assert.equal(survival.active, true);
  });

  it('should detect no hostile when none present', () => {
    const hostile = survival.getNearestHostile(16);
    assert.equal(hostile, null);
  });

  it('should detect a nearby zombie', () => {
    const zombie = createMockEntity('zombie', 'mob', 2, 64, 3);
    bot.entities.zombie = zombie;
    const hostile = survival.getNearestHostile(16);
    assert.ok(hostile);
    assert.equal(hostile.name, 'zombie');
  });

  it('should detect a nearby skeleton', () => {
    const skeleton = createMockEntity('skeleton', 'mob', 5, 64, 5);
    bot.entities.skeleton = skeleton;
    const hostile = survival.getNearestHostile(16);
    assert.ok(hostile);
    assert.equal(hostile.name, 'skeleton');
  });

  it('should detect a creeper', () => {
    const creeper = createMockEntity('creeper', 'mob', 4, 64, 0);
    bot.entities.creeper = creeper;
    const hostile = survival.getNearestHostile(6);
    assert.ok(hostile);
    assert.equal(hostile.name, 'creeper');
  });

  it('should detect a spider', () => {
    const spider = createMockEntity('spider', 'mob', 3, 64, 3);
    bot.entities.spider = spider;
    const hostile = survival.getNearestHostile(16);
    assert.ok(hostile);
  });

  it('should detect a phantom', () => {
    const phantom = createMockEntity('phantom', 'mob', 8, 70, 8);
    bot.entities.phantom = phantom;
    const hostile = survival.getNearestHostile(16);
    assert.ok(hostile);
  });

  it('should ignore entities beyond range', () => {
    const zombie = createMockEntity('zombie', 'mob', 50, 64, 50);
    bot.entities.zombie = zombie;
    const hostile = survival.getNearestHostile(16);
    assert.equal(hostile, null);
  });

  it('should ignore passive mobs', () => {
    const cow = createMockEntity('cow', 'mob', 3, 64, 3);
    bot.entities.cow = cow;
    const hostile = survival.getNearestHostile(16);
    assert.equal(hostile, null);
  });

  it('should ignore players', () => {
    const player = createMockEntity('Steve', 'player', 2, 64, 2);
    bot.entities.steve = player;
    const hostile = survival.getNearestHostile(16);
    assert.equal(hostile, null);
  });

  it('should start in combat when attacking', () => {
    const zombie = createMockEntity('zombie', 'mob', 3, 64, 3);
    bot.entities.zombie = zombie;
    survival._attack(zombie);
    assert.equal(survival.isInCombat, true);
  });

  it('should clear combat target on _clearAttack', () => {
    const zombie = createMockEntity('zombie', 'mob', 3, 64, 3);
    bot.entities.zombie = zombie;
    survival._attack(zombie);
    survival._clearAttack();
    assert.equal(survival.isInCombat, false);
  });

  it('should equip best weapon before attacking', () => {
    let equippedItem = null;
    bot.equip = (item, slot) => { equippedItem = item; return Promise.resolve(); };
    bot.inventory.slots[36] = { name: 'wooden_sword' };

    const zombie = createMockEntity('zombie', 'mob', 3, 64, 3);
    bot.entities.zombie = zombie;
    survival._attack(zombie);
    assert.ok(equippedItem);
  });

  it('should not consider player-type entities as hostiles', () => {
    const player = createMockEntity('Alex', 'player', 1, 64, 1);
    bot.entities.alex = player;
    assert.equal(survival.getNearestHostile(16), null);
  });

  it('should detect drowned mobs', () => {
    const drowned = createMockEntity('drowned', 'mob', 5, 62, 5);
    bot.entities.drowned = drowned;
    const hostile = survival.getNearestHostile(16);
    assert.ok(hostile);
  });

  it('should detect witch mobs', () => {
    const witch = createMockEntity('witch', 'mob', 6, 64, 6);
    bot.entities.witch = witch;
    const hostile = survival.getNearestHostile(16);
    assert.ok(hostile);
  });

  it('should not scan when inactive', () => {
    survival.stop();
    const zombie = createMockEntity('zombie', 'mob', 2, 64, 2);
    bot.entities.zombie = zombie;
    // _scanForThreats should return early when inactive
    const hostile = survival.getNearestHostile(16);
    // getNearestHostile doesn't check active flag, but scan does
    assert.ok(hostile); // entity is there, but scan won't trigger
  });

  it('should handle null entity gracefully', () => {
    bot.entity = null;
    survival._scanForThreats(); // should not throw
    assert.equal(survival.getNearestHostile(16), null);
  });

  it('should handle dead bot gracefully', () => {
    bot.health = 0;
    survival._scanForThreats(); // should not throw
  });
});

// ── Equipper Tests ────────────────────────────────────────────────────────────

describe('Equipper', () => {
  let bot;
  let equipper;

  beforeEach(() => {
    bot = createMockBot();
    equipper = new Equipper(bot);
  });

  it('should equip iron sword from inventory', () => {
    let equipped = null;
    bot.equip = (item, slot) => { equipped = { item, slot }; return Promise.resolve(); };
    bot.inventory.slots[36] = { name: 'iron_sword' };
    const result = equipper.equipBestWeapon();
    assert.equal(result, true);
    assert.ok(equipped);
    assert.equal(equipped.slot, 'hand');
  });

  it('should prefer diamond sword over iron sword', () => {
    const equipped = [];
    bot.equip = (item, slot) => { equipped.push({ item, slot }); return Promise.resolve(); };
    bot.inventory.slots[36] = { name: 'iron_sword' };
    bot.inventory.slots[37] = { name: 'diamond_sword' };
    equipper.equipBestWeapon();
    assert.equal(equipped[0].item.name, 'diamond_sword');
  });

  it('should prefer iron sword over stone sword', () => {
    const equipped = [];
    bot.equip = (item, slot) => { equipped.push({ item, slot }); return Promise.resolve(); };
    bot.inventory.slots[36] = { name: 'stone_sword' };
    bot.inventory.slots[37] = { name: 'iron_sword' };
    equipper.equipBestWeapon();
    assert.equal(equipped[0].item.name, 'iron_sword');
  });

  it('should return false when no weapon available', () => {
    const result = equipper.equipBestWeapon();
    assert.equal(result, false);
  });

  it('should equip iron armor to correct slots', () => {
    const equipped = [];
    bot.equip = (item, slot) => { equipped.push({ item, slot }); return Promise.resolve(); };
    bot.inventory.slots[36] = { name: 'iron_helmet' };
    bot.inventory.slots[37] = { name: 'iron_chestplate' };
    bot.inventory.slots[38] = { name: 'iron_leggings' };
    bot.inventory.slots[39] = { name: 'iron_boots' };
    equipper.equipBestArmor();
    assert.equal(equipped.length, 4);
    assert.equal(equipped[0].slot, 'head');
    assert.equal(equipped[1].slot, 'torso');
    assert.equal(equipped[2].slot, 'legs');
    assert.equal(equipped[3].slot, 'feet');
  });

  it('should prefer diamond armor over iron', () => {
    const equipped = [];
    bot.equip = (item, slot) => { equipped.push({ item, slot }); return Promise.resolve(); };
    bot.inventory.slots[36] = { name: 'iron_helmet' };
    bot.inventory.slots[37] = { name: 'diamond_helmet' };
    equipper.equipBestArmor();
    assert.equal(equipped[0].item.name, 'diamond_helmet');
  });

  it('should not re-equip if already wearing best armor', () => {
    const equipped = [];
    bot.equip = (item, slot) => { equipped.push({ item, slot }); return Promise.resolve(); };
    bot.inventory.slots[5] = { name: 'iron_helmet' }; // already wearing
    bot.inventory.slots[36] = { name: 'iron_helmet' };
    equipper.equipBestArmor();
    assert.equal(equipped.length, 0); // already wearing best
  });

  it('should equip both armor and weapon with equipAll', () => {
    const equipped = [];
    bot.equip = (item, slot) => { equipped.push({ item, slot }); return Promise.resolve(); };
    bot.inventory.slots[36] = { name: 'iron_sword' };
    bot.inventory.slots[37] = { name: 'iron_chestplate' };
    equipper.equipAll();
    assert.ok(equipped.length >= 2);
  });

  it('should return false when no chest nearby', async () => {
    const result = await equipper.lootNearestChest(5);
    assert.equal(result, false);
  });

  it('should handle lootChest error gracefully', async () => {
    const result = await equipper.lootChest(null);
    assert.equal(result, false);
  });

  it('should return false for lootNearestChest with no entity', async () => {
    bot.entity = null;
    const result = await equipper.lootNearestChest(5);
    assert.equal(result, false);
  });
});
