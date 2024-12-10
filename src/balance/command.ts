import { Command } from "commander";
import Entropy from "@entropyxyz/sdk";

import { EntropyBalance } from "./main";
import { BalanceInfo } from "./types";
import { configOption, endpointOption, cliWrite } from "../common/utils-cli";
import { findAccountByAddressOrName, getTokenDetails, nanoBitsToBits, round } from "../common/utils";
import { loadEntropyCli } from "../common/load-entropy"
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
    .addOption(configOption())
    .action(async (account, opts) => {
      const { accounts } = await config.get(opts.config)

      let entropy: Entropy
      if (!account && opts.all) {
        const tempAddress = accounts[0].address
        entropy = await loadEntropyCli({ account: tempAddress, ...opts })
      } else if (account && !opts.all) {
        entropy = await loadEntropyCli({ account, ...opts })
      } else {
        return balanceCommand.help()
      }

      const balanceService = new EntropyBalance(entropy, opts.endpoint)
      const { decimals, symbol } = await getTokenDetails(entropy)
      const toBits = (nanoBits: number) => round(nanoBitsToBits(nanoBits, decimals))

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
