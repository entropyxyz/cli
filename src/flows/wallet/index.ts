import inquirer from 'inquirer'
import { randomAsHex } from "@polkadot/util-crypto";
import { getWallet } from "@entropyxyz/sdk/dist/keys";
import Entropy, { EntropyAccount } from "@entropyxyz/sdk";
import { handleChainEndpoint } from "../../common/questions";

const questions = [
  {
    type: 'confirm',
    name: 'import',
    message: 'Would you like to import a key',
    default: false,
  },
  {
    type: 'input',
    name: 'name',
    default: 'My Key'
  },
]





export const newWallet = async () => {



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
