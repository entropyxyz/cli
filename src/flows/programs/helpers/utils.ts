import { print } from "src/common/utils"

export function displayPrograms (programs): void {
  programs.forEach((program, index) => {
    print(`${index + 1}.`)
    print({
      pointer: program.program_pointer,
      config: parseProgramConfig(program.program_config)
    })
    print('')
  })
}

function parseProgramConfig (rawConfig: unknown) {
  if (typeof rawConfig !== 'string') return rawConfig
  if (!rawConfig.startsWith('0x')) return rawConfig

  const hex = rawConfig.slice(2)
  const utf8 = Buffer.from(hex, 'hex').toString()
  const output = JSON.parse(utf8)
  Object.keys(output).forEach(key => {
    output[key] = output[key].map(base64toHex)
  })

  return output
}

function base64toHex (base64: string): string {
  return Buffer.from(base64, 'base64').toString('hex')
}
