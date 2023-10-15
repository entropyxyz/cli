import inquirer from "inquirer";
import {
  handleUserSeed,
  handleChainEndpoint,
  handleFundingSeed,
} from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import { getUserAddress } from "../../common/utils";
import { hexToU8a } from '@polkadot/util';

export const setProgram = async () => {
  const seed = await handleUserSeed();
  const endpoint = await handleChainEndpoint();
  const entropy = new Entropy({ seed, endpoint });
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
        name: "bytecode",
        message: "Please paste your bytecode:",
        validate: input => {
          if (input && input.startsWith("0x")) return true;
          else return "A valid bytecode in hex format (starting with 0x) is required!";
        },
      },
    ]);

    const userProgram: Uint8Array = hexToU8a(answers.bytecode);
    console.log("address", address);
    await entropy.programs.set(userProgram.buffer);
    console.log("Program set successfully.");
  } else if (actionChoice.action === "Get") {
    try {
      const fetchedProgram: ArrayBuffer = await entropy.programs.get(address);
      console.log("Retrieved program:", fetchedProgram);
    } catch (error: any) {
      console.error("Error:", error.message);
    }
  }
};


