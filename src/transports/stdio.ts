import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { BaseTransportServer } from "./base.js"

/**
 * Configuration options for the stdio server
 */
export interface StdioServerOptions {
  // Add any future configuration options here
}

/**
 * Class to handle stdio server setup and configuration using the official MCP stdio transport
 */
export class StdioServer extends BaseTransportServer {
  private server: ReturnType<typeof import("../utils/server-factory.js").createMCPServer>
  private transport?: StdioServerTransport

  /**
   * Create a new stdio server for MCP over stdio
   *
   * @param options Configuration options
   */
  constructor() {
    super()
    // Create MCP server with handlers configured
    this.server = this.createConfiguredServer()
  }

  /**
   * Start the stdio server
   *
   * @returns Promise that resolves when the server is started
   */
  public async start(): Promise<void> {
    this.transport = new StdioServerTransport()
    await this.server.connect(this.transport)
    console.error("MCP Server Template running on stdio")
  }

  /**
   * Stop the stdio server
   *
   * @returns Promise that resolves when the server is stopped
   */
  public async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close()
      this.transport = undefined
    }
  }
}
