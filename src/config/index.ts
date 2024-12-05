import { readFile, writeFile, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { mkdirp } from 'mkdirp'
import { join, dirname } from 'path'
import envPaths from 'env-paths'
import AJV from 'ajv'

import allMigrations from './migrations'
import { serialize, deserialize } from './encoding'
import { EntropyConfig, EntropyConfigAccount } from './types'
import { configSchema } from './schema'

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
  assertConfig(config)
  assertConfigPath(configPath)

  await mkdirp(dirname(configPath))
  await writeFile(configPath, serialize(config))
}

export async function setSelectedAccount (account: EntropyConfigAccount, configPath = CONFIG_PATH) {
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
function assertConfig (config: any) {
  // TODO: replace this with isValidConfig + throws
  if (
    !config ||
    typeof config !== 'object'
  ) {
    throw Error('Config#set: config must be an object')
  }

  if (!Array.isArray(config.accounts)) {
    throw Error('Config#set: config must have "accounts"')
  }

  if (!config.endpoints) {
    throw Error('Config#set: config must have "endpoints"')
  }

  if (typeof config.selectedAccount !== 'string') {
    throw Error('Config#set: config must have "selectedAccount"')
  }

  if (typeof config['migration-version'] !== 'number') {
    throw Error('Config#set: config must have "migration-version"')
  }
}
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

const ajv = new AJV({
  allErrors: true
})

let validator
export const isValidConfig: ValidatorFunction = function (input: any) {
  if (!validator) validator = ajv.compile(configSchema)
  // lazy compile once, it's slowish (~20ms)

  const generalResult = validator(input)
  const selectedAccountResult = isValidSelectedAccount(input)

  const isValid = generalResult && selectedAccountResult

  isValidConfig.errors = isValid
    ? null
    : [
      ...(validator.errors || []),
      ...(isValidSelectedAccount.errors || [])
    ]

  return isValid
}

const isValidSelectedAccount: ValidatorFunction = function (input: any) {
  // TODO: change this behaviour?
  if (input?.selectedAccount === "") {
    isValidSelectedAccount.errors = null
    return true
  }

  if (!input?.selectedAccount || !Array.isArray(input?.accounts)) {
    isValidSelectedAccount.errors = [{
      message: 'unable to check selectedAccount validity'
    }]
    return false
  }

  const isValid = input.accounts.find(acct => acct.name === input.selectedAccount)

  isValidSelectedAccount.errors = isValid
    ? null
    : [{ message: `no account had a "name" matching ${input.selectedAccount}` }]

  return isValid
}

type ValidatorFunction = {
  errors?: null|ValidatorErrorObject[]
  (input: any): boolean
}
interface ValidatorErrorObject {
  message: string
}
