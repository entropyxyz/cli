import {  ethers } from "ethers"
import { handleUserSeed, handleChainEndpoint } from "../../common/questions"
import { getTx } from "../../../tx"
import { Controller } from "../../../controller"
import { returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { BigNumber } from "ethers"

export const sign = async (controller: Controller) => {
  const seed = await handleUserSeed()
  const endpoint = await handleChainEndpoint()
  
  const entropy = await initializeEntropy(seed, endpoint)

  let address = entropy.account?.sigRequestKey?.wallet.address
  console.log({ address })
  if (address == undefined) {
    throw new Error("address issue")
  }
//   const tx = await getTx()

const basicTx = {
    to: "0x772b9a9e8aa1c9db861c6611a82d251db4fac990",
    value: 1,
    chainId: 1,
    nonce: 1,
    data: '0x' + Buffer.from('Created On Entropy').toString('hex'),
  }

  const signature = await entropy.signTransaction({txParams: basicTx, type: 'eth' }) as string

  console.log({ signature })
  if (await returnToMain()) {
    console.clear()
    controller.emit('returnToMain')
  } else {
    controller.emit('exit')
  }
}
