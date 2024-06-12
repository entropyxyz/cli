import { statSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import envPaths from 'env-paths'
import { mkdirp } from 'mkdirp'
import path from 'path'

import { migrations } from './migrations'
import { debug } from '../common/utils'

const paths = envPaths('entropyxyz', { suffix: '' })

const configDir  = paths.config
const configFile = 'entropy-cli.json'
const configPath = path.join(configDir, configFile)
debug('configPath', configPath)

mkdirp.sync(configDir)

export function migrateData (data = {}) {
  return migrations.reduce((migratedData, { migrate }) => {
    return migrate(data)
  }, data)
}

export async function init () {
  try { statSync(configPath) } catch(e: any) {
    if (e && e.code !== 'ENOENT') throw e
    set(migrateData({}))
  }
}

export async function get () {
  const configBuffer = await readFile(configPath)
  return JSON.parse(configBuffer.toString())
}

export async function set (config = {}) {
  await writeFile(configPath, JSON.stringify(config))
}
