import { Entropy } from '@entropyxyz/sdk'
import { Buffer } from 'buffer'
import { EntropyConfigAccount } from "../config/types"
import { EntropyLogger } from './logger'
import { TokenDetails } from 'src/types'

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

// caching details to reduce number of calls made to the rpc endpoint
let tokenDetails: TokenDetails
export async function getTokenDetails (substrate): Promise<TokenDetails> {
  if (tokenDetails) return tokenDetails
  const chainProperties = await substrate.rpc.system.properties()
  const decimals = chainProperties.tokenDecimals.toHuman()[0]
  const symbol = chainProperties.tokenSymbol.toHuman()[0]
  tokenDetails = { decimals: parseInt(decimals), symbol }
  return tokenDetails
}

/* 
  A "nanoBITS" is the smallest indivisible unit of account value we track.
  A "BITS" is the human readable unit of value value
  This constant is then "the number of nanoBITS that make up 1 BITS", or said differently
  "how many decimal places our BITS has".
*/
export const nanoBitsPerBits = (decimals: number): number => {
  return Math.pow(10, decimals) 
}

export function nanoBitsToBits (numOfNanoBits: number, decimals: number) {
  return numOfNanoBits / nanoBitsPerBits(decimals)
}

export function bitsToNanoBits (numOfBits: number, decimals: number): bigint {
  return BigInt(numOfBits * nanoBitsPerBits(decimals))
}

export function round (num: number, decimals: number = 4): number {
  return parseFloat(num.toFixed(decimals))
}