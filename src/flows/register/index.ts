import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import * as util from "@polkadot/util"

export async function register ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices (accounts),
  }
  const answers = await inquirer.prompt ([accountQuestion])
  const selectedAccount = answers.selectedAccount

  const accountData = selectedAccount.data

  console.log("Selected account data:", accountData.seed)

  const entropy = await initializeEntropy (accountData.seed, endpoint)

  await entropy

  console.log({ entropy })

  const isRegistered =
    await entropy.registrationManager.checkRegistrationStatus(
      selectedAccount.data.address
    )

  if (isRegistered) {
    console.log("Address is already registered:", selectedAccount.data.address)

    const pointer =
      "0x7572505786b022118475733546a273d772b3857de537a0981c3e4a805678e3a0"

    console.log("pointer", pointer)
    const config = `
      {
          "allowlisted_addresses": [
              "0x772b9a9e8aa1c9db861c6611a82d251db4fac990"
          ]
      }
  `
    // convert to bytes

    const encoder = new TextEncoder()
    const byteArray = encoder.encode(config)

    // convert u8a to hex
    const programConfig = util.u8aToHex (new Uint8Array(byteArray))

    const programData = {
      programPointer: pointer,
      programConfig: programConfig,
    }

    console.log({ programData })

    console.log (
      "Attempting to register the address:",
      selectedAccount.data.address
    )
    await entropy.register ({
      programModAccount: selectedAccount.data.address,
      keyVisibility: "Permissioned",
      initialPrograms: [programData],
      freeTx: false,
    })

    console.log (
      "Your address",
      selectedAccount.data.address,
      "has been successfully registered."
    )

  }
}
