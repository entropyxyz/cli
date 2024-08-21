export const FLOW_CONTEXT = 'ENTROPY_SIGNING'

export const SIGNING_CONTENT = {
  messageAction: {
    name: 'messageAction',
    message: 'Please choose how you would like to input your message to sign:',
    choices: [
      'Text Input',
      'From a File',
    ],
  },
  textInput: {
    name: "userInput",
    message: "Enter the message you wish to sign (this will open your default editor):",
  },
  pathToFile: {
    name: 'pathToFile',
    message: 'Enter the path to the file you wish to sign:',
  },
  interactionChoice: {
    name: "interactionChoice",
    message: "What would you like to do?",
    choices: [
      "Raw Sign",
      "Sign With Adapter",
      "Exit to Main Menu",
    ],
  },
  hashingAlgorithmInput: {
    name: 'hashingAlgorithm',
    message: 'Enter the hashing algorigthm to be used:',
  },
  auxiliaryDataInput: {
    name: 'auxiliaryDataFile',
    message: 'Enter path to file containing auxiliary data for signing:'
  },
}