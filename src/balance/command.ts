import Entropy from "@entropyxyz/sdk";
import { Command } from "commander";
import { cliWrite, endpointOption, passwordOption } from "src/common/utils-cli";
import { EntropyBalance } from "./main";

export async function entropyBalanceCommand (entropy: Entropy, rootCommand: Command) {
  const programCommand = rootCommand.command('balance')
    .description('Commands to retrieive account balances on the Entropy Network')
  entropyAccountBalance(entropy, programCommand)  
}

async function entropyAccountBalance (entropy: Entropy, programCommand: Command) {
  programCommand
    .argument('address', 'Account address whose balance you want to query')
    .addOption(passwordOption())
    .addOption(endpointOption())
    .action(async (address, opts) => {
      const balanceCommand = new EntropyBalance(entropy, opts.endpoint)
      const balance = await balanceCommand.getBalance(address)
      cliWrite(balance)
      process.exit(0)
    })
}