import { readFileSync } from "fs"
import { SIGNING_CONTENT } from "./constants"
import { RawSignPayload, SignWithAdapterInput } from "./types"

function stringToHex (str: string): string {
  return Buffer.from(str).toString('hex')
}

export const interactionChoiceQuestions = [{
  type: "list",
  name: SIGNING_CONTENT.interactionChoice.name,
  message: SIGNING_CONTENT.interactionChoice.message,
  choices: SIGNING_CONTENT.interactionChoice.choices
}]

export const messageActionQuestions = [{
  type: 'list',
  name: SIGNING_CONTENT.messageAction.name,
  message: SIGNING_CONTENT.messageAction.message,
  choices: SIGNING_CONTENT.messageAction.choices,
}]

export const userInputQuestions = [{
  type: "editor",
  name: SIGNING_CONTENT.textInput.name,
  message: SIGNING_CONTENT.textInput.message,
}]

export function getMsgFromInputOrFile (msg?: string, msgPath?: string) {
  let result: string = msg
  if (!msg && msgPath) {
    result = readFileSync(msgPath, 'utf-8')
  }
  if (!msg && !msgPath) {
    throw new Error('SigningError: You must provide a message or path to a file')
  }

  return result
}

export async function rawSign (entropy, payload: RawSignPayload) {
  return entropy.sign(payload)
}

export async function signWithAdapters (entropy, input: SignWithAdapterInput) {
  return entropy.signWithAdaptersInOrder({
    msg: {
      msg: stringToHex(input.msg)
    },
    // type
    order: ['deviceKeyProxy', 'noop'],
    signatureVerifyingKey: input.verifyingKey
    // auxillaryData
  })
}