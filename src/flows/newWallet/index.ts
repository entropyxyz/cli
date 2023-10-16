import { randomAsHex } from "@polkadot/util-crypto";
import Entropy from "@entropyxyz/entropy-js";
import { Controller } from "../../../controller";
import { returnToMain } from "../../common/utils";

export const newWallet = async (controller: Controller) => {
  const seed: any = randomAsHex(32);
  const entropy = new Entropy({ seed });
  await entropy.ready
  const address = entropy.keys?.wallet.address;
  console.log("take the seed and add it to the .env", {
    wallet: address,
    seed,
  });
  if (await returnToMain()) {
    controller.emit('returnToMain');
  } else {
    controller.emit('exit');
  }
};
