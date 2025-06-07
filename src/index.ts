#!/usr/bin/env node

import { StdioServer } from "./transports/stdio.js"
import { StreamableHttpServer } from "./transports/streamable-http.js"

// Configuration from environment variables
const enableHttp = process.env.ENABLE_HTTP_SERVER === "true"
const httpPort = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3000
const httpHost = process.env.HTTP_HOST || "localhost"

// Create and start the appropriate server
async function runServer() {
  if (enableHttp) {
    // Start HTTP server
    const server = new StreamableHttpServer({
      port: httpPort,
      host: httpHost,
    })

    // Handle graceful shutdown for HTTP server
    const shutdown = async () => {
      console.error("Shutting down HTTP server...")
      try {
        await server.stop()
        console.error("HTTP server stopped")
        process.exit(0)
      } catch (error) {
        console.error("Error stopping server:", error)
        process.exit(1)
      }
    }

    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)

    await server.start()
    console.error("MCP HTTP Server started successfully")
  } else {
    // Start stdio server
    const server = new StdioServer()
    await server.start()
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error)
  process.exit(1)
})
