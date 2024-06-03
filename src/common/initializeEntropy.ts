import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import inquirer from "inquirer"
import { decrypt, encrypt } from "../flows/password"
import { TIME_THRESHOLD, debug } from "../common/utils"
import * as config from "../config"

// TODO: unused
// let defaultAccount // have a main account to use
// let entropys 

// a cache of keyrings
const keyrings = {
  default: undefined // this is the "selected account" keyring
}

export function getKeyring (address) {
  if (!address && keyrings.default) return keyrings.default
  if (address && keyrings[address]) return keyrings[address]
  // If there is no default keyring and no keyring matching the address
  // provided, return undefined instead of keyring.default
  return undefined
}

export const initializeEntropy = async ({ keyMaterial }, endpoint: string): Promise<Entropy> => {
  try {
    // if (defaultAccount && defaultAccount.seed === keyMaterial.seed) return entropys[defaultAccount.registering.address]
    await wasmGlobalsReady()
    let password

    let accountData
    if (keyMaterial && typeof keyMaterial === 'object' && 'seed' in keyMaterial) {
      accountData = keyMaterial
    } else if (typeof keyMaterial === 'string') {

      let decryptedData
      let attempts = 0
      // TO-DO: this should be a generator function not a while loop
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
          if (!decryptedData || typeof decryptedData !== 'object' || !('seed' in decryptedData)) {
            throw new Error("Failed to decrypt keyMaterial or decrypted keyMaterial is invalid")
          }
          password = answers.password
          break
        } catch (error) {
          console.error("Incorrect password. Try again")
          attempts++
          if (attempts >= 3) {
            throw new Error("Failed to decrypt keyMaterial after 3 attempts.")
          }
        }
      }

      accountData = decryptedData
    } else {
      throw new Error("Data format is not recognized as either encrypted or unencrypted")
    }
    
    if (!accountData.seed || !accountData.admin) {
      throw new Error("Data format is not recognized as either encrypted or unencrypted")
    }

    if (accountData && accountData.admin && !accountData.registration) {
      accountData.registration = accountData.admin
      accountData.registration.used = true
      const store = await config.get()
      store.accounts = store.accounts.map((account) => {
        if (account.address === accountData.admin.address) {
          let data = accountData
          if (typeof account.data === 'string' ) data = encrypt(accountData, password)
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
    const storedKeyring = getKeyring(accountData.admin.address)

    if(!storedKeyring) {
      const keyring = new Keyring({ ...accountData, debug: true })
      keyring.accounts.on('account-update', async (newAccountData) => {
        const store = await config.get()
        store.accounts = store.accounts.map((account) => {
          if (account.address === store.selectedAccount) {
            let data = newAccountData
            if (typeof account.data === 'string' ) data = encrypt(newAccountData, password)
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
    // Decision was made to force our users to fix their machine before using the CLI in the case
    // of the machine time and network time being out of sync
    const currentBlockTime = parseInt((await entropy.substrate.query.timestamp.now()).toString())
    const now = Date.now()
    if (((now - currentBlockTime) / 1000) >= TIME_THRESHOLD) {
      throw new Error('TimeError: This machine\'s time is out of sync with the network time')
    }
    
    return entropy
  } catch (error) {
    console.error(error.message)
    if (error.message.includes('TimeError')) {
      process.exit(1)
    }
  }
}
