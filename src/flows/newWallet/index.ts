import { randomAsHex } from "@polkadot/util-crypto";
import Entropy from "@entropyxyz/entropy-js";
import { Controller } from "../../../controller";
import { getWallet } from "@entropyxyz/sdk/dist/keys";
import { EntropyAccount } from "@entropyxyz/sdk";
import { returnToMain } from "../../common/utils";
import { handleChainEndpoint } from "../../common/questions";

export const newWallet = async (controller: Controller) => {
  try {
    const seed: any = randomAsHex(32)
    const signer = await getWallet(seed)

    const endpoint = await handleChainEndpoint()


    const entropyAccount: EntropyAccount = {
      sigRequestKey: signer,
      programModKey: signer,
      programDeployKey: signer,
    }
  
    
   const entropy = new Entropy({ account: entropyAccount, endpoint})
    await entropy.ready;
  
    
    if (!entropy.account?.sigRequestKey?.wallet.address) {
      throw new Error("Keys are undefined");
    }
    
    const address = entropy.account?.sigRequestKey.wallet.address;
    console.log("Take the seed and add it to the .env", {
      wallet: address,
      seed,
    });
  } catch (error: any) {
    console.error("Error in creating new wallet:", error.message);
  } finally {
    if (await returnToMain()) {
      console.clear();
      controller.emit('returnToMain');
    } else {
      controller.emit('exit');
    }
  }
};
