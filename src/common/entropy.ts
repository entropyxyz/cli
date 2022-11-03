import { Keyring } from "@polkadot/keyring";
import { ApiPromise, WsProvider, SubmittableResult } from "@polkadot/api";
import { from_hex } from "x25519";
import { sr25519PairFromSeed } from "@polkadot/util-crypto";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/types";

export const getWallet = async (seed: string) => {
  const keyring = new Keyring({ type: "sr25519" });
  const pair = sr25519PairFromSeed(seed);
  const wallet = keyring.addFromPair(pair);
  return { wallet, pair };
};

export const getApi = async (endpoint?: string) => {
  const wsProvider = endpoint
    ? new WsProvider(endpoint)
    : new WsProvider("ws://127.0.0.1:9944");
  const api = new ApiPromise({ provider: wsProvider });
  await api.isReady;
  return api;
};

export const getServerDHKey = async (
  api: ApiPromise,
  stashKey: String
): Promise<any> => {
  let r = await api.query.stakingExtension.thresholdAccounts(stashKey);
  let result = r.toJSON();
  let _pairs = result?.toLocaleString();
  if (_pairs === undefined) {
    return new Uint8Array();
  }
  let pairs = _pairs.split(",");
  const addr = pairs[0];
  const server_dh_key = pairs[1];
  return from_hex(server_dh_key.slice(2));
};

export function sendAndWait(
  call: SubmittableExtrinsic<"promise">,
  api: ApiPromise,
  sender: AddressOrPair
): Promise<undefined> {
  return new Promise<undefined>((resolve, reject) => {
    call
      .signAndSend(sender, (res: SubmittableResult) => {
        const { dispatchError, status } = res;

        if (dispatchError) {
          if (dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded: any = api.registry.findMetaError(
              dispatchError.asModule
            );
            const { documentation, name, section } = decoded;

            const err = Error(`${section}.${name}: ${documentation.join(" ")}`);

            err.name = name;
            reject(err);
          } else {
            reject(Error(dispatchError.toString()));
          }
        }

        if (status.isInBlock || status.isFinalized) {
          resolve(undefined);
        }
      })
      .catch((e) => {
        reject(Error(e.message));
      });
  });
}
