import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto'
import { debug, getSelectedAccount } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import Entropy from "@entropyxyz/sdk"
import FaucetSigner from "./signer"

const faucetProgramModKey = '5GWamxgW4XWcwGsrUynqnFq2oNZPqNXQhMDfgNH9xNsg2Yj7'

async function faucetSignAndSend (call: any, api: any, entropy: Entropy, amount: number, senderAddress: string, chosenVerifyingKey: any) {
  const faucetSigner = new FaucetSigner(api.registry, entropy, amount, chosenVerifyingKey)
  await call.signAsync(senderAddress, {
    signer: faucetSigner,
  });
}

export async function entropyFaucet ({ accounts, selectedAccount: selectedAccountAddress }, options) {
  const { endpoint } = options
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  debug('selectedAccount', selectedAccount)

  // @ts-ignore (see TODO on aliceAccount)
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint })

  if (!entropy.registrationManager.signer.pair) {
    throw new Error("Keys are undefined")
  }

  const amount = "10000000000"
  const modifiableKeys = await entropy.substrate.query.registry.modifiableKeys(faucetProgramModKey)
  const verifyingKeys = modifiableKeys.toHuman()
  // Choosing one of the 5 verifiying keys at random to be used as the faucet sender
  const chosenVerifyingKey = verifyingKeys[Math.floor(Math.random() * (verifyingKeys as Array<string>).length)]
  console.log('chosen key', chosenVerifyingKey);
  const hashedKey = blake2AsHex(chosenVerifyingKey)
  console.log('hashed key', hashedKey);
  const faucetAddress = encodeAddress(hashedKey)
  console.log('address', faucetAddress);

  const transfer = await entropy.substrate.tx.balances.transferAllowDeath(selectedAccountAddress, amount);
  await faucetSignAndSend(transfer, entropy.substrate, entropy, parseInt(amount), faucetAddress, chosenVerifyingKey )

  return
}