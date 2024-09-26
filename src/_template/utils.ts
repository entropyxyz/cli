import { PROMPT } from "./constants";

export async function loadByteCode (path) {
  // TODO
}

export async function loadDanceConfig (path) {
  // TODO
}

function validateAmount (amount: string | number) {
  if (isNaN(amount as number) || parseInt(amount as string) <= 0) {
    return PROMPT.amount.invalidError
  }
  return true
}

const amountQuestion = {
  type: 'input',
  name: PROMPT.amount.name,
  message: PROMPT.amount.message,
  default: PROMPT.amount.default,
  validate: validateAmount
}

const recipientAddressQuestion = {
  type: 'input',
  name: PROMPT.recipientAddress.name,
  message: PROMPT.recipientAddress.message,
}

export const danceInputQuestions = [
  amountQuestion,
  recipientAddressQuestion
]
