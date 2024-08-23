import test from "tape";
import { charlieStashSeed, setupTest, sleep } from "./testing-utils";
import { readFileSync } from "fs";
import { register } from "../src/flows/register/register";
import {ethers} from 'ethers'


test.only('Eth Transaction', async (t) => {
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
        "http://127.0.0.1:8545"
    );
    const feeData = await provider.getFeeData()

    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const signer = new ethers.Wallet(privateKey, provider)
    const network = await provider.getNetwork()

    const tx_data ={
        to: "0x5661cC82b8e6EE0850Ba7829eb3E994b76A2E437",
        value: ethers.toBigInt('1'),
        chainId: network.chainId,
        nonce: 0,
        gasLimit: 30000000,
        maxPriorityFeePerGas: 30000000,
        maxFeePerGas: 30000000,
        type: 2

    }

    const tx = ethers.Transaction.from(tx_data)
    const serializedTx = tx.unsignedSerialized
    console.log({serializedTx})

    const signature: any = await entropy.sign({
        hash: 'keccak',
        sigRequestHash: serializedTx//`${serializedTx.replace('02', '')}`,
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
        value: ethers.getBigInt("96250000000000001")
      });

    try {
        const tx_send = await provider.broadcastTransaction(serialized);
        console.log("transaction sent successfully", { tx_send });
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
        maxFeePerGas: 30000000,
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

    


    try {
        const tx_send = await provider.broadcastTransaction(serialized_2);
        console.log("transaction sent successfully", { tx_send });
      } catch (e) {
        console.log({ failedTransaction: e.transaction, e });
      }

    t.end()

})