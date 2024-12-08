import { Command } from "commander";
// @ts-expect-error
import { createSubstrate, isValidSubstrateAddress } from '@entropyxyz/sdk/utils'
import { EntropyBalance } from "./main";
import { endpointOption, cliWrite } from "../common/utils-cli";
import { findAccountByAddressOrName, getTokenDetails, nanoBitsToBits, round } from "../common/utils";
import * as config from "../config";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('<account>', 'Get the balance of your accounts (by alias or address) or any SS58 address')
    .addOption(endpointOption())
    .action(async (account, opts) => {
      const substrate = createSubstrate(opts.endpoint)
      await substrate.isReadyOrError
      const { decimals, symbol } = await getTokenDetails(substrate)

      const { accounts } = await config.get()
      let address = findAccountByAddressOrName(accounts, account)?.address
      if (!address && isValidSubstrateAddress(account)) {
        // provided account does not exist in the users config
        address = account
      } else {
        // account is either null or not a valid substrate address
        console.error(`Provided [account=${account}] is not a valid substrate address`)
        process.exit(1)
      }
      const nanoBalance = await EntropyBalance.getAnyBalance(substrate, address)
      const balance = round(nanoBitsToBits(nanoBalance, decimals))
      cliWrite({ account, balance, symbol })
      // closing substrate
      await substrate.disconnect()
        .catch(err => console.error('Error closing connection', err.message))
      process.exit(0)
    })

  return balanceCommand
}
