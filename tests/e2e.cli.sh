#! /usr/bin/bash

# WARNING - this script nukes your config!
#
# Dependencies
#   - internet connection
#   - jq - see https://jqlang.github.io/jq
#
# Run
#   $ yarn build && ./tests/e2e.cli.sh

CURRENT_DATE=$(date +%s%N)
export ENTROPY_CONFIG="/tmp/entropy-cli-${CURRENT_DATE}.e2e.json"

print () {
  COLOR='\033[0;35m'
  RESET='\033[0m'
  echo ""
  echo -e "${COLOR}> $1${RESET}"
}

print "// ACCOUNT /////////////////////////////////////////////////"

print "account ls"
entropy account ls | jq

print "account create"
entropy account create naynay | jq

print "account import"
entropy account import faucet 0x358f394d157e31be23313a1500f5e2c8871e514e530a35aa5c05334be7a39ba6 | jq

print "account list"
entropy account list | jq



print "// BALANCE ///////////////////////////////////////////////// "

print "balance (name)"
entropy balance naynay

print "balance (address)"
entropy balance 5CqJyjALDFz4sKjQgK8NXBQGHCWAiV63xXn2Dye393Y6Vghz



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
entropy sign -a naynay "some content!\nNICE&SIMPLE"



print "// PROGRAM /////////////////////////////////////////////////"

print "program deploy"
echo "wasm junk - $(date)"  > /tmp/entropy.fake.wasm
echo '{"type": "object"}' > /tmp/entropy.configSchema.fake.json
echo '{"type": "object"}' > /tmp/entropy.auxDataSchema.fake.json
entropy program deploy -a naynay \
  /tmp/entropy.fake.wasm \
  /tmp/entropy.configSchema.fake.json \
  /tmp/entropy.auxDataSchema.fake.json
