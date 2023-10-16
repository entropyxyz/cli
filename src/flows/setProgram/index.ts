import inquirer from "inquirer";
import {
  handleUserSeed,
  handleChainEndpoint,
  handleFundingSeed,
} from "../../common/questions";
import { readFileSync } from "fs";
import Entropy from "@entropyxyz/entropy-js";
import { getUserAddress } from "../../common/utils";
import { hexToU8a } from '@polkadot/util';
import { Controller } from "../../../controller";
import { buf2hex } from "../../common/utils";
import { initializeEntropy } from "../../common/initializeEntropy";
import { returnToMain } from "../../common/utils";


const preprocessAfterGet = (fetchedProgram: ArrayBuffer): ArrayBuffer => {
  const uint8View = new Uint8Array(fetchedProgram);

  const slicedView = uint8View.slice(1);

  return slicedView.buffer; }

  export const setProgram = async (controller: Controller) => {
    const seed = await handleUserSeed();
    const endpoint = await handleChainEndpoint();
  
    const userAddress = await getUserAddress();
    
    const entropy = await initializeEntropy(seed, endpoint);
    const address = entropy.keys?.wallet.address;
    if (!entropy.keys) {
      throw new Error("Keys are undefined");
    }
  
    const actionChoice = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Do you want to set or get the program?",
        choices: ["Set", "Get", "Exit to Main Menu"], 
      },
    ]);
  
    switch (actionChoice.action) {
      case "Set":
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
  
          if (await returnToMain()) {
            controller.emit('main');
            return;
          }
  
        } catch (error: any) {
          console.error("Error setting program:", error.message);
        }
        break;
        
      case "Get":
        console.log(userAddress);
        const fetchedProgram: ArrayBuffer = await entropy.programs.get(entropy.keys?.wallet.address);
        const processedProgram = preprocessAfterGet(fetchedProgram);
        const processedProgramHex = buf2hex(processedProgram);
        console.log('Retrieved program (hex):', processedProgramHex);
  
        if (await returnToMain()) {
          controller.emit('returnToMain');
          return;
        }
        break;
        
      case "Exit to Main Menu": 
        controller.emit('main');
        break;
    }
  };
  