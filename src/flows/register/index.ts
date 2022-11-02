import { handleMnemonic } from "../../common/questions";

export const register = async () => {
  const wallet = await handleMnemonic();
  console.log({ wallet });
};
