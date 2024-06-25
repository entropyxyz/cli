import { readFile, writeFile } from 'node:fs/promises'
import allMigrations from './migrations'
const configPath = `${process.env.HOME}/.entropy-cli.config`

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

export async function init () {
  const currentConfig = await get()

  const newConfig = migrateData(allMigrations, currentConfig)

  if (newConfig[VERSION] !== currentConfig[VERSION]) {
    await set(newConfig)
  }
}

export async function get () {
  const configBuffer = await readFile(configPath)
  return JSON.parse(configBuffer.toString())
}

export async function set (config = {}) {
  await writeFile(configPath, JSON.stringify(config))
}