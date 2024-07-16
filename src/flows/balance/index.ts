import { EntropyLogger } from "src/common/logger";
import { initializeEntropy } from "../../common/initializeEntropy"
import { print, getSelectedAccount } from "../../common/utils"
import { getBalance } from "./balance";

// TO-DO setup flow method to provide options to allow users to select account,
// use external address, or get balances for all accounts in config
export async function checkBalance ({ accounts, selectedAccount: selectedAccountAddress }, options, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'CHECK_BALANCE'
  const { endpoint } = options
  logger.debug(`endpoint: ${endpoint}`, FLOW_CONTEXT)
  
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  logger.log(selectedAccount, FLOW_CONTEXT)
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint });
  const accountAddress = selectedAccountAddress
  const freeBalance = await getBalance(entropy, accountAddress)
  print(`Address ${accountAddress} has a balance of: ${freeBalance.toLocaleString('en-US')} BITS`)
}
