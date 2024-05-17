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
  .default('ws://127.0.0.1:9944', 'local testing')
  .env('ENDPOINT')

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


program.command('balance')
  .description('get the balance of account(s)')
  .argument('[account]', 'account to print balance for')
  .addOption(endpointOption)
  // .option('--first', 'display just the first substring')
  // .option('-s, --separator <char>', 'separator character', ',')
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

program.parse()
