import Entropy from '@entropyxyz/sdk'
import { Option } from 'commander'

import { absolutePath, bold, findAccountByAddressOrName, print, stringify } from './utils'
import { initializeEntropy } from './initializeEntropy'
import * as config from '../config'
import { EntropyConfig } from "../config/types";
import { ENTROPY_ENDPOINT_DEFAULT, ERROR_RED } from '../common/constants'

export function cliWrite (result) {
  const prettyResult = stringify(result, 0)
  process.stdout.write(prettyResult)
}

function getConfigOrNull (configPath) {
  try {
    return config.getSync(configPath)
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
    .default(ENTROPY_ENDPOINT_DEFAULT)
}

export function accountOption () {
  return new Option(
    '-a, --account <name|address>',
    [
      'Sets the account for the session.',
      'Defaults to the last set account (or the first account if one has not been set before).'
    ].join(' ')
  )
    .env('ENTROPY_ACCOUNT')
}

export function configOption () {
  return new Option(
    '-c, --config <path>',
    'Set the path to your Entropy config file (JSON).',
  )
    .env('ENTROPY_CONFIG')
    .argParser(configPath => {
      return absolutePath(configPath)
    })
    .default(config.CONFIG_PATH_DEFAULT)
}

export async function loadEntropy (opts: {
  account: string,
  config: string,
  endpoint: string,
}): Promise<Entropy> {
  const storedConfig = getConfigOrNull(opts.config)
  
  // NOTE: (mix) we expect config to be initialised (see hook in cli)
  // ...there was some reason we wanted to preserve a `null` state,
  // but I can't recall if it's still relevant, and we need to check
  // the downstream ramifications of it being `null`

  const account = parseAccountOption(storedConfig, opts.account)
  if (!account) return
  
  // if this account is not the default selectedAccount, make it so
  if (storedConfig.selectedAccount !== account?.name || storedConfig.selectedAccount !== account?.address) {
    await config.set(
      {
        ...storedConfig,
        selectedAccount: account.name
      },
      opts.config
    )
  }

  const endpoint = parseEndpointOption(storedConfig, opts.endpoint)

  const entropy = await initializeEntropy({ keyMaterial: account.data, endpoint })
  if (!entropy?.keyring?.accounts?.registration?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }

  return entropy
}

export function verifyingKeyOption () {
  return new Option(
    '-k, --verifying-key <key>',
    [
      'The verifying key to perform this function with.'
    ].join(' ')
  )
}

export function programModKeyOption () {
  return new Option(
    '-p, --program-mod-key <key>',
    [
      'The programModKey to perform this function with.'
    ].join(' ')
  )
}

function parseEndpointOption (config: EntropyConfig, aliasOrEndpoint: string) {
  // if raw endpoint
  if (aliasOrEndpoint.match(/^wss?:\/\//)) {
    return aliasOrEndpoint
  }
  // else an alias
  else {
    const endpoint = config.endpoints[aliasOrEndpoint]
    if (!endpoint) throw Error('unknown endpoint alias: ' + aliasOrEndpoint)

    return endpoint
  }
}

function parseAccountOption (config: EntropyConfig, addressOrName: string) {
  const accounts = config?.accounts || []
  const account = findAccountByAddressOrName(accounts, addressOrName)

  if (config.accounts.length && !account) {
    console.error(ERROR_RED + `AccountError: No account with name or address "${addressOrName}"`)
    print(bold('!! Available accounts can be found using `entropy account list` !!'))
    process.exit(1)
  } else if (!config.accounts.length && !account) {
    // console.error(ERROR_RED + 'AccountError: There are currently no accounts available to use')
    // print(bold("Please create a new account or import an existing account to continue."))
    return
  }

  return account
}

