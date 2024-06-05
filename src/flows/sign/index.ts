import inquirer from "inquirer"
import { u8aToHex } from '@polkadot/util'
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, getSelectedAccount, print } from "../../common/utils"

let msg: string
let signingAttempts: number = 0

async function signWithAdaptersInOrder (entropy, signingData?: { msg: { msg: string }, order: string[] }) {
  try {
    const messageQuestion = {
      type: 'list',
      name: 'messageAction',
      message: 'Please choose how you would like to input your message to sign:',
      choices: [
        'Text Input',
        /* DO NOT DELETE THIS */
        // 'From a File',
      ],
    }
    const userInputQuestion = {
      type: "editor",
      name: "userInput",
      message: "Enter the message you wish to sign (this will open your default editor):",
    }
    /* DO NOT DELETE THIS */
    // const pathToFileQuestion = {
    //   type: 'input',
    //   name: 'pathToFile',
    //   message: 'Enter the path to the file you wish to sign:',
    // }
    let messageAction
    if (!msg) {
      ({ messageAction } = await inquirer.prompt([messageQuestion]))
      switch (messageAction) {
      case 'Text Input': {
        const { userInput } = await inquirer.prompt([userInputQuestion])
        msg = Buffer.from(userInput).toString('hex')
        break
      }
      /* DO NOT DELETE THIS */
      // case 'From a File': {
      //   break
      // }
      default: {
        console.error('Unsupported Action')
        return
      }
      }
    }
    debug('msg', msg);
    const msgParam = { msg }
    if (!signingData) {
      signingData = {
        msg: msgParam,
        order: ['deviceKeyProxy', 'noop'],
      }
    }
    const signature = await entropy.signWithAdaptersInOrder(signingData)
    const signatureHexString = u8aToHex(signature)
    // Resetting signingAttempts on success
    signingAttempts = 0
    print('signature:', signatureHexString)
    print('verifying key:', entropy.signingManager.verifyingKey)
  } catch (error) {
    signingAttempts++
    const { message } = error
    // See https://github.com/entropyxyz/sdk/issues/367 for reasoning behind adding this retry mechanism
    if (message.includes('Invalid Signer') || message.includes('Invalid Signer in Signing group')) {
      if (signingAttempts <= 1) {
        const msgParam = { msg }
        signingData = {
          msg: msgParam,
          order: ['noop', 'deviceKeyProxy']
        }
        // Recursively retries signing with a reverse order in the subgroups list
        await signWithAdaptersInOrder(entropy, signingData)
      }
    }
    console.error(message)
    return
  }
}

export async function sign ({ accounts, endpoints, selectedAccount: selectedAccountAddress }, options) {
  const endpoint = endpoints[options.ENDPOINT]
  const actionChoice = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        // Removing the option to select Raw Sign until we fully release signing.
        // We will need to update the flow to ask the user to input the auxilary data for the signature request
        // "Raw Sign",
        "Sign With Adapter",
        "Exit to Main Menu",
      ],
    },
  ])

  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  debug("selectedAccount:", selectedAccount)
  const keyMaterial = selectedAccount?.data;

  const entropy = await initializeEntropy({ keyMaterial }, endpoint)
  const { address } = entropy.keyring.accounts.registration
  debug("address:", address)
  if (address == undefined) {
    throw new Error("address issue")
  }
  switch (actionChoice.action) {
  // case 'Raw Sign': {
  //   const msg = Buffer.from('Hello world: new signature from entropy!').toString('hex')
  //   debug('msg', msg);
  //   const signature = await entropy.sign({
  //     sigRequestHash: msg,
  //     hash: 'sha3',
  // naynay does not think he is doing this properly
  //     auxiliaryData: [
  //       {
  //         public_key_type: 'sr25519',
  //         public_key: Buffer.from(entropy.keyring.accounts.registration.pair.publicKey).toString('base64'),
  //         signature: entropy.keyring.accounts.registration.pair.sign(msg),
  //         context: 'substrate',
  //       },
  //     ],
  //   })

  //   print('signature:', signature)
  //   return
  // }
  case 'Sign With Adapter': {
    await signWithAdaptersInOrder(entropy)
    return
  }
  case 'Exit to Main Menu': 
    return 'exit'
  default: 
    throw new Error('Unrecognizable action')
  }
}
