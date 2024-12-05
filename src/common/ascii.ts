import { promisify } from 'node:util'

const version = process.env.ENTROPY_CORE_VERSION.split('-')[1]

export const logo = 
`
  @@@@@@@@@@ @@@@@@@@@@ @@@@@   @@@@@@@@@@@ @@@@@@@@@ @@@@@@@@@@ @@@@@ @@@@@
  @@@@@@@@@@ @@@@@@@@@@ @@@@@   @@@@@@@@@@@ @@@@@@@@@ @@@@@@@@@@ @@@@@ @@@@@
  @@@@@@@@@@ @@@@@@@@@@ @@@@@@@ @@@@@@@@@@@ @@@@@@@@@ @@@@@@@@@@ @@@@@ @@@@@
  @@@@@ @@@@ @@@@@ @@@@ @@@@@@@ @@@@@ @@@@@ @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@ @@@@ @@@@@ @@@@ @@@@@   @@@@@ @@@@@ @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@ @@@@ @@@@@ @@@@ @@@@@   @@@@@ @@@@@ @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@@@@@@ @@@@@ @@@@ @@@@@   @@@@@       @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@@@@@@ @@@@@ @@@@ @@@@@   @@@@@       @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@      @@@@@ @@@@ @@@@@   @@@@@       @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@ @@@@ @@@@@ @@@@ @@@@@   @@@@@       @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@ @@@@ @@@@@ @@@@ @@@@@   @@@@@       @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@ @@@@ @@@@@ @@@@ @@@@@   @@@@@       @@@@ @@@@ @@@@@ @@@@ @@@@@ @@@@@
  @@@@@@@@@@ @@@@@ @@@@ @@@@@@@ @@@@@       @@@@@@@@@ @@@@@@@@@@ @@@@@@@@@@@
  @@@@@@@@@@ @@@@@ @@@@ @@@@@@@ @@@@@       @@@@@@@@@ @@@@@@@@@@ @@@@@@@@@@@
                                                      @@@@@@            TEST
                                                      @@@@@@            *NET
                                                      @@@@@@     ENTROPY-CLI
                                                      @@@@@@     CORE${version}
`

// Prints the logo out as a "swipe" from top-left to bottom-right.
// Designed to buy a little time while we await entropy.ready
export async function printLogo (timeout = 10) {
  const lines = logo.split('\n')
  let i = 0
  while (i < 100) {
    const newLogo = lines.map((line, lineNum) => {
      const lineChars = line.split('')

      if (lineChars?.[i - lineNum -1] === '@') {
        lineChars[i - lineNum -1] = '█'
      }

      if (lineChars?.[i - lineNum -2] === '@') {
        lineChars[i - lineNum -2] = '▒'
      }

      return lineChars
        .slice(0, Math.max(0, i - lineNum))
        .join('')
    }).join('\n')
    console.clear()
    console.log(newLogo)
    i++
    await promisify(setTimeout)(timeout)
  }
}
