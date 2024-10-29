import test from 'tape'
import { readFileSync } from 'fs'

import { eveSeed, setupTest } from './testing-utils'
import { jumpStartNetwork } from '@entropyxyz/sdk/testing'
import { stripHexPrefix } from '../src/common/utils'
import { EntropyBalance } from '../src/balance/main'
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyFaucet } from '../src/faucet/main'
import { EntropyAccount } from '../src/account/main'

async function setupAndFundFaucet (t) {
  const { run, entropy, endpoint } = await setupTest(t, { seed: eveSeed })
  await run('jump-start network', jumpStartNetwork(entropy))

  const account = new EntropyAccount(entropy, endpoint)
  const transfer = new EntropyTransfer(entropy, endpoint)
  const faucet = new EntropyFaucet(entropy, endpoint)

  // Deploy faucet program
  const faucetProgram = readFileSync('tests/programs/faucet_program.wasm')
  const configurationSchema = {
    type: 'object',
    properties: {
      max_transfer_amount: { type: "number" },
      genesis_hash: { type: "string" }
    }
  }
  const auxDataSchema = {
    type: 'object',
    properties: {
      amount: { type: "number" },
      string_account_id: { type: "string" },
      spec_version: { type: "number" },
      transaction_version: { type: "number" },
    }
  }
  const faucetProgramPointer = await run(
    'Deploy faucet program',
     entropy.programs.dev.deploy(faucetProgram, configurationSchema, auxDataSchema)
)

  // Confirm faucetPointer matches deployed program pointer
  // TODO: when we re-deploy the testnet we should record the schema that got deployed, and the
  // hash, and use those here
  const LOCAL_PROGRAM_HASH = '0x55e250f4031546d15c6491c3610d58ca1a74e216b4bd612b42aed8f56b05b559'
  t.equal(faucetProgramPointer, LOCAL_PROGRAM_HASH, 'Program pointer matches')

  // Register with faucet program
  const genesisHash = await entropy.substrate.rpc.chain.getBlockHash(0)
  const userConfig = {
    max_transfer_amount: 20_000_000_000,
    genesis_hash: stripHexPrefix(genesisHash.toString())
  }
  await run(
    'Register Faucet Program for eve',
    account.register({
      programModAddress: entropy.keyring.accounts.registration.address,
      programData: [{
        program_pointer: faucetProgramPointer,
        program_config: userConfig
      }]
    })
  )

  // Fund the Faucet
  const eveAddress = entropy.keyring.accounts.registration.address
  const verifyingKeys = await faucet.getAllFaucetVerifyingKeys(eveAddress)
  // @ts-expect-error
  const { chosenVerifyingKey, faucetAddress } = faucet.getRandomFaucet([], verifyingKeys)
  await run('Transfer funds to faucet address', transfer.transfer(faucetAddress, "1000"))

  return { faucetProgramPointer, chosenVerifyingKey, faucetAddress }
}

test('Faucet Tests: Successfully send funds and register', async t => {
  const { faucetAddress, chosenVerifyingKey, faucetProgramPointer } = await setupAndFundFaucet(t)
  console.log(('faucet set up'))

  const { run, endpoint, entropy: naynay } = await setupTest(t)
  const naynayAddress = naynay.keyring.accounts.registration.address

  const faucet = new EntropyFaucet(naynay, endpoint)
  const balance = new EntropyBalance(naynay, endpoint)

  let naynayBalance = await balance.getBalance(naynayAddress)
  t.equal(naynayBalance, 0, 'Naynay is broke af')

  const amount = 20000000000
  const transferStatus = await run(
    'Sending faucet funds to account',
    faucet.sendMoney({
      amount: `${amount}`,
      addressToSendTo: naynay.keyring.accounts.registration.address,
      faucetAddress,
      chosenVerifyingKey,
      faucetProgramPointer
    })
  )
  t.ok(transferStatus.isFinalized, 'Transfer is good')

  naynayBalance = await balance.getBalance(naynayAddress)
  t.equal(naynayBalance, amount, 'Naynay is drippin in faucet tokens')

  // Test if user can register after receiving funds
  const account = new EntropyAccount(naynay, endpoint)
  const verifyingKey = await run('register account', account.register())
  t.ok(!!verifyingKey, 'Verifying key exists and is returned from register method')

  const fullAccount = naynay.keyring.getAccount()
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
