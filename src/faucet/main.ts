import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";
import { blake2AsHex, encodeAddress } from "@polkadot/util-crypto";
import { FAUCET_PROGRAM_MOD_KEY, FAUCET_PROGRAM_POINTER } from "./utils";
import { EntropyBalance } from "src/balance/main";
import { EntropyProgram } from "src/program/main";
import FaucetSigner from "./helpers/signer";
import { SendMoneyParams } from "./types";
import { formatDispatchError } from "src/common/utils";

const FLOW_CONTEXT = 'ENTROPY-FAUCET'

function pickRandom (items: string[]): string {
  const i = Math.floor(Math.random() * items.length)
  return items[i]
}

export class EntropyFaucet extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  // Method used to sign and send the transfer request (transfer request = call argument) using the custom signer
  // created to overwrite how we sign the payload that is sent up chain
  async faucetSignAndSend (call: any, amount: number, senderAddress: string, chosenVerifyingKey: any): Promise<any> {
    // QUESTION: call has "amount" encoded, but we also take amount in again... why?
    const api = this.entropy.substrate
    const faucetSigner = new FaucetSigner(api.registry, this.entropy, amount, chosenVerifyingKey)

    const sig = await call.signAsync(senderAddress, { signer: faucetSigner })

    return new Promise((resolve, reject) => {
      sig.send(({ status, dispatchError }: any) => {
        // status would still be set, but in the case of error we can shortcut
        // to just check it (so an error would indicate InBlock or Finalized)
        if (dispatchError) {
          const error = formatDispatchError(this.entropy, dispatchError)
          return reject(error)
        }
        if (status.isFinalized) resolve(status)
      })
    })
  }

  async getAllFaucetVerifyingKeys (programModKey = FAUCET_PROGRAM_MOD_KEY) {
    return this.entropy.substrate.query.registry.modifiableKeys(programModKey)
      .then(res => res.toJSON())
  }

  // To handle overloading the individual faucet, multiple faucet accounts have been generated, and here is
  // where we choose one of those faucet's at random
  getRandomFaucet (previousVerifyingKeys: string[] = [], allVerifyingKeys: string[] = []) {
    if (allVerifyingKeys.length === previousVerifyingKeys.length) {
      throw new Error('FaucetError: There are no more faucets to choose from')
    }

    const unusedVerifyingKeys = allVerifyingKeys.filter((key) => !previousVerifyingKeys.includes(key))
    const chosenVerifyingKey = pickRandom(unusedVerifyingKeys)
    const hashedKey = blake2AsHex(chosenVerifyingKey)
    const faucetAddress = encodeAddress(hashedKey, 42).toString()

    return { chosenVerifyingKey, faucetAddress } 
  }

  async sendMoney (
    {
      amount,
      addressToSendTo,
      faucetAddress,
      chosenVerifyingKey,
      faucetProgramPointer = FAUCET_PROGRAM_POINTER
    }: SendMoneyParams
  ): Promise<any> {
    const balanceService = new EntropyBalance(this.entropy, this.endpoint)
    const programService = new EntropyProgram(this.entropy, this.endpoint)

    // check balance of faucet address
    const balance = await balanceService.getBalance(faucetAddress)
    if (balance <= 0) throw new Error('FundsError: Faucet Account does not have funds')

    // check verifying key has ONLY the exact program installed
    const programs = await programService.list({ verifyingKey: chosenVerifyingKey })
    if (programs.length === 1) {
      if (programs[0].program_pointer !== faucetProgramPointer) {
        throw new Error('ProgramsError: Faucet Account does not have the correct faucet program')
      }
    }
    else {
      throw new Error(
        `ProgramsError: Faucet Account has ${programs.length} programs attached, expected 1.`
      )
    }

    const transfer = this.entropy.substrate.tx.balances.transferAllowDeath(addressToSendTo, BigInt(amount));
    const transferStatus = await this.faucetSignAndSend(transfer, parseInt(amount), faucetAddress, chosenVerifyingKey)
    if (transferStatus.isFinalized) return transferStatus
  }
}
