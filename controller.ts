import { EventEmitter } from 'events';
import * as flows from "./src/flows";
import inquirer, { ListQuestion } from "inquirer";
import { ascii } from "./src/common/ascii";

export class Controller extends EventEmitter {
  private static instance: Controller;

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
    flowFunction(this);
  }

  initListeners() {
    this.on('returnToMain', this.main.bind(this));
    this.on('balance', () => this.runFlow(flows.balance));
    this.on('entropyFaucet', () => this.runFlow(flows.entropyFaucet));
    this.on('register', () => this.runFlow(flows.register));
    this.on('setProgram', () => this.runFlow(flows.setProgram));
    this.on('sign', () => this.runFlow(flows.sign));
    this.on('entropyTransfer', () => this.runFlow(flows.entropyTransfer));
    this.on('giveZaps', () => this.runFlow(flows.giveZaps));
    this.on('newWallet', () => this.runFlow(flows.newWallet));
  }

  async main() {
    let exit = false;

    while (!exit) {
      console.log(ascii);

      const choices = [
        "Entropy Faucet",
        "Balance",
        "Register",
        "Programs",
        "Sign",
        "Transfer",
        "Give Zaps",
        "New Entropy Wallet",
        "Exit"
      ];

      const intro: ListQuestion = {
        type: "list",
        name: "action",
        message: "Select Action",
        pageSize: choices.length,
        choices: choices,
      };

      const { action } = await inquirer.prompt(intro);

      switch (action) {
        case "Entropy Faucet":
          this.emit('entropyFaucet');
          break;

        case "Balance":
          this.emit('balance');
          break;

        case "Register":
          this.emit('register');
          break;

        case "Programs":
          this.emit('setProgram');
          break;

        case "Sign":
          this.emit('sign');
          break;

        case "Transfer":
          this.emit('entropyTransfer');
          break;

        case "Give Zaps":
          this.emit('giveZaps');
          break;

        case "New Entropy Wallet":
          this.emit('newWallet');
          break;

        case "Exit":
          exit = true;
          break;

        default:
          console.warn(`Received an unexpected action: "${action}"`);
          break;
      }
    }
    process.exit();
  }

  start() {
    this.removeAllListeners();
    this.initListeners();
    this.main();
  }
}
