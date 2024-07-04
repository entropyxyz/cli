import test from 'tape'
import { writeFile } from 'node:fs/promises'
import migrations from '../src/config/migrations'
import { migrateData, init, get, set } from '../src/config'
import { replacer } from '../src/common/utils'

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

test('config - get', async t => {
  const configPath = makeTmpPath()
  const config = { boop: 'doop' }
  await writeFile(configPath, JSON.stringify(config))

  const result = await get(configPath)
  t.deepEqual(result, config, 'get works')

  await get('/tmp/junk')
    .then(() => t.fail('bad path should fail'))
    .catch(err => {
      t.match(err.message, /no such file/, 'bad path should fail')
    })
})

test('config - set', async t => {
  const configPath = makeTmpPath()

  const config = { dog: true }
  await set(config, configPath)
  const actual = await get(configPath)

  t.deepEqual(actual, config, 'set works')
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


test.only('config/migrattions/02', t => {
  const initial = JSON.parse(
    '{"accounts":[{"name":"Mix","address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","data":{"debug":true,"seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","admin":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","type":"registration","verifyingKeys":["0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"],"userContext":"ADMIN_KEY","seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","path":"","pair":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","addressRaw":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"isLocked":false,"meta":{},"publicKey":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"type":"sr25519","secretKey":{"0":120,"1":247,"2":1,"3":38,"4":246,"5":195,"6":0,"7":49,"8":84,"9":240,"10":226,"11":144,"12":66,"13":172,"14":130,"15":168,"16":237,"17":74,"18":121,"19":243,"20":49,"21":217,"22":208,"23":70,"24":160,"25":220,"26":125,"27":114,"28":230,"29":17,"30":254,"31":71,"32":158,"33":68,"34":133,"35":24,"36":119,"37":34,"38":46,"39":154,"40":85,"41":62,"42":178,"43":69,"44":206,"45":217,"46":132,"47":184,"48":8,"49":219,"50":89,"51":165,"52":189,"53":106,"54":6,"55":51,"56":112,"57":76,"58":42,"59":157,"60":146,"61":130,"62":203,"63":241}},"used":true},"registration":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","type":"registration","verifyingKeys":["0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"],"userContext":"ADMIN_KEY","seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","path":"","pair":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","addressRaw":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"isLocked":false,"meta":{},"publicKey":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"type":"sr25519","secretKey":{"0":120,"1":247,"2":1,"3":38,"4":246,"5":195,"6":0,"7":49,"8":84,"9":240,"10":226,"11":144,"12":66,"13":172,"14":130,"15":168,"16":237,"17":74,"18":121,"19":243,"20":49,"21":217,"22":208,"23":70,"24":160,"25":220,"26":125,"27":114,"28":230,"29":17,"30":254,"31":71,"32":158,"33":68,"34":133,"35":24,"36":119,"37":34,"38":46,"39":154,"40":85,"41":62,"42":178,"43":69,"44":206,"45":217,"46":132,"47":184,"48":8,"49":219,"50":89,"51":165,"52":189,"53":106,"54":6,"55":51,"56":112,"57":76,"58":42,"59":157,"60":146,"61":130,"62":203,"63":241}},"used":true},"deviceKey":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","type":"deviceKey","verifyingKeys":["0x03b225d2032e1dbff26316cc8b7d695b3386400d30ce004c1b42e2c28bcd834039"],"userContext":"CONSUMER_KEY","seed":"0xc4c466182b86ff1f4a16548df79c5808ab9bcde87c22c27938ac9aabc4300840","path":"","pair":{"address":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","addressRaw":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"isLocked":false,"meta":{},"publicKey":{"0":182,"1":241,"2":171,"3":246,"4":239,"5":100,"6":192,"7":41,"8":49,"9":32,"10":10,"11":84,"12":241,"13":225,"14":183,"15":152,"16":164,"17":182,"18":176,"19":244,"20":39,"21":237,"22":74,"23":225,"24":250,"25":244,"26":187,"27":129,"28":97,"29":222,"30":33,"31":116},"type":"sr25519","secretKey":{"0":120,"1":247,"2":1,"3":38,"4":246,"5":195,"6":0,"7":49,"8":84,"9":240,"10":226,"11":144,"12":66,"13":172,"14":130,"15":168,"16":237,"17":74,"18":121,"19":243,"20":49,"21":217,"22":208,"23":70,"24":160,"25":220,"26":125,"27":114,"28":230,"29":17,"30":254,"31":71,"32":158,"33":68,"34":133,"35":24,"36":119,"37":34,"38":46,"39":154,"40":85,"41":62,"42":178,"43":69,"44":206,"45":217,"46":132,"47":184,"48":8,"49":219,"50":89,"51":165,"52":189,"53":106,"54":6,"55":51,"56":112,"57":76,"58":42,"59":157,"60":146,"61":130,"62":203,"63":241}},"used":true}}}],"selectedAccount":"5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8","endpoints":{"dev":"ws://127.0.0.1:9944","test-net":"wss://testnet.entropy.xyz"},"migration-version":1}'
  )

  const expected = {
    account: [{
      name: "Mix"
    }],
    selectedAccount: "5GCaN3fcL6vAQQKamHzVSorwv2XqtM3WcxosCLd9JqGVrtS8",
    endpoints: {
      "dev": "ws://127.0.0.1:9944",
      "test-net":"wss://testnet.entropy.xyz"
    },
    "migration-version": 1
  }

  const migrated = migrations[2].migrate(initial)
  console.log(migrated.accounts[0].data.registration.pair.secretKey.constructor)
  // t.true(migrated.accounts[0].data.registration.pair.secretKey)

  // console.log(JSON.stringify(migrated, replacer, 2))

  t.deepEqual(
    expected,
    migrations[2].migrate(initial)
  )

  t.end()
})
