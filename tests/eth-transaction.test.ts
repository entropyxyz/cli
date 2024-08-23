import test from "tape";
import { charlieStashSeed, setupTest } from "./testing-utils";
import { readFileSync } from "fs";
import { register } from "../src/flows/register/register";
import { keccak256 } from "ethereum-cryptography/keccak";
import { hexToBytes, toHex } from "ethereum-cryptography/utils";
import { encode } from "eip55";

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
    const signature = await entropy.sign({
        hash: 'keccak',
        sigRequestHash: Buffer.from('this is a message').toString('hex'),
    })

    console.log('signature', signature);
    

    // const fullAccount = entropy.keyring.getAccount()

    // t.equal(verifyingKey, fullAccount?.registration?.verifyingKeys?.[1], 'verifying key matches key added to registration account')

    t.end()

})