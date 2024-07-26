import { getSelectedAccount, print } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import Entropy from "@entropyxyz/sdk"
import { EntropyLogger } from 'src/common/logger'
import { getRandomFaucet, sendMoney } from "./faucet"

let chosenVerifyingKeys = []
export async function entropyFaucet ({ accounts, selectedAccount: selectedAccountAddress }, options, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'ENTROPY_FAUCET'
  let faucetAddress
  let chosenVerifyingKey
  let entropy: Entropy
  let verifyingKeys: string[] = []
  const amount = "10000000000"
  const { endpoint } = options
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  logger.log(`selectedAccount::`, FLOW_CONTEXT)
  logger.log(selectedAccount, FLOW_CONTEXT)
  try {
    // @ts-ignore (see TODO on aliceAccount)
    entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint })

    if (!entropy.registrationManager.signer.pair) {
      throw new Error("Keys are undefined")
    }

    ({ chosenVerifyingKey, faucetAddress, verifyingKeys } = await getRandomFaucet(entropy, chosenVerifyingKeys))

    await sendMoney(entropy, { amount, addressToSendTo: selectedAccountAddress, faucetAddress, chosenVerifyingKey })
    // reset chosen keys after successful transfer
    chosenVerifyingKeys = []
    print(`Account: ${selectedAccountAddress} has been successfully funded with ${parseInt(amount).toLocaleString('en-US')} BITS`)
  } catch (error) {
    logger.error('Error issuing funds through faucet', error, FLOW_CONTEXT)
    chosenVerifyingKeys.push(chosenVerifyingKey)
    if (error.message.includes('FaucetError') || chosenVerifyingKeys.length === verifyingKeys.length) {
      console.error('ERR::', error.message)
      return
    } else {
      // Check for non faucet errors (FaucetError) and retry faucet
      await entropyFaucet({ accounts, selectedAccount: selectedAccountAddress }, options, logger)
    }
  }
}