import test from 'tape'
import { charlieStashSeed, setupTest } from './testing-utils'
import { stripHexPrefix } from '../src/common/utils'
import { readFileSync } from 'fs'
import { EntropyBalance } from '../src/balance/main'
import { EntropyTransfer } from '../src/transfer/main'
import { register } from '../src/flows/register/register'
import { EntropyFaucet } from '../src/faucet/main'
import { LOCAL_PROGRAM_HASH } from '../src/faucet/utils'

test('Faucet Tests', async t => {
  const { run, entropy, endpoint } = await setupTest(t, { seed: charlieStashSeed })
  const { entropy: naynayEntropy } = await setupTest(t)

  const balanceService = new EntropyBalance(entropy, endpoint)
  const transferService = new EntropyTransfer(entropy, endpoint)
  const faucetService = new EntropyFaucet(naynayEntropy, endpoint)

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

  let naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)
  t.equal(naynayBalance, 0, 'Naynay is broke af')
  // register with faucet program
  await run('Register Faucet Program for charlie stash', register(
    entropy,
    { 
      programModAddress: entropy.keyring.accounts.registration.address,
      programData: [{ program_pointer: faucetProgramPointer, program_config: userConfig }]
    }
  ))
  const verifyingKeys = await faucetService.getAllFaucetVerifyingKeys(entropy.keyring.accounts.registration.address)
  // @ts-expect-error
  const { chosenVerifyingKey, faucetAddress } = faucetService.getRandomFaucet([], verifyingKeys)
  // adding funds to faucet address

  await run('Transfer funds to faucet address', transferService.transfer(faucetAddress, "1000"))

  const transferStatus = await faucetService.sendMoney(
    {
      amount: "10000000000",
      addressToSendTo: naynayEntropy.keyring.accounts.registration.address,
      faucetAddress,
      chosenVerifyingKey,
      faucetProgramPointer
    }
  )

  t.ok(transferStatus.isFinalized, 'Transfer is good')

  naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)

  t.ok(naynayBalance > 0, 'Naynay is drippin in faucet tokens')

  t.end()
})