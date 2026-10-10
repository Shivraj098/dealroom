import { config } from './config/env'
import { connectDatabase, disconnectDatabase } from './config/database'
import app from './app'
import { attachChatGateway } from './realtime/chatGateway'

async function startServer() {
  try {
    // Connect to database first
    await connectDatabase()

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`)
      console.log(`✓ Environment: ${config.nodeEnv}`)
      console.log(`✓ Client origin: ${config.clientOrigin}`)
    })

    // Keep realtime messaging on the same HTTP server so cookies and origin checks apply.
    const closeChatGateway = attachChatGateway(server)

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`)

      await closeChatGateway()
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('✓ HTTP server closed')
          resolve()
        })
      })

      await disconnectDatabase()
      process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
