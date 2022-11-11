import {
  handleSeed,
  handleThresholdEndpoints,
  handleChainEndpoint,
  handleKeyPath,
} from "../../common/questions";
import {
  getWallet,
  getApi,
  getServerDHKey,
  sendAndWait,
} from "../../common/entropy";
import { readKey } from "../../common/utils";
import { encrypt_and_sign } from "x25519";

const axios = require("axios").default;

export const register = async () => {
  const seed = await handleSeed();
  const { wallet, pair } = await getWallet(seed);
  const thresholdEndpoints = await handleThresholdEndpoints();
  const chainEndpoint = await handleChainEndpoint();
  const name = await handleKeyPath();
  const threshold_key = readKey(`tofn/${name}/0`);
  const threshold_key_bob = readKey(`tofn/${name}/1`);
  const api = await getApi(chainEndpoint);

  const server_dh_key = await getServerDHKey(
    api,
    "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY"
  );
  const server_dh_key_bob = await getServerDHKey(
    api,
    "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc"
  );

  const emsg_alice = encrypt_and_sign(
    pair.secretKey,
    threshold_key,
    server_dh_key
  );
  const emsg_bob = encrypt_and_sign(
    pair.secretKey,
    threshold_key_bob,
    server_dh_key_bob
  );

  const tx = api.tx.relayer.register();
  await sendAndWait(tx, api, wallet);
  const result = await api.query.relayer.registering(wallet.address);
  console.log({ result: result.toHuman() });

  await sendKey(thresholdEndpoints[0], emsg_alice);
  await sendKey(thresholdEndpoints[1], emsg_bob);

  const isRegistered = await api.query.relayer.registered(wallet.address);
  console.log({ isRegistered: isRegistered.toHuman() });

  process.exit();
};

const sendKey = async (url: string, emsg: any) => {
  const postRequest = await axios.post(`${url}/user/new`, emsg, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log({ post_request: postRequest.status });
};
