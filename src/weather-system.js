// CraftMind Fishing — Weather & Environmental System
// Rain, thunder, moon phases, dawn/dusk, temperature.

export class WeatherSystem {
  constructor() {
    this.currentWeather = 'clear';
    this.weatherTimer = 0;
    this.weatherDuration = 60000 + Math.random() * 120000;
    this.moonPhase = Math.floor(Math.random() * 8); // 0=new, 4=full
    this.temperature = 20;
    this.isThundering = false;
  }

  /** Update weather simulation */
  tick(dt = 60000) {
    this.weatherTimer += dt;
    this.moonPhase = (this.moonPhase + dt / 24000) % 8;

    // Weather transitions
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      this.weatherDuration = 60000 + Math.random() * 180000;
      const roll = Math.random();
      if (roll < 0.5) this.currentWeather = 'clear';
      else if (roll < 0.75) this.currentWeather = 'rain';
      else if (roll < 0.85) { this.currentWeather = 'rain'; this.isThundering = true; }
      else this.currentWeather = 'cloudy';
    }
    // Thunder subsides
    if (this.isThundering && Math.random() < 0.02) this.isThundering = false;

    // Temperature drift
    this.temperature += (Math.random() - 0.5) * 0.5;
    this.temperature = Math.max(-20, Math.min(40, this.temperature));
  }

  /** Get bite rate multiplier based on current conditions */
  getBiteMultiplier(timeOfDay) {
    let mult = 1.0;

    // Weather
    if (this.currentWeather === 'rain') mult *= 1.4;
    if (this.isThundering) mult *= 1.8;

    // Moon phase (4 = full moon is best)
    const moonBonus = Math.abs(this.moonPhase - 4) / 4; // 0 at full, 1 at new
    mult *= 1.0 + (1 - moonBonus) * 0.3;

    // Time of day
    if (timeOfDay === 'dawn' || timeOfDay === 'dusk') mult *= 1.3;
    if (timeOfDay === 'night') mult *= 1.1;

    // Temperature — mild is best (15-25°C)
    const tempIdeal = 1 - Math.abs(this.temperature - 20) / 30;
    mult *= 0.7 + tempIdeal * 0.5;

    return mult;
  }

  /** Check if lightning strike risk */
  getLightningRisk() {
    return this.isThundering ? 0.003 : 0;
  }

  /** Get rare fish multiplier from thunderstorms */
  getRareFishBoost() {
    return this.isThundering ? 1.5 : this.currentWeather === 'rain' ? 1.1 : 1.0;
  }

  /** Get moon phase name */
  getMoonPhaseName() {
    return ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'][Math.floor(this.moonPhase)];
  }

  /** Force weather for testing */
  forceWeather(weather, thundering = false) {
    this.currentWeather = weather;
    this.isThundering = thundering;
  }

  /** Force moon phase (0-7) */
  forceMoonPhase(phase) {
    this.moonPhase = phase % 8;
  }

  toString() {
    const storm = this.isThundering ? ' ⚡' : '';
    return `${this.currentWeather === 'rain' ? '🌧️' : this.currentWeather === 'cloudy' ? '☁️' : '☀️'} ${this.currentWeather}${storm} | 🌙 ${this.getMoonPhaseName()} | 🌡️ ${this.temperature.toFixed(1)}°C`;
  }
}

export default WeatherSystem;
