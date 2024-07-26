import test from 'tape'
import * as util from "@polkadot/util"
import { charlieStashSeed, setupTest } from './testing-utils'
import { stripHexPrefix } from 'src/common/utils'
import { readFileSync } from 'fs'
import { sendMoney } from 'src/flows/entropyFaucet/faucet'
import { getBalance } from 'src/flows/balance/balance'
import { register } from 'src/flows/register/register'

test('Faucet Tests', async t => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed })
  const { entropy: naynayEntropy } = await setupTest(t)

  const faucetProgram = readFileSync('src/programs/faucet_program.wasm')

  const genesisHash = await entropy.substrate.rpc.chain.getBlockHash(0)

  const userConfig = {
    max_transfer_amount: 10_000_000_000,
    genesis_hash: stripHexPrefix(genesisHash.toString())
  }

  // Convert JSON string to bytes and then to hex
  const encoder = new TextEncoder()
  const byteArray = encoder.encode(JSON.stringify(userConfig))
  const programConfig = util.u8aToHex(new Uint8Array(byteArray))

  // Deploy faucet program
  const faucetProgramPointer = await run('Deploy faucet program', entropy.programs.dev.deploy(faucetProgram, programConfig))
  console.log('pointer', faucetProgramPointer);
  
  // register with faucet program
  await run('Register faucet program for charlie stash', register(
    entropy,
    { 
      programModAddress: entropy.keyring.accounts.programDev.address,
      programData: [{ program_pointer: faucetProgramPointer, program_config: programConfig }]
    }
  ))

  console.log('entropy program', entropy.keyring.accounts.programDev);
  console.log('entropy register', entropy.keyring.accounts.registration);
  

  const transferStatus = await sendMoney(naynayEntropy, { amount: "10000000000", addressToSendTo: naynayEntropy.keyring.accounts.registration.address, faucetAddress: entropy.keyring.accounts.programDev.address, chosenVerifyingKey: entropy.keyring.accounts.programDev.verifyingKeys[0] })

  t.ok(transferStatus.isFinalized, 'Transfer is good')

  const naynayBalance = await getBalance(naynayEntropy, naynayEntropy.keyring.accounts.registration.address)

  t.ok(naynayBalance > 0, 'Naynay got balance from the faucet')

  t.end()
})