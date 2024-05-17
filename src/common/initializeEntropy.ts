import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import { decrypt } from "../flows/password"
import inquirer from "inquirer"

export const initializeEntropy = async ({data}, endpoint: string): Promise<Entropy> => {
  await wasmGlobalsReady()

  let accountData
  if (data && typeof data === 'object' && 'seed' in data) {
    accountData = data
  } else if (typeof data === 'string') {

    let decryptedData
    let attempts = 0

    while (attempts < 3) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter password to decrypt data:',
          mask: '*',
        }
      ])

      try {
        decryptedData = decrypt(data, answers.password)
        //@ts-ignore
        if (!decryptedData || typeof decryptedData !== 'object' || !('seed' in decryptedData)) {
          throw new Error("Failed to decrypt data or decrypted data is invalid")
        }

        break
      } catch (error) {
        console.error("Incorrect password. Try again")
        attempts++
        if (attempts >= 3) {
          throw new Error("Failed to decrypt data after 3 attempts.")
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

  const keyring = new Keyring(accountData)

  const entropy = new Entropy({ keyring, endpoint})
  
  await entropy.ready

  if (!entropy?.keyring?.accounts?.registration?.seed) {
    throw new Error("Keys are undefined")
  }

  return entropy
}
