import { Command } from 'commander'

import { EntropyProgram } from './main'
import { accountOption, endpointOption, verifyingKeyOption, cliWrite, loadEntropy } from '../common/utils-cli'

async function programService (opts) {
  const entropy = await loadEntropy(opts.account, opts.endpoint)
  return new EntropyProgram(entropy, opts.endpoint)
}

export function entropyProgramCommand () {
  return new Command('program')
    .description('Commands for working with programs deployed to the Entropy Network')
    .addCommand(entropyProgramDeploy())
    .addCommand(entropyProgramGet())
    .addCommand(entropyProgramListDeployed())
    .addCommand(entropyProgramAdd())
    // .addCommand(entropyProgramRemove())
    // .addCommand(entropyProgramList())
}

function entropyProgramDeploy () {
  return new Command('deploy')
    .description([
      'Deploys a program to the Entropy network, returning a program pointer.',
      'Requires funds.'
    ].join(' '))
    .argument(
      '<bytecode>', 
      [
        'The path to your program bytecode.',
        'Must be a .wasm file.'
      ].join(' ')
    )
    .argument(
      '<configurationSchema>',
      [
        'The path to the JSON Schema for validating configurations passed in by users installing this program.',
        'Must be a .json file.'
      ].join(' ')
    )
    .argument(
      '<auxillaryDataSchema>',
      [
        'The path to the JSON Schema for validating auxillary data passed to the program on calls to "sign".',
        'Must be a .json file.'
      ].join(' ')
    )
    .addOption(accountOption())
    .addOption(endpointOption())

    .action(async (bytecodePath, configurationSchemaPath, auxillaryDataSchemaPath, opts) => { // eslint-disable-line
      const program = await programService(opts)

      const pointer = await program.deploy({
        bytecodePath,
        configurationSchemaPath,
        auxillaryDataSchemaPath
      })
      cliWrite(pointer)

      process.exit(0)
    })
}

function entropyProgramGet () {
  return new Command('get')
    .description('Get a program interface by it\'s pointer.')
    .argument('programPointer', 'The pointer for the program interface.')
    .addOption(accountOption())
    .addOption(endpointOption())

    .action(async (programPointer, opts) => { // eslint-disable-line
      const program = await programService(opts)

      const programInterface = await program.get(programPointer)
      cliWrite(programInterface)

      process.exit(0)
    })
}

function entropyProgramListDeployed () {
  // QUESTION - don't really like the camelCase here, what do we reckon?
  return new Command('listDeployed')
    .description('Get a list of all programs the current account has deployed')
    .addOption(accountOption())
    .addOption(endpointOption())

    .action(async (opts) => { // eslint-disable-line
      const program = await programService(opts)

      const list = await program.listDeployed()
      cliWrite(list)

      process.exit(0)
    })
}

function entropyProgramAdd () {
  return new Command('add')
    .description('Add a program to the current account')
    .argument('<programPointer>', 'The pointer for the program interface.')
    .argument('[programConfigPath]', 'The path to the config to apply to the program. Must be a .json file')
    .addOption(accountOption())
    .addOption(endpointOption())
    .addOption(verifyingKeyOption())

    .action(async (programPointer, programConfigPath, opts) => { // eslint-disable-line
      const program = await programService(opts)

      await program.add({
        programPointer,
        programConfigPath,
        verifyingKey: opts['verifying-key'] // WARNING: check this is working
      })

      process.exit(0)
    })
}

