import inquirer from "inquirer";

const questionMnemonic = [
  {
    type: "input",
    name: "mnemonic",
    message: "input mnemonic",
    default: "//Alice",
  },
];

const questionThresholdEndpoints = [
  {
    type: "input",
    name: "thresholdEndpoints",
    message: "input threshold endpoints",
    default: '["http://127.0.0.1:3001", "http://127.0.0.1:3002"]',
  },
];

const questionChainEndpoint = [
  {
    type: "input",
    name: "chainEndpoints",
    message: "input mnemonic",
    default: 'ws://127.0.0.1:9944',
  },
];

export const handleMnemonic = async () => {
  if (process.env.MNEMONIC) {
    return process.env.MNEMONIC;
  }

  const { mnemonic } = await inquirer.prompt(questionMnemonic);

  return mnemonic;
};

export const handleThresholdEndpoints = async () => {
  if (process.env.ENDPOINTS_THRESHOLD) {
    return JSON.parse(process.env.ENDPOINTS_THRESHOLD);
  }

  const { thresholdEndpoints } = await inquirer.prompt(
    questionThresholdEndpoints
  );
  return JSON.parse(thresholdEndpoints);
};

export const handleChainEndpoint = async () => {
  if (process.env.ENDPOINT_CHAIN) {
    return process.env.ENDPOINT_CHAIN;
  }

  const { chainEndpoint } = await inquirer.prompt(questionChainEndpoint);
  return chainEndpoint
};
