import { Command } from "commander";

import { EntropyBalance } from "./main";
import { endpointOption, cliWrite } from "../common/utils-cli";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('<address>', 'Any SS58 address you would like to get the balance of')
    .addOption(endpointOption())
    .action(async (address, opts) => {
      const balance = await EntropyBalance.getAnyBalance(opts.endpoint, address)
      cliWrite(`${balance.toLocaleString('en-US')} BITS`)
      process.exit(0)
    })

  return balanceCommand
}
