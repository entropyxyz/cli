import Entropy from "@entropyxyz/entropy-js";
import inquirer from "inquirer";
import { handleChainEndpoint, handleUserSeed } from "../../common/questions";
import { main } from "../../../index";  
import { getUserAddress, returnToMain } from "../../common/utils";

const hexToBigInt = (hexString: string) => BigInt(hexString);

export const balance = async () => {
  const seed = await handleUserSeed();
  const endpoint = await handleChainEndpoint();
  const entropy: Entropy = new Entropy({ seed, endpoint });
  await entropy.ready;

  const balanceChoice = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Choose an action:",
      choices: ["Check my balance", "Query an address balance"],
    },
  ]);

  let accountToCheck;
  if (balanceChoice.action === "Check my balance") {
    accountToCheck = entropy.keys?.wallet.address;
    if (!accountToCheck) {
      throw new Error("User address not found");
    }
  } else {
    const question = {
      type: "input",
      name: "account",
      message: "Input account to check balance for:",
      default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    };
    const { account: inputAccount } = await inquirer.prompt([question]);
    accountToCheck = inputAccount;
  }

  const accountInfo = (await entropy.substrate.query.system.account(accountToCheck)) as any;
  const freeBalance = hexToBigInt(accountInfo.data.free);
  console.log(`Address ${accountToCheck} has free balance: ${freeBalance.toString()} units`);

  if (await returnToMain()) {
    main();
  } else {
    process.exit();
  }
};
