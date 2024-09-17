import { readFile, writeFile, rm } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { mkdirp } from 'mkdirp'
import { join, dirname } from 'path'
import envPaths from 'env-paths'

import allMigrations from './migrations'
import { serialize, deserialize } from './encoding'

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
      console.log("error", err.code)
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
  let configBuffer
  try {
    configBuffer = readFileSync(configPath, 'utf8')
  } catch (error) {
    if (error.message.includes('ENOENT: no such file or directory')) {
      writeFileSync(configPath, '{}')
      configBuffer = readFileSync(configPath, 'utf8')
    } else {
      throw error
    }
  }
  return deserialize(configBuffer)
}

export async function set (config = {}, configPath = CONFIG_PATH) {
  await mkdirp(dirname(configPath))
  await writeFile(configPath, serialize(config))
}

