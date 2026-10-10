import { config } from './config/env'
import { connectDatabase, disconnectDatabase } from './config/database'
import app from './app'

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

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`)
      
      server.close(() => {
        console.log('✓ HTTP server closed')
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
