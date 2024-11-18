import { Command } from "commander";
import Entropy from "@entropyxyz/sdk";

import { EntropyBalance } from "./main";
import { endpointOption, cliWrite, loadEntropy } from "../common/utils-cli";
import { findAccountByAddressOrName, getTokenDetails, nanoBitsToBits } from "../common/utils";
import * as config from "../config";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('<account>', [
      'The address an account address whose balance you want to query.',
      'Can also be the human-readable name of one of your accounts'
    ].join(' '))
    .addOption(endpointOption())
    .action(async (account, opts) => {
      const entropy: Entropy = await loadEntropy(account, opts.endpoint)
      const balanceService = new EntropyBalance(entropy, opts.endpoint)
      const { decimals, symbol } = await getTokenDetails(entropy)

      const { accounts } = await config.get()
      const address = findAccountByAddressOrName(accounts, account)?.address

      const nanoBalance = await balanceService.getBalance(address)
      const balance = nanoBitsToBits(nanoBalance, decimals)
      cliWrite(`${balance} ${symbol}`)
      process.exit(0)
    })

  return balanceCommand
}
