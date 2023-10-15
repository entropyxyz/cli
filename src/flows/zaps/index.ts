import Entropy from "@entropyxyz/entropy-js";
import inquirer from "inquirer";
import { main } from "../../..";
import { readFileSync } from "fs";
import { hexToU8a } from '@polkadot/util';
import { returnToMain } from "../../common/utils";
import { handleUserSeed, handleFundingSeed, handleChainEndpoint } from "../../common/questions";
import { getUserAddress } from "../../common/utils";

export const giveZaps = async () => {
  const seed = await handleUserSeed();
  const endpoint = await handleChainEndpoint();
  const entropy = new Entropy({ seed, endpoint });
  const userAddress = await getUserAddress()
  const address = entropy.keys?.wallet.address;

  await entropy.ready;

  if (!entropy.keys) {
    throw new Error("Keys are undefined");
  }

  const actionChoice = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Do you want to set or get the program?",
      choices: ["Set", "Get"],
    },
  ]);

  if (actionChoice.action === "Set") {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "programPath",
        message: "Please provide the path to your program file:",
        validate: input => {
          if (input) return true;
          else return "A valid path to a program file is required!";
        },
      },
    ]);

    try {
      const userProgram: any = readFileSync(answers.programPath);
      await entropy.programs.set(userProgram);
      console.log("Program set successfully.");
    } catch (error: any) {
      console.error("Error:", error.message);
    }

  } else if (actionChoice.action === "Get") {
 
      console.log(userAddress)
      const fetchedProgram: ArrayBuffer = await entropy.programs.get(userAddress);
      console.log("Retrieved program:", fetchedProgram);
    
  }
};
