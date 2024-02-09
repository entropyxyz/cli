import { statSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { migrations } from './migrations'
const configPath = `${process.env.HOME}/.entropy-cli.config`

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