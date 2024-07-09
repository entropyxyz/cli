import { Buffer } from 'buffer'
import Debug from 'debug'
import { EntropyAccountConfig } from "../config/types"

const _debug = Debug('@entropyxyz/cli')

export function stripHexPrefix (str: string): string {
  if (str.startsWith('0x')) return str.slice(2)
  return str
}

export function debug (...args: any[]) {
  _debug(...args.map(arg => {
    return typeof arg === 'object'
      ? JSON.stringify(arg, replacer, 2)
      : arg
  }))
}
function replacer (key, value) {
  if(value instanceof Uint8Array ){
    return Buffer.from(value).toString('base64')
  }
  else return value
}

export function print (...args) {
  console.log(...args)
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

export function accountChoices (accounts: EntropyAccountConfig[]) {
  return accounts
    .map((account) => ({
      name: `${account.name} (${account.address})`,
      value: account,
    }))
}

export function accountChoicesWithOther (accounts: EntropyAccountConfig[]) {
  return accountChoices(accounts)
    .concat([{ name: "Other", value: null }])
}

export function getSelectedAccount (accounts: EntropyAccountConfig[], address: string) {
  return accounts.find(account => account.address === address)
}
