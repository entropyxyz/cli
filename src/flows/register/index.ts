import {handleMnemonic} from "../../common/questions"

export const register = async () => {
	const mnemonic = await handleMnemonic()
	console.log({mnemonic})
}