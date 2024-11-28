import { Entropy } from '@entropyxyz/sdk'
import { Buffer } from 'node:buffer'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { EntropyLogger } from './logger'
import { EntropyConfigAccount } from '../config/types'

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

// ASCII color codes
const GREEN = '\u001b[32m'
const RED = '\u001b[31m'
const BLUE = '\u001b[34m'
const RESET = '\u001b[0m'
print.success = function printSuccess (...args) {
  return print(GREEN, ...args, RESET)
}
print.error = function printError (...args) {
  return print(RED, ...args, RESET)
}
print.info = function printInfo (...args) {
  return print(BLUE, ...args, RESET)
}

export function bold (text) {
  return `\x1b[1m${text}\x1b[0m`
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

export function generateAccountChoices (accounts: EntropyConfigAccount[]) {
  return accounts
    .map((account) => ({
      name: `${account.name} (${account.address})`,
      value: account,
    }))
}

export function accountChoicesWithOther (accounts: EntropyConfigAccount[]) {
  return generateAccountChoices(accounts)
    .concat([{ name: "Other", value: null }])
}

export function findAccountByAddressOrName (accounts: EntropyConfigAccount[], aliasOrAddress: string) {
  if (!aliasOrAddress || !aliasOrAddress.length) throw Error('account name or address required')

  return (
    accounts.find(account => account.address === aliasOrAddress) ||
    accounts.find(account => account.name === aliasOrAddress)
  )
}

export function absolutePath (somePath: string) {
  switch (somePath.charAt(0)) {
  case '.':
    return join(process.cwd(), somePath)
  case '~':
    return join(homedir(), somePath.slice(1))
  default:
    return somePath
  }
}

export function formatDispatchError (entropy: Entropy, dispatchError) {
  let msg: string
  if (dispatchError.isModule) {
    // for module errors, we have the section indexed, lookup
    const decoded = entropy.substrate.registry.findMetaError(
      dispatchError.asModule
    )
    const { docs, name, section } = decoded

    msg = `${section}.${name}: ${docs.join(' ')}`
  } else {
    // Other, CannotLookup, BadOrigin, no extra info
    msg = dispatchError.toString()
  }

  return Error(msg)
}

export async function jumpStartNetwork (entropy, endpoint): Promise<any> {
  const logger = new EntropyLogger('JUMPSTART_NETWORK', endpoint)
  return new Promise((resolve, reject) => {
    entropy.substrate.tx.registry.jumpStartNetwork()
      .signAndSend(entropy.keyring.accounts.registration.pair, ({ status, dispatchError }) => {
        if (dispatchError) {
          const error = formatDispatchError(entropy, dispatchError)
          logger.error('There was an issue jump starting the network', error)
          return reject(error)
        }

        if (status.isFinalized) resolve(status)
      })
  })
}
