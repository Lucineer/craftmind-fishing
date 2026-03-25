// CraftMind Fishing — Workflow Engine
// Multi-step agent workflows for fishing expeditions, with recovery and parallelism.

export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
};

export class WorkflowStep {
  constructor(config) {
    this.id = config.id ?? config.step ?? `step_${Date.now()}`;
    this.name = config.step ?? config.id ?? this.id;
    this.agent = config.agent ?? 'fleet'; // which role handles this
    this.dependsOn = config.depends_on ?? config.dependsOn ?? [];
    this.timeout = config.timeout ?? 60000;
    this.duration = config.duration ?? 'variable';
    this.trigger = config.trigger ?? null; // condition-based trigger
    this.action = config.action ?? null; // function to execute
    this.recovery = config.recovery ?? null; // recovery workflow on failure
    this.parallel = config.parallel ?? false;
    this.data = config.data ?? {};

    this.status = WORKFLOW_STATUS.PENDING;
    this.startedAt = null;
    this.completedAt = null;
    this.result = null;
    this.error = null;
    this.attempts = 0;
    this.maxAttempts = config.maxAttempts ?? 2;
  }

  /** Check if dependencies are satisfied. */
  dependenciesMet(completedSteps) {
    return this.dependsOn.every(dep => completedSteps.has(dep));
  }

  /** Reset for retry. */
  reset() {
    this.status = WORKFLOW_STATUS.PENDING;
    this.startedAt = null;
    this.completedAt = null;
    this.result = null;
    this.error = null;
  }
}

export class Workflow {
  constructor(name, steps = []) {
    this.id = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.name = name;
    this.steps = steps.map(s => s instanceof WorkflowStep ? s : new WorkflowStep(s));
    this.status = WORKFLOW_STATUS.PENDING;
    this.startedAt = null;
    this.completedAt = null;
    this.currentStep = null;
    this.completedSteps = new Set();
    this.failedSteps = new Set();
    this.log = [];
    this.data = {}; // shared data between steps
    this.onStepComplete = null; // callback
    this.onComplete = null;
    this.onFail = null;
  }

  /** Start the workflow. */
  start() {
    this.status = WORKFLOW_STATUS.RUNNING;
    this.startedAt = Date.now();
    this._log('Workflow started');
  }

  /** Get next steps that are ready to execute. */
  getReadySteps() {
    const ready = [];
    for (const step of this.steps) {
      if (step.status !== WORKFLOW_STATUS.PENDING) continue;
      if (!step.dependenciesMet(this.completedSteps)) continue;
      ready.push(step);
    }
    return ready;
  }

  /** Mark a step as completed with result. */
  completeStep(stepId, result = null) {
    const step = this.steps.find(s => s.id === stepId || s.name === stepId);
    if (!step) return false;

    step.status = WORKFLOW_STATUS.COMPLETED;
    step.completedAt = Date.now();
    step.result = result;
    this.completedSteps.add(step.id);
    this._log(`Step "${step.name}" completed`);

    if (this.onStepComplete) this.onStepComplete(step, result);

    // Check if workflow is complete
    if (this.completedSteps.size === this.steps.length) {
      this.status = WORKFLOW_STATUS.COMPLETED;
      this.completedAt = Date.now();
      this._log('Workflow completed');
      if (this.onComplete) this.onComplete(this.data);
    }

    return true;
  }

  /** Mark a step as failed. */
  failStep(stepId, error = null) {
    const step = this.steps.find(s => s.id === stepId || s.name === stepId);
    if (!step) return false;

    step.status = WORKFLOW_STATUS.FAILED;
    step.error = error;
    step.completedAt = Date.now();
    step.attempts++;
    this._log(`Step "${step.name}" failed: ${error ?? 'unknown'}`);

    // Try recovery
    if (step.recovery && step.attempts < step.maxAttempts) {
      step.reset();
      this._log(`Recovery triggered for "${step.name}" (attempt ${step.attempts})`);
      return 'recovery';
    }

    this.failedSteps.add(step.id);
    this.status = WORKFLOW_STATUS.FAILED;
    if (this.onFail) this.onFail(step, error);
    return 'failed';
  }

  /** Cancel the workflow. */
  cancel() {
    this.status = WORKFLOW_STATUS.CANCELLED;
    this.completedAt = Date.now();
    for (const step of this.steps) {
      if (step.status === WORKFLOW_STATUS.PENDING) step.status = WORKFLOW_STATUS.SKIPPED;
    }
    this._log('Workflow cancelled');
  }

  /** Get progress (0-1). */
  getProgress() {
    if (this.steps.length === 0) return 0;
    return this.completedSteps.size / this.steps.length;
  }

  /** Get human-readable status. */
  getStatusSummary() {
    const steps = this.steps.map(s => {
      const icon = s.status === 'completed' ? '✅' : s.status === 'running' ? '🔄' :
                   s.status === 'failed' ? '❌' : s.status === 'skipped' ? '⏭️' : '⏳';
      return `${icon} ${s.name} (${s.agent})`;
    }).join(' → ');
    return `**${this.name}** [${Math.round(this.getProgress() * 100)}%]\n${steps}`;
  }

  _log(msg) {
    this.log.push({ msg, timestamp: Date.now() });
  }
}

export class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.definitions = new Map();
    this.activeWorkflow = null;
  }

  /** Define a reusable workflow template. */
  define(name, steps) {
    this.definitions.set(name, steps);
    return this;
  }

  /** Create a workflow from a definition. */
  create(name, data = {}) {
    const def = this.definitions.get(name);
    if (!def) throw new Error(`Unknown workflow: ${name}`);
    const wf = new Workflow(name, def);
    wf.data = { ...data };
    this.workflows.set(wf.id, wf);
    return wf;
  }

  /** Create an ad-hoc workflow. */
  createAdHoc(name, steps, data = {}) {
    const wf = new Workflow(name, steps);
    wf.data = { ...data };
    this.workflows.set(wf.id, wf);
    return wf;
  }

  /** Set the active workflow. */
  setActive(workflow) {
    this.activeWorkflow = workflow;
    return this;
  }

  /** Tick the active workflow — auto-execute ready steps that have action functions. */
  tick() {
    if (!this.activeWorkflow || this.activeWorkflow.status !== WORKFLOW_STATUS.RUNNING) return [];

    const results = [];
    const ready = this.activeWorkflow.getReadySteps();

    for (const step of ready) {
      step.status = WORKFLOW_STATUS.RUNNING;
      step.startedAt = Date.now();
      this.activeWorkflow.currentStep = step;

      if (typeof step.action === 'function') {
        try {
          const result = step.action(this.activeWorkflow.data);
          this.activeWorkflow.completeStep(step.id, result);
          results.push({ step: step.name, status: 'completed', result });
        } catch (err) {
          const outcome = this.activeWorkflow.failStep(step.id, err.message);
          results.push({ step: step.name, status: outcome === 'recovery' ? 'retrying' : 'failed', error: err.message });
        }
      } else {
        // No action — leave as running (external system will complete it)
        results.push({ step: step.name, status: 'waiting' });
      }
    }

    return results;
  }

  /** Get all workflows. */
  getAll() { return [...this.workflows.values()]; }

  /** Get workflow by ID. */
  get(id) { return this.workflows.get(id) ?? null; }

  /** Cancel all active workflows. */
  cancelAll() {
    for (const wf of this.workflows.values()) {
      if (wf.status === WORKFLOW_STATUS.RUNNING) wf.cancel();
    }
  }

  /** Built-in expedition workflow definition. */
  static expeditionDefinition(options = {}) {
    return [
      { step: 'gather_intelligence', agent: 'scout', timeout: 30000, action: (data) => { data.intel = { area: options.target ?? 'unknown' }; return 'intel_gathered'; } },
      { step: 'craft_bait', agent: 'support', depends_on: ['gather_intelligence'], action: (data) => { data.baitReady = true; return 'bait_crafted'; } },
      { step: 'travel_to_site', agent: 'fleet', depends_on: ['craft_bait'], action: (data) => { data.arrived = true; return 'arrived'; } },
      { step: 'deploy_fleet', agent: 'captain', depends_on: ['travel_to_site'], action: (data) => { data.deployed = true; return 'deployed'; } },
      { step: 'fish', agent: 'fleet', depends_on: ['deploy_fleet'], duration: 'variable', action: (data) => { data.catches = (data.catches ?? 0) + Math.floor(Math.random() * 5) + 1; return { caught: data.catches }; } },
      { step: 'recall', agent: 'captain', depends_on: ['fish'], action: (data) => { data.recalled = true; return 'recalled'; } },
      { step: 'return_to_port', agent: 'fleet', depends_on: ['recall'], action: (data) => { data.home = true; return 'home'; } },
      { step: 'sell_catch', agent: 'fleet', depends_on: ['return_to_port'], action: (data) => { data.sold = true; return data.catches * 15 + 'g'; } },
      { step: 'debrief', agent: 'captain', depends_on: ['sell_catch'], action: (data) => { return { totalCatches: data.catches }; } },
    ];
  }
}

export default WorkflowEngine;
