import { runOffloader } from './offloader/index.js'
import { startServer } from './server/index.js'

async function startOffloader(): Promise<void> {
  let shutdownRequested = false

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down drizzgw offloader gracefully...`)
    shutdownRequested = true
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  await runOffloader(() => shutdownRequested)
}

const args = process.argv.slice(2)
const mode = args.find((arg) => arg === '--server' || arg === '--offloader') ?? '--server'

if (mode === '--offloader') {
  startOffloader().catch((error) => {
    console.error('Failed to start drizzgw offloader:', error)
    process.exit(1)
  })
} else {
  try {
    startServer()
  } catch (error) {
    console.error('Failed to start drizzgw server:', error)
    process.exit(1)
  }
}
