/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import { EntropyTuiOptions } from './types'

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
  .description('get the balance of Entropy account(s)')
  .argument('[account]', 'account to print balance for, if not provided, prints balance of all accounts')
  .option('--password', 'password for the account')
  // QUESTION: are passwords for whole account or just some .... account keys?
  // QUESTION: what happens if opts.password is set when there is no account provided?
  .addOption(endpointOption)
  .action((account, options) => {
    // WIP here
    console.log('account:', account)
    console.log('options:', options)
    if (account) {
      console.log(5)
    }
    else {
      console.log(JSON.stringify({
        mix: 5,
        frankie: 100_000,
        naynay: -1
      }))
    }
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


program.parse()
