import {
  handleUserSeed,
  handleChainEndpoint,
  handleFundingSeed,
} from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import { getUserAddress } from "../../common/utils";
import { Controller } from "../../../controller";
import { returnToMain } from "../../common/utils";
import { initializeEntropy } from "../../common/initializeEntropy";

export const entropyFaucet = async (controller: Controller) => {
  try {
    const recipientAddress = await getUserAddress();
    const AliceSeed = "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a"
    const endpoint = await handleChainEndpoint();
    const entropy = await initializeEntropy(AliceSeed, endpoint);

    await entropy.ready;

    if (!entropy.keys) {
      throw new Error("Keys are undefined");
    }

    const amount = "10000000000000000";
    const tx = entropy.substrate.tx.balances.transfer(recipientAddress, amount);

    await tx.signAndSend(
      entropy.keys.wallet,
      async ({ status }) => {  
        if (status.isInBlock || status.isFinalized) {
          console.log(recipientAddress, "funded");
        }
      }
    );
  } catch (error: any) {
    console.error("Error in entropyFaucet:", error.message);
  } finally {
    if (await returnToMain()) {
      controller.emit('returnToMain');
    } else {
      controller.emit('exit');
    }
  }
};
