import Entropy from "@entropyxyz/sdk"
import { Command, Option } from 'commander'
import { EntropyAccount } from "./main";
import { selectAndPersistNewAccount } from "./utils";
import { ACCOUNTS_CONTENT } from './constants'
import * as config from '../config'
import { cliWrite, currentAccountAddressOption, endpointOption, loadEntropy, passwordOption } from "../common/utils-cli";
import { findAccountByAddressOrName } from "src/common/utils";

export function entropyAccountCommand () {
  return new Command('account')
    .description('Commands to work with accounts on the Entropy Network')
    .addCommand(entropyAccountCreate())
    .addCommand(entropyAccountImport())
    .addCommand(entropyAccountList())
    .addCommand(entropyAccountRegister())
}

function entropyAccountCreate () {
  return new Command('create')
    .alias('new')
    .description('Create a new entropy account from scratch. Output is JSON of form {name, address}')
    .addOption(passwordOption())
    .argument('<name>', 'A user friendly name for your new account.')
    .addOption(
      new Option(
        '--path',
        'Derivation path'
      ).default(ACCOUNTS_CONTENT.path.default)
    )
    .action(async (name, opts) => {
      const { path } = opts
      const newAccount = await EntropyAccount.create({ name, path })

      await selectAndPersistNewAccount(newAccount)

      cliWrite({
        name: newAccount.name,
        address: newAccount.address
      })
      process.exit(0)
    })
}

function entropyAccountImport () {
  return new Command('import')
    .description('Import an existing entropy account from seed. Output is JSON of form {name, address}')
    .addOption(passwordOption())
    .argument('<name>', 'A user friendly name for your new account.')
    .argument('<seed>', 'The seed for the account you are importing')
    .addOption(
      new Option(
        '--path',
        'Derivation path'
      ).default(ACCOUNTS_CONTENT.path.default)
    )
    .action(async (name, seed, opts) => {
      const { path } = opts
      const newAccount = await EntropyAccount.import({ name, seed, path })

      await selectAndPersistNewAccount(newAccount)

      cliWrite({
        name: newAccount.name,
        address: newAccount.address
      })
      process.exit(0)
    })
}

function entropyAccountList () {
  return new Command('list')
    .alias('ls')
    .description('List all accounts. Output is JSON of form [{ name, address, verifyingKeys }]')
    .action(async () => {
      // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up
      const storedConfig = await config.get()
      const accounts = EntropyAccount.list(storedConfig)
      cliWrite(accounts)
      process.exit(0)
    })
}

/* register */
function entropyAccountRegister () {
  return new Command('register')
    .description('Register an entropy account with a program')
    .addOption(passwordOption())
    .addOption(endpointOption())
    .addOption(currentAccountAddressOption())
    // Removing these options for now until we update the design to accept program configs
    // .addOption(
    //   new Option(
    //     '-pointer, --pointer',
    //     'Program pointer of program to be used for registering'
    //   )
    // )
    // .addOption(
    //   new Option(
    //     '-data, --program-data',
    //     'Path to file containing program data in JSON format'
    //   )
    // )
    .action(async (opts) => {
      const { account, endpoint, /* password */ } = opts
      const storedConfig = await config.get()
      const { accounts } = storedConfig
      const accountToRegister = findAccountByAddressOrName(accounts, account)
      if (!accountToRegister) {
        throw new Error('AccountError: Unable to register non-existent account')
      }

      const entropy: Entropy = await loadEntropy(accountToRegister.address, endpoint)
      const accountService = new EntropyAccount(entropy, endpoint)
      const updatedAccount = await accountService.registerAccount(accountToRegister)

      const arrIdx = accounts.indexOf(accountToRegister)
      accounts.splice(arrIdx, 1, updatedAccount)
      await config.set({
        ...storedConfig,
        accounts,
        selectedAccount: updatedAccount.address
      })

      const verifyingKeys = updatedAccount?.data?.registration?.verifyingKeys
      const verifyingKey = verifyingKeys[verifyingKeys.length - 1]
      cliWrite(verifyingKey)
      process.exit(0)
    })
}
