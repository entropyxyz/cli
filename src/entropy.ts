/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import { EntropyTuiOptions } from './types'

import { cliGetBalance } from './flows/balance/cli'
import { cliListAccounts } from './flows/manage-accounts/cli'
// import { debug } from './common/utils'

const { version } = require('../package.json')

const program = new Command()

const endpointOption = new Option(
  '-e, --endpoint <endpoint>',
  [
    'Runs entropy with the given endpoint and ignores network endpoints in config.',
    // 'Can also be given a stored endpoint name from config eg: `entropy --endpoint test-net`.'
    // TODO: enable this!
  ].join(' ')
)
  //
  .default('ws://127.0.0.1:9944')
  .env('ENDPOINT')

/* no command */
program
  .name('entropy')
  .description('CLI interface for interacting with entropy.xyz. Running without commands starts an interactive ui')
  .version(version)
  .addOption(endpointOption)
  .addOption(
    new Option(
      '-d, --dev',
      'Runs entropy in a developer mode uses the dev endpoint as the main endpoint and allows for faucet option to be available in the main menu'
    )
      .env('DEV_MODE')
      .hideHelp()
  )
  .action((options: EntropyTuiOptions) => {
    launchTui(options)
  })

/* list */
program.command('list')
  .alias('ls')
  .description('list all accounts. Output is JSON of form [{ name, address, data }]')
  // .addOption(endpointOption)
  .action(async () => {
    // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up

    const accounts = await cliListAccounts()
    writeOut(accounts)
    process.exit(0)
  })

/* balance */
program.command('balance')
  .description('get the balance of an Entropy account. Output is a number')
  .argument('account', 'account to print the balance of')
  // QUESTION: is account optional? (probably no, because each encrypted account requires a password)
  .option('-p, --password <password>', 'password for the account')
  .addOption(endpointOption)
  .action(async (account, opts) => {
    // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up

    const balance = await cliGetBalance(account, opts.password, opts.endpoint)
    writeOut(balance)
    process.exit(0)
  })

/* Transfer */
program.command('transfer')
  .description('transfer funds between two Entropy accounts')
  .argument('source', 'account which funds will be drawn from')
  .argument('destination', 'account which funds will be deposited to')
  .argument('amount', 'amount of funds to be moved')
  .addOption(endpointOption)
  .action((source, destination, amount, options) => {
    // WIP here
    console.log('source:', source)
    console.log('destination:', destination)
    console.log('amount:', amount)
    console.log('options:', options)
  })


function writeOut (result) {
  const prettyResult = typeof result === 'object'
    ? JSON.stringify(result, null, 2)
    : result
  process.stdout.write(prettyResult)
}

program.parse()
