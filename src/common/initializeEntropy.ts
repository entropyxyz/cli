import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import { decrypt } from "../flows/password"
import inquirer from "inquirer"
// have a main account to use
let defaultAccount
// have a main keyring
const keyrings = {
  default: undefined
}
let entropys

export function getKeyring (address) {
  if (!address && keyrings.default) return keyrings.default
  if (address && keyrings[address]) return keyrings[address]
  if (address && !keyrings[address]) throw new Error('No keyring for this account')
  if (!keyrings.default) throw new Error('no default set please create a keyring')
  return keyrings.default
}


export const initializeEntropy = async ({ keyMaterial }, endpoint: string): Promise<Entropy> => {
  if (defaultAccount && defaultAccount.seed === keyMaterial.seed) return entropys[defaultAccount.registering.address]
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

  console.log('account keyMaterial', accountData);
  let selected
  if(!keyrings.default) {
    const keyring = new Keyring({ ...accountData, debug: true })
    keyrings.default = keyring
    selected = keyring
  } else {
    const keyring = new Keyring({ ...accountData, debug: true })
    keyrings[keyring.registering.address] = keyring
    selected = keyring
  }

  const entropy = new Entropy({ keyring: selected, endpoint })
  
  await entropy.ready

  if (!entropy?.keyring?.accounts?.registration?.seed) {
    throw new Error("Keys are undefined")
  }

  return entropy
}
