import { handleChainEndpoint, handleSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";

export const register = async () => {
  const seed = await handleSeed();
  const endpoint = await handleChainEndpoint()
  const entropy = new Entropy({ seed, endpoint });
  await entropy.ready
  let address = entropy.keys?.wallet.address
  if (address == undefined) {
    throw new Error("address issue");
  }
  console.log({ address });
  const register = await entropy.register({
    address,
    keyVisibility: 'Permissioned',
    freeTx: false,
  });
  console.log({ register });
  process.exit();
};
