import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import inquirer from "inquirer"
import { decrypt } from "../flows/password"
import { debug } from "../common/utils"
import * as config from "../config"

// TODO: unused
// let defaultAccount // have a main account to use
// let entropys 

// have a main keyring
const keyrings = {
  default: undefined
}

export function getKeyring (address) {
  if (!address && keyrings.default) return keyrings.default
  if (address && keyrings[address]) return keyrings[address]
  if (address && !keyrings[address]) throw new Error('No keyring for this account')
  if (!keyrings.default) throw new Error('no default set please create a keyring')
  return keyrings.default
}


// export function setupKeyrings (config) {
//   const { accounts } = config;
//   
// }

export const initializeEntropy = async (keyMaterial, endpoint: string): Promise<Entropy> => {
  debug('key material', keyMaterial);
  
  // if (defaultAccount && defaultAccount.seed === keyMaterial.seed) return entropys[defaultAccount.registering.address]
  await wasmGlobalsReady()

  let accountData
  if (keyMaterial && typeof keyMaterial === 'object' && 'seed' in keyMaterial) {
    accountData = keyMaterial
  } else if (typeof keyMaterial === 'string') {

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
        if (!decryptedData || typeof decryptedData !== 'object' || !('seed' in decryptedData)) {
          throw new Error("Failed to decrypt keyMaterial or decrypted keyMaterial is invalid")
        }

        break
      } catch (error) {
        console.error("Incorrect password. Try again")
        attempts++
        if (attempts >= 3) {
          throw new Error("Failed to decrypt keyMaterial after 3 attempts.")
        }
      }
    }

    accountData = decryptedData as { seed: string; type: string }
  } else {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }
  
  if (!accountData.seed) {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }

  debug('account keyMaterial', accountData);
  let selectedAccount
  if(!keyrings.default) {
    const keyring = new Keyring({ ...accountData, debug: true })
    keyrings.default = keyring
    selectedAccount = keyring
  } else {
    const keyring = new Keyring({ ...accountData, debug: true })
    keyrings[keyring.accounts.masterAccountView.registration.address] = keyring
    selectedAccount = keyring
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
    const { admin: { address: adminAddress } } = account
    const masterAccount = storedConfig.accounts.find(obj => obj.address === adminAddress)
    Object.assign(masterAccount, account)
    const newAccounts = storedConfig.accounts.filter(obj => obj.address !== adminAddress).concat([masterAccount])
    await config.set({ ...storedConfig, ...{ accounts: newAccounts, selectedAccount: adminAddress } })
  })

  return entropy
}
