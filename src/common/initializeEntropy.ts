import Entropy from "@entropyxyz/sdk"
import { getWallet } from '@entropyxyz/sdk/dist/keys'
import { EntropyAccount } from "@entropyxyz/sdk"

export const initializeEntropy = async (seed: string, endpoint: string): Promise<Entropy> => {
  if (!seed) {
    const entropy = new Entropy({ endpoint })
    await entropy.ready
    return entropy
  }
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
