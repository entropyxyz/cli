import { readFile, writeFile, rm } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { mkdirp } from 'mkdirp'
import { join, dirname } from 'path'
import envPaths from 'env-paths'

import allMigrations from './migrations'
import { serialize, deserialize } from './encoding'
import { EntropyConfig } from './types'

const paths = envPaths('entropy-cryptography', { suffix: '' })
const CONFIG_PATH = join(paths.config, 'entropy-cli.json')
const OLD_CONFIG_PATH = join(process.env.HOME, '.entropy-cli.config')

export const VERSION = 'migration-version'

export function migrateData (migrations, currentConfig = {}) {
  return migrations.reduce((newConfig, { migrate, version }) => {
    // check if migration already run
    if (hasRunMigration(newConfig, version)) return newConfig

    return {
      ...migrate(newConfig),
      [VERSION]: Number(version)
    }
  }, currentConfig)
}

function hasRunMigration (config: any, version: number) {
  const currentVersion = config[VERSION]
  if (currentVersion === undefined) return false

  return Number(currentVersion) >= Number(version)
}

export async function init (configPath = CONFIG_PATH, oldConfigPath = OLD_CONFIG_PATH) {
  const currentConfig = await get(configPath)
    .catch(async (err) => {
      if (err.code !== 'ENOENT') throw err

      const oldConfig = await get(oldConfigPath).catch(noop) // drop errors
      if (oldConfig) {
        // move the config
        await set(oldConfig, configPath)
        await rm(oldConfigPath)
        return oldConfig
      }
      else return {}
    })

  const newConfig = migrateData(allMigrations, currentConfig)

  if (newConfig[VERSION] !== currentConfig[VERSION]) {
    await set(newConfig, configPath)
  }
}

export async function get (configPath = CONFIG_PATH) {
  return readFile(configPath, 'utf-8')
    .then(deserialize)
    .catch(makeGetErrorHandler(configPath))
}

export function getSync (configPath = CONFIG_PATH): EntropyConfig {
  try {
    const configBuffer = readFileSync(configPath, 'utf8')
    return deserialize(configBuffer)
  } catch (err) {
    return makeGetErrorHandler(configPath)(err)
  }
}

export async function set (config: EntropyConfig, configPath = CONFIG_PATH) {
  await mkdirp(dirname(configPath))
  await writeFile(configPath, serialize(config))
}

/* util */
function noop () {}

function makeGetErrorHandler (configPath) {
  return function getErrorHandler (err) {
    if (err.code !== 'ENOENT') throw err

    const newConfig = migrateData(allMigrations, {})
    mkdirp.sync(dirname(configPath))
    writeFileSync(configPath, serialize(newConfig))
    return newConfig
  }
}
