#!/usr/bin/env node

import { StreamableHttpServer } from "./transports/streamable-http.js"

// Create and start the HTTP server
const server = new StreamableHttpServer({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || "localhost",
})

async function startServer() {
  try {
    await server.start()
    console.error("MCP HTTP Server started successfully")
  } catch (error) {
    console.error("Failed to start HTTP server:", error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down HTTP server...")
  try {
    await server.stop()
    console.error("HTTP server stopped")
    process.exit(0)
  } catch (error) {
    console.error("Error stopping server:", error)
    process.exit(1)
  }
})

process.on("SIGTERM", async () => {
  console.error("Shutting down HTTP server...")
  try {
    await server.stop()
    console.error("HTTP server stopped")
    process.exit(0)
  } catch (error) {
    console.error("Error stopping server:", error)
    process.exit(1)
  }
})

startServer()
