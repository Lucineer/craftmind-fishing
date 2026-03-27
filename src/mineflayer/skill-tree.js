/**
 * Hierarchical Skill Tree System for Cody Fishing Bot
 *
 * Transforms flat personality scripts into composable skill trees with:
 * - Precondition checking before execution
 * - Postcondition tracking for state management
 * - Hierarchical decomposition of complex behaviors
 * - Progress tracking per skill node
 *
 * Usage:
 *   const tree = new SkillTree('Cody_A');
 *   tree.loadFromScript(scriptData);
 *   tree.start('root');
 *   while (tree.currentNode) {
 *     await tree.advance();
 *   }
 */

/**
 * Node status lifecycle:
 * locked → available → in_progress → completed
 *               ↓           ↓
 *            failed      cancelled
 */
const NODE_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * SkillNode represents a single skill in the tree
 * Can be either:
 * - Leaf node: has steps (executable actions)
 * - Branch node: has children (sub-skills to execute)
 */
export class SkillNode {
  constructor(name, config = {}) {
    this.name = name;
    this.description = config.description || '';
    this.steps = config.steps || [];          // leaf node: flat step sequence
    this.children = config.children || [];    // branch node: child skill names
    this.preconditions = config.preconditions || [];  // conditions to check before execution
    this.postconditions = config.postconditions || []; // results after success
    this.parent = config.parent || null;

    // Execution state
    this.status = NODE_STATUS.LOCKED;
    this.progress = 0;           // 0-1
    this.attempts = 0;
    this.maxAttempts = 3;
    this.lastResult = null;      // { success: boolean, message: string, timestamp: number }
    this.startedAt = null;
    this.completedAt = null;

    // Step execution pointer (for leaf nodes)
    this.currentStepIndex = 0;
  }

  /**
   * Check if this node's preconditions are met
   * @param {Object} context - Bot context (inventory, position, etc.)
   * @returns {boolean}
   */
  checkPreconditions(context) {
    if (this.preconditions.length === 0) return true;

    for (const cond of this.preconditions) {
      if (typeof cond === 'string') {
        // Check if condition flag is set in context
        if (!context[cond]) return false;
      } else if (typeof cond === 'function') {
        // Dynamic condition check
        if (!cond(context)) return false;
      }
    }
    return true;
  }

  /**
   * Mark postconditions as fulfilled in context
   * @param {Object} context - Bot context to update
   */
  fulfillPostconditions(context) {
    for (const cond of this.postconditions) {
      if (typeof cond === 'string') {
        context[cond] = true;
      } else if (typeof cond === 'function') {
        cond(context);
      }
    }
  }

  /**
   * Reset node to initial state (for retry)
   */
  reset() {
    this.status = NODE_STATUS.AVAILABLE;
    this.progress = 0;
    this.currentStepIndex = 0;
    this.lastResult = null;
  }

  /**
   * Check if this node is a leaf (has steps) or branch (has children)
   */
  isLeaf() {
    return this.steps && this.steps.length > 0;
  }

  isBranch() {
    return this.children && this.children.length > 0;
  }

  /**
   * Get node summary for display
   */
  getSummary() {
    return {
      name: this.name,
      description: this.description,
      status: this.status,
      progress: this.progress,
      isLeaf: this.isLeaf(),
      children: this.children,
      attempts: this.attempts,
      lastResult: this.lastResult
    };
  }
}

/**
 * SkillTree manages hierarchical execution of skill nodes
 */
export class SkillTree {
  constructor(botName) {
    this.botName = botName;
    this.root = null;
    this.nodes = new Map();
    this.currentNode = null;
    this.context = {};           // Shared context for pre/post conditions
    this.executionHistory = [];  // Track execution path
  }

  /**
   * Add a node to the tree
   * @param {SkillNode} node - Node to add
   */
  addNode(node) {
    this.nodes.set(node.name, node);
    // Set parent references for children
    for (const childName of node.children) {
      const child = this.nodes.get(childName);
      if (child) {
        child.parent = node.name;
      }
    }
  }

  /**
   * Set the root node of the tree
   * @param {string} nodeName - Name of root node
   */
  setRoot(nodeName) {
    const node = this.nodes.get(nodeName);
    if (!node) {
      throw new Error(`Cannot set root: node "${nodeName}" not found`);
    }
    this.root = node;
    node.status = NODE_STATUS.AVAILABLE;
  }

  /**
   * Load tree structure from script definition
   * Supports both flat mode (steps array) and tree mode (tree object)
   * @param {Object} script - Script object with optional tree property
   */
  loadFromScript(script) {
    // Check if script has tree definition
    if (!script.tree) {
      // Flat mode: create a wrapper tree
      const rootNode = new SkillNode('root', {
        description: script.description || 'Flat script wrapper',
        steps: script.steps || [],
        preconditions: [],
        postconditions: []
      });
      this.addNode(rootNode);
      this.setRoot('root');
      return;
    }

    // Tree mode: parse tree structure
    const { root, nodes } = script.tree;

    // Create all nodes
    for (const [name, config] of Object.entries(nodes)) {
      const node = new SkillNode(name, {
        description: config.description || `Skill: ${name}`,
        steps: config.steps || [],
        children: config.children || [],
        preconditions: config.preconditions || [],
        postconditions: config.postconditions || []
      });
      this.addNode(node);
    }

    // Set root and initialize availability
    this.setRoot(root);
    this.updateAvailability();
  }

  /**
   * Update node availability based on parent completion and preconditions
   */
  updateAvailability() {
    for (const node of this.nodes.values()) {
      if (node.status === NODE_STATUS.COMPLETED) continue;

      // Root is always available
      if (node === this.root) {
        if (node.status === NODE_STATUS.LOCKED) {
          node.status = NODE_STATUS.AVAILABLE;
        }
        continue;
      }

      // Check if parent is completed
      const parent = this.nodes.get(node.parent);
      const parentCompleted = parent && parent.status === NODE_STATUS.COMPLETED;

      // Check preconditions
      const preconditionsMet = node.checkPreconditions(this.context);

      if (parentCompleted && preconditionsMet && node.status === NODE_STATUS.LOCKED) {
        node.status = NODE_STATUS.AVAILABLE;
      } else if (!parentCompleted || !preconditionsMet) {
        node.status = NODE_STATUS.LOCKED;
      }
    }
  }

  /**
   * Get all currently available nodes
   * @returns {SkillNode[]}
   */
  getAvailable() {
    return [...this.nodes.values()].filter(n => n.status === NODE_STATUS.AVAILABLE);
  }

  /**
   * Start executing a specific skill
   * @param {string} skillName - Name of skill to start
   * @returns {boolean} Success
   */
  start(skillName) {
    const node = this.nodes.get(skillName);
    if (!node) {
      console.error(`[SkillTree] Cannot start: skill "${skillName}" not found`);
      return false;
    }

    if (node.status !== NODE_STATUS.AVAILABLE) {
      console.error(`[SkillTree] Cannot start: skill "${skillName}" is ${node.status}`);
      return false;
    }

    this.currentNode = node;
    node.status = NODE_STATUS.IN_PROGRESS;
    node.startedAt = Date.now();
    node.attempts++;

    console.log(`[SkillTree] ▶ Starting: ${node.name} (${node.description})`);
    this.executionHistory.push({
      action: 'start',
      node: node.name,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Get current step to execute (for leaf nodes)
   * @returns {Object|null} Step object or null if no more steps
   */
  getCurrentStep() {
    if (!this.currentNode || !this.currentNode.isLeaf()) {
      return null;
    }

    if (this.currentNode.currentStepIndex >= this.currentNode.steps.length) {
      return null;
    }

    return this.currentNode.steps[this.currentNode.currentStepIndex];
  }

  /**
   * Mark current step as completed and advance
   * @param {boolean} success - Whether step succeeded
   */
  completeStep(success = true) {
    if (!this.currentNode || !this.currentNode.isLeaf()) {
      return;
    }

    if (success) {
      this.currentNode.currentStepIndex++;
      this.currentNode.progress = this.currentNode.currentStepIndex / this.currentNode.steps.length;
    }
  }

  /**
   * Complete current node and advance to next
   * @param {boolean} success - Whether node succeeded
   * @param {string} message - Optional result message
   */
  completeNode(success = true, message = '') {
    if (!this.currentNode) return;

    const node = this.currentNode;
    node.lastResult = {
      success,
      message,
      timestamp: Date.now()
    };
    node.completedAt = Date.now();

    if (success) {
      node.status = NODE_STATUS.COMPLETED;
      node.progress = 1.0;
      node.fulfillPostconditions(this.context);
      console.log(`[SkillTree] ✅ Completed: ${node.name} (${message})`);

      this.executionHistory.push({
        action: 'complete',
        node: node.name,
        success: true,
        message,
        timestamp: Date.now()
      });

      // Update availability for children
      this.updateAvailability();

      // Auto-start first available child if branch node
      if (node.isBranch()) {
        const availableChild = this.nodes.get(node.children[0]);
        if (availableChild && availableChild.status === NODE_STATUS.AVAILABLE) {
          this.start(availableChild.name);
        } else {
          this.currentNode = null;
        }
      } else {
        this.currentNode = null;
      }
    } else {
      node.status = node.attempts >= node.maxAttempts ? NODE_STATUS.FAILED : NODE_STATUS.AVAILABLE;
      console.log(`[SkillTree] ❌ Failed: ${node.name} (${message})`);

      this.executionHistory.push({
        action: 'fail',
        node: node.name,
        reason: message,
        timestamp: Date.now()
      });

      if (node.status === NODE_STATUS.FAILED) {
        this.currentNode = null;
      }
    }
  }

  /**
   * Advance execution by one step
   * @returns {Object|null} Next step to execute, or null if tree is done
   */
  advance() {
    // If no current node, try to start root
    if (!this.currentNode) {
      if (this.root && this.root.status !== NODE_STATUS.COMPLETED) {
        this.start(this.root.name);
      } else {
        return null; // Tree complete
      }
    }

    // Handle branch nodes
    if (this.currentNode.isBranch()) {
      // Find first available child
      for (const childName of this.currentNode.children) {
        const child = this.nodes.get(childName);
        if (child && child.status === NODE_STATUS.AVAILABLE) {
          this.start(childName);
          break;
        }
      }
    }

    // Return current step for execution
    return this.getCurrentStep();
  }

  /**
   * Check if tree execution is complete
   */
  isComplete() {
    return this.root?.status === NODE_STATUS.COMPLETED;
  }

  /**
   * Get tree status overview
   * @returns {Object} Tree status summary
   */
  getStatus() {
    const status = {
      botName: this.botName,
      isComplete: this.isComplete(),
      currentNode: this.currentNode?.name || null,
      nodes: {},
      context: { ...this.context }
    };

    for (const [name, node] of this.nodes) {
      status.nodes[name] = node.getSummary();
    }

    return status;
  }

  /**
   * Get status formatted for chat display
   * @returns {string} Formatted status message
   */
  getStatusMessage() {
    const status = this.getStatus();
    const lines = [`🌳 ${status.botName} Skill Tree`];

    if (status.isComplete) {
      lines.push('✅ Tree complete!');
    } else if (status.currentNode) {
      const node = this.nodes.get(status.currentNode);
      lines.push(`▶ Current: ${status.currentNode}`);
      if (node?.description) {
        lines.push(`   ${node.description}`);
      }
      lines.push(`   Progress: ${(node?.progress * 100).toFixed(0)}%`);
    }

    // Count nodes by status
    const counts = { completed: 0, in_progress: 0, available: 0, locked: 0, failed: 0 };
    for (const node of this.nodes.values()) {
      counts[node.status]++;
    }

    lines.push(`📊 Nodes: ✅${counts.completed} ▶${counts.in_progress} ⏳${counts.available} 🔒${counts.locked} ❌${counts.failed}`);

    return lines.join('\n');
  }

  /**
   * Visual tree representation (ASCII)
   * @returns {string} ASCII tree diagram
   */
  toASCII() {
    const lines = [];
    const indent = (n) => '  '.repeat(n);

    const renderNode = (name, depth = 0) => {
      const node = this.nodes.get(name);
      if (!node) return '';

      const statusEmoji = {
        [NODE_STATUS.COMPLETED]: '✅',
        [NODE_STATUS.IN_PROGRESS]: '▶',
        [NODE_STATUS.AVAILABLE]: '⏳',
        [NODE_STATUS.LOCKED]: '🔒',
        [NODE_STATUS.FAILED]: '❌',
        [NODE_STATUS.CANCELLED]: '⚠'
      }[node.status] || '❓';

      let line = `${indent(depth)}${statusEmoji} ${name}`;
      if (node.isLeaf()) {
        line += ` (${node.steps.length} steps)`;
      } else {
        line += ` → [${node.children.join(', ')}]`;
      }
      lines.push(line);

      // Render children
      for (const childName of node.children) {
        renderNode(childName, depth + 1);
      }
    };

    if (this.root) {
      renderNode(this.root.name);
    }

    return lines.join('\n');
  }

  /**
   * Reset entire tree (for retry)
   */
  reset() {
    for (const node of this.nodes.values()) {
      node.reset();
      node.status = (node === this.root) ? NODE_STATUS.AVAILABLE : NODE_STATUS.LOCKED;
    }
    this.currentNode = null;
    this.context = {};
    this.executionHistory = [];
    this.updateAvailability();
  }
}

/**
 * Helper function to create a skill tree from a script
 * @param {string} botName - Bot name
 * @param {Object} script - Script object
 * @returns {SkillTree}
 */
export function createSkillTree(botName, script) {
  const tree = new SkillTree(botName);
  tree.loadFromScript(script);
  return tree;
}
