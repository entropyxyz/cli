import Entropy from "@entropyxyz/sdk"
import { Command, Option } from 'commander'
import { EntropyAccount } from "./main";
import { ACCOUNTS_CONTENT } from './constants'
import * as config from '../config'
import { cliWrite, currentAccountAddressOption, endpointOption, loadEntropy, passwordOption } from "../common/utils-cli";
import { getSelectedAccount, updateConfig } from "src/common/utils";

export function entropyAccountCommand () {
  const accountCommand = new Command('account')
    .description('Commands to work with accounts on the Entropy Network')
    .addCommand(entropyAccountCreate())
    .addCommand(entropyAccountImport())
    .addCommand(entropyAccountList())
    .addCommand(entropyAccountRegister())

  return accountCommand
}

function entropyAccountCreate () {
  const accountCreateCommand = new Command('create')
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

      await persistAndSelectNewAccount(newAccount)

      cliWrite({
        name: newAccount.name,
        address: newAccount.address
      })
      process.exit(0)
    })
  return accountCreateCommand
}

function entropyAccountImport () {
  const accountImportCommand = new Command('import')
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

      await persistAndSelectNewAccount(newAccount)

      cliWrite({
        name: newAccount.name,
        address: newAccount.address
      })
      process.exit(0)
    })
  return accountImportCommand
}

async function persistAndSelectNewAccount (newAccount) {
  const storedConfig = await config.get()
  const { accounts } = storedConfig

  const isExistingName = accounts.find(account => account.name === newAccount.name)
  if (isExistingName) {
    throw Error(`An account with name "${newAccount.name}" already exists. Choose a different name`)
  }

  accounts.push(newAccount) 
  await updateConfig(storedConfig, {
    accounts,
    selectedAccount: newAccount.address
  })
}

function entropyAccountList () {
  const accountListCommand = new Command('list')
    .alias('ls')
    .description('List all accounts. Output is JSON of form [{ name, address, verifyingKeys }]')
    .action(async () => {
      // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up
      const storedConfig = await config.get()
      const accounts = EntropyAccount.list(storedConfig)
      cliWrite(accounts)
      process.exit(0)
    })
  return accountListCommand
}

/* register */
function entropyAccountRegister () {
  const accountRegisterCommand = new Command('register')
  accountRegisterCommand
    .description('Register an entropy account with a program')
    .addOption(passwordOption())
    .addOption(endpointOption())
    .addOption(currentAccountAddressOption())
    .addOption(
      new Option(
        '-pointer, --pointer',
        'Program pointer of program to be used for registering'
      )
    )
    .addOption(
      new Option(
        '-data, --program-data',
        'Path to file containing program data in JSON format'
      )
    )
    .action(async (opts) => {
      const storedConfig = await config.get()
      const { accounts } = storedConfig
      const entropy = await loadEntropy(opts.account, opts.endpoint)
      const AccountsService = new EntropyAccount(entropy, opts.endpoint)
      cliWrite('Attempting to register account with addtess: ' + opts.account)
      const accountToRegister = getSelectedAccount(accounts, opts.account)
      if (!accountToRegister) {
        throw new Error('AccountError: Unable to register non-existent account')
      }
      const updatedAccount = await AccountsService.registerAccount(accountToRegister)
      const arrIdx = accounts.indexOf(accountToRegister)
      accounts.splice(arrIdx, 1, updatedAccount)
      await updateConfig(storedConfig, { accounts, selectedAccount: updatedAccount.address })
      cliWrite("Your address" + updatedAccount.address + "has been successfully registered.")
      process.exit(0)
    })
  return accountRegisterCommand
}
