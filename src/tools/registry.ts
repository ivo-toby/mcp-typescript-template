import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string
  description: string
  inputSchema: z.ZodSchema<TInput>
  outputSchema?: z.ZodSchema<TOutput>
  handler: (args: TInput) => Promise<TOutput>
  prompts?: string[]
}

export interface ToolResult {
  content: Array<{
    type: "text" | "image" | "resource"
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}

// Type-erased version for storage
interface StoredToolDefinition {
  name: string
  description: string
  inputSchema: z.ZodSchema<unknown>
  outputSchema?: z.ZodSchema<unknown>
  handler: (args: unknown) => Promise<unknown>
  prompts?: string[]
}

class ToolRegistry {
  private tools = new Map<string, StoredToolDefinition>()

  register<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>) {
    this.tools.set(tool.name, tool as StoredToolDefinition)
  }

  getToolDefinitions() {
    const definitions: Record<string, unknown> = {}
    for (const [name, tool] of this.tools) {
      definitions[name.toUpperCase()] = {
        name: tool.name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.inputSchema),
      }
    }
    return definitions
  }

  getToolsList() {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    }))
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`)
    }

    try {
      // Validate input with Zod schema
      const validatedArgs = tool.inputSchema.parse(args)

      // Execute the handler
      const result = await tool.handler(validatedArgs)

      // Validate output if schema is provided
      if (tool.outputSchema) {
        tool.outputSchema.parse(result)
      }

      // Format result for MCP
      if (typeof result === "string") {
        return {
          content: [{ type: "text", text: result }],
        }
      }

      if (typeof result === "object" && result !== null) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        }
      }

      return {
        content: [{ type: "text", text: String(result) }],
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid input: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        )
      }
      throw error
    }
  }
}

export const toolRegistry = new ToolRegistry()
