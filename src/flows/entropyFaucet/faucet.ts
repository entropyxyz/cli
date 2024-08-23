// check verifying key has the balance and proper program hash

import Entropy from "@entropyxyz/sdk";
import { blake2AsHex, encodeAddress } from "@polkadot/util-crypto";
import { getBalance } from "../balance/balance";
import { viewPrograms } from "../programs/view";
import FaucetSigner from "./signer";
import { FAUCET_PROGRAM_MOD_KEY, PROGRAM_HASH } from "./constants";

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

export async function getRandomFaucet (entropy: Entropy, previousVerifyingKeys: string[] = []) {
  const modifiableKeys = await entropy.substrate.query.registry.modifiableKeys(FAUCET_PROGRAM_MOD_KEY)
  const verifyingKeys = JSON.parse(JSON.stringify(modifiableKeys.toJSON()))
  // Choosing one of the 5 verifiying keys at random to be used as the faucet sender
  if (verifyingKeys.length === previousVerifyingKeys.length) {
    throw new Error('FaucetError: There are no more faucets to choose from')
  }
  let chosenVerifyingKey = verifyingKeys[Math.floor(Math.random() * verifyingKeys.length)]
  if (previousVerifyingKeys.length && previousVerifyingKeys.includes(chosenVerifyingKey)) {
    const filteredVerifyingKeys = verifyingKeys.filter((key: string) => !previousVerifyingKeys.includes(key))
    chosenVerifyingKey = filteredVerifyingKeys[Math.floor(Math.random() * filteredVerifyingKeys.length)]
  }
  const hashedKey = blake2AsHex(chosenVerifyingKey)
  const faucetAddress = encodeAddress(hashedKey, 42).toString()

  return { chosenVerifyingKey, faucetAddress, verifyingKeys } 
}

export async function sendMoney (
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
): Promise<any> {
  // check balance of faucet address
  const balance = await getBalance(entropy, faucetAddress)
  if (balance <= 0) throw new Error('FundsError: Faucet Account does not have funds')
  // check verifying key for only one program matching the program hash
  const programs = await viewPrograms(entropy, { verifyingKey: chosenVerifyingKey })
  if (programs.length) {
    if (programs.length > 1) throw new Error('ProgramsError: Faucet Account has too many programs attached, expected less')
    if (programs.length === 1 && programs[0].program_pointer !== PROGRAM_HASH) {
      throw new Error('ProgramsError: Faucet Account does not possess Faucet program')
    }
  } else {
    throw new Error('ProgramsError: Faucet Account has no programs attached')
  }

  const transfer = entropy.substrate.tx.balances.transferAllowDeath(addressToSendTo, BigInt(amount));
  const transferStatus = await faucetSignAndSend(transfer, entropy.substrate, entropy, parseInt(amount), faucetAddress, chosenVerifyingKey )
  if (transferStatus.isFinalized) return transferStatus
}