/**
 * @module craftmind-fishing/mineflayer/survival
 * @description Autonomous survival behavior: hostile mob detection, combat, fleeing.
 * Priority: creepers (always flee) > low health (flee) > has weapon (fight) > flee
 */

const HOSTILE_MOBS = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman', 'blaze', 'witch', 'drowned', 'phantom'];

export class Survival {
  /**
   * @param {import('mineflayer').Bot} bot
   */
  constructor(bot) {
    this.bot = bot;
    this.active = true;
    this._currentTarget = null;
    this._attackInterval = null;
    this._scanInterval = null;
    this._setupListeners();
  }

  _setupListeners() {
    this.bot.on('entityHurt', (entity) => {
      if (entity === this.bot.entity) {
        this._onHurt();
      }
    });

    this.bot.on('spawn', () => {
      this._clearAttack();
    });

    this.bot.on('death', () => {
      this._clearAttack();
    });

    // Proactive threat scanning
    this._scanInterval = setInterval(() => this._scanForThreats(), 2000);
  }

  _scanForThreats() {
    if (!this.active || !this.bot.entity || this.bot.health <= 0) return;

    const nearestHostile = this.bot.nearestEntity(e =>
      e.type === 'mob' &&
      HOSTILE_MOBS.some(m => e.name?.includes(m)) &&
      e.position.distanceTo(this.bot.entity.position) < 16
    );

    if (nearestHostile) {
      const dist = nearestHostile.position.distanceTo(this.bot.entity.position);

      // Creepers: always flee if close
      if (nearestHostile.name?.includes('creeper') && dist < 6) {
        this._fleeFrom(nearestHostile);
        return;
      }

      // Low health: flee
      if (this.bot.health <= 6) {
        this._fleeFrom(nearestHostile);
        return;
      }

      // Has weapon: fight
      if (this._hasWeapon()) {
        this._attack(nearestHostile);
      } else {
        // Punch if no weapon and mob is close
        if (dist < 3) {
          this._attack(nearestHostile);
        } else {
          this._fleeFrom(nearestHostile);
        }
      }
    }
  }

  _onHurt() {
    if (!this.active) return;

    const attacker = this.bot.nearestEntity(e =>
      e.type === 'mob' &&
      HOSTILE_MOBS.some(m => e.name?.includes(m)) &&
      e.position.distanceTo(this.bot.entity.position) < 16
    );

    if (attacker) {
      if (this.bot.health <= 6) {
        this._fleeFrom(attacker);
      } else {
        this._attack(attacker);
      }
    }
  }

  _hasWeapon() {
    return this.bot.inventory.items().some(i =>
      i.name.includes('sword') || i.name.includes('axe')
    );
  }

  _equipBestWeapon() {
    const weapons = this.bot.inventory.items().filter(i =>
      i.name.includes('sword') || i.name.includes('axe')
    );
    const priority = [
      'diamond_sword', 'iron_sword', 'golden_sword', 'stone_sword', 'wooden_sword',
      'diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe',
    ];
    for (const wpn of priority) {
      const item = weapons.find(w => w.name === wpn);
      if (item) {
        try {
          this.bot.equip(item, 'hand');
        } catch {
          // ignore equip errors
        }
        return true;
      }
    }
    return false;
  }

  _attack(entity) {
    if (!entity || entity.position.distanceTo(this.bot.entity.position) > 20) {
      this._clearAttack();
      return;
    }

    this._currentTarget = entity;

    // Equip best weapon
    this._equipBestWeapon();

    // Look at entity
    try {
      this.bot.lookAt(entity.position.offset(0, entity.height || 1.8, 0));
    } catch {
      // ignore
    }

    // Attack
    try {
      this.bot.attack(entity);
    } catch {
      // ignore
    }

    // Continue attacking if target is still alive and close
    if (!this._attackInterval) {
      this._attackInterval = setInterval(() => {
        if (!this.active || !this.bot.entity || this.bot.health <= 0) {
          this._clearAttack();
          return;
        }

        if (!this._currentTarget || this._currentTarget.isValid === false ||
            this._currentTarget.position.distanceTo(this.bot.entity.position) > 20) {
          this._clearAttack();
          return;
        }

        try {
          this.bot.lookAt(this._currentTarget.position.offset(0, this._currentTarget.height || 1.8, 0));
          this.bot.attack(this._currentTarget);
        } catch {
          this._clearAttack();
        }
      }, 1000);
    }
  }

  _clearAttack() {
    if (this._attackInterval) {
      clearInterval(this._attackInterval);
      this._attackInterval = null;
    }
    this._currentTarget = null;
    this.bot.clearControlStates?.();
  }

  _fleeFrom(entity) {
    this._clearAttack();

    if (!this.bot.entity) return;

    const pos = this.bot.entity.position;
    const epos = entity.position;
    const dx = pos.x - epos.x;
    const dz = pos.z - epos.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;

    // Sprint away
    this.bot.setControlState('sprint', true);
    this.bot.setControlState('forward', true);

    // Look in flee direction
    const fleeYaw = Math.atan2(-dx, dz);
    try {
      this.bot.look(fleeYaw, 0);
    } catch {
      // ignore
    }

    // Clear after 2 seconds
    setTimeout(() => {
      this.bot.clearControlStates?.();
    }, 2000);

    // Occasional chat
    if (Math.random() < 0.5) {
      this.bot.chat(this._getFleeDialogue());
    }
  }

  _getFleeDialogue() {
    const lines = [
      "I'm getting out of here!",
      "Not today!",
      "This is above my pay grade.",
      "Run!",
      "Time to go!",
      "Nope!",
      "Not dealing with that.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  /** Get nearest hostile mob within range */
  getNearestHostile(range = 16) {
    if (!this.bot.entity) return null;
    return this.bot.nearestEntity(e =>
      e.type === 'mob' &&
      HOSTILE_MOBS.some(m => e.name?.includes(m)) &&
      e.position.distanceTo(this.bot.entity.position) < range
    );
  }

  /** Check if currently in combat */
  get isInCombat() {
    return this._currentTarget !== null;
  }

  stop() {
    this.active = false;
    this._clearAttack();
    clearInterval(this._scanInterval);
  }

  start() {
    this.active = true;
    if (!this._scanInterval) {
      this._scanInterval = setInterval(() => this._scanForThreats(), 2000);
    }
  }
}

export default Survival;
