import { Option } from 'commander'

import { stringify, absolutePath } from './utils'
import * as config from '../config'
import { ENTROPY_ENDPOINT_DEFAULT } from '../common/constants'

export function cliWrite (result) {
  const prettyResult = stringify(result, 0)
  process.stdout.write(prettyResult)
}

export function endpointOption () {
  return new Option(
    '-e, --endpoint <url>',
    [
      'Runs entropy with the given endpoint and ignores network endpoints in config.',
      'Can also be given a stored endpoint name from config eg: `entropy --endpoint test-net`.'
    ].join(' ')
  )
    .env('ENTROPY_ENDPOINT')
    .default(ENTROPY_ENDPOINT_DEFAULT)
}

export function accountOption () {
  return new Option(
    '-a, --account <name|address>',
    [
      'Sets the account for the session.',
      'Defaults to the last set account (or the first account if one has not been set before).'
    ].join(' ')
  )
    .env('ENTROPY_ACCOUNT')
}

export function configOption () {
  return new Option(
    '-c, --config <path>',
    'Set the path to your Entropy config file (JSON).',
  )
    .env('ENTROPY_CONFIG')
    .argParser(configPath => {
      return absolutePath(configPath)
    })
    .default(config.CONFIG_PATH_DEFAULT)
}

export function verifyingKeyOption () {
  return new Option(
    '-k, --verifying-key <key>',
    [
      'The verifying key to perform this function with.'
    ].join(' ')
  )
}

export function programModKeyOption () {
  return new Option(
    '-p, --program-mod-key <key>',
    [
      'The programModKey to perform this function with.'
    ].join(' ')
  )
}
