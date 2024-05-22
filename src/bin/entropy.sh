#! /usr/bin/env bash

# NOTE: this is a flag for @polkadot/util to quieten down about
# CJS + ESM of same version being present
# TODO: take this out after we start building CLI
export POLKADOTJS_DISABLE_ESM_CJS_WARNING=1

npx ts-node ./src/entropy.ts $@
