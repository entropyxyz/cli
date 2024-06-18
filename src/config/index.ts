import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

import allMigrations from './migrations'
const CONFIG_PATH = `${process.env.HOME}/.entropy-cli.config`

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

export async function init (configPath = CONFIG_PATH) {
  const currentConfig = await get(configPath)
    .catch(async (err) => {
      if (err && err.code !== 'ENOENT') throw err

      // TODO: when we do the migration of location, do it in here
      return {}
    })

  const newConfig = migrateData(allMigrations, currentConfig)

  if (newConfig[VERSION] !== currentConfig[VERSION]) {
    await set(newConfig, configPath)
  }
}

export async function get (configPath = CONFIG_PATH) {
  const configBuffer = await readFile(configPath)
  return JSON.parse(configBuffer.toString())
}

export function getSync (configPath = CONFIG_PATH) {
  const configBuffer = readFileSync(configPath, 'utf8')
  return JSON.parse(configBuffer)
}

export async function set (config = {}, configPath = CONFIG_PATH) {
  await writeFile(configPath, JSON.stringify(config))
}
