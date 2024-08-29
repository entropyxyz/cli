import Entropy from "@entropyxyz/sdk"
import { Command, Option } from 'commander'
import { EntropyAccount } from "./main";
import { ACCOUNTS_CONTENT } from './constants'
import * as config from '../config'
import { cliWrite, passwordOption } from "../common/utils-cli";
import { updateConfig } from "src/common/utils";

export async function entropyAccountCommand (entropy: Entropy, rootCommand: Command) {
  const accountCommand = rootCommand.command('account')
    .description('Commands to work with accounts on the Entropy Network')

  entropyAccountCreate(accountCommand)
  entropyAccountImport(accountCommand)
  entropyAccountList(accountCommand)
}

function entropyAccountCreate (accountCommand: Command) {
  accountCommand.command('create')
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
}

function entropyAccountImport (accountCommand: Command) {
  accountCommand.command('import')
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

function entropyAccountList (accountCommand: Command) {
  accountCommand.command('list')
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
// program.command('register')
//   .description('Register an entropy account with a program')
//   .argument('address', 'Address of existing entropy account')
//   .addOption(passwordOption())
//   .addOption(endpointOption())
//   .addOption(
//     new Option(
//       '-pointer, --pointer',
//       'Program pointer of program to be used for registering'
//     )
//   )
//   .addOption(
//     new Option(
//       '-data, --program-data',
//       'Path to file containing program data in JSON format'
//     )
//   )
//   .action(async (address, opts) => {
//     const storedConfig = await config.get()
//     const { accounts } = storedConfig
//     const accountsCommand = new EntropyAccount(entropy, opts.endpoint)
//     writeOut('Attempting to register account with addtess: ' + address)
//     const accountToRegister = getSelectedAccount(accounts, address)
//     if (!accountToRegister) {
//       throw new Error('AccountError: Unable to register non-existent account')
//     }
//     const updatedAccount = await accountsCommand.registerAccount(accountToRegister)
//     const arrIdx = accounts.indexOf(accountToRegister)
//     accounts.splice(arrIdx, 1, updatedAccount)
//     await updateConfig(storedConfig, { accounts, selectedAccount: updatedAccount.address })
//     writeOut("Your address" + updatedAccount.address + "has been successfully registered.")
//     process.exit(0)
//   })
