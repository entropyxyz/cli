import Entropy from "@entropyxyz/sdk";
import type { Signer, SignerResult } from "@polkadot/api/types";
import { Registry, SignerPayloadJSON, SignerPayloadRaw } from "@polkadot/types/types";
import { u8aConcat, u8aToHex, u8aWrapBytes } from "@polkadot/util";
import { stripHexPrefix } from "../../common/utils";
import { blake2AsHex, decodeAddress, encodeAddress, signatureVerify } from "@polkadot/util-crypto";
import { methods } from "@substrate/txwrapper-polkadot";

let id = 0
export default class FaucetSigner implements Signer {
  readonly #registry: Registry
  readonly #entropy: Entropy
  readonly amount: number
  readonly chosenVerifyingKey: any
  readonly globalTest: any

  constructor (
    registry: Registry,
    entropy: Entropy,
    amount: number,
    chosenVerifyingKey: any,
  ) {
    this.#registry = registry
    this.#entropy = entropy
    this.amount = amount
    this.chosenVerifyingKey = chosenVerifyingKey
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    const raw = this.#registry.createType('ExtrinsicPayload', payload, {
      version: payload.version,
    }).toU8a(true);
    console.log({ payload: payload });

    const auxData = {
      spec_version: 100,
      transaction_version: 6,
      string_account_id: this.#entropy.keyring.accounts.registration.address,
      amount: this.amount
    }
    console.log({auxData, vk: this.chosenVerifyingKey})
    const signature = await this.#entropy.sign({
      sigRequestHash: u8aToHex(raw),
      hash: {custom: 0},
      auxiliaryData: [auxData],
      verifyingKeyOverwrite: this.chosenVerifyingKey
    })
    // const sig = 
    let sigHex = u8aToHex(signature);
    sigHex = `0x02${stripHexPrefix(sigHex)}`
    console.log({sigHex})
    // const signature_test = "0x02c80347ab124efac91a73b60b17b306b8e24c902e5f3aaf66dc1077ddc7993b660517ab74a501cba14020cd7afb3dc988c2956ba888d07c83221b539188bc7d5a00"
    // const sig = this.#registry.createType('EcdsaSignature', signature).toU8a(true)
    // let submitable = this.#registry.createTypeUnsafe('ExtrinsicSignature', [sigHex]).toU8a(true)
    // console.log({submitable, human: submitable.toHuman()})
    const hashedKey = blake2AsHex(this.chosenVerifyingKey)
    console.log('hashed key', hashedKey);
    const faucetAddress = encodeAddress(hashedKey)
    // signatureVerify()

    const publicKey = decodeAddress(faucetAddress);
    const hexPublicKey = u8aToHex(publicKey);
    console.log("test valid", signatureVerify(u8aToHex(raw), sigHex, hexPublicKey))
    // console.log({signature: signature, realSig: u8aToHex(signature)})
    return { id: id++, signature: sigHex };
  }
}


//0x55bd020bdbbdc02de34e915effc9b18a99002f4c29f64e22e8dcbb69e722ea6c28e1bb53b9484063fbbfd205e49dcc1f620929f520c9c4c3695150f05a28f52a01
//0x58ec45b3f07577874aa0f45523b09aefdac1c25203235be473fa3ed412d081b540099ef34acc67509f3f23336c65dc5c03bfb09bdbc8b84b2bef2f25f4cdac9f00