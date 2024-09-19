import test from 'tape'
import { charlieStashSeed, setupTest } from './testing-utils'
import { stripHexPrefix } from '../src/common/utils'
import { readFileSync } from 'fs'
import { EntropyBalance } from '../src/balance/main'
import { EntropyTransfer } from '../src/transfer/main'
import { getRandomFaucet, sendMoney } from '../src/flows/entropyFaucet/faucet'
import { LOCAL_PROGRAM_HASH } from '../src/flows/entropyFaucet/constants'
import { EntropyAccount } from '../src/account/main'

test('Faucet Tests', async t => {
  const { run, entropy, endpoint } = await setupTest(t, { seed: charlieStashSeed })
  const { entropy: naynayEntropy } = await setupTest(t)

  const accountService = new EntropyAccount(entropy, endpoint)
  const balanceService = new EntropyBalance(entropy, endpoint)
  const transferService = new EntropyTransfer(entropy, endpoint)

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
  let entropyBalance = await balanceService.getBalance(entropy.keyring.accounts.registration.address)
  console.log('Balance Charlie::', entropyBalance);
  
  let naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)
  t.equal(naynayBalance, 0, 'Naynay is broke af')
  // register with faucet program
  await run('Register Faucet Program for charlie stash', accountService.register(
    { 
      programModAddress: entropy.keyring.accounts.registration.address,
      programData: [{ program_pointer: faucetProgramPointer, program_config: userConfig }]
    }
  ))
  
  const { chosenVerifyingKey, faucetAddress } = await getRandomFaucet(entropy, [], entropy.keyring.accounts.registration.address)
  // adding funds to faucet address
  entropyBalance = await balanceService.getBalance(entropy.keyring.accounts.registration.address)
  const faucetAddressBalance = await balanceService.getBalance(faucetAddress)
  console.log('Balance faucetAddress::', faucetAddressBalance);
  console.log('Balance charlie 2::', entropyBalance);
  
  
  await run('Transfer funds to faucet address', transferService.transfer(faucetAddress, "1000"))

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

  naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)

  t.ok(naynayBalance > 0, 'Naynay is drippin in faucet tokens')

  t.end()
})
