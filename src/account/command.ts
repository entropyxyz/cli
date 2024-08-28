import Entropy from "@entropyxyz/sdk";
import { Command, Option } from 'commander'
import { EntropyAccount } from "./main";
import { ACCOUNTS_CONTENT } from './constants'
import * as config from '../config'
import { cliWrite, endpointOption, passwordOption } from "../common/utils-cli";

export async function entropyAccountCommand (entropy: Entropy, rootCommand: Command) {
  const accountCommand = rootCommand.command('account')
    .description('Commands to work with accounts on the Entropy Network')

  entropyAccountList(entropy, accountCommand)
  entropyAccountNew(entropy, accountCommand)
}

function entropyAccountNew (entropy: Entropy, accountCommand: Command) {
  accountCommand.command('create')
    .alias('new')
    .description('Create a new entropy account from scratch. Output is JSON of form {name, address}')
    .addOption(endpointOption())
    .addOption(passwordOption())
    .argument('<name>', 'A user friendly name for your nem account.')
    .addOption(
      new Option(
        '-p, --path',
        'Derivation path'
      ).default(ACCOUNTS_CONTENT.path.default)
    )
    .action(async (name, opts) => {
      const { endpoint, path } = opts

      const service = new EntropyAccount(entropy, endpoint)
      const newAccount = await service.create({
        name,
        path
      })

      const storedConfig = await config.get()
      // WIP - sort out the updateConfig stuff
      await service.updateConfig(storedConfig, newAccount)

      cliWrite({
        name: newAccount.name,
        address: newAccount.address
      })
      process.exit(0)
    })

}

function entropyAccountList (entropy: Entropy, accountCommand: Command) {
  accountCommand.command('list')
    .alias('ls')
    .description('List all accounts. Output is JSON of form [{ name, address, verifyingKeys }]')
    .addOption(endpointOption())
    .action(async (options) => {
      // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up
      const storedConfig = await config.get()
      const service = new EntropyAccount(entropy, options.endpoint)
      const accounts = service.list(storedConfig.accounts)
      cliWrite(accounts)
      process.exit(0)
    })
}
