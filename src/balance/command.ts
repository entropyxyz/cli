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
    .addOption(endpointOption())
    .option('--all', 'Get balances for all admin accounts in the config')
    .action(async (account, opts) => {
      const { accounts } = await config.get()
      // when trying to get the balance of all accounts, need to use a temporary address
      // to initialize entropy in order to use substrate
      const tempAddress = account || accounts[0].address
      const entropy: Entropy = await loadEntropy(tempAddress, opts.endpoint)
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
