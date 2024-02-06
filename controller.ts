import { EventEmitter } from 'events';
import * as flows from "./src/flows";
import inquirer, { ListQuestion } from "inquirer";
import { ascii } from "./src/common/ascii";

export class Controller extends EventEmitter {
    private static instance: Controller;
    private restartMain: boolean = false;
    private currentFlow: Promise<void> | null = null;
    private resolveCurrentFlow: (() => void) | null = null;

    private constructor() {
        super();
        this.initListeners();
    }

    static getInstance(): Controller {
        if (!Controller.instance) {
            Controller.instance = new Controller();
        }
        return Controller.instance;
    }

    runFlow(flowFunction: (controller: Controller) => Promise<void>) {
        this.removeAllListeners();
        this.currentFlow = new Promise((resolve) => {
            this.resolveCurrentFlow = resolve;
        });
        flowFunction(this).then(() => {
            if (this.resolveCurrentFlow) {
                this.resolveCurrentFlow();
                this.resolveCurrentFlow = null;
            }
        });
        this.initListeners();
    }

    initListeners() {
        this.on('returnToMain', () => {
            this.restartMain = true;
        });
        this.on('balance', () => this.runFlow(flows.balance))
        this.on('entropyFaucet', () => this.runFlow(flows.entropyFaucet))
        this.on('UserPrograms', () => this.runFlow(flows.userPrograms))
        this.on('DevPrograms', () => this.runFlow(flows.devPrograms))
        this.on('register', () => this.runFlow(flows.register))
        this.on('constructEthereumTx', () => this.runFlow(flows.ethTransaction))
        this.on('sign', () => this.runFlow(flows.sign))
        this.on('entropyTransfer', () => this.runFlow(flows.entropyTransfer))
        this.on('giveZaps', () => this.runFlow(flows.giveZaps))
        this.on('newWallet', () => this.runFlow(flows.newWallet))
    }

    async main() {
        console.clear();
        console.log(ascii);
        const choices = [
            "Entropy Faucet", "Balance", "Deploy Program", "User Programs", "Register","Construct an Ethereum Tx", 
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

        switch (action) {
            case "Entropy Faucet": this.emit('entropyFaucet'); break;
            case "Balance": this.emit('balance'); break;
            case "Deploy Program": this.emit('DevPrograms'); break; 
            case "User Programs": this.emit('UserPrograms'); break; 
            case "Register": this.emit('register'); break;
            case "Construct an Ethereum Tx": this.emit('constructEthereumTx'); break; 
            case "Sign": this.emit('sign'); break;
            case "Transfer": this.emit('entropyTransfer'); break;
            case "Give Zaps": this.emit('giveZaps'); break;
            case "New Entropy Wallet": this.emit('newWallet'); break;
            case "Exit": process.exit(); break;
            default:
                console.warn(`Received an unexpected action: "${action}"`);
                this.emit('returnToMain');
                break;
        }
    }

    async start() {
        do {
            await this.main();
            if (this.currentFlow) await this.currentFlow;
        } while (this.restartMain);
        this.restartMain = false;
    }
}
