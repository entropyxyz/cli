import * as flows from "./src/flows"
import inquirer, { ListQuestion } from "inquirer"
import { ascii } from "./src/common/ascii"

let restartMain = false

const runFlow = async (flowFunction: () => Promise<string>) => {
    const nextAction = await flowFunction()
    return nextAction
}

const main = async () => {
    console.log(ascii)
    const choices = [
        "Start Entropy", "Entropy Faucet", "Balance", "Register", "Programs", 
        "Sign", "Transfer", "Give Zaps", "New Entropy Wallet", "Exit"
    ]

    const intro: ListQuestion = {
        type: "list",
        name: "action",
        message: "Select Action",
        pageSize: choices.length,
        choices: choices,
    }
    
    const { action } = await inquirer.prompt(intro)
    let nextAction = ''

    switch (action) {
        case "Start Entropy": nextAction = await runFlow(flows.startEntropy); break
        case "Entropy Faucet": nextAction = await runFlow(flows.entropyFaucet); break;
        case "Balance": nextAction = await runFlow(flows.balance); break;
        case "Register": nextAction = await runFlow(flows.register); break;
        case "Programs": nextAction = await runFlow(flows.setProgram); break;
        case "Sign": nextAction = await runFlow(flows.sign); break;
        case "Transfer": nextAction = await runFlow(flows.entropyTransfer); break;
        case "Give Zaps": nextAction = await runFlow(flows.giveZaps); break;
        case "New Entropy Wallet": nextAction = await runFlow(flows.newWallet); break;
        case "Exit": process.exit(); break;
        default:
            console.warn(`Received an unexpected action: "${action}"`)
            nextAction = 'returnToMain'
            break
    }

    switch (nextAction) {
        case 'returnToMain':
            restartMain = true
            break
        case 'exit':
            process.exit()
            break
        default:
            console.warn(`Received an unexpected next action: "${nextAction}"`)
            restartMain = true
            break
    }
}

const start = async () => {
    do {
        await main()
    } while (restartMain)
    restartMain = false
}


export { start }