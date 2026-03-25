// CraftMind Fishing — Town of Sitka (index)
// The player's home base. Real streets, real businesses, real Alaska characters.

export { TOWN_CONFIG, STREETS, ZONES, TOWN_LAYOUT, getStreet, getDistance } from './sitka-town.js';
export { BUILDINGS, BUILDING_POSITIONS, getBuilding, getBuildingsByType, getBuildingsOnStreet, isOpen, findNearbyBuildings } from './town-buildings.js';
export { NPCS, getNPC, getNPCsAtBuilding, getNPCsAtTime, getNPCDialogue } from './sitka-npcs.js';
export { HARBORS, SitkaHarbor } from './harbor-system.js';
export { VHF_CHANNELS, MarineRadio } from './radio-system.js';
export { ANNUAL_EVENTS, RANDOM_EVENTS, TownEventManager } from './town-events.js';
