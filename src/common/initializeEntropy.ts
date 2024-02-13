import Entropy from "@entropyxyz/sdk"
import { getWallet } from '@entropyxyz/sdk/dist/keys'
import { EntropyAccount } from "@entropyxyz/sdk"
import { decrypt } from "../flows/password"
import inquirer from "inquirer"

export const initializeEntropy = async ({data}, endpoint: string): Promise<Entropy> => {
  if (Object.keys(data).length === 0) {
    const entropy = new Entropy({ endpoint });
    await entropy.ready;
    return entropy;
  }

  let accountData;
  if (data && typeof data === 'object' && 'type' in data && 'seed' in data) {
    accountData = data
  } else if (typeof data === 'string') {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter password to decrypt data:',
        mask: '*',
      }
    ])
    const decryptedData = decrypt(data, answers.password)

    //@ts-ignore
    if (!decryptedData || typeof decryptedData !== 'object' || !('seed' in decryptedData)) {
      throw new Error("Failed to decrypt data or decrypted data is invalid")
    }

    // Since we've thrown an error for the null or invalid case, we can assert non-null here
    accountData = decryptedData as { seed: string; type: string }
  } else {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }

  if (!accountData.seed) {
    const entropy = new Entropy({ endpoint })
    await entropy.ready
    return entropy
  }

  const { seed } = accountData
  const signer = await getWallet(seed)

  const entropyAccount: EntropyAccount = {
    sigRequestKey: signer,
    programModKey: signer,
    programDeployKey: signer,
  }

  const entropy = new Entropy({ account: entropyAccount, endpoint})
  await entropy.ready

  if (!entropy.account?.sigRequestKey?.pair) {
    throw new Error("Keys are undefined")
  }

  return entropy
}