import { Command } from "commander";
import Entropy from "@entropyxyz/sdk";

import { EntropyBalance } from "./main";
import { endpointOption, cliWrite, loadEntropy } from "../common/utils-cli";
import { findAccountByAddressOrName } from "../common/utils";
import * as config from "../config";
import { EntropyAccountConfig } from "src/config/types";
import { formattedBalances } from "./utils";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  // account can no longer be a required argument if a user wishes to
  // view the balances of all accounts
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('[account]', [
      'The address an account address whose balance you want to query.',
      'Can also be the human-readable name of one of your accounts'
    ].join(' '))
    .option('-a, --all', 'Get balances for all admin accounts in the config')
    .addOption(endpointOption())
    .action(async (account, opts) => {
      const { accounts } = await config.get()
      let entropy: Entropy
      if (!account && opts.all) {
        const tempAddress = accounts[0].address
        entropy = await loadEntropy(tempAddress, opts.endpoint)
      } else if (account) {
        entropy = await loadEntropy(account, opts.endpoint)
      } else {
        balanceCommand.help()
      }

      if (!entropy) {
        console.error('EntropyError: Entropy was not initialized, please try again.')
        process.exit(1)
      }

      const BalanceService = new EntropyBalance(entropy, opts.endpoint)
      if (opts.all) {
        // Balances for all admin accounts
        const addresses: string[] = accounts.map((acct: EntropyAccountConfig) => acct.address)
        const balances = formattedBalances(await BalanceService.getBalances(addresses))
        cliWrite(balances)
      } else {
        // Balance for singular account
        const address = findAccountByAddressOrName(accounts, account)?.address
        const balance = await BalanceService.getBalance(address)
        cliWrite(`${balance.toLocaleString('en-US')} BITS`)
      }
      process.exit(0)
    })

  return balanceCommand
}
