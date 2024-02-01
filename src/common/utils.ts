import { readFileSync } from "node:fs"
import { handleChainEndpoint, handleFundingSeed, handleUserSeed } from "./questions"
import Entropy from "@entropyxyz/sdk"
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { hexToU8a, isHex } from '@polkadot/util'
import inquirer from "inquirer"
import { getWallet } from '@entropyxyz/sdk/dist/keys'
import { EntropyAccount } from "@entropyxyz/sdk"


export const readKey = (path: string) =>  {
	const buffer = readFileSync(path)
	const result = new Uint8Array(buffer.byteLength)
	buffer.copy(result)
	buffer.fill(0)
	return result
  }

// Streamlined user address initialization with async/await and error handling
export const getUserAddress = async () => {
  try {
    const userSeed = await handleUserSeed()
    const endpoint = await handleChainEndpoint()

    const signer = await getWallet(userSeed)

    const entropyAccount: EntropyAccount = {
      sigRequestKey: signer,
      programModKey: signer,
      programDeployKey: signer,
    }

    const userEntropy = new Entropy({ account: entropyAccount, endpoint })
    await userEntropy.ready
    return userEntropy.account?.sigRequestKey?.wallet.address
  } catch (error) {
    console.error("Error initializing user address:", error)
    return null
  }
}

 export const returnToMain = async() =>  {
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
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
}



export function isValidSubstrateAddress (address: any) {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address))

    return true
  } catch (error) {
    return false
  }
}