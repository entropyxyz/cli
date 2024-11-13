import { Command } from "commander"
import { accountOption, cliWrite, endpointOption, loadEntropy } from "src/common/utils-cli"
import { EntropyTransfer } from "./main"
import { getTokenDetails } from "src/common/utils"

export function entropyTransferCommand () {
  const transferCommand = new Command('transfer')
  transferCommand
    .description('Transfer funds between two Entropy accounts.') // TODO: name the output
    .argument('<destination>', 'Account address funds will be sent to')
    .argument('<amount>', 'Amount of funds to be moved (in "BITS")')
    .addOption(accountOption())
    .addOption(endpointOption())
    .action(async (destination, amount, opts) => {
      // TODO: destination as <name|address> ?
      const entropy = await loadEntropy(opts.account, opts.endpoint)
      const transferService = new EntropyTransfer(entropy, opts.endpoint)
      const { symbol } = await getTokenDetails(entropy)

      await transferService.transfer(destination, amount)

      cliWrite(`Transaction successful: Sent ${amount} ${symbol} to ${destination}`)
      process.exit(0)
    })
  return transferCommand
}
