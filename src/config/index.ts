import { statSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { migrations } from './migrations'

const configFile = '.entropy-cli.config'
const configDir  = process.env.XDG_CONFIG_HOME
  ? `${process.env.XDG_CONFIG_HOME}/entropy-cryptography` : process.env.HOME
const configPath = `${configDir}/${configFile}`

try {
  mkdirSync(configDir, {mode: '0700'})
} catch (e) {
  switch (e.code) {
  // These "errors" are actually good things.
  case 'EEXIST': {
    // Do nothing. We good.
    break;
  }
  default: {
    // Something bad happened.
    console.error(e);
    throw new Error(`Error creating configuration directory ${configDir}`)
    break;
  }
  }
}

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