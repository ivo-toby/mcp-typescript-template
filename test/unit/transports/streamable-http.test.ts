import http from "http"
import express from "express"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  StreamableHttpServer,
  StreamableHttpServerOptions,
} from "../../../src/transports/streamable-http"
import { createMCPServer } from "../../../src/utils/server-factory"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { TransportError, ErrorCode } from "../../../src/types/errors"

// Mock dependencies
vi.mock("../../../src/utils/server-factory")
vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js")

describe("StreamableHttpServer", () => {
  let server: StreamableHttpServer
  const mockCreateMCPServer = vi.mocked(createMCPServer)
  const mockSDKServer = {
    connect: vi.fn(),
    handleRequest: vi.fn(),
  }

  beforeEach(() => {
    mockCreateMCPServer.mockReturnValue(mockSDKServer as any)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    if (server) {
      server.stop()
    }
  })

  it("should create a server with default options", () => {
    server = new StreamableHttpServer()
    // @ts-expect-error - private property access
    expect(server.port).toBe(3000)
    // @ts-expect-error - private property access
    expect(server.host).toBe("localhost")
  })

  it("should create a server with custom options", () => {
    const options: StreamableHttpServerOptions = {
      port: 4000,
      host: "0.0.0.0",
      enableRequestLogging: true,
      rateLimitConfig: { windowMs: 1000, maxRequests: 10 },
    }
    server = new StreamableHttpServer(options)
    // @ts-expect-error - private property access
    expect(server.port).toBe(4000)
    // @ts-expect-error - private property access
    expect(server.host).toBe("0.0.0.0")
    // @ts-expect-error - private property access
    expect(server.rateLimiter).toBeDefined()
  })

  it("should start and stop the server", async () => {
    server = new StreamableHttpServer()
    const listenSpy = vi.spyOn(http.Server.prototype, "listen").mockImplementation(function (
      this: any,
    ) {
      this.emit("listening")
      return this
    })
    const closeSpy = vi.spyOn(http.Server.prototype, "close").mockImplementation(function (
      this: any,
    ) {
      this.emit("close")
      return this
    })

    await server.start()
    // @ts-expect-error - private property access
    expect(server.server).toBeInstanceOf(http.Server)
    expect(listenSpy).toHaveBeenCalledWith(3000, "localhost", expect.any(Function))

    await server.stop()
    expect(closeSpy).toHaveBeenCalled()
  })

  it("should handle session creation and cleanup", async () => {
    server = new StreamableHttpServer({ sessionTimeoutMs: 1000 })
    await server.start()

    // @ts-expect-error - private property access
    const transport = await server.createNewSession()
    expect(transport).toBeInstanceOf(StreamableHTTPServerTransport)
    // @ts-expect-error - private property access
    const sessionId = Object.keys(server.transports)[0]
    // @ts-expect-error - private property access
    expect(server.transports[sessionId]).toBe(transport)
    // @ts-expect-error - private property access
    expect(server.sessionTimeouts.has(sessionId)).toBe(true)

    // Advance time to trigger cleanup
    vi.advanceTimersByTime(1500)

    // @ts-expect-error - private property access
    expect(server.transports[sessionId]).toBeUndefined()
    // @ts-expect-error - private property access
    expect(server.sessionTimeouts.has(sessionId)).toBe(false)
  })

  it("should throw an error if max concurrent sessions is reached", async () => {
    server = new StreamableHttpServer({ maxConcurrentSessions: 1 })
    await server.start()

    // @ts-expect-error - private property access
    await server.createNewSession()

    await expect(
      // @ts-expect-error - private property access
      server.createNewSession(),
    ).rejects.toThrow(
      new TransportError(
        "SERVER_OVERLOADED" as any,
        "Maximum number of concurrent sessions reached",
      ),
    )
  })

  // This is a basic test. A full test would require mocking express req/res objects
  // and testing the handleMCPRequest method, which is complex.
  it("should setup routes", async () => {
    server = new StreamableHttpServer()
    // @ts-expect-error
    const app = server.app as express.Application
    const mcpRoute = app._router.stack.find((r: any) => r.route && r.route.path === "/mcp")
    expect(mcpRoute).toBeDefined()
    expect(mcpRoute.route.methods.post).toBe(true)
  })
})
