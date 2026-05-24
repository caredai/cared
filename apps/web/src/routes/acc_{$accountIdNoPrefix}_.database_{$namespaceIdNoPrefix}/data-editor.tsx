import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from 'next-themes'

import { Spinner } from '@cared/ui/components/spinner'

import { branchSearchSchema } from '@/components/databases/branch-search'
import { SectionTitle } from '@/components/section'
import { env } from '@/env'

/** postMessage protocol shared with drizzle-gateway inline script */
const DRIZZGW_MESSAGE_TYPE = 'CARED_DRIZZGW' as const

interface DrizzgwMessage {
  type: typeof DRIZZGW_MESSAGE_TYPE
  command: 'requestTheme' | 'setTheme'
  theme?: 'light' | 'dark'
}

function isDrizzgwMessage(data: unknown): data is DrizzgwMessage {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  const message = data as Record<string, unknown>
  return message.type === DRIZZGW_MESSAGE_TYPE && typeof message.command === 'string'
}

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/data-editor',
)({
  validateSearch: branchSearchSchema,
  component: DatabaseDataEditorPage,
})

type SyncState = 'idle' | 'loading' | 'ready' | 'error'

function buildGatewayUrl(namespaceIdNoPrefix: string, branchId: string) {
  const suffix = env.VITE_DRIZZGW_DOMAIN_SUFFIX
  if (!suffix) {
    return 'http://localhost:4983/'
  }
  return `${window.location.protocol}//${namespaceIdNoPrefix}-${branchId}.${suffix}/`
}

function postThemeToGateway(target: Window, gatewayOrigin: string, resolvedTheme: string) {
  const theme = resolvedTheme === 'light' ? 'light' : 'dark'
  target.postMessage(
    {
      type: DRIZZGW_MESSAGE_TYPE,
      command: 'setTheme',
      theme,
    },
    gatewayOrigin,
  )
}

function DatabaseDataEditorPage() {
  const { namespaceIdNoPrefix } = Route.useParams()
  const { branch: branchId } = Route.useSearch()

  const gatewayUrl = branchId ? buildGatewayUrl(namespaceIdNoPrefix, branchId) : undefined
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [displayReady, setDisplayReady] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { resolvedTheme } = useTheme()

  const showLoading = syncState === 'loading' || (syncState === 'ready' && !displayReady)
  const showError = syncState === 'error'
  const mountIframe = syncState === 'ready' && Boolean(gatewayUrl)

  useEffect(() => {
    setDisplayReady(false)
    setIframeLoaded(false)
  }, [gatewayUrl])

  useEffect(() => {
    if (syncState !== 'ready') {
      setDisplayReady(false)
      return
    }

    const timer = window.setTimeout(() => setDisplayReady(true), 2000)
    return () => window.clearTimeout(timer)
  }, [syncState])

  useEffect(() => {
    if (!gatewayUrl) {
      setSyncState('idle')
      return
    }

    let cancelled = false
    setSyncState('loading')

    void fetch(new URL('/_cared/sync', gatewayUrl), {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => {
        if (cancelled) return
        setSyncState(response.ok ? 'ready' : 'error')
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Failed to sync drizzgw connections:', error)
        setSyncState('error')
      })

    return () => {
      cancelled = true
    }
  }, [gatewayUrl])

  useEffect(() => {
    if (syncState !== 'ready' || !gatewayUrl || !resolvedTheme) {
      return
    }

    const gatewayOrigin = new URL(gatewayUrl).origin

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== gatewayOrigin) {
        return
      }
      if (!(event.source instanceof Window)) {
        return
      }
      if (!isDrizzgwMessage(event.data)) {
        return
      }
      if (event.data.command !== 'requestTheme') {
        return
      }
      if (iframeRef.current?.contentWindow && event.source !== iframeRef.current.contentWindow) {
        return
      }

      postThemeToGateway(event.source, gatewayOrigin, resolvedTheme)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [gatewayUrl, syncState, resolvedTheme])

  useEffect(() => {
    if (syncState !== 'ready' || !gatewayUrl || !resolvedTheme || !iframeLoaded) {
      return
    }

    const iframeWindow = iframeRef.current?.contentWindow
    if (!iframeWindow) {
      return
    }

    postThemeToGateway(iframeWindow, new URL(gatewayUrl).origin, resolvedTheme)
  }, [gatewayUrl, syncState, resolvedTheme, iframeLoaded])

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Data Editor"
        description="Browse and edit data in databases on this branch"
      />
      {branchId ? (
        <div className="overflow-x-auto rounded-lg border border-border min-h-[calc(100dvh-12rem)]">
          {showLoading && (
            <div className="flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-3 p-6">
              <Spinner className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Connecting to the data editor…</p>
            </div>
          )}
          {showError && (
            <div className="flex min-h-[calc(100dvh-12rem)] items-center justify-center p-6">
              <p className="text-sm text-muted-foreground">
                Could not connect to the data editor. Check your access and try again.
              </p>
            </div>
          )}
          {mountIframe && gatewayUrl && (
            <iframe
              ref={iframeRef}
              src={gatewayUrl}
              title="Data Editor"
              className={
                displayReady
                  ? 'block min-h-[calc(100dvh-12rem)] min-w-5xl w-full bg-background'
                  : 'sr-only'
              }
              allow="clipboard-read; clipboard-write"
              onLoad={() => setIframeLoaded(true)}
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a branch in the sidebar to open the data editor.
        </p>
      )}
    </div>
  )
}
