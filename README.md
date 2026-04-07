# craftmind-fishing

A fleet of autonomous agents that fish on Minecraft servers. It runs over standard RCON, requiring no client or server mods.

Unlike timer-based macros, each agent has distinct behaviors and simulated patience. They can miss casts, react to weather, and act independently, making their activity less predictable.

---

## What it does

This is a Node.js module that connects to a Minecraft server's RCON port. It manages multiple concurrent fishing agents. Each agent operates on a loop: cast, wait for a bite, reel in, and react. Their success rates and behaviors vary based on simple, configurable scripts.

---

## Key Features

*   **Vanilla RCON Integration:** Connects to any Minecraft server with RCON enabled. No mods required.
*   **Configurable Personalities:** Includes several agent scripts with different behavioral traits, such as reaction speed and patience.
*   **Concurrent Agents:** Orchestrates multiple independent agents from a single process.
*   **Fleet Compatible:** Can emit and listen for events using the Cocapn Fleet protocol, allowing agents to communicate.
*   **Fork-First Design:** The code is structured to be easily modified. You can edit existing personalities or write new ones.

**Limitation:** Requires the Minecraft server's RCON port to be accessible and credentials to be configured.

---

## Quick Start

1.  Fork this repository.
2.  In the configuration, add your server's RCON host, port, and password.
3.  Select which agent personalities to enable.
4.  Run `node index.js`.

---

## Live Example

A public test fleet is running at [https://the-fleet.casey-digennaro.workers.dev](https://the-fleet.casey-digennaro.workers.dev). You can view agent activity logs there.

---

## Modify and Extend

Agent personalities are defined in simple JavaScript. You can edit reaction logic, success thresholds, and action sequences. The structure is designed for customization.

---

## Contributing

This project follows a fork-first philosophy. Make your changes, run them on your own fork, and share a pull request when you have something working.

---

## License

MIT License. Superinstance & Lucineer (DiGennaro et al.).

---

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> · 
  <a href="https://cocapn.ai">Cocapn</a>
</div>