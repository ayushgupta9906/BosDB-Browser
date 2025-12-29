#!/bin/sh
set -e

echo "Starting BosDB-Browser..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Explicitly set hostname to bind to all interfaces
export HOSTNAME="0.0.0.0"
echo "HOSTNAME: $HOSTNAME"

# Start the Next.js server
exec node server.js
