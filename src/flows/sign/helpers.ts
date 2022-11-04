import { getApi, getWallet, sendAndWait } from "../../common/entropy";
const axios = require("axios").default;

export const prepTx = async (api: any, wallet: any, txHash: any) => {
  const tx = await api.tx.relayer.prepTransaction({ sigHash: txHash });
  const txResult = await sendAndWait(tx, api, wallet);
};

export const pollNodeForSignature = async (message: String, url: String): Promise<any> => {
  let i = 0;
  let status;
  let postRequest;
  console.log({ message });
  while (status !== 202 && i < 10) {
    try {
      postRequest = await axios.post(`${url}/signer/signature`, {
        message: message,
      });
      status = postRequest.status;
    } catch (e) {
      status = 500;
      sleep(3000);
      console.log({ message: "repolling for signature soon", status, i });
    }
    i++;
  }
  return Uint8Array.from(atob(postRequest.data), (c) => c.charCodeAt(0));
};

function sleep(delay: number) {
  const start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}
