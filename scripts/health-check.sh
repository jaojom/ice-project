#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

API_CONTAINER="04_ice-api-1"
DB_CONTAINER="04_ice-postgres-1"
API_URL="http://localhost:3000/api/health"

echo "=== Health Check ==="

# ตรวจสอบ API container
if docker inspect "$API_CONTAINER" --format='{{.State.Running}}' 2>/dev/null | grep -q "true"; then
  echo -e "API Container:  ${GREEN}UP${NC}"
else
  echo -e "API Container:  ${RED}DOWN${NC}"
fi

# ตรวจสอบ DB container
if docker inspect "$DB_CONTAINER" --format='{{.State.Running}}' 2>/dev/null | grep -q "true"; then
  echo -e "DB Container:   ${GREEN}UP${NC}"
else
  echo -e "DB Container:   ${RED}DOWN${NC}"
fi

# ตรวจสอบ API endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null)
if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "API Endpoint:   ${GREEN}UP${NC} (HTTP $HTTP_STATUS)"
else
  echo -e "API Endpoint:   ${RED}DOWN${NC} (HTTP $HTTP_STATUS)"
fi

# ตรวจสอบ PostgreSQL readiness
if docker exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
  echo -e "PostgreSQL:     ${GREEN}READY${NC}"
else
  echo -e "PostgreSQL:     ${RED}NOT READY${NC}"
fi
