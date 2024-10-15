import test from 'tape'
import { readFile } from 'fs/promises'

import { charlieStashSeed, setupTest } from './testing-utils'
import { stripHexPrefix } from '../src/common/utils'
import { BITS_PER_TOKEN } from '../src/common/constants'

import { EntropyAccount } from '../src/account/main'
import { EntropyBalance } from '../src/balance/main'
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyFaucet } from '../src/faucet/main'

test('Faucet Tests', async t => {
  const { run, entropy: charlie, endpoint } = await setupTest(t, { seed: charlieStashSeed })
  const { entropy: naynay } = await setupTest(t)

  const charlieAddress = charlie.keyring.accounts.registration.address
  const naynayAddress = naynay.keyring.accounts.registration.address

  const accountService = new EntropyAccount(charlie, endpoint)
  const balanceService = new EntropyBalance(charlie, endpoint)
  const transferService = new EntropyTransfer(charlie, endpoint)
  // NOTE: naynay
  const faucetService = new EntropyFaucet(naynay, endpoint)

  // Deploy faucet program
  const faucetProgram = await readFile('tests/programs/faucet_program.wasm')
  const configurationSchema = {
    type: "object",
    properties: {
      genesis_hash: { type: "string" },
      max_transfer_amount: { type: "number" }
    }
  }
  const auxDataSchema = {
    type: "object",
    properties: {
      amount: { type: "number" },
      string_account_id: { type: "string" },
      spec_version: { type: "number" },
      transaction_version: { type: "number" },
    }
  }
  const faucetProgramPointer = await run(
    'deploy faucet program',
    charlie.programs.dev.deploy(faucetProgram, configurationSchema, auxDataSchema)
  )

  // Install faucet
  const genesisHash = await charlie.substrate.rpc.chain.getBlockHash(0)
  const userProgramConfig = {
    max_transfer_amount: 10_000_000_000,
    genesis_hash: stripHexPrefix(genesisHash.toString())
  }
  await run(
    'Charlie registers with Faucet as initial program',
    accountService.register({
      programModAddress: charlieAddress,
      programData: [{
        program_pointer: faucetProgramPointer,
        program_config: userProgramConfig
      }]
    })
  )

  // Fund the faucet
  const verifyingKeys = await faucetService.getAllFaucetVerifyingKeys(charlieAddress)
  // @ts-expect-error
  const { chosenVerifyingKey, faucetAddress } = faucetService.getRandomFaucet([], verifyingKeys)

  const funding = 1000
  await run(
    'Charlie funds the Faucet address',
    transferService.transfer(faucetAddress, `${funding}`)
  )

  const faucetBalance = await balanceService.getBalance(faucetAddress)
  t.equal(faucetBalance, funding * BITS_PER_TOKEN, 'Faucet has balance')

  // Use the faucet
  let naynayBalance = await balanceService.getBalance(naynayAddress)
  t.equal(naynayBalance, 0, 'Naynay is broke')

  const transferStatus = await run(
    "Naynay uses faucet",
    faucetService.sendMoney({
      amount: "10000000000",
      faucetAddress,
      chosenVerifyingKey,
      faucetProgramPointer,
      addressToSendTo: naynayAddress,
    })
  )
  t.ok(transferStatus.isFinalized, 'Transfer is good')

  naynayBalance = await balanceService.getBalance(naynayAddress)

  t.equal(naynayBalance, 10000000000, 'Naynay is drippin in faucet tokens')

  t.end()
})
