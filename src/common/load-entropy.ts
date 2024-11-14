import { Entropy, wasmGlobalsReady } from "@entropyxyz/sdk"
// @ts-ignore
import { Keyring } from "@entropyxyz/sdk/keys"

import { findAccountByAddressOrName, print, bold } from './utils'
import * as config from '../config'
import { EntropyConfig, EntropyConfigAccount, EntropyConfigAccountData } from '../config/types'
import { EntropyLogger } from "./logger"

interface LoadEntropyOpts {
  account?: string, // may be empty
  config: string, // path to config file
  endpoint: string
}


// WIP
//
// Problem: tests needed "initializeEntropy"...
// this loadEntropy assumes an account has already been set up right
//
// Solution ideas:
// 1. perhaps just extract that for tests
//   - not great for proving it all works same as production?
//
// 2. provide "config" getter/setter as an argument for loadEntropy
//   - would still have to ensure config has account installed?
//
//   interface ConfigGetterSetter {
//     set: Function
//     get: Function
//   }
//
// 3. just use existing functions to write account into config in correct form?
//   - recurssive probelms for AccountService?


export async function loadEntropy (opts: LoadEntropyOpts): Promise<Entropy> {
  const logger = new EntropyLogger('loadEntropy', opts.endpoint)
  // TEMP: remove in subsequent PR
  if (!opts.config) {
    opts.config = config.CONFIG_PATH
  }

  const storedConfig = await config.get(opts.config)
  if (!storedConfig) throw Error('no config!!') // TEMP: want to see if we hit this!

  // Account
  let account = resolveAccount(storedConfig, opts.account || storedConfig.selectedAccount)
  account = await setupRegistrationSubAccount(account, opts.config) // TODO: remove this later
  assertAccountData(account.data)

  // Selected Account
  if (storedConfig.selectedAccount !== account.name) {
    await config.set(
      {
        ...storedConfig,
        selectedAccount: account.name
      },
      opts.config
    )
  }

  // Endpoint
  const endpoint = resolveEndpoint(storedConfig, opts.endpoint)

  // Keyring
  await wasmGlobalsReady()
  const keyring = await getKeyring(account, opts.config)
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

function resolveAccount (config: EntropyConfig, addressOrName: string): EntropyConfigAccount|null {
  if (!config.accounts) throw Error('no accounts')

  const account = findAccountByAddressOrName(config.accounts, addressOrName)
  if (!account) {
    // there are accounts, but not match found
    print(`AccountError: No account with name or address "${addressOrName}"`)
    print(bold('!! Available accounts can be found using `entropy account list` !!'))
    process.exit(1)
  }

  // there are accounts, we found a match
  return account
}

async function setupRegistrationSubAccount (account: EntropyConfigAccount, configPath: string) {
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

  const storedConfig = await config.get(configPath)
  // update that account => newAccount
  storedConfig.accounts = storedConfig.accounts.map((thisAccount) => {
    return (thisAccount.address === newAccount.address)
      ? newAccount
      : account
  })
  await config.set(storedConfig, configPath)

  return account
}

const keyringCache = {}
async function getKeyring (account: EntropyConfigAccount, configPath: string) {
  const { address } =  account.data.admin || {}
  if (!address) throw new Error('Cannot load keyring, no admin address')

  if (keyringCache[address]) return keyringCache[address]
  else {
    const keyring = new Keyring({ ...account.data, debug: true })

    // Set up persistence of changes
    keyring.accounts.on('account-update', async (newAccountData: EntropyConfigAccountData) => {
      // NOTE: this is vulnerable to concurrent writes => race conditions
      const storedConfig = await config.get(configPath)
      storedConfig.accounts = storedConfig.accounts.map((account: EntropyConfigAccount) => {
        if (account.address === storedConfig.selectedAccount) {
          return {
            ...account,
            data: newAccountData,
          }
        }
        return account
      })

      await config.set(storedConfig, configPath)
    })

    // cache
    keyringCache[address] = keyring

    return keyring
  }
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
