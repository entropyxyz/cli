export const ENTROPY_ENDPOINT_DEFAULT = 'ws://testnet.entropy.xyz:9944/'

/* 
  A "bit" is the smallest indivisible unit of account value we track.
  A "token" is the human readable unit of value value
  This constant is then "the number of bits that make up 1 token", or said differently
  "how many decimal places our token has".
*/
export const BITS_PER_TOKEN = 1e10


// ASCII Colors for Logging to Console
export const ERROR_RED = '\u001b[31m'
export const SUCCESS_GREEN = '\u001b[32m'
export const INFO_BLUE = '\u001b[34m'