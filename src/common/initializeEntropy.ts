import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import inquirer from "inquirer"
import { decrypt, encrypt } from "../flows/password"
import { debug } from "../common/utils"
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
  return keyrings.default
}


// export function setupKeyrings (config) {
//   const { accounts } = config;
//   
// }

export const initializeEntropy = async ({ keyMaterial }, endpoint: string): Promise<Entropy> => {
  
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
  
  if (!accountData.seed) {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }

  debug('account keyMaterial', accountData);
  if (accountData && accountData.admin && !accountData.registration) {
    accountData.registration = accountData.admin
    accountData.registration.used = true
  }
  let selectedAccount
  const storedKeyring = getKeyring(accountData.admin.address)
  if(!storedKeyring) {
    const keyring = new Keyring({ ...accountData })
    keyring.accounts.on('#account-update', async (newAccoutData) => {
      const store = await config.get()
      store.accounts.map((account) => {
        if (account.address === selectedAccount.address) {
          let data = newAccoutData
          if (typeof account.data === 'string' ) data = encrypt(newAccoutData, password)
          account = {
            ...account,
            data,
          }
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

  debug('data sent', accountData);
  debug('storage', keyrings);
  debug('selected', selectedAccount);
  debug('keyring', entropy.keyring);


  if (!entropy?.keyring?.accounts?.registration?.seed) {
    throw new Error("Keys are undefined")
  }
  const storedConfig = await config.get();

  entropy.keyring.accounts.on('#account-update', async (account) => {
    debug('ACCT SUBSCRIBER::', account)
    const { admin: { address: adminAddress } } = account
    const masterAccount = storedConfig.accounts.find(obj => obj.address === adminAddress)
    debug('STORED ACCT::', masterAccount);
    Object.assign(masterAccount, account)
    const newAccounts = storedConfig.accounts.filter(obj => obj.address !== adminAddress).concat([masterAccount])
    await config.set({ ...storedConfig, ...{ accounts: newAccounts, selectedAccount: adminAddress } })
  })

  return entropy
}
