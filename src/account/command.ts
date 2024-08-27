import Entropy from "@entropyxyz/sdk";
import { Command, Option } from 'commander'
import { randomAsHex } from '@polkadot/util-crypto'
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

function entropyAccountList (entropy: Entropy, accountCommand: Command) {
  accountCommand.command('list')
    .alias('ls')
    .description('List all accounts. Output is JSON of form [{ name, address, verifyingKeys }]')
    .addOption(endpointOption())
    .action(async (options) => {
      // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up
      const storedConfig = await config.get()
      const accountsCommand = new EntropyAccount(entropy, options.endpoint)
      const accounts = accountsCommand.listAccounts(storedConfig.accounts)
      cliWrite(accounts)
      process.exit(0)
    })
}

function entropyAccountNew (entropy: Entropy, accountCommand: Command) {
  accountCommand.command('new')
    .alias('new-account')
    .alias('create')
    .description('Create new entropy account from imported seed or from scratch. Output is JSON of form [{name, address}]')
    .addOption(endpointOption())
    .addOption(passwordOption())
    .addOption(
      new Option(
        '-s, --seed',
        'Seed used to create entropy account'
      ).default(randomAsHex(32))
    )
    .addOption(
      new Option(
        '-n, --name',
        'Name of entropy account'
      ).makeOptionMandatory(true)
    )
    .addOption(
      new Option(
        '-pa, --path',
        'Derivation path'
      ).default(ACCOUNTS_CONTENT.path.default)
    )
    .action(async (opts) => {
      const storedConfig = await config.get()
      const { seed, name, path, endpoint } = opts
      const accountsCommand = new EntropyAccount(entropy, endpoint)

      const newAccount = await accountsCommand.newAccount({ seed, name, path })
      await accountsCommand.updateConfig(storedConfig, newAccount)
      cliWrite({ name: newAccount.name, address: newAccount.address })
      process.exit(0)
    })

}
