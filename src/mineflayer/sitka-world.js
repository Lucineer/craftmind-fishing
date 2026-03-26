/**
 * @module craftmind-fishing/sitka-world
 * @description Location definitions for Sitka Sound world in Minecraft.
 */

export const SITKA_LOCATIONS = {
  spawn:           { x: 0,   y: 65, z: 0,   name: 'Sitka Dock',            type: 'town' },
  crescent_harbor: { x: 20,  y: 62, z: 10,  name: 'Crescent Harbor',       type: 'harbor' },
  thimble_berry_cove: { x: 80, y: 62, z: 50, name: 'Thimble Berry Cove',   type: 'harbor' },
  ernies_bar:      { x: -15, y: 65, z: -10, name: "Ernie's Bar & Grill",   type: 'building' },
  lfs_marine:      { x: -25, y: 65, z: -10, name: 'LFS Marine Supply',     type: 'building' },
  adfg_office:     { x: -15, y: 65, z: -25, name: 'ADF&G Field Office',    type: 'building' },
  processor:       { x: 30,  y: 63, z: 15,  name: 'Sitka Sound Processors', type: 'building' },
  kelp_line:       { x: 100, y: 60, z: 80,  name: 'Kelp Line',             type: 'fishing_spot' },
  bio_island:      { x: 200, y: 60, z: 150, name: 'Biorka Island',         type: 'fishing_spot' },
  deep_channel:    { x: 150, y: 50, z: 250, name: 'Deep Channel',          type: 'fishing_spot' },
  river_mouth:     { x: -80, y: 63, z: 60,  name: 'Indian River Mouth',    type: 'fishing_spot' },
  old_dock:        { x: -60, y: 63, z: 30,  name: 'Old Cannery Dock',      type: 'ruin' },
  hot_springs:     { x: -200, y: 62, z: 200, name: 'Baranof Hot Springs',  type: 'wilderness' },
  mount_edgecumbe: { x: 400, y: 80, z: -300, name: 'Mount Edgecumbe',      type: 'landmark' },
  old_growth:      { x: -150, y: 68, z: -100, name: 'Old Growth Forest',   type: 'wilderness' },
};

export function getLocationByName(name) {
  // Try exact key match
  const key = name.toLowerCase().replace(/[^a-z_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (SITKA_LOCATIONS[key]) return SITKA_LOCATIONS[key];
  // Try name match
  const normalized = name.toLowerCase();
  for (const loc of Object.values(SITKA_LOCATIONS)) {
    if (loc.name.toLowerCase() === normalized) return loc;
  }
  return null;
}

export function getLocationsByType(type) {
  return Object.values(SITKA_LOCATIONS).filter(loc => loc.type === type);
}
