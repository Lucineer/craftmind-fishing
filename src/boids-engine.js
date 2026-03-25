// CraftMind Fishing — Enhanced Boids Engine for Fish
// 3D flocking with depth, currents, obstacles, fear propagation, species modifiers.
// Performance target: 100+ fish at 20 ticks/sec.

/**
 * A single fish entity in 3D space (x, y=depth, z).
 */
export class FishEntity {
  constructor(id, options = {}) {
    this.id = id;
    this.x = options.x ?? 0;
    this.y = options.y ?? 5;       // depth (0=surface, positive=deeper)
    this.z = options.z ?? 0;
    this.vx = options.vx ?? 0;
    this.vy = options.vy ?? 0;
    this.vz = options.vz ?? 0;
    this.maxSpeed = options.maxSpeed ?? 2.0;
    this.speciesId = options.speciesId ?? 'unknown';
    this.schoolId = options.schoolId ?? null;
    this.size = options.size ?? 1.0;
    this.alive = true;
    this.fleeing = false;
    this.fleeTimer = 0;
    this.actionOverride = null;     // set by behavior script
    this.actionTimer = 0;
  }

  /** Distance to another entity in 3D */
  distTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /** Distance squared (avoids sqrt for comparisons) */
  distSqTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return dx * dx + dy * dy + dz * dz;
  }
}

/**
 * Species-specific boid modifiers.
 */
export const SpeciesModifiers = {
  // Separation distance, alignment weight, cohesion weight, max speed
  tight_schooler:  { separation: 1.5, alignment: 1.2, cohesion: 1.5, maxSpeed: 2.0 },
  loose_schooler:  { separation: 3.0, alignment: 0.6, cohesion: 0.8, maxSpeed: 2.5 },
  solitary:        { separation: 5.0, alignment: 0.2, cohesion: 0.3, maxSpeed: 3.0 },
  predator:        { separation: 2.0, alignment: 0.8, cohesion: 0.5, maxSpeed: 3.5 },
  bottom_dweller:  { separation: 2.0, alignment: 0.7, cohesion: 1.0, maxSpeed: 1.2, prefersBottom: true },
  surface_skimmer: { separation: 2.5, alignment: 1.0, cohesion: 1.2, maxSpeed: 2.8, prefersSurface: true },
};

/**
 * Water current — a directional force field.
 */
export class WaterCurrent {
  constructor(id, options = {}) {
    this.id = id;
    this.x = options.x ?? 0;        // center
    this.z = options.z ?? 0;
    this.radius = options.radius ?? 20;
    this.strength = options.strength ?? 0.5; // force magnitude
    this.dirX = options.dirX ?? 1;   // direction
    this.dirZ = options.dirZ ?? 0;
    this.vertical = options.vertical ?? 0;   // up/down current
  }

  /** Get force vector at a position */
  getForceAt(x, y, z) {
    const dx = x - this.x;
    const dz = z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > this.radius) return { fx: 0, fy: 0, fz: 0 };
    const falloff = 1 - dist / this.radius;
    return {
      fx: this.dirX * this.strength * falloff,
      fy: this.vertical * this.strength * falloff,
      fz: this.dirZ * this.strength * falloff,
    };
  }
}

/**
 * Obstacle — area fish must avoid (coral, kelp, boat hulls).
 */
export class Obstacle {
  constructor(id, options = {}) {
    this.id = id;
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.z = options.z ?? 0;
    this.radius = options.radius ?? 3;
    this.type = options.type ?? 'coral'; // coral, kelp, hull, rock
  }
}

/**
 * The main Boids Engine.
 */
export class BoidsEngine {
  constructor(options = {}) {
    this.entities = new Map();       // id → FishEntity
    this.currents = new Map();       // id → WaterCurrent
    this.obstacles = new Map();      // id → Obstacle
    this.schools = new Map();        // schoolId → Set<fishId>

    // Tunable weights
    this.separationDist = options.separationDist ?? 2.0;
    this.separationWeight = options.separationWeight ?? 1.5;
    this.alignmentWeight = options.alignmentWeight ?? 1.0;
    this.cohesionWeight = options.cohesionWeight ?? 1.0;
    this.obstacleWeight = options.obstacleWeight ?? 3.0;
    this.obstacleDist = options.obstacleDist ?? 5.0;
    this.depthWeight = options.depthWeight ?? 0.3; // tendency to stay at preferred depth
    this.fearWeight = options.fearWeight ?? 4.0;
    this.currentWeight = options.currentWeight ?? 0.5;
    this.fearPropagationRadius = options.fearPropagationRadius ?? 8.0;

    // Bounds
    this.bounds = options.bounds ?? { minX: -50, maxX: 50, minY: 0, maxY: 30, minZ: -50, maxZ: 50 };

    // Spatial hash for O(n) neighbor queries
    this.cellSize = 10;
    this.spatialHash = new Map();
  }

  /** Add a fish entity */
  addEntity(entity) {
    this.entities.set(entity.id, entity);
    return this;
  }

  /** Remove a fish entity */
  removeEntity(id) {
    const entity = this.entities.get(id);
    if (entity?.schoolId) {
      this.schools.get(entity.schoolId)?.delete(id);
    }
    this.entities.delete(id);
    return entity;
  }

  /** Add a water current */
  addCurrent(current) {
    this.currents.set(current.id, current);
    return this;
  }

  /** Add an obstacle */
  addObstacle(obstacle) {
    this.obstacles.set(obstacle.id, obstacle);
    return this;
  }

  /** Create a school and assign fish to it */
  createSchool(schoolId, fishIds) {
    this.schools.set(schoolId, new Set(fishIds));
    for (const id of fishIds) {
      const e = this.entities.get(id);
      if (e) e.schoolId = schoolId;
    }
    return this;
  }

  /** Trigger fear in a fish — propagates to neighbors */
  triggerFear(fishId, fromX, fromZ, intensity = 1.0) {
    const entity = this.entities.get(fishId);
    if (!entity || !entity.alive) return;

    entity.fleeing = true;
    entity.fleeTimer = 3000 + Math.random() * 2000;

    // Flee direction: away from threat
    const dx = entity.x - fromX;
    const dz = entity.z - fromZ;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    entity.vx += (dx / dist) * this.fearWeight * intensity;
    entity.vz += (dz / dist) * this.fearWeight * intensity;

    // Propagate fear to neighbors
    this._propagateFear(fishId, intensity * 0.6);
  }

  /** Run one simulation tick for all entities */
  tick(dt = 50) {
    const dtSec = dt / 1000;

    // Build spatial hash
    this._buildSpatialHash();

    for (const [id, entity] of this.entities) {
      if (!entity.alive) continue;

      const modifiers = this._getModifiers(entity);

      // Update flee timer
      if (entity.fleeing) {
        entity.fleeTimer -= dt;
        if (entity.fleeTimer <= 0) entity.fleeing = false;
      }

      // Apply behavior script override
      if (entity.actionOverride) {
        this._applyActionOverride(entity, entity.actionOverride, dt);
        entity.actionTimer -= dt;
        if (entity.actionTimer <= 0) entity.actionOverride = null;
      }

      // Boids forces (only with school)
      const neighbors = this._getNeighbors(entity, this.separationDist * 4);
      let fx = 0, fy = 0, fz = 0;

      if (neighbors.length > 0) {
        const sep = this._separation(entity, neighbors, modifiers);
        const ali = this._alignment(entity, neighbors, modifiers);
        const coh = this._cohesion(entity, neighbors, modifiers);
        fx += sep.x * this.separationWeight * modifiers.separation +
              ali.x * this.alignmentWeight * modifiers.alignment +
              coh.x * this.cohesionWeight * modifiers.cohesion;
        fy += sep.y * this.separationWeight * modifiers.separation +
              ali.y * this.alignmentWeight * modifiers.alignment +
              coh.y * this.cohesionWeight * modifiers.cohesion;
        fz += sep.z * this.separationWeight * modifiers.separation +
              ali.z * this.alignmentWeight * modifiers.alignment +
              coh.z * this.cohesionWeight * modifiers.cohesion;
      }

      // Depth preference
      fy += this._depthForce(entity, modifiers) * this.depthWeight;

      // Currents
      for (const [, current] of this.currents) {
        const force = current.getForceAt(entity.x, entity.y, entity.z);
        fx += force.fx * this.currentWeight;
        fy += force.fy * this.currentWeight;
        fz += force.fz * this.currentWeight;
      }

      // Obstacle avoidance
      for (const [, obs] of this.obstacles) {
        const avoid = this._avoidObstacle(entity, obs);
        fx += avoid.x * this.obstacleWeight;
        fy += avoid.y * this.obstacleWeight;
        fz += avoid.z * this.obstacleWeight;
      }

      // Boundary enforcement
      const bound = this._boundaryForce(entity);
      fx += bound.x * 2;
      fy += bound.y * 2;
      fz += bound.z * 2;

      // Apply forces
      entity.vx = (entity.vx + fx * dtSec) * 0.95; // damping
      entity.vy = (entity.vy + fy * dtSec) * 0.95;
      entity.vz = (entity.vz + fz * dtSec) * 0.95;

      // Clamp speed
      const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy + entity.vz * entity.vz);
      const maxSpd = entity.fleeing ? modifiers.maxSpeed * 1.8 : modifiers.maxSpeed;
      if (speed > maxSpd) {
        const scale = maxSpd / speed;
        entity.vx *= scale;
        entity.vy *= scale;
        entity.vz *= scale;
      }

      // Update position
      entity.x += entity.vx * dtSec;
      entity.y += entity.vy * dtSec;
      entity.z += entity.vz * dtSec;

      // Clamp to bounds
      entity.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, entity.y));
      entity.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, entity.x));
      entity.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, entity.z));
    }
  }

  /** Get average school position */
  getSchoolCenter(schoolId) {
    const ids = this.schools.get(schoolId);
    if (!ids || ids.size === 0) return null;
    let sx = 0, sy = 0, sz = 0, count = 0;
    for (const id of ids) {
      const e = this.entities.get(id);
      if (e?.alive) { sx += e.x; sy += e.y; sz += e.z; count++; }
    }
    return count > 0 ? { x: sx / count, y: sy / count, z: sz / count, count } : null;
  }

  /** Get all entity positions (for rendering/debugging) */
  getSnapshot() {
    return [...this.entities.values()].filter(e => e.alive).map(e => ({
      id: e.id, x: e.x, y: e.y, z: e.z,
      schoolId: e.schoolId, speciesId: e.speciesId, fleeing: e.fleeing,
    }));
  }

  // --- Internal forces ---

  _separation(entity, neighbors, mods) {
    let fx = 0, fy = 0, fz = 0;
    for (const other of neighbors) {
      const distSq = entity.distSqTo(other);
      const minDist = this.separationDist * mods.separation;
      if (distSq < minDist * minDist && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const force = (minDist - dist) / dist;
        fx += (entity.x - other.x) * force;
        fy += (entity.y - other.y) * force;
        fz += (entity.z - other.z) * force;
      }
    }
    return { x: fx, y: fy, z: fz };
  }

  _alignment(entity, neighbors, mods) {
    let vx = 0, vy = 0, vz = 0;
    for (const other of neighbors) {
      vx += other.vx; vy += other.vy; vz += other.vz;
    }
    const n = neighbors.length;
    return {
      x: (vx / n - entity.vx) * mods.alignment,
      y: (vy / n - entity.vy) * mods.alignment,
      z: (vz / n - entity.vz) * mods.alignment,
    };
  }

  _cohesion(entity, neighbors, mods) {
    let cx = 0, cy = 0, cz = 0;
    for (const other of neighbors) {
      cx += other.x; cy += other.y; cz += other.z;
    }
    const n = neighbors.length;
    return {
      x: (cx / n - entity.x) * mods.cohesion * 0.01,
      y: (cy / n - entity.y) * mods.cohesion * 0.01,
      z: (cz / n - entity.z) * mods.cohesion * 0.01,
    };
  }

  _depthForce(entity, mods) {
    if (mods.prefersBottom) return this.bounds.maxY * 0.7 - entity.y;
    if (mods.prefersSurface) return -entity.y;
    return 0; // midwater fish: no depth preference from boids
  }

  _avoidObstacle(entity, obs) {
    const dx = entity.x - obs.x;
    const dy = entity.y - obs.y;
    const dz = entity.z - obs.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const minDist = this.obstacleDist + obs.radius;
    if (dist < minDist && dist > 0.01) {
      const force = (minDist - dist) / dist;
      return { x: dx * force, y: dy * force, z: dz * force };
    }
    return { x: 0, y: 0, z: 0 };
  }

  _boundaryForce(entity) {
    let fx = 0, fy = 0, fz = 0;
    const margin = 5;
    const b = this.bounds;
    if (entity.x < b.minX + margin) fx = (b.minX + margin - entity.x);
    if (entity.x > b.maxX - margin) fx = (b.maxX - margin - entity.x);
    if (entity.y < b.minY + margin) fy = (b.minY + margin - entity.y);
    if (entity.y > b.maxY - margin) fy = (b.maxY - margin - entity.y);
    if (entity.z < b.minZ + margin) fz = (b.minZ + margin - entity.z);
    if (entity.z > b.maxZ - margin) fz = (b.maxZ - margin - entity.z);
    return { x: fx, y: fy, z: fz };
  }

  _applyActionOverride(entity, action, dt) {
    const force = 3.0;
    switch (action) {
      case 'dive_deep':   entity.vy += force; break;
      case 'surface':     entity.vy -= force; break;
      case 'flee':        /* handled by triggerFear */ break;
      case 'scatter':     entity.vx += (Math.random() - 0.5) * force * 2;
                          entity.vz += (Math.random() - 0.5) * force * 2; break;
      case 'drift_current': /* let current handle it */ break;
      case 'hide_coral':
      case 'hide_kelp':   /* move toward nearest obstacle — simplified */ break;
    }
  }

  _propagateFear(sourceId, intensity) {
    const source = this.entities.get(sourceId);
    if (!source) return;

    const neighbors = this._getNeighbors(source, this.fearPropagationRadius);
    for (const other of neighbors) {
      if (other.id === sourceId || other.fleeing) continue;
      const dist = source.distTo(other);
      if (dist < this.fearPropagationRadius) {
        const falloff = 1 - dist / this.fearPropagationRadius;
        if (falloff * intensity > 0.15) { // threshold to prevent infinite ripple
          other.fleeing = true;
          other.fleeTimer = 1500 + Math.random() * 1000;
          // Flee away from source's threat direction
          other.vx += source.vx * falloff * intensity;
          other.vz += source.vz * falloff * intensity;
          // Don't cascade further (prevents exponential blowup)
        }
      }
    }
  }

  _getModifiers(entity) {
    // Map speciesId to modifier preset — can be extended
    const speciesMods = entity._modifiers ?? SpeciesModifiers.loose_schooler;
    return speciesMods;
  }

  /** Set modifiers for a species */
  setSpeciesModifier(speciesId, mod) {
    for (const [, entity] of this.entities) {
      if (entity.speciesId === speciesId) entity._modifiers = mod;
    }
  }

  // --- Spatial hashing ---

  _buildSpatialHash() {
    this.spatialHash.clear();
    for (const [id, entity] of this.entities) {
      if (!entity.alive) continue;
      const key = this._cellKey(entity.x, entity.z);
      if (!this.spatialHash.has(key)) this.spatialHash.set(key, []);
      this.spatialHash.get(key).push(entity);
    }
  }

  _cellKey(x, z) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }

  _getNeighbors(entity, radius) {
    const results = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(entity.x / this.cellSize);
    const cz = Math.floor(entity.z / this.cellSize);
    const radiusSq = radius * radius;

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        const cell = this.spatialHash.get(key);
        if (!cell) continue;
        for (const other of cell) {
          if (other.id === entity.id) continue;
          if (entity.distSqTo(other) < radiusSq) results.push(other);
        }
      }
    }
    return results;
  }
}

export default BoidsEngine;
