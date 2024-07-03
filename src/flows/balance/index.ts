import { EntropyLogger } from "src/common/logger";
import { initializeEntropy } from "../../common/initializeEntropy"
import { print, getSelectedAccount, replacer } from "../../common/utils"
import { getBalance } from "./balance";

// TO-DO setup flow method to provide options to allow users to select account,
// use external address, or get balances for all accounts in config
export async function checkBalance ({ accounts, selectedAccount: selectedAccountAddress }, options) {
  const { endpoint } = options
  const logger = new EntropyLogger('TUI:: checkBalance', endpoint)
  logger.debug(`endpoint: ${endpoint}`)
  
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  logger.log(`selected account: ${JSON.stringify(selectedAccount, replacer)}`)
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint });
  const accountAddress = selectedAccountAddress
  const freeBalance = await getBalance(entropy, accountAddress)
  print(`Address ${accountAddress} has a balance of: ${freeBalance.toLocaleString('en-US')} BITS`)
}
