import Entropy from "@entropyxyz/sdk";
import type { Signer, SignerResult } from "@polkadot/api/types";
import { Registry, SignerPayloadJSON } from "@polkadot/types/types";
import { u8aToHex } from "@polkadot/util";
import { stripHexPrefix } from "../../common/utils";
import { blake2AsHex, decodeAddress, encodeAddress, signatureVerify } from "@polkadot/util-crypto";

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

  async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    // toU8a(true) is important as it strips the scale encoding length prefix from the payload
    // without it transactions will fail
    // ref: https://github.com/polkadot-js/api/issues/4446#issuecomment-1013213962
    const raw = this.#registry.createType('ExtrinsicPayload', payload, {
      version: payload.version,
    }).toU8a(true);

    const auxData = {
      spec_version: 100,
      transaction_version: 6,
      string_account_id: this.#entropy.keyring.accounts.registration.address,
      amount: this.amount
    }
    
    const signature = await this.#entropy.sign({
      sigRequestHash: u8aToHex(raw),
      // @ts-ignore
      hash: {custom: 0},
      auxiliaryData: [auxData],
      signatureVerifyingKey: this.chosenVerifyingKey
    })

    let sigHex = u8aToHex(signature);
    // the 02 prefix is needed for signature type edcsa (00 = ed25519, 01 = sr25519, 02 = ecdsa)
    // ref: https://github.com/polkadot-js/tools/issues/175#issuecomment-767496439
    sigHex = `0x02${stripHexPrefix(sigHex)}`

    const hashedKey = blake2AsHex(this.chosenVerifyingKey)
    const faucetAddress = encodeAddress(hashedKey)
    const publicKey = decodeAddress(faucetAddress);

    const hexPublicKey = u8aToHex(publicKey);

    const signatureValidation = signatureVerify(u8aToHex(raw), sigHex, hexPublicKey)

    if (signatureValidation.isValid) {
      return { id: id++, signature: sigHex }
    } else {
      throw new Error('FaucetSignerError: Signature is not valid')
    }
  }
}