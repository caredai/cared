export interface Entity {
  userId?: string
  appId?: string
  runId?: string
}

export type Metadata = Record<string, unknown>

export interface Memory extends Entity {
  id: string
  hash: string
  memory: string

  metadata: Metadata

  createdAt: Date
  updatedAt: Date
}

export type BuiltinAttributeKey =
  | 'userId'
  | 'appId'
  | 'runId'
  | 'createdAt'
  | 'updatedAt'
export type AttributeKey = BuiltinAttributeKey | string

export type FilterInput =
  | [AttributeKey, 'Eq', unknown]
  | [AttributeKey, 'NotEq', unknown]
  | [AttributeKey, 'In', unknown[]]
  | [AttributeKey, 'NotIn', unknown[]]
  | [AttributeKey, 'Contains', unknown]
  | [AttributeKey, 'NotContains', unknown]
  | [AttributeKey, 'ContainsAny', unknown[]]
  | [AttributeKey, 'NotContainsAny', unknown[]]
  | [AttributeKey, 'Lt', unknown]
  | [AttributeKey, 'Lte', unknown]
  | [AttributeKey, 'Gt', unknown]
  | [AttributeKey, 'Gte', unknown]
  | ['Not', FilterInput]
  | ['And', FilterInput[]]
  | ['Or', FilterInput[]]
