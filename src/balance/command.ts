import { Command } from "commander";
import Entropy from "@entropyxyz/sdk";

import { EntropyBalance } from "./main";
import { configOption, endpointOption, loadEntropy, cliWrite } from "../common/utils-cli";
import { findAccountByAddressOrName } from "../common/utils";
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
      const entropy: Entropy = await loadEntropy({ account, ...opts })
      const BalanceService = new EntropyBalance(entropy, opts.endpoint)

      const { accounts } = await config.get(opts.config)
      const address = findAccountByAddressOrName(accounts, account)?.address

      const balance = await BalanceService.getBalance(address)
      cliWrite(`${balance.toLocaleString('en-US')} BITS`)
      process.exit(0)
    })

  return balanceCommand
}
