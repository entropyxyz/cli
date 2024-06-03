import inquirer from "inquirer"
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, getSelectedAccount, print } from "../../common/utils"

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
    const messageQuestion = {
      type: 'list',
      name: 'messageAction',
      message: 'Please choose how you would like to input your message to sign:',
      choices: [
        'Text Input',
        // 'From a File',
      ],
    }
    const userInputQuestion = {
      type: "editor",
      name: "userInput",
      message: "Enter the message you wish to sign (this will open your default editor):",
    }
    // const pathToFileQuestion = {
    //   type: 'input',
    //   name: 'pathToFile',
    //   message: 'Enter the path to the file you wish to sign:',
    // }
    const { messageAction } = await inquirer.prompt([messageQuestion])
    let msg: string
    switch (messageAction) {
    case 'Text Input': {
      const { userInput } = await inquirer.prompt([userInputQuestion])
      msg = Buffer.from(userInput).toString('hex')
      break
    }
    // case 'From a File': {
    //   break
    // }
    default: {
      console.error('Unsupported Action')
      return
    }
    }
    debug('msg', msg);
    const msgParam = { msg }
    const signature =  await entropy.signWithAdaptersInOrder({
      msg: msgParam,
      order: ['deviceKeyProxy', 'noop'],
    })

    print('signature:', signature)
    return
  }
  default: 
    throw new Error('Unrecognizable action')
  }
}
