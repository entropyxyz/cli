import Entropy from "@entropyxyz/sdk"
import { getWallet } from '@entropyxyz/sdk/dist/keys'
import { EntropyAccount } from "@entropyxyz/sdk"

export const initializeEntropy = async ({ data }, endpoint: string): Promise<Entropy> => {
  if (!data.seed) {
    const entropy = new Entropy({ endpoint })
    await entropy.ready
    return entropy
  }
  const { seed } = data
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
