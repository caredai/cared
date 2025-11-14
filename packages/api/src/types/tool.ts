import { z } from 'zod/v4'

export const ToolKitMetaSchema = z.object({
  categories: z
    .array(
      z.object({
        slug: z.string(),
        name: z.string(),
      }),
    )
    .optional(),
  appUrl: z.string().optional(),
  createdAt: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  toolsCount: z.number().optional(),
  triggersCount: z.number().optional(),
  updatedAt: z.string().optional(),
  availableVersions: z.array(z.string()).optional(),
})

export const ToolKitSchema = z.object({
  name: z.string(),
  slug: z.string(),
  meta: ToolKitMetaSchema,
  noAuth: z.boolean().optional(),
})

export const ToolkitAuthFieldSchema = z.object({
  description: z.string(),
  displayName: z.string(),
  required: z.boolean(),
  name: z.string(),
  type: z.string(),
  default: z.string().nullable().optional(),
});

export const ToolkitAuthConfigDetailsSchema = z.object({
  name: z.string(),
  mode: z.string(),
  fields: z.object({
    connectionInitiation: z.object({
      optional: z.array(ToolkitAuthFieldSchema),
      required: z.array(ToolkitAuthFieldSchema),
    }),
  }),
});

const JSONSchemaType = z.enum([
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
])

export const JSONSchemaPropertySchema: z.ZodType<any> = z.object({
  type: z.union([JSONSchemaType, z.array(JSONSchemaType)]).optional(),
  description: z.string().optional(),
  anyOf: z.lazy(() => z.array(JSONSchemaPropertySchema)).optional(),
  oneOf: z.lazy(() => z.array(JSONSchemaPropertySchema)).optional(),
  allOf: z.lazy(() => z.array(JSONSchemaPropertySchema)).optional(),
  not: z.lazy(() => JSONSchemaPropertySchema).optional(),
  title: z.string().optional(),
  default: z.any().optional(),
  nullable: z.boolean().optional(),
  properties: z.lazy(() => z.record(z.string(), JSONSchemaPropertySchema)).optional(),
  required: z.array(z.string()).optional(),
  file_uploadable: z.boolean().optional(),
  file_downloadable: z.boolean().optional(),
  items: z
    .lazy(() => z.union([JSONSchemaPropertySchema, z.array(JSONSchemaPropertySchema)]))
    .optional(),
  enum: z.array(z.any()).optional(),
  const: z.any().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  exclusiveMinimum: z.number().optional(),
  exclusiveMaximum: z.number().optional(),
  multipleOf: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  format: z.string().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  uniqueItems: z.boolean().optional(),
  minProperties: z.number().optional(),
  maxProperties: z.number().optional(),
  patternProperties: z.lazy(() => z.record(z.string(), JSONSchemaPropertySchema)).optional(),
  additionalProperties: z.union([z.boolean(), z.lazy(() => JSONSchemaPropertySchema)]).optional(),
  examples: z.array(z.any()).optional(),
  readOnly: z.boolean().optional(),
  writeOnly: z.boolean().optional(),
  if: z.lazy(() => JSONSchemaPropertySchema).optional(),
  then: z.lazy(() => JSONSchemaPropertySchema).optional(),
  else: z.lazy(() => JSONSchemaPropertySchema).optional(),
  $ref: z.string().optional(),
  definitions: z
    .record(
      z.string(),
      z.lazy(() => JSONSchemaPropertySchema),
    )
    .optional(),
  $defs: z
    .record(
      z.string(),
      z.lazy(() => JSONSchemaPropertySchema),
    )
    .optional(),
})

const ParametersSchema = z.object({
  type: z.literal('object'),
  anyOf: z.array(JSONSchemaPropertySchema).optional(),
  oneOf: z.array(JSONSchemaPropertySchema).optional(),
  allOf: z.array(JSONSchemaPropertySchema).optional(),
  not: JSONSchemaPropertySchema.optional(),
  properties: z.record(z.string(), JSONSchemaPropertySchema),
  required: z.array(z.string()).optional(),
  title: z.string().optional(),
  default: z.any().optional(),
  nullable: z.boolean().optional(),
  description: z.string().optional(),
  additionalProperties: z.boolean().default(false).optional(),
})

export const ToolSchema = z.object({
  slug: z.string().describe('The slug of the tool. eg. "GOOGLE_SEARCH"'),
  name: z.string().describe(`The name of the tool. eg. "Google Search"`),
  description: z.string().optional().describe('The description of the tool'),
  inputParameters: ParametersSchema.optional().describe('The input parameters of the tool'),
  outputParameters: ParametersSchema.optional().describe('The output parameters of the tool'),
  tags: z.array(z.string()).describe('The tags of the tool. eg: Important').default([]).optional(),
  toolkit: z
    .object({
      slug: z.string().describe('The slug of the toolkit'),
      name: z.string().describe('The name of the toolkit'),
      logo: z.string().describe('The logo of the toolkit').optional(),
    })
    .describe('The toolkit of the tool')
    .optional(),
  version: z.string().describe('The version of the tool, e.g. "20250909_00"').optional(),
  isDeprecated: z.boolean().describe('Whether the tool is deprecated').optional(),
  availableVersions: z
    .array(z.string())
    .describe('Available versions of the tool.')
    .default([])
    .optional(),
  scopes: z.array(z.string()).describe('The scopes of the tool. eg: ["task:add"]').optional(),
  isNoAuth: z.boolean().describe('Do the tool support no auth?').optional(),
})

export const ConnectionStatuses = {
  INITIALIZING: 'INITIALIZING',
  INITIATED: 'INITIATED',
  ACTIVE: 'ACTIVE',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  INACTIVE: 'INACTIVE',
} as const

export const ConnectionStatusSchema = z.enum([
  ConnectionStatuses.INITIALIZING,
  ConnectionStatuses.INITIATED,
  ConnectionStatuses.ACTIVE,
  ConnectionStatuses.FAILED,
  ConnectionStatuses.EXPIRED,
  ConnectionStatuses.INACTIVE,
])

export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>

export const AuthSchemeTypes = {
  OAUTH1: 'OAUTH1',
  OAUTH2: 'OAUTH2',
  API_KEY: 'API_KEY',
  BASIC: 'BASIC',
  BEARER_TOKEN: 'BEARER_TOKEN',
  BILLCOM_AUTH: 'BILLCOM_AUTH',
  GOOGLE_SERVICE_ACCOUNT: 'GOOGLE_SERVICE_ACCOUNT',
  NO_AUTH: 'NO_AUTH',
  BASIC_WITH_JWT: 'BASIC_WITH_JWT',
  CALCOM_AUTH: 'CALCOM_AUTH',
  SERVICE_ACCOUNT: 'SERVICE_ACCOUNT',
} as const
export type AuthSchemeType = (typeof AuthSchemeTypes)[keyof typeof AuthSchemeTypes]

const BaseSchemeRaw = z
  .object({
    // for posthog, freshdesk, zendesk, clickup and others
    subdomain: z.string().optional(),
    // for atlassian
    ['your-domain']: z.string().optional(),
    // for mixpanel
    region: z.string().optional(),
    // for shopify
    shop: z.string().optional(),
    // for snowflake
    account_url: z.string().optional(),
    // likely pipedrive
    COMPANYDOMAIN: z.string().optional(),
    // likely zoho
    extension: z.string().optional(),
    // likely formsite
    form_api_base_url: z.string().optional(),
    // likely salesforce
    instanceEndpoint: z.string().optional(),
    // likely active campaign
    api_url: z.string().optional(),
    // for borneo
    borneo_dashboard_url: z.string().optional(),
    // for zenrows proxy
    proxy_username: z.string().optional(),
    proxy_password: z.string().optional(),
    // for d2l
    domain: z.string().optional(),
    version: z.string().optional(),
    // for mailchimp
    dc: z.string().optional(),
    // for sharepoint
    site_name: z.string().optional(),
    // for servicenow
    instanceName: z.string().optional(),
    // for netsuite
    account_id: z.string().optional(),
    // for custom servers
    your_server: z.string().optional(),
    // for ragic
    server_location: z.string().optional(),
    // base_url only
    base_url: z.string().optional(),
    // for api key
    api_key: z.string().optional(),
    // for generic api key
    generic_api_key: z.string().optional(),
    // for bearer token
    bearer_token: z.string().optional(),
  })
  .catchall(z.unknown())

// OAUTH1
export const Oauth1InitiatingConnectionDataSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.INITIALIZING),
}).catchall(z.unknown())

export const Oauth1InitiatedConnectionDataSchema = Oauth1InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.INITIATED),
  oauth_token: z.string().optional(),
  authUri: z.string().optional(),
  oauth_token_secret: z.string().optional(),
  redirectUrl: z.string().optional(),
  callbackUrl: z.string().optional(),
}).catchall(z.unknown())

export const Oauth1ActiveConnectionDataSchema = Oauth1InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
  oauth_token: z.string().optional(),
  consumer_key: z.string().optional(),
  redirectUrl: z.string().optional(),
  callback_url: z.string().optional(),
}).catchall(z.unknown())

export const Oauth1FailedConnectionDataSchema = Oauth1InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.FAILED),
  error: z.string().optional(),
  error_description: z.string().optional(),
}).catchall(z.unknown())

export const Oauth1ExpiredConnectionDataSchema = Oauth1InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.EXPIRED),
  expired_at: z.string().optional(),
}).catchall(z.unknown())

export const Oauth1InactiveConnectionDataSchema = Oauth1InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.INACTIVE),
}).catchall(z.unknown())

export const Oauth1ConnectionDataSchema = z.discriminatedUnion('status', [
  Oauth1InitiatingConnectionDataSchema,
  Oauth1InitiatedConnectionDataSchema,
  Oauth1ActiveConnectionDataSchema,
  Oauth1FailedConnectionDataSchema,
  Oauth1ExpiredConnectionDataSchema,
  Oauth1InactiveConnectionDataSchema,
])

// OAUTH2
export const Oauth2InitiatingConnectionDataSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.INITIALIZING),
}).catchall(z.unknown())

export const Oauth2InitiatedConnectionDataSchema = Oauth2InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.INITIATED),
  code_verifier: z.string().optional(),
  redirectUrl: z.string(),
  callback_url: z.string().optional(),
  finalRedirectUri: z.string().optional(),
  // previously verification_token, will be sent as verification_token to slack
  webhook_signature: z.string().optional(),
}).catchall(z.unknown())

export const Oauth2ActiveConnectionDataSchema = Oauth2InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
  access_token: z.string().optional(),
  id_token: z.string().optional(),
  token_type: z.string().optional(),
  refresh_token: z.string().nullish(),
  expires_in: z.union([z.string(), z.number(), z.null()]).optional(),
  scope: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  // previously verification_token, will be sent as verification_token to slack
  webhook_signature: z.string().optional(),
  authed_user: z
    .object({
      access_token: z.string().optional(),
      scope: z.string().optional(),
    })
    .optional()
    .describe('for slack user scopes'),
}).catchall(z.unknown())

export const Oauth2FailedConnectionDataSchema = Oauth2InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.FAILED),
  error: z.string().optional(),
  error_description: z.string().optional(),
}).catchall(z.unknown())

export const Oauth2ExpiredConnectionDataSchema = Oauth2InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.EXPIRED),
  expired_at: z.string().optional(),
}).catchall(z.unknown())

export const Oauth2InactiveConnectionDataSchema = Oauth2InitiatingConnectionDataSchema.extend({
  status: z.literal(ConnectionStatuses.INACTIVE),
}).catchall(z.unknown())

export const Oauth2ConnectionDataSchema = z.discriminatedUnion('status', [
  Oauth2InitiatingConnectionDataSchema,
  Oauth2InitiatedConnectionDataSchema,
  Oauth2ActiveConnectionDataSchema,
  Oauth2FailedConnectionDataSchema,
  Oauth2ExpiredConnectionDataSchema,
  Oauth2InactiveConnectionDataSchema,
])

// API_KEY
const ApiKeyInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
  api_key: z.string().optional(),
  generic_api_key: z.string().optional(),
}).catchall(z.unknown())
const ApiKeyConnectionDataSchema = z.discriminatedUnion('status', [
  ApiKeyInitiatingSchema,
  ApiKeyInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
  ApiKeyInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  ApiKeyInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
])

// BASIC
const BasicInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
  username: z.string(),
  password: z.string(),
}).catchall(z.unknown())
const BasicConnectionDataSchema = z.discriminatedUnion('status', [
  BasicInitiatingSchema,
  BasicInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
  BasicInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  BasicInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
])

// BEARER_TOKEN
const BearerTokenInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
  token: z.string(),
}).catchall(z.unknown())
const BearerTokenConnectionDataSchema = z.discriminatedUnion('status', [
  BearerTokenInitiatingSchema,
  BearerTokenInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
  BearerTokenInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  BearerTokenInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
])

// GOOGLE_SERVICE_ACCOUNT
const GoogleServiceAccountInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
  credentials_json: z.string(),
}).catchall(z.unknown())
const GoogleServiceAccountConnectionDataSchema = z.discriminatedUnion('status', [
  GoogleServiceAccountInitiatingSchema,
  GoogleServiceAccountInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
  GoogleServiceAccountInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  GoogleServiceAccountInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
])

// NO_AUTH
const NoAuthInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
}).catchall(z.unknown())
const NoAuthConnectionDataSchema = z.discriminatedUnion('status', [
  NoAuthInitiatingSchema,
  NoAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
  NoAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  NoAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
])

// CALCOM_AUTH
const CalcomAuthInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
}).catchall(z.unknown())
const CalcomAuthConnectionDataSchema = z.discriminatedUnion('status', [
  CalcomAuthInitiatingSchema,
  CalcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
  CalcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  CalcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
])

// BILLCOM_AUTH
const BillcomAuthInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.INITIALIZING),
}).catchall(z.unknown())
export const BillcomAuthConnectionDataSchema = z.discriminatedUnion('status', [
  BillcomAuthInitiatingSchema,
  BillcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INITIATED),
    redirectUrl: z.string(),
  }).catchall(z.unknown()),
  BillcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.ACTIVE),
    sessionId: z.string(),
    devKey: z.string(),
  }).catchall(z.unknown()),
  BillcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  BillcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
  BillcomAuthInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
])

// BASIC_WITH_JWT
const BasicWithJwtInitiatingSchema = BaseSchemeRaw.extend({
  status: z.literal(ConnectionStatuses.ACTIVE),
  username: z.string(),
  password: z.string(),
}).catchall(z.unknown())
const BasicWithJwtConnectionDataSchema = z.discriminatedUnion('status', [
  BasicWithJwtInitiatingSchema,
  BasicWithJwtInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.INACTIVE),
  }).catchall(z.unknown()),
  BasicWithJwtInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.FAILED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }).catchall(z.unknown()),
  BasicWithJwtInitiatingSchema.extend({
    status: z.literal(ConnectionStatuses.EXPIRED),
    expired_at: z.string().optional(),
  }).catchall(z.unknown()),
])

export const ConnectionDataSchema = z.discriminatedUnion('authScheme', [
  z.object({
    authScheme: z.literal(AuthSchemeTypes.OAUTH1),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: Oauth1ConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.OAUTH2),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: Oauth2ConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.API_KEY),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: ApiKeyConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.BASIC),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: BasicConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.BEARER_TOKEN),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: BearerTokenConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.GOOGLE_SERVICE_ACCOUNT),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: GoogleServiceAccountConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.NO_AUTH),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: NoAuthConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.CALCOM_AUTH),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: CalcomAuthConnectionDataSchema,
  }),
  // z.object({
  //   authScheme: z.literal(AuthSchemeTypes.SNOWFLAKE),
  //   /**
  //    * the main connection data discriminated by auth scheme
  //    */
  //   val: SnowflakeConnectionDataSchema,
  // }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.BILLCOM_AUTH),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: BillcomAuthConnectionDataSchema,
  }),
  z.object({
    authScheme: z.literal(AuthSchemeTypes.BASIC_WITH_JWT),
    /**
     * the main connection data discriminated by auth scheme
     */
    val: BasicWithJwtConnectionDataSchema,
  }),
])

export const ConnectionSchema = z.object({
  id: z.string(),
  status: ConnectionStatusSchema,
  statusReason: z.string().optional(),
  toolkit: z.string(),
  state: ConnectionDataSchema.optional(),
})
