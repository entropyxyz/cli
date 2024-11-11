#!/bin/bash

# For local tests to work, we need to have aliases set up to point to 127.0.0.1
# see: dev/README.md

ALIASES=(
  "alice-tss-server"
  "bob-tss-server"
  "charlie-tss-server"
  "dave-tss-server"
)
EXPECTED_IP="127.0.0.1"  # IP for localhost
ERROR=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

printf "
  \e[4m/etc/hosts\e[0m

"

# Check each alias
for ALIAS in "${ALIASES[@]}"; do
  resolved_ip=$(grep "$ALIAS" /etc/hosts | awk '{ print $1 }')

  if [ "$resolved_ip" == "$EXPECTED_IP" ]; then
    printf "   ${GREEN}✓${NC} ${ALIAS}\n"
  else
    printf "   ${RED}✗ ${ALIAS}${NC} is NOT aliased to localhost.\n"
    ERROR=1
  fi
done

echo ''

# Exit with an error code if any alias is incorrect
if [ $ERROR -ne 0 ]; then
    exit 1
fi
