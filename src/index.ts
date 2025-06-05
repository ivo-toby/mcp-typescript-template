#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  CallToolRequest,
  GetPromptRequest,
  ReadResourceRequest,
} from "@modelcontextprotocol/sdk/types.js"
import { toolRegistry } from "./tools/index.js"
import { promptRegistry } from "./prompts/index.js"
import { resourceRegistry } from "./resources/index.js"

// Create MCP server
const server = new Server(
  {
    name: "mcp-server-template",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: toolRegistry.getToolDefinitions(),
      prompts: promptRegistry.getPromptDefinitions(),
      resources: resourceRegistry.getResourceDefinitions(),
    },
  },
)

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolRegistry.getToolsList(),
  }
})

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: promptRegistry.getPromptsList(),
}))

server.setRequestHandler(GetPromptRequestSchema, async (request: GetPromptRequest) => {
  const { name, arguments: args } = request.params
  const result = await promptRegistry.executePrompt(name, args)
  return {
    messages: result.messages,
    tools: result.tools || [],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    const { name, arguments: args } = request.params
    const result = await toolRegistry.executeTool(name, args || {})
    return {
      content: result.content,
      isError: result.isError,
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    }
  }
})

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resourceRegistry.getResourcesList(),
  }
})

server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
  try {
    const { uri } = request.params
    const result = await resourceRegistry.readResource(uri)
    return {
      contents: result.contents,
    }
  } catch (error) {
    throw new Error(
      `Error reading resource: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})

// Start the server
async function runServer() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("MCP Server Template running on stdio")
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error)
  process.exit(1)
})
