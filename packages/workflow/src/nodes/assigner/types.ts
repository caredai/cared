import type { CommonNodeType, ValueSelector } from '@/types'

export enum WriteMode {
  overwrite = 'over-write',
  clear = 'clear',
  append = 'append',
  extend = 'extend',
  set = 'set',
  increment = '+=',
  decrement = '-=',
  multiply = '*=',
  divide = '/=',
}

export enum AssignerNodeInputType {
  variable = 'variable',
  constant = 'constant',
}

export interface AssignerNodeOperation {
  variable_selector: ValueSelector
  input_type: AssignerNodeInputType
  operation: WriteMode
  value: any
}

export type AssignerNodeType = CommonNodeType & {
  version?: '1' | '2'
  items: AssignerNodeOperation[]
}
