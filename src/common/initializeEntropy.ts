import Entropy from "@entropyxyz/entropy-js"

export const initializeEntropy = async (seed: string, endpoint: string): Promise<Entropy> => {
  const entropy = new Entropy({ seed, endpoint })
  await entropy.ready

  if (!entropy.keys) {
    throw new Error("Keys are undefined")
  }

  return entropy
}
