import { handleSeed, handleKeyPath } from "../../common/questions";
import { readKey } from "../../common/utils";
import Entropy from "@entropyxyz/entropy-js";

export const register = async () => {
  const seed = await handleSeed();
  const name = await handleKeyPath();
  const threshold_key = readKey(`tofn/${name}/0`);
  const threshold_key_bob = readKey(`tofn/${name}/1`);
  const entropy = await Entropy.setup(seed);
  console.log(entropy.substrate.signer.wallet.address);
  await entropy.substrate.api.isReady;
  const register = await entropy.register({
    keyShares: [threshold_key, threshold_key_bob],
    constraintModificationAccount: entropy.substrate.signer.wallet.address,
    freeTx: false,
  });
  console.log({ register });
  process.exit();
};
