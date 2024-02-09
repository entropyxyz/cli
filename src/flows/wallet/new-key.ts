import inquirer from 'inquirer'
import { randomAsHex } from "@polkadot/util-crypto";
import { Controller } from "../../../controller";
import { getWallet } from "@entropyxyz/sdk/dist/keys";
import Entropy, { EntropyAccount } from "@entropyxyz/sdk";
import { handleChainEndpoint } from "../../common/questions";

const questions = [
  {
    type: 'confirm',
    name: 'importKey',
    message: 'Would you like to import a key',
    default: false,
  },
  {
    type: 'input',
    name: 'name',
    default: 'My Key'
  },
]





export const newKey = async ({ accounts }) => {

  const { secret, name, path } = await inquirer.prompt(questions)
  const names = accounts.map((account) => account.name)

  const sameNames = names.reduce((agg, accountName) => {
    if (
      // check if same name exists
      accountName === name ||
      // check if multiple indexed names exist
      accountName.startsWith(name) &&
      // make sure if it doese start with that same that the next is the number
      // example: My Name 1 -> true My Name awesome -> false
      accountName.split(' ').length + 1 === name.split(' ').length &&
      /^\d+$/.test(accountName.split(' ')[(accountName.split(' ').length - 1)])
    ) {
      agg.push(sameNames)
    }
    return agg
  }, [])

  const newKey = {
    name: `${name}${ sameNames.length ? ` ${sameNames.length + 1}` : ''}`,
    seed:
  }


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
