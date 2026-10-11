import express from 'express'
import path from 'node:path'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import apiRoutes from './routes/index'

const app = express()

// Security headers
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
}))

// Rate limiting for API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  })
})

// API routes
app.use('/api', apiRoutes)

// In production, serve the Vite build from the same origin as the API.
// This keeps HTTP-only auth cookies and WebSocket origin checks on one site.
if (config.nodeEnv === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist')

  // Vite assets are served directly; index.html is handled by the SPA fallback below.
  app.use(express.static(clientDistPath, { index: false }))

  // Let React Router handle browser navigation to client-side routes, but never
  // turn an unknown API request into index.html.
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    if (req.path === '/api' || req.path.startsWith('/api/')) return next()
    if (!req.accepts('html')) return next()

    res.sendFile(path.join(clientDistPath, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
}

// 404 handler for unmatched /api/* requests and other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

export default app
