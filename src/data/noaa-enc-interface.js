// CraftMind Fishing — NOAA ENC (Electronic Navigational Chart) Interface
// Abstraction layer for S-57 chart data. Can parse real ENC files or
// generate game-world geometry from cell metadata.

/**
 * Available ENC cells for Southeast Alaska.
 * Scale is the compilation scale (smaller = more detail).
 */
export const ENC_CELLS = {
  'US5AK21M': { name: 'Sitka Sound',        scale: 45000,  depthRange: [0, 600],   features: ['coastline','depth','buoys','obstructions'] },
  'US5AK22M': { name: 'Peril Strait',       scale: 45000,  depthRange: [0, 400],   features: ['coastline','depth','buoys','obstructions'] },
  'US5AK23M': { name: 'Chatham Strait',     scale: 80000,  depthRange: [0, 1200],  features: ['coastline','depth','buoys'] },
  'US5AK20M': { name: 'Icy Strait',         scale: 80000,  depthRange: [0, 900],   features: ['coastline','depth','buoys'] },
  'US5AK30M': { name: 'Cross Sound',        scale: 80000,  depthRange: [0, 1500],  features: ['coastline','depth','buoys'] },
  'US5AK24M': { name: 'Lynn Canal',         scale: 80000,  depthRange: [0, 2000],  features: ['coastline','depth','buoys'] },
  'US5AK25M': { name: 'Stephens Passage',   scale: 45000,  depthRange: [0, 800],   features: ['coastline','depth','buoys'] },
  'US5AK31M': { name: 'Frederick Sound',    scale: 80000,  depthRange: [0, 1200],  features: ['coastline','depth','buoys'] },
  'US5AK32M': { name: 'Sumner Strait',      scale: 80000,  depthRange: [0, 1000],  features: ['coastline','depth','buoys'] },
  'US5AK33M': { name: 'Keku Strait',        scale: 45000,  depthRange: [0, 500],   features: ['coastline','depth','buoys','obstructions'] },
  'US2AK01M': { name: 'Gulf of Alaska',     scale: 200000, depthRange: [0, 10000], features: ['depth'] },
  'US2AK02M': { name: 'Eastern Gulf of AK', scale: 200000, depthRange: [0, 8000],  features: ['depth'] },
};

/**
 * Depth-to-biome mapping used by world generation.
 */
export const DEPTH_BIOMES = [
  { maxDepthFt: 10,  biome: 'tidal_flats',       label: 'Tidal Flat' },
  { maxDepthFt: 30,  biome: 'sheltered_sound',    label: 'Shallow Sound' },
  { maxDepthFt: 100, biome: 'sheltered_sound',    label: 'Mid Sound' },
  { maxDepthFt: 300, biome: 'deep_sound',         label: 'Deep Sound' },
  { maxDepthFt: 600, biome: 'open_ocean',         label: 'Offshore' },
  { maxDepthFt: Infinity, biome: 'deep_trench',   label: 'Deep Ocean' },
];

/**
 * Seabed nature → species associations.
 * In S-57, NATSUR attribute codes describe bottom composition.
 */
export const SEABED_SPECIES = {
  mud:       { label: 'Mud',          species: ['halibut', 'pacific_cod', 'sablefish', 'starry_flounder', 'english_sole'] },
  sand:      { label: 'Sand',         species: ['dungeness_crab', 'pacific_sanddab', 'butter_clam', 'littleneck_clam', 'sand_lance'] },
  rock:      { label: 'Rock',         species: ['rockfish', 'lingcod', 'china_rockfish', 'tiger_rockfish', 'greenling'] },
  shells:    { label: 'Shells/Gravel',species: ['scallop', 'weathervane_scallop'] },
  weed:      { label: 'Kelp/Weed',    species: ['greenling', 'black_rockfish', 'china_rockfish', 'abalone', 'sea_cucumber'] },
  gravel:    { label: 'Gravel',       species: ['halibut', 'pacific_cod', 'eulachon'] },
  coral:     { label: 'Coral',        species: [], notes: 'Tropical easter egg — not in Alaska, but maybe…' },
};

/**
 * ENCHandler — parses ENC data into game world geometry.
 * Currently generates procedural data based on cell metadata.
 * Someday could parse real S-57 .000 files.
 */
export class ENCHandler {
  constructor(options = {}) {
    this.loadedCells = new Map();
    this.onFeature = options.onFeature ?? (() => {}); // callback for generated features
  }

  /** Load an ENC cell by ID. */
  async loadCell(cellId) {
    const cellMeta = ENC_CELLS[cellId];
    if (!cellMeta) throw new Error(`Unknown ENC cell: ${cellId}`);

    if (this.loadedCells.has(cellId)) return this.loadedCells.get(cellId);

    // In a real implementation, this would fetch and parse S-57 binary data.
    // For now, generate procedural world data from the cell metadata.
    const cellData = this._generateCellData(cellId, cellMeta);
    this.loadedCells.set(cellId, cellData);
    return cellData;
  }

  /** Get all loaded cell IDs. */
  getLoadedCells() {
    return [...this.loadedCells.keys()];
  }

  /** Get biome for a depth in feet. */
  getBiomeForDepth(depthFt) {
    for (const entry of DEPTH_BIOMES) {
      if (depthFt <= entry.maxDepthFt) return entry;
    }
    return DEPTH_BIOMES[DEPTH_BIOMES.length - 1];
  }

  /** Get species associated with a seabed type. */
  getSpeciesForSeabed(seabedType) {
    return SEABED_SPECIES[seabedType] ?? SEABED_SPECIES.mud;
  }

  // ── S-57 Object Parsers (stubs — ready for real data) ──────────

  /** Parse DEPARE (Depth Area). */
  parseDEPARE(geometry, drval1, drval2) {
    const avgDepth = (drval1 + drval2) / 2;
    const biome = this.getBiomeForDepth(avgDepth);
    this.onFeature({ type: 'depth_area', depth: avgDepth, biome: biome.biome, geometry });
    return { biome, depthRange: [drval1, drval2] };
  }

  /** Parse NATSUR (Nature of Seabed). */
  parseNATSUR(natsurCodes) {
    // NATSUR uses numeric codes: 1=mud, 2=clay, 3=silt, 4=sand, 5=stone, 6=gravel, etc.
    const codeMap = { 1: 'mud', 4: 'sand', 5: 'rock', 6: 'gravel', 7: 'shells', 10: 'weed' };
    const types = natsurCodes.map(c => codeMap[c] ?? 'mud');
    const species = [];
    for (const t of types) {
      const info = SEABED_SPECIES[t];
      if (info) species.push(...info.species);
    }
    return { seabedTypes: types, species: [...new Set(species)] };
  }

  /** Parse COALNE (Coastline). */
  parseCOALNE(geometry) {
    this.onFeature({ type: 'coastline', geometry });
    return { type: 'coastline', geometry };
  }

  /** Parse BCNLAT / BCNCAR (Beacons & Buoys). */
  parseBUOYS(attributes) {
    const feature = {
      type: attributes.catlam === 1 ? 'lighthouse' : 'buoy',
      name: attributes.objnam ?? 'Unnamed Buoy',
      lat: attributes.lat,
      lon: attributes.lon,
      color: attributes.colour ?? 'red',
      isLit: attributes.lights !== undefined,
    };
    this.onFeature({ type: 'nav_aid', ...feature });
    return feature;
  }

  /** Parse OBSTRN (Obstructions). */
  parseOBSTRN(attributes) {
    const feature = {
      type: attributes.valsou ? 'underwater_rock' : 'surface_rock',
      name: attributes.objnam ?? 'Uncharted Obstruction',
      depth: attributes.valsou ?? 0,
      lat: attributes.lat,
      lon: attributes.lon,
      danger: attributes.valsou ? 'hidden' : 'visible',
    };
    this.onFeature({ type: 'obstruction', ...feature });
    return feature;
  }

  // ── Procedural Generation ──────────────────────────────────────

  _generateCellData(cellId, meta) {
    const features = [];
    const seed = this._hashCode(cellId);
    const rng = this._seededRandom(seed);

    // Generate coastline points
    const coastlinePoints = this._generateCoastline(meta, rng);
    features.push(...coastlinePoints.map(p => ({ type: 'coastline', ...p })));

    // Generate depth areas
    const depthAreas = this._generateDepthAreas(meta, rng);
    features.push(...depthAreas.map(d => ({ type: 'depth_area', ...d })));

    // Generate navigation aids
    if (meta.features.includes('buoys')) {
      const buoys = this._generateBuoys(meta, rng);
      features.push(...buoys.map(b => ({ type: 'nav_aid', ...b })));
    }

    // Generate obstructions
    if (meta.features.includes('obstructions')) {
      const obstructions = this._generateObstructions(meta, rng);
      features.push(...obstructions.map(o => ({ type: 'obstruction', ...o })));
    }

    return {
      cellId,
      name: meta.name,
      scale: meta.scale,
      depthRange: meta.depthRange,
      features,
    };
  }

  _generateCoastline(meta, rng) {
    const points = [];
    const numPoints = 20 + Math.floor(rng() * 30);
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: rng() * 1000 - 500,
        z: rng() * 1000 - 500,
      });
    }
    return points;
  }

  _generateDepthAreas(meta, rng) {
    const areas = [];
    for (const biome of DEPTH_BIOMES) {
      if (biome.maxDepthFt <= meta.depthRange[1]) {
        const count = 3 + Math.floor(rng() * 5);
        for (let i = 0; i < count; i++) {
          areas.push({
            biome: biome.biome,
            depth: biome.maxDepthFt,
            x: rng() * 800 - 400,
            z: rng() * 800 - 400,
            radius: 20 + rng() * 60,
          });
        }
      }
    }
    return areas;
  }

  _generateBuoys(meta, rng) {
    const buoys = [];
    const count = 5 + Math.floor(rng() * 10);
    const names = ['Red #1', 'Green #2', 'Nun #3', 'Can #4', 'Red #5', 'Green #6', 'Rocky Point Light', 'Channel Entrance'];
    for (let i = 0; i < count; i++) {
      buoys.push({
        name: names[i % names.length],
        x: rng() * 600 - 300,
        z: rng() * 600 - 300,
        color: i % 2 === 0 ? 'red' : 'green',
        isLit: rng() > 0.4,
      });
    }
    return buoys;
  }

  _generateObstructions(meta, rng) {
    const obs = [];
    const count = 2 + Math.floor(rng() * 5);
    for (let i = 0; i < count; i++) {
      obs.push({
        name: rng() > 0.5 ? 'Sunken Rock' : 'Submerged Wreck',
        x: rng() * 500 - 250,
        z: rng() * 500 - 250,
        depth: rng() * 15, // feet below surface
        danger: rng() > 0.3 ? 'hidden' : 'visible',
      });
    }
    return obs;
  }

  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  _seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }
}

export default ENCHandler;
