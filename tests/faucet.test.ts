import test from 'tape'
import * as util from "@polkadot/util"
import { charlieStashSeed, setupTest } from './testing-utils'
import { stripHexPrefix } from '../src/common/utils'
import { readFileSync } from 'fs'
import { EntropyBalance } from '../src/balance/main'
import { EntropyTransfer } from '../src/transfer/main'
import { getRandomFaucet, sendMoney } from '../src/flows/entropyFaucet/faucet'
import { register } from '../src/flows/register/register'
import { LOCAL_PROGRAM_HASH } from '../src/flows/entropyFaucet/constants'

test('Faucet Tests', async t => {
  const { run, entropy, endpoint } = await setupTest(t, { seed: charlieStashSeed })
  const { entropy: naynayEntropy } = await setupTest(t)

  const BalanceService = new EntropyBalance(entropy, endpoint)
  const TransferService = new EntropyTransfer(entropy, endpoint)

  const faucetProgram = readFileSync('tests/programs/faucet_program.wasm')

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
  
  // Deploy faucet program
  const faucetProgramPointer = await run('Deploy faucet program', entropy.programs.dev.deploy(faucetProgram, configurationSchema, auxDataSchema))
  
  // Confirm faucetPointer matches deployed program pointer
  t.equal(faucetProgramPointer, LOCAL_PROGRAM_HASH, 'Program pointer matches')

  let naynayBalance = await BalanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)
  t.equal(naynayBalance, 0, 'Naynay is broke af')
  // register with faucet program
  await run('Register Faucet Program for charlie stash', register(
    entropy,
    { 
      programModAddress: entropy.keyring.accounts.registration.address,
      programData: [{ program_pointer: faucetProgramPointer, program_config: userConfig }]
    }
  ))
  
  const { chosenVerifyingKey, faucetAddress } = await getRandomFaucet(entropy, [], entropy.keyring.accounts.registration.address)
  // adding funds to faucet address

  await run('Transfer funds to faucet address', TransferService.transfer(faucetAddress, "1000"))

  const transferStatus = await sendMoney(
    naynayEntropy,
    endpoint,
    {
      amount: "10000000000",
      addressToSendTo: naynayEntropy.keyring.accounts.registration.address,
      faucetAddress,
      chosenVerifyingKey,
      faucetProgramPointer
    }
  )

  t.ok(transferStatus.isFinalized, 'Transfer is good')

  naynayBalance = await BalanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)

  t.ok(naynayBalance > 0, 'Naynay is drippin in faucet tokens')

  t.end()
})