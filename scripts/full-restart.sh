#!/bin/bash
# Full simulation restart — Round 2 with pre-bot RCON give
set -e

echo "[$(date)] Starting simulation cluster (Round 2)..."

# Clean locks
for port in 25566 25567 25568; do
  rm -f /home/lucineer/projects/craftmind/test-server-${port}/craftmind/session.lock
done

# Kill old processes
pkill -f "bot.js.*2556" 2>/dev/null || true
pkill -f "night-shift" 2>/dev/null || true
pkill -f "telemetry.js" 2>/dev/null || true
sleep 2

# Start servers
for port in 25566 25567 25568; do
  cd /home/lucineer/projects/craftmind/test-server-${port}
  nohup java -Xmx512M -Xms256M -jar server.jar nogui > /tmp/server-${port}.log 2>&1 &
  echo "  Server ${port}: starting"
done

echo "  Waiting 60s for servers to boot..."
sleep 60

# Verify servers
for port in 25566 25567 25568; do
  if ! nc -z localhost ${port} -w 2 2>/dev/null; then
    echo "  ERROR: Server ${port} not responding!"
  else
    echo "  Server ${port}: OK"
  fi
done

# IMPORTANT: Give items via RCON BEFORE starting bots
# This prevents the race condition where bot starts script before rod arrives
echo "  Pre-loading inventory via RCON..."
node -e "
const Rcon = require('/home/lucineer/projects/craftmind/node_modules/rcon-client').Rcon;
const servers = [
  { port: 35566, bot: 'Cody_A' },
  { port: 35567, bot: 'Cody_B' },
  { port: 35568, bot: 'Cody_C' },
];
(async () => {
  for (const s of servers) {
    try {
      const rcon = await Rcon.connect({ host: 'localhost', port: s.port, password: 'fishing42' });
      // Clear any old player data
      await rcon.send('clear ' + s.bot);
      await rcon.send('give ' + s.bot + ' fishing_rod 5');
      await rcon.send('give ' + s.bot + ' bread 64');
      await rcon.send('give ' + s.bot + ' oak_log 32');
      await rcon.send('give ' + s.bot + ' string 32');
      await rcon.send('give ' + s.bot + ' stick 32');
      await rcon.send('give ' + s.bot + ' crafting_table');
      console.log('  ' + s.bot + ': pre-loaded');
      await rcon.end();
    } catch (e) {
      console.error('  ' + s.bot + ' RCON error: ' + e.message);
    }
  }
})();
"

sleep 5

# Start bots (with SERVER_PORT env for per-server stats)
cd /home/lucineer/projects/craftmind
for entry in "25566 Cody_A" "25567 Cody_B" "25568 Cody_C"; do
  port=$(echo $entry | cut -d' ' -f1)
  name=$(echo $entry | cut -d' ' -f2)
  nohup bash -c "export SERVER_PORT=${port} && source .env && node --unhandled-rejections=warn src/bot.js localhost ${port} ${name} --plugin ../craftmind-fishing/src/mineflayer/fishing-plugin.js" > /tmp/bot-${port}.log 2>&1 &
  echo "  ${name}: starting"
done

echo "  Bots started. Waiting 5s for connection..."
sleep 5

# Verify all bots connected
for port in 25566 25567 25568; do
  if ps aux | grep -q "[b]ot.js.*${port}"; then
    echo "  Port ${port}: ✅ bot running"
  else
    echo "  Port ${port}: ❌ bot failed"
  fi
done

# Start telemetry
cd /home/lucineer/projects/craftmind-fishing
nohup node scripts/telemetry.js > /tmp/telemetry-collector.log 2>&1 &
echo "  Telemetry: started"

echo "[$(date)] Round 2 cluster started"
