/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import { EntropyTuiOptions } from './types'

import getBalance from './flows/balance/cli'
import { debug } from './common/utils'

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

/* No Command */
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


/* Balance */
program.command('balance')
  .description('get the balance of an Entropy account')
  .argument('account', 'account to print the balance of')
  // QUESTION: is account optional? (probably no, because each encrypted account requires a password)
  .option('--password', 'password for the account')
  .addOption(endpointOption)
  .action(async (account, opts) => {
    // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up

    debug('account:', account)
    debug('options:', opts)
    const balance = await getBalance(account, opts.password, opts.endpoint)
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
  process.stdout.write(result)
}

program.parse()
