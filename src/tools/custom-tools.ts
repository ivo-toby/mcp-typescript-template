import { z } from "zod"
import { toolRegistry } from "./registry.js"

// Example: File system tool (placeholder - would need actual implementation)
const readFileSchema = z.object({
  path: z.string(),
  encoding: z.enum(["utf8", "base64"]).default("utf8"),
})

toolRegistry.register({
  name: "read_file",
  description: "Read a file from the filesystem",
  inputSchema: readFileSchema,
  handler: async (args) => {
    // This is a placeholder implementation
    // In a real implementation, you would read the actual file
    return `File content from ${args.path} (encoding: ${args.encoding})`
  },
})

// Example: HTTP request tool
const httpRequestSchema = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
})

toolRegistry.register({
  name: "http_request",
  description: "Make an HTTP request",
  inputSchema: httpRequestSchema,
  handler: async (args) => {
    // This is a placeholder implementation
    // In a real implementation, you would make the actual HTTP request
    return {
      status: 200,
      url: args.url,
      method: args.method,
      response: "Mock response data",
    }
  },
})

// Example: Data processing tool
const processDataSchema = z.object({
  data: z.array(z.record(z.any())),
  operation: z.enum(["filter", "sort", "group", "transform"]),
  field: z.string(),
  value: z.any().optional(),
})

toolRegistry.register({
  name: "process_data",
  description: "Process array data with various operations",
  inputSchema: processDataSchema,
  handler: async (args) => {
    const { data, operation, field, value } = args

    switch (operation) {
      case "filter":
        return data.filter(item => item[field] === value)
      case "sort":
        return data.sort((a, b) => {
          if (a[field] < b[field]) return -1
          if (a[field] > b[field]) return 1
          return 0
        })
      case "group":
        return data.reduce((groups, item) => {
          const key = item[field]
          if (!groups[key]) groups[key] = []
          groups[key].push(item)
          return groups
        }, {} as Record<string, any[]>)
      case "transform":
        return data.map(item => ({ ...item, [field]: value }))
      default:
        return data
    }
  },
})