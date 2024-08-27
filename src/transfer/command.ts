import Entropy from "@entropyxyz/sdk"
import { Command } from "commander"
import { currentAccountAddressOption, endpointOption, passwordOption } from "src/common/utils-cli"
import { EntropyTransfer } from "./main"

export async function entropyTransferCommand (entropy: Entropy, rootCommand: Command) {
  rootCommand.command('transfer')
    .description('Transfer funds between two Entropy accounts.') // TODO: name the output
    .argument('destination', 'Account address funds will be sent to')
    .argument('amount', 'Amount of funds to be moved')
    .addOption(passwordOption('Password for the source account (if required)'))
    .addOption(endpointOption())
    .addOption(currentAccountAddressOption())
    .action(async (destination, amount, opts) => {
      const TransferService = new EntropyTransfer(entropy, opts.endpoint)
      await TransferService.sendTransfer(destination, amount)
      // cliWrite(??) // TODO: write the output
      process.exit(0)
    })
}