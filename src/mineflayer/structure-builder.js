/**
 * @module craftmind-fishing/structure-builder
 * @description Builds structures (buildings, docks, signs, chests) in Minecraft via RCON.
 */

export class StructureBuilder {
  constructor(worldBuilder) {
    this.wb = worldBuilder;
  }

  async buildPlatform(x, y, z, width, depth, block = 'oak_planks') {
    await this.wb.fill(x, y, z, x + width - 1, y, z + depth - 1, block);
  }

  async buildBuilding(x, y, z, w, h, d, wall = 'oak_planks', corner = 'oak_log', name = '') {
    // Floor
    await this.wb.fill(x, y - 1, z, x + w - 1, y - 1, z + d - 1, 'stone_bricks');

    // Walls (hollow box)
    await this.wb.fill(x, y, z, x + w - 1, y + h - 1, z, wall);           // North
    await this.wb.fill(x, y, z + d - 1, x + w - 1, y + h - 1, z + d - 1, wall); // South
    await this.wb.fill(x, y, z, x, y + h - 1, z + d - 1, wall);           // West
    await this.wb.fill(x + w - 1, y, z, x + w - 1, y + h - 1, z + d - 1, wall); // East

    // Interior air
    await this.wb.fill(x + 1, y, z + 1, x + w - 2, y + h - 1, z + d - 2, 'air');

    // Door (front center)
    const doorX = x + Math.floor(w / 2);
    await this.wb.setBlock(doorX, y, z, 'air');
    await this.wb.setBlock(doorX, y + 1, z, 'air');

    // Windows (glass panes on sides)
    if (d >= 3) {
      await this.wb.setBlock(x, y + 1, z + Math.floor(d / 2), 'glass_pane');
      await this.wb.setBlock(x + w - 1, y + 1, z + Math.floor(d / 2), 'glass_pane');
    }
    if (w >= 3) {
      await this.wb.setBlock(x + Math.floor(w / 2), y + 1, z, 'glass_pane');
      await this.wb.setBlock(x + Math.floor(w / 2), y + 1, z + d - 1, 'glass_pane');
    }

    // Corner posts
    await this.wb.setBlock(x, y, z, corner);
    await this.wb.setBlock(x + w - 1, y, z, corner);
    await this.wb.setBlock(x, y, z + d - 1, corner);
    await this.wb.setBlock(x + w - 1, y, z + d - 1, corner);

    // Roof
    await this.wb.fill(x - 1, y + h, z - 1, x + w, y + h, z + d, wall);
  }

  async buildDock(x, y, z, length, direction = 'x') {
    const width = 3;
    if (direction === 'x') {
      // Main planks
      await this.wb.fill(x, y, z, x + length, y, z + width - 1, 'oak_planks');
      // Fence posts along edges
      for (let i = 0; i <= length; i += 3) {
        await this.wb.setBlock(x + i, y + 1, z, 'oak_fence');
        await this.wb.setBlock(x + i, y + 1, z + width - 1, 'oak_fence');
      }
    } else {
      await this.wb.fill(x, y, z, x + width - 1, y, z + length, 'oak_planks');
      for (let i = 0; i <= length; i += 3) {
        await this.wb.setBlock(x, y + 1, z + i, 'oak_fence');
        await this.wb.setBlock(x + width - 1, y + 1, z + i, 'oak_fence');
      }
    }
    // Lantern at end
    if (direction === 'x') {
      await this.wb.setBlock(x + length, y + 1, z + 1, 'lantern');
    } else {
      await this.wb.setBlock(x + 1, y + 1, z + length, 'lantern');
    }
  }

  async placeSign(x, y, z, text) {
    await this.wb.setBlock(x, y, z, 'oak_sign');
    // Escape text for JSON
    const escaped = JSON.stringify({ text: text.replace(/"/g, '\\"') });
    await this.wb.send(`/data merge block ${x} ${y} ${z} {front_text: {messages: [${escaped},"","",""]}}`);
  }

  async placeChest(x, y, z, items = []) {
    await this.wb.setBlock(x, y, z, 'chest');
    for (const item of items) {
      await this.wb.send(`/item replace block ${x} ${y} ${z} container.0 with ${item.id} ${item.count || 1}`);
    }
  }
}
