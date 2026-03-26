#!/usr/bin/env node
/**
 * Vision System — local visual understanding for Minecraft bots
 * 
 * Uses Moondream (Ollama) for vision when available, falls back to
 * structured scene descriptions from mineflayer world state.
 * 
 * Architecture:
 *   1. Scene capture (mineflayer world state → structured description)
 *   2. Local analysis (Moondream via Ollama API)
 *   3. Cloud analysis (Gemini vision for screenshots, if available)
 *   4. Fallback (heuristic rules, no API needed)
 * 
 * Usage:
 *   import { VisionSystem } from './vision.js';
 *   const vision = new VisionSystem(bot);
 *   const analysis = await vision.analyze('What should I do next?');
 */

const OLLAMA_URL = 'http://localhost:11434';
const MOONDREAM_MODEL = 'moondream';

export class VisionSystem {
  constructor(bot, options = {}) {
    this.bot = bot;
    this.ollamaAvailable = true;
    this.lastAnalysis = null;
    this.analysisCache = new Map(); // key → { result, timestamp }
    this.cacheTTL = options.cacheTTL || 30000; // 30s cache
    this.timeout = options.timeout || 15000;
  }

  /**
   * Check if Ollama/Moondream is available
   */
  async checkLocalVision() {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      const models = data.models?.map(m => m.name) || [];
      this.ollamaAvailable = models.some(m => m.includes('moondream'));
      return this.ollamaAvailable;
    } catch {
      this.ollamaAvailable = false;
      return false;
    }
  }

  /**
   * Capture current scene as structured text from mineflayer state
   */
  captureScene() {
    const bot = this.bot;
    if (!bot?.entity) return null;

    const pos = bot.entity.position;
    const vel = bot.entity.velocity;
    const health = bot.health;
    const food = bot.food;
    
    // Blocks around bot
    const blocks = {
      below: bot.blockAt(pos.offset(0, -1, 0))?.name || 'unknown',
      inFront: bot.blockAt(pos.offset(0, 0, -1))?.name || 'unknown',
      waterNearby: false,
      lavaNearby: false,
    };

    // Scan for water/lava
    for (let dx = -6; dx <= 6; dx++) {
      for (let dz = -6; dz <= 6; dz++) {
        const block = bot.blockAt(pos.offset(dx, 0, dz));
        if (block?.name === 'water') blocks.waterNearby = true;
        if (block?.name === 'lava') blocks.lavaNearby = true;
      }
    }

    // Nearest entities
    const entities = [];
    for (const [id, entity] of bot.entities) {
      if (id === bot.entity.id) continue;
      const dist = pos.distanceTo(entity.position);
      if (dist < 30) {
        entities.push({
          name: entity.name || entity.username || 'unknown',
          type: entity.type,
          distance: Math.round(dist * 10) / 10,
          health: entity.health || 0,
          position: entity.position,
        });
      }
    }
    entities.sort((a, b) => a.distance - b.distance);

    // Inventory summary
    const inventory = bot.inventory?.items() || [];
    const hasRod = inventory.some(i => i.name.includes('fishing_rod'));
    const hasSword = inventory.some(i => i.name.includes('sword'));
    const hasFood = inventory.filter(i => i.name.includes('food') || i.name === 'bread' || i.name === 'cooked_beef').length;
    const hasBoat = inventory.some(i => i.name === 'oak_boat' || i.name.includes('boat'));

    // Time of day
    const time = bot.time?.ofday || 0; // 0-1 where 0.25=sunrise, 0.5=noon, 0.75=sunset
    const timeOfDay = time < 0.25 ? 'night' : time < 0.35 ? 'dawn' : time < 0.65 ? 'day' : time < 0.8 ? 'dusk' : 'night';

    return {
      position: { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) },
      velocity: { x: Math.round(vel.x * 100) / 100, y: Math.round(vel.y * 100) / 100, z: Math.round(vel.z * 100) / 100 },
      health,
      food,
      blocks,
      nearbyEntities: entities.slice(0, 10), // Top 10 closest
      inventory: { hasRod, hasSword, hasFood, hasBoat, total: inventory.length },
      timeOfDay,
      isMoving: Math.abs(vel.x) > 0.1 || Math.abs(vel.z) > 0.1,
      isInWater: blocks.below === 'water' || blocks.inFront === 'water',
      timestamp: Date.now(),
    };
  }

  /**
   * Describe scene for Moondream prompt
   */
  sceneToText(scene) {
    if (!scene) return 'No scene data available.';
    
    const lines = [
      `Minecraft bot at (${scene.position.x}, ${scene.position.y}, ${scene.position.z})`,
      `Health: ${scene.health}/20, Food: ${scene.food}/20`,
      `Standing on: ${scene.blocks.below}`,
      `Water nearby: ${scene.blocks.waterNearby}, Lava nearby: ${scene.blocks.lavaNearby}`,
      `Time: ${scene.timeOfDay}`,
      `Inventory: ${scene.inventory.hasRod ? '🎣' : '❌'}rod ${scene.inventory.hasSword ? '⚔️' : '❌'}sword ${scene.inventory.hasFood ? '🍞' : '❌'}food ${scene.inventory.hasBoat ? '🚣' : '❌'}boat`,
    ];

    if (scene.nearbyEntities.length > 0) {
      lines.push(`Nearby entities (${scene.nearbyEntities.length}):`);
      for (const e of scene.nearbyEntities.slice(0, 5)) {
        lines.push(`  - ${e.name} (${e.type}) at ${e.distance} blocks`);
      }
    } else {
      lines.push('No nearby entities.');
    }

    return lines.join('\n');
  }

  /**
   * Analyze scene using local Moondream (Ollama)
   */
  async analyzeLocal(prompt, scene) {
    if (!this.ollamaAvailable) return null;
    
    const sceneText = this.sceneToText(scene);
    const fullPrompt = `You are a Minecraft bot advisor. Given this game state:\n\n${sceneText}\n\n${prompt}\n\nRespond in 1-2 short sentences. Be specific and actionable.`;

    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MOONDREAM_MODEL,
          prompt: fullPrompt,
          stream: false,
          options: { num_predict: 100, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(this.timeout),
      });
      const data = await res.json();
      return data.response?.trim() || null;
    } catch (e) {
      console.error('[Vision] Local analysis failed:', e.message);
      this.ollamaAvailable = false;
      return null;
    }
  }

  /**
   * Analyze using cloud API (Gemini vision)
   */
  async analyzeCloud(prompt, scene) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const sceneText = this.sceneToText(scene);
    
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Minecraft bot advisor. Game state:\n${sceneText}\n\n${prompt}\n\n1-2 short sentences, specific and actionable.` }]
            }],
            generationConfig: { maxOutputTokens: 150, temperature: 0.3 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (e) {
      console.error('[Vision] Cloud analysis failed:', e.message);
      return null;
    }
  }

  /**
   * Heuristic fallback — no API needed
   */
  analyzeHeuristic(scene) {
    if (!scene) return { action: 'idle', priority: 'low' };

    const issues = [];
    const actions = [];

    // Health check
    if (scene.health < 10) {
      issues.push('LOW HEALTH');
      actions.push({ action: 'eat_food', priority: 'critical', reason: 'Health below 50%' });
    }
    
    // Food check
    if (scene.food < 10 && scene.inventory.hasFood) {
      issues.push('HUNGRY');
      actions.push({ action: 'eat', priority: 'high', reason: 'Food bar low' });
    } else if (scene.food < 10 && !scene.inventory.hasFood) {
      actions.push({ action: 'find_food', priority: 'high', reason: 'Hungry, no food in inventory' });
    }

    // Danger check
    const hostileEntities = scene.nearbyEntities.filter(e => 
      e.type === 'hostile' || ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'].includes(e.name)
    );
    if (hostileEntities.length > 0 && hostileEntities[0].distance < 10) {
      actions.push({ action: 'flee_or_fight', priority: 'critical', reason: `Hostile ${hostileEntities[0].name} at ${hostileEntities[0].distance} blocks` });
    }

    // Fishing context
    if (scene.inventory.hasRod && scene.blocks.waterNearby) {
      actions.push({ action: 'fish', priority: 'normal', reason: 'Has rod and water nearby' });
    } else if (scene.inventory.hasRod && !scene.blocks.waterNearby) {
      actions.push({ action: 'find_water', priority: 'normal', reason: 'Has rod but no water nearby' });
    }

    // Idle/lost
    if (actions.length === 0) {
      actions.push({ action: 'idle_or_explore', priority: 'low', reason: 'No immediate needs' });
    }

    return { issues, actions, scene: scene.position, timestamp: scene.timestamp };
  }

  /**
   * Main analyze method — tries local → cloud → heuristic
   */
  async analyze(prompt = 'What should I do next?') {
    const cacheKey = `${prompt}:${Math.floor(Date.now() / this.cacheTTL)}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const scene = this.captureScene();
    if (!scene) return { action: 'no_scene', priority: 'low' };

    // Always run heuristic (fast, no API)
    const heuristic = this.analyzeHeuristic(scene);

    // Try local vision
    let localResult = null;
    if (this.ollamaAvailable) {
      localResult = await this.analyzeLocal(prompt, scene);
    }

    // If local failed and prompt needs deep analysis, try cloud
    let cloudResult = null;
    if (!localResult && (prompt.includes('evaluate') || prompt.includes('improve') || prompt.includes('why'))) {
      cloudResult = await this.analyzeCloud(prompt, scene);
    }

    const result = {
      scene,
      heuristic,
      localInsight: localResult,
      cloudInsight: cloudResult,
      recommendedAction: heuristic.actions[0]?.action || 'idle',
      priority: heuristic.actions[0]?.priority || 'low',
      reasoning: localResult || cloudResult || heuristic.actions[0]?.reason || 'No analysis',
      source: localResult ? 'local' : cloudResult ? 'cloud' : 'heuristic',
    };

    this.lastAnalysis = result;
    this.analysisCache.set(cacheKey, result);

    return result;
  }

  /**
   * Quick health/safety check — always runs, never blocks
   */
  quickCheck() {
    const scene = this.captureScene();
    if (!scene) return { safe: false, reason: 'no_scene' };
    
    if (scene.health < 6) return { safe: false, reason: 'critical_health', action: 'eat_or_flee' };
    if (scene.isInWater && scene.health < 15) return { safe: false, reason: 'drowning', action: 'swim_up' };
    
    const hostileNear = scene.nearbyEntities.find(e => 
      ['zombie', 'skeleton', 'creeper', 'spider'].includes(e.name) && e.distance < 8
    );
    if (hostileNear) return { safe: false, reason: 'hostile_nearby', action: 'flee', entity: hostileNear.name, distance: hostileNear.distance };
    
    return { safe: true, reason: 'all_clear' };
  }
}
