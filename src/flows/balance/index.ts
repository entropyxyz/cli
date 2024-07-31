import { EntropyLogger } from "src/common/logger";
import { initializeEntropy } from "../../common/initializeEntropy"
import { print, getSelectedAccount } from "../../common/utils"
import { BalanceCommand } from "src/balance/command";

// TO-DO: setup flow method to provide options to allow users to select account,
// use external address, or get balances for all accounts in config
// TO-DO: move entropy initialization and account retrieval to a shared container
// should remove the need to initialize entropy every time
export async function checkBalance ({ accounts, selectedAccount: selectedAccountAddress }, options, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'CHECK_BALANCE'
  const { endpoint } = options
  logger.debug(`endpoint: ${endpoint}`, FLOW_CONTEXT)
  
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  logger.log(selectedAccount, FLOW_CONTEXT)
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint });
  const balanceController = new BalanceCommand(entropy, endpoint)
  const accountAddress = selectedAccountAddress
  const freeBalanceString = await balanceController.getBalance(accountAddress)
  print(`Address ${accountAddress} has a balance of: ${freeBalanceString}`)
}
