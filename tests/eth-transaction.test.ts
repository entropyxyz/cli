import test from "tape";
import { charlieStashSeed, setupTest, sleep } from "./testing-utils";
import { readFileSync } from "fs";
import { register } from "../src/flows/register/register";
import {ethers} from 'ethers'

// console.log('Accounts from config:', hh.config.networks.localhost.accounts);

test('Eth Transaction', async (t) => {
    const { run, entropy } = await setupTest(t, { networkType: "two-nodes", seed: charlieStashSeed })
    const dummyProgram: any = readFileSync(
        new URL('./programs/template_barebones.wasm', import.meta.url)
    )
    const pointer = await run(
        'deploy program',
        entropy.programs.dev.deploy(dummyProgram)
    )

    const verifyingKey = await run(
        'register - using custom params',
        register(entropy, {
            programModAddress: entropy.keyring.accounts.registration.address,
            programData: [{ program_pointer: pointer, program_config: '0x' }],
        })
    )

    const ethAddress = ethers.computeAddress(verifyingKey)
    const provider = await new ethers.JsonRpcProvider(
      // uri of local hardhat node
      // will need to switch to testnet endpoint for ci test
        "http://127.0.0.1:8545"
    );
    // const feeData = await provider.getFeeData()
    //  hardcoded from hardhat node, pk for funded acct
    // TO-DO: figure out a way to do this for CI tests
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const signer = new ethers.Wallet(privateKey, provider)
    const network = await provider.getNetwork()

    const tx_data ={
        // dummy example eth acct
        to: "0x5661cC82b8e6EE0850Ba7829eb3E994b76A2E437",
        value: ethers.toBigInt('1'),
        chainId: network.chainId,
        nonce: 0,
        gasLimit: 30000000,
        maxPriorityFeePerGas: 30000000,
        maxFeePerGas: 965778125,
        type: 2 // keep this

    }

    const tx = ethers.Transaction.from(tx_data)
    // unserialized is prepping the tx to be signed
    const serializedTx = tx.unsignedSerialized
    console.log({serializedTx})

    const signature: any = await entropy.sign({
        hash: 'keccak',
        sigRequestHash: serializedTx,
    })

    console.log('signature', signature);
    
    const r = ethers.hexlify(signature.slice(0, 32));
    const s: any = ethers.hexlify(signature.slice(32, 64));
    const yParity: any = signature[signature.length - 1]
    console.log({r, s, yParity})
    const signature_split = ethers.Signature.from({r, s, yParity})
    tx.signature = signature_split
    const serialized = tx.serialized

   await signer.sendTransaction({
        to: tx.from,
        value: ethers.getBigInt("962500000000000001")
      });

    try {
        const tx_send = await provider.broadcastTransaction(serialized);
        console.log("transaction sent successfully", { tx_send });
        t.ok(!!tx_send, 'Transaction 1 was sent successfully')
        t.equal(tx_send.value, BigInt('1'), 'Successfully sent 1 token/bit')
      } catch (e) {
        console.log({ failedTransaction: e.transaction, e });
      }


      const tx_data_2 ={
        to: "0x5661cC82b8e6EE0850Ba7829eb3E994b76A2E437",
        value: ethers.toBigInt('1'),
        chainId: network.chainId,
        nonce: 1,
        gasLimit: 30000000,
        maxPriorityFeePerGas: 30000000,
        maxFeePerGas: 965778125,
        type: 2
    }

    const tx_2 = ethers.Transaction.from(tx_data_2)
    const serializedTx_2 = tx_2.unsignedSerialized

    const signature_2: any = await entropy.sign({
        hash: 'keccak',
        sigRequestHash:  serializedTx_2
    })

    const r_2 = ethers.hexlify(signature_2.slice(0, 32));
    const s_2: any = ethers.hexlify(signature_2.slice(32, 64));
    const yParity_2: any = signature_2[signature_2.length - 1]

    const signature_split_s = ethers.Signature.from({r: r_2, s: s_2, yParity: yParity_2})
    tx_2.signature = signature_split_s
    const serialized_2 = tx_2.serialized
    console.log({from2: tx_2.from, from: tx.from, ethAddress})

    
    t.equal(tx.from, ethAddress, 'Derived eth address from tx matches address derived from entropy vk')
    t.equal(tx_2.from, ethAddress, 'Second Derived eth address from tx matches address derived from entropy vk')

    try {
        const tx_send = await provider.broadcastTransaction(serialized_2);
        console.log("transaction sent successfully", { tx_send });
        t.ok(!!tx_send, 'Transaction 2 was sent successfully')
      } catch (e) {
        console.log({ failedTransaction: e.transaction, e });
      }

    t.end()

})