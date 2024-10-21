import test from 'tape'
import { eveSeed, setupTest } from './testing-utils'
import { jumpStartNetwork } from '@entropyxyz/sdk/testing'
import { stripHexPrefix } from '../src/common/utils'
import { readFileSync } from 'fs'
import { EntropyBalance } from '../src/balance/main'
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyFaucet } from '../src/faucet/main'
import { LOCAL_PROGRAM_HASH } from '../src/faucet/utils'
import { EntropyAccount } from '../src/account/main'

async function setupAndFundFaucet (t, naynayEntropy) {
  const { run, entropy, endpoint } = await setupTest(t, { seed: eveSeed })
  await run('jump-start network', jumpStartNetwork(entropy))
  const accountService = new EntropyAccount(entropy, endpoint)
  const transferService = new EntropyTransfer(entropy, endpoint)
  const faucetService = new EntropyFaucet(naynayEntropy, endpoint)

  const faucetProgram = readFileSync('tests/programs/faucet_program.wasm')

  const genesisHash = await entropy.substrate.rpc.chain.getBlockHash(0)

  const userConfig = {
    max_transfer_amount: 20_000_000_000,
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

  // register with faucet program
  await run('Register Faucet Program for eve', accountService.register(
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

  return { faucetProgramPointer, chosenVerifyingKey, faucetAddress }
}

test('Faucet Tests: Successfully send funds and register', async t => {
  const { run, endpoint, entropy: naynayEntropy } = await setupTest(t)

  const faucetService = new EntropyFaucet(naynayEntropy, endpoint)
  const balanceService = new EntropyBalance(naynayEntropy, endpoint)

  const { faucetAddress, chosenVerifyingKey, faucetProgramPointer } = await setupAndFundFaucet(t, naynayEntropy)
  
  let naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)
  t.equal(naynayBalance, 0, 'Naynay is broke af')
  
  const transferStatus = await run('Sending faucet funds to account', faucetService.sendMoney(
    {
      amount: "20000000000",
      addressToSendTo: naynayEntropy.keyring.accounts.registration.address,
      faucetAddress,
      chosenVerifyingKey,
      faucetProgramPointer
    }
  ))

  t.ok(transferStatus.isFinalized, 'Transfer is good')

  naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)

  t.ok(naynayBalance > 0, 'Naynay is drippin in faucet tokens')

  // Test if user can register after receiving funds
  const naynayAccountService = new EntropyAccount(naynayEntropy, endpoint)
  const verifyingKey = await run('register account', naynayAccountService.register())

  t.ok(!!verifyingKey, 'Verifying key exists and is returned from register method')

  const fullAccount = naynayEntropy.keyring.getAccount()
  t.equal(verifyingKey, fullAccount?.registration?.verifyingKeys?.[0], 'verifying key matches key added to registration account')

  t.end()
})

// TODO: @naynay fix below test for register failing when only sending 1e10 bits
// test('Faucet Tests: Successfully send funds but cannot register', async t => {
//   const { run, endpoint, entropy: naynayEntropy } = await setupTest(t)

//   const faucetService = new EntropyFaucet(naynayEntropy, endpoint)
//   const balanceService = new EntropyBalance(naynayEntropy, endpoint)

//   const { faucetAddress, chosenVerifyingKey, faucetProgramPointer } = await setupAndFundFaucet(t, naynayEntropy)
  
//   let naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)
//   t.equal(naynayBalance, 0, 'Naynay is broke af')
  
//   const transferStatus = await run('Sending faucet funds to account', faucetService.sendMoney(
//     {
//       amount: "10000000000",
//       addressToSendTo: naynayEntropy.keyring.accounts.registration.address,
//       faucetAddress,
//       chosenVerifyingKey,
//       faucetProgramPointer
//     }
//   ))

//   t.ok(transferStatus.isFinalized, 'Transfer is good')

//   naynayBalance = await balanceService.getBalance(naynayEntropy.keyring.accounts.registration.address)

//   t.ok(naynayBalance > 0, 'Naynay is drippin in faucet tokens')

//   // Test if user can register after receiving funds
//   const naynayAccountService = new EntropyAccount(naynayEntropy, endpoint)
//   try {
//     const verifyingKey = await naynayAccountService.register()
//     console.log('ver key', verifyingKey);
    
//     // t.fail('Register should fail')
//   } catch (error) {
//     console.log('error', error);
    
//     t.pass('Regsitration failed')
//     t.end()
//   }
// })