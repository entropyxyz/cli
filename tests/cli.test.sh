#! /usr/bin/bash

ENTROPY_ENDPOINT=ws://127.0.0.1:9944

rm ~/.config/entropy-cryptography/entropy-cli.json
# backup config
# mv ~/.config/entropy-cryptography/entropy-cli{.json,.backup.json}

print () {
  COLOR='\033[0;35m'
  RESET='\033[0m'
  echo ""
  echo -e "${COLOR}> $1${RESET}"
}

print "// ACCOUNT /////////////////////////////////////////////////"

# Errors (correct, but messy?)
# print "account ls:"
# entropy account ls | jq

print "account create"
entropy account create naynay | jq

print "account import"
entropy account import faucet 0x358f394d157e31be23313a1500f5e2c8871e514e530a35aa5c05334be7a39ba6 | jq

print "account list"
entropy account list | jq



print "// BALANCE ///////////////////////////////////////////////// "

print "balance naynay"
entropy balance naynay

print "balance 5CqJyjALDFz4sKjQgK8NXBQGHCWAiV63xXn2Dye393Y6Vghz"
# entropy balance faucet
entropy balance 5CqJyjALDFz4sKjQgK8NXBQGHCWAiV63xXn2Dye393Y6Vghz



print "// TRANSFER ////////////////////////////////////////////////"

print "entropy transfer"
NAYNAY_ADDRESS=`entropy account ls | jq --raw-output ".[0].address"`
# NOTE: --raw-output is needed to drop the quotes
entropy transfer -a faucet ${NAYNAY_ADDRESS} 2.5
entropy balance naynay

# restore config
# mv ~/.config/entropy-cryptography/entropy-cli{.backup.json,.json}
