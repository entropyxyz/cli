#! /usr/bin/env bash

source ./node_modules/@entropyxyz/sdk/dev/bin/ENTROPY_CORE_VERSION.sh
echo version:
echo $ENTROPY_CORE_VERSION
export ENTROPY_CORE_VERSION=$ENTROPY_CORE_VERSION
tsup --env.ENTROPY_CORE_VERSION $ENTROPY_CORE_VERSION