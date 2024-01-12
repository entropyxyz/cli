import Entropy, { EntropyAccount } from "@entropyxyz/entropy-js"
import { getWallet } from "@entropyxyz/entropy-js/src/keys"

export async function initializeEntropy(account?: EntropyAccount, seed?: string): Promise<Entropy> {
  let entropyAccount: EntropyAccount

  const userSessionSeed = seed ?? process.env.SEED
  if (userSessionSeed) {
    const signer = await getWallet(userSessionSeed)
    if (!signer) {
      throw new Error("Failed to create signer from seed.")
    }

    entropyAccount = {
      sigRequestKey: signer,
      programModKey: signer
    }
  } else if (account) {
    entropyAccount = account
  } else {
    throw new Error("No seed or account provided for initializing Entropy.")
  }

  const entropy = new Entropy({ account: entropyAccount })
  await entropy.ready
  return entropy
}