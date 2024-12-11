import test from 'tape'
import { writeFile } from 'node:fs/promises'

import migrations from '../../src/config/migrations'
import { migrateData, init, get, set, assertConfig } from '../../src/config'
import * as encoding  from '../../src/config/encoding'

// used to ensure unique test ids
let id = Date.now()
const makeTmpPath = () => `/tmp/entropy-cli-${id++}.json`
const fakeOldConfigPath = '/tmp/fake-old-config.json'


const makeKey = () => new Uint8Array(
  Array(32).fill(0).map((_, i) => i * 2 + 1)
)

test('config - get', async t => {
  const configPath = makeTmpPath()
  const config = { 
    boop: 'doop',
    secretKey: makeKey()
  }
  await writeFile(configPath, encoding.serialize(config))

  const result = await get(configPath)
  t.deepEqual(result, config, 'get works')

  const MSG = 'path that does not exist fails'
  await get('/tmp/junk')
    .then(() => t.fail(MSG))
    .catch(err => {
      t.match(err.message, /ENOENT/, MSG)
    })
})

test('config - set', async t => {
  const configPath = makeTmpPath()

  {
    const message = 'set does not allow empty config'
    // @ts-expect-error : wrong types
    await set(configPath)
      .then(() => t.fail(message))
      .catch(err => {
        t.match(err.message, /Invalid config/, message + ' (message)')
        t.match(err.cause, /must be object/, message + ' (cause)')
      })
  }

  {
    const config = {
      accounts: [{
        name: 'dog',
        address: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        data: {
          admin: {},
          registration: {}
        }
      }],
      selectedAccount: 'dog',
      endpoints: {
        "test-net": 'wss://dog.xyz'
      },
      'migration-version': 4
    }
    // @ts-expect-error : wrong types
    await set(configPath, config)
      .catch(err => {
        t.fail('set worked')
        console.log(err.cause)
      })

    const actual = await get(configPath)
    t.deepEqual(config, actual, 'set works')
  }

  t.end()
})

test('config - init', async t => {
  const configPath = makeTmpPath()

  let config
  {
    await init(configPath, fakeOldConfigPath)
    const expected = migrateData(migrations)
    config = await get(configPath)
    t.deepEqual(config, expected, 'init empty state')
  }

  // re-run init after mutating config
  {
    const newConfig = {
      ...config,
      manualAddition: 'boop'
    }
    await set(configPath, newConfig)
    await init(configPath, fakeOldConfigPath)
    config = await get(configPath)
    t.deepEqual(config, newConfig, 'init does not over-write manual changes')
  }

  // NOTE: there's scope for more testsing here but this is a decent start

  t.end()
})

test('config - init (migration)', async t => {
  const configPath = makeTmpPath().replace('/tmp', '/tmp/some-folder')
  const oldConfigPath = makeTmpPath()

  // old setup
  await init(oldConfigPath, '/tmp/fake-old-config-path')

  // customisation (to prove move done)
  let config = await get(oldConfigPath)
  const newConfig = {
    ...config,
    manualAddition: 'boop'
  }
  await set(oldConfigPath, newConfig)


  // init with new path
  await init(configPath, oldConfigPath)
  config = await get(configPath)
  t.deepEqual(config, newConfig, 'init migrates data to new location')

  await get(oldConfigPath)
    .then(() => t.fail('old config should be empty'))
    .catch(() => t.pass('old config should be empty'))

  t.end()
})


test('config - assertConfig', t => {
  const config = migrateData(migrations)
  config.accounts.push({
    name: "miscy",
    address: "woopswoopswoopswoopswoopswoopswoops",
    data:{
      admin: {}
    }
  })

  try {
    assertConfig(config)
    t.fail('should not be printing this, should have thrown')
  } catch (err) {
    t.equal(err.message, 'Invalid config', 'err.message')
    t.equal(
      err.cause,
      [
        'config/accounts/0/address: must match pattern "^[a-km-zA-HJ-NP-Z1-9]{48,48}$"',
        // TODO: could pretty this up to say "a Base58 encoded key 48 characters long"
        'config/accounts/0/data: must have required property \'registration\''
      ].join('; '),
      'err.cause'
    )
  }

  t.end()
})
