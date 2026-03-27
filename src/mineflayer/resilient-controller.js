#!/usr/bin/env node
/**
 * Resilient Script Controller
 * 
 * Ensures the bot always has something to do, even when:
 * - All APIs are down
 * - Scripts error out  
 * - The bot gets stuck
 * - Server restarts
 * 
 * Fallback chain: LLM script → local Moondream insight → heuristic → emergency idle
 */

export class ResilientController {
  constructor(scriptRunner, visionSystem, options = {}) {
    this.runner = scriptRunner;
    this.vision = visionSystem;
    this.bot = scriptRunner.bot;
    
    this.stuckCount = 0;
    this.lastPosition = null;
    this.lastCheckTime = 0;
    this.checkInterval = options.checkInterval || 10000; // 10s
    this.stuckThreshold = options.stuckThreshold || 3; // checks before intervention
    this.emergencyScripts = [];
    
    // Track API availability
    this.apiStatus = {
      zai: true,
      gemini: true,
      deepseek: true,
      ollama: true,
      lastChecked: 0,
    };
  }

  /**
   * Register emergency fallback scripts — always available, no API needed
   */
  registerEmergencyScript(script) {
    this.emergencyScripts.push(script);
  }

  /**
   * Main tick — called every checkInterval
   * Returns true if intervention was needed
   */
  async tick() {
    const now = Date.now();
    if (now - this.lastCheckTime < this.checkInterval) return false;
    this.lastCheckTime = now;

    // 1. Safety first
    const safety = this.vision.quickCheck();
    if (!safety.safe) {
      console.log(`[Resilient] Safety issue: ${safety.reason} → ${safety.action}`);
      await this.handleSafety(safety);
      return true;
    }

    // 2. Stuck detection
    const pos = this.bot?.entity?.position;
    if (pos) {
      if (this.lastPosition) {
        const dist = pos.distanceTo(this.lastPosition);
        if (dist < 0.5 && this.runner.isRunning) {
          this.stuckCount++;
        } else {
          this.stuckCount = 0;
        }
      }
      this.lastPosition = pos.clone();
    }

    if (this.stuckCount >= this.stuckThreshold) {
      console.log(`[Resilient] Bot stuck for ${this.stuckCount} checks, intervening...`);
      await this.handleStuck();
      this.stuckCount = 0;
      return true;
    }

    // 3. Check if script runner is still alive
    if (!this.runner.isRunning && this.runner._lastStartTime) {
      const idleTime = now - this.runner._lastStartTime;
      if (idleTime > 30000) { // Idle for 30s
        console.log('[Resilient] Script runner idle, restarting...');
        await this.runner.randomSwitch?.() || this.startFallbackScript();
        return true;
      }
    }

    return false;
  }

  /**
   * Handle safety issues (health, drowning, hostile mobs)
   */
  async handleSafety(safety) {
    switch (safety.action) {
      case 'eat_or_flee':
        // Stop everything, try to eat
        this.runner.interrupt?.();
        const food = this.bot.inventory?.items()?.find(i => 
          i.name === 'bread' || i.name === 'cooked_beef' || i.name.includes('food')
        );
        if (food) {
          try {
            await this.bot.equip(food, 'hand');
            await this.bot.consume();
          } catch {}
        }
        break;

      case 'swim_up':
        this.bot.setControlState('jump', true);
        setTimeout(() => this.bot.setControlState('jump', false), 2000);
        break;

      case 'flee':
        this.runner.interrupt?.();
        // Run away from threat
        const entity = this.bot.nearestEntity(e => 
          ['zombie', 'skeleton', 'creeper', 'spider'].includes(e.name)
        );
        if (entity) {
          const dx = this.bot.entity.position.x - entity.position.x;
          const dz = this.bot.entity.position.z - entity.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz) || 1;
          this.bot.setControlState('forward', true);
          this.bot.setControlState('sprint', true);
          this.bot.lookAt(this.bot.entity.position.offset(dx / dist, 0, dz / dist));
          setTimeout(() => {
            this.bot.setControlState('forward', false);
            this.bot.setControlState('sprint', false);
          }, 3000);
        }
        break;
    }
  }

  /**
   * Handle stuck bot — teleport back to dock via RCON
   */
  async handleStuck() {
    this.runner.interrupt?.();
    
    // Teleport bot back to fishing dock via RCON
    const port = this.bot._client?.options?.port || 25566;
    const rconPort = port + 10000;
    const username = this.bot.username || 'Cody';
    
    try {
      const { Rcon } = await import('rcon-client');
      const rcon = await Rcon.connect({ host: 'localhost', port: rconPort, password: 'fishing42' });
      await rcon.send(`tp ${username} 100 65 100`);
      console.log(`[Resilient] Teleported ${username} to dock (100,65,100) via RCON`);
      await rcon.end();
    } catch (err) {
      console.warn(`[Resilient] RCON teleport failed: ${err.message}, trying walk fallback`);
      // Walk toward dock area as fallback
      const pos = this.bot.entity?.position;
      if (pos) {
        const dx = 100 - pos.x;
        const dz = 100 - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 2) {
          this.bot.setControlState('forward', true);
          this.bot.lookAt(this.bot.entity.position.offset(dx / dist, 0, dz / dist));
          setTimeout(() => {
            this.bot.setControlState('forward', false);
            this.startFallbackScript();
          }, 5000);
          return;
        }
      }
    }

    // Wait for teleport to settle, then restart fishing
    setTimeout(() => this.startFallbackScript(), 2000);
  }

  /**
   * Start an emergency fallback script
   */
  startFallbackScript() {
    if (this.emergencyScripts.length > 0) {
      const script = this.emergencyScripts[Math.floor(Math.random() * this.emergencyScripts.length)];
      this.runner.run?.(script);
    } else {
      // Built-in emergency: look around, then try fishing
      try {
        this.bot.lookAt(this.bot.entity.position.offset(0, 0, -5));
        setTimeout(() => {
          const rod = this.bot.inventory?.items()?.find(i => i.name.includes('fishing_rod'));
          if (rod) {
            this.bot.equip(rod, 'hand').catch(() => {});
            setTimeout(() => this.bot.fish().catch(() => {}), 1000);
          }
        }, 2000);
      } catch {}
    }
  }

  /**
   * Quick API health check
   */
  async checkAPIs() {
    const results = {};
    
    // Ollama
    try {
      const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
      results.ollama = res.ok;
    } catch { results.ollama = false; }

    this.apiStatus = { ...this.apiStatus, ...results, lastChecked: Date.now() };
    return this.apiStatus;
  }

  /**
   * Get best available analysis source
   */
  getAvailableSource() {
    const s = this.apiStatus;
    if (s.ollama) return 'local';
    if (s.gemini) return 'cloud';
    return 'heuristic';
  }
}

/**
 * Emergency scripts — guaranteed to work with no APIs
 */
export const EMERGENCY_SCRIPTS = [
  {
    name: 'emergency_fish',
    steps: [
      { type: 'chat', pick: () => '*looks around*' },
      { type: 'fish' },
      { type: 'branch',
        condition: () => Math.random() > 0.5,
        ifTrue: { type: 'chat', pick: () => null },
        ifFalse: { type: 'chat', pick: () => '...' },
      },
      { type: 'goto', scriptName: 'emergency_fish' },
    ]
  },
  {
    name: 'emergency_idle',
    steps: [
      { type: 'chat', pick: () => '*waits*' },
      { type: 'wait', ms: 5000 },
      { type: 'chat', pick: () => Math.random() > 0.7 ? '*stretches*' : null },
      { type: 'wait', ms: 8000 },
      { type: 'goto', scriptName: 'emergency_idle' },
    ]
  },
  {
    name: 'emergency_explore',
    steps: [
      { type: 'chat', pick: () => 'Let me check over here...' },
      { type: 'wait', ms: 3000 },
      { type: 'fish' },
      { type: 'chat', pick: () => Math.random() > 0.5 ? 'Different spot.' : null },
      { type: 'wait', ms: 5000 },
      { type: 'goto', scriptName: 'emergency_explore' },
    ]
  },
];
