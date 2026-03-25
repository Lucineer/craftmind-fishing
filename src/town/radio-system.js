// CraftMind Fishing — Marine Radio System
// Alaska fishermen live on the marine radio. VHF channels, mayday calls, fisherman chatter.

export const VHF_CHANNELS = {
  16: {
    number: 16,
    name: 'Channel 16',
    type: 'distress_calling',
    description: 'International distress and calling frequency. Everyone monitors this. Keep it clear except for emergencies and initial contact.',
    exampleCall: '"Securite securite securite, all stations, this is Sitka Harbormaster, gale warning for Sitka Sound, winds southeast 35 knots, seas 12 feet, valid through 0600 tomorrow."',
  },
  9: {
    number: 9,
    name: 'Channel 9',
    type: 'commercial_fishing',
    description: 'Commercial fishing coordination. Seine boats announce sets here. Longliners share positions. This is where the fleet talks.',
    exampleCall: '"Attention all seiners: ADF&G has OPENED Section 11! Section 11 is open effective immediately, four-hour opening, fish on!"',
  },
  6: {
    number: 6,
    name: 'Channel 6',
    type: 'charter_boat_traffic',
    description: 'Charter boat coordination. Captains share fishing reports, warn about hazards, and coordinate client pickups.',
    exampleCall: '"Sitka Point Lodge fleet, this is the Sitka Point, marking good numbers of chicken halibut at the Pinnacles, 180 feet, heading west from the Cape."',
  },
  12: {
    number: 12,
    name: 'Channel 12',
    type: 'port_operations',
    description: 'Port operations and harbormaster. Moorage assignments, dock instructions, harbor traffic.',
    exampleCall: '"FV Halibut Hunter, FV Halibut Hunter, you are assigned slip E-14, follow the blue line to your dock, Harbormaster out."',
  },
  22: {
    number: 22,
    name: 'Channel 22A',
    type: 'coast_guard',
    description: 'Coast Guard working channel. Safety alerts, enforcement notices, rescue coordination.',
    exampleCall: '"All stations, all stations, United States Coast Guard Sector Juneau, safety broadcast, all mariners are advised that a disabled vessel is adrift two miles west of Cape Edgecumbe, all vessels keep a sharp lookout."',
  },
  67: {
    number: 67,
    name: 'Channel 67',
    type: 'intership_working',
    description: 'Intership working channel. Boats switch here after making contact on 16. Private conversations.',
    exampleCall: '"FV Northern Pride, this is FV Halibut Hunter, switching to 67, over."',
  },
};

/**
 * MarineRadio — VHF radio simulation with broadcasts, channel monitoring, and events
 */
export class MarineRadio {
  constructor() {
    this.currentChannel = 16;
    this.messageLog = [];
    this.pendingDistress = null;
    this.broadcastQueue = [];
    this._generateAmbientChatter();
  }

  /**
   * Tune to a specific channel
   */
  tune(channel) {
    const ch = VHF_CHANNELS[channel];
    if (!ch) return { success: false, message: `Channel ${channel} not recognized.` };
    this.currentChannel = channel;
    return { success: true, message: `Tuned to ${ch.name} — ${ch.description}` };
  }

  /**
   * Broadcast a message on the current channel
   */
  broadcast(type, message, vesselName = 'FV Silver Streak') {
    const entry = {
      timestamp: new Date().toISOString(),
      channel: this.currentChannel,
      type, // 'distress', 'securite', 'general', 'coordination', 'weather'
      vessel: vesselName,
      message,
      priority: type === 'distress' ? 'critical' : type === 'securite' ? 'high' : 'normal',
    };
    this.messageLog.push(entry);

    if (type === 'distress') {
      this.pendingDistress = entry;
    }
    return entry;
  }

  /**
   * Listen for activity on the current channel
   */
  listen(duration = 5000) {
    const ch = VHF_CHANNELS[this.currentChannel];
    if (!ch) return { messages: [], message: 'No signal.' };

    const messages = this._generateChannelActivity(this.currentChannel);
    return {
      channel: ch,
      messages,
      message: `Monitoring ${ch.name}...`,
    };
  }

  /**
   * Send a mayday distress call
   */
  mayday(vesselName, situation, position = 'west of Mt Edgecumbe') {
    const message = `Mayday mayday mayday, this is ${vesselName}, ${situation}, position ${position}, requesting immediate assistance, over.`;
    return this.broadcast('distress', message, vesselName);
  }

  /**
   * Send a securite (safety) broadcast
   */
  securite(message, vesselName = 'Sitka Harbormaster') {
    const full = `Securite securite securite, all stations, this is ${vesselName}, ${message}`;
    return this.broadcast('securite', full, vesselName);
  }

  /**
   * Get recent message log
   */
  getLog(channel = null, limit = 20) {
    let entries = this.messageLog;
    if (channel) entries = entries.filter(e => e.channel === channel);
    return entries.slice(-limit);
  }

  /**
   * Generate a random radio event (used by the game loop)
   */
  generateRadioEvent() {
    const events = [
      ...this._weatherEvents(),
      ...this._fisheryEvents(),
      ...this._distressEvents(),
      ...this._coordinationEvents(),
      ...this._harborEvents(),
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    const entry = this.broadcast(event.type, event.message, event.vessel);
    return entry;
  }

  // ── Radio Event Generators ──

  _weatherEvents() {
    return [
      {
        type: 'securite', channel: 16, vessel: 'Sitka Harbormaster',
        message: 'all stations, this is Sitka Harbormaster, small craft advisory for Sitka Sound, southeast wind 25 knots, seas 8 feet, through 1800 today.',
      },
      {
        type: 'securite', channel: 16, vessel: 'National Weather Service',
        message: 'marine weather forecast for Sitka Sound: wind southeast 15 knots, seas 4 feet, rain, visibility 3 miles, tonight wind becoming south 20 knots.',
      },
      {
        type: 'securite', channel: 16, vessel: 'Coast Guard Juneau',
        message: 'all stations, gale warning, southeast gales 35 to 45 knots, seas building to 15 feet, Sitka Sound and approaches, through Thursday morning.',
      },
      {
        type: 'general', channel: 16, vessel: 'National Weather Service',
        message: 'all stations, this is the National Weather Service, dense fog advisory for the inner channels, visibility one-quarter mile or less, mariners use extreme caution.',
      },
    ];
  }

  _fisheryEvents() {
    return [
      {
        type: 'coordination', channel: 9, vessel: 'ADF&G',
        message: 'attention all seiners, ADF&G has OPENED Section 11 effective immediately, four-hour opening, Section 11 is OPEN, fish on!',
      },
      {
        type: 'coordination', channel: 9, vessel: 'ADF&G',
        message: 'attention all seiners, ADF&G has CLOSED Section 8A, closed effective immediately, all gear must be retrieved, emergency order number 2-SAL-26.',
      },
      {
        type: 'coordination', channel: 9, vessel: 'FV Deep Six',
        message: 'all seiners, this is FV Deep Six, marking large school of herring at Redoubt Bay, sonar showing 40 fathoms deep, heading north with the tide.',
      },
      {
        type: 'coordination', channel: 6, vessel: 'FV Sitka Point',
        message: 'Sitka Point Lodge fleet, this is the Sitka Point, marking good numbers of halibut at the Pinnacles, 180 feet of water, heading west from the Cape, over.',
      },
      {
        type: 'coordination', channel: 6, vessel: 'FV Sea Roamer',
        message: 'any charter boats fishing the Cape, this is Sea Roamer, we found a school of big coho at the kelp line, green and white hoochies, come on over.',
      },
      {
        type: 'coordination', channel: 9, vessel: 'ADF&G',
        message: 'all fishermen, emergency order: chinook retention CLOSED in the Sitka terminal harvest area effective immediately, any chinook caught must be released.',
      },
    ];
  }

  _distressEvents() {
    return [
      {
        type: 'distress', channel: 16, vessel: 'FV Northern Light',
        message: 'Mayday mayday mayday, this is FV Northern Light, taking water two miles west of Cape Edgecumbe, three persons aboard, abandoning to liferaft, over.',
      },
      {
        type: 'distress', channel: 16, vessel: 'FV Last Resort',
        message: 'Pan pan pan, this is FV Last Resort, engine failure drifting toward rocks at Biorka Island, two persons aboard, request tow, over.',
      },
      {
        type: 'general', channel: 16, vessel: 'Coast Guard Juneau',
        message: 'all stations, United States Coast Guard, all vessels in vicinity of Cape Edgecumbe keep sharp lookout and report any sighting of a liferaft, Coast Guard helicopter en route.',
      },
    ];
  }

  _coordinationEvents() {
    return [
      {
        type: 'general', channel: 9, vessel: 'FV Halibut Hunter',
        message: 'any longliners on the grounds, this is Halibut Hunter, the bite is on at the 200-foot ledge, heading southwest from the Cape.',
      },
      {
        type: 'general', channel: 67, vessel: 'FV Northern Pride',
        message: 'FV Deep Six, this is Northern Pride, how many ton did you get in the last opening? Over.',
      },
      {
        type: 'general', channel: 6, vessel: 'FV Early Dawn',
        message: 'any trollers on channel 6, the kings are hitting at the green can, 60 feet on the wire, spoons in green glow.',
      },
      {
        type: 'general', channel: 9, vessel: 'FV Sitka Rose',
        message: 'fleet, this is Sitka Rose, please keep clear of my gear, I\'m on a set at Redoubt, heading north, net in the water.',
      },
    ];
  }

  _harborEvents() {
    return [
      {
        type: 'general', channel: 12, vessel: 'Sitka Harbormaster',
        message: 'all vessels, the fuel dock will be closed for maintenance from 10am to 2pm today, plan accordingly.',
      },
      {
        type: 'general', channel: 12, vessel: 'Sitka Harbormaster',
        message: 'all vessels, vessel FV Silver Streak, please contact harbormaster on channel 12 regarding your moorage status, over.',
      },
      {
        type: 'general', channel: 16, vessel: 'Sitka Harbormaster',
        message: 'good morning Sitka, this is your harbormaster, weather today is overcast with light rain, winds variable 5 knots, barometer steady, have a safe day on the water.',
      },
    ];
  }

  /**
   * Generate ambient chatter for a channel (what you hear when you tune in)
   */
  _generateChannelActivity(channel) {
    const ambient = {
      16: [
        { text: '...just static and the hiss of open air...', type: 'ambient' },
        { text: '"Sitka Harbormaster, FV Halibut Hunter, switching to channel 12."', type: 'routine' },
        { text: '"Pan pan pan, Coast Guard Sector Juneau conducting communications check, all stations acknowledge."', type: 'routine' },
      ],
      9: [
        { text: '"FV Deep Six, this is Northern Pride, what\'s the herring biomass looking like out there? Over."', type: 'fleet' },
        { text: '"Set! Set! Set! We got em! Net\'s in the water, heading north!"', type: 'excited' },
        { text: '"ADF&G test vessel reporting: Section 8A test fishery, 200 fish per set average."', type: 'official' },
      ],
      6: [
        { text: '"Good morning Sitka! Charter fleet report — halibut fishing rated good at the Pinnacles today."', type: 'report' },
        { text: '"FV Sea Roamer to FV Angling Unlimited — we\'ve got a spot open tomorrow, need a referral?"', type: 'business' },
      ],
      12: [
        { text: '"FV Silver Streak, slip E-14, confirmed. Welcome to Sitka."', type: 'routine' },
        { text: '"Harbormaster, this is FV Early Dawn, need to extend my moorage another month, over."', type: 'routine' },
      ],
      22: [
        { text: '"Sector Juneau to all stations, safety inspection vessel USCGC Maple will be in Sitka Sound this week."', type: 'official' },
      ],
      67: [
        { text: '"Pete, you still fishing the Pinnacles? I\'m marking fish at the Cape."', type: 'private' },
        { text: '"That\'s a negative. I had to come in — prop wrapped.Heading to Petro Marine."', type: 'private' },
      ],
    };

    const pool = ambient[channel] || ambient[16];
    const count = Math.floor(Math.random() * 2) + 1;
    return pool.sort(() => Math.random() - 0.5).slice(0, count).map(m => ({
      channel,
      ...m,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Pre-generate some ambient chatter data
   */
  _generateAmbientChatter() {
    // Data is generated on demand by _generateChannelActivity
  }
}

export default { VHF_CHANNELS, MarineRadio };
