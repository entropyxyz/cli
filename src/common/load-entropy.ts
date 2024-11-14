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

// TODO: we need must handle errors on loadEntropy everywhere...
// - could it be a generic function, tuned to each use case (premature optimization)
//   - handleLoadEntropyCLI
//   - handleLoadEntropyTUI
// - or different functions
//   function loadEntropyCLI (opts) {
//     return loadEntropy(opts)
//       .catch(err => {
//         process.exit(1)
//       })
//   }
//   - loadEntropyTUI
// - name / map all the different Errors?

export async function loadEntropy (opts: LoadEntropyOpts): Promise<Entropy> {
  const logger = new EntropyLogger('loadEntropy', opts.endpoint)

  const storedConfig = await config.get(opts.config)
  if (!storedConfig) throw Error('no config!!') // TEMP: want to see if we hit this!

  let account = parseAccountOption(storedConfig, opts.account)
  const endpoint = parseEndpointOption(storedConfig, opts.endpoint)

  account = await setupRegistrationSubAccount(account, opts.config)

  // Setup: selected account
  if (storedConfig.selectedAccount !== account.name) {
    await config.set(
      {
        ...storedConfig,
        selectedAccount: account.name
      },
      opts.config
    )
  }



  await wasmGlobalsReady()
  const keyring = await getKeyring(account, opts.config)
  logger.debug(keyring)

  const entropy = new Entropy({ keyring, endpoint })
  await entropy.ready

  if (!entropy?.keyring?.accounts?.registration?.seed) {
    throw new Error("Keys are undefined")
  }
  if (!entropy?.keyring?.accounts?.registration?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }

  return entropy

  // catch(err => {
  //   const logger = new EntropyLogger('initializeEntropy', opts.endpoint)

  //   logger.error('Error while initializing entropy', err)
  //   console.error(err.message)
  //   if (err.message.includes('TimeError')) {
  //     process.exit(1)
  //   }
  //   else throw err
  // })


  return entropy
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

function parseAccountOption (config: EntropyConfig, addressOrName?: string): EntropyConfigAccount|null {
  if (!config.accounts) throw Error('no accounts')

  const account = findAccountByAddressOrName(config.accounts, addressOrName)
  if (!account) {
    // there are accounts, but not match found
    print.error(`AccountError: No account with name or address "${addressOrName}"`)
    print(bold('!! Available accounts can be found using `entropy account list` !!'))
    process.exit(1)
  }

  assertAccountData(account.data)

  // there are accounts, we found a match
  return account
}

async function setupRegistrationSubAccount (account, configPath: string) {
  // TODO: move this to account create/import?
  if (account.data.registration) return account

  account.data.registration = account.data.admin
  account.data.registration.used = true // TODO: check if this is used

  const storedConfig = await config.get(configPath)
  storedConfig.accounts = storedConfig.accounts.map((account) => {
    if (account.address === account.admin.address) {
      return {
        ...account,
        data: account.data,
      }
    }
    return account
  })
  await config.set(storedConfig, configPath)

  return account
}



// Cache of keyrings
const keyrings = {
  default: undefined // this is the "selected account" keyring
}
async function getKeyring (account: EntropyConfigAccount, configPath: string) {
  const { address } =  account.data.admin || {}
  if (!address) throw new Error('Cannot load keyring, no admin address')

  let keyring = keyrings[address]
  if (!keyring) {
    keyring = new Keyring({ ...account.data, debug: true })

    // Setup: persistence of changes
    keyring.accounts.on('account-update', async (newAccountData) => {
      const storedConfig = await config.get(configPath)
      storedConfig.accounts = storedConfig.accounts.map((account) => {
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

    keyrings[keyring.getAccount().admin.address] = keyring
    // TODO: fix in sdk: admin should be on keyring.accounts by default
    // WANT: keyrings[keyring.admin.address] = keyring
  }

  return keyring
}

interface InitializeEntropyOpts {
  accountData: EntropyConfigAccountData,
  config: string,
  endpoint: string,
}

function assertAccountData (account: EntropyConfigAccountData) {
  if (!isEntropyAccountData(account)) {
    throw Error('Invalid account - must contain seed and admin')
  }
}

function isEntropyAccountData (maybeAccountData: any) {
  return (
    maybeAccountData &&
    typeof maybeAccountData === 'object' &&
    'seed' in maybeAccountData &&
    'admin' in maybeAccountData
  )
}
