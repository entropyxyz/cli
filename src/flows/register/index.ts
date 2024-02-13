import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
// import * as util from "@polkadot/util"

export async function register ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const answers = await inquirer.prompt([accountQuestion])
  const selectedAccount = answers.selectedAccount

  const entropy = await initializeEntropy(
    { data: selectedAccount.data },
    endpoint
  )

  await entropy.ready

  const isRegistered = await entropy.registrationManager.checkRegistrationStatus(
    selectedAccount.address
  )

  console.log("isRegistered", isRegistered)

  if (isRegistered) {
    console.log("Address is already registered:", selectedAccount.address) 
  } else {

    // allow list program
    //   const pointer =
    //     "0x7572505786b022118475733546a273d772b3857de537a0981c3e4a805678e3a0"

    //   console.log("pointer", pointer)
    //   const config = `
    //     {
    //         "allowlisted_addresses": [
    //             "0x772b9a9e8aa1c9db861c6611a82d251db4fac990"
    //         ]
    //     }
    // `
    //   // convert to bytes

    //   const encoder = new TextEncoder()
    //   const byteArray = encoder.encode(config)

    //   // convert u8a to hex
    //   const programConfig = util.u8aToHex (new Uint8Array(byteArray))

    // barebones program
    const pointer =
      "0x3873f6f91334cfb6cad84f94aa1e1025069405a4ea3577a818a5ad8d0e26bb39"
    const programConfig = "0x"

    const programData = {
      programPointer: pointer,
      programConfig: programConfig,
    }

    console.log({ programData })

    console.log("Attempting to register the address:", selectedAccount.address)
    await entropy.register({
      programModAccount: selectedAccount.address,
      keyVisibility: "Permissioned",
      initialPrograms: [programData],
      freeTx: false,
    })

    console.log(
      "Your address",
      selectedAccount.data.address,
      "has been successfully registered."
    )
  }
}
