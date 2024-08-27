import { Option } from 'commander'
import { stringify } from './utils'
import * as config from '../config'

export function cliWrite (result) {
  const prettyResult = stringify(result)
  process.stdout.write(prettyResult)
}


export function endpointOption () {
  return new Option(
    '-e, --endpoint <endpoint>',
    [
      'Runs entropy with the given endpoint and ignores network endpoints in config.',
      'Can also be given a stored endpoint name from config eg: `entropy --endpoint test-net`.'
    ].join(' ')
  )
    .env('ENDPOINT')
    .argParser(aliasOrEndpoint => {
      /* see if it's a raw endpoint */
      if (aliasOrEndpoint.match(/^wss?:\/\//)) return aliasOrEndpoint

      /* look up endpoint-alias */
      const storedConfig = config.getSync()
      const endpoint = storedConfig.endpoints[aliasOrEndpoint]
      if (!endpoint) throw Error('unknown endpoint alias: ' + aliasOrEndpoint)

      return endpoint
    })
    .default('ws://testnet.entropy.xyz:9944/')
    // NOTE: argParser is only run IF an option is provided, so this cannot be 'test-net'
}

export function passwordOption (description?: string) {
  return new Option(
    '-p, --password <password>',
    description || 'Password for the account'
  )
}

export function currentAccountAddressOption () {
  const storedConfig = config.getSync()
  return new Option(
    '-a, --account <accountAddressOrAlias>',
    'Sets the current account for the session and sets the default account for all future calls'
  )
    .env('ACCOUNT_ADDRESS')
    .argParser(async (address) => {
      if (address === storedConfig.selectedAccount) return address
      // Updated selected account in config with new address from this option
      const newConfigUpdates = { selectedAccount: address }
      await config.set({ ...storedConfig, ...newConfigUpdates })

      return address
    })
    .hideHelp()
    .default(storedConfig.selectedAccount)
}
