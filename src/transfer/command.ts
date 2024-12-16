import { Command } from "commander"

import { EntropyTransfer } from "./main"
import { accountOption, configOption, endpointOption, cliWrite } from "../common/utils-cli"
import { loadEntropyCli } from "../common/load-entropy"
import { getTokenDetails } from "../common/utils"

export function entropyTransferCommand () {
  const transferCommand = new Command('transfer')
  transferCommand
    .description('Transfer funds between two Entropy accounts.') // TODO: name the output
    .argument('<destination>', 'Account address funds will be sent to')
    .argument('<amount>', 'Amount of funds (in "BITS") to be moved')
    .addOption(accountOption())
    .addOption(configOption())
    .addOption(endpointOption())
    .action(async (destination, amount, opts) => {
      // TODO: destination as <name|address> ?
      const entropy = await loadEntropyCli(opts)
      const transferService = new EntropyTransfer(opts.endpoint)
      const { symbol } = await getTokenDetails(entropy.substrate)

      await transferService.transfer(entropy.keyring.accounts.registration.pair, destination, amount)

      cliWrite({
        source: entropy.keyring.accounts.registration.address,
        destination,
        amount,
        symbol
      })
      process.exit(0)
    })
  return transferCommand
}
