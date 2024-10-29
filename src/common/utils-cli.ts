import Entropy from '@entropyxyz/sdk'
import { Option } from 'commander'
import { findAccountByAddressOrName, stringify } from './utils'
import * as config from '../config'
import { initializeEntropy } from './initializeEntropy'

const entropyPackage = require('../../package.json')

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

export function versionOption () {
  const { version } = entropyPackage

  return new Option(
    '-v, --version',
    'Displays the current running version of Entropy CLI'
  ).argParser(() => version)
}

export function coreVersionOption () {
  const coreVersion = process.env.ENTROPY_CORE_VERSION.split('-')[1]

  return new Option(
    '-cv, --core-version',
    'Displays the current running version of the Entropy Protocol'
  ).argParser(() => coreVersion)
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
    .default('wss://testnet.entropy.xyz/')
    // NOTE: default cannot be "test-net" as argParser only runs if the -e/--endpoint flag
    // or ENTROPY_ENDPOINT env set
}

export function tuiEndpointOption () {
  return new Option(
    '-et, --tui-endpoint <url>',
    [
      'Runs entropy with the given endpoint and ignores network endpoints in config.',
      'Can also be given a stored endpoint name from config eg: `entropy --endpoint test-net`.'
    ].join(' ')
  )
    .env('ENTROPY_TUI_ENDPOINT')
    .argParser(aliasOrEndpoint => {
      /* see if it's a raw endpoint */
      if (aliasOrEndpoint.match(/^wss?:\/\//)) return aliasOrEndpoint

      /* look up endpoint-alias */
      const storedConfig = getConfigOrNull()
      const endpoint = storedConfig?.endpoints?.[aliasOrEndpoint]
      if (!endpoint) throw Error('unknown endpoint alias: ' + aliasOrEndpoint)

      return endpoint
    })
    .default('wss://testnet.entropy.xyz/')
    // NOTE: default cannot be "test-net" as argParser only runs if the -e/--endpoint flag
    // or ENTROPY_ENDPOINT env set
}

export function accountOption () {
  const storedConfig = getConfigOrNull()

  return new Option(
    '-a, --account <name|address>',
    [
      'Sets the account for the session.',
      'Defaults to the last set account (or the first account if one has not been set before).'
    ].join(' ')
  )
    .env('ENTROPY_ACCOUNT')
    .argParser(addressOrName => {
      // We try to map addressOrName to an account we have stored
      if (!storedConfig) return addressOrName

      const account = findAccountByAddressOrName(storedConfig.accounts, addressOrName)
      if (!account) return addressOrName

      // If we find one, we set this account as the future default
      config.setSelectedAccount(account)
      // NOTE: argParser cannot be an async function, so we cannot await this call
      // WARNING: this will lead to a race-condition if functions are called in quick succession
      // and assume the selectedAccount has been persisted
      //
      // RISK: doesn't seem likely as most of our functions will await at slow other steps....
      // SOLUTION: write a scynchronous version?

      // We finally return the account name to be as consistent as possible (using name, not address)
      return account.name
    })
    .default(storedConfig?.selectedAccount)
}

export function verifyingKeyOption () {
  return new Option(
    '-vk, --verifying-key <key>',
    // WARNING: -vk seems to collide with -v (error: unknown option '-k')
    //
    // --verifying-key works though
    [
      'The verifying key to perform this function with.'
    ].join(' ')
  )
}

export function programModKeyOption () {
  return new Option(
    '-pmk, --program-mod-key <key>',
    [
      'The programModKey to perform this function with.'
    ].join(' ')
  )
}

export async function loadEntropy (addressOrName: string, endpoint: string): Promise<Entropy> {
  const accounts = getConfigOrNull()?.accounts || []
  const selectedAccount = findAccountByAddressOrName(accounts, addressOrName)
  if (!selectedAccount) throw new Error(`No account with name or address: "${addressOrName}"`)

  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint })

  if (!entropy?.keyring?.accounts?.registration?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }

  return entropy
}
