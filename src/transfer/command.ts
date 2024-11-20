import { Command } from "commander"

import { EntropyTransfer } from "./main"
import { accountOption, endpointOption } from "../common/utils-cli"
import { loadEntropyCli } from "../common/load-entropy"

export function entropyTransferCommand () {
  const transferCommand = new Command('transfer')
  transferCommand
    .description('Transfer funds between two Entropy accounts.') // TODO: name the output
    .argument('<destination>', 'Account address funds will be sent to')
    .argument('<amount>', 'Amount of funds to be moved (in "tokens")')
    .addOption(accountOption())
    .addOption(endpointOption())
    .action(async (destination, amount, opts) => {
      // TODO: destination as <name|address> ?
      const entropy = await loadEntropyCli(opts)
      const transferService = new EntropyTransfer(entropy, opts.endpoint)

      await transferService.transfer(destination, amount)

      // cliWrite(??) // TODO: write the output
      process.exit(0)
    })
  return transferCommand
}
