/**
 * @module craftmind-fishing/ai/action-schema
 * @description Structured action types that the LLM can output.
 * Each action has named parameters, a timeout, and a description.
 */

export const ACTION_TYPES = {
  MOVE: {
    params: ['target'],
    timeout: 30000,
    description: 'Walk or navigate to a location or entity',
  },
  FISH: {
    params: ['method', 'location', 'bait', 'depth'],
    timeout: 300000,
    description: 'Start fishing with a method, optional location/bait/depth',
  },
  CAST: {
    params: [],
    timeout: 10000,
    description: 'Cast the fishing line into the water',
  },
  REEL: {
    params: [],
    timeout: 5000,
    description: 'Reel in the fishing line',
  },
  EQUIP: {
    params: ['item'],
    timeout: 5000,
    description: 'Equip an item from inventory',
  },
  USE_ITEM: {
    params: ['item', 'target'],
    timeout: 10000,
    description: 'Use an item, optionally on a target',
  },
  CHAT: {
    params: ['message'],
    timeout: 5000,
    description: 'Say something in chat',
  },
  WAIT: {
    params: ['seconds'],
    timeout: 30000,
    description: 'Wait for a number of seconds',
  },
  LOOK_AT: {
    params: ['target'],
    timeout: 3000,
    description: 'Look at a target entity or position',
  },
  FOLLOW: {
    params: ['entity'],
    timeout: 60000,
    description: 'Follow a player or entity',
  },
  SELL: {
    params: ['item', 'quantity'],
    timeout: 10000,
    description: 'Sell fish or items',
  },
  BUY: {
    params: ['item', 'quantity'],
    timeout: 10000,
    description: 'Buy gear or items from a shop',
  },
  CHECK: {
    params: ['thing'],
    timeout: 5000,
    description: 'Check something: weather, tide, inventory, gold, gear, permits',
  },
  STOP: {
    params: [],
    timeout: 3000,
    description: 'Stop current activity',
  },
};

/**
 * Validate an action object against the schema.
 * @param {{ type: string, params?: Object }} action
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAction(action) {
  const errors = [];
  if (!action || typeof action.type !== 'string') {
    return { valid: false, errors: ['Missing or invalid action type'] };
  }
  const schema = ACTION_TYPES[action.type.toUpperCase()];
  if (!schema) {
    return { valid: false, errors: [`Unknown action type: ${action.type}`] };
  }
  const params = action.params || {};
  const missing = schema.params.filter(p => p !== 'depth' && p !== 'target' && p !== 'quantity' && p !== 'seconds' && p !== 'bait' && p !== 'message' && !params[p]);
  // Only require non-optional core params — target/message/item/thing
  const required = schema.params.filter(p => !['depth', 'target', 'quantity', 'seconds', 'bait', 'location'].includes(p));
  for (const p of required) {
    if (!params[p]) errors.push(`Missing required param: ${p}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a plan (array of actions).
 * @param {{ actions: Array }} plan
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePlan(plan) {
  if (!plan || !Array.isArray(plan.actions)) {
    return { valid: false, errors: ['Plan must have an actions array'] };
  }
  const errors = [];
  for (let i = 0; i < plan.actions.length; i++) {
    const result = validateAction(plan.actions[i]);
    errors.push(...result.errors.map(e => `Action ${i}: ${e}`));
  }
  return { valid: errors.length === 0, errors };
}
