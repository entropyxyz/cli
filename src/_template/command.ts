import { Command } from "commander"
import { EntropyDance } from "./main"
import { loadByteCode, loadDanceConfig } from "./utils"

import { accountOption, endpointOption, loadEntropy, cliWrite } from "../common/utils-cli"

/*
  This file is responsible for building up the commands related to our domain

  There is a single export, which will be registered in src/cli.ts
  This example has sub-commands (e.g. entropy dance learn), though not all do.

  The descriptions written here will be readable when users type e.g.
  - entropy --help
  - entropy dance --help
  - entropy dance learn --help


  ## References

  https://www.npmjs.com/package/commander


  ## This example

  We use the made-up domain "dance" so we will have names like
  - entropyDanceCommand
  - entropyDanceLearn (for command: `entropy dance learn`)

*/

export function entropyDanceCommand () {
  return new Command('dance')
    .description('Commands to query/ manipulate dances on the Entropy Network')
    .addCommand(entropyDanceLearn())
    .addCommand(entropyDanceAdd())
}


function entropyDanceLearn () {
  return new Command('learn')
    // description
    .description('Have the Entropy network learn a new dance function.')

    // arguments
    .argument('<byteCodePath>', 'the path to the bytecode being learnt')

    // options / flags
    .addOption(accountOption())
    .addOption(endpointOption())

    // what is run:
    .action(async (byteCodePath, opts) => {
      const danceMoveByteCode = await loadByteCode(byteCodePath)
      const dance = new EntropyDance(opts.account, opts.endpoint)

      const pointer = await dance.learn(danceMoveByteCode)

      // We write output simply so other programs can parse + consume output
      cliWrite(pointer)

      // NOTE: must exit the program!
      process.exit(0)
    })
}

function entropyDanceAdd () {
  return new Command('add')
    .description('Add a dance to your verifyingKey.')
    .argument('<verifyingKey>', 'verifiying key to add the dance to')
    .argument('<dancePointer>', 'pointer for the dance bytecode that is already learn')
    .argument('[danceConfigPath]', 'path to a config file for your dance') // optional
    .addOption(accountOption())
    .addOption(endpointOption())
    .action(async (verifyingKey, dancePionter, danceConfigPath, opts) => {
      const danceConfig = await loadDanceConfig(danceConfigPath)
      const dance = new EntropyDance(opts.account, opts.endpoint)

      await dance.add(verifyingKey, dancePionter, danceConfig)

      // NOTE: must exit the program!
      process.exit(0)
    })
}
