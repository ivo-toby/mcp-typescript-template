import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { randomUUID } from "crypto"
import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { BaseTransportServer } from "./base.js"
import { TransportError, ErrorCode, ErrorUtils } from "../types/errors.js"
import { createRateLimitMiddleware, RateLimitConfig } from "../utils/rate-limiter.js"

/**
 * Configuration options for the HTTP server
 */
export interface StreamableHttpServerOptions {
  port?: number
  host?: string
  corsOptions?: cors.CorsOptions
  rateLimitConfig?: RateLimitConfig
  requestTimeoutMs?: number
  maxRequestSizeBytes?: number
  enableRequestLogging?: boolean
  maxConcurrentSessions?: number
  sessionTimeoutMs?: number
}

/**
 * Class to handle HTTP server setup and configuration using the official MCP StreamableHTTP transport
 */
export class StreamableHttpServer extends BaseTransportServer {
  private app: express.Application
  // @ts-expect-error - This property will be initialized in the start() method
  private server: import("http").Server
  private port: number
  private host: string
  private options: StreamableHttpServerOptions
  private rateLimiter?: ReturnType<typeof createRateLimitMiddleware>
  private sessionTimeouts = new Map<string, NodeJS.Timeout>()

  // Map to store transports by session ID
  private transports: Record<string, StreamableHTTPServerTransport> = {}

  /**
   * Create a new HTTP server for MCP over HTTP
   *
   * @param options Configuration options
   */
  constructor(options: StreamableHttpServerOptions = {}) {
    super()
    this.options = {
      port: 3000,
      host: "localhost",
      requestTimeoutMs: 30000,
      maxRequestSizeBytes: 10 * 1024 * 1024, // 10MB
      enableRequestLogging: false,
      maxConcurrentSessions: 100,
      sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
      ...options,
    }

    this.port = this.options.port!
    this.host = this.options.host!

    // Create Express app
    this.app = express()

    // Set up middleware
    this.setupMiddleware()

    // Set up routes
    this.setupRoutes()
  }

  /**
   * Set up middleware for the Express app
   */
  private setupMiddleware(): void {
    // Request logging middleware
    if (this.options.enableRequestLogging) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now()
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`)

        res.on("finish", () => {
          const duration = Date.now() - start
          console.error(
            `[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`,
          )
        })
        next()
      })
    }

    // Rate limiting middleware
    if (this.options.rateLimitConfig) {
      this.rateLimiter = createRateLimitMiddleware(this.options.rateLimitConfig)
      this.app.use(this.rateLimiter.middleware)
    }

    // Request timeout middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          const error = new TransportError(ErrorCode.TRANSPORT_TIMEOUT, "Request timeout", {
            timeoutMs: this.options.requestTimeoutMs,
          })
          res.status(408).json({
            jsonrpc: "2.0",
            error: error.toMCPError(),
            id: null,
          })
        }
      }, this.options.requestTimeoutMs)

      res.on("finish", () => clearTimeout(timeout))
      res.on("close", () => clearTimeout(timeout))
      next()
    })

    // Configure CORS
    this.app.use(
      cors(
        this.options.corsOptions || {
          origin: "*",
          methods: ["GET", "POST", "DELETE"],
          allowedHeaders: ["Content-Type", "MCP-Session-ID"],
          exposedHeaders: ["MCP-Session-ID"],
        },
      ),
    )

    // Configure JSON body parsing with size limit
    this.app.use(
      express.json({
        limit: this.options.maxRequestSizeBytes,
        verify: (req: any, res: Response, buf: Buffer) => {
          if (buf.length > this.options.maxRequestSizeBytes!) {
            const error = new TransportError(ErrorCode.INVALID_REQUEST, "Request body too large", {
              maxSize: this.options.maxRequestSizeBytes,
              actualSize: buf.length,
            })
            throw error
          }
        },
      }),
    )

    // Global error handler for middleware
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      ErrorUtils.logError(error, "HTTP Middleware")

      if (res.headersSent) {
        return next(error)
      }

      if (ErrorUtils.isMCPError(error)) {
        return res.status(error.statusCode).json({
          jsonrpc: "2.0",
          error: error.toMCPError(),
          id: null,
        })
      }

      // Handle specific Express errors
      if (error.type === "entity.too.large") {
        const transportError = new TransportError(
          ErrorCode.INVALID_REQUEST,
          "Request body too large",
        )
        return res.status(413).json({
          jsonrpc: "2.0",
          error: transportError.toMCPError(),
          id: null,
        })
      }

      // Generic error response
      const genericError = new TransportError(ErrorCode.INTERNAL_ERROR, "Internal server error")
      res.status(500).json({
        jsonrpc: "2.0",
        error: genericError.toMCPError(),
        id: null,
      })
    })
  }

  /**
   * Set up the routes for MCP over HTTP
   */
  private setupRoutes(): void {
    // Handle all MCP requests (POST, GET, DELETE) on a single endpoint
    this.app.all("/mcp", async (req: Request, res: Response) => {
      try {
        await this.handleMCPRequest(req, res)
      } catch (error) {
        ErrorUtils.logError(error, "MCP Request Handler")
        if (!res.headersSent) {
          const errorResponse = ErrorUtils.createSafeErrorResponse(error)
          res.status(500).json({
            jsonrpc: "2.0",
            error: errorResponse,
            id: null,
          })
        }
      }
    })

    // Add a health check endpoint
    this.app.get("/health", (_req: Request, res: Response) => {
      try {
        const stats = this.rateLimiter?.limiter.getStats()
        res.status(200).json({
          status: "ok",
          timestamp: new Date().toISOString(),
          sessions: {
            active: Object.keys(this.transports).length,
            max: this.options.maxConcurrentSessions,
          },
          rateLimit: stats || null,
        })
      } catch (error) {
        ErrorUtils.logError(error, "Health Check")
        res.status(500).json({
          status: "error",
          message: "Health check failed",
        })
      }
    })

    // Add session management endpoint
    this.app.get("/sessions", (req: Request, res: Response) => {
      try {
        const sessions = Object.keys(this.transports).map((sessionId) => ({
          id: sessionId,
          createdAt: new Date().toISOString(), // Would need to track this
        }))

        res.status(200).json({
          sessions,
          total: sessions.length,
          max: this.options.maxConcurrentSessions,
        })
      } catch (error) {
        ErrorUtils.logError(error, "Session List")
        res.status(500).json({
          error: "Failed to retrieve sessions",
        })
      }
    })

    // Add session cleanup endpoint (for debugging/admin)
    this.app.delete("/sessions/:sessionId", (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params

        if (this.transports[sessionId]) {
          this.cleanupSession(sessionId)
          res.status(200).json({
            message: `Session ${sessionId} terminated`,
          })
        } else {
          res.status(404).json({
            error: "Session not found",
          })
        }
      } catch (error) {
        ErrorUtils.logError(error, "Session Cleanup")
        res.status(500).json({
          error: "Failed to cleanup session",
        })
      }
    })
  }

  /**
   * Handle MCP requests with enhanced error handling
   */
  private async handleMCPRequest(req: Request, res: Response): Promise<void> {
    // Check session limits
    if (Object.keys(this.transports).length >= this.options.maxConcurrentSessions!) {
      const error = new TransportError(
        ErrorCode.SERVER_OVERLOADED,
        "Maximum concurrent sessions reached",
        {
          maxSessions: this.options.maxConcurrentSessions,
          currentSessions: Object.keys(this.transports).length,
        },
      )
      res.status(503).json({
        jsonrpc: "2.0",
        error: error.toMCPError(),
        id: null,
      })
      return
    }

    if (req.method === "POST") {
      await this.handlePostRequest(req, res)
    } else if (req.method === "GET") {
      await this.handleGetRequest(req, res)
    } else if (req.method === "DELETE") {
      await this.handleDeleteRequest(req, res)
    } else {
      const error = new TransportError(
        ErrorCode.INVALID_REQUEST,
        `Method ${req.method} not allowed`,
      )
      res.status(405).json({
        jsonrpc: "2.0",
        error: error.toMCPError(),
        id: null,
      })
    }
  }

  /**
   * Handle POST requests (main MCP communication)
   */
  private async handlePostRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined
    let transport: StreamableHTTPServerTransport

    if (sessionId && this.transports[sessionId]) {
      // Reuse existing transport
      transport = this.transports[sessionId]
      this.refreshSessionTimeout(sessionId)
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Create new session
      transport = await this.createNewSession()
    } else {
      // Invalid request
      const error = new TransportError(
        ErrorCode.TRANSPORT_INVALID_SESSION,
        sessionId
          ? "Session not found or expired"
          : "No session ID provided for non-initialize request",
        { sessionId },
      )
      res.status(400).json({
        jsonrpc: "2.0",
        error: error.toMCPError(),
        id: null,
      })
      return
    }

    // Handle the request with timeout
    await ErrorUtils.withTimeout(
      transport.handleRequest(req, res, req.body),
      this.options.requestTimeoutMs!,
      "MCP request timed out",
    )
  }

  /**
   * Handle GET requests (server-sent events)
   */
  private async handleGetRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined

    if (!sessionId || !this.transports[sessionId]) {
      const error = new TransportError(
        ErrorCode.TRANSPORT_INVALID_SESSION,
        "Invalid or missing session ID for SSE connection",
        { sessionId },
      )
      res.status(400).json({
        jsonrpc: "2.0",
        error: error.toMCPError(),
        id: null,
      })
      return
    }

    const transport = this.transports[sessionId]
    this.refreshSessionTimeout(sessionId)

    await ErrorUtils.withTimeout(
      transport.handleRequest(req, res),
      this.options.requestTimeoutMs!,
      "SSE connection timed out",
    )
  }

  /**
   * Handle DELETE requests (session termination)
   */
  private async handleDeleteRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined

    if (!sessionId || !this.transports[sessionId]) {
      const error = new TransportError(
        ErrorCode.TRANSPORT_INVALID_SESSION,
        "Invalid or missing session ID for termination",
        { sessionId },
      )
      res.status(400).json({
        jsonrpc: "2.0",
        error: error.toMCPError(),
        id: null,
      })
      return
    }

    const transport = this.transports[sessionId]

    try {
      await ErrorUtils.withTimeout(
        transport.handleRequest(req, res),
        this.options.requestTimeoutMs!,
        "Session termination timed out",
      )
    } finally {
      // Ensure cleanup happens even if the request fails
      this.cleanupSession(sessionId)
    }
  }

  /**
   * Create a new session with proper error handling
   */
  private async createNewSession(): Promise<StreamableHTTPServerTransport> {
    try {
      const server = this.createConfiguredServer()
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          this.transports[sid] = transport
          this.setupSessionTimeout(sid)
          console.error(`Session ${sid} initialized`)
        },
      })

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          this.cleanupSession(transport.sessionId)
        }
      }

      // Connect to the MCP server with timeout
      await ErrorUtils.withTimeout(
        server.connect(transport),
        5000, // 5 second timeout for connection
        "Failed to initialize MCP session",
      )

      return transport
    } catch (error) {
      throw new TransportError(
        ErrorCode.TRANSPORT_CONNECTION_FAILED,
        "Failed to create new session",
        { originalError: ErrorUtils.getErrorMessage(error) },
      )
    }
  }

  /**
   * Set up session timeout
   */
  private setupSessionTimeout(sessionId: string): void {
    const timeout = setTimeout(() => {
      console.error(`Session ${sessionId} timed out`)
      this.cleanupSession(sessionId)
    }, this.options.sessionTimeoutMs!)

    this.sessionTimeouts.set(sessionId, timeout)
  }

  /**
   * Refresh session timeout
   */
  private refreshSessionTimeout(sessionId: string): void {
    const existingTimeout = this.sessionTimeouts.get(sessionId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    this.setupSessionTimeout(sessionId)
  }

  /**
   * Clean up a session and its resources
   */
  private cleanupSession(sessionId: string): void {
    try {
      // Clear timeout
      const timeout = this.sessionTimeouts.get(sessionId)
      if (timeout) {
        clearTimeout(timeout)
        this.sessionTimeouts.delete(sessionId)
      }

      // Close transport
      const transport = this.transports[sessionId]
      if (transport) {
        transport.close().catch((error) => {
          ErrorUtils.logError(error, `Session ${sessionId} cleanup`)
        })
        delete this.transports[sessionId]
      }

      console.error(`Session ${sessionId} cleaned up`)
    } catch (error) {
      ErrorUtils.logError(error, `Session ${sessionId} cleanup`)
    }
  }

  /**
   * Start the HTTP server
   *
   * @returns Promise that resolves when the server is started
   */
  public async start(): Promise<void> {
    // Load resources based on available tokens

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.error(`MCP StreamableHTTP server running on http://${this.host}:${this.port}/mcp`)
        resolve()
      })

      // Handle server errors
      this.server.on("error", (err: Error) => {
        console.error(`Server error: ${err.message}`)
      })
    })
  }

  /**
   * Stop the HTTP server
   *
   * @returns Promise that resolves when the server is stopped
   */
  public async stop(): Promise<void> {
    console.error("Stopping HTTP server...")

    try {
      // Stop accepting new connections
      if (this.server) {
        this.server.close()
      }

      // Clean up all sessions
      const sessionIds = Object.keys(this.transports)
      console.error(`Cleaning up ${sessionIds.length} active sessions...`)

      await Promise.allSettled(
        sessionIds.map(async (sessionId) => {
          try {
            await ErrorUtils.withTimeout(
              this.transports[sessionId].close(),
              5000, // 5 second timeout for cleanup
              `Session ${sessionId} cleanup timed out`,
            )
            this.cleanupSession(sessionId)
          } catch (error) {
            ErrorUtils.logError(error, `Session ${sessionId} cleanup`)
          }
        }),
      )

      // Clean up rate limiter
      if (this.rateLimiter) {
        this.rateLimiter.limiter.destroy()
      }

      // Clear all session timeouts
      for (const timeout of this.sessionTimeouts.values()) {
        clearTimeout(timeout)
      }
      this.sessionTimeouts.clear()

      // Close the HTTP server
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Server shutdown timed out"))
          }, 10000) // 10 second timeout

          this.server.close((err?: Error) => {
            clearTimeout(timeout)
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      }

      console.error("HTTP server stopped successfully")
    } catch (error) {
      ErrorUtils.logError(error, "HTTP Server Shutdown")
      throw new TransportError(
        ErrorCode.SERVER_SHUTDOWN_FAILED,
        "Failed to stop HTTP server gracefully",
        { originalError: ErrorUtils.getErrorMessage(error) },
      )
    }
  }
}
