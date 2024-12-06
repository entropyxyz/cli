import test from 'tape'
import { writeFile } from 'node:fs/promises'

import migrations from '../src/config/migrations'
import { migrateData, init, get, set, isValidConfig, assertConfig } from '../src/config'
import * as encoding  from '../src/config/encoding'

// used to ensure unique test ids
let id = Date.now()
const makeTmpPath = () => `/tmp/entropy-cli-${id++}.json`
const fakeOldConfigPath = '/tmp/fake-old-config.json'

test('config/migrations', async t => {
  migrations.forEach(({ migrate, version }, i) => {
    const versionNum = Number(version)
    t.equal(versionNum, i, `${versionNum} - version`)
    t.equal(typeof migrate({}), 'object', `${versionNum} - migrate`)
  })

  // TODO: could be paranoid + check each file src/config/migrations/\d\d.ts is exported in "migrations"
  t.end()
})

test('config - migrateData', async t => {
  const migrations = [
    { 
      version: '0',
      migrate (currentConfig) {
        return {
          ...currentConfig,
          timeout: 10
        }
      }
    },
    {
      version: 1,
      migrate (currentConfig) {
        return {
          ...currentConfig,
          timeout: currentConfig.timeout * 2
        }
      }
    }
  ]

  {
    const initial = {}
    const expected = {
      timeout: 20,
      'migration-version': 1
    }
    t.deepEqual(migrateData(migrations, initial), expected, 'runs all migrations for empty initial state')
  }

  {
    const initial = {
      timeout: 4,
      'migration-version': 0
    }
    const expected = {
      timeout: 8,
      'migration-version': 1
    }
    t.deepEqual(migrateData(migrations, initial), expected, 'only runs missing migrations')
  }

  t.end()
})

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
    await set(undefined, configPath)
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
    await set(config, configPath)
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
    await set(newConfig, configPath)
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
  await set(newConfig, oldConfigPath)


  // init with new path
  await init(configPath, oldConfigPath)
  config = await get(configPath)
  t.deepEqual(config, newConfig, 'init migrates data to new location')

  await get(oldConfigPath)
    .then(() => t.fail('old config should be empty'))
    .catch(() => t.pass('old config should be empty'))

  t.end()
})


test('config/migrations/02', t => {
  const initial = JSON.parse(
    '{"accounts":[{"name":"Mix","address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","data":{"debug":true,"seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","admin":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","type":"registration","verifyingKeys":["0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"],"userContext":"ADMIN_KEY","seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","path":"","pair":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","addressRaw":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"isLocked":false,"meta":{},"publicKey":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"type":"sr25519","secretKey":{"0":120,"1":247,"2":1,"3":38,"4":246,"5":195,"6":0,"7":49,"8":84,"9":240,"10":226,"11":144,"12":66,"13":172,"14":130,"15":168,"16":237,"17":74,"18":121,"19":243,"20":49,"21":217,"22":208,"23":70,"24":160,"25":220,"26":125,"27":114,"28":230,"29":17,"30":254,"31":71,"32":158,"33":68,"34":133,"35":24,"36":119,"37":34,"38":46,"39":154,"40":85,"41":62,"42":178,"43":69,"44":206,"45":217,"46":132,"47":184,"48":8,"49":219,"50":89,"51":165,"52":189,"53":106,"54":6,"55":51,"56":112,"57":76,"58":42,"59":157,"60":146,"61":130,"62":203,"63":241}},"used":true},"registration":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","type":"registration","verifyingKeys":["0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"],"userContext":"ADMIN_KEY","seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","path":"","pair":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","addressRaw":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"isLocked":false,"meta":{},"publicKey":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"type":"sr25519","secretKey":{"0":120,"1":247,"2":1,"3":38,"4":246,"5":195,"6":0,"7":49,"8":84,"9":240,"10":226,"11":144,"12":66,"13":172,"14":130,"15":168,"16":237,"17":74,"18":121,"19":243,"20":49,"21":217,"22":208,"23":70,"24":160,"25":220,"26":125,"27":114,"28":230,"29":17,"30":254,"31":71,"32":158,"33":68,"34":133,"35":24,"36":119,"37":34,"38":46,"39":154,"40":85,"41":62,"42":178,"43":69,"44":206,"45":217,"46":132,"47":184,"48":8,"49":219,"50":89,"51":165,"52":189,"53":106,"54":6,"55":51,"56":112,"57":76,"58":42,"59":157,"60":146,"61":130,"62":203,"63":241}},"used":true},"deviceKey":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","type":"deviceKey","verifyingKeys":["0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"],"userContext":"CONSUMER_KEY","seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","path":"","pair":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","addressRaw":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"isLocked":false,"meta":{},"publicKey":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"type":"sr25519","secretKey":{"0":120,"1":247,"2":1,"3":38,"4":246,"5":195,"6":0,"7":49,"8":84,"9":240,"10":226,"11":144,"12":66,"13":172,"14":130,"15":168,"16":237,"17":74,"18":121,"19":243,"20":49,"21":217,"22":208,"23":70,"24":160,"25":220,"26":125,"27":114,"28":230,"29":17,"30":254,"31":71,"32":158,"33":68,"34":133,"35":24,"36":119,"37":34,"38":46,"39":154,"40":85,"41":62,"42":178,"43":69,"44":206,"45":217,"46":132,"47":184,"48":8,"49":219,"50":89,"51":165,"52":189,"53":106,"54":6,"55":51,"56":112,"57":76,"58":42,"59":157,"60":146,"61":130,"62":203,"63":241}},"used":true}}}],"selectedAccount":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","endpoints":{"dev":"ws://127.0.0.1:9944","test-net":"wss://testnet.entropy.xyz"},"migration-version":1}'
  )

  const migrated = migrations[2].migrate(initial)

  // console.log(encoding.serialize(migrated))
  // {
  //   "accounts": [
  //     {
  //       "name": "Mix",
  //       "address": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //       "data": {
  //         "debug": true,
  //         "seed": "0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840",
  //         "admin": {
  //           "address": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //           "type": "registration",
  //           "verifyingKeys": [
  //             "0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"
  //           ],
  //           "userContext": "ADMIN_KEY",
  //           "seed": "0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840",
  //           "path": "",
  //           "pair": {
  //             "address": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //             "addressRaw": "data:application/UI8A;base64,tvGr9u9kwCkxIApU8eG3mKS2sPQn7Urh+vS7gWHeIXQ=",
  //             "isLocked": false,
  //             "meta": {},
  //             "publicKey": "data:application/UI8A;base64,tvGr9u9kwCkxIApU8eG3mKS2sPQn7Urh+vS7gWHeIXQ=",
  //             "type": "sr25519",
  //             "secretKey": "data:application/UI8A;base64,ePcBJvbDADFU8OKQQqyCqO1KefMx2dBGoNx9cuYR/keeRIUYdyIumlU+skXO2YS4CNtZpb1qBjNwTCqdkoLL8Q=="
  //           },
  //           "used": true
  //         },
  //         "registration": {
  //           "address": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //           "type": "registration",
  //           "verifyingKeys": [
  //             "0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"
  //           ],
  //           "userContext": "ADMIN_KEY",
  //           "seed": "0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840",
  //           "path": "",
  //           "pair": {
  //             "address": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //             "addressRaw": "data:application/UI8A;base64,tvGr9u9kwCkxIApU8eG3mKS2sPQn7Urh+vS7gWHeIXQ=",
  //             "isLocked": false,
  //             "meta": {},
  //             "publicKey": "data:application/UI8A;base64,tvGr9u9kwCkxIApU8eG3mKS2sPQn7Urh+vS7gWHeIXQ=",
  //             "type": "sr25519",
  //             "secretKey": "data:application/UI8A;base64,ePcBJvbDADFU8OKQQqyCqO1KefMx2dBGoNx9cuYR/keeRIUYdyIumlU+skXO2YS4CNtZpb1qBjNwTCqdkoLL8Q=="
  //           },
  //           "used": true
  //         },
  //         "deviceKey": {
  //           "address": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //           "type": "deviceKey",
  //           "verifyingKeys": [
  //             "0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"
  //           ],
  //           "userContext": "CONSUMER_KEY",
  //           "seed": "0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840",
  //           "path": "",
  //           "pair": {
  //             "address": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //             "addressRaw": "data:application/UI8A;base64,tvGr9u9kwCkxIApU8eG3mKS2sPQn7Urh+vS7gWHeIXQ=",
  //             "isLocked": false,
  //             "meta": {},
  //             "publicKey": "data:application/UI8A;base64,tvGr9u9kwCkxIApU8eG3mKS2sPQn7Urh+vS7gWHeIXQ=",
  //             "type": "sr25519",
  //             "secretKey": "data:application/UI8A;base64,ePcBJvbDADFU8OKQQqyCqO1KefMx2dBGoNx9cuYR/keeRIUYdyIumlU+skXO2YS4CNtZpb1qBjNwTCqdkoLL8Q=="
  //           },
  //           "used": true
  //         }
  //       }
  //     }
  //   ],
  //   "selectedAccount": "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
  //   "endpoints": {
  //     "dev": "ws://127.0.0.1:9944",
  //     "test-net": "wss://testnet.entropy.xyz"
  //   },
  //   "migration-version": 1
  // }

  const targetKeys = ['addressRaw', 'publicKey', 'secretKey']

  // @ts-ignore
  migrated.accounts.forEach(account => {
    return Object.keys(account.data).forEach(subAccount => {
      if (typeof account.data[subAccount] !== 'object') return

      t.true(
        targetKeys.every(targetKey => {
          return account.data[subAccount].pair[targetKey] instanceof Uint8Array
        }),
        `migrated: ${subAccount}`
      )
    })
  })

  t.end()
})

test('config/migrations/04', { objectPrintDepth: 10 }, t => {
  const initial = {
    "accounts": [
      {
        "name": "naynay",
        "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
        "data": {
          "debug": true,
          "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
          "admin": {
            "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
            "type": "registration",
            "verifyingKeys": [],
            "userContext": "ADMIN_KEY",
            "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
            "path": "",
            "pair": {
              "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
              "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
              "isLocked": false,
              "meta": {},
              "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
              "type": "sr25519",
              "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
            }
          },
          "registration": {
            "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
            "type": "registration",
            "verifyingKeys": [
              "0x02ecbc1c6777e868c8cc50c9784e95d3a4727bdb5a04d7694d2880c980f15e17c3"
            ],
            "userContext": "ADMIN_KEY",
            "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
            "path": "",
            "pair": {
              "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
              "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
              "isLocked": false,
              "meta": {},
              "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
              "type": "sr25519",
              "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
            }
          }
        }
      },
    ],
    "selectedAccount": "naynay",
    "endpoints": {
      "dev": "ws://127.0.0.1:9944",
      "test-net": "wss://testnet.entropy.xyz",
      "stg": "wss://api.staging.testnet.testnet-2024.infrastructure.entropy.xyz"
    },
    "migration-version": 3
  }

  const migrated = migrations[4].migrate(initial)

  t.deepEqual(
    migrated,
    {
      "accounts": [
        {
          "name": "naynay",
          "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
          "data": {
            "debug": true,
            "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
            "admin": {
              "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
              "type": "registration",
              "verifyingKeys": [],
              "userContext": "ADMIN_KEY",
              "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
              "path": "",
              "pair": {
                "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
                "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
                "isLocked": false,
                "meta": {},
                "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
                "type": "sr25519",
                "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
              }
            },
            "registration": {
              "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
              "type": "registration",
              "verifyingKeys": [
                // "0x02ecbc1c6777e868c8cc50c9784e95d3a4727bdb5a04d7694d2880c980f15e17c3" // REMOVED
              ],
              "userContext": "ADMIN_KEY",
              "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
              "path": "",
              "pair": {
                "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
                "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
                "isLocked": false,
                "meta": {},
                "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
                "type": "sr25519",
                "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
              }
            }
          }
        },
      ],
      "selectedAccount": "naynay",
      "endpoints": {
        "dev": "ws://127.0.0.1:9944",
        "test-net": "wss://testnet.entropy.xyz",
        "stg": "wss://api.staging.testnet.testnet-2024.infrastructure.entropy.xyz"
      },
      "migration-version": 3,
    }
  )

  t.end()
})


function makeConfig (override?: object) {
  const config = {
    accounts: [makeConfigAccount()],
    "selectedAccount": "naynay",
    "endpoints": {
      "dev": "ws://127.0.0.1:9944",
      "test-net": "wss://testnet.entropy.xyz",
      "stg": "wss://api.staging.testnet.testnet-2024.infrastructure.entropy.xyz"
    },
    "migration-version": 4,
  }

  if (override) {
    return { ...config, ...override }
    // NOTE: shallow merge
  }
  else return config
}

function makeConfigAccount (override?: object) {
  const configAccount = {
    "name": "naynay",
    "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
    "data": {
      "debug": true,
      "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
      "admin": {
        "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
        "type": "registration",
        "verifyingKeys": [],
        "userContext": "ADMIN_KEY",
        "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
        "path": "",
        "pair": {
          "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
          "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "isLocked": false,
          "meta": {},
          "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "type": "sr25519",
          "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
        }
      },
      "registration": {
        "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
        "type": "registration",
        "verifyingKeys": [
          "0x02ecbc1c6777e868c8cc50c9784e95d3a4727bdb5a04d7694d2880c980f15e17c3"
        ],
        "userContext": "ADMIN_KEY",
        "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
        "path": "",
        "pair": {
          "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
          "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "isLocked": false,
          "meta": {},
          "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "type": "sr25519",
          "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
        }
      }
    }
  }

  if (override) {
    return { ...configAccount, ...override }
    // NOTE: shallow merge
  }
  else return configAccount
}


test('config - isValidConfig', t => {
  t.false(isValidConfig({}), 'empty object => false')
  const initialState = migrateData(migrations)

  function sweetAs (config, msg) {
    const isValid = isValidConfig(config)
    t.true(isValid, msg)
    if (!isValid) {
      console.error(isValidConfig.errors)
      console.error(config)
    }
  }

  sweetAs(initialState, 'initial state => true')

  console.log('---')

  /* accounts */
  {
    const configAccountsMissing = makeConfig({ accounts: undefined })
    t.false(isValidConfig(configAccountsMissing), "accounts: ommitted => false")

    /* account.name */
    {
      const configAccountNameUndefined = makeConfig({ 
        accounts: [
          makeConfigAccount({ name: undefined })
        ]
      })
      t.false(isValidConfig(configAccountNameUndefined), "accounts[0].name: undefined => false")

      const configAccountNameBad = makeConfig({ 
        accounts: [
          makeConfigAccount({ name: 4 })
        ]
      })
      t.false(isValidConfig(configAccountNameBad), "accounts[0].name: 4 => false")
    }

    /* account.address */
    {
      const configAccountAddressUndefined = makeConfig({ 
        accounts: [
          makeConfigAccount({ address: undefined })
        ]
      })
      t.false(isValidConfig(configAccountAddressUndefined), "accounts[0].address: undefined => false")

      const configAccountAddressBad = makeConfig({ 
        accounts: [
          makeConfigAccount({ address: 'doop' })
        ]
      })
      t.false(isValidConfig(configAccountAddressBad), "accounts[0].address: doop => false")
    }

    /* account.data */
    {
      const configAccountDataUndefined = makeConfig({ 
        accounts: [
          makeConfigAccount({ address: undefined })
        ]
      })
      t.false(isValidConfig(configAccountDataUndefined), "accounts[0].data: undefined => false")

      const configAcountDataAdminUndefined = makeConfig()
      // @ts-expect-error
      delete configAcountDataAdminUndefined.accounts[0].data.admin
      t.false(isValidConfig(configAcountDataAdminUndefined), "accounts[0].data.admin: undefined => false")

      const configAcountDataRegistrationUndefined = makeConfig()
      // @ts-expect-error
      delete configAcountDataRegistrationUndefined.accounts[0].data.registration
      t.false(isValidConfig(configAcountDataRegistrationUndefined), "accounts[0].data.registration: undefined => false")

      // TODO: define more closely which data we expect / require / need
      // NOTE: should do this after keyring work
    }

  }

  console.log('---')

  /* selectedAccount */
  {
    const config = makeConfig()

    // @ts-expect-error
    config.selectedAccount = undefined
    // TODO: this should be valid?!
    t.false(isValidConfig(config), "selectedAccount: ommitted => false")

    config.selectedAccount = ""
    // TODO: change this, it seems crazy to me!
    sweetAs(config, "selectedAccount: '' => true")

    // @ts-expect-error
    config.selectedAccount = 100
    t.false(isValidConfig(config), "selectedAccount: 100 => false")

    config.selectedAccount = "noonoo"
    t.false(isValidConfig(config), "selectedAccount: noonoo (does not match named account) => false")
  }

  console.log('---')

  /* endpoints */
  {
    const config = makeConfig()

    /* Custom endpoint */

    // @ts-expect-error
    config.endpoints.mixmix = "wss://testnet.mixmix.xyz"
    sweetAs(config, "endpoints: custom valid endpoint (wss) => true")

    // @ts-expect-error
    config.endpoints.mixmix = "ws://testnet.mixmix.xyz"
    sweetAs(config, "endpoints: custom valid endpoint (ws) => true")

    // @ts-expect-error
    config.endpoints.mixmix = "ws://testnet.mixmix.xyz"
    sweetAs(config, "endpoints: custom valid endpoint (ws) => true")

    // @ts-expect-error
    config.endpoints.mixmix = "http://testnet.mixmix.xyz"
    t.false(isValidConfig(config), "endpoints: invalid endpoint => false")

    // @ts-expect-error
    delete config.endpoints.mixmix

    /* Required endpoints */

    // @ts-expect-error
    delete config.endpoints["test-net"]
    t.false(isValidConfig(config), "endpoints: no 'test-net' => false")

    // @ts-expect-error
    delete config.endpoints
    t.false(isValidConfig(config), "endpoints: ommitted => false")

  }

  console.log('---')

  /* migration-version */
  {
    const config = makeConfig({ 'migration-version': undefined })
    t.false(isValidConfig(config), "migration-version: ommitted => false")

    config['migration-version'] = 99
    t.false(isValidConfig(config), "migration-version: wrong number => false")

    // @ts-expect-error
    config['migration-version'] = "4"
    t.false(isValidConfig(config), "migration-version: string int => false")

    // @ts-expect-error
    config['migration-version'] = "dog"
    t.false(isValidConfig(config), "migration-version: string => false")
  }

  console.log('---')

  /* Errors */
  {
    const config = makeConfig()
    isValidConfig(config)
    t.equal(isValidConfig.errors, null, 'isValidCOnfig.errors')

    // @ts-expect-error
    delete config["migration-version"]
    // @ts-expect-error
    delete config.endpoints["test-net"]
    isValidConfig(config)
    t.deepEqual(
      isValidConfig.errors,
      [
        {
          instancePath: '',
          schemaPath: '#/required',
          keyword: 'required',
          params: { missingProperty: 'migration-version' },
          message: "must have required property 'migration-version'"
        },
        {
          instancePath: '/endpoints',
          schemaPath: '#/properties/endpoints/required',
          keyword: 'required',
          params: { missingProperty: 'test-net' },
          message: "must have required property 'test-net'"
        }
      ],
      'isValidCOnfig.errors'
    )
  }

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
