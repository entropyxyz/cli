// @ts-ignore
import { Pair } from '@entropyxyz/sdk/keys'

export interface TransferOptions { 
  from: Pair
  to: string
  amount: bigint
}
