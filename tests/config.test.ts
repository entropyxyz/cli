import test from 'tape'
import { writeFile } from 'node:fs/promises'
import migrations from '../src/config/migrations'
import { migrateData, init, get, set } from '../src/config'

// used to ensure unique test ids
let id = Date.now()
const makeTmpPath = () => `/tmp/entropy-cli-${id++}.json`

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
    await init(configPath)
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
    await init(configPath)
    config = await get(configPath)
    t.deepEqual(config, newConfig, 'init does not over-write manual changes')
  }

  // NOTE: there's scope for more testsing here but this is a decent start

  t.end()
})
