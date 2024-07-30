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
  const configurationSchema = {
    max_transfer_amount: "number",
    genesis_hash: "string"
  }
  const auxDataSchema = {
    amount: "number",
    string_account_id: "string",
    spec_version: "number",
    transaction_version: "number",
  }
  console.log('userconfig', userConfig);
  
  // Convert JSON string to bytes and then to hex
  const encoder = new TextEncoder()
  const byteArray = encoder.encode(JSON.stringify(userConfig))
  console.log('byte array', JSON.stringify(byteArray));
  // console.log('byte array', byteArray);
  const programConfig = util.u8aToHex(new Uint8Array(byteArray))
  
  console.log('program config', programConfig);
  
  // Deploy faucet program
  const faucetProgramPointer = await run('Deploy faucet program', entropy.programs.dev.deploy(faucetProgram, configurationSchema, auxDataSchema))
  console.log('pointer', faucetProgramPointer);

  let naynayBalance = await getBalance(naynayEntropy, naynayEntropy.keyring.accounts.registration.address)
  t.equal(naynayBalance, 0, 'Naynay is broke af')
  // register with faucet program
  await run('Register Faucet Program for charlie stash', register(
    entropy,
    { 
      programModAddress: entropy.keyring.accounts.registration.address,
      programData: [{ program_pointer: faucetProgramPointer, program_config: userConfig }]
    }
  ))

  console.log('entropy program', { program: entropy.keyring.accounts.programDev });
  console.log('entropy register', { registration: entropy.keyring.accounts.registration });
  

  const transferStatus = await sendMoney(naynayEntropy, { amount: "10000000000", addressToSendTo: naynayEntropy.keyring.accounts.registration.address, faucetAddress: entropy.keyring.accounts.registration.address, chosenVerifyingKey: entropy.keyring.accounts.registration.verifyingKeys[0] })

  t.ok(transferStatus.isFinalized, 'Transfer is good')

  naynayBalance = await getBalance(naynayEntropy, naynayEntropy.keyring.accounts.registration.address)

  t.ok(naynayBalance > 0, 'Naynay is drippin in faucet tokens')

  t.end()
})