import { z } from "zod"
import { resourceRegistry } from "./registry.js"

// Example: File listing resource (placeholder - would need actual implementation)
const fileListArgsSchema = z.object({
  path: z.string().default("."),
  includeHidden: z.boolean().default(false),
  recursive: z.boolean().default(false),
})

resourceRegistry.register({
  uri: "file://list",
  name: "File Listing",
  description: "List files in a directory",
  mimeType: "application/json",
  argsSchema: fileListArgsSchema,
  handler: async (args) => {
    // This is a placeholder implementation
    // In a real implementation, you would read the actual directory
    const { path, includeHidden, recursive } = args || {}

    const mockFiles = [
      { name: "example.txt", type: "file", size: 1024 },
      { name: "subfolder", type: "directory", size: 0 },
      ...(includeHidden ? [{ name: ".hidden", type: "file", size: 512 }] : []),
    ]

    return {
      contents: [
        {
          uri: "file://list",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              path,
              options: { includeHidden, recursive },
              files: mockFiles,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
})

// Example: Database schema resource (placeholder)
const dbSchemaArgsSchema = z.object({
  table: z.string().optional(),
  includeIndexes: z.boolean().default(false),
})

resourceRegistry.register({
  uri: "db://schema",
  name: "Database Schema",
  description: "Get database table schemas",
  mimeType: "application/json",
  argsSchema: dbSchemaArgsSchema,
  handler: async (args) => {
    // This is a placeholder implementation
    // In a real implementation, you would query the actual database
    const { table, includeIndexes } = args || {}

    const mockSchema = {
      tables: table ? [table] : ["users", "posts", "comments"],
      schema: {
        users: {
          columns: [
            { name: "id", type: "integer", primaryKey: true },
            { name: "email", type: "varchar(255)", unique: true },
            { name: "created_at", type: "timestamp" },
          ],
          ...(includeIndexes && {
            indexes: [{ name: "idx_users_email", columns: ["email"] }],
          }),
        },
      },
    }

    return {
      contents: [
        {
          uri: "db://schema",
          mimeType: "application/json",
          text: JSON.stringify(mockSchema, null, 2),
        },
      ],
    }
  },
})

// Example: API status resource
resourceRegistry.register({
  uri: "api://status",
  name: "API Status",
  description: "Get status of external APIs and services",
  mimeType: "application/json",
  handler: async () => {
    // This is a placeholder implementation
    // In a real implementation, you would check actual API endpoints
    const mockStatus = {
      timestamp: new Date().toISOString(),
      services: [
        {
          name: "Database",
          status: "healthy",
          responseTime: "12ms",
          lastCheck: new Date().toISOString(),
        },
        {
          name: "External API",
          status: "healthy",
          responseTime: "45ms",
          lastCheck: new Date().toISOString(),
        },
        {
          name: "Cache",
          status: "degraded",
          responseTime: "150ms",
          lastCheck: new Date().toISOString(),
          message: "High latency detected",
        },
      ],
      overall: "healthy",
    }

    return {
      contents: [
        {
          uri: "api://status",
          mimeType: "application/json",
          text: JSON.stringify(mockStatus, null, 2),
        },
      ],
    }
  },
})

// Example: Log entries resource
const logArgsSchema = z.object({
  level: z.enum(["error", "warn", "info", "debug"]).optional(),
  limit: z.number().min(1).max(1000).default(100),
  since: z.string().optional(), // ISO timestamp
})

resourceRegistry.register({
  uri: "logs://entries",
  name: "Log Entries",
  description: "Get recent log entries with optional filtering",
  mimeType: "text/plain",
  argsSchema: logArgsSchema,
  handler: async (args) => {
    // This is a placeholder implementation
    // In a real implementation, you would read actual log files
    const { level, limit, since } = args || {}

    const mockLogs = [
      "2024-01-15T10:30:00Z [INFO] Server started successfully",
      "2024-01-15T10:30:15Z [INFO] Connected to database",
      "2024-01-15T10:31:00Z [WARN] High memory usage detected",
      "2024-01-15T10:32:00Z [ERROR] Failed to connect to external service",
      "2024-01-15T10:33:00Z [INFO] External service connection restored",
    ]

    let filteredLogs = mockLogs

    if (level) {
      filteredLogs = filteredLogs.filter((log) =>
        log.toLowerCase().includes(`[${level.toLowerCase()}]`),
      )
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(0, limit)
    }

    return {
      contents: [
        {
          uri: "logs://entries",
          mimeType: "text/plain",
          text: filteredLogs.join("\n"),
        },
      ],
    }
  },
})
