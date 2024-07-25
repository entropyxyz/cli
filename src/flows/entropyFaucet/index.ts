import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto'
import { getSelectedAccount, print } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import Entropy from "@entropyxyz/sdk"
import FaucetSigner from "./signer"
import { getBalance } from '../balance/balance'
import { viewPrograms } from '../user-program-management/view'
import { EntropyLogger } from 'src/common/logger'

const faucetProgramModKey = '5GWamxgW4XWcwGsrUynqnFq2oNZPqNXQhMDfgNH9xNsg2Yj7'
const programHash = '0x12af0bd1f2d91f12e34aeb07ea622c315dbc3c2bdc1e25ff98c23f1e61106c77'

// check verifying key has the balance and proper program hash
// only the faucet program should be on the key
async function faucetSignAndSend (call: any, api: any, entropy: Entropy, amount: number, senderAddress: string, chosenVerifyingKey: any): Promise<any> {
  const faucetSigner = new FaucetSigner(api.registry, entropy, amount, chosenVerifyingKey)

  const sig = await call.signAsync(senderAddress, {
    signer: faucetSigner,
  });
  return new Promise((resolve, reject) => {
    sig.send(({ status, dispatchError }: any) => {
      // status would still be set, but in the case of error we can shortcut
      // to just check it (so an error would indicate InBlock or Finalized)
      if (dispatchError) {
        let msg: string
        if (dispatchError.isModule) {
          // for module errors, we have the section indexed, lookup
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          const { documentation, method, section } = decoded;

          msg = `${section}.${method}: ${documentation.join(' ')}`
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          msg = dispatchError.toString()
        }
        return reject(Error(msg))
      }
      if (status.isFinalized) resolve(status)
    })
  })
}

async function getRandomFaucet (entropy: Entropy, previousVerifyingKeys: string[] = []) {
  const modifiableKeys = await entropy.substrate.query.registry.modifiableKeys(faucetProgramModKey)
  const verifyingKeys = JSON.parse(JSON.stringify(modifiableKeys.toJSON()))
  // Choosing one of the 5 verifiying keys at random to be used as the faucet sender
  let chosenVerifyingKey = verifyingKeys[Math.floor(Math.random() * (verifyingKeys as Array<string>).length)]
  if (previousVerifyingKeys.length && previousVerifyingKeys.includes(chosenVerifyingKey)) {
    const filteredVerifyingKeys = verifyingKeys.filter((key: string) => !previousVerifyingKeys.includes(key))
    chosenVerifyingKey = filteredVerifyingKeys[Math.floor(Math.random() * filteredVerifyingKeys.length)]
  }
  const hashedKey = blake2AsHex(chosenVerifyingKey)
  const faucetAddress = encodeAddress(hashedKey, 42).toString()

  return { chosenVerifyingKey, faucetAddress } 
}

async function sendMoney (
  entropy: Entropy,
  {
    amount,
    addressToSendTo,
    faucetAddress,
    chosenVerifyingKey 
  }: { 
    amount: string,
    addressToSendTo: string,
    faucetAddress: string,
    chosenVerifyingKey: string
  }
) {
  // check balance of faucet address
  const balance = await getBalance(entropy, faucetAddress)
  if (balance <= 0) throw new Error('FundsError: Faucet Account does not have funds')
  // check verifying key for only one program matching the program hash
  const programs = await viewPrograms(entropy, { verifyingKey: chosenVerifyingKey })
  if (programs.length) {
    if (programs.length > 1) throw new Error('ProgramsError: Faucet Account has too many programs attached, expected less')
    if (programs.length === 1 && programs[0].program_pointer !== programHash) {
      throw new Error('ProgramsError: Faucet Account does not possess Faucet program')
    }
  } else {
    throw new Error('ProgramsError: Faucet Account has no programs attached')
  }

  const transfer = entropy.substrate.tx.balances.transferAllowDeath(addressToSendTo, BigInt(amount));
  const transferStatus = await faucetSignAndSend(transfer, entropy.substrate, entropy, parseInt(amount), faucetAddress, chosenVerifyingKey )
  if (transferStatus.isFinalized) return
}

let chosenVerifyingKeys = []
export async function entropyFaucet ({ accounts, selectedAccount: selectedAccountAddress }, options, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'ENTROPY_FAUCET'
  let faucetAddress
  let chosenVerifyingKey
  let entropy: Entropy
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

    ({ chosenVerifyingKey, faucetAddress } = await getRandomFaucet(entropy, chosenVerifyingKeys))

    await sendMoney(entropy, { amount, addressToSendTo: selectedAccountAddress, faucetAddress, chosenVerifyingKey })
    // reset chosen keys after successful transfer
    chosenVerifyingKeys = []
    print(`Account: ${selectedAccountAddress} has been successfully funded with ${parseInt(amount).toLocaleString('en-US')} BITS`)
  } catch (error) {
    logger.error('Error issuing funds through faucet', error)
    chosenVerifyingKeys.push(chosenVerifyingKey)
    // Check for funds or program errors and retry faucet
    if (error.message.includes('FundsError') || error.message.includes('ProgramsError')) {
      await entropyFaucet({ accounts, selectedAccount: selectedAccountAddress }, options, logger)
    } else {
      console.error('ERR::', error.message, chosenVerifyingKeys)
    }
  }
}