import { handleSeed, handleKeyPath } from "../../common/questions";
import { readKey } from "../../common/utils";
import Entropy from "@entropyxyz/entropy-js";

export const register = async () => {
  const seed = await handleSeed();
  const entropy = new Entropy({ seed });
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
