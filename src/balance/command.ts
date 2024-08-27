import Entropy from "@entropyxyz/sdk";
import { Command } from "commander";
import { cliWrite, endpointOption, passwordOption } from "src/common/utils-cli";
import { EntropyBalance } from "./main";

export async function entropyBalanceCommand (entropy: Entropy, rootCommand: Command) {
  const balanceCommand = rootCommand.command('balance')
    .description('Commands to retrieive account balances on the Entropy Network')
  entropyAccountBalance(entropy, balanceCommand)  
}

async function entropyAccountBalance (entropy: Entropy, balanceCommand: Command) {
  balanceCommand
    .argument('address', 'Account address whose balance you want to query')
    .addOption(passwordOption())
    .addOption(endpointOption())
    .action(async (address, opts) => {
      const BalanceService = new EntropyBalance(entropy, opts.endpoint)
      const balance = await BalanceService.getAccountBalance(address)
      cliWrite(balance)
      process.exit(0)
    })
}