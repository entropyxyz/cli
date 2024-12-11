import test from 'tape'

import migrations from '../../src/config/migrations'
import { migrateData } from '../../src/config'

test('config.migrateData', async t => {
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

test('config/migrations', async t => {
  migrations.forEach(({ migrate, version }, i) => {
    const versionNum = Number(version)
    t.equal(versionNum, i, `${versionNum} - version`)
    t.equal(typeof migrate({}), 'object', `${versionNum} - migrate`)
  })

  // TODO: could be paranoid + check each file src/config/migrations/\d\d.ts is exported in "migrations"
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
    },
    'wiped verifyingKeys'
  )

  t.end()
})

test('config/migrations/05', { objectPrintDepth: 10 }, t => {
  // empty initialState
  {
    const initial = {
      "accounts": [],
      "selectedAccount": null,
      "endpoints": {
        "dev": "ws://127.0.0.1:9944",
        "test-net": "wss://testnet.entropy.xyz",
        "stg": "wss://api.staging.testnet.testnet-2024.infrastructure.entropy.xyz"
      },
      "migration-version": 4,
    }

    const migrated = migrations[5].migrate(initial)
    const expected = {
      "accounts": [],
      "selectedAccount": null,
      "endpoints": {
        "dev": "ws://127.0.0.1:9944",
        "test-net": "wss://testnet.entropy.xyz",
        "stg": "wss://api.staging.testnet.testnet-2024.infrastructure.entropy.xyz"
      },
      "migration-version": 4,
    }

    t.deepEqual(migrated, expected, 'changed selectedAccount: "" => null')
  }

  const makeConfigV4 = () => ({
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
    "migration-version": 4,
  })

  /* selectedAccount: <name> */
  {
    const initial = makeConfigV4()
    const migrated = migrations[5].migrate(initial)
    const expected = makeConfigV4()

    t.deepEqual(migrated, expected, "selectedAccount: <name> (no change)")
  }

  /* selectedAccount: <address> */
  {
    const initial = makeConfigV4()
    initial.selectedAccount = initial.accounts[0].address
    const migrated = migrations[5].migrate(initial)

    const expected = makeConfigV4()

    t.deepEqual(migrated, expected, "selectedAccount: <address> (changes to <name>)")
  }

  /* selectedAccount: <address> (unhappy path) */
  {
    const initial = makeConfigV4()
    initial.selectedAccount = "aaaaayyyyyeee9SrDaHj8rR9am8S5Cfxtz2fA9qBSF1QEuEL"

    t.throws(
      () => migrations[5].migrate(initial),
      /5.*unable to correct selectedAccount/,
      "selectedAccount: <address> (throws if cannot find <name>)"
    )
  }

  t.end()
})
