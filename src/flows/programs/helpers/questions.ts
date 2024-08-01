import Entropy from "@entropyxyz/sdk";

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