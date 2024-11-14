#! /usr/bin/bash

# WARNING - this script nukes your config!
#
# Dependencies
#   - internet connection
#   - jq - see https://jqlang.github.io/jq
#   - an entropy testnet:
#       ```
#       git clone git@github.com:entropyxyz/sdk.git
#       cd sdk
#       ./dev/bin/spin-up.sh four-nodes
#       ./dev/bin/spin-down.sh four-nodes  (later)
#       ````
#
# Build + isntall the CLI:
#   ```
#   yarn build
#   npm install -g
#   ```
#
# Run the tests:
#   ```
#   ./tests/e2e.cli.sh
#   ```
#

CURRENT_DATE=$(date +%s%N)
export ENTROPY_CONFIG="/tmp/entropy-cli-${CURRENT_DATE}.e2e.json"
export ENTROPY_ENDPOINT=dev

print () {
  COLOR='\033[0;35m'
  RESET='\033[0m'
  echo ""
  echo -e "${COLOR}> $1${RESET}"
}

print "Entropy Config:"
print $ENTROPY_CONFIG

print "// ACCOUNT /////////////////////////////////////////////////"

print "account ls"
entropy account ls | jq

print "account create"
entropy account create naynay | jq

print "account import"
entropy account import faucet 0x66256c4e2f90e273bf387923a9a7860f2e9f47a1848d6263de512f7fb110fc08 | jq

print "account list"
entropy account list | jq



print "// BALANCE ///////////////////////////////////////////////// "

print "balance (name)"
entropy balance naynay

print "balance (address)"
entropy balance 5Ck5SLSHYac6WFt5UZRSsdJjwmpSZq85fd5TRNAdZQVzEAPT



print "// TRANSFER ////////////////////////////////////////////////"

print "transfer"
NAYNAY_ADDRESS=`entropy account ls | jq --raw-output ".[0].address"`
entropy transfer -a faucet ${NAYNAY_ADDRESS} 2.5

print "balance"
entropy balance naynay



print "// REGISTER ////////////////////////////////////////////////"

print "register"
entropy account register -a naynay
# NOTE, this does not work:
# entropy account -a naynay register

print "account ls"
entropy account ls | jq

# print "entropy register (again)"
# entropy account register -a naynay



print "// SIGN ////////////////////////////////////////////////////"


print "entropy sign"
entropy sign -a naynay "some content!\nNICE&SIMPLE" | jq



print "// PROGRAM /////////////////////////////////////////////////"

print "program deploy"
echo "wasm junk - $(date)"  > /tmp/entropy.fake.wasm
echo '{"type": "object"}' > /tmp/entropy.configSchema.fake.json
echo '{"type": "object"}' > /tmp/entropy.auxDataSchema.fake.json
entropy program deploy -a naynay \
  /tmp/entropy.fake.wasm \
  /tmp/entropy.configSchema.fake.json \
  /tmp/entropy.auxDataSchema.fake.json
