import Entropy from "@entropyxyz/sdk"
import { Command, Option } from 'commander'
import { EntropyAccount } from "./main";
import { selectAndPersistNewAccount, addVerifyingKeyToAccountAndSelect } from "./utils";
import { ACCOUNTS_CONTENT } from './constants'
import * as config from '../config'
import { accountOption, configOption, endpointOption, cliWrite, loadEntropy } from "../common/utils-cli";

export function entropyAccountCommand () {
  return new Command('account')
    .description('Commands to work with accounts on the Entropy Network')
    .addCommand(entropyAccountCreate())
    .addCommand(entropyAccountImport())
    .addCommand(entropyAccountList())
    .addCommand(entropyAccountRegister())
    // .addCommand(entropyAccountAlias())
    // IDEA: support aliases for remote accounts (those we don't have seeds for)
    // this would make transfers safer/ easier from CLI
}

function entropyAccountCreate () {
  return new Command('create')
    .alias('new')
    .description('Create a new entropy account from scratch. Output is JSON of form {name, address}')
    .argument('<name>', 'A user friendly name for your new account.')
    .addOption(configOption())
    .addOption(
      new Option(
        '--path',
        'Derivation path'
      ).default(ACCOUNTS_CONTENT.path.default)
    )
    .action(async (name, opts) => {
      const { config: configPath, path } = opts
      const newAccount = await EntropyAccount.create({ name, path })

      await selectAndPersistNewAccount(configPath, newAccount)

      cliWrite({
        name: newAccount.name,
        address: newAccount.address,
        verifyingKeys: []
      })
      process.exit(0)
    })
}

function entropyAccountImport () {
  return new Command('import')
    .description('Import an existing entropy account from seed. Output is JSON of form {name, address}')
    .argument('<name>', 'A user friendly name for your new account.')
    .argument('<seed>', 'The seed for the account you are importing')
    .addOption(configOption())
    .addOption(
      new Option(
        '--path',
        'Derivation path'
      ).default(ACCOUNTS_CONTENT.path.default)
    )
    .action(async (name, seed, opts) => {
      const { config: configPath, path } = opts
      const newAccount = await EntropyAccount.import({ name, seed, path })

      await selectAndPersistNewAccount(configPath, newAccount)

      cliWrite({
        name: newAccount.name,
        address: newAccount.address,
        verifyingKeys: []
      })
      process.exit(0)
    })
}

function entropyAccountList () {
  return new Command('list')
    .alias('ls')
    .description('List all accounts. Output is JSON of form [{ name, address, verifyingKeys }]')
    .addOption(configOption())
    .action(async (opts) => {
      const accounts = await config.get(opts.config)
        .then(storedConfig => EntropyAccount.list(storedConfig))
        .catch((err) => {
          if (err.message.includes('currently no accounts')) return []

          throw err
        })

      cliWrite(accounts)
      process.exit(0)
    })
}

/* register */
function entropyAccountRegister () {
  return new Command('register')
    .description('Register an entropy account with a program')
    .addOption(accountOption())
    .addOption(configOption())
    .addOption(endpointOption())
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
      // NOTE: loadEntropy throws if it can't find opts.account
      const entropy: Entropy = await loadEntropy(opts)
      const accountService = new EntropyAccount(entropy, opts.endpoint)

      const verifyingKey = await accountService.register()
      await addVerifyingKeyToAccountAndSelect(opts.config, verifyingKey, opts.account)

      cliWrite(verifyingKey)
      process.exit(0)
    })
}
