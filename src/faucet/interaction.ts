import Entropy from "@entropyxyz/sdk"
import { EntropyLogger } from '../common/logger'
import { TESTNET_PROGRAM_HASH } from "./utils"
import { EntropyFaucet } from "./main"
import { print } from "src/common/utils"

let chosenVerifyingKeys = []
// Sending only 1e10 BITS does not allow user's to register after receiving funds
// there are limits in place to ensure user's are leftover with a certain balance in their accounts
// increasing amount send here, will allow user's to register right away
const amount = "20000000000"
// context for logging file
const FLOW_CONTEXT = 'ENTROPY_FAUCET_INTERACTION'
export async function entropyFaucet (entropy: Entropy, options, logger: EntropyLogger) {
  const { endpoint } = options
  if (!entropy.registrationManager.signer.pair) {
    throw new Error("Keys are undefined")
  }
  const faucetService = new EntropyFaucet(entropy, endpoint)
  const verifyingKeys = await faucetService.getAllFaucetVerifyingKeys()
  // @ts-expect-error
  return sendMoneyFromRandomFaucet(entropy, options.endpoint, verifyingKeys, logger)
}

// Method that takes in the initial list of verifying keys (to avoid multiple calls to the rpc) and recursively retries each faucet until
// a successful transfer is made
async function sendMoneyFromRandomFaucet (entropy: Entropy, endpoint: string, verifyingKeys: string[], logger: EntropyLogger) {
  const faucetService = new EntropyFaucet(entropy, endpoint)
  const selectedAccountAddress = entropy.keyring.accounts.registration.address
  const { chosenVerifyingKey, faucetAddress } = faucetService.getRandomFaucet(chosenVerifyingKeys, verifyingKeys)
  try {
    await faucetService.sendMoney({ amount, addressToSendTo: selectedAccountAddress, faucetAddress, chosenVerifyingKey, faucetProgramPointer: TESTNET_PROGRAM_HASH })
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
      await sendMoneyFromRandomFaucet(entropy, endpoint, verifyingKeys, logger)
    }
  }
}