import { Command } from 'commander'

import { currentAccountAddressOption, endpointOption, cliWrite, loadEntropy } from '../common/utils-cli'
import { deployProgram } from '../flows/programs/deploy'

export function entropyProgramCommand () {
  return new Command('program')
    .description('Commands for working with programs deployed to the Entropy Network')
    .addCommand(entropyProgramDeploy())
    // .addCommand(entropyProgramGet())
    // .addCommand(entropyProgramRemove())
}

function entropyProgramDeploy () {
  return new Command('deploy')
    .description([
      'Deploys a program to the Entropy network.',
      'Requires funds.'
    ].join(' '))
    .argument(
      'bytecode', 
      [
        'The path to your program bytecode.',
        'Must be a .wasm file.'
      ].join(' ')
    )
    .argument(
      'configurationSchema',
      [
        'The path to the JSON Schema for validating configurations passed in by users installing this program.',
        'Must be a .json file.'
      ].join(' ')
    )
    .argument(
      'auxillaryDataSchema',
      [
        'The path to the JSON Schema for validating auxillary data passed to the program on calls to "sign".',
        'Must be a .json file.'
      ].join(' ')
    )
    .addOption(currentAccountAddressOption())
    .addOption(endpointOption())

    .action(async (bytecodePath, configurationSchemaPath, auxillaryDataSchemaPath, opts) => { // eslint-disable-line
      const entropy = await loadEntropy(opts.account, opts.endpoint)

      const pointer = await deployProgram(entropy, {
        bytecodePath,
        configurationSchemaPath,
        auxillaryDataSchemaPath
      })
      cliWrite(pointer)

      process.exit(0)
    })
}
