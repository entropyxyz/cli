import * as config from '../config'
import { Buffer } from 'buffer'
import { EntropyAccountConfig, EntropyConfig } from "../config/types"

export function stripHexPrefix (str: string): string {
  if (str.startsWith('0x')) return str.slice(2)
  return str
}

export function stringify (thing, indent = 2) {
  return (typeof thing === 'object')
    ? JSON.stringify(thing, replacer, indent)
    : thing
}

export function replacer (key, value) {
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64')
  }
  else return value
}

export function print (...args) {
  console.log(...args.map(arg => stringify(arg)))
}

// hardcoding for now instead of querying chain
const DECIMALS = 10
const PREFIX = '0x'

export function isEmpty (data?: object) {
  return data === undefined || Object.keys(data).length === 0
}

export const formatAmountAsHex = (amount: number) => {
  return `${PREFIX}${(amount * (10 ** DECIMALS)).toString(16)}`
}

export function getActiveOptions (options) {
  return options.reduce((setOptions, option) => {
    if (option.default) setOptions[option.key] = option.default
    if (
      process.argv.includes(option.long) ||
      process.argv.includes(option.short)
    ) {
      setOptions[option.key] = true
    }
    return setOptions
  }, {})
}

export function buf2hex (buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("hex")
}

export function generateAccountChoices (accounts: EntropyAccountConfig[]) {
  return accounts
    .map((account) => ({
      name: `${account.name} (${account.address})`,
      value: account,
    }))
}

export function accountChoicesWithOther (accounts: EntropyAccountConfig[]) {
  return generateAccountChoices(accounts)
    .concat([{ name: "Other", value: null }])
}

// TODO: rename => findAccountByNameAddress
export function getSelectedAccount (accounts: EntropyAccountConfig[], address: string) {
  return accounts.find(account => account.address === address)
}

export async function updateConfig (storedConfig: EntropyConfig, newUpdates: any) {
  if (typeof newUpdates === 'string' && newUpdates === 'exit') {
    return true
  } else if (newUpdates) {
    await config.set({ ...storedConfig, ...newUpdates })
  }
  return false
}
