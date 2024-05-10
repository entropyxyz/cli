import inquirer from "inquirer"
import { hexToU8a, isHex } from "@polkadot/util"
import { encodeAddress, decodeAddress } from "@polkadot/util-crypto"
import { accountChoices, adjustAmount } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

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
      type: "seed",
      seed: accountSeedOrPrivateKey,
    }
  }
 
  const entropy = await initializeEntropy(
    { data },
    endpoint
  )

  const { amount, recipientAddress } = await inquirer.prompt(question)

  if (!entropy.account?.sigRequestKey?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }
  const formattedAmount = adjustAmount(amount);
  const formattedAddress = encodeAddress(
    isHex(recipientAddress)
      ? hexToU8a(recipientAddress)
      : decodeAddress(recipientAddress)
  );
  const tx = await entropy.substrate.tx.balances.transferAllowDeath(
    formattedAddress,
    formattedAmount
  )

  console.log (entropy.account.sigRequestKey.wallet)
  await tx.signAndSend (entropy.account.sigRequestKey.wallet, ({ status }) => {
    if (status.isFinalized) {
      console.log(
        `Transaction successful: Sent ${amount} to ${recipientAddress}`
      )
    }
  })
}
