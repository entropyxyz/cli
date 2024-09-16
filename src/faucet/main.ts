import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";
import { blake2AsHex, encodeAddress } from "@polkadot/util-crypto";
import { FAUCET_PROGRAM_MOD_KEY, TESTNET_PROGRAM_HASH } from "./utils";
import { EntropyBalance } from "src/balance/main";
import { viewPrograms } from "src/flows/programs/view";
import FaucetSigner from "./helpers/signer";

const FLOW_CONTEXT = 'ENTROPY-FAUCET'

export class EntropyFaucet extends EntropyBase {
  constructor(entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  async faucetSignAndSend (call: any, amount: number, senderAddress: string, chosenVerifyingKey: any): Promise<any> {
    const api = this.entropy.substrate
    const faucetSigner = new FaucetSigner(api.registry, this.entropy, amount, chosenVerifyingKey)
  
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
            // @ts-ignore
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

  async getRandomFaucet (previousVerifyingKeys: string[] = [], programModKey = FAUCET_PROGRAM_MOD_KEY) {
    const modifiableKeys = await this.entropy.substrate.query.registry.modifiableKeys(programModKey)
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

  async sendMoney (
    {
      amount,
      addressToSendTo,
      faucetAddress,
      chosenVerifyingKey,
      faucetProgramPointer = TESTNET_PROGRAM_HASH
    }: { 
      amount: string,
      addressToSendTo: string,
      faucetAddress: string,
      chosenVerifyingKey: string,
      faucetProgramPointer: string
    }
  ): Promise<any> {
    const BalanceService = new EntropyBalance(this.entropy, this.endpoint)
    // check balance of faucet address
    const balance = await BalanceService.getBalance(faucetAddress)
    if (balance <= 0) throw new Error('FundsError: Faucet Account does not have funds')
    // check verifying key for only one program matching the program hash
    const programs = await viewPrograms(this.entropy, { verifyingKey: chosenVerifyingKey })
    if (programs.length) {
      if (programs.length > 1) throw new Error('ProgramsError: Faucet Account has too many programs attached, expected less')
      if (programs.length === 1 && programs[0].program_pointer !== faucetProgramPointer) {
        throw new Error('ProgramsError: Faucet Account does not possess Faucet program')
      }
    } else {
      throw new Error('ProgramsError: Faucet Account has no programs attached')
    }
  
    const transfer = this.entropy.substrate.tx.balances.transferAllowDeath(addressToSendTo, BigInt(amount));
    const transferStatus = await this.faucetSignAndSend(transfer, parseInt(amount), faucetAddress, chosenVerifyingKey)
    if (transferStatus.isFinalized) return transferStatus
  }
}