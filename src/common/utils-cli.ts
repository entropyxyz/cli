import { Option } from 'commander'
import { getSelectedAccount, stringify } from './utils'
import * as config from '../config'
import Entropy from '@entropyxyz/sdk'
import { initializeEntropy } from './initializeEntropy'

export function cliWrite (result) {
  const prettyResult = stringify(result, 0)
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
    '-a, --account <address>',
    'Sets the current account for the session or defaults to the account stored in the config'
  )
    .env('ACCOUNT_ADDRESS')
    .argParser(async (account) => {
      if (account === storedConfig.selectedAccount) return account
      // Updated selected account in config with new address from this option
      const newConfigUpdates = { selectedAccount: account }
      await config.set({ ...storedConfig, ...newConfigUpdates })

      return account
    })
    .hideHelp()
    .default(storedConfig.selectedAccount)
}

export async function loadEntropy (address: string, endpoint: string, password?: string): Promise<Entropy> {
  const storedConfig = config.getSync()
  const selectedAccount = getSelectedAccount(storedConfig.accounts, address)
  if (!selectedAccount) throw new Error(`AddressError: No account with name or address "${address}"`)

  // check if data is encrypted + we have a password
  if (typeof selectedAccount.data === 'string' && !password) {
    throw new Error('AuthError: This account requires a password, add --password <password>')
  }

  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint, password })
  if (!entropy?.keyring?.accounts?.registration?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }

  return entropy
}
