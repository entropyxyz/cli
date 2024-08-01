import { Command } from 'commander'
import { aliasOrAddressOption, cliWrite, endpointOption } from '../util'
import { initializeEntropy } from "../../common/initializeEntropy"
import { getSelectedAccount } from "../../common/utils"
import * as config from "../../config"

import { deployProgram } from '../../flows/programs/deploy'

async function getEntropy ({ address, endpoint }) {
  const storedConfig = await config.get()
  const selectedAccount = getSelectedAccount(storedConfig.accounts, address)

  return initializeEntropy({
    keyMaterial: selectedAccount.data,
    endpoint
  })
}

export function entropyProgram (rootCommand: Command) {
  const programCommand = rootCommand.command('program')
    .description('Commands for working with programs deployed to the Entropy Network')

  entropyProgramDeploy(programCommand)
  // entropyProgramGet(program)
  // entropyProgramRemove(program)
}

function entropyProgramDeploy (programCommand: Command) {
  programCommand.command('deploy')
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
    .addOption(aliasOrAddressOption())
    .addOption(endpointOption())

    .action(async (bytecodePath, configurationSchemaPath, auxillaryDataSchemaPath, opts) => {
      const entropy = await getEntropy(opts)

      const pointer = await deployProgram(entropy, {
        bytecodePath,
        configurationSchemaPath,
        auxillaryDataSchemaPath
      })
      cliWrite(pointer)

      process.exit(0)
    })
}
