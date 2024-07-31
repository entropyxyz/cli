import Entropy from "@entropyxyz/sdk";
import fs from "node:fs/promises"
import { isAbsolute, join } from "node:path"

// TODO: change to this when SDK ready
// export async function deploy (entropy: Entropy, { bytecode, configurationSchema, auxillaryDataSchema }) {
//   return entropy.programs.dev.deploy({
//     bytecode,
//     configurationSchema,
//     auxillaryDataSchema
//   })
// }

export async function deployProgram (entropy: Entropy, { bytecodePath }) {
  const fullBytecodePath = isAbsolute(bytecodePath)
    ? bytecodePath
    : join(process.cwd(), bytecodePath)

  const bytecode = await fs.readFile(fullBytecodePath)

  return entropy.programs.dev.deploy(
    bytecode
  )
}
