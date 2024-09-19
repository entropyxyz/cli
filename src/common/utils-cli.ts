import Entropy from '@entropyxyz/sdk'
import { Option } from 'commander'
import { findAccountByAddressOrName, stringify } from './utils'
import * as config from '../config'
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
    .env('ENTROPY_ENDPOINT')
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

export function accountOption () {
  const storedConfig = config.getSync()

  return new Option(
    '-a, --account <accountAddressOrName>',
    [
      'Sets the account for the session.',
      'Defaults to the last set account (or the first account if one has not been set before).'
    ].join(' ')
  )
    .env('ENTROPY_ACCOUNT')
    .argParser(async (account) => {
      if (account === storedConfig.selectedAccount) return account
      // Updated selected account in config with new address from this option
      await config.set({
        ...storedConfig,
        selectedAccount: account
      })

      return account
    })
    .default(storedConfig.selectedAccount)
    // TODO: display the *name* not address
    // TODO: standardise whether selectedAccount is name or address.
}

export async function loadEntropy (addressOrName: string, endpoint: string, password?: string): Promise<Entropy> {
  const storedConfig = config.getSync()
  const selectedAccount = findAccountByAddressOrName(storedConfig.accounts, addressOrName)
  if (!selectedAccount) throw new Error(`AddressError: No account with name or address "${addressOrName}"`)

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
