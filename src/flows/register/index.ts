import { handleChainEndpoint, handleUserSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";

export const register = async () => {
  try {
    const seed = await handleUserSeed();
    const endpoint = await handleChainEndpoint();
    const entropy = new Entropy({ seed, endpoint });

    if (entropy.ready instanceof Promise) {
      await entropy.ready;
    }

    let address = entropy.keys?.wallet.address;
    if (address === undefined) {
      throw new Error("address issue");
    }

    const isRegistered = await entropy.registrationManager.checkRegistrationStatus(address);

    if (isRegistered === true) {
      console.log("Your address is registered.");
      return;  
    }
    await entropy.register({
      address,
      keyVisibility: 'Permissioned',
      freeTx: false,
    });
    console.log("Your address", address, "has been successfully registered.");

  } catch (error) {
    console.error("Error:", error);
  }
};
