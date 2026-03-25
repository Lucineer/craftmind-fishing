// CraftMind Fishing — Fleet Safety Systems
// SOS beacons, buddy system, emergency recall, rescue dispatch.

export class SafetyNet {
  constructor(fleet, options = {}) {
    this.fleet = fleet;
    this.callbacks = [];
    this.sosCooldowns = new Map();
    this.buddyPairs = new Map(); // memberName → buddyName
    this.rescueQueue = [];
    this.insurance = options.insurance ?? false;
    this.insuranceCoverage = options.insuranceCoverage ?? 0.5; // % of losses covered
    this.totalRescues = 0;
    this.totalPrevented = 0;

    // Wire into fleet if available
    if (fleet) {
      this._setupBuddySystem();
    }
  }

  /** Set up automatic buddy pairing. */
  _setupBuddySystem() {
    const members = [...this.fleet.members.values()].filter(m => m.isOnline);
    this.buddyPairs.clear();

    const paired = new Set();
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (paired.has(member.name)) continue;
      let bestBuddy = null, bestDist = Infinity;
      for (let j = 0; j < members.length; j++) {
        if (i === j || paired.has(members[j].name)) continue;
        const dist = this._distance(member.location, members[j].location);
        if (dist < bestDist) { bestDist = dist; bestBuddy = members[j]; }
      }
      if (bestBuddy) {
        this.buddyPairs.set(member.name, bestBuddy.name);
        this.buddyPairs.set(bestBuddy.name, member.name);
        paired.add(member.name);
        paired.add(bestBuddy.name);
      }
    }
  }

  /** Handle member in danger event. */
  memberInDanger(memberName, hazard) {
    const member = this.fleet?.getMember(memberName);
    if (!member) return;

    // Check SOS cooldown
    const lastSOS = this.sosCooldowns.get(memberName) ?? 0;
    if (Date.now() - lastSOS < 10000) return; // 10s cooldown
    this.sosCooldowns.set(memberName, Date.now());

    // Check insurance
    if (this.insurance) {
      this._fireEvent({
        type: 'insurance_claim',
        member: memberName,
        hazard: hazard?.name ?? 'unknown',
        coverage: this.insuranceCoverage,
      });
    }

    // Broadcast SOS
    this.fleet?.broadcast(`🆘 HELP! ${memberName} is under attack by ${hazard?.name ?? 'a hazard'}!`);

    // Auto-dispatch rescue
    this.dispatchRescue(memberName, hazard);
  }

  /** Dispatch nearby members to rescue. */
  dispatchRescue(targetName, hazard = null) {
    const target = this.fleet?.getMember(targetName);
    if (!target) return;

    // Check buddy first
    const buddyName = this.buddyPairs.get(targetName);
    if (buddyName) {
      const buddy = this.fleet?.getMember(buddyName);
      if (buddy?.isOnline && buddy?.status !== 'in_danger') {
        this._fireEvent({
          type: 'rescue_dispatched',
          rescuer: buddyName,
          target: targetName,
          hazard: hazard?.name,
          method: 'buddy_system',
        });
        this.totalRescues++;
        return;
      }
    }

    // Find nearest support or tanker
    const rescuers = [...(this.fleet?.members.values() ?? [])]
      .filter(m => m.isOnline && m.name !== targetName && (m.role === 'support' || m.role === 'tanker'))
      .sort((a, b) => this._distance(target.location, a.location) - this._distance(target.location, b.location));

    if (rescuers.length > 0) {
      const rescuer = rescuers[0];
      this._fireEvent({
        type: 'rescue_dispatched',
        rescuer: rescuer.name,
        target: targetName,
        hazard: hazard?.name,
        method: 'nearest_role',
      });
      this.totalRescues++;
    }
  }

  /** Emergency recall all fleet members. */
  emergencyRecall() {
    this.fleet?.broadcast('🚨 EMERGENCY RECALL! All members return to port immediately!');
    for (const [, member] of this.fleet?.members ?? []) {
      if (member.isOnline) {
        member.status = 'returning';
      }
    }
    this._fireEvent({ type: 'emergency_recall', timestamp: Date.now() });
  }

  /** Share bait from pool to member who needs it. */
  supplyBackupBait(memberName, baitId, amount = 5) {
    const bait = this.fleet?.takeSharedBait(baitId, amount);
    if (!bait) return false;
    this._fireEvent({ type: 'backup_bait', member: memberName, bait: baitId, amount });
    return true;
  }

  /** Support bot heals a member. */
  medicalEvacuation(targetName) {
    const support = [...(this.fleet?.members.values() ?? [])]
      .find(m => m.role === 'support' && m.isOnline);

    if (!support) return false;

    const target = this.fleet?.getMember(targetName);
    if (!target) return false;

    const healAmount = 30 + support.skill * 5;
    target.heal(healAmount);
    this.totalPrevented++;

    this._fireEvent({
      type: 'medical_evac',
      support: support.name,
      target: targetName,
      healAmount,
    });
    return true;
  }

  /** Share intelligence about a hazard with the whole fleet. */
  shareIntelligence(hazard, scoutName) {
    this.fleet?.broadcast(`📢 ${scoutName} reports: ${hazard.name} detected at (${hazard.location.x}, ${hazard.location.z})!`);
  }

  /** Check all members for safety issues. */
  safetyCheck() {
    const issues = [];
    for (const [, member] of this.fleet?.members ?? []) {
      if (!member.isOnline) continue;

      if (member.hp < member.maxHp * 0.3) {
        issues.push({ type: 'low_hp', member: member.name, hp: member.hp });
      }
      if (member.boat?.damaged && member.boat.hp < member.boat.maxHp * 0.25) {
        issues.push({ type: 'boat_critical', member: member.name });
      }
    }
    return issues;
  }

  /** Register event callback. */
  onEvent(callback) { this.callbacks.push(callback); }

  /** Get safety stats. */
  getStats() {
    return {
      totalRescues: this.totalRescues,
      totalPrevented: this.totalPrevented,
      buddyPairs: this.buddyPairs.size,
      insurance: this.insurance,
      coverage: this.insurance ? `${this.insuranceCoverage * 100}%` : 'none',
    };
  }

  _distance(a, b) {
    if (!a || !b) return Infinity;
    const dx = (a.x ?? 0) - (b.x ?? 0);
    const dz = (a.z ?? 0) - (b.z ?? 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  _fireEvent(event) {
    for (const cb of this.callbacks) try { cb(event); } catch {}
  }
}

export default SafetyNet;
