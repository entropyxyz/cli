import { Command } from 'commander'

import { EntropyProgram } from './main'
import { accountOption, endpointOption, cliWrite, loadEntropy } from '../common/utils-cli'

export function entropyProgramCommand () {
  return new Command('program')
    .description('Commands for working with programs deployed to the Entropy Network')
    .addCommand(entropyProgramDeploy())
    // TODO:
    // .addCommand(entropyProgramGet())
    // .addCommand(entropyProgramListDeployed())
    // .addCommand(entropyProgramAdd())
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
      const entropy = await loadEntropy(opts.account, opts.endpoint)

      const program = new EntropyProgram(entropy, opts.endpoint)

      const pointer = await program.deploy({
        bytecodePath,
        configurationSchemaPath,
        auxillaryDataSchemaPath
      })
      cliWrite(pointer)

      process.exit(0)
    })
}
