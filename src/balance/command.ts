import { Command } from "commander";
// @ts-expect-error
import { createSubstrate, isValidSubstrateAddress } from '@entropyxyz/sdk/utils'
import { EntropyBalance } from "./main";
import { BalanceInfo } from "./types";
import { configOption, endpointOption, cliWrite } from "../common/utils-cli";
import { findAccountByAddressOrName, getTokenDetails, lilBitsToBits, round } from "../common/utils";
import * as config from "../config";
import { EntropyConfigAccount } from "src/config/types";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  // account can no longer be a required argument if a user wishes to
  // view the balances of all accounts
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('[account] <address|name>', [
      'The address an account address whose balance you want to query.',
      'Can also be the human-readable name of one of your accounts'
    ].join(' '))
    .option('-a, --all', 'Get balances for all admin accounts in the config')
    .addOption(configOption())
    .addOption(endpointOption())
    .action(async (account, opts) => {
      const substrate = createSubstrate(opts.endpoint)
      await substrate.isReadyOrError
      const { decimals, symbol } = await getTokenDetails(substrate)
      const toBits = (lilBits: number) => round(lilBitsToBits(lilBits, decimals))
      const { accounts } = await config.get(opts.config)
      if (opts.all) {
        // Balances for all admin accounts
        const addresses: string[] = accounts.map((acct: EntropyConfigAccount) => acct.address)
        const balances = await EntropyBalance.getBalances(substrate, addresses)
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
        let address = findAccountByAddressOrName(accounts, account)?.address
        if (!address && isValidSubstrateAddress(account)) {
          // provided account does not exist in the users config
          address = account
        } else {
          // account is either null or not a valid substrate address
          console.error(`Provided [account=${account}] is not a valid substrate address`)
          process.exit(1)
        }
        // Balance for singular account
        const balance = await EntropyBalance.getAnyBalance(substrate, address)
          .then(toBits)
        cliWrite({ account, balance, symbol })
      }
      // closing substrate
      await substrate.disconnect()
        .catch(err => console.error('Error closing connection', err.message))
      process.exit(0)
    })

  return balanceCommand
}
