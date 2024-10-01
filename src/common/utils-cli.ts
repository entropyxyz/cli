import Entropy from '@entropyxyz/sdk'
import { Option } from 'commander'
import { findAccountByAddressOrName, stringify } from './utils'
import * as config from '../config'
import { initializeEntropy } from './initializeEntropy'

export function cliWrite (result) {
  const prettyResult = stringify(result, 0)
  process.stdout.write(prettyResult)
}

function getConfigOrNull () {
  try {
    return config.getSync()
  } catch (err) {
    if (config.isDangerousReadError(err)) throw err
    return null
  }
}

export function endpointOption () {
  return new Option(
    '-e, --endpoint <url>',
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
      const storedConfig = getConfigOrNull()
      const endpoint = storedConfig?.endpoints?.[aliasOrEndpoint]
      if (!endpoint) throw Error('unknown endpoint alias: ' + aliasOrEndpoint)

      return endpoint
    })
    .default('ws://testnet.entropy.xyz:9944/')
    // NOTE: argParser only runs IF the -e/--endpoint option called, so this default cannot be 'test-net'
}

export function passwordOption (description?: string) {
  return new Option(
    '-p, --password',
    description || 'Password for the account'
  )
    .hideHelp() // TEMP
}

export function accountOption () {
  const storedConfig = getConfigOrNull()

  return new Option(
    '-a, --account <address|name>',
    [
      'Sets the account for the session.',
      'Defaults to the last set account (or the first account if one has not been set before).'
    ].join(' ')
  )
    .env('ENTROPY_ACCOUNT')
    .argParser(async (addressOrName) => {
      // We try to map addressOrName to an account we have stored
      if (!storedConfig) return addressOrName

      const account = findAccountByAddressOrName(storedConfig.accounts, addressOrName)
      if (!account) return addressOrName

      // If we find one, we set this account as the future default
      await config.setSelectedAccount(account)

      // We finally return the account name to be as consistent as possible (using name, not address)
      return account.name
    })
    .default(storedConfig?.selectedAccount)
}

export async function loadEntropy (addressOrName: string, endpoint: string, password?: string): Promise<Entropy> {
  const accounts = getConfigOrNull()?.accounts || []
  const selectedAccount = findAccountByAddressOrName(accounts, addressOrName)
  if (!selectedAccount) throw new Error(`No account with name or address: "${addressOrName}"`)

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
