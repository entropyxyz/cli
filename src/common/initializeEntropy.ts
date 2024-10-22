import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import * as config from "../config"
import { EntropyAccountData } from "../config/types"
import { EntropyLogger } from "./logger"

// TODO: unused
// let defaultAccount // have a main account to use
// let entropys 

// a cache of keyrings
const keyrings = {
  default: undefined // this is the "selected account" keyring
}

export function getKeyring (address?: string) {
  
  if (!address && keyrings.default) return keyrings.default
  if (address && keyrings[address]) return keyrings[address]
  // explicitly return undefined so there is no confusion around what is selected
  return undefined
}

interface InitializeEntropyOpts {
  keyMaterial: MaybeKeyMaterial,
  endpoint: string,
  configPath?: string // for testing
}
type MaybeKeyMaterial = EntropyAccountData | string

// WARNING: in programatic cli mode this function should NEVER prompt users

export const initializeEntropy = async ({ keyMaterial, endpoint, configPath }: InitializeEntropyOpts): Promise<Entropy> => {
  const logger = new EntropyLogger('initializeEntropy', endpoint)
  try {
    await wasmGlobalsReady()

    const { accountData } = await getAccountData(keyMaterial)
    // check if there is no admin account and no seed so that we can throw an error
    if (!accountData.seed && !accountData.admin) {
      throw new Error("Data format is not recognized as either encrypted or unencrypted")
    }

    if (accountData && accountData.admin && !accountData.registration) {
      accountData.registration = accountData.admin
      accountData.registration.used = true // TODO: is this even used?
      const store = await config.get(configPath)
      store.accounts = store.accounts.map((account) => {
        if (account.address === accountData.admin.address) {
          account = {
            ...account,
            data: accountData,
          }
        }
        return account
      })
      // re save the entire config
      await config.set(store, configPath)
    }

    let selectedAccount
    const storedKeyring = getKeyring(accountData.admin.address)

    if(!storedKeyring) {
      const keyring = new Keyring({ ...accountData, debug: true })
      keyring.accounts.on('account-update', async (newAccountData) => {
        console.log('Has been called...');
        console.log('new data', newAccountData);
        console.log('config path', configPath);
        
        const store = await config.get(configPath)
        store.accounts = store.accounts.map((account) => {
          if (account.address === store.selectedAccount) {
            const newAccount = {
              ...account,
              data: newAccountData,
            }
            return newAccount
          }
          return account
        })

        // re save the entire config
        await config.set(store, configPath)

      })
      keyrings.default = keyring
      logger.debug(keyring)

      // TO-DO: fix in sdk: admin should be on kering.accounts by default
      // /*WANT*/ keyrings[keyring.admin.address] = keyring
      keyrings[keyring.getAccount().admin.address] = keyring
      selectedAccount = keyring
    } else {
      keyrings.default = storedKeyring
      selectedAccount = storedKeyring
    }

    const entropy = new Entropy({ keyring: selectedAccount, endpoint })
    await entropy.ready
    
    if (!entropy?.keyring?.accounts?.registration?.seed) {
      throw new Error("Keys are undefined")
    }
    
    return entropy
  } catch (error) {
    logger.error('Error while initializing entropy', error)
    console.error(error.message)
    if (error.message.includes('TimeError')) {
      process.exit(1)
    }
  }
}


// NOTE: frankie this was prettier before I had to refactor it for merge conflicts, promise
async function getAccountData (keyMaterial: MaybeKeyMaterial): Promise<{ accountData: EntropyAccountData }> {
  if (isEntropyAccountData(keyMaterial)) {
    return { 
      accountData: keyMaterial as EntropyAccountData
    }
  }

  if (typeof keyMaterial !== 'string') {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }
}

function isEntropyAccountData (maybeAccountData: any) {
  return (
    maybeAccountData &&
    typeof maybeAccountData === 'object' &&
    'seed' in maybeAccountData
  )
}
