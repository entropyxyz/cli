import inquirer from "inquirer"
import { accountChoices, formatAmountAsHex } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const cliProgress = require('cli-progress');

// note: you have to install this dependency manually since it's not required by cli-progress
const colors = require('ansi-colors');

// create new progress bar

const question = [
  {
    type: "input",
    name: "amount",
    message: "Input amount to transfer:",
    default: "1",
  },
  {
    type: "input",
    name: "recipientAddress",
    message: "Input recipient's address:",
    default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
]

export async function entropyTransfer ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const otherQuestion = {
    type: "input",
    name: "accountSeedOrPrivateKey",
    message: "Enter the account seed or private key:",
    when: (answers) => !answers.selectedAccount
  }
  const answers = await inquirer.prompt ([accountQuestion, otherQuestion])
  const selectedAccount = answers.selectedAccount
  const accountSeedOrPrivateKey = answers.accountSeedOrPrivateKey

  let data = selectedAccount?.data;
  if (!data || Object.keys(data).length === 0) {
    data = {
      seed: accountSeedOrPrivateKey,
    }
  }

  try {
    const entropy = await initializeEntropy(
      { data },
      endpoint
    )

    const b1 = new cliProgress.SingleBar({
      format: 'CLI Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })

    const { amount, recipientAddress } = await inquirer.prompt(question)

    if (!entropy?.registrationManager?.signer?.pair) {
      throw new Error("Signer keypair is undefined or not properly initialized.")
    }
    const formattedAmount = formatAmountAsHex(amount)
    const tx = await entropy.substrate.tx.balances.transferAllowDeath(
      recipientAddress,
      BigInt(formattedAmount),
    )

    await tx.signAndSend (entropy.registrationManager.signer.pair, ({ status }) => {
      // initialize the bar - defining payload token "speed" with the default value "N/A"
      b1.start(500, 0, {
        speed: "N/A"
      });
      // update values
      const interval = setInterval(() => {
        b1.increment()
      }, 100)
      if (status.isFinalized) {
        b1.stop()
        clearInterval(interval)
        console.log(
          `\nTransaction successful: Sent ${amount} to ${recipientAddress}`
        )
        console.log('\nPress enter to return to main menu');
      }
    })
    return;
    
  } catch (error) {
    console.error('ERR:::', error);
    
    
  }
}
