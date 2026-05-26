import { useEffect, useMemo, useState } from 'react'
import { Copy, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { codeToHtml } from 'shiki'
import { toast } from 'sonner'

import { Button } from '@cared/ui/components/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@cared/ui/components/dialog'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Switch } from '@cared/ui/components/switch'
import { cn } from '@cared/ui/lib/utils'

import type { DatabaseBranch, DatabaseEndpoint } from '@/hooks/use-database'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { useDatabaseBranchConnectData } from '@/hooks/use-database'

interface ConnectDialogProps {
  namespaceId: string
  branches: DatabaseBranch[]
  endpoints: DatabaseEndpoint[]
  initialBranchId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Derives the PgBouncer pooler hostname from a direct endpoint hostname. */
function derivePoolerHost(directHost: string): string {
  // Neon format: ep-name.region.aws.neon.tech -> ep-name-pooler.region.aws.neon.tech
  return directHost.replace(/^(ep-[^.]+)\./, '$1-pooler.')
}

/** Builds a connection URI string with the password masked or revealed. */
function buildConnectionUri({
  host,
  database,
  role,
  password,
  pooling,
}: {
  host: string
  database: string
  role: string
  password: string
  pooling: boolean
}): string {
  const displayHost = pooling ? derivePoolerHost(host) : host
  const base = `postgresql://${role}:${password}@${displayHost}/${database}`
  const params = pooling ? 'sslmode=require&channel_binding=require' : 'sslmode=require'
  return `${base}?${params}`
}

const MASKED_PASSWORD = '****************'
const PASSWORDLESS_PSQL_HOST = 'pg.cared.dev'
const DEFAULT_CONNECTION_METHOD = 'Connection string'

interface ConnectionSnippet {
  label: string
  value: string
  copyValue?: string
}

interface ConnectionSection {
  label: string
  snippets: ConnectionSnippet[]
}

type PasswordRevealState = 'hidden' | 'transient' | 'persistent'

/** Finds the primary (read-write) endpoint for a branch, or falls back to first. */
function getPrimaryEndpoint(
  endpoints: DatabaseEndpoint[],
  branchId: string,
): DatabaseEndpoint | undefined {
  return (
    endpoints.find((ep) => ep.branchId === branchId && ep.type === 'read_write') ??
    endpoints.find((ep) => ep.branchId === branchId)
  )
}

function endpointDisplayName(ep: DatabaseEndpoint): string {
  return ep.name?.trim() ?? (ep.type === 'read_write' ? 'Primary' : 'Compute')
}

function buildDotnetConnectionString({
  host,
  database,
  role,
  password,
}: {
  host: string
  database: string
  role: string
  password: string
}) {
  return `Host=${host}; Database=${database}; Username=${role}; Password=${password}; SSL Mode=VerifyFull; Channel Binding=Require;`
}

function getSnippetLanguage(label: string) {
  switch (label) {
    case 'actions.ts':
      return 'tsx'
    case 'src/app.js':
      return 'javascript'
    case 'database.service.ts':
      return 'typescript'
    case 'HTTP':
    case 'WebSockets':
      return 'typescript'
    case 'Entity Framework':
      return 'json'
    case 'settings.py':
    case 'SQLAlchemy':
      return 'python'
    case 'Go':
      return 'go'
    case 'JDBC':
      return 'java'
    default:
      return 'bash'
  }
}

function CodeSnippet({
  snippet,
  isLoading,
  placeholder = 'Select branch and compute to generate',
}: {
  snippet: ConnectionSnippet
  isLoading: boolean
  placeholder?: string
}) {
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const language = getSnippetLanguage(snippet.label)

  useEffect(() => {
    if (!snippet.value) {
      setHighlightedHtml('')
      return
    }

    let canceled = false
    setHighlightedHtml('')
    void codeToHtml(snippet.value, {
      lang: language,
      theme: 'github-light',
    }).then((html) => {
      if (!canceled) {
        setHighlightedHtml(html)
      }
    })

    return () => {
      canceled = true
    }
  }, [language, snippet.value])

  if (isLoading) {
    return (
      <div className="h-45 rounded-md border bg-muted/40 px-3 py-2.5 font-mono text-xs leading-relaxed">
        <span className="animate-pulse text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!snippet.value) {
    return (
      <div className="h-45 rounded-md border bg-muted/40 px-3 py-2.5 font-mono text-xs leading-relaxed">
        <span className="text-muted-foreground">{placeholder}</span>
      </div>
    )
  }

  return (
    <div
      data-connection-code-block
      className={cn(
        'max-w-full h-45 overflow-x-hidden overflow-y-auto rounded-md border bg-muted/40',
        '[&_pre]:m-0 [&_pre]:whitespace-pre-wrap [&_pre]:wrap-anywhere [&_pre]:bg-transparent! [&_pre]:px-3 [&_pre]:py-2.5 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed',
        '[&_code]:whitespace-pre-wrap [&_code]:wrap-anywhere [&_span]:whitespace-pre-wrap [&_span]:wrap-anywhere',
      )}
      dangerouslySetInnerHTML={{
        __html:
          highlightedHtml ||
          `<pre><code>${snippet.value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')}</code></pre>`,
      }}
    />
  )
}

/** Inner panel that loads databases/roles for the selected branch. */
function ConnectDialogBody({
  namespaceId,
  branches,
  endpoints,
  initialBranchId,
}: Omit<ConnectDialogProps, 'open' | 'onOpenChange'>) {
  const defaultBranch = branches.find((b) => b.default) ?? branches[0]

  const [branchId, setBranchId] = useState(initialBranchId ?? defaultBranch?.id ?? '')
  const [endpointId, setEndpointId] = useState('')
  const [database, setDatabase] = useState('')
  const [role, setRole] = useState('')
  const [pooling, setPooling] = useState(true)
  const [passwordRevealState, setPasswordRevealState] = useState<PasswordRevealState>('hidden')
  const [selectedMethod, setSelectedMethod] = useState(DEFAULT_CONNECTION_METHOD)
  const passwordRevealed = passwordRevealState !== 'hidden'

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-password-toggle]')) return

      const clickedCode = Boolean(target.closest('[data-connection-code-block] pre code'))
      setPasswordRevealState((prev) => {
        if (clickedCode) return 'transient'
        if (prev === 'persistent') return prev
        return 'hidden'
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  const branchEndpoints = useMemo(
    () => endpoints.filter((ep) => ep.branchId === branchId),
    [endpoints, branchId],
  )

  useEffect(() => {
    if (!initialBranchId) return
    setBranchId(initialBranchId)
  }, [initialBranchId])

  // Reset endpoint when branch changes
  useEffect(() => {
    const primary = getPrimaryEndpoint(endpoints, branchId)
    setEndpointId(primary?.id ?? '')
    setDatabase('')
    setRole('')
    setPasswordRevealState('hidden')
  }, [branchId, endpoints])

  const selectedEndpoint = endpoints.find((ep) => ep.id === endpointId)

  const { databases, roles, connectionUris, isLoadingConnectionUris } =
    useDatabaseBranchConnectData(namespaceId, branchId)

  // Default database to the first one when list loads
  useEffect(() => {
    if (!database && databases.length > 0) {
      setDatabase(databases[0]?.name ?? '')
    }
  }, [database, databases])

  // Default role to the database owner when database changes
  useEffect(() => {
    if (!role && databases.length > 0) {
      const db = databases.find((d) => d.name === database) ?? databases[0]
      if (db) {
        setRole(db.ownerName)
        setDatabase(db.name)
      }
    }
  }, [role, database, databases])

  // Resolve the actual connection URI for the selected database
  const resolvedUri = useMemo(() => {
    if (!connectionUris.length) return null
    return connectionUris.find((u) => u.name === database) ?? connectionUris[0]
  }, [connectionUris, database])

  // Parse the password from the resolved URI
  const actualPassword = useMemo(() => {
    if (!resolvedUri?.url) return null
    try {
      const url = new URL(resolvedUri.url)
      return url.password || null
    } catch {
      return null
    }
  }, [resolvedUri])

  const host = selectedEndpoint?.host ?? ''
  const poolerHost = host ? derivePoolerHost(host) : ''
  const connectionHost = pooling ? poolerHost : host
  const displayPassword = passwordRevealed && actualPassword ? actualPassword : MASKED_PASSWORD
  const copyPassword = actualPassword ?? displayPassword

  const connectionString = host
    ? buildConnectionUri({ host, database, role, password: displayPassword, pooling })
    : ''
  const copyConnectionString = host
    ? buildConnectionUri({ host, database, role, password: copyPassword, pooling })
    : ''

  const dotnetConnectionString =
    connectionHost && database && role
      ? buildDotnetConnectionString({
          host: connectionHost,
          database,
          role,
          password: displayPassword,
        })
      : ''
  const copyDotnetConnectionString =
    connectionHost && database && role
      ? buildDotnetConnectionString({
          host: connectionHost,
          database,
          role,
          password: copyPassword,
        })
      : ''

  const snippets = useMemo<ConnectionSection[]>(() => {
    const databaseUrl = connectionString
    const copyDatabaseUrl = copyConnectionString
    const unpooledUrl =
      host && database && role
        ? buildConnectionUri({
            host,
            database,
            role,
            password: displayPassword,
            pooling: false,
          })
        : ''
    const copyUnpooledUrl =
      host && database && role
        ? buildConnectionUri({
            host,
            database,
            role,
            password: copyPassword,
            pooling: false,
          })
        : ''
    const javaUrl =
      connectionHost && database && role
        ? `jdbc:postgresql://${connectionHost}/${database}?user=${role}&password=${displayPassword}&sslmode=require&channelBinding=require`
        : ''
    const copyJavaUrl =
      connectionHost && database && role
        ? `jdbc:postgresql://${connectionHost}/${database}?user=${role}&password=${copyPassword}&sslmode=require&channelBinding=require`
        : ''

    return [
      {
        label: 'Connection string',
        snippets: [
          {
            label: 'Connection string',
            value: databaseUrl,
            copyValue: copyDatabaseUrl,
          },
        ],
      },
      {
        label: 'psql',
        snippets: [
          {
            label: 'Connection string',
            value: databaseUrl ? `psql '${databaseUrl}'` : '',
            copyValue: copyDatabaseUrl ? `psql '${copyDatabaseUrl}'` : '',
          },
          {
            label: 'Passwordless auth',
            value: `psql -h ${PASSWORDLESS_PSQL_HOST}`,
          },
        ],
      },
      {
        label: 'Parameters only',
        snippets: [
          {
            label: 'Parameters only',
            value: connectionHost
              ? [
                  `PGHOST='${connectionHost}'`,
                  `PGDATABASE='${database}'`,
                  `PGUSER='${role}'`,
                  `PGPASSWORD='${displayPassword}'`,
                  "PGSSLMODE='require'",
                  "PGCHANNELBINDING='require'",
                ].join('\n')
              : '',
            copyValue: connectionHost
              ? [
                  `PGHOST='${connectionHost}'`,
                  `PGDATABASE='${database}'`,
                  `PGUSER='${role}'`,
                  `PGPASSWORD='${copyPassword}'`,
                  "PGSSLMODE='require'",
                  "PGCHANNELBINDING='require'",
                ].join('\n')
              : '',
          },
        ],
      },
      {
        label: 'Next.js',
        snippets: [
          {
            label: 'actions.ts',
            value: `// app/actions.ts\n"use server";\nimport { neon } from "@neondatabase/serverless";\n\nexport async function getData() {\n    const sql = neon(process.env.DATABASE_URL);\n    const data = await sql\`...\`;\n    return data;\n}`,
          },
          {
            label: '.env',
            value: `# keep database credentials secure: do not expose them to client-side code\n\nDATABASE_URL='${databaseUrl}'`,
            copyValue: `# keep database credentials secure: do not expose them to client-side code\n\nDATABASE_URL='${copyDatabaseUrl}'`,
          },
        ],
      },
      {
        label: 'Prisma',
        snippets: [
          {
            label: 'schema.prisma',
            value: `// prisma/schema.prisma\ndatasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  // uncomment next line if you use Prisma <5.10\n  // directUrl = env("DATABASE_URL_UNPOOLED")\n}`,
          },
          {
            label: '.env',
            value: `DATABASE_URL="${databaseUrl}"\n# uncomment next line if you use Prisma <5.10\n# DATABASE_URL_UNPOOLED="${unpooledUrl}"`,
            copyValue: `DATABASE_URL="${copyDatabaseUrl}"\n# uncomment next line if you use Prisma <5.10\n# DATABASE_URL_UNPOOLED="${copyUnpooledUrl}"`,
          },
        ],
      },
      {
        label: 'Node.js',
        snippets: [
          {
            label: 'src/app.js',
            value: `require("dotenv").config();\n\nconst http = require("http");\nconst { neon } = require("@neondatabase/serverless");\n\nconst sql = neon(process.env.DATABASE_URL);\n\nconst requestHandler = async (req, res) => {\n  const result = await sql\`SELECT version()\`;\n  const { version } = result[0];\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end(version);\n};\n\nhttp.createServer(requestHandler).listen(3000, () => {\n  console.log("Server running at http://localhost:3000");\n});`,
          },
          {
            label: '.env',
            value: `DATABASE_URL='${databaseUrl}'`,
            copyValue: `DATABASE_URL='${copyDatabaseUrl}'`,
          },
        ],
      },
      {
        label: '.NET',
        snippets: [
          {
            label: 'Connection string',
            value: dotnetConnectionString ? `"${dotnetConnectionString}"` : '',
            copyValue: copyDotnetConnectionString ? `"${copyDotnetConnectionString}"` : '',
          },
          {
            label: 'Entity Framework',
            value: dotnetConnectionString
              ? `{\n  ...\n  "ConnectionStrings": {\n    "DefaultConnection": "${dotnetConnectionString}"\n  },\n  ...\n}`
              : '',
            copyValue: copyDotnetConnectionString
              ? `{\n  ...\n  "ConnectionStrings": {\n    "DefaultConnection": "${copyDotnetConnectionString}"\n  },\n  ...\n}`
              : '',
          },
        ],
      },
      {
        label: 'Django',
        snippets: [
          {
            label: 'settings.py',
            value: `# Add these at the top of your settings.py\nimport os\nfrom dotenv import load_dotenv\nfrom urllib.parse import urlparse, parse_qsl\n\nload_dotenv()\n\n# Replace the DATABASES section of your settings.py with this\ntmpPostgres = urlparse(os.getenv("DATABASE_URL"))\n\nDATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.postgresql',\n        'NAME': tmpPostgres.path.replace('/', ''),\n        'USER': tmpPostgres.username,\n        'PASSWORD': tmpPostgres.password,\n        'HOST': tmpPostgres.hostname,\n        'PORT': 5432,\n        'OPTIONS': dict(parse_qsl(tmpPostgres.query)),\n    }\n}`,
          },
          {
            label: '.env',
            value: `DATABASE_URL='${databaseUrl}'`,
            copyValue: `DATABASE_URL='${copyDatabaseUrl}'`,
          },
        ],
      },
      {
        label: 'SQLAlchemy',
        snippets: [
          {
            label: 'SQLAlchemy',
            value: `import os\nimport asyncio\nimport re\nfrom sqlalchemy import text\nfrom dotenv import load_dotenv\nfrom sqlalchemy.ext.asyncio import create_async_engine\n\nload_dotenv()\n\nasync def async_main() -> None:\n    engine = create_async_engine(re.sub(r'^postgresql:', 'postgresql+psycopg:', os.getenv('DATABASE_URL')), echo=True)\n    async with engine.connect() as conn:\n        result = await conn.execute(text("select 'hello world'"))\n        print(result.fetchall())\n    await engine.dispose()\n\nawait async_main()`,
          },
          {
            label: '.env',
            value: `DATABASE_URL='${databaseUrl}'`,
            copyValue: `DATABASE_URL='${copyDatabaseUrl}'`,
          },
        ],
      },
      {
        label: 'Java',
        snippets: [
          {
            label: 'JDBC',
            value: javaUrl,
            copyValue: copyJavaUrl,
          },
        ],
      },
      {
        label: 'Symfony',
        snippets: [
          {
            label: '.env',
            value: `# cat .env | grep DATABASE_URL\nDATABASE_URL="${databaseUrl}&charset=utf8"`,
            copyValue: `# cat .env | grep DATABASE_URL\nDATABASE_URL="${copyDatabaseUrl}&charset=utf8"`,
          },
        ],
      },
      {
        label: 'Go',
        snippets: [
          {
            label: 'Go',
            value: `package main\n\nimport (\n\t"context"\n\t"fmt"\n\t"log"\n\t"os"\n\n\t"github.com/jackc/pgx/v5"\n\t"github.com/joho/godotenv"\n)\n\nfunc main() {\n\terr := godotenv.Load()\n\tif err != nil {\n\t\tlog.Fatal("Error loading .env file")\n\t}\n\tconnStr := os.Getenv("DATABASE_URL")\n\tconn, err := pgx.Connect(context.Background(), connStr)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer conn.Close(context.Background())\n\t_, err = conn.Exec(context.Background(), "CREATE TABLE IF NOT EXISTS playing_with_cared(id SERIAL PRIMARY KEY, name TEXT NOT NULL, value REAL);")\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\t_, err = conn.Exec(context.Background(), "INSERT INTO playing_with_cared(name, value) SELECT LEFT(md5(i::TEXT), 10), random() FROM generate_series(1, 10) s(i);")\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\trows, err := conn.Query(context.Background(), "SELECT * FROM playing_with_cared")\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer rows.Close()\n\tfor rows.Next() {\n\t\tvar id int32\n\t\tvar name string\n\t\tvar value float32\n\t\tif err := rows.Scan(&id, &name, &value); err != nil {\n\t\t\tpanic(err)\n\t\t}\n\t\tfmt.Printf("%d | %s | %f\\n", id, name, value)\n\t}\n}`,
          },
          {
            label: '.env',
            value: `DATABASE_URL='${databaseUrl}'`,
            copyValue: `DATABASE_URL='${copyDatabaseUrl}'`,
          },
        ],
      },
      {
        label: 'Neon Serverless Driver',
        snippets: [
          {
            label: 'HTTP',
            value: `import { neon } from '@neondatabase/serverless';\n\nconst sql = neon('${databaseUrl}');\n\nconst posts = await sql('SELECT * FROM posts');\n\n// See https://neon.com/docs/serverless/serverless-driver\n// for more information`,
            copyValue: `import { neon } from '@neondatabase/serverless';\n\nconst sql = neon('${copyDatabaseUrl}');\n\nconst posts = await sql('SELECT * FROM posts');\n\n// See https://neon.com/docs/serverless/serverless-driver\n// for more information`,
          },
          {
            label: 'WebSockets',
            value: `import { Pool } from '@neondatabase/serverless';\n\nconst pool = new Pool({ connectionString: '${databaseUrl}' });\n\nconst { rows: [post] } = await pool.query('SELECT * FROM posts');\n\npool.end();`,
            copyValue: `import { Pool } from '@neondatabase/serverless';\n\nconst pool = new Pool({ connectionString: '${copyDatabaseUrl}' });\n\nconst { rows: [post] } = await pool.query('SELECT * FROM posts');\n\npool.end();`,
          },
        ],
      },
      {
        label: 'NestJS',
        snippets: [
          {
            label: 'database.service.ts',
            value: `// database.service.ts\nimport { neon } from '@neondatabase/serverless';\nimport { Injectable } from '@nestjs/common';\nimport { ConfigService } from '@nestjs/config';\n\n@Injectable()\nexport class DatabaseService {\n    private readonly sql;\n\n    constructor(private configService: ConfigService) {\n        const databaseUrl = this.configService.get('DATABASE_URL');\n        this.sql = neon(databaseUrl);\n    }\n        async getData() {\n        const data = await this.sql\`...\`;\n        return data;\n    }\n}`,
          },
          {
            label: '.env',
            value: `# keep database credentials secure: do not expose them to client-side code\n\nDATABASE_URL='${databaseUrl}'`,
            copyValue: `# keep database credentials secure: do not expose them to client-side code\n\nDATABASE_URL='${copyDatabaseUrl}'`,
          },
        ],
      },
    ]
  }, [
    connectionHost,
    connectionString,
    copyConnectionString,
    copyDotnetConnectionString,
    copyPassword,
    database,
    displayPassword,
    dotnetConnectionString,
    host,
    role,
  ])
  const selectedSection =
    snippets.find((section) => section.label === selectedMethod) ?? snippets[0]
  const selectedSnippet = selectedSection?.snippets[0]
  const showSnippetTabs = (selectedSection?.snippets.length ?? 0) > 1

  const handleCopy = (snippet: ConnectionSnippet) => {
    if (!snippet.value) {
      toast.error('Select branch, database, and role first')
      return
    }
    const toCopy = snippet.copyValue ?? snippet.value
    void navigator.clipboard.writeText(toCopy).then(() => {
      toast.success('Snippet copied')
    })
  }

  return (
    <div className="space-y-5 pt-1">
      {/* Selectors row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select value={branchId} onValueChange={setBranchId} disabled={branches.length === 0}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <span>{b.name}</span>
                  {b.default && (
                    <span className="ml-1.5 text-muted-foreground text-xs">Default</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Compute</Label>
          <Select
            value={endpointId}
            onValueChange={(v) => {
              setEndpointId(v)
              setPasswordRevealState('hidden')
            }}
            disabled={branchEndpoints.length === 0}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Compute" />
            </SelectTrigger>
            <SelectContent>
              {branchEndpoints.map((ep) => (
                <SelectItem key={ep.id} value={ep.id}>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full shrink-0',
                        ep.currentState === 'active' ? 'bg-green-500' : 'bg-muted-foreground',
                      )}
                    />
                    {endpointDisplayName(ep)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Database</Label>
          </div>
          <Select value={database} onValueChange={setDatabase} disabled={databases.length === 0}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Database" />
            </SelectTrigger>
            <SelectContent>
              {databases.map((db) => (
                <SelectItem key={db.name} value={db.name}>
                  {db.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
            >
              Reset password
            </button>
          </div>
          <Select value={role} onValueChange={setRole} disabled={roles.length === 0}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.name} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Connection methods */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Select value={selectedSection?.label} onValueChange={setSelectedMethod}>
            <SelectTrigger className="h-8 w-fit text-sm">
              <SelectValue placeholder="Connection method" />
            </SelectTrigger>
            <SelectContent>
              {snippets.map((section) => (
                <SelectItem key={section.label} value={section.label}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label
            htmlFor="connect-pooling-toggle"
            className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground font-normal"
          >
            <Switch
              id="connect-pooling-toggle"
              checked={pooling}
              onCheckedChange={setPooling}
              className="scale-90"
            />
            Connection pooling
          </Label>
        </div>

        {selectedSection &&
          (showSnippetTabs ? (
            <Tabs key={selectedSection.label} defaultValue={selectedSection.snippets[0]?.label}>
              <TabsList>
                {selectedSection.snippets.map((snippet) => (
                  <TabsTrigger key={snippet.label} value={snippet.label} className="px-3 text-xs">
                    {snippet.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {selectedSection.snippets.map((snippet) => (
                <TabsContent key={snippet.label} value={snippet.label} className="space-y-3">
                  <CodeSnippet snippet={snippet} isLoading={isLoadingConnectionUris} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => handleCopy(snippet)}
                      disabled={!snippet.value || isLoadingConnectionUris}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy snippet
                    </Button>
                    <Button
                      data-password-toggle
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() =>
                        setPasswordRevealState((prev) =>
                          prev === 'persistent' ? 'hidden' : 'persistent',
                        )
                      }
                      disabled={!actualPassword || isLoadingConnectionUris}
                    >
                      {passwordRevealed ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {passwordRevealed ? 'Hide password' : 'Show password'}
                    </Button>
                    {isLoadingConnectionUris && (
                      <RotateCcw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : selectedSnippet ? (
            <div className="space-y-3">
              <CodeSnippet snippet={selectedSnippet} isLoading={isLoadingConnectionUris} />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => handleCopy(selectedSnippet)}
                  disabled={!selectedSnippet.value || isLoadingConnectionUris}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy snippet
                </Button>
                <Button
                  data-password-toggle
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() =>
                    setPasswordRevealState((prev) =>
                      prev === 'persistent' ? 'hidden' : 'persistent',
                    )
                  }
                  disabled={!actualPassword || isLoadingConnectionUris}
                >
                  {passwordRevealed ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {passwordRevealed ? 'Hide password' : 'Show password'}
                </Button>
                {isLoadingConnectionUris && (
                  <RotateCcw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          ) : null)}
      </div>

      <p className="text-xs text-muted-foreground">
        Your password is saved in a secure storage vault.
      </p>
    </div>
  )
}

export function ConnectDialog({
  namespaceId,
  branches,
  endpoints,
  initialBranchId,
  open,
  onOpenChange,
}: ConnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect to your database</DialogTitle>
        </DialogHeader>
        <ConnectDialogBody
          namespaceId={namespaceId}
          branches={branches}
          endpoints={endpoints}
          initialBranchId={initialBranchId}
        />
      </DialogContent>
    </Dialog>
  )
}
