import { readFile, writeFile, rm } from 'node:fs/promises'
import { mkdirp } from 'mkdirp'
import { join, dirname } from 'path'
import envPaths from 'env-paths'
import AJV from 'ajv'

import allMigrations from './migrations'
import { serialize, deserialize } from './encoding'
import { EntropyConfig, EntropyConfigAccount } from './types'
import { configSchema } from './schema'

const paths = envPaths('entropy-cryptography', { suffix: '' })
const OLD_CONFIG_PATH = join(process.env.HOME, '.entropy-cli.config')

export const CONFIG_PATH_DEFAULT = join(paths.config, 'entropy-cli.json')
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

export async function init (configPath: string, oldConfigPath = OLD_CONFIG_PATH) {
  const currentConfig = await get(configPath)
    .catch(async (err ) => {
      if (isDangerousReadError(err)) throw err

      // If there is no current config, try loading the old one
      const oldConfig = await get(oldConfigPath).catch(noop) // drop errors
      if (oldConfig) {
        // move the config
        await set(configPath, oldConfig)
        await rm(oldConfigPath)
        return oldConfig
      }
      else return {}
    })

  const newConfig = migrateData(allMigrations, currentConfig)

  if (newConfig[VERSION] !== currentConfig[VERSION]) {
    // a migration happened, write updated config
    // "set" checks the format of the config for us
    await set(configPath, newConfig)
  }
  else {
    // make sure the config the app is about to run on is safe
    assertConfig(newConfig)
  }
}

export async function get (configPath) {
  return readFile(configPath, 'utf-8')
    .then(deserialize)
}

export async function set (configPath: string, config: EntropyConfig) {
  assertConfig(config)
  assertConfigPath(configPath)

  await mkdirp(dirname(configPath))
  await writeFile(configPath, serialize(config))
}

export async function setSelectedAccount (configPath: string, account: EntropyConfigAccount) {
  const storedConfig = await get(configPath)

  if (storedConfig.selectedAccount === account.name) return storedConfig
  // no need for update

  const newConfig = {
    ...storedConfig,
    selectedAccount: account.name
  }
  await set(configPath, newConfig)
  return newConfig
}

/* util */
function noop () {}

export function assertConfig (config: any) {
  if (isValidConfig(config)) return

  // @ts-expect-error this is valid Node...
  throw new Error('Invalid config', {
    cause: isValidConfig.errors
      .map(err => {
        return err.instancePath
          ? `config${err.instancePath}: ${err.message}`
          : err.message
      })
      .join("; ")
  })

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
  allErrors: true,
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
      message: 'unable to check "selectedAccount" validity'
    }]
    return false
  }

  const isValid = input.accounts.find(acct => acct.name === input.selectedAccount)

  isValidSelectedAccount.errors = isValid
    ? null
    : [{ message: `config/selectedAccount: "${input.selectedAccount}" "no account had a "name" matching "selectedAccount": ` }]

  return isValid
}

type ValidatorFunction = {
  errors?: null|ValidatorErrorObject[]
  (input: any): boolean
}
interface ValidatorErrorObject {
  instancePath?: string
  message: string
}
