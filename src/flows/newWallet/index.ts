import { randomAsHex } from "@polkadot/util-crypto";
import Entropy from "@entropyxyz/entropy-js";

export const newWallet = async () => {
  const seed: any = randomAsHex(32);
  const entropy = await Entropy.setup(seed);
  const wallet = entropy.substrate.signer.wallet.address;
  console.log("take the seed and add it to the .env", {
    wallet: wallet,
    seed,
  });
  process.exit()
};
