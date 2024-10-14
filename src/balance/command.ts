import { Command } from "commander";
import Entropy from "@entropyxyz/sdk";

import { EntropyBalance } from "./main";
import { configOption, endpointOption, passwordOption, loadEntropy, cliWrite } from "../common/utils-cli";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('address', 'Account address whose balance you want to query')
    .addOption(configOption())
    .addOption(endpointOption())
    .addOption(passwordOption())
    .action(async (address, opts) => {
      const entropy: Entropy = await loadEntropy({ account: address, ...opts })
      const BalanceService = new EntropyBalance(entropy, opts.endpoint)
      const balance = await BalanceService.getBalance(address)
      cliWrite(`${balance.toLocaleString('en-US')} BITS`)
      process.exit(0)
    })
  
  return balanceCommand
}
