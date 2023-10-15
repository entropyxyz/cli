import { readFileSync } from "node:fs";
import { handleChainEndpoint, handleFundingSeed, handleUserSeed } from "./questions";
import Entropy from "@entropyxyz/entropy-js";
import inquirer from "inquirer";


export const readKey = (path: string) =>  {
	const buffer = readFileSync(path);
	const result = new Uint8Array(buffer.byteLength);
	buffer.copy(result);
	buffer.fill(0);
	return result;
  }

  export const getUserAddress = async () => {
	const userSeed = await handleUserSeed();
	const endpoint = await handleChainEndpoint();
	const userEntropy = new Entropy({seed: userSeed, endpoint});
	await userEntropy.ready;
	return userEntropy.keys?.wallet.address;
  };

 export const returnToMain = async() =>  {
    const response = await inquirer.prompt([
        {
            type: "confirm",
            name: "returnToMain",
            message: "Return to main menu?",
            default: true,
        },
    ]);

    return response.returnToMain;
};
  