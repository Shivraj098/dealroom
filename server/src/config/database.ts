import mongoose from 'mongoose'
import { config } from './env'

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('✓ MongoDB connected successfully')
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error)
    process.exit(1)
  }

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close()
    console.log('✓ MongoDB connection closed')
  } catch (error) {
    console.error('✗ Error closing MongoDB connection:', error)
  }
}
