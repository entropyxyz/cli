import { handleChainEndpoint, handleUserSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import { main } from "../../..";
import { getUserAddress, returnToMain } from "../../common/utils";

export const register = async () => {
  try {
    const seed = await handleUserSeed();
    const endpoint = await handleChainEndpoint();
    const entropy = new Entropy({ seed, endpoint });

    if (entropy.ready instanceof Promise) {
      await entropy.ready;
    }

    let address = await getUserAddress();
    if (address === undefined) {
      throw new Error("address issue");
    }
    console.log('Checking registration status for address:', address); 


    const isRegistered = await entropy.registrationManager.checkRegistrationStatus(address);
  
    console.log('Registration status:', isRegistered);


    if (isRegistered === true) {
      console.log('Checking registration status for address:', address);
      console.log('Registration status:', isRegistered);      
      return;  
    }
    console.log('Attempting to register the address:', address); 
    await entropy.register({
      address,
      keyVisibility: 'Permissioned',
      freeTx: false,
    });
    console.log("Your address", address, "has been successfully registered.");
    

  } catch (error) {
    console.error("Error:", error);
  }

  if (await returnToMain()) {
    main();
} else {
    console.log("Goodbye!");
    process.exit();
}
};
