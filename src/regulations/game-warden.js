// CraftMind Fishing — Game Warden Enforcement System
// ADF&G Wildlife Troopers patrol and inspect. Violations carry fines
// and consequences. Reputation matters.

import { checkHarvest } from './alaska-regulations.js';

/**
 * Violation severity → fine ranges and consequences.
 */
const VIOLATION_SEVERITY = {
  low: {
    fineRange: [50, 200],
    label: 'Minor Violation',
    consequences: ['verbal warning'],
    reputationPenalty: -2,
  },
  medium: {
    fineRange: [200, 1000],
    label: 'Moderate Violation',
    consequences: ['written citation', 'gear inspection'],
    reputationPenalty: -5,
  },
  high: {
    fineRange: [1000, 5000],
    label: 'Serious Violation',
    consequences: ['permit review', 'gear seizure possible'],
    reputationPenalty: -15,
  },
  critical: {
    fineRange: [5000, 25000],
    label: 'Criminal Violation',
    consequences: ['permit revocation', 'criminal charges', 'boat impound'],
    reputationPenalty: -50,
  },
};

export class GameWarden {
  constructor(options = {}) {
    this.basePatrolRate = options.basePatrolRate ?? 0.02; // per-tick chance
    this.playerFines = 0;
    this.violations = [];
    this.inspections = 0;
    this.reputation = options.startingReputation ?? 50; // 0-100
    this.trooperNames = [
      'Trooper Anderson', 'Trooper Miller', 'Trooper Davis',
      'Trooper Thompson', 'Trooper Garcia', 'Trooper Wilson',
      'Sgt. Nelson', 'Lt. Peterson',
    ];
  }

  /** Get current inspection probability. Near ports = higher. */
  getInspectionChance({ nearPort = false, offshore = false } = {}) {
    let chance = this.basePatrolRate;
    if (nearPort) chance *= 3;
    if (offshore) chance *= 0.2;
    // Good reputation → fewer inspections
    chance *= 1 - (this.reputation / 200);
    // Repeat offenders get more attention
    chance *= 1 + this.violations.length * 0.1;
    return Math.min(0.5, chance);
  }

  /** Run an inspection on the player's catch. */
  inspect({ speciesId, size, count, season, location }) {
    const nearPort = location?.nearPort ?? true;
    const offshore = location?.offshore ?? false;
    const chance = this.getInspectionChance({ nearPort, offshore });

    if (Math.random() > chance) return null;

    this.inspections++;
    const trooper = this.trooperNames[Math.floor(Math.random() * this.trooperNames.length)];
    const harvestCheck = checkHarvest({ speciesId, size, count, season });

    if (harvestCheck.legal) {
      return {
        inspected: true,
        trooper,
        result: 'clean',
        message: `"Everything looks good. Have a safe day out there." — ${trooper}`,
        reputationChange: 1,
      };
    }

    // Process violations
    const results = [];
    for (const violation of harvestCheck.violations) {
      const severity = violation.severity === 'high' ? 'high' : 'medium';
      const sevInfo = VIOLATION_SEVERITY[severity];
      const fine = sevInfo.fineRange[0] + Math.floor(Math.random() * (sevInfo.fineRange[1] - sevInfo.fineRange[0]));

      this.playerFines += fine;
      this.reputation = Math.max(0, this.reputation + sevInfo.reputationPenalty);
      this.violations.push({ ...violation, fine, trooper, timestamp: Date.now() });

      results.push({
        ...violation,
        fine,
        severity: sevInfo.label,
        consequences: sevInfo.consequences,
        trooper,
        message: `"${violation.message} That's a $${fine} fine." — ${trooper}`,
      });
    }

    // Check for consequences at low reputation
    if (this.reputation < 20 && Math.random() < 0.3) {
      results.push({
        type: 'permit_review',
        message: `"Your fishing permit is under review due to repeated violations. Clean up your act." — ${trooper}`,
      });
    }

    return { inspected: true, trooper, result: 'violation', violations: results };
  }

  /** Board the vessel — full inspection (event-based, less frequent). */
  boardVessel({ gear, permits, catchList, season }) {
    const chance = 0.005; // Very rare
    if (Math.random() > chance) return null;

    const trooper = this.trooperNames[Math.floor(Math.random() * this.trooperNames.length)];
    this.inspections++;

    const findings = [];

    // Check each species in catch
    for (const item of catchList ?? []) {
      const check = checkHarvest({ speciesId: item.speciesId, size: item.size, count: item.count, season });
      if (!check.legal) {
        findings.push(...check.violations);
      }
    }

    if (findings.length === 0) {
      return {
        boarded: true, trooper, result: 'clean',
        message: `"Vessel inspection complete. Everything's in order. Tight lines." — ${trooper}`,
      };
    }

    const totalFine = findings.reduce((sum, v) => sum + (v.fine ?? 200), 0);
    this.playerFines += totalFine;

    return {
      boarded: true, trooper, result: 'violations_found',
      totalFine,
      findings,
      message: `"We found ${findings.length} violation(s) during the boarding. Total fines: $${totalFine}." — ${trooper}`,
    };
  }

  /** Get player stats. */
  getStats() {
    return {
      reputation: Math.round(this.reputation),
      reputationLabel: this._reputationLabel(),
      totalFines: this.playerFines,
      totalViolations: this.violations.length,
      totalInspections: this.inspections,
      cleanInspections: this.inspections - this.violations.length,
    };
  }

  /** Check if permit is at risk. */
  isPermitAtRisk() {
    return this.reputation < 20;
  }

  /** Improve reputation over time (good behavior). */
  improveReputation(amount = 1) {
    this.reputation = Math.min(100, this.reputation + amount);
  }

  _reputationLabel() {
    if (this.reputation >= 80) return 'Respected Local';
    if (this.reputation >= 60) return 'Solid Citizen';
    if (this.reputation >= 40) return 'Average Fisherman';
    if (this.reputation >= 20) return 'Known to Troopers';
    return 'On Thin Ice';
  }
}

export default GameWarden;
