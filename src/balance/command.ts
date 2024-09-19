import Entropy from "@entropyxyz/sdk";
import { Command } from "commander";
import { cliWrite, endpointOption, loadEntropy, passwordOption } from "src/common/utils-cli";
import { EntropyBalance } from "./main";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('address', 'Account address whose balance you want to query')
    .addOption(passwordOption())
    .addOption(endpointOption())
    .action(async (address, opts) => {
      const entropy: Entropy = await loadEntropy(address, opts.endpoint)
      const BalanceService = new EntropyBalance(entropy, opts.endpoint)
      const balance = await BalanceService.getBalance(address)
      cliWrite(`${balance.toLocaleString('en-US')} BITS`)
      process.exit(0)
    })
  
  return balanceCommand
}
