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
  interactionChoice: {
    name: "interactionChoice",
    message: "What would you like to do?",
    choices: [
      // Removing the option to select Raw Sign until we fully release signing.
      // We will need to update the flow to ask the user to input the auxilary data for the signature request
      // "Raw Sign",
      "Sign With Adapter",
      "Exit to Main Menu",
    ],
  }
}