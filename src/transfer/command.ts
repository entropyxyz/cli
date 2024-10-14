import { Command } from "commander"
import { accountOption, configOption, endpointOption, passwordOption, loadEntropy } from "../common/utils-cli"
import { EntropyTransfer } from "./main"

export function entropyTransferCommand () {
  const transferCommand = new Command('tranfer')
  transferCommand
    .description('Transfer funds between two Entropy accounts.') // TODO: name the output
    .argument('destination', 'Account address funds will be sent to')
    .argument('amount', 'Amount of funds to be moved')
    .addOption(accountOption())
    .addOption(configOption())
    .addOption(endpointOption())
    .addOption(passwordOption('Password for the source account (if required)'))
    .action(async (destination, amount, opts) => {
      const entropy = await loadEntropy(opts)
      const transferService = new EntropyTransfer(entropy, opts.endpoint)
      await transferService.transfer(destination, amount)
      // cliWrite(??) // TODO: write the output
      process.exit(0)
    })
  return transferCommand
}
