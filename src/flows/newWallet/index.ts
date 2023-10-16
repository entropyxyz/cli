import { randomAsHex } from "@polkadot/util-crypto";
import Entropy from "@entropyxyz/entropy-js";
import { Controller } from "../../../controller";
import { returnToMain } from "../../common/utils";

export const newWallet = async (controller: Controller) => {
  try {
    const seed: any = randomAsHex(32);
    const entropy = new Entropy({ seed });
    await entropy.ready;
    
    if (!entropy.keys) {
      throw new Error("Keys are undefined");
    }
    
    const address = entropy.keys.wallet.address;
    console.log("Take the seed and add it to the .env", {
      wallet: address,
      seed,
    });
  } catch (error: any) {
    console.error("Error in creating new wallet:", error.message);
  } finally {
    if (await returnToMain()) {
      controller.emit('returnToMain');
    } else {
      controller.emit('exit');
    }
  }
};
