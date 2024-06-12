import { statSync, readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import envPaths from 'env-paths'
import { mkdirp } from 'mkdirp'
import path from 'path'

import { migrations } from './migrations'
import { debug } from '../common/utils'

const { config: configDir } = envPaths('entropyxyz', { suffix: '' })
const configFile = 'entropy-cli.json'
const configPath = path.join(configDir, configFile)

export function migrateData (data = {}) {
  return migrations.reduce((migratedData, { migrate }) => {
    return migrate(data)
  }, data)
}

export async function init () {
  debug('configPath', configPath)
  mkdirp.sync(configDir)

  try { statSync(configPath) } catch(e: any) {
    if (e && e.code !== 'ENOENT') throw e
    set(migrateData({}))
  }
}

export async function get () {
  const configBuffer = await readFile(configPath)
  return JSON.parse(configBuffer.toString())
}

export function getSync () {
  const configBuffer = readFileSync(configPath, 'utf8')
  return JSON.parse(configBuffer)
}

export async function set (config = {}) {
  await writeFile(configPath, JSON.stringify(config))
}
