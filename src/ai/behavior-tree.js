/**
 * @module craftmind-fishing/ai/behavior-tree
 * @description Tick-based behavior tree with blackboard pattern.
 * Node types: Selector, Sequence, Parallel, Decorator, Condition, Action.
 */

// ── Status constants ──────────────────────────────────────────────────────────

export const Status = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RUNNING: 'RUNNING',
};

// ── Blackboard ────────────────────────────────────────────────────────────────

export class Blackboard {
  constructor() {
    this._data = new Map();
  }

  get(key) { return this._data.get(key); }
  set(key, value) { this._data.set(key, value); }
  has(key) { return this._data.has(key); }
  delete(key) { this._data.delete(key); }
  clear() { this._data.clear(); }

  /** Shallow snapshot for debugging */
  snapshot() {
    const out = {};
    for (const [k, v] of this._data) out[k] = v;
    return out;
  }
}

// ── Base Node ─────────────────────────────────────────────────────────────────

class Node {
  constructor(name = 'node') {
    this.name = name;
    this.status = Status.FAILURE;
    this._childIndex = 0; // for sequence/selector persistence
  }

  /** @param {Blackboard} bb */
  tick(bb) { /* override */ }

  reset() {
    this.status = Status.FAILURE;
    this._childIndex = 0;
  }
}

// ── Selector (OR — succeed on first success) ─────────────────────────────────

export class Selector extends Node {
  constructor(name, children = []) {
    super(name || 'selector');
    this.children = children;
  }

  tick(bb) {
    for (let i = this._childIndex; i < this.children.length; i++) {
      const child = this.children[i];
      child.tick(bb);
      if (child.status === Status.SUCCESS) {
        this.status = Status.SUCCESS;
        this._childIndex = 0;
        return;
      }
      if (child.status === Status.RUNNING) {
        this.status = Status.RUNNING;
        this._childIndex = i;
        return;
      }
      // FAILURE — continue to next child
    }
    this.status = Status.FAILURE;
    this._childIndex = 0;
  }

  reset() {
    super.reset();
    this.children.forEach(c => c.reset());
  }
}

// ── Sequence (AND — fail on first failure) ───────────────────────────────────

export class Sequence extends Node {
  constructor(name, children = []) {
    super(name || 'sequence');
    this.children = children;
  }

  tick(bb) {
    for (let i = this._childIndex; i < this.children.length; i++) {
      const child = this.children[i];
      child.tick(bb);
      if (child.status === Status.FAILURE) {
        this.status = Status.FAILURE;
        this._childIndex = 0;
        return;
      }
      if (child.status === Status.RUNNING) {
        this.status = Status.RUNNING;
        this._childIndex = i;
        return;
      }
      // SUCCESS — continue to next child
    }
    this.status = Status.SUCCESS;
    this._childIndex = 0;
  }

  reset() {
    super.reset();
    this.children.forEach(c => c.reset());
  }
}

// ── Parallel (run all, policy determines overall result) ──────────────────────

export class Parallel extends Node {
  /**
   * @param {string} name
   * @param {Array} children
   * @param {'require_all'|'require_one'} policy - SUCCESS when all/one succeed
   */
  constructor(name, children = [], policy = 'require_all') {
    super(name || 'parallel');
    this.children = children;
    this.policy = policy;
  }

  tick(bb) {
    let succeeded = 0;
    let failed = 0;
    let running = 0;

    for (const child of this.children) {
      child.tick(bb);
      if (child.status === Status.SUCCESS) succeeded++;
      else if (child.status === Status.FAILURE) failed++;
      else running++;
    }

    if (this.policy === 'require_all') {
      if (failed > 0) this.status = Status.FAILURE;
      else if (running > 0) this.status = Status.RUNNING;
      else this.status = Status.SUCCESS;
    } else {
      // require_one
      if (succeeded > 0) this.status = Status.SUCCESS;
      else if (running > 0) this.status = Status.RUNNING;
      else this.status = Status.FAILURE;
    }
  }

  reset() {
    super.reset();
    this.children.forEach(c => c.reset());
  }
}

// ── Decorator ─────────────────────────────────────────────────────────────────

export class Decorator extends Node {
  /**
   * @param {string} name
   * @param {Node} child
   * @param {'inverter'|'repeater'|'until_fail'|'succeeder'} type
   * @param {number} [maxRepeats] - for repeater
   */
  constructor(name, child, type = 'succeeder', maxRepeats = -1) {
    super(name || `decorator(${type})`);
    this.child = child;
    this.type = type;
    this.maxRepeats = maxRepeats;
    this._count = 0;
  }

  tick(bb) {
    switch (this.type) {
      case 'inverter':
        this.child.tick(bb);
        if (this.child.status === Status.SUCCESS) { this.status = Status.FAILURE; return; }
        if (this.child.status === Status.FAILURE) { this.status = Status.SUCCESS; return; }
        this.status = Status.RUNNING;
        return;

      case 'repeater':
        if (this.maxRepeats > 0 && this._count >= this.maxRepeats) {
          this.status = Status.SUCCESS;
          this._count = 0;
          return;
        }
        this.child.tick(bb);
        if (this.child.status === Status.SUCCESS) {
          this._count++;
          if (this.maxRepeats > 0 && this._count >= this.maxRepeats) {
            this.status = Status.SUCCESS;
            this._count = 0;
            return;
          }
          this.status = Status.RUNNING;
          return;
        }
        if (this.child.status === Status.FAILURE) {
          this.status = Status.FAILURE;
          this._count = 0;
          return;
        }
        this.status = Status.RUNNING;
        return;

      case 'until_fail':
        this.child.tick(bb);
        if (this.child.status === Status.FAILURE) {
          this.status = Status.SUCCESS;
          return;
        }
        this.status = Status.RUNNING;
        return;

      case 'succeeder':
        this.child.tick(bb);
        this.status = Status.SUCCESS;
        return;
    }
  }

  reset() {
    super.reset();
    this.child.reset();
    this._count = 0;
  }
}

// ── Condition ─────────────────────────────────────────────────────────────────

export class Condition extends Node {
  /**
   * @param {string} name
   * @param {function(Blackboard): boolean} check - returns true for SUCCESS
   */
  constructor(name, check) {
    super(name || 'condition');
    this.check = check;
  }

  tick(bb) {
    this.status = this.check(bb) ? Status.SUCCESS : Status.FAILURE;
  }
}

// ── Action ────────────────────────────────────────────────────────────────────

export class Action extends Node {
  /**
   * @param {string} name
   * @param {function(Blackboard): import('./behavior-tree').Status} fn
   */
  constructor(name, fn) {
    super(name || 'action');
    this.fn = fn;
  }

  tick(bb) {
    try {
      this.status = this.fn(bb) || Status.SUCCESS;
    } catch (err) {
      this.status = Status.FAILURE;
    }
  }
}

// ── BehaviorTree (root wrapper) ──────────────────────────────────────────────

export class BehaviorTree {
  constructor(root, blackboard) {
    this.root = root;
    this.bb = blackboard || new Blackboard();
    this.tickCount = 0;
    this._log = [];
    this.maxLogSize = 500;
  }

  tick() {
    this.root.tick(this.bb);
    this.tickCount++;
    this._logEntry(this.root.status);
    return this.root.status;
  }

  _logEntry(status) {
    const entry = {
      tick: this.tickCount,
      status,
      activeNode: this._activeNodeName(this.root),
      time: Date.now(),
    };
    this._log.push(entry);
    if (this._log.length > this.maxLogSize) this._log.shift();
  }

  _activeNodeName(node) {
    if (node.status === Status.RUNNING) return node.name;
    if (node.children) {
      for (const child of node.children) {
        if (child.status === Status.RUNNING || child.status === Status.SUCCESS) {
          return this._activeNodeName(child);
        }
      }
    }
    if (node.child) return this._activeNodeName(node.child);
    return node.name;
  }

  reset() {
    this.root.reset();
    this.tickCount = 0;
  }

  getLog() { return this._log; }
  clearLog() { this._log = []; }

  /** Print current tree state for debugging */
  print() {
    return this._printNode(this.root, 0);
  }

  _printNode(node, depth) {
    const indent = '  '.repeat(depth);
    const marker = node.status === Status.RUNNING ? '→' : ' ';
    let line = `${indent}${marker} [${node.status}] ${node.name}`;
    if (node.children) {
      for (const child of node.children) {
        line += '\n' + this._printNode(child, depth + 1);
      }
    }
    if (node.child) {
      line += '\n' + this._printNode(node.child, depth + 1);
    }
    return line;
  }
}
