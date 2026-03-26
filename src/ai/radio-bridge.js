/**
 * @module craftmind-fishing/ai/radio-bridge
 * @description Connects the MarineRadio system to agent events.
 * Weather alerts, ADF&G notices, market reports, and agent-triggered broadcasts.
 */

export class RadioBridge {
  /**
   * @param {import('./agent-manager.js').AgentManager} manager
   * @param {object} [radio] - MarineRadio instance
   */
  constructor(manager, radio) {
    this.manager = manager;
    this.radio = radio;
    this._setupListeners();
  }

  _setupListeners() {
    // World events → radio broadcasts
    this.manager.on('world:event', (event) => {
      if (event.weather === 'storm') {
        this.broadcast('securite', 'Weather Alert: Storm approaching from the northwest. All boats return to harbor.');
      }
      if (event.weather === 'heavy_rain') {
        this.broadcast('general', 'Weather Update: Heavy rain moving in from the south. Visibility reducing. Secure gear.');
      }
    });

    // Emergent stories → radio broadcasts
    this.manager.on('story:emergent', (story) => {
      if (story.type === 'weather_drama' && story.effect?.broadcast) {
        this.broadcast('securite', story.effect.broadcast);
      }
      if (story.type === 'market_event') {
        this.broadcast('general', story.dialogue);
      }
      if (story.type === 'brag_cascade') {
        this.broadcast('general', `Fishing Report: Big catches reported today! ${story.dialogue}`);
      }
    });

    // Agent actions → radio chatter
    this.manager.on('agent:action', ({ agent, action }) => {
      if (action?.type === 'caught_fish' && action.fish?.weight > 30) {
        this.broadcast('general', `Chatter on Channel 9: ${agent} reportedly landed a ${action.fish.weight}-pounder!`);
      }
    });

    // Interactions → radio chatter
    this.manager.on('interaction', (interaction) => {
      if (interaction.type === 'SPOT_COMPETITION') {
        this.broadcast('general', `Channel 6 chatter: Some tension between ${interaction.agents[0]} and ${interaction.agents[1]} at the fishing grounds.`);
      }
    });
  }

  /**
   * Broadcast a message on the radio.
   * @param {string} type - broadcast type
   * @param {string} message
   * @param {string} [vessel]
   */
  broadcast(type, message, vessel) {
    if (!this.radio) {
      // No radio — just emit the event
      this.manager.emit('radio:broadcast', { message, type });
      return;
    }
    this.radio.broadcast(type, message, vessel || 'Sitka Harbor Radio');
  }

  /**
   * Simulated ADF&G regulation broadcast.
   * @param {string} message
   */
  adfgNotice(message) {
    this.broadcast('securite', `ADF&G Notice: ${message}`, 'ADF&G Sitka');
  }

  /**
   * Coast Guard safety broadcast.
   * @param {string} message
   */
  coastGuardAlert(message) {
    this.broadcast('securite', `Coast Guard Sector Juneau: ${message}`, 'USCG');
  }
}

export default RadioBridge;
