import Entropy from "@entropyxyz/sdk"
import yoctoSpinner from 'yocto-spinner';
import { EntropyLogger } from '../common/logger'
import { FAUCET_PROGRAM_POINTER } from "./utils"
import { EntropyFaucet } from "./main"
import { bitsToLilBits, getTokenDetails, print } from "src/common/utils"

let chosenVerifyingKeys = []
// Sending only 1e10 lilBITS does not allow user's to register after receiving funds
// there are limits in place to ensure user's are leftover with a certain balance in their accounts
// increasing amount send here, will allow user's to register right away

// context for logging file
const FLOW_CONTEXT = 'ENTROPY_FAUCET_INTERACTION'
const SPINNER_TEXT =  'Funding account…'
const faucetSpinner = yoctoSpinner()
export async function entropyFaucet (entropy: Entropy, options, logger: EntropyLogger) {
  faucetSpinner.text = SPINNER_TEXT
  if (faucetSpinner.isSpinning) {
    faucetSpinner.stop()
  }
  const { endpoint } = options
  if (!entropy.registrationManager.signer.pair) {
    throw new Error("Keys are undefined")
  }

  const { decimals } = await getTokenDetails(entropy)
  const amount = bitsToLilBits(2, decimals)
  const faucetService = new EntropyFaucet(entropy, endpoint)
  const verifyingKeys = await faucetService.getAllFaucetVerifyingKeys()
  // @ts-expect-error
  return sendMoneyFromRandomFaucet(entropy, options.endpoint, verifyingKeys, amount.toString(), logger)
}

// Method that takes in the initial list of verifying keys (to avoid multiple calls to the rpc) and recursively retries each faucet until
// a successful transfer is made
async function sendMoneyFromRandomFaucet (entropy: Entropy, endpoint: string, verifyingKeys: string[], amount: string, logger: EntropyLogger) {
  if (!faucetSpinner.isSpinning) {
    faucetSpinner.start()
  }
  const faucetService = new EntropyFaucet(entropy, endpoint)
  const selectedAccountAddress = entropy.keyring.accounts.registration.address
  let chosenVerifyingKey: string
  try {
    const randomFaucet = faucetService.getRandomFaucet(chosenVerifyingKeys, verifyingKeys)
    chosenVerifyingKey = randomFaucet.chosenVerifyingKey
    const { faucetAddress } = randomFaucet
    await faucetService.sendMoney({ amount, addressToSendTo: selectedAccountAddress, faucetAddress, chosenVerifyingKey, faucetProgramPointer: FAUCET_PROGRAM_POINTER })
    // reset chosen keys after successful transfer
    if (faucetSpinner.isSpinning) faucetSpinner.stop()
    chosenVerifyingKeys = []
    print(`Account: ${selectedAccountAddress} has been successfully funded with ${parseInt(amount).toLocaleString('en-US')} BITS`)
  } catch (error) {
    logger.error('Error issuing funds through faucet', error, FLOW_CONTEXT)
    chosenVerifyingKeys.push(chosenVerifyingKey)
    if (error.message.includes('FaucetError')) {
      faucetSpinner.text = 'Faucet has failed...'
      if (faucetSpinner.isSpinning) {
        faucetSpinner.stop()
      }
      console.error('ERR::', error.message)
      return
    } else {
      // Check for non faucet errors (FaucetError) and retry faucet
      await sendMoneyFromRandomFaucet(entropy, endpoint, verifyingKeys, amount, logger)
    }
  }
}
