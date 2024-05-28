import inquirer from "inquirer"
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, getSelectedAccount, print } from "../../common/utils"

// TODO: revisit this file, rename as signEthTransaction?
export async function sign ({ accounts, endpoints, selectedAccount: selectedAccountAddress }, options) {
  const endpoint = endpoints[options.ENDPOINT]
  const actionChoice = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        "Raw Sign",
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
  case 'Raw Sign': {
    const msg = Buffer.from('Hello world: new signature from entropy!').toString('hex')
    debug('msg', msg);
    const signature = await entropy.sign({
      sigRequestHash: msg,
      hash: 'sha3',
    })

    print('signature:', signature)
    return
  }
  case 'Sign With Adapter': {
    const msg = Buffer.from('Hello world: new signature from entropy!').toString('hex')
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
