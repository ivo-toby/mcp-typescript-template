# Development Guide

This guide explains how to develop and extend the MCP Server Template.

## Architecture Overview

The template follows a clean, registry-based architecture:

```
┌─────────────────┐
│   index.ts      │  ← Main server entry point
│                 │
├─────────────────┤
│ Tool Registry   │  ← Manages tool definitions and execution
│ Prompt Registry │  ← Manages prompt definitions and execution
│ Resource Registry│ ← Manages resource definitions and data access
├─────────────────┤
│ Tools/          │  ← Tool definitions with Zod schemas
│ Prompts/        │  ← Prompt definitions with handlers
│ Resources/      │  ← Resource definitions with data handlers
└─────────────────┘
```

## Key Concepts

### 1. Tool Definition Pattern

Each tool follows this pattern:

```typescript
// 1. Define input schema with Zod
const inputSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
})

// 2. Optional output schema
const outputSchema = z.object({
  result: z.string(),
})

// 3. Register with the registry
toolRegistry.register({
  name: "tool_name",
  description: "What this tool does",
  inputSchema,
  outputSchema, // optional
  handler: async (args) => {
    // args is fully typed based on inputSchema
    return { result: "processed" }
  },
})
```

### 2. Automatic Type Safety

The Zod schemas provide:

- **Runtime validation**: Invalid inputs are caught and return helpful errors
- **Compile-time types**: Handler arguments are automatically typed
- **JSON Schema generation**: For MCP protocol compatibility

### 3. Registry Pattern

Tools and prompts are automatically discovered through imports:

```typescript
// In src/tools/index.ts
import "./examples.js" // Registers example tools
import "./my-tools.js" // Registers your custom tools

export { toolRegistry } from "./registry.js"
```

## Adding New Tools

### Step 1: Create Tool File

Create a new file in `src/tools/` (e.g., `my-tools.ts`):

```typescript
import { z } from "zod"
import { toolRegistry } from "./registry.js"

const myToolSchema = z.object({
  input: z.string(),
  options: z
    .object({
      format: z.enum(["json", "text"]).default("text"),
      verbose: z.boolean().default(false),
    })
    .optional(),
})

toolRegistry.register({
  name: "my_tool",
  description: "Description of what my tool does",
  inputSchema: myToolSchema,
  handler: async (args) => {
    // Implementation here
    const { input, options } = args
    return `Processed: ${input}`
  },
})
```

### Step 2: Register the File

Add the import to `src/tools/index.ts`:

```typescript
import "./examples.js"
import "./my-tools.js" // Add this line
```

### Step 3: Test

Build and run the server to test your new tool.

## Adding New Prompts

Follow the same pattern in `src/prompts/`:

```typescript
import { promptRegistry } from "./registry.js"

promptRegistry.register({
  name: "my_prompt",
  description: "Generate a custom prompt",
  arguments: [
    {
      name: "context",
      description: "Context for the prompt",
      required: true,
    },
  ],
  handler: async (args) => {
    return {
      messages: [
        {
          role: "system",
          content: {
            type: "text",
            text: "You are a helpful assistant.",
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: `Context: ${args?.context}`,
          },
        },
      ],
    }
  },
})
```

## Adding New Resources

Follow the same pattern in `src/resources/`:

```typescript
import { z } from "zod"
import { resourceRegistry } from "./registry.js"

const argsSchema = z.object({
  format: z.enum(["json", "text"]).default("json"),
})

resourceRegistry.register({
  uri: "my://data",
  name: "My Data Resource",
  description: "Provides access to my data",
  mimeType: "application/json",
  argsSchema,
  handler: async (args) => {
    const { format } = args || {}

    const data = { example: "data", timestamp: new Date().toISOString() }

    return {
      contents: [
        {
          uri: "my://data",
          mimeType: format === "json" ? "application/json" : "text/plain",
          text:
            format === "json"
              ? JSON.stringify(data, null, 2)
              : `Example: ${data.example}\nTime: ${data.timestamp}`,
        },
      ],
    }
  },
})
```

## Best Practices

### 1. Schema Design

- **Be specific**: Use enums instead of strings when possible
- **Provide defaults**: Use `.default()` for optional parameters
- **Validate thoroughly**: Use Zod's validation features (min, max, regex, etc.)

```typescript
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
  role: z.enum(["admin", "user", "guest"]).default("user"),
  tags: z.array(z.string()).max(10),
})
```

### 2. Error Handling

The registry handles Zod validation errors automatically, but you can add custom error handling:

```typescript
handler: async (args) => {
  try {
    // Your logic here
    return result
  } catch (error) {
    throw new Error(`Custom error: ${error.message}`)
  }
}
```

### 3. Async Operations

All handlers are async, so you can use external APIs, file system operations, etc.:

```typescript
handler: async (args) => {
  const response = await fetch(args.url)
  const data = await response.json()
  return data
}
```

### 4. Complex Return Types

For complex responses, consider using structured objects:

```typescript
const outputSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  metadata: z.object({
    timestamp: z.string(),
    version: z.string(),
  }),
})

handler: async (args) => {
  return {
    success: true,
    data: processedData,
    metadata: {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  }
}
```

## Testing

### Unit Testing

Test your handlers directly:

```typescript
import { describe, it, expect } from "vitest"
import { myToolHandler } from "./my-tools.js"

describe("My Tool", () => {
  it("should process input correctly", async () => {
    const result = await myToolHandler({ input: "test" })
    expect(result).toBe("Processed: test")
  })
})
```

### Integration Testing

Test through the registry:

```typescript
import { toolRegistry } from "./registry.js"

describe("Tool Registry", () => {
  it("should execute tool correctly", async () => {
    const result = await toolRegistry.executeTool("my_tool", { input: "test" })
    expect(result.content[0].text).toContain("Processed: test")
  })
})
```

## Debugging

### 1. Enable Verbose Logging

Add logging to your handlers:

```typescript
handler: async (args) => {
  console.error("Tool called with args:", args)
  const result = processArgs(args)
  console.error("Tool returning:", result)
  return result
}
```

### 2. Validate Schemas

Test your schemas independently:

```typescript
const testInput = { input: "test" }
const result = myToolSchema.safeParse(testInput)
if (!result.success) {
  console.error("Schema validation failed:", result.error)
}
```

### 3. Use MCP Inspector

The project includes an MCP inspector for testing:

```bash
npm run inspect
```

This opens a web interface where you can test tools interactively.

## Performance Considerations

### 1. Lazy Loading

For tools with heavy dependencies, consider lazy loading:

```typescript
handler: async (args) => {
  const { heavyLibrary } = await import("heavy-library")
  return heavyLibrary.process(args.input)
}
```

### 2. Caching

For expensive operations, implement caching:

```typescript
const cache = new Map()

handler: async (args) => {
  const key = JSON.stringify(args)
  if (cache.has(key)) {
    return cache.get(key)
  }

  const result = await expensiveOperation(args)
  cache.set(key, result)
  return result
}
```

### 3. Streaming

For large responses, consider streaming (if supported by your MCP client):

```typescript
handler: async (args) => {
  // Return data in chunks
  return {
    content: [
      { type: "text", text: "Part 1..." },
      { type: "text", text: "Part 2..." },
    ],
  }
}
```

## Migration from Existing Servers

### 1. Extract Handler Logic

Take existing handler functions and wrap them in the new pattern:

```typescript
// Old pattern
export const oldHandler = async (args) => {
  // existing logic
}

// New pattern
const schema = z.object({
  // define schema based on args
})

toolRegistry.register({
  name: "tool_name",
  inputSchema: schema,
  handler: oldHandler, // reuse existing logic
})
```

### 2. Convert Validation

Replace manual validation with Zod schemas:

```typescript
// Old pattern
if (!args.email || !isValidEmail(args.email)) {
  throw new Error("Invalid email")
}

// New pattern
const schema = z.object({
  email: z.string().email(),
})
// Validation happens automatically
```

### 3. Remove Initialization Code

The template doesn't require complex initialization. Remove:

- Schema loading
- External API setup (move to individual handlers)
- Complex configuration

## Deployment

### 1. Build

```bash
npm run build
```

### 2. Package

The built server is in `dist/bundle.js` and can be run with:

```bash
node dist/bundle.js
```

### 3. Distribution

For npm distribution, the `bin` field in `package.json` points to the executable.

## Contributing

When contributing to the template:

1. **Keep it simple**: The template should be easy to understand
2. **Document patterns**: Add examples for new patterns
3. **Test thoroughly**: Ensure all examples work
4. **Maintain compatibility**: Don't break existing tool definitions
