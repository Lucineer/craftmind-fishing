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
   * Uses standard RCON port calculation: serverPort + 10000
   */
  async handleStuck() {
    this.runner.interrupt?.();

    // Get RCON port from bot's server port (or use env var)
    const serverPort = this.bot._client?.options?.port || parseInt(process.env.RCON_PORT || '35566');
    // RCON port is serverPort + 10000 (e.g., 25566 -> 35566)
    // But if serverPort looks like an RCON port already (35xxx), use it directly
    const rconPort = serverPort >= 35000 ? serverPort : serverPort + 10000;
    const username = this.bot.username || 'Cody';

    try {
      const { createRequire } = await import('node:module');
      const req = createRequire(import.meta.url);
      const { Rcon } = req('rcon-client');

      const rcon = await Rcon.connect({
        host: 'localhost',
        port: rconPort,
        password: process.env.RCON_PASSWORD || 'fishing42'
      });

      // Teleport to dock coordinates (should have water nearby)
      await rcon.send(`tp ${username} 100 65 100`);
      console.log(`[Resilient] Teleported ${username} to dock (100,65,100) via RCON port ${rconPort}`);

      // Give supplies in case bot lost them
      await rcon.send(`give ${username} fishing_rod 3`);
      await rcon.send(`give ${username} bread 32`);
      console.log(`[Resilient] Gave ${username} supplies via RCON`);

      await rcon.end();
    } catch (err) {
      console.error(`[Resilient] RCON failed: ${err.message}`);
      // Force exit - night-shift daemon will restart
      console.error('[Resilient] Forcing exit for daemon restart...');
      process.exit(1);
    }

    // Wait for teleport to settle, then restart fishing
    setTimeout(() => this.startFallbackScript(), 3000);
  }

  /**
   * Start an emergency fallback script
   * Tries to restart the current script or use an emergency script
   */
  startFallbackScript() {
    console.log('[Resilient] Starting fallback script...');

    // First, try to restart the current script runner
    if (this.runner._currentScript) {
      console.log('[Resilient] Restarting current script...');
      this.runner.run(this.runner._currentScript);
      return;
    }

    // Use registered emergency scripts
    if (this.emergencyScripts.length > 0) {
      const script = this.emergencyScripts[Math.floor(Math.random() * this.emergencyScripts.length)];
      this.runner.run?.(script);
      return;
    }

    // Last resort: simple fishing loop
    console.log('[Resilient] No scripts available, using direct fishing loop');
    this._simpleFishLoop();
  }

  /**
   * Simple direct fishing loop for emergencies
   */
  async _simpleFishLoop() {
    const tryFish = async () => {
      if (!this.runner._running) return;

      const rod = this.bot.inventory?.items()?.find(i => i.name.includes('fishing_rod'));
      if (!rod) {
        console.error('[Resilient] No rod for emergency fishing');
        return;
      }

      try {
        await this.bot.equip(rod, 'hand');

        // Find water
        const waterId = this.bot.registry?.blocksByName?.water?.id;
        if (!waterId) return;

        const water = this.bot.findBlock({ matching: waterId, maxDistance: 20 });
        if (!water) {
          console.error('[Resilient] No water for emergency fishing');
          return;
        }

        this.bot.lookAt(water.position);
        await new Promise(r => setTimeout(r, 500));

        await this.bot.fish();
        console.log('[Resilient] Emergency fish caught');
      } catch (e) {
        console.error('[Resilient] Emergency fish error:', e.message);
      }

      // Loop after delay
      setTimeout(tryFish, 2000);
    };

    tryFish();
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
