import inquirer from "inquirer"
import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto'
import { print, debug, accountChoices, getSelectedAccount, stripHexPrefix } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { construct, decode, getRegistry, methods } from "@substrate/txwrapper-polkadot"

const faucetProgramModKey = '5GWamxgW4XWcwGsrUynqnFq2oNZPqNXQhMDfgNH9xNsg2Yj7'

export async function entropyFaucet({ accounts, selectedAccount: selectedAccountAddress }, options) {
  const { endpoint } = options
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  debug('selectedAccount', selectedAccount)

  const recipientAddress = selectedAccount.address

  // @ts-ignore (see TODO on aliceAccount)
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint })

  if (!entropy.registrationManager.signer.pair) {
    throw new Error("Keys are undefined")
  }

  const amount = "10000000000"
  const tx = entropy.substrate.tx.balances.transferAllowDeath(
    recipientAddress,
    BigInt(amount)
  )

  const modifiableKeys = await entropy.substrate.query.registry.modifiableKeys(faucetProgramModKey)
  const verifyingKeys = modifiableKeys.toHuman()
  // Choosing one of the 5 verifiying keys at random to be used as the faucet sender
  const chosenVerifyingKey = verifyingKeys[Math.floor(Math.random() * (verifyingKeys as Array<string>).length)]

  console.log('chosen key', chosenVerifyingKey);
  const hashedKey = blake2AsHex(chosenVerifyingKey)
  console.log('hashed key', hashedKey);
  const faucetAddress = encodeAddress(hashedKey)
  console.log('address', faucetAddress);

  const { block } = await entropy.substrate.rpc.chain.getBlock()
  console.log('block', block.toHuman());
  const blockHash = await entropy.substrate.rpc.chain.getBlockHash()
  console.log('block hash', blockHash.toHuman(), blockHash.toString(), blockHash.toHex());
  const genesisHash = await entropy.substrate.rpc.chain.getBlockHash(0)
  console.log('gensis hash', genesisHash.toHuman());
  const metadata = await entropy.substrate.rpc.state.getMetadata()
  console.log('metadata', metadata.toHuman());
  const properties = await entropy.substrate.rpc.system.properties()
  console.log('props', properties.toHuman());
  const { specVersion, transactionVersion, specName } = await entropy.substrate.rpc.state.getRuntimeVersion()
  console.log('runtime', specVersion.toHuman(), transactionVersion.toHuman(), specName.toHuman());

  const registry = getRegistry({
    // hardcoding polkadot here, but the getRegistry call uses the included properties value instead of specName
    specName: 'polkadot',
    chainName: 'Entropy',
    specVersion: parseInt(specVersion.toHuman()),
    metadataRpc: metadata.toHex(),
    properties: properties.toHuman(),
  });

  const unsigned = methods.balances.transferAllowDeath(
    {
      value: amount,
      dest: { id: selectedAccountAddress },
    },
    {
      address: faucetAddress,
      blockHash: blockHash.toHex(),
      blockNumber: registry
        .createType('BlockNumber', block.header.number)
        .toNumber(),
      eraPeriod: 32,
      genesisHash: genesisHash.toHex(),
      metadataRpc: metadata.toHex(),
      nonce: 0, // Assuming this is Alice's first tx on the chain
      specVersion: parseInt(specVersion.toHuman()),
      tip: 0,
      transactionVersion: parseInt(transactionVersion.toHuman()),
    },
    {
      metadataRpc: metadata.toHex(),
      registry,
    },
  );
  console.log({unsigned})
  // Decode an unsigned transaction.
  const decodedUnsigned = decode(unsigned, {
    metadataRpc: metadata.toHex(),
    registry,
  });
  console.log(
    `\nDecoded Transaction\n  To: ${(decodedUnsigned.method.args.dest as { id: string })?.id
    }\n` + `  Amount: ${decodedUnsigned.method.args.value}`,
  );

  // Construct the signing payload from an unsigned transaction.
  const signingPayload = construct.signingPayload(unsigned, { registry });
  console.log(`\nPayload to Sign: ${signingPayload}`);

  // Decode the information from a signing payload.
  const payloadInfo = decode(signingPayload, {
    metadataRpc: metadata.toHex(),
    registry,
  });
  console.log(
    `\nDecoded Transaction\n  To: ${(payloadInfo.method.args.dest as { id: string })?.id
    }\n` + `  Amount: ${payloadInfo.method.args.value}`,
  )
  // const header = "{\"parentHash\":\"0x0000000000000000000000000000000000000000000000000000000000000000\",\"number\":\"0x0\",\"stateRoot\":\"0xbf547507d429b75e0f98286c2522aaa322499edd69ce9b1f577f9864aad969da\",\"extrinsicsRoot\":\"0x03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314\",\"digest\":{\"logs\":[]}}"
  // const auxData = {
  //     header_string: header,//JSON.stringify(block.header.toString()),
  console.log('block header', block.header.toString().replace(/"/g, '\"'));
  console.log('block hh', JSON.stringify(JSON.stringify(block.header)).split('\\').join('\\'));

  const header = {...block.header.toJSON(), digest: { logs: [] }}
  console.log('header', header);
  console.log('stringified', '\n' + JSON.stringify(header).replace(/"/g, '\\"') + '\n');
  
  const auxData = {
    // program aux data expecting header string to include escape characters, for some reason stringifying twice returns those characters
    header_string: JSON.stringify(header),
    // header_string: "{\"parentHash\":\"0x0000000000000000000000000000000000000000000000000000000000000000\",\"number\":\"0x0\",\"stateRoot\":\"0xbf547507d429b75e0f98286c2522aaa322499edd69ce9b1f577f9864aad969da\",\"extrinsicsRoot\":\"0x03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314\",\"digest\":{\"logs\":[]}}",
    genesis_hash: stripHexPrefix(genesisHash.toHex()),
    spec_version: parseInt(specVersion.toHuman()),
    transaction_version: parseInt(transactionVersion.toHuman()),
    nonce: 0,
    mortality: 32,
    string_account_id: selectedAccountAddress,
    amount: parseInt(amount)
  }
  console.log('\n' + JSON.stringify(auxData) + '\n');
  console.log('\n' + JSON.parse(JSON.stringify(auxData)) + '\n');

  const signature = await entropy.sign({
    sigRequestHash: stripHexPrefix(signingPayload),
    hash: 'keccak',
    auxiliaryData: [JSON.parse(JSON.stringify(auxData))],
    verifyingKeyOverwrite: chosenVerifyingKey
  })

  console.log('signature', signature);

  return
}

// header_string: "{\"parentHash\":\"0x0000000000000000000000000000000000000000000000000000000000000000\",\"number\":\"0x0\",\"stateRoot\":\"0xbf547507d429b75e0f98286c2522aaa322499edd69ce9b1f577f9864aad969da\",\"extrinsicsRoot\":\"0x03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314\",\"digest\":{\"logs\":[]}}",
// {"header_string":"{\"parentHash\":\"0x25b18f7e9f904c5ce199cbcffee9d45f1c81b59d7eda0690e879fed0aa5e5e53\",\"number\":118024,\"stateRoot\":\"0x7cb75061ba5a425cc2db3effb9ebf3d0f4f1772cd65daead784695efd4eb5320\",\"extrinsicsRoot\":\"0x3136a3a5fb3e8c234763f7b5502ec8fbfc780aa05ef8f095b2b3dbfbf9159b03\",\"digest\":{\"logs\":[{\"preRuntime\":[\"0x42414245\",\"0x0203000000c7ed111100000000\"]},{\"seal\":[\"0x42414245\",\"0x70a1eb3f5326b4bf638a15f4f4a426dcf0fd7ada14f39b1a5de05f4abb61ae42569b33e8c827c00d01f623bc97d08f681f0b30c779e1e040eb8928a9964b538b\"]}]}}","genesis_hash":"2ff566103dfac49018be96ef1adfac8dd1d6852ef65c984f0ee6d6a105d3aaef","spec_version":100,"transaction_version":6,"nonce":0,"mortality":32,"string_account_id":"5Cvr3UAMLz5XU1RUbksYnToH4LhzZAypdsCviAtDitjtVeBH","amount":10000000000}

