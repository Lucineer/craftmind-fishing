/**
 * @module craftmind-fishing/ai/action-planner
 * @description Takes natural language input and produces a plan of structured actions using LLM.
 * Falls back to pattern matching when LLM is unavailable.
 */

import { ACTION_TYPES } from './action-schema.js';
import { ConversationMemory } from './conversation-memory.js';

export class ActionPlanner {
  /**
   * @param {Object} llmClient - LLM client with a chat() method (e.g., craftmind Brain)
   * @param {Object} context - Game/AI context providers
   * @param {Function} context.getGameState - Returns current game state
   * @param {Function} context.getPersonality - Returns personality state
   * @param {Function} context.getMemory - Returns memory module
   * @param {Function} context.getRelationships - Returns relationships module
   */
  constructor(llmClient, context) {
    this.llm = llmClient;
    this.context = context;
    this.memory = new ConversationMemory();
    this._planning = false;
  }

  /**
   * Plan actions from natural language input.
   * @param {string} input - Player's chat message
   * @param {string} playerName - Name of the player
   * @returns {Promise<{actions: Array, dialogue: string, fallback: boolean}>}
   */
  async plan(input, playerName = 'stranger') {
    // Record in memory
    this.memory.add('player', input, { player: playerName });

    // Try LLM first
    if (this.llm && this._isLLMAvailable()) {
      try {
        this._planning = true;
        const plan = await this._planWithLLM(input, playerName);
        this._planning = false;
        if (plan) {
          this.memory.add('cody', plan.dialogue);
          return { ...plan, fallback: false };
        }
      } catch (err) {
        this._planning = false;
      }
    }

    // Fallback to pattern matching
    const fallback = this._fallbackPlan(input, playerName);
    this.memory.add('cody', fallback.dialogue);
    return { ...fallback, fallback: true };
  }

  /**
   * Build LLM prompt and parse response.
   * @private
   */
  async _planWithLLM(input, playerName) {
    const gameState = this.context.getGameState?.() || {};
    const personality = this.context.getPersonality?.() || {};
    const mem = this.context.getMemory?.();
    const rels = this.context.getRelationships?.();
    const convCtx = this.memory.getContext();

    const relationship = rels?.get?.(playerName);
    const relStr = relationship
      ? `Relationship: trust=${(relationship.trust * 100) | 0}%, familiarity=${(relationship.familiarity * 100) | 0}%`
      : 'New player';

    const systemPrompt = `You are Cody, an experienced Alaska fisherman in Sitka. You're stubborn, patient, superstitious, and talkative.
You speak in short, gruff sentences. You have strong opinions about gear and technique.
Pink hoochies are the best lure. 3.5 knots trolling speed. Fish the kelp line edge.
${personality.moodSnapshot ? `Current mood: ${JSON.stringify(personality.moodSnapshot)}` : ''}
${relStr}

CURRENT SITUATION:
${gameState.summary ? gameState.summary : JSON.stringify(gameState).slice(0, 500)}

RECENT CONVERSATION:
${convCtx.recentMessages.join('\n') || '(no recent messages)'}

AVAILABLE ACTION TYPES (respond with ONLY these):
${Object.entries(ACTION_TYPES).map(([k, v]) => `${k}: ${v.description} params=[${v.params.join(',')}]`).join('\n')}

RESPOND WITH JSON ONLY. No explanation, no markdown:
{
  "thinking": "brief internal thought",
  "actions": [{ "type": "ACTION_NAME", "params": { "paramName": "value" }, "reasoning": "why" }],
  "dialogue": "What Cody says in chat (short, gruff, personality-driven)"
}

Rules:
- Keep dialogue under 2 sentences. Be gruff and real.
- Use 1-4 actions max. Simple requests = 1 action.
- If just chatting (no action needed), return empty actions array.
- Match Cody's personality: helpful but terse, opinionated, experienced.`;

    const userMessage = `Player ${playerName} says: "${input}"`;

    // Use the LLM client
    let response;
    if (this.llm.setSystemPrompt) {
      const oldPrompt = this.llm.systemPrompt;
      this.llm.setSystemPrompt(systemPrompt);
      response = await this.llm.chat(userMessage, { _noHistory: true });
      this.llm.setSystemPrompt(oldPrompt);
    } else {
      response = await this.llm.chat(userMessage);
    }

    if (!response) return null;
    return this._parseResponse(response);
  }

  /**
   * Parse LLM JSON response.
   * @private
   */
  _parseResponse(text) {
    // Try to extract JSON from response
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const parsed = JSON.parse(jsonStr);
      const actions = (parsed.actions || []).map(a => ({
        type: (a.type || '').toUpperCase(),
        params: a.params || {},
        reasoning: a.reasoning || '',
      }));
      return {
        actions,
        dialogue: parsed.dialogue || '*grunts*',
        thinking: parsed.thinking || '',
      };
    } catch {
      // Fallback: treat entire response as dialogue
      return { actions: [], dialogue: text.slice(0, 200), thinking: '', parseFailed: true };
    }
  }

  /**
   * Check if LLM is available.
   * @private
   */
  _isLLMAvailable() {
    if (this.llm.health) return this.llm.health.healthy;
    return true;
  }

  /**
   * Pattern matching fallback when LLM is unavailable.
   * @private
   */
  _fallbackPlan(input, playerName) {
    const lower = input.toLowerCase();
    const trimmed = lower.replace(/[^a-z0-9\s']/g, ' ').trim();

    // Weather check
    if (/weather|rain|wind|storm|forecast|how.*(look|is it)/i.test(lower)) {
      return {
        actions: [{ type: 'CHECK', params: { thing: 'weather' }, reasoning: 'Player asked about weather' }],
        dialogue: 'Let me check the sky.',
      };
    }

    // Tide check
    if (/tide|current|water level/i.test(lower)) {
      return {
        actions: [{ type: 'CHECK', params: { thing: 'tide' }, reasoning: 'Player asked about tide' }],
        dialogue: 'Checking the tide.',
      };
    }

    // Let's go fishing
    if (/let.*(fish|go)|start fishing|want to fish|time to fish|ready to fish/i.test(lower)) {
      return {
        actions: [
          { type: 'EQUIP', params: { item: 'fishing_rod' }, reasoning: 'Get gear ready' },
          { type: 'FISH', params: { method: 'salmon_trolling' }, reasoning: 'Go fishing' },
        ],
        dialogue: 'About time. Grab your rod.',
      };
    }

    // Sell fish
    if (/sell|cash in|money/i.test(lower)) {
      return {
        actions: [{ type: 'SELL', params: { item: 'all' }, reasoning: 'Player wants to sell' }],
        dialogue: "Let's see what we got.",
      };
    }

    // Buy gear
    if (/buy|shop|need.*(gear|rod|bait|lure)/i.test(lower)) {
      return {
        actions: [{ type: 'CHECK', params: { thing: 'gear' }, reasoning: 'Show current gear first' }],
        dialogue: "Let's check what you need.",
      };
    }

    // Teach / help
    if (/teach|show me|how to|learn|tutorial/i.test(lower)) {
      return {
        actions: [
          { type: 'LOOK_AT', params: { target: playerName }, reasoning: 'Face the player' },
          { type: 'CHAT', params: { message: "Alright, listen up. First thing: watch the birds. Where they're diving, that's where the bait fish are. And where the bait fish are..." }, reasoning: 'Start teaching' },
        ],
        dialogue: "Teach you? Sit down, then.",
      };
    }

    // Follow me
    if (/follow|come with|let's go|come on/i.test(lower)) {
      return {
        actions: [{ type: 'FOLLOW', params: { entity: playerName }, reasoning: 'Player wants Cody to follow' }],
        dialogue: 'Fine. Keep up.',
      };
    }

    // Stop
    if (/stop|quit|never mind|forget it/i.test(lower)) {
      return {
        actions: [{ type: 'STOP', params: {}, reasoning: 'Player wants to stop' }],
        dialogue: 'Suit yourself.',
      };
    }

    // Inventory check
    if (/inventory|what.*(have|got)|what.*(catch|caught)|my fish/i.test(lower)) {
      return {
        actions: [{ type: 'CHECK', params: { thing: 'inventory' }, reasoning: 'Player wants inventory' }],
        dialogue: 'Let me check the hold.',
      };
    }

    // Greeting
    if (/^(hi|hello|hey|sup|yo|greetings|morning|evening)/i.test(trimmed)) {
      const greetings = [
        'Morning.',
        'You again.',
        'What do you want?',
        'Yeah?',
        `Hey ${playerName}.`,
      ];
      return {
        actions: [],
        dialogue: greetings[Math.floor(Math.random() * greetings.length)],
      };
    }

    // How are you / small talk
    if (/how are|how.*(doing|feel)|you okay|what's up/i.test(lower)) {
      return {
        actions: [],
        dialogue: "I'm fine. Fish aren't biting though.",
      };
    }

    // Thank you
    if (/thank|thanks|appreciate/i.test(lower)) {
      return {
        actions: [],
        dialogue: "Don't mention it. Just remember — pink hoochies.",
      };
    }

    // Default: personality-driven with maybe a check
    return {
      actions: [],
      dialogue: 'Hmm. Yeah.',
    };
  }

  get isPlanning() {
    return this._planning;
  }
}
