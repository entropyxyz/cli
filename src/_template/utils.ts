import { PROMPT } from "./constants"

export async function loadByteCode (path) {
  // TODO
}

export async function loadDanceConfig (path) {
  // TODO
}

// For advanced question options (different types, validation, ...):
// - https://www.npmjs.com/package/inquirer

export const learnDanceQuestions = [
  {
    type: 'input',
    name: PROMPT.learn.byteCodePath.name,
    message: PROMPT.learn.byteCodePath.message
  },
]

export const addDanceQuestions = [
  {
    type: 'input',
    name: PROMPT.add.dancePointer.name,
    message: PROMPT.add.dancePointer.message
  },
  {
    type: 'input',
    name: PROMPT.add.danceConfigPath.name,
    message: PROMPT.add.danceConfigPath.message
  },
]
