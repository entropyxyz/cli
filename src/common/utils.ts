import { readFileSync } from "node:fs"
import { handleChainEndpoint, handleFundingSeed, handleUserSeed } from "./questions"
import Entropy from "@entropyxyz/entropy-js"
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { hexToU8a, isHex } from '@polkadot/util'
import inquirer from "inquirer"


export const readKey = (path: string) =>  {
	const buffer = readFileSync(path)
	const result = new Uint8Array(buffer.byteLength)
	buffer.copy(result)
	buffer.fill(0)
	return result
  }

  export const getUserAddress = async () => {
	const userSeed = await handleUserSeed()
	const endpoint = await handleChainEndpoint()
	const userEntropy = new Entropy({seed: userSeed, endpoint})
	await userEntropy.ready
	return userEntropy.keys?.wallet.address
  }


  export const returnToMain = async () => {
    const response = await inquirer.prompt([
        {
            type: "list",
            name: "nextAction",
            message: "What would you like to do next?",
            choices: [
                { name: "Return to main menu", value: "returnToMain" },
                { name: "Exit", value: "exit" },
                          ],
        },
    ])

    return response.nextAction
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