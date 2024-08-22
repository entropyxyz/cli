import { Option } from 'commander'
import * as config from '../config'
import { stringify } from '../common/utils'

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
    '-a, --account <accountAddress>',
    'Sets the current account for the session or defaults to the account stored in the config'
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


export function aliasOrAddressOption () {
  return new Option(
    '-a, --address <aliasOrAddress>',
    'The alias or address of the verifying key to use for this command. Can be an alias or hex address.'
    // TODO: describe default behaviour when "sessions" are introduced?
  )
  // QUESTION: as this is a function, this could be a viable way to set the VK?
  // .default(process.env.ENTROPY_SESSION)
}

