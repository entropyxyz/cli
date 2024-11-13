#! /usr/bin/env bash

source ./node_modules/@entropyxyz/sdk/dev/bin/ENTROPY_CORE_VERSION.sh
tsup --env.ENTROPY_CORE_VERSION $ENTROPY_CORE_VERSION

echo ''
