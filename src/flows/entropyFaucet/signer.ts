import Entropy from "@entropyxyz/sdk";
import type { Signer, SignerResult } from "@polkadot/api/types";
import { Registry, SignerPayloadJSON } from "@polkadot/types/types";
import { u8aToHex } from "@polkadot/util";
import { stripHexPrefix } from "../../common/utils";

let id = 0

export default class FaucetSigner implements Signer {
  readonly #registry: Registry
  readonly #entropy: Entropy
  readonly amount: number
  readonly chosenVerifyingKey: any

  constructor (
    registry: Registry,
    entropy: Entropy,
    amount: number,
    chosenVerifyingKey: any
  ) {
    this.#registry = registry
    this.#entropy = entropy
    this.amount = amount
    this.chosenVerifyingKey = chosenVerifyingKey
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    const raw = this.#registry.createType('ExtrinsicPayload', payload, {
      version: payload.version,
    });
    console.log({ payload, raw });
    
    const { block } = await this.#entropy.substrate.rpc.chain.getBlock()
    const header = { ...block.header.toJSON(), digest: { logs: [] } }

    const auxData = {
      // program aux data expecting header string to include escape characters, for some reason stringifying twice returns those characters
      header_string: JSON.stringify(header),
      // header_string: "{\"parentHash\":\"0x0000000000000000000000000000000000000000000000000000000000000000\",\"number\":\"0x0\",\"stateRoot\":\"0xbf547507d429b75e0f98286c2522aaa322499edd69ce9b1f577f9864aad969da\",\"extrinsicsRoot\":\"0x03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314\",\"digest\":{\"logs\":[]}}",
      genesis_hash: stripHexPrefix(payload.genesisHash),
      spec_version: 100,
      transaction_version: 6,
      nonce: 0,
      mortality: parseInt(payload.era),
      string_account_id: this.#entropy.keyring.accounts.registration.address,
      amount: this.amount
    }
    console.log({auxData, vk: this.chosenVerifyingKey})
    const signature = await this.#entropy.sign({
      sigRequestHash: raw.toHex(),
      hash: {custom: 0},
      auxiliaryData: [auxData],
      verifyingKeyOverwrite: this.chosenVerifyingKey
    })
    console.log({signature: u8aToHex(signature)})
    return { id: id++, signature: u8aToHex(signature) };
  }
}