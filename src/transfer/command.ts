import { Command } from "commander"

import { EntropyTransfer } from "./main"
import { accountOption, configOption, endpointOption, cliWrite } from "../common/utils-cli"
import { loadKeyring } from "../common/load-entropy"
import { findAccountByAddressOrName, getTokenDetails } from "../common/utils"
import * as config from "../config";
import { closeSubstrate, getLoadedSubstrate } from "src/common/substrate-utils"

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
      const { accounts, selectedAccount } = await config.get(opts.config)
      const substrate = await getLoadedSubstrate(opts.endpoint)
      const account = findAccountByAddressOrName(accounts, opts.account || selectedAccount)
      const loadedKeyring = await loadKeyring(account)
      const transferService = new EntropyTransfer(opts.endpoint)
      const { symbol } = await getTokenDetails(substrate)

      await transferService.transfer(loadedKeyring.accounts.registration.pair, destination, amount)

      cliWrite({
        source: loadedKeyring.accounts.registration.address,
        destination,
        amount,
        symbol
      })
      await closeSubstrate(substrate)
      process.exit(0)
    })
  return transferCommand
}
