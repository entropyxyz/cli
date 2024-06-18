import { blake2AsHex, encodeAddress, signatureVerify } from '@polkadot/util-crypto'
import { debug, getSelectedAccount, stripHexPrefix } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import Entropy from "@entropyxyz/sdk"
import FaucetSigner from "./signer"
import { construct, decode, getRegistry, methods } from '@substrate/txwrapper-polkadot'
import { toHex } from 'alchemy-sdk'
import { u8aToHex } from '@polkadot/util'

const faucetProgramModKey = '5GWamxgW4XWcwGsrUynqnFq2oNZPqNXQhMDfgNH9xNsg2Yj7'

async function faucetSignAndSend (call: any, api: any, entropy: Entropy, amount: number, senderAddress: string, chosenVerifyingKey: any) {
  const faucetSigner = new FaucetSigner(api.registry, entropy, amount, chosenVerifyingKey)
  const metadataHash = (await entropy.substrate.rpc.state.getMetadata()).hash

  const sig = await call.signAsync(senderAddress, {
    signer: faucetSigner,
  });
  const blockHash = await entropy.substrate.rpc.chain.getBlockHash()
  console.log({sig})
  const test = await entropy.substrate.call.taggedTransactionQueue.validateTransaction("local", sig, blockHash.toHex())
  console.log({test: test.toHuman()})
  // console.log({result})
  // console.log({sig: sig.toHuman()})
  sig.send(({ status, dispatchError }: any) => {
    // status would still be set, but in the case of error we can shortcut
    // to just check it (so an error would indicate InBlock or Finalized)
    if (dispatchError) {
        if (dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            const { documentation, method, section } = decoded;

            console.log(`${section}.${method}: ${documentation.join(' ')}`);
            process.exit();
        } else {
            // Other, CannotLookup, BadOrigin, no extra info
            console.log(dispatchError.toString());
            process.exit();
        }
    } else {
        if (status.isFinalized) {
            console.log('\ntransaction successful');
            process.exit();
        }
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

  const amount = "10000000000"
  const modifiableKeys = await entropy.substrate.query.registry.modifiableKeys(faucetProgramModKey)
  const verifyingKeys = modifiableKeys.toHuman()
  // Choosing one of the 5 verifiying keys at random to be used as the faucet sender
  const chosenVerifyingKey = verifyingKeys[Math.floor(Math.random() * (verifyingKeys as Array<string>).length)]
  console.log('chosen key', chosenVerifyingKey);
  const hashedKey = blake2AsHex(chosenVerifyingKey)
  console.log('hashed key', hashedKey);
  const faucetAddress = encodeAddress(hashedKey, 42).toString()
  console.log('address', faucetAddress);

  const { block } = await entropy.substrate.rpc.chain.getBlock()
  const blockHash = await entropy.substrate.rpc.chain.getBlockHash()
  const genesisHash = await entropy.substrate.rpc.chain.getBlockHash(0)
  const metadataRpc = (await entropy.substrate.rpc.state.getMetadata())

  const { specVersion, transactionVersion, specName } = await entropy.substrate.rpc.state.getRuntimeVersion()
  const properties = await entropy.substrate.rpc.system.properties()

  const registry = getRegistry({
		chainName: 'Entropy',
		specName: 'polkadot',
		specVersion: specVersion.toNumber(),
		metadataRpc: metadataRpc.toHex(),
    properties: properties.toHuman(),
	});

  const unsigned = methods.balances.transferAllowDeath(
		{
			value: 10000000000,
			dest: { id: selectedAccountAddress }, // Bob
		},
		{
			address: faucetAddress,
			blockHash: blockHash.toHex(),
			blockNumber: parseInt(registry.createType('BlockNumber', block.header.number).toHex()),
			genesisHash: genesisHash.toString(),
			metadataRpc: metadataRpc.toHex(),
			nonce: 0, // Assuming this is Alice's first tx on the chain
			specVersion: 100,
			tip: 0,
			transactionVersion: 6,
		},
		{
			metadataRpc: metadataRpc.toHex(),
			registry,
		},
	);
  const transfer = await entropy.substrate.tx.balances.transferAllowDeath(selectedAccountAddress, amount);
  await faucetSignAndSend(transfer, entropy.substrate, entropy, parseInt(amount), faucetAddress, chosenVerifyingKey )
  // const decodedUnsigned = decode(unsigned, {
	// 	metadataRpc: metadataRpc.toHex(),
	// 	registry,
	// });
	// console.log(
	// 	`\nDecoded Transaction\n  To: ${
	// 		(decodedUnsigned.method.args.dest as { id: string })?.id
	// 	}\n` + `  Amount: ${decodedUnsigned.method.args.value}`,
	// );
  // const signingPayload = construct.signingPayload(unsigned, { registry });
	// console.log(`\nPayload to Sign: ${signingPayload}`);

	// // Decode the information from a signing payload.
	// const payloadInfo = decode(signingPayload, {
	// 	metadataRpc: metadataRpc.toHex(),
	// 	registry,
	// });
	// console.log(
	// 	`\nDecoded Transaction\n  To: ${
	// 		(payloadInfo.method.args.dest as { id: string })?.id
	// 	}\n` + `  Amount: ${payloadInfo.method.args.value}`,
	// );
  // const auxData = {
  //   spec_version: 100,
  //   transaction_version: 6,
  //   string_account_id: entropy.keyring.accounts.registration.address,
  //   amount: parseInt(amount)
  // }

  // const signature = await entropy.sign({
  //   sigRequestHash: signingPayload,
  //   hash: {custom: 0},
  //   auxiliaryData: [auxData],
  //   verifyingKeyOverwrite: chosenVerifyingKey
  // })
	// console.log(`\nSignature: ${signature}`);
  // let sigHex = u8aToHex(signature);
  // sigHex = `0x02${stripHexPrefix(sigHex)}`
  // // Serialize a signed transaction.
	// const tx = construct.signedTx(unsigned, sigHex, {
	// 	metadataRpc: metadataRpc.toHex(),
	// 	registry,
	// });
	// console.log(`\nTransaction to Submit: ${tx}`);

  // // Derive the tx hash of a signed transaction offline.
	// const expectedTxHash = construct.txHash(tx);
	// console.log(`\nExpected Tx Hash: ${expectedTxHash}`);

  // // Send the tx to the node. Again, since `txwrapper` is offline-only, this
	// // operation should be handled externally. Here, we just send a JSONRPC
	// // request directly to the node.
  // const test = await entropy.substrate.call.taggedTransactionQueue.validateTransaction("local", tx, blockHash.toHex())
  // console.log({test: test.toHuman()})
	// const actualTxHash = await entropy.substrate.rpc.author.submitExtrinsic(tx)
	// console.log(`Actual Tx Hash: ${actualTxHash}`);

	// // Decode a signed payload.
	// const txInfo = decode(tx, {
	// 	metadataRpc: metadataRpc.toHex(),
	// 	registry,
	// });
	// console.log(
	// 	`\nDecoded Transaction\n  To: ${
	// 		(txInfo.method.args.dest as { id: string })?.id
	// 	}\n` + `  Amount: ${txInfo.method.args.value}\n`,
	// );
  return
}