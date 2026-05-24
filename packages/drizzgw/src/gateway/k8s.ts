import { createHash } from 'node:crypto'
import * as k8s from '@kubernetes/client-node'
import { ApiException, PatchStrategy, setHeaderOptions } from '@kubernetes/client-node'

import { env } from '../env.js'
import { invalidateGatewayUrlCache } from './url.js'

function isNotFound(error: unknown) {
  return error instanceof ApiException && error.code === 404
}

const LABEL_APP = 'drizzle-gateway'
const LABEL_MANAGED_BY = 'drizzgw'
const STORE_PATH = '/store'
const GATEWAY_PORT = 4983

/** Set to "true" after Drizzle Gateway init and slot sync complete. */
export const ANNOTATION_GATEWAY_READY = 'cared.dev/gateway-ready'
const ANNOTATION_GATEWAY_READY_VALUE = 'true'

let coreApi: k8s.CoreV1Api | undefined

function getCoreApi() {
  coreApi ??= (() => {
    const kubeConfig = new k8s.KubeConfig()
    kubeConfig.loadFromDefault()
    return kubeConfig.makeApiClient(k8s.CoreV1Api)
  })()
  return coreApi
}

/**
 * Kubernetes-safe pod name for a branch gateway (max 63 chars).
 */
export function getPodName(branchKey: string): string {
  const normalized = branchKey.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (normalized.length <= 63 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(normalized)) {
    return normalized
  }

  const hash = createHash('sha256').update(branchKey).digest('hex').slice(0, 56)
  return `dgw-${hash}`
}

function gatewayUrlFromPod(pod: k8s.V1Pod, podName: string): string {
  const podIp = pod.status?.podIP
  if (!podIp) {
    throw new Error(`Gateway pod ${podName} has no pod IP`)
  }
  return `http://${podIp}:${GATEWAY_PORT}`
}

export async function podExists(podName: string): Promise<boolean> {
  try {
    await getCoreApi().readNamespacedPod({
      name: podName,
      namespace: env.K8S_NAMESPACE,
    })
    return true
  } catch (error) {
    if (isNotFound(error)) {
      return false
    }
    throw error
  }
}

/**
 * Gateway base URL when the pod exists and init has finished; undefined otherwise.
 */
export async function gatewayReadyAndUrl(podName: string): Promise<string | undefined> {
  try {
    const pod = await getCoreApi().readNamespacedPod({
      name: podName,
      namespace: env.K8S_NAMESPACE,
    })
    if (pod.metadata?.annotations?.[ANNOTATION_GATEWAY_READY] !== ANNOTATION_GATEWAY_READY_VALUE) {
      return undefined
    }
    return gatewayUrlFromPod(pod, podName)
  } catch (error) {
    if (isNotFound(error)) {
      return undefined
    }
    throw error
  }
}

/** Marks the pod ready after Drizzle Gateway init and connection sync. */
export async function markPodGatewayReady(podName: string): Promise<void> {
  await getCoreApi().patchNamespacedPod(
    {
      name: podName,
      namespace: env.K8S_NAMESPACE,
      body: {
        metadata: {
          annotations: {
            [ANNOTATION_GATEWAY_READY]: ANNOTATION_GATEWAY_READY_VALUE,
          },
        },
      },
    },
    setHeaderOptions('Content-Type', PatchStrategy.MergePatch),
  )
}

export async function waitForPodReady(podName: string, timeoutMs = 120_000): Promise<string> {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const pod = await getCoreApi().readNamespacedPod({
      name: podName,
      namespace: env.K8S_NAMESPACE,
    })

    const phase = pod.status?.phase
    if (phase === 'Failed') {
      throw new Error(`Gateway pod ${podName} failed`)
    }

    const ready =
      pod.status?.conditions?.some((c) => c.type === 'Ready' && c.status === 'True') ?? false
    if (ready) {
      return gatewayUrlFromPod(pod, podName)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Timed out waiting for gateway pod ${podName}`)
}

export async function createGatewayPod(podName: string, branchKey: string): Promise<void> {
  const labels = {
    app: LABEL_APP,
    'app.kubernetes.io/managed-by': LABEL_MANAGED_BY,
    'cared.dev/branch-key': branchKey.slice(0, 63),
  }

  const pod: k8s.V1Pod = {
    metadata: {
      name: podName,
      namespace: env.K8S_NAMESPACE,
      labels,
    },
    spec: {
      restartPolicy: 'Always',
      containers: [
        {
          name: 'gateway',
          image: env.DRIZZLE_GATEWAY_IMAGE,
          imagePullPolicy: 'Always', // TODO
          ports: [{ containerPort: GATEWAY_PORT }],
          env: [{ name: 'STORE_PATH', value: STORE_PATH }],
          volumeMounts: [{ name: 'store', mountPath: STORE_PATH }],
          readinessProbe: {
            tcpSocket: { port: GATEWAY_PORT },
            initialDelaySeconds: 2,
            periodSeconds: 2,
          },
        },
      ],
      volumes: [{ name: 'store', emptyDir: {} }],
    },
  }

  await getCoreApi().createNamespacedPod({
    namespace: env.K8S_NAMESPACE,
    body: pod,
  })
}

/** Force-delete a gateway pod (no graceful termination). */
export async function deleteGatewayPod(podName: string, branchKey: string): Promise<void> {
  try {
    await getCoreApi().deleteNamespacedPod({
      name: podName,
      namespace: env.K8S_NAMESPACE,
      gracePeriodSeconds: 0,
      propagationPolicy: 'Background',
    })
  } catch (error) {
    if (!isNotFound(error)) {
      throw error
    }
  }

  await invalidateGatewayUrlCache(branchKey)
}
