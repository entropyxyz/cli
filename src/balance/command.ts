import { Command } from "commander";
import Entropy from "@entropyxyz/sdk";

import { EntropyBalance } from "./main";
import { BalanceInfo } from "./types";
import { endpointOption, cliWrite, loadEntropy } from "../common/utils-cli";
import { findAccountByAddressOrName, getTokenDetails, nanoBitsToBits, round } from "../common/utils";
import * as config from "../config";
import { EntropyConfigAccount } from "src/config/types";

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
        return balanceCommand.help()
      }

      const balanceService = new EntropyBalance(entropy, opts.endpoint)
      const { decimals, symbol } = await getTokenDetails(entropy)
      const toBits = (nanoBits) => round(nanoBitsToBits(nanoBits, decimals))

      if (opts.all) {
        // Balances for all admin accounts
        const addresses: string[] = accounts.map((acct: EntropyConfigAccount) => acct.address)
        const balances = await balanceService.getBalances(addresses)
          .then((infos: BalanceInfo[]) => {
            return infos.map(info => {
              return {
                account: info.address,
                balance: info.balance !== undefined
                  ? toBits(info.balance)
                  : info.error,
                symbol
              }
            })
          })
        cliWrite(balances)
      } else {
        // Balance for singular account
        const address = findAccountByAddressOrName(accounts, account)?.address
        const balance = await balanceService.getBalance(address)
          .then(toBits)
        cliWrite({ account, balance, symbol })
      }
      process.exit(0)
    })

  return balanceCommand
}
