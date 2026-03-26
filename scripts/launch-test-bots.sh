#!/bin/bash
cd /home/lucineer/projects/craftmind
source .env

# Kill old
kill $(pgrep -f "bot.js.*2556") 2>/dev/null
sleep 2

# Launch
for PORT in 25566 25567 25568; do
  NAME="Cody_$(echo $PORT | tail -c 2 | tr '678' 'ABC')"
  nohup node --unhandled-rejections=warn src/bot.js localhost $PORT $NAME \
    --plugin ../craftmind-fishing/src/mineflayer/fishing-plugin.js \
    > /tmp/bot-$PORT.log 2>&1 &
  echo "$NAME on $PORT (PID $!)"
done

echo "Done. Waiting 15s..."
sleep 15

for PORT in 25566 25567 25568; do
  echo "=== $PORT ==="
  grep -E "legacy|registry only|Vision|Resilient|Script not|Starting with|Error" /tmp/bot-$PORT.log 2>/dev/null | tail -3
done