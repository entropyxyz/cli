import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
// @ts-ignore
import { Keyring } from '@entropyxyz/sdk/keys'
import { promisify } from 'node:util'

import { findAccountByAddressOrName, print, bold } from './utils'
import { EntropyLogger } from './logger'
import * as fsConfig from '../config'
import { EntropyConfig, EntropyConfigAccount, EntropyConfigAccountData } from '../config/types'
import { migrateData } from '../config'
import { migrations } from '../config/migrations'

interface LoadEntropyCliOpts {
  account?: string // account address OR name
  endpoint: string
  config: string // configPath
}
export async function loadEntropyCli (opts: LoadEntropyCliOpts) {
  return loadEntropy({
    ...opts,
    config: {
      async get () {
        return fsConfig.get(opts.config)
      },
      async set (config: EntropyConfig) {
        return fsConfig.set(opts.config, config)
      }
    }
  })
    .catch(err => {
      console.error("Loading Entropy failed:")
      console.error(err)
      process.exit(1)
    })
}

interface LoadEntropyTuiOpts {
  account?: string // account address OR name
  endpoint: string
  config: string // configPath
}
export async function loadEntropyTui (opts: LoadEntropyTuiOpts) {
  return loadEntropy({
    ...opts,
    config: {
      async get () {
        return fsConfig.get(opts.config)
      },
      async set (config: EntropyConfig) {
        return fsConfig.set(opts.config, config)
      }
    }
  })
    .catch(err => {
      console.error(`Loading Entropy account "${opts.account}" failed:`)
      console.error(err)
      // NOTE: deliberately does not exit process
      // TODO: decide how to handle error...
      throw err
    })
}

interface LoadEntropyTestOpts {
  endpoint: string
  seed: string
}
export async function loadEntropyTest (opts: LoadEntropyTestOpts) {
  // set up initial state
  let config = migrateData(migrations, {})

  const keyring = new Keyring({ seed: opts.seed, debug: true })
  const account = keyring.getAccount()

  const accountName = 'test-account'
  config.accounts.push({
    name: accountName,
    address: account.admin.address,
    data: account
  })
  config.selectedAccount = accountName

  return loadEntropy({
    account: accountName,
    ...opts,
    config: {
      async get () {
        await shortTimeout()
        return config
      },
      async set (newConfig: EntropyConfig) {
        config = newConfig
        await shortTimeout()
      }
    }
  })
}
async function shortTimeout (scale = 100) {
  return promisify(setTimeout)(10 + Math.floor(scale * Math.random()))
}

/* INTERNALS */

interface LoadEntropyOpts {
  account?: string
  endpoint: string
  config: ConfigGetterSetter
}
interface ConfigGetterSetter {
  get: () => Promise<EntropyConfig>
  set: (config: EntropyConfig) => Promise<void>
}

// This expects a config getter/setter, and just throws errors it hits
// Higher level functions are expected to define getter/setter and error handling
// DO NOT EXPORT
async function loadEntropy (opts: LoadEntropyOpts): Promise<Entropy> {
  const storedConfig = await opts.config.get()
  if (!storedConfig) throw Error('no config!!') // TEMP: want to see if we hit this!

  let account = resolveAccount(storedConfig, opts.account || storedConfig.selectedAccount)
  const endpoint = resolveEndpoint(storedConfig, opts.endpoint)
  // NOTE: while it would be nice to parse opts --account, --endpoint with Commander
  // the argParser for these Options does not have access to the --config option,
  // and we need the config to be able to resolve what these other options mean.
  // This means we are forces to resolveAccount, resolveEndpoint in this function

  // Account setup
  account = await setupRegistrationSubAccount(account, opts.config)
  // TODO: remove the need for setupRegistrationAccount
  assertAccountData(account.data)
  // TODO: move into resolveAccount after setupRegistrationSubAccount is removed

  // set selectedAccount
  if (storedConfig.selectedAccount !== account.name) {
    await opts.config.set({
      ...storedConfig,
      selectedAccount: account.name
    })
  }

  const logger = new EntropyLogger('loadEntropy', endpoint)

  // Keyring
  await wasmGlobalsReady()
  const keyring = await loadKeyring(account)
  logger.debug(keyring)

  // Entropy
  const entropy = new Entropy({ keyring, endpoint })
  await entropy.ready

  return entropy
}

function resolveEndpoint (config: EntropyConfig, aliasOrEndpoint: string) {
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

function resolveAccount (config: EntropyConfig, addressOrName: string): EntropyConfigAccount {
  if (!config.accounts) throw Error('no accounts')

  const account = findAccountByAddressOrName(config.accounts, addressOrName)
  if (!account) {
    // there are accounts, but not match found
    const msg = `AccountError: No account with name or address "${addressOrName}"`
    // TODO: move printing out to loadEntropyCli, loadEntropyTui
    // could bolt hint on to error: error.hint = "Available acounts..."
    print.error(msg)
    print(bold('!! Available accounts can be found using `entropy account list` !!'))
    throw Error(msg)
  }

  // there are accounts, we found a match
  return account
}

async function setupRegistrationSubAccount (account: EntropyConfigAccount, config: ConfigGetterSetter) {
  if (account.data.registration) return account

  const newAccount = {
    ...account,
    data: {
      ...account.data,
      registration: {
        ...account.data.admin,
        used: true // TODO: check if this is used
      }
    }
  }

  const storedConfig = await config.get()
  // update that account => newAccount
  storedConfig.accounts = storedConfig.accounts.map((thisAccount) => {
    return (thisAccount.address === newAccount.address)
      ? newAccount
      : account
  })
  await config.set(storedConfig)

  return account
}

const keyringCache = {}
export async function loadKeyring (account: EntropyConfigAccount) {
  const { address } =  account.data.admin || {}
  if (!address) throw new Error('Cannot load keyring, no admin address')

  if (!keyringCache[address]) {
    keyringCache[address] = new Keyring({ ...account.data, debug: true })
  }

  return keyringCache[address]
}

// TODO: replace with JSON schema
function assertAccountData (data: EntropyConfigAccountData) {
  if (isEntropyAccountData(data)) return

  if (!data?.registration?.seed) {
    throw new Error("Registration seed undefined.")
  }
  // @ts-ignore  QUESTION: why is "pair" not on EntropyAccount
  if (!data?.registration?.pair) {
    throw new Error("Registration Signer keypair is undefined.")
  }

  throw Error('Invalid account data - must contain keys seed, admin, registration')
}

function isEntropyAccountData (maybeAccountData: any) {
  return (
    maybeAccountData &&
    typeof maybeAccountData === 'object' &&
    'seed' in maybeAccountData &&
    'admin' in maybeAccountData &&
    'registration' in maybeAccountData
  )
}
