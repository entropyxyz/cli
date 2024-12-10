import { Command } from "commander";
import Entropy from "@entropyxyz/sdk";

import { EntropyBalance } from "./main";
import { configOption, endpointOption, cliWrite } from "../common/utils-cli";
import { findAccountByAddressOrName, getTokenDetails, nanoBitsToBits, round } from "../common/utils";
import { loadEntropyCli } from "../common/load-entropy"
import * as config from "../config";

export function entropyBalanceCommand () {
  const balanceCommand = new Command('balance')
  balanceCommand
    .description('Command to retrieive the balance of an account on the Entropy Network')
    .argument('account <address|name>', [
      'The address an account address whose balance you want to query.',
      'Can also be the human-readable name of one of your accounts'
    ].join(' '))
    .addOption(configOption())
    .addOption(endpointOption())
    .action(async (account, opts) => {
      const entropy: Entropy = await loadEntropyCli({ account, ...opts })
      const balanceService = new EntropyBalance(entropy, opts.endpoint)
      const { decimals, symbol } = await getTokenDetails(entropy)

      const { accounts } = await config.get(opts.config)
      const address = findAccountByAddressOrName(accounts, account)?.address

      const nanoBalance = await balanceService.getBalance(address)
      const balance = round(nanoBitsToBits(nanoBalance, decimals))
      cliWrite({ balance, symbol })
      process.exit(0)
    })

  return balanceCommand
}
