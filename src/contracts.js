// CraftMind Fishing — Contract/Quest System
// Delivery, exploration, research, rescue, hunting, collection, chain contracts.

export const CONTRACT_TYPES = ['delivery', 'exploration', 'research', 'rescue', 'hunting', 'collection'];

export class Contract {
  constructor(options = {}) {
    this.id = options.id ?? `contract_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.issuer = options.issuer ?? 'Fishmonger Guild';
    this.type = options.type ?? 'delivery';
    this.target = options.target ?? {};
    this.title = options.title ?? this._generateTitle();
    this.description = options.description ?? '';
    // e.g. { species: 'prismarine_cod', count: 10, min_size: 0.5 } for delivery
    // e.g. { area: 'deep_reef' } for exploration
    // e.g. { species: 'ender_koi' } for research
    // e.g. { hazardType: 'shark_pack' } for hunting

    // Reward
    this.reward = options.reward ?? { gold: 100, reputation: 5 };
    this.penalty = options.penalty ?? { reputation: -3 };

    // Timing
    this.deadline = options.deadline ?? 3600000; // 1 hour
    this.createdAt = Date.now();
    this.acceptedAt = null;
    this.completedAt = null;
    this.failedAt = null;

    // Progress
    this.status = 'available'; // available, active, completed, failed, expired
    this.progress = 0;
    this.maxProgress = options.maxProgress ?? this.target.count ?? 1;

    // Chain
    this.chainId = options.chainId ?? null;
    this.chainOrder = options.chainOrder ?? 0;
    this.unlocks = options.unlocks ?? null; // contract template to unlock

    // Difficulty
    this.difficulty = options.difficulty ?? this._estimateDifficulty();
  }

  _generateTitle() {
    const titles = {
      delivery: `Deliver ${this.target.count ?? 5} ${this.target.species ?? 'fish'}`,
      exploration: `Explore ${this.target.area ?? 'unknown waters'}`,
      research: `Research the ${this.target.species ?? 'unknown species'}`,
      rescue: `Rescue stranded fisherman`,
      hunting: `Hunt the ${this.target.hazardType ?? 'menace'}`,
      collection: `Complete species collection set`,
    };
    return titles[this.type] ?? 'Fishing Contract';
  }

  _estimateDifficulty() {
    const count = this.target.count ?? 1;
    if (this.type === 'hunting') return 4;
    if (count > 20) return 4;
    if (count > 10) return 3;
    if (count > 5) return 2;
    return 1;
  }

  /** Accept this contract. */
  accept() {
    if (this.status !== 'available') return false;
    this.status = 'active';
    this.acceptedAt = Date.now();
    return true;
  }

  /** Update progress. Returns true when completed. */
  addProgress(amount = 1) {
    if (this.status !== 'active') return false;
    this.progress += amount;

    if (this.progress >= this.maxProgress) {
      this.complete();
      return true;
    }

    // Check deadline
    if (this.acceptedAt && Date.now() - this.acceptedAt > this.deadline) {
      this.fail('deadline_expired');
      return false;
    }

    return false;
  }

  /** Complete the contract. */
  complete() {
    this.status = 'completed';
    this.completedAt = Date.now();
    return this.reward;
  }

  /** Fail the contract. */
  fail(reason = 'abandoned') {
    this.status = 'failed';
    this.failedAt = Date.now();
    this.failureReason = reason;
    return this.penalty;
  }

  /** Check if expired. */
  isExpired() {
    if (this.status === 'available') {
      return Date.now() - this.createdAt > this.deadline * 2;
    }
    if (this.status === 'active' && this.acceptedAt) {
      if (Date.now() - this.acceptedAt > this.deadline) {
        this.fail('deadline_expired');
        return true;
      }
    }
    return false;
  }

  /** Get progress as fraction (0-1). */
  getProgressFraction() {
    return Math.min(1, this.progress / Math.max(1, this.maxProgress));
  }

  /** Serialize. */
  toJSON() {
    return {
      id: this.id, issuer: this.issuer, type: this.type, title: this.title,
      target: this.target, reward: this.reward, penalty: this.penalty,
      status: this.status, progress: this.progress, maxProgress: this.maxProgress,
      difficulty: this.difficulty, chainId: this.chainId,
      timeRemaining: this.acceptedAt
        ? Math.max(0, this.deadline - (Date.now() - this.acceptedAt))
        : this.deadline * 2 - (Date.now() - this.createdAt),
    };
  }
}

export class ContractBoard {
  constructor(options = {}) {
    this.contracts = [];
    this.maxActive = options.maxActive ?? 5;
    this.completedCount = 0;
    this.failedCount = 0;
    this.chainDefinitions = new Map();
    this.availableIssuers = [
      'Fishmonger Grian', 'Captain Coral', 'Old Salty', 'The Merchant',
      'Marine Biologist Xelqua', 'Port Authority', 'Research Lab Director',
    ];
  }

  /** Generate a random contract. */
  generate(type, options = {}) {
    const templates = {
      delivery: () => ({
        type: 'delivery',
        target: { species: options.species ?? 'cod', count: options.count ?? 5 + Math.floor(Math.random() * 15) },
        reward: { gold: 50 + Math.floor(Math.random() * 200), reputation: 5 + Math.floor(Math.random() * 10) },
        deadline: 1800000 + Math.random() * 3600000,
      }),
      exploration: () => ({
        type: 'exploration',
        target: { area: options.area ?? 'deep_reef' },
        reward: { gold: 100 + Math.floor(Math.random() * 300), reputation: 10, item: 'enchanted_map' },
        deadline: 3600000 + Math.random() * 3600000,
      }),
      research: () => ({
        type: 'research',
        target: { species: options.species ?? 'rare_fish', count: 3 },
        reward: { gold: 200, reputation: 15, item: 'research_notes' },
        deadline: 7200000,
      }),
      rescue: () => ({
        type: 'rescue',
        target: { location: { x: Math.random() * 400 - 200, z: Math.random() * 400 - 200 } },
        reward: { gold: 150, reputation: 20, item: 'gratitude_charm' },
        deadline: 1800000,
      }),
      hunting: () => ({
        type: 'hunting',
        target: { hazardType: options.hazardType ?? 'shark_pack' },
        reward: { gold: 300, reputation: 25, item: 'trophy_fin' },
        deadline: 3600000,
      }),
      collection: () => ({
        type: 'collection',
        target: { count: options.count ?? 5 },
        reward: { gold: 500, reputation: 30, item: 'collector_badge' },
        deadline: 14400000,
      }),
    };

    const template = templates[type]?.() ?? templates.delivery();
    const issuer = this.availableIssuers[Math.floor(Math.random() * this.availableIssuers.length)];

    const contract = new Contract({
      ...template,
      issuer,
      chainId: options.chainId ?? null,
      chainOrder: options.chainOrder ?? 0,
    });

    this.contracts.push(contract);
    return contract;
  }

  /** Get available contracts. */
  getAvailable() {
    return this.contracts.filter(c => c.status === 'available');
  }

  /** Get active contracts. */
  getActive() {
    return this.contracts.filter(c => c.status === 'active');
  }

  /** Accept a contract by ID. */
  accept(contractId) {
    const contract = this.contracts.find(c => c.id === contractId && c.status === 'available');
    if (!contract) return null;
    if (this.getActive().length >= this.maxActive) return null;
    contract.accept();
    return contract;
  }

  /** Complete all expired contracts. */
  expireOld() {
    let expired = 0;
    for (const c of this.contracts) {
      if (c.isExpired()) expired++;
    }
    return expired;
  }

  /** Register a chain of contracts. */
  registerChain(chainId, contracts) {
    this.chainDefinitions.set(chainId, contracts);
  }

  /** Generate next contract in a chain. */
  generateChainNext(chainId, completedContract) {
    const chain = this.chainDefinitions.get(chainId);
    if (!chain) return null;
    const next = chain.find(c => c.chainOrder === (completedContract.chainOrder ?? 0) + 1);
    if (!next) return null;
    return this.generate(next.type, { ...next, chainId });
  }

  /** Get board summary. */
  getSummary() {
    return {
      available: this.getAvailable().length,
      active: this.getActive().length,
      completed: this.completedCount,
      failed: this.failedCount,
      total: this.contracts.length,
    };
  }
}

export default ContractBoard;
