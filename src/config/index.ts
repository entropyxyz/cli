import { readFile, writeFile, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { mkdirp } from 'mkdirp'
import { join, dirname } from 'path'
import envPaths from 'env-paths'

import allMigrations from './migrations'
import { serialize, deserialize } from './encoding'
import { EntropyConfig, EntropyAccountConfig } from './types'

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
    .catch(async (err ) => {
      if (isDangerousReadError(err)) throw err

      // If there is no current config, try loading the old one
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
}

export function getSync (configPath = CONFIG_PATH) {
  const configStr = readFileSync(configPath, 'utf8')
  return deserialize(configStr)
}

export async function set (config: EntropyConfig, configPath = CONFIG_PATH) {
  assertConfigPath(configPath)

  await mkdirp(dirname(configPath))
  await writeFile(configPath, serialize(config))
}

export async function setSelectedAccount (account: EntropyAccountConfig, configPath = CONFIG_PATH) {
  const storedConfig = await get(configPath)

  if (storedConfig.selectedAccount === account.name) return storedConfig
  // no need for update

  const newConfig = {
    ...storedConfig,
    selectedAccount: account.name
  }
  await set(newConfig, configPath)
  return newConfig
}

/* util */
function noop () {}
function assertConfigPath (configPath: string) {
  if (!configPath.endsWith('.json')) {
    throw Error(`configPath must be of form *.json, got ${configPath}`)
  }
}
export function isDangerousReadError (err: any) {
  // file not found:
  if (err.code === 'ENOENT') return false

  return true
}
