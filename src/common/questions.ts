import inquirer from "inquirer";

const questionSeed = [
  {
    type: "input",
    name: "seed",
    message: "input seed",
    default:
      "0x29b55504652cedded9ce0ee1f5a25b328ae6c6e97827f84eee6315d0f44816d8",
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
    default: "ws://127.0.0.1:9944",
  },
];

const questionName = [
  {
    type: "input",
    name: "name",
    message: "input name",
    default: "default",
  },
];

export const handleSeed = async () => {
  if (process.env.SEED) {
    return process.env.SEED;
  }

  const { seed } = await inquirer.prompt(questionSeed);

  return seed;
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
  return chainEndpoint;
};

export const handleKeyPath = async () => {
  if (process.env.NAME) {
    return process.env.NAME.toLowerCase();
  }

  const { name } = await inquirer.prompt(questionName);
  return name.toLowerCase();
};
