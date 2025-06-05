# Please note; this is a work in progress!

# MCP Server Template

A clean, streamlined template for creating Model Context Protocol (MCP) servers with TypeScript. This template provides a simple, declarative pattern for defining tools, handlers, and prompts without complex initialization logic.

## Features

- **Clean Tool Definition**: Define tools with Zod schemas for input/output validation
- **Resource Management**: Expose data and context through a simple resource registry
- **Prompt Templates**: Create reusable prompt templates with structured handlers
- **Type Safety**: Full TypeScript support with proper type inference
- **Declarative Pattern**: Simple registration system for tools, prompts, and resources
- **No Complex Loading**: Everything is registered at startup without external dependencies
- **Extensible**: Easy to add new tools, prompts, and resources

## Quick Start

1. **Install dependencies**:

```bash
npm install
```

2. **Build the server**:

```bash
npm run build
```

3. **Run the server**:

```bash
npm start
```

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── tools/
│   ├── registry.ts       # Tool registry and type definitions
│   ├── examples.ts       # Example tool implementations
│   ├── custom-tools.ts   # Additional example tools
│   └── index.ts          # Tool exports
├── prompts/
│   ├── registry.ts       # Prompt registry and type definitions
│   ├── examples.ts       # Example prompt implementations
│   └── index.ts          # Prompt exports
└── resources/
    ├── registry.ts       # Resource registry and type definitions
    ├── examples.ts       # Example resource implementations
    ├── custom-resources.ts # Additional example resources
    └── index.ts          # Resource exports
```

## Defining Tools

Tools are defined using a clean, declarative pattern with Zod schemas:

```typescript
import { z } from "zod"
import { toolRegistry } from "./registry.js"

// Define input schema
const calculatorInputSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]),
  a: z.number(),
  b: z.number(),
})

// Define output schema (optional)
const calculatorOutputSchema = z.object({
  result: z.number(),
  operation: z.string(),
})

// Register the tool
toolRegistry.register({
  name: "calculator",
  description: "Perform basic arithmetic operations",
  inputSchema: calculatorInputSchema,
  outputSchema: calculatorOutputSchema,
  handler: async (args) => {
    const { operation, a, b } = args
    // Implementation here
    return { result: a + b, operation: `${a} + ${b}` }
  },
})
```

## Defining Prompts

Prompts are defined with a similar pattern:

```typescript
import { promptRegistry } from "./registry.js"

promptRegistry.register({
  name: "code_review",
  description: "Generate a code review prompt",
  arguments: [
    {
      name: "code",
      description: "The code to review",
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
            text: "You are an expert code reviewer.",
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: `Please review: ${args?.code}`,
          },
        },
      ],
    }
  },
})
```

## Key Benefits

### 1. **No Complex Initialization**

Unlike the original server that required loading external schemas and metadata, this template starts immediately with predefined tools.

### 2. **Type-Safe Tool Definitions**

Zod schemas provide runtime validation and compile-time type safety:

```typescript
// Input is automatically typed based on schema
handler: async (args) => {
  // args.operation is typed as "add" | "subtract" | "multiply" | "divide"
  // args.a and args.b are typed as number
}
```

### 3. **Automatic Registration**

Tools and prompts are automatically registered when their modules are imported:

```typescript
// In src/tools/index.ts
import "./examples.js" // Registers all example tools
export { toolRegistry } from "./registry.js"
```

### 4. **Clean Error Handling**

The registry handles validation errors and provides clear error messages:

```typescript
// Invalid input automatically returns helpful error messages
// Output validation ensures consistency
```

## Adding New Tools

1. **Create your tool definition** in `src/tools/examples.ts` or a new file:

```typescript
const myToolSchema = z.object({
  input: z.string(),
})

toolRegistry.register({
  name: "my_tool",
  description: "My custom tool",
  inputSchema: myToolSchema,
  handler: async (args) => {
    // Your implementation
    return `Processed: ${args.input}`
  },
})
```

2. **Import the file** in `src/tools/index.ts` if it's a new file:

```typescript
import "./examples.js"
import "./my-new-tools.js" // Add this line
```

3. **Rebuild and restart** the server.

## Defining Resources

Resources provide context data to AI models:

```typescript
import { z } from "zod"
import { resourceRegistry } from "./registry.js"

// Define optional arguments schema
const argsSchema = z.object({
  format: z.enum(["json", "text"]).default("json"),
})

resourceRegistry.register({
  uri: "my://resource",
  name: "My Resource",
  description: "Provides some data context",
  mimeType: "application/json",
  argsSchema, // optional
  handler: async (args) => {
    return {
      contents: [
        {
          uri: "my://resource",
          mimeType: "application/json",
          text: JSON.stringify({ data: "example" }, null, 2),
        },
      ],
    }
  },
})
```

## Adding New Prompts

Follow the same pattern in the `src/prompts/` directory.

## Adding New Resources

Follow the same pattern in the `src/resources/` directory.

## Environment Variables

This template doesn't require environment variables by default, but you can add them as needed for your specific tools.

## Development

- `npm run build` - Build the server
- `npm run watch` - Watch for changes and rebuild
- `npm run dev` - Development mode with auto-restart
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Customization

### Server Configuration

Modify `src/index.ts` to change server name, version, or capabilities:

```typescript
const server = new Server(
  {
    name: "my-custom-server",
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
```

### Transport Options

The template uses stdio transport by default. You can add HTTP transport or other options as needed.

## Migration from Complex Servers

If you're migrating from a server with complex initialization:

1. **Extract tool logic** from handlers into simple functions
2. **Define Zod schemas** for your inputs and outputs
3. **Register tools** using the new pattern
4. **Remove initialization code** that loads external dependencies
5. **Test** that all tools work as expected

This template prioritizes simplicity and maintainability over complex dynamic loading scenarios.
