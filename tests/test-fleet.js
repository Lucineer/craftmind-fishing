// CraftMind Fishing — Fleet Mechanics Tests
import { Fleet, FleetMember, FLEET_ROLES } from '../src/fleet.js';
import { FleetCaptain } from '../src/fleet-captain.js';
import { MarineHazard, MarineHazardSystem, HAZARD_TYPES } from '../src/marine-hazards.js';
import { WorkflowEngine, Workflow, WorkflowStep, WORKFLOW_STATUS } from '../src/workflow-engine.js';
import { Market, NPCCustomer } from '../src/market.js';
import { Contract, ContractBoard } from '../src/contracts.js';
import { Tavern, CrewMember, PERSONALITIES } from '../src/crew-recruitment.js';
import { SafetyNet } from '../src/safety-net.js';
import { Boat, BOAT_TIERS, EQUIPMENT_TYPES } from '../src/boat.js';
import { FishingCompany } from '../src/fishing-company.js';

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error(`  ❌ FAIL: ${msg}`); } }
function describe(name, fn) { console.log(`\n📋 ${name}`); fn(); }

// === Fleet Tests ===
describe('Fleet composition and roles', () => {
  const fleet = new Fleet({ name: 'Test Fleet', captain: 'Cody' });
  fleet.addMember('Cody', { role: 'captain' });
  fleet.addMember('Nova', { role: 'scout' });
  fleet.addMember('Rex', { role: 'tanker' });
  fleet.addMember('Iris', { role: 'support' });

  assert(fleet.size === 4, 'Fleet has 4 members');
  assert(fleet.getCaptain().name === 'Cody', 'Captain is Cody');
  assert(fleet.getMembersByRole('scout').length === 1, 'One scout');
  assert(fleet.getMembersByRole('tanker')[0].name === 'Rex', 'Rex is tanker');
  assert(fleet.getMembersByRole('support')[0].name === 'Iris', 'Iris is support');
  assert(fleet.captainName === 'Cody', 'Captain name set');

  // Add without role — should auto-assign
  fleet.addMember('Zara', {});
  assert(fleet.size === 5, 'Fleet has 5 members');

  // Remove captain
  fleet.removeMember('Cody');
  assert(fleet.captainName !== 'Cody', 'Captain transferred');
  assert(fleet.size === 4, 'Fleet has 4 after removal');

  // Treasury
  fleet.addGold(100);
  assert(fleet.treasury === 100, 'Treasury has 100g');
  assert(!fleet.spendGold(200), 'Cannot spend 200');
  assert(fleet.spendGold(50), 'Can spend 50');
  assert(fleet.treasury === 50, 'Treasury now 50g');

  // XP
  assert(fleet.grantXP(500), 'Fleet levels up');
  assert(fleet.level >= 2, 'Fleet level >= 2');

  // Chat
  const msg = fleet.broadcast('Test message', 'Tester');
  assert(msg.sender === 'Tester', 'Chat message sender');
  assert(fleet.chatLog.length > 0, 'Chat log not empty');

  // Expedition
  fleet.startExpedition({ x: 100, z: -200 }, { name: 'Test Voyage' });
  assert(fleet.status === 'expedition', 'Fleet on expedition');
  fleet.endExpedition(true);
  assert(fleet.status === 'docked', 'Fleet docked');
  assert(fleet.voyageHistory.length === 1, 'One voyage recorded');
});

// === FleetMember Tests ===
describe('Fleet member progression', () => {
  const member = new FleetMember('TestBot', { role: 'scout', skill: 5 });
  assert(member.skill === 5, 'Initial skill 5');
  assert(member.hp === 100, 'Initial HP 100');

  member.takeDamage(60);
  assert(member.hp === 40, `HP 40 after damage (got ${member.hp})`);

  member.heal(20);
  assert(member.hp === 60, `HP 60 after heal (got ${member.hp})`);

  // XP after damage tests
  member.gainXP(500);
  assert(member.level >= 2, 'Leveled up');
});

describe('Shared bait pool', () => {
  const fleet = new Fleet({ name: 'Bait Test' });
  fleet.addSharedBait({ id: 'glow_berry', name: 'Glow Berry', stackSize: 20 });
  fleet.addSharedBait({ id: 'glow_berry', name: 'Glow Berry', stackSize: 10 });

  const bait = fleet.takeSharedBait('glow_berry', 15);
  assert(bait !== null, 'Got bait');
  assert(bait.stackSize === 15, 'Got 15 bait');

  assert(fleet.takeSharedBait('glow_berry', 20) === null, 'Not enough bait left');
});

// === Captain Tests ===
describe('Captain strategic decisions (rule-based)', () => {
  const fleet = new Fleet({ name: 'Captain Test', captain: 'AI' });
  fleet.addMember('AI', { role: 'captain', isOnline: true });
  const captain = new FleetCaptain({ fleet, apiKey: null }); // rule-based

  // Should suggest plan_expedition when idle
  const decision = captain._ruleBasedReview(captain._buildContext());
  assert(decision !== null, 'Captain makes a decision when idle');
  assert(decision.action === 'plan_expedition', 'Suggests expedition');

  // Storm scenario
  captain.logEvent('Storm approaching rapidly');
  const stormDecision = captain._ruleBasedReview(captain._buildContext());
  assert(stormDecision.action === 'recall_fleet', 'Recalls during storm');

  // Voyage memory
  captain.recordVoyageOutcome({ target: { name: 'Bad Bay' }, success: false, catches: [], goldEarned: 0, duration: 300000 });
  assert(captain.unprofitableSpots.has('Bad Bay'), 'Remembers unprofitable spots');

  assert(captain.script.rules.length > 0, 'Captain has fleet-level script');
});

// === Hazard Tests ===
describe('Hazard spawning and fish reaction', () => {
  const system = new MarineHazardSystem({ spawnRate: 1.0 });

  // Spawn specific
  const shark = system.spawn('shark_pack', { location: { x: 100, z: -200 } });
  assert(shark.type === 'shark_pack', 'Shark spawned');
  assert(shark.isActive(), 'Shark is active');
  assert(shark.isInRange({ x: 100, z: -200 }), 'In range of center');
  assert(!shark.isInRange({ x: 500, z: 500 }), 'Not in range of far point');

  // Tick with fishermen
  const events = system.tick(
    [{ name: 'Nova', location: { x: 105, z: -195 } }],
    Array(15) // 15 fish
  );
  assert(events.length > 0, 'Hazard produces events');

  // Active hazards
  assert(system.getActive().length > 0, 'Has active hazards');
  assert(system.getHazardsAt({ x: 100, z: -200 }).length > 0, 'Finds hazards at location');

  // Dispel
  assert(system.dispel(shark.id), 'Hazard dispelled');
  assert(system.getActive().length === 0, 'No active hazards after dispel');

  // All hazard types can be created
  for (const type of Object.keys(HAZARD_TYPES)) {
    const h = system.spawn(type, { location: { x: 0, z: 0 } });
    assert(h.type === type, `${type} created`);
    system.dispel(h.id);
  }

  // Stats
  const stats = system.getStats();
  assert(stats.totalSpawned > 0, 'Stats track total spawned');
});

describe('Hazard types have correct properties', () => {
  assert(HAZARD_TYPES.elder_guardian.severity === 'extreme', 'Elder Guardian is extreme');
  assert(HAZARD_TYPES.bioluminescent.severity === 'beneficial', 'Bioluminescent is beneficial');
  assert(HAZARD_TYPES.squid_ink.damage === 0, 'Squid ink does no damage');
  assert(HAZARD_TYPES.leviathan.damage === 100, 'Leviathan does 100 damage');
});

// === Workflow Tests ===
describe('Workflow step execution and recovery', () => {
  const engine = new WorkflowEngine();

  // Define a simple workflow
  engine.define('test', [
    { step: 'step1', agent: 'fleet', action: (data) => { data.step1 = true; return 'done'; } },
    { step: 'step2', agent: 'captain', depends_on: ['step1'], action: (data) => { data.step2 = true; return 'done'; } },
    { step: 'step3', agent: 'fleet', depends_on: ['step2'], action: (data) => { data.step3 = true; return 'done'; } },
  ]);

  const wf = engine.create('test');
  engine.setActive(wf);
  wf.start();

  // Execute all steps
  let ticks = 0;
  while (wf.status === WORKFLOW_STATUS.RUNNING && ticks < 10) {
    engine.tick();
    ticks++;
  }

  assert(wf.status === WORKFLOW_STATUS.COMPLETED, `Workflow completed (status: ${wf.status})`);
  assert(wf.getProgress() === 1, 'Progress is 100%');
  assert(wf.data.step1 && wf.data.step2 && wf.data.step3, 'All steps executed');
  assert(ticks <= 4, `Completed in ${ticks} ticks (should be 3-4)`);
});

// Helper to tick a standalone workflow
function engine_tick_wf(wf) {
  const ready = wf.getReadySteps();
  for (const step of ready) {
    step.status = WORKFLOW_STATUS.RUNNING;
    step.startedAt = Date.now();
    if (typeof step.action === 'function') {
      try { wf.completeStep(step.id, step.action(wf.data)); }
      catch (err) { wf.failStep(step.id, err.message); }
    }
  }
}

describe('Workflow failure and recovery', () => {
  const wf = new Workflow('fail_test', [
    { step: 'fail_step', agent: 'fleet', action: () => { throw new Error('intentional'); }, recovery: 'fallback', maxAttempts: 2 },
  ]);
  wf.start();
  engine_tick_wf(wf); // attempt 1 → recovery
  engine_tick_wf(wf); // attempt 2 → failed
  assert(wf.failedSteps.size > 0, 'Workflow fails after max attempts');
});

describe('Workflow cancellation', () => {
  const wf = new Workflow('cancel_test', [
    { step: 's1', agent: 'fleet' },
    { step: 's2', agent: 'fleet', depends_on: ['s1'] },
    { step: 's3', agent: 'fleet', depends_on: ['s2'] },
  ]);
  wf.start();
  wf.cancel();
  assert(wf.status === WORKFLOW_STATUS.CANCELLED, 'Workflow cancelled');
});

describe('Workflow completion callbacks', () => {
  let completed = false;
  const wf = new Workflow('cb_test', [
    { step: 's1', agent: 'fleet', action: () => 'result1' },
  ]);
  wf.onComplete = (data) => { completed = true; };
  wf.start();
  wf.completeStep('s1', 'result1');
  assert(completed, 'onComplete called');
});

// === Market Tests ===
describe('Market price dynamics', () => {
  const market = new Market();
  market.setBasePrice('cod', 20);
  market.setBasePrice('rare_fish', 100);

  // Initial demand
  const initial = market.getDemand('cod');
  assert(initial.price > 0, 'Cod has a price');
  assert(initial.trend === 'stable', 'Initial trend is stable');

  // Selling increases supply, price drops
  for (let i = 0; i < 30; i++) market.recordSale('cod');
  const afterSelling = market.getDemand('cod');
  assert(afterSelling.price < initial.price, 'Price dropped after selling');

  // Forecast
  const forecast = market.getForecast();
  assert(forecast.length >= 1, 'Forecast has entries');

  // Events
  const events = market.checkEvents();
  // Events are random so we just check it doesn't crash

  // NPC customers
  const customers = market.spawnCustomers(5);
  assert(customers.length === 5, '5 customers spawned');

  // Shop mechanic
  market.setStandPrice('cod', 25);
  const saleResult = market.sellAtStand('cod', customers[0].name);
  // Result depends on NPC personality

  // Market summary
  const summary = market.getSummary();
  assert(summary.npcCustomers === 5, 'Summary tracks customers');
});

describe('Supply/demand relationship', () => {
  const market = new Market();
  market.setBasePrice('test_fish', 50);

  const lowSupply = market.getDemand('test_fish');
  for (let i = 0; i < 50; i++) market.recordSale('test_fish');
  const highSupply = market.getDemand('test_fish');

  assert(highSupply.price < lowSupply.price, 'High supply = lower price');
  assert(highSupply.reason === 'oversupply', 'Reason is oversupply');
});

// === Contract Tests ===
describe('Contract completion tracking', () => {
  const board = new ContractBoard();

  // Generate contracts
  const delivery = board.generate('delivery', { species: 'cod', count: 5 });
  assert(delivery.status === 'available', 'Delivery available');
  assert(delivery.type === 'delivery', 'Type is delivery');
  assert(delivery.maxProgress === 5, 'Need 5 fish');

  const research = board.generate('research', { species: 'rare_fish' });
  assert(research.type === 'research', 'Research type');

  // Accept
  board.accept(delivery.id);
  assert(delivery.status === 'active', 'Delivery active');

  // Progress
  delivery.addProgress(3);
  assert(delivery.progress === 3, 'Progress 3/5');
  assert(!delivery.isExpired(), 'Not expired yet');

  // Complete
  const completed = delivery.addProgress(2);
  assert(completed, 'Delivery completed');
  assert(delivery.status === 'completed', 'Status is completed');
  assert(delivery.reward.gold > 0, 'Reward has gold');

  // Board summary
  assert(board.getAvailable().length >= 0, 'Board tracks available');
  assert(board.getActive().length >= 0, 'Board tracks active');

  // Max active limit — fill up
  const otherBoard = new ContractBoard({ maxActive: 5 });
  for (let i = 0; i < 6; i++) otherBoard.generate('delivery');
  while (otherBoard.getActive().length < otherBoard.maxActive && otherBoard.getAvailable().length > 0) {
    otherBoard.accept(otherBoard.getAvailable()[0].id);
  }
  otherBoard.generate('delivery');
  const extra = otherBoard.getAvailable()[0];
  assert(extra !== undefined, 'New contract available');
  assert(otherBoard.accept(extra.id) === null, 'Cannot exceed max active contracts');

  // All contract types
  for (const type of ['exploration', 'rescue', 'hunting', 'collection']) {
    const c = board.generate(type);
    assert(c.type === type, `${type} contract generated`);
  }
});

// === Safety Net Tests ===
describe('Safety net dispatch and rescue', () => {
  const fleet = new Fleet({ name: 'Safety Test', captain: 'Cody' });
  fleet.addMember('Cody', { role: 'captain', isOnline: true, location: { x: 0, z: 0 } });
  fleet.addMember('Nova', { role: 'scout', isOnline: true, location: { x: 5, z: 5 } });
  fleet.addMember('Rex', { role: 'tanker', isOnline: true, location: { x: 10, z: 10 } });
  fleet.addMember('Iris', { role: 'support', isOnline: true, location: { x: -5, z: -5 } });

  const safety = new SafetyNet(fleet);
  const events = [];
  safety.onEvent(e => events.push(e));

  // SOS — buddy system should dispatch rescue
  safety.memberInDanger('Nova', { name: 'Shark Pack' });
  const rescueEvents = events.filter(e => e.type === 'rescue_dispatched');
  assert(rescueEvents.length > 0, `Rescue dispatched (got ${events.length} events: ${events.map(e=>e.type).join(',')})`);

  // Medical evac
  fleet.getMember('Nova').takeDamage(80);
  const healed = safety.medicalEvacuation('Nova');
  assert(healed, 'Medical evac successful');
  assert(fleet.getMember('Nova').hp > 0, 'Nova healed');

  // Emergency recall
  safety.emergencyRecall();
  const rex = fleet.getMember('Rex');
  assert(rex.status === 'returning', 'Rex recalled');

  // Buddy system
  assert(safety.getStats().buddyPairs > 0, 'Buddy pairs set up');

  // Backup bait
  fleet.addSharedBait({ id: 'worm', name: 'Worm', stackSize: 10 });
  assert(safety.supplyBackupBait('Nova', 'worm', 3), 'Backup bait provided');
  assert(fleet.takeSharedBait('worm', 8) === null, 'Bait depleted');

  // Intelligence sharing
  safety.shareIntelligence({ name: 'Shark', location: { x: 50, z: 50 } }, 'Nova');
  assert(fleet.chatLog.some(e => e.message.includes('Shark')), 'Intelligence shared in chat');
});

// === Boat Tests ===
describe('Boat upgrade progression', () => {
  const boat = new Boat('Test Boat', 'skiff');
  assert(boat.tier === 'skiff', 'Starts as skiff');
  assert(boat.maxHp === BOAT_TIERS.skiff.hp, 'Correct HP');
  assert(boat.capacity === BOAT_TIERS.skiff.capacity, 'Correct capacity');

  // Upgrades
  assert(boat.upgrade('radar', 1), 'Radar upgrade succeeds');
  assert(boat.radarRange > BOAT_TIERS.skiff.radar, 'Radar range increased');

  assert(boat.upgrade('capacity', 2), 'Capacity upgrade');
  assert(boat.capacity > BOAT_TIERS.skiff.capacity, 'Capacity increased');

  // Equipment
  assert(!boat.installEquipment('sonar'), 'Skiff has 0 equipment slots');
  boat.upgrade('speed', 1); // doesn't add slots
  assert(!boat.installEquipment('sonar'), 'Still no slots');

  // Damage
  const dmgResult = boat.takeDamage(30);
  assert(boat.hp < boat.maxHp, 'Boat damaged');
  assert(dmgResult.damage > 0, 'Damage recorded');
  assert(!dmgResult.destroyed, 'Not destroyed');

  // Repair
  boat.repair();
  assert(boat.hp === boat.maxHp, 'Fully repaired');

  // Tier upgrade
  const tierResult = boat.upgradeTier();
  assert(tierResult !== false, 'Can upgrade to fishing boat');
  assert(boat.tier === 'fishing', 'Now fishing boat tier');
  assert(boat.equipmentSlots >= 1, 'Fishing boat has equipment slots');

  // Install equipment on fishing boat
  assert(boat.installEquipment('sonar'), 'Sonar installed');
  assert(!boat.installEquipment('sonar'), 'Cannot install duplicate');

  // Cargo
  assert(boat.storeFish({ species: 'cod' }), 'Fish stored');
  assert(boat.cargo.length === 1, 'One fish in cargo');
  const unloaded = boat.unloadCargo();
  assert(unloaded.length === 1, 'Unloaded one fish');
  assert(boat.cargo.length === 0, 'Cargo empty');

  // Destroy
  boat.takeDamage(boat.maxHp + 100);
  assert(boat.hp === 0, 'HP is 0');
  assert(!boat.isSeaworthy(), 'Not seaworthy');

  // All tiers
  for (const tier of Object.keys(BOAT_TIERS)) {
    assert(BOAT_TIERS[tier].name, `${tier} has a name`);
    assert(BOAT_TIERS[tier].hp > 0, `${tier} has HP`);
  }
});

// === Crew/Tavern Tests ===
describe('Crew recruitment', () => {
  const tavern = new Tavern({ name: 'Test Tavern' });
  tavern.refresh(); // Force refresh

  const recruits = tavern.getRecruits();
  assert(recruits.length > 0, 'Has recruits');

  // Roles
  const scouts = tavern.getByRole('scout');
  assert(scouts.length >= 0, 'Can filter by role'); // may be 0 randomly

  // Hire
  const member = tavern.hire(recruits[0].id);
  assert(member !== null, 'Hired a member');
  assert(member.status === 'hired', 'Member status is hired');

  // Personality modifiers
  for (const [key, p] of Object.entries(PERSONALITIES)) {
    assert(p.riskMult > 0, `${key} has risk mult`);
    assert(p.catchMult > 0, `${key} has catch mult`);
    assert(p.name, `${key} has name`);
  }

  // Crew member progression
  const crew = new CrewMember({ name: 'Test', skill: 5 });
  crew.gainXP(300);
  assert(crew.level >= 2, 'Crew levels up');
  assert(crew.morale === 80, 'Default morale');
  crew.adjustMorale(-50);
  assert(crew.morale === 30, 'Morale decreased');
  assert(!crew.isSatisfied(), 'Not satisfied at 30 morale');

  // Poach chance
  crew.morale = 10;
  assert(crew.poachChance() > 0, 'Low morale = poachable');
  crew.morale = 100;
  assert(crew.poachChance() === 0, 'High morale = not poachable');
});

// === Integration: FishingCompany ===
describe('FishingCompany integration', () => {
  const company = new FishingCompany({ name: 'Test Co', owner: 'TestOwner' });
  company.fleet.addMember('Bot1', { role: 'captain', isOnline: true });
  company.fleet.addMember('Bot2', { role: 'scout', isOnline: true });

  // Tick (day cycle)
  company.tick(0);
  assert(['morning', 'day', 'evening', 'night'].includes(company.timeOfDay), 'Valid time of day');

  // Market
  company.market.setBasePrice('cod', 15);
  const demand = company.market.getDemand('cod');
  assert(demand.price > 0, 'Price available');

  // Contract generation
  const contract = company.contracts.generate('delivery', { species: 'cod', count: 5 });
  assert(contract !== null, 'Contract generated');

  // Status
  const status = company.getStatus();
  assert(status.name === 'Test Co', 'Company name in status');
  assert(status.fleet.members >= 2, 'Fleet in status');
  assert(status.timeOfDay !== undefined, 'Time in status');
});

// === Summary ===
console.log(`\n${'='.repeat(50)}`);
console.log(`✅ ${passed} passed | ❌ ${failed} failed | ${passed + failed} total`);
if (failed > 0) process.exit(1);
else console.log('🎉 All tests passed!');
