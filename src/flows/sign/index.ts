import inquirer from "inquirer"
import { u8aToHex } from '@polkadot/util'
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, getSelectedAccount, print } from "../../common/utils"
import { signWithAdapters } from './sign'

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

  const entropy = await initializeEntropy({ keyMaterial, endpoint })
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

async function signWithAdaptersInOrder (entropy) {
  let msg
  const { messageAction } = await inquirer.prompt([{
    type: 'list',
    name: 'messageAction',
    message: 'Please choose how you would like to input your message to sign:',
    choices: [
      'Text Input',
      /* DO NOT DELETE THIS */
      // 'From a File',
    ],
  }])
  switch (messageAction) {
  case 'Text Input': {
    const { userInput } = await inquirer.prompt([{
      type: "editor",
      name: "userInput",
      message: "Enter the message you wish to sign (this will open your default editor):",
    }])
    msg = userInput
    break
  }
  /* DO NOT DELETE THIS */
  // case 'From a File': {
  //   const { pathToFile } = await inquirer.prompt([{
  //     type: 'input',
  //     name: 'pathToFile',
  //     message: 'Enter the path to the file you wish to sign:',
  //   }])
  //   // TODO: relative/absolute path? encoding?
  //   msg = readFileSync(pathToFile, 'utf-8')
  //   break
  // }
  default: {
    console.error('Unsupported Action')
    return
  }
  }

  print('msg to be signed:', msg)
  print('verifying key:', entropy.signingManager.verifyingKey)
  const signature = await signWithAdapters(entropy, { msg })
  const signatureHexString = u8aToHex(signature)
  print('signature:', signatureHexString)
}

