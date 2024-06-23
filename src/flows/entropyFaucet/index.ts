import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto'
import { debug, getSelectedAccount } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import Entropy from "@entropyxyz/sdk"
import FaucetSigner from "./signer"

const faucetProgramModKey = '5GWamxgW4XWcwGsrUynqnFq2oNZPqNXQhMDfgNH9xNsg2Yj7'

async function faucetSignAndSend (call: any, api: any, entropy: Entropy, amount: number, senderAddress: string, chosenVerifyingKey: any) {
  const faucetSigner = new FaucetSigner(api.registry, entropy, amount, chosenVerifyingKey)

  const sig = await call.signAsync(senderAddress, {
    signer: faucetSigner,
  });

  sig.send(({ status, dispatchError }: any) => {
    // status would still be set, but in the case of error we can shortcut
    // to just check it (so an error would indicate InBlock or Finalized)
    if (dispatchError) {
      if (dispatchError.isModule) {
        // for module errors, we have the section indexed, lookup
        const decoded = api.registry.findMetaError(dispatchError.asModule);
        const { documentation, method, section } = decoded;

        console.log(`${section}.${method}: ${documentation.join(' ')}`)
        process.exit()
      } else {
        // Other, CannotLookup, BadOrigin, no extra info
        console.error(dispatchError.toString())
        process.exit()
      }
    }
    if (status.isFinalized) {
      console.log('\ntransaction successful');
      process.exit()
    }
  })
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

  const amount = "10000000000000"
  const modifiableKeys = await entropy.substrate.query.registry.modifiableKeys(faucetProgramModKey)
  const verifyingKeys = modifiableKeys.toHuman()
  // Choosing one of the 5 verifiying keys at random to be used as the faucet sender
  const chosenVerifyingKey = verifyingKeys[Math.floor(Math.random() * (verifyingKeys as Array<string>).length)]
  const hashedKey = blake2AsHex(chosenVerifyingKey)
  const faucetAddress = encodeAddress(hashedKey, 42).toString()

  const transfer = entropy.substrate.tx.balances.transferAllowDeath(selectedAccountAddress, amount);
  await faucetSignAndSend(transfer, entropy.substrate, entropy, parseInt(amount), faucetAddress, chosenVerifyingKey )
  
  return
}