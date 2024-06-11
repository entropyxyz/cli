import { statSync, readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { migrations } from './migrations'

const CONFIG_PATH = `${process.env.HOME}/.entropy-cli.config`

export function migrateData (data = {}) {
  return migrations.reduce((migratedData, { migrate }) => {
    return migrate(data)
  }, data)
}

export async function init () {
  try { statSync(CONFIG_PATH) } catch(e: any) {
    if (e && e.code !== 'ENOENT') throw e
    set(migrateData({}))
  }
}

export async function get () {
  const configBuffer = await readFile(CONFIG_PATH)
  return JSON.parse(configBuffer.toString())
}

export function getSync () {
  const configBuffer = readFileSync(CONFIG_PATH, 'utf8')
  return JSON.parse(configBuffer)
}

export async function set (config = {}) {
  await writeFile(CONFIG_PATH, JSON.stringify(config))
}
