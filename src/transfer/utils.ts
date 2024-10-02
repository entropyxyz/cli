import { TRANSFER_CONTENT } from "./constants";

function validateAmount (amount: string | number) {
  if (isNaN(amount as number) || parseInt(amount as string) <= 0) {
    return TRANSFER_CONTENT.amount.invalidError
  }
  return true
}

const amountQuestion = {
  type: 'input',
  name: TRANSFER_CONTENT.amount.name,
  message: TRANSFER_CONTENT.amount.message,
  default: TRANSFER_CONTENT.amount.default,
  validate: validateAmount
}

const recipientAddressQuestion = {
  type: 'input',
  name: TRANSFER_CONTENT.recipientAddress.name,
  message: TRANSFER_CONTENT.recipientAddress.message,
}

export const transferInputQuestions = [
  amountQuestion,
  recipientAddressQuestion
]