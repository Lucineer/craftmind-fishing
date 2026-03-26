/**
 * @module craftmind-fishing/world-builder
 * @description RCON-based world manipulation for building Sitka Sound in Minecraft.
 */

export class WorldBuilder {
  constructor(host = 'localhost', port = 25575, password = 'craftmind') {
    this.host = host;
    this.port = port;
    this.password = password;
    this.rcon = null;
  }

  async connect() {
    if (this.rcon) return this;
    const { Rcon } = await import('rcon-client');
    this.rcon = await new Rcon({ host: this.host, port: this.port, password: this.password }).connect();
    return this;
  }

  async disconnect() {
    if (this.rcon) {
      await this.rcon.end();
      this.rcon = null;
    }
  }

  async send(command) {
    const result = await this.rcon.send(command);
    return result;
  }

  async setBlock(x, y, z, blockType) {
    return this.send(`/setblock ${x} ${y} ${z} ${blockType}`);
  }

  async fill(x1, y1, z1, x2, y2, z2, blockType) {
    return this.send(`/fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${blockType}`);
  }

  async teleport(entity, x, y, z) {
    return this.send(`/tp ${entity} ${x} ${y} ${z}`);
  }

  async giveItem(player, item, count = 1) {
    return this.send(`/give ${player} ${item} ${count}`);
  }

  async setTime(time) {
    return this.send(`/time set ${time}`);
  }

  async setWeather(weather) {
    return this.send(`/weather ${weather}`);
  }

  async setBlockData(x, y, z, nbt) {
    return this.send(`/data merge block ${x} ${y} ${z} ${nbt}`);
  }
}
