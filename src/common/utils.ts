import { readFileSync } from "node:fs"
import { handleChainEndpoint, handleFundingSeed, handleUserSeed } from "./questions"
import Entropy from "@entropyxyz/sdk"
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { hexToU8a, isHex } from '@polkadot/util'
import inquirer from "inquirer"
import { getWallet } from '@entropyxyz/sdk/dist/keys'
import { EntropyAccount } from "@entropyxyz/sdk"
import { createWalletClient, http, type Hex} from 'viem'
import { privateKeyToAccount } from "viem/accounts"


import { sepolia } from 'viem/chains'

export function getActiveOptions (options) {
  return options.reduce((setOptions, option) => {
    if (process.argv.includes(option.long) || process.argv.includes(option.short)) {
      setOptions[option.key] = true
    }
    return setOptions
  }, {})
}


// Streamlined user address initialization with async/await and error handling
export const getUserAddress = async () => {
  const userSeed = await handleUserSeed()
  const endpoint = await handleChainEndpoint()

  const signer = await getWallet(userSeed)

  const entropyAccount = {
    sigRequestKey: signer,
    programModKey: signer,
    programDeployKey: signer,
  }
  return entropyAccount?.sigRequestKey?.wallet?.address
}

export const returnToMain = async () =>  {
  const response = await inquirer.prompt([
    {
      type: "confirm",
      name: "returnToMain",
      message: "Return to main menu?",
      default: true,
    },
  ])

  return response.returnToMain
}

export function buf2hex (buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('hex')
}



export function isValidSubstrateAddress (address: any) {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address))

    return true
  } catch (error) {
    return false
  }
}



// const privateKey =process.env.ETH_PK

// const account = privateKeyToAccount(
//   privateKey as Hex
// )

// export const ethClient = createWalletClient({
//   account,
//   chain: sepolia,
//   transport:http(process.env.ETH_RPC_URL)
// })

// console.log({ethClient})

