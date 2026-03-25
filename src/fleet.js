// CraftMind Fishing — Fleet Management System
// Fleet composition, roles, shared resources, reputation, chat.

import { Boat } from './boat.js';

export const FLEET_ROLES = {
  captain:    { name: 'Captain',    desc: 'Strategic decisions, voyage planning', canLead: true },
  scout:      { name: 'Scout',      desc: 'Exploration, hazard detection, finding fish schools' },
  tanker:     { name: 'Tanker',     desc: 'Big game fishing, fleet protection in combat' },
  support:    { name: 'Support',    desc: 'Bait crafting, healing, emergency supply' },
  specialist: { name: 'Specialist', desc: 'Species expert, technique optimization' },
};

export class FleetMember {
  constructor(name, options = {}) {
    this.name = name;
    this.role = options.role ?? 'specialist';
    this.specialty = options.specialty ?? 'general';
    this.isHuman = options.isHuman ?? false;
    this.isOnline = options.isOnline ?? false;
    this.skill = options.skill ?? 5;
    this.personality = options.personality ?? 'methodical';
    this.botRef = options.botRef ?? null; // reference to BotFisherman if AI

    // State
    this.location = options.location ?? { x: 0, y: 64, z: 0 };
    this.hp = 100;
    this.maxHp = 100;
    this.status = 'idle'; // idle, fishing, traveling, in_danger, returning
    this.catches = [];
    this.boat = options.boat ?? new Boat(`${name}'s Skiff`, 'skiff', { owner: name });
    this.xp = 0;
    this.level = 1;
    this.hiredAt = Date.now();
    this.lastActive = Date.now();
  }

  gainXP(amount) {
    this.xp += amount;
    const newLevel = Math.floor(Math.sqrt(this.xp / 100)) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.skill = Math.min(10, this.skill + 0.5);
      this.maxHp = 100 + this.level * 10;
      this.hp = this.maxHp;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.hp = 0;
    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isAlive() { return this.hp > 0; }
}

export class Fleet {
  constructor(options = {}) {
    this.id = options.id ?? `fleet_${Date.now()}`;
    this.name = options.name ?? 'Unnamed Fleet';
    this.captainName = options.captain ?? null;
    this.members = new Map();
    this.createdAt = Date.now();

    // Shared resources
    this.treasury = options.treasury ?? 0;
    this.sharedBait = new Map(); // baitId → { id, name, stackSize }
    this.sharedKnowledge = new Set(); // discovered fishing spots, species info

    // Progression
    this.xp = 0;
    this.level = 1;
    this.reputation = options.reputation ?? 0;

    // State
    this.status = 'docked'; // docked, expedition, returning, emergency
    this.currentVoyage = null;
    this.location = options.location ?? { x: 0, y: 64, z: 0 };
    this.targetLocation = null;

    // Chat
    this.chatLog = [];
    this.maxChatLog = 200;

    // History
    this.voyageHistory = [];
    this.totalCatch = 0;
    this.totalGoldEarned = 0;
  }

  /** Add a member to the fleet. */
  addMember(name, options = {}) {
    const member = options instanceof FleetMember
      ? options
      : new FleetMember(name, options);

    // If this is the captain, set fleet captain
    if (member.role === 'captain' || !this.captainName) {
      if (options.role === 'captain' || !this.captainName) {
        this.captainName = member.name;
        member.role = 'captain';
      }
    }

    this.members.set(name, member);
    this.broadcast(`⚓ ${name} joined the fleet as ${FLEET_ROLES[member.role]?.name ?? member.role}!`);
    return member;
  }

  /** Remove a member from the fleet. */
  removeMember(name) {
    const member = this.members.get(name);
    if (!member) return false;
    if (name === this.captainName) {
      // Transfer captaincy to next available member
      for (const [, m] of this.members) {
        if (m.name !== name) { this.captainName = m.name; m.role = 'captain'; break; }
      }
    }
    this.members.delete(name);
    this.broadcast(`👋 ${name} left the fleet.`);
    return true;
  }

  /** Get a member by name. */
  getMember(name) { return this.members.get(name) ?? null; }

  /** Get captain. */
  getCaptain() { return this.members.get(this.captainName) ?? null; }

  /** Get members by role. */
  getMembersByRole(role) {
    return [...this.members.values()].filter(m => m.role === role);
  }

  /** Get all online members. */
  getOnlineMembers() { return [...this.members.values()].filter(m => m.isOnline); }

  /** Broadcast a message to fleet chat. */
  broadcast(message, sender = 'System') {
    const entry = { sender, message, timestamp: Date.now() };
    this.chatLog.push(entry);
    if (this.chatLog.length > this.maxChatLog) this.chatLog.shift();
    return entry;
  }

  /** Add shared bait to the pool. */
  addSharedBait(bait) {
    const existing = this.sharedBait.get(bait.id);
    if (existing) {
      existing.stackSize += bait.stackSize;
    } else {
      this.sharedBait.set(bait.id, { id: bait.id, name: bait.name ?? bait.id, stackSize: bait.stackSize });
    }
  }

  /** Take bait from shared pool. */
  takeSharedBait(baitId, amount = 1) {
    const pool = this.sharedBait.get(baitId);
    if (!pool || pool.stackSize < amount) return null;
    pool.stackSize -= amount;
    if (pool.stackSize <= 0) this.sharedBait.delete(baitId);
    return { id: baitId, name: pool.name, stackSize: amount };
  }

  /** Add gold to treasury. */
  addGold(amount) {
    this.treasury += amount;
    this.totalGoldEarned += amount;
  }

  /** Spend gold from treasury. Returns false if insufficient. */
  spendGold(amount) {
    if (this.treasury < amount) return false;
    this.treasury -= amount;
    return true;
  }

  /** Grant fleet XP and check for level up. */
  grantXP(amount) {
    this.xp += amount;
    const newLevel = Math.floor(Math.sqrt(this.xp / 500)) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.broadcast(`🎉 Fleet leveled up to ${newLevel}!`);
      return true;
    }
    return false;
  }

  /** Change fleet reputation. */
  changeReputation(amount) {
    this.reputation = Math.max(-100, Math.min(100, this.reputation + amount));
  }

  /** Record a completed voyage. */
  recordVoyage(voyage) {
    this.voyageHistory.push({
      ...voyage, completedAt: Date.now(),
      catches: voyage.catches ?? [],
      goldEarned: voyage.goldEarned ?? 0,
      hazardsEncountered: voyage.hazardsEncountered ?? 0,
      membersLost: voyage.membersLost ?? 0,
    });
    this.totalCatch += voyage.catches?.length ?? 0;
  }

  /** Start an expedition. */
  startExpedition(target, plan = {}) {
    this.status = 'expedition';
    this.targetLocation = target;
    this.currentVoyage = {
      startedAt: Date.now(),
      target: { ...target },
      plan,
      catches: [],
      goldEarned: 0,
      hazardsEncountered: 0,
      membersLost: 0,
    };
    this.broadcast(`🚢 Setting sail for ${plan.name ?? 'unknown waters'}!`);
  }

  /** End current expedition. */
  endExpedition(success = true) {
    if (!this.currentVoyage) return;
    this.currentVoyage.success = success;
    this.currentVoyage.duration = Date.now() - this.currentVoyage.startedAt;
    this.recordVoyage(this.currentVoyage);
    this.status = 'docked';
    this.broadcast(success
      ? `⚓ Returned to port after ${Math.round(this.currentVoyage.duration / 60000)} min voyage!`
      : `⚠️ Emergency return to port!`);
    this.currentVoyage = null;
    this.targetLocation = null;
  }

  /** Get fleet status summary. */
  getStatus() {
    return {
      name: this.name, level: this.level, reputation: this.reputation,
      treasury: this.treasury, members: this.members.size,
      onlineMembers: this.getOnlineMembers().length,
      status: this.status, totalCatch: this.totalCatch,
      totalGold: this.totalGoldEarned, voyages: this.voyageHistory.length,
      sharedBait: [...this.sharedBait.values()],
    };
  }

  /** Get size of fleet. */
  get size() { return this.members.size; }
}

export default Fleet;
