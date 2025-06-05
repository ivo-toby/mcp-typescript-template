import { z } from "zod"
import { resourceRegistry } from "./registry.js"

// Example: System information resource
resourceRegistry.register({
  uri: "system://info",
  name: "System Information",
  description: "Get basic system information",
  mimeType: "application/json",
  handler: async () => {
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    }

    return {
      contents: [
        {
          uri: "system://info",
          mimeType: "application/json",
          text: JSON.stringify(systemInfo, null, 2),
        },
      ],
    }
  },
})

// Example: Environment variables resource
const envArgsSchema = z.object({
  prefix: z.string().optional(),
  includeValues: z.boolean().default(false),
})

resourceRegistry.register({
  uri: "system://env",
  name: "Environment Variables",
  description: "Get environment variables, optionally filtered by prefix",
  mimeType: "application/json",
  argsSchema: envArgsSchema,
  handler: async (args) => {
    const { prefix, includeValues } = args || {}

    let envVars = Object.keys(process.env)

    if (prefix) {
      envVars = envVars.filter(key => key.startsWith(prefix))
    }

    const result = includeValues
      ? Object.fromEntries(envVars.map(key => [key, process.env[key]]))
      : envVars

    return {
      contents: [
        {
          uri: "system://env",
          mimeType: "application/json",
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  },
})

// Example: Configuration resource
resourceRegistry.register({
  uri: "config://server",
  name: "Server Configuration",
  description: "Get server configuration and capabilities",
  mimeType: "application/json",
  handler: async () => {
    const config = {
      name: "mcp-server-template",
      version: "1.0.0",
      capabilities: {
        tools: true,
        prompts: true,
        resources: true,
      },
      features: [
        "Type-safe tool definitions",
        "Zod schema validation",
        "Registry-based architecture",
        "Example implementations",
      ],
      endpoints: {
        tools: "Available via tool registry",
        prompts: "Available via prompt registry",
        resources: "Available via resource registry",
      },
    }

    return {
      contents: [
        {
          uri: "config://server",
          mimeType: "application/json",
          text: JSON.stringify(config, null, 2),
        },
      ],
    }
  },
})

// Example: Documentation resource
const docsArgsSchema = z.object({
  section: z.enum(["overview", "tools", "prompts", "resources", "examples"]).optional(),
})

resourceRegistry.register({
  uri: "docs://template",
  name: "Template Documentation",
  description: "Get documentation for the MCP server template",
  mimeType: "text/markdown",
  argsSchema: docsArgsSchema,
  handler: async (args) => {
    const { section } = args || {}

    const docs = {
      overview: `# MCP Server Template Overview

This template provides a clean, type-safe way to build MCP servers with:
- Tool registry with Zod validation
- Prompt registry with structured handlers
- Resource registry for data exposure
- Automatic type inference
- Built-in error handling`,

      tools: `# Tools

Tools are executable functions that can be invoked by clients:

\`\`\`typescript
toolRegistry.register({
  name: "my_tool",
  description: "What this tool does",
  inputSchema: z.object({ input: z.string() }),
  handler: async (args) => args.input
})
\`\`\``,

      prompts: `# Prompts

Prompts are templates for AI model interactions:

\`\`\`typescript
promptRegistry.register({
  name: "my_prompt",
  description: "Generate a prompt",
  handler: async (args) => ({
    messages: [{ role: "user", content: { type: "text", text: "Hello" } }]
  })
})
\`\`\``,

      resources: `# Resources

Resources provide context data to AI models:

\`\`\`typescript
resourceRegistry.register({
  uri: "my://resource",
  name: "My Resource",
  handler: async () => ({
    contents: [{ uri: "my://resource", text: "data" }]
  })
})
\`\`\``,

      examples: `# Examples

The template includes working examples for:
- Calculator tool (arithmetic operations)
- Echo tool (string processing)
- Time tool (date/time formatting)
- Code review prompts
- System information resources
- Environment variable access`,
    }

    const content = section ? docs[section] : Object.values(docs).join('\n\n---\n\n')

    return {
      contents: [
        {
          uri: "docs://template",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    }
  },
})