#!/bin/bash

LOG_DIR="./logs"
MAX_SIZE_MB=10

echo "=== Container Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "=== Log Rotation ==="

mkdir -p "$LOG_DIR"

for logfile in "$LOG_DIR"/*.log; do
  [ -f "$logfile" ] || continue

  size_mb=$(du -m "$logfile" | cut -f1)
  if [ "$size_mb" -ge "$MAX_SIZE_MB" ]; then
    timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    compressed="${logfile%.log}_${timestamp}.log.gz"
    gzip -c "$logfile" > "$compressed"
    > "$logfile"
    echo "Rotated: $logfile → $compressed"
  else
    echo "OK (${size_mb}MB): $logfile"
  fi
done

echo "Log rotation complete"
