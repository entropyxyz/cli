import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import inquirer from "inquirer"
import { decrypt, encrypt } from "../flows/password"
import { debug } from "../common/utils"
import * as config from "../config"
import { EntropyAccountData } from "../config/types"

// TODO: unused
// let defaultAccount // have a main account to use
// let entropys 

// a cache of keyrings
const keyrings = {
  default: undefined // this is the "selected account" keyring
}

export function getKeyring (address?: string, seed?: string) {
  
  if (!address && !seed && keyrings.default) return keyrings.default
  if (!address && seed && keyrings.default && Object.keys(keyrings).length > 1) {
    const [keyring] = Object.keys(keyrings)
      .filter(kr => {
      
        return keyrings[kr]?.admin?.seed === seed
      })
    
    return keyring
  }
  if (address && keyrings[address]) return keyrings[address]
  // explicitly return undefined so there is no confusion around what is selected
  return undefined
}

interface InitializeEntropyOpts {
  keyMaterial: MaybeKeyMaterial,
  password?: string,
  endpoint: string
}
type MaybeKeyMaterial = EntropyAccountData | string

// WARNING: in programatic cli mode this function should NEVER prompt users, but it will if no password was provided
// This is currently caught earlier in the code
export const initializeEntropy = async ({ keyMaterial, password, endpoint }: InitializeEntropyOpts): Promise<Entropy> => {
  try {
    // if (defaultAccount && defaultAccount.seed === keyMaterial.seed) return entropys[defaultAccount.registering.address]
    await wasmGlobalsReady()

    const { accountData, password: successfulPassword } = await getAccountDataAndPassword(keyMaterial, password)
    // check if there is no admin account and no seed so that we can throw an error
    if (!accountData.seed && !accountData.admin) {
      throw new Error("Data format is not recognized as either encrypted or unencrypted")
    }

    if (accountData && accountData.admin && !accountData.registration) {
      accountData.registration = accountData.admin
      accountData.registration.used = true // TODO: is this even used?
      const store = await config.get()
      store.accounts = store.accounts.map((account) => {
        if (account.address === accountData.admin.address) {
          let data = accountData
          // @ts-ignore
          if (typeof account.data === 'string' ) data = encrypt(accountData, successfulPassword)
          account = {
            ...account,
            data,
          }
        }
        return account
      })
      // re save the entire config
      await config.set(store)
    }

    let selectedAccount
    const storedKeyring = getKeyring(accountData?.admin?.address, accountData.seed)

    if(!storedKeyring) {
      const keyring = new Keyring({ ...accountData, debug: true })
      keyring.accounts.on('account-update', async (newAccountData) => {
        const store = await config.get()
        store.accounts = store.accounts.map((account) => {
          if (account.address === store.selectedAccount) {
            let data = newAccountData
            if (typeof account.data === 'string') data = encrypt(newAccountData, successfulPassword)
            const newAccount = {
              ...account,
              data,
            }
            return newAccount
          }
          return account
        })

        // re save the entire config
        await config.set(store)

      })
      keyrings.default = keyring
      debug(keyring)

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
    console.error(error.message)
    if (error.message.includes('TimeError')) {
      process.exit(1)
    }
  }
}


// NOTE: frankie this was prettier before I had to refactor it for merge conflicts, promise
async function getAccountDataAndPassword (keyMaterial: MaybeKeyMaterial, password?: string): Promise<{ password: string | null, accountData: EntropyAccountData }> {
  if (isEntropyAccountData(keyMaterial)) {
    return { 
      password: null,
      accountData: keyMaterial as EntropyAccountData
    }
  }

  if (typeof keyMaterial !== 'string') {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }

  /* Programmatic Mode */
  if (password) {
    const decryptedData = decrypt(keyMaterial, password)
    if (!isEntropyAccountData(decryptedData)) {
      throw new Error("Failed to decrypt keyMaterial or decrypted keyMaterial is invalid")
    }
    // @ts-ignore TODO: some type work here
    return { password, accountData: decryptedData }
  }

  /* Interactive Mode */
  let sucessfulPassword: string
  let decryptedData
  let attempts = 0

  while (attempts < 3) {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter password to decrypt keyMaterial:',
        mask: '*',
      }
    ])

    try {
      decryptedData = decrypt(keyMaterial, answers.password)
      //@ts-ignore
      if (!isEntropyAccountData(decryptedData)) {
        throw new Error("Failed to decrypt keyMaterial or decrypted keyMaterial is invalid")
      }

      sucessfulPassword = answers.password
      break
    } catch (error) {
      console.error("Incorrect password. Try again")
      attempts++
      if (attempts >= 3) {
        throw new Error("Failed to decrypt keyMaterial after 3 attempts.")
      }
    }
  }

  return {
    password: sucessfulPassword,
    accountData: decryptedData as EntropyAccountData
  }
}

function isEntropyAccountData (maybeAccountData: any) {
  return (
    maybeAccountData &&
    typeof maybeAccountData === 'object' &&
    'seed' in maybeAccountData
  )
}
