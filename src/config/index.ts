import { readFile, writeFile, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { mkdirp } from 'mkdirp'
import { join, dirname } from 'path'
import envPaths from 'env-paths'
import isBase64 from 'is-base64'

import allMigrations from './migrations'

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
      if (err && err.code !== 'ENOENT') throw err

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
function noop () {}

export async function get (configPath = CONFIG_PATH) {
  const configBuffer = await readFile(configPath)
  return deserialize(configBuffer.toString())
}

export function getSync (configPath = CONFIG_PATH) {
  const configBuffer = readFileSync(configPath, 'utf8')
  return deserialize(configBuffer)
}

export async function set (config = {}, configPath = CONFIG_PATH) {
  await mkdirp(dirname(configPath))
  await writeFile(configPath, serialize(config))
}

function serialize (config) {
  function replacer (key, value) {
    if (value instanceof Uint8Array) {
      return Buffer.from(value).toString('base64')
    }
    else return value
  }
  return JSON.stringify(config, replacer, 2)
}

function deserialize (config) {
  function reviver (key, value) {
    if (
      isBase64(value, { allowEmpty: false }) &&
      value.length >= 32
      // NOTE: we have to check length so we don't accidentally transform
      // user simple string that are valid base64 like "registration"
    ) {
      return Uint8Array.from(Buffer.from(value, 'base64'))
    }
    else return value
  }

  return JSON.parse(config, reviver)
}
