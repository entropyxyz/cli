import Entropy from "@entropyxyz/sdk"
import { EntropyLogger } from '../common/logger'
import { TESTNET_PROGRAM_HASH } from "./utils"
import { EntropyFaucet } from "./main"
import { print } from "src/common/utils"

let chosenVerifyingKeys = []
export async function entropyFaucet (entropy: Entropy, options, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'ENTROPY_FAUCET'
  let faucetAddress
  let chosenVerifyingKey
  let verifyingKeys: string[] = []
  const amount = "10000000000"
  const { endpoint } = options
  const selectedAccountAddress = entropy.keyring.accounts.registration.address
  try {
    const FaucetService = new EntropyFaucet(entropy, endpoint)
    if (!entropy.registrationManager.signer.pair) {
      throw new Error("Keys are undefined")
    }

    ({ chosenVerifyingKey, faucetAddress, verifyingKeys } = await FaucetService.getRandomFaucet(chosenVerifyingKeys))
    await FaucetService.sendMoney({ amount, addressToSendTo: selectedAccountAddress, faucetAddress, chosenVerifyingKey, faucetProgramPointer: TESTNET_PROGRAM_HASH })
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
      await entropyFaucet(entropy, options, logger)
    }
  }
}