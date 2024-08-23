import test from "tape";
import { charlieStashSeed, setupTest, sleep } from "./testing-utils";
import { readFileSync } from "fs";
import { register } from "../src/flows/register/register";
import { keccak256 } from "ethereum-cryptography/keccak";
import { hexToBytes, toHex } from "ethereum-cryptography/utils";
import { encode } from "eip55";
import {ethers} from 'ethers'
import EthereumTx from "ethereumjs-tx"
import { sign } from "crypto";

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

    const ethAddress = keccak256(hexToBytes(verifyingKey)).slice(-20);
    console.log('address            :', '0x' + toHex(ethAddress));  
    const addressEip55 = encode('0x' + toHex(ethAddress));
    console.log('address (EIP-55)   :', addressEip55);
    
    const provider = await new ethers.JsonRpcProvider(
        "http://127.0.0.1:8545"
    );
    const feeData = await provider.getFeeData()
    console.log({feeData})
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
    // const txParams = {
    //     nonce: '0x00',
    //     gasPrice: '0x09184e72a000',
    //     gasLimit: '0x2710',
    //     to: '0x0000000000000000000000000000000000000000',
    //     value: '0x00',
    //     data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
    //   }
    // const tx = new EthereumTx.Transaction(txParams)

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
    const v = (s[0] & 0x80) ? 28: 27; 
    const yParity: any = signature[signature.length - 1]
    console.log({r, s, v, big: ethers.getBigInt(v), yParity})
    const signature_split = ethers.Signature.from({r, s, yParity})
    tx.signature = signature_split
    const serialized = tx.serialized
    console.log({from: tx.from})
    const populate = await signer.populateTransaction(ethers.Transaction.from({chainId: network.chainId, type: 2}))
    console.log({populate})

    console.log({serialized})
    const tets = await signer.sendTransaction({
        to: tx.from,
        value: ethers.getBigInt("96250000000000001")
      });
    console.log({tets, test: await tets.getTransaction()})
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
        sigRequestHash:  serializedTx_2//`${serializedTx_2.replace('02', '')}`,
    })

    const r_2 = ethers.hexlify(signature_2.slice(0, 32));
    const s_2: any = ethers.hexlify(signature_2.slice(32, 64));
    const v_2 = (s_2[0] & 0x80) ? 28: 27; 
    const yParity_2: any = signature_2[signature_2.length - 1]
    // console.log({r:, s, v, big: ethers.getBigInt(v), yParity})

    const signature_split_s = ethers.Signature.from({r: r_2, s: s_2, yParity: yParity_2})
    tx_2.signature = signature_split_s
    const serialized_2 = tx_2.serialized
    console.log({from2: tx_2.from, from: tx.from})

    


    try {
        const tx_send = await provider.broadcastTransaction(serialized_2);
        console.log("transaction sent successfully", { tx_send });
      } catch (e) {
        console.log({ failedTransaction: e.transaction, e });
      }

    // const fullAccount = entropy.keyring.getAccount()

    // t.equal(verifyingKey, fullAccount?.registration?.verifyingKeys?.[1], 'verifying key matches key added to registration account')

    t.end()

})