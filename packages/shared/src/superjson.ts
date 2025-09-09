import { SuperJSON } from 'superjson'

export * from 'superjson'

SuperJSON.registerCustom<Uint8Array, string>(
  {
    isApplicable: (v): v is Uint8Array => typeof v === 'object' && v?.constructor === Uint8Array,
    serialize: (v) => Buffer.from(v).toString('base64'),
    deserialize: (v) => new Uint8Array(Buffer.from(v, 'base64')),
  },
  'Uint8Array',
)

SuperJSON.registerCustom<ArrayBuffer, string>(
  {
    isApplicable: (v): v is ArrayBuffer => typeof v === 'object' && v?.constructor === ArrayBuffer,
    serialize: (v) => SuperJSON.stringify(new Uint8Array(v)),
    deserialize: (v) => SuperJSON.parse<Uint8Array>(v).buffer,
  },
  'ArrayBuffer',
)

SuperJSON.registerCustom<Buffer, string>(
  {
    isApplicable: (v): v is Buffer => typeof v === 'object' && v?.constructor === Buffer,
    serialize: (v) => SuperJSON.stringify(new Uint8Array(v)),
    deserialize: (v) => Buffer.from(SuperJSON.parse<Uint8Array>(v)),
  },
  'Buffer',
)
