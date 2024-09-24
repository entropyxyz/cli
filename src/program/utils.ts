import Entropy from "@entropyxyz/sdk"
import fs from "node:fs/promises"
import { isAbsolute, join } from "node:path"
import { u8aToHex } from "@polkadot/util"

import { print } from "../common/utils"

export async function loadFile (path?: string, encoding?: string) {
  if (path === undefined) return

  const absolutePath = isAbsolute(path)
    ? path
    : join(process.cwd(), path)

  switch (encoding) {
  case undefined:
    return fs.readFile(absolutePath)

  case 'json':
    return fs.readFile(absolutePath, 'utf-8')
      .then(string => JSON.parse(string))

  default:
    throw Error('unknown encoding: ' + encoding)
    // return fs.readFile(absolutePath, encoding)
  }
}

export function jsonToHex (obj?: object) {
  if (obj === undefined) return

  const encoder = new TextEncoder()
  const byteArray = encoder.encode(JSON.stringify(obj))

  return u8aToHex(new Uint8Array(byteArray))
}


export function displayPrograms (programs): void {
  programs.forEach((program, index) => {
    print(`${index + 1}.`)
    print({
      pointer: program.program_pointer,
      config: parseProgramConfig(program.program_config)
    })
    print('')
  })

  // private

  function parseProgramConfig (rawConfig: unknown) {
    if (typeof rawConfig !== 'string') return rawConfig
    if (!rawConfig.startsWith('0x')) return rawConfig

    const hex = rawConfig.slice(2)
    const utf8 = Buffer.from(hex, 'hex').toString()
    const output = JSON.parse(utf8)
    Object.keys(output).forEach(key => {
      output[key] = output[key].map(base64toHex)
    })

    return output
  }
  function base64toHex (base64: string): string {
    return Buffer.from(base64, 'base64').toString('hex')
  }
}


export const addQuestions = [
  {
    type: "input",
    name: "programPointerToAdd",
    message: "Enter the program pointer you wish to add:",
    validate: (input) => (input ? true : "Program pointer is required!"),
  },
  {
    type: "editor",
    name: "programConfigJson",
    message:
          "Enter the program configuration as a JSON string (this will open your default editor):",
    validate: (input) => {
      try {
        JSON.parse(input)
        return true
      } catch (e) {
        return "Please enter a valid JSON string for the configuration."
      }
    },
  },
]

export const getProgramPointerInput = [
  {
    type: "input",
    name: "programPointer",
    message: "Enter the program pointer you wish to remove:",
  },
]

export const verifyingKeyQuestion = (entropy: Entropy) => [{
  type: 'list',
  name: 'verifyingKey',
  message: 'Select the key to proceeed',
  choices: entropy.keyring.accounts.registration.verifyingKeys,
  default: entropy.keyring.accounts.registration.verifyingKeys[0]
}]
