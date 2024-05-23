import { decodeAddress, encodeAddress } from "@polkadot/keyring"
import { hexToU8a, isHex } from "@polkadot/util"
import { keccak256 } from "ethereum-cryptography/keccak"
import { Buffer } from 'buffer'
import Debug from 'debug'

const _debug = Debug('@entropyxyz/cli')
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

export function pubToAddress (publicKey: string): string {  
  publicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const hash = keccak256(publicKeyBuffer)
  const address = `0x${Buffer.from(hash.subarray(hash.length - 20)).toString('hex')}`
  debug('address:', address)
  return address
}

export const formatAmountAsHex = (amount) => {
  if (isNaN(amount)) throw new Error(`${amount} cannot be coerced into a number`)
  return `${PREFIX}${(amount * (1 * (10 ** DECIMALS))).toString(16)}`;
}

export function buf2hex (buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("hex")
}

export function isValidSubstrateAddress (address: any) {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address))

    return true
  } catch (error) {
    return false
  }
}

export function accountChoices (accounts) {
  return accounts
    .map((account) => ({
      name: `${account.name} (${account.address})`,
      value: account,
    }))
}

export function accountChoicesWithOther (accounts) {
  return accountChoices(accounts)
    .concat([{ name: "Other", value: null }])
}
