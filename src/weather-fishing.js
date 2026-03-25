// CraftMind Fishing — Weather × Fishing Method Interactions
// Different methods shine in different weather. Timing matters.

/**
 * Weather conditions and how they affect each fishing method.
 * Values are multipliers (1.0 = neutral, >1 = bonus, <1 = penalty).
 */
export const WEATHER_METHOD_MAP = {
  bait_casting: {
    clear:   { mult: 1.0, note: 'Perfect conditions for a peaceful cast.' },
    cloudy:  { mult: 1.1, note: 'Fish are less cautious under clouds.' },
    rain:    { mult: 1.2, note: 'Rain masks your silhouette. Fish bite more readily.' },
    storm:   { mult: 0.6, note: 'Thunder spooks fish. Risk of lightning on exposed rods.' },
  },
  crab_pots: {
    clear:   { mult: 1.0, note: 'Nice day for checking pots.' },
    cloudy:  { mult: 1.0, note: 'Underwater — weather is irrelevant.' },
    rain:    { mult: 1.0, note: 'Crabs don\'t care about rain.' },
    storm:   { mult: 1.0, note: 'Pots are safe on the ocean floor. You might not be.' },
  },
  lobster_traps: {
    clear:   { mult: 1.0, note: 'Good visibility for deep dives.' },
    cloudy:  { mult: 1.0, note: 'No effect on deep traps.' },
    rain:    { mult: 1.0, note: 'Deep enough to not notice.' },
    storm:   { mult: 0.7, note: 'Dangerous to check traps during storms.' },
  },
  longlining: {
    clear:   { mult: 1.1, note: 'Calm seas keep the line steady.' },
    cloudy:  { mult: 1.0, note: 'Fair conditions.' },
    rain:    { mult: 0.8, note: 'Wind can tangle hooks.' },
    storm:   { mult: 0.3, note: '⚠️ Storms scatter hooks. Expect heavy losses.' },
  },
  trolling: {
    clear:   { mult: 1.3, note: 'Crystal waters — see the fish follow your lures!' },
    cloudy:  { mult: 1.0, note: 'Decent trolling weather.' },
    rain:    { mult: 0.9, note: 'Rougher seas but fish still bite.' },
    storm:   { mult: 0.4, note: 'Too dangerous for most boats.' },
  },
  trawling: {
    clear:   { mult: 1.0, note: 'Standard trawling conditions.' },
    cloudy:  { mult: 1.0, note: 'Overcast skies don\'t matter underwater.' },
    rain:    { mult: 0.8, note: 'Net handling becomes slippery.' },
    storm:   { mult: 0.2, note: '☠️ NET CAN SNAG. BOAT AT RISK. Abort immediately.' },
  },
  free_diving: {
    clear:   { mult: 1.3, note: 'Calm, clear water — perfect visibility for approaches.' },
    cloudy:  { mult: 1.0, note: 'Decent conditions.' },
    rain:    { mult: 0.7, note: 'Surface chop makes entries difficult.' },
    storm:   { mult: 0.2, note: 'Suicidal to dive in a storm.' },
  },
  scuba_diving: {
    clear:   { mult: 1.2, note: 'Great visibility for wreck exploration.' },
    cloudy:  { mult: 1.0, note: 'Acceptable conditions.' },
    rain:    { mult: 0.8, note: 'Reduced visibility at depth.' },
    storm:   { mult: 0.3, note: 'Currents become unpredictable and deadly.' },
  },
  jigging: {
    clear:   { mult: 1.0, note: 'Standard jigging.' },
    cloudy:  { mult: 1.3, note: 'Fish less cautious under overcast skies. Jigging excels!' },
    rain:    { mult: 1.1, note: 'Rain ripples mask the lure\'s entry. Tricky but rewarding.' },
    storm:   { mult: 0.4, note: 'Can\'t maintain rhythm in rough water.' },
  },
  ice_fishing: {
    clear:   { mult: 1.0, note: 'Peaceful ice fishing. Classic.' },
    cloudy:  { mult: 1.0, note: 'No effect — you\'re on a frozen lake.' },
    rain:    { mult: 0.9, note: 'Rain on ice... concerning but usually fine.' },
    storm:   { mult: 0.8, note: 'Wind chill is brutal. Dress warm.' },
  },
  surf_casting: {
    clear:   { mult: 0.9, note: 'Flat seas. Less surf activity.' },
    cloudy:  { mult: 1.0, note: 'Fish cruise the surf zone.' },
    rain:    { mult: 1.1, note: 'Choppy surf stirs up baitfish. Good action.' },
    storm:   { mult: 1.5, note: '⚡ STORM FISHING! Rare species appear! But lightning...' },
  },
  spearfishing: {
    clear:   { mult: 1.3, note: 'Crystal clear water — see every shadow.' },
    cloudy:  { mult: 0.8, note: 'Reduced visibility makes targeting harder.' },
    rain:    { mult: 0.5, note: 'Murky water. Can\'t see the fish.' },
    storm:   { mult: 0.2, note: 'Impossible. Don\'t even try.' },
  },
};

/**
 * Season × Method interactions.
 */
export const SEASON_METHOD_MAP = {
  spring: {
    ice_fishing: { mult: 0.2, note: 'Ice is melting. Dangerous to walk on.' },
    crab_pots:   { mult: 1.2, note: 'Crabs are most active in spring.' },
  },
  summer: {
    ice_fishing: { mult: 0.0, note: 'No ice. Method unavailable.' },
    free_diving: { mult: 1.2, note: 'Warm water. Longer dives possible.' },
    surf_casting: { mult: 1.1, note: 'Summer surf is prime.' },
  },
  autumn: {
    crab_pots:   { mult: 1.3, note: 'Crabs feed heavily before winter.' },
    longlining:  { mult: 1.2, note: 'Pelagic migration season.' },
    spearfishing: { mult: 1.1, note: 'Cooler water = clearer visibility.' },
  },
  winter: {
    ice_fishing:   { mult: 1.5, note: '❄️ PRIME ice fishing season. Exclusive species!' },
    free_diving:   { mult: 0.3, note: 'Hypothermia risk. Only for the bold.' },
    surf_casting:  { mult: 0.5, note: 'Freezing spray. Brutal.' },
    crab_pots:     { mult: 0.7, note: 'Crabs are sluggish but still present.' },
  },
};

export class WeatherFishingSystem {
  /**
   * Get the combined modifier for a method given weather and season.
   */
  static getModifier(methodId, weather, season) {
    const weatherKey = weather?.isThundering ? 'storm' : weather?.currentWeather ?? 'clear';
    const weatherData = WEATHER_METHOD_MAP[methodId]?.[weatherKey];
    const seasonData = SEASON_METHOD_MAP[season]?.[methodId];

    let mult = 1.0;
    let notes = [];

    if (weatherData) {
      mult *= weatherData.mult;
      notes.push(weatherData.note);
    }
    if (seasonData) {
      mult *= seasonData.mult;
      notes.push(seasonData.note);
    }

    return { multiplier: mult, notes };
  }

  /**
   * Get the best method for current weather + season.
   */
  static recommend(weather, season, availableMethods) {
    let best = null, bestScore = -Infinity, bestNotes = [];

    for (const methodId of availableMethods) {
      const { multiplier, notes } = this.getModifier(methodId, weather, season);
      if (multiplier > bestScore) {
        bestScore = multiplier;
        best = methodId;
        bestNotes = notes;
      }
    }

    return { method: best, score: bestScore, notes: bestNotes };
  }

  /**
   * Get a weather report for all methods.
   */
  static getWeatherReport(weather, season) {
    const lines = [];
    const weatherKey = weather?.isThundering ? 'storm' : weather?.currentWeather ?? 'clear';

    lines.push(`╔═══════════════════════════════════════════╗`);
    lines.push(`║     🌦️  Weather × Fishing Report  🌦️       ║`);
    lines.push(`║  Weather: ${weatherKey.padEnd(8)}  Season: ${season.padEnd(8)}    ║`);
    lines.push(`╠═══════════════════════════════════════════╣`);

    for (const [methodId, conditions] of Object.entries(WEATHER_METHOD_MAP)) {
      const cond = conditions[weatherKey];
      const seasonMult = SEASON_METHOD_MAP[season]?.[methodId]?.mult ?? 1.0;
      const total = cond.mult * seasonMult;

      const bar = total >= 1.2 ? '🟢' : total >= 0.8 ? '🟡' : total >= 0.5 ? '🟠' : '🔴';
      lines.push(`║ ${bar} ${methodId.padEnd(16)} x${total.toFixed(1).padStart(4)}`);
    }

    lines.push(`╚═══════════════════════════════════════════╝`);
    return lines.join('\n');
  }
}

export default WeatherFishingSystem;
