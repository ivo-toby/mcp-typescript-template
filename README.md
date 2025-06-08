# MCP Server Template

A production-ready, well-structured template for building [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers with TypeScript. This template provides a clean, maintainable foundation for creating MCP servers that can expose tools, prompts, and resources to AI applications.

## What is this template for?

This template is designed for developers who want to:

- **Build MCP servers quickly** with a proven, well-structured foundation
- **Follow MCP best practices** with a fully compliant implementation
- **Create maintainable code** with clean abstractions and TypeScript safety
- **Support multiple transports** (stdio and HTTP) out of the box
- **Scale their implementation** with modular, registry-based architecture

## Who should use this?

- **AI application developers** building integrations with external data sources and tools
- **Enterprise developers** creating internal MCP servers for company data and workflows
- **Open source contributors** building MCP servers for the community
- **Developers new to MCP** who want to learn best practices from a reference implementation

## Features

- ✅ **Full MCP Compliance**: Implements the complete MCP specification
- ✅ **Dual Transport Support**: Both stdio and HTTP transports included
- ✅ **Type Safety**: Full TypeScript with strict mode and Zod validation
- ✅ **Clean Architecture**: Modular design with clear separation of concerns
- ✅ **Registry Pattern**: Easy registration of tools, prompts, and resources
- ✅ **Production Ready**: Comprehensive error handling, rate limiting, timeouts, and graceful shutdown
- ✅ **Developer Experience**: Hot reload, linting, and comprehensive tooling
- ✅ **Extensible**: Easy to add new capabilities without breaking existing code

## Quick Start

### 1. Installation

```bash
# Clone or use this template
git clone <repository-url>
cd mcp-server-template

# Install dependencies
npm install
```

### 2. Build and Run

```bash
# Build the server
npm run build

# Run with stdio transport (default)
npm start

# Or run with HTTP transport
npm start -- --enable-http --http-port 3000
```

### 3. Test the Server

```bash
# Test with the MCP inspector
npm run inspect

# Or test HTTP endpoint
curl http://localhost:3000/health
```

## Architecture

This template is designed with a clean, modular architecture to promote maintainability and extensibility. Here's a high-level overview of the key components:

### Core Components

- **`src/index.ts`**: The main entry point of the server. It reads the configuration and initializes the appropriate transport.
- **`src/config.ts`**: Centralized configuration management using `zod`. All environment variables are defined and validated in this file, providing a single source of truth for configuration.
- **`src/transports`**: This directory contains the transport implementations. The template includes both `stdio` and `streamable-http` transports. The `streamable-http` transport is a robust implementation that includes session management, rate limiting, and other production-ready features.
- **`src/tools`**, **`src/prompts`**, **`src/resources`**: These directories contain the registries for tools, prompts, and resources. The registry pattern makes it easy to add new capabilities to the server by simply creating a new file and registering the new tool, prompt, or resource.

### Session Management

Session management is handled directly within the `StreamableHttpServer` class. This simplifies the architecture and removes the need for a separate session handler. The `StreamableHttpServer` is responsible for:

- Creating new sessions
- Cleaning up sessions on timeout or disconnection
- Enforcing session limits
- Providing session-related health check information

### Error Handling

The template includes a comprehensive error handling system. All errors are normalized to a common format and include a unique error code, making it easy to debug and handle errors in a consistent way. The `src/types/errors.ts` file contains the definitions for all custom error types.

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── config.ts             # Centralized configuration management
├── transports/           # Transport layer implementations
│   ├── base.ts          # Abstract base class for transports
│   ├── stdio.ts         # Stdio transport implementation
│   └── streamable-http.ts # HTTP transport implementation
├── tools/               # Tool definitions and registry
│   ├── registry.ts      # Tool registry and type definitions
│   ├── examples.ts      # Example tool implementations
│   └── index.ts         # Tool exports
├── prompts/             # Prompt definitions and registry
│   ├── registry.ts      # Prompt registry and type definitions
│   ├── examples.ts      # Example prompt implementations
│   └── index.ts         # Prompt exports
├── resources/           # Resource definitions and registry
│   ├── registry.ts      # Resource registry and type definitions
│   ├── examples.ts      # Example resource implementations
│   └── index.ts         # Resource exports
├── utils/               # Utility functions and server factory
├── types/               # Additional type definitions
└── bin/                 # CLI entry point with argument parsing
```

## Creating Your First Tool

Tools are functions that AI models can call to perform actions. Here's how to create one:

```typescript
// src/tools/my-tools.ts
import { z } from "zod"
import { toolRegistry } from "./registry.js"

// Define input validation schema
const weatherInputSchema = z.object({
  location: z.string().describe("The city or location to get weather for"),
  units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
})

// Register the tool
toolRegistry.register({
  name: "get_weather",
  description: "Get current weather information for a location",
  inputSchema: weatherInputSchema,
  handler: async (args) => {
    const { location, units } = args

    // Your implementation here
    const weatherData = await fetchWeatherData(location, units)

    return {
      temperature: weatherData.temp,
      condition: weatherData.condition,
      location: location,
    }
  },
})
```

Then import your tools in `src/tools/index.ts`:

```typescript
import "./examples.js"
import "./my-tools.js" // Add this line

export { toolRegistry } from "./registry.js"
```

## Creating Prompts

Prompts are templates that help users interact with AI models:

```typescript
// src/prompts/my-prompts.ts
import { promptRegistry } from "./registry.js"

promptRegistry.register({
  name: "code_review",
  description: "Generate a comprehensive code review prompt",
  arguments: [
    {
      name: "code",
      description: "The code to review",
      required: true,
    },
    {
      name: "language",
      description: "Programming language",
      required: false,
    },
  ],
  handler: async (args) => {
    const code = args?.code || ""
    const language = args?.language || "unknown"

    return {
      messages: [
        {
          role: "system",
          content: {
            type: "text",
            text: "You are an expert code reviewer. Provide constructive feedback focusing on best practices, potential bugs, and improvements.",
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: `Please review this ${language} code:\n\n${code}`,
          },
        },
      ],
    }
  },
})
```

## Creating Resources

Resources provide contextual data that AI models can access:

```typescript
// src/resources/my-resources.ts
import { resourceRegistry } from "./registry.js"

resourceRegistry.register({
  uri: "file://project-docs",
  name: "Project Documentation",
  description: "Access to project documentation and guides",
  mimeType: "text/markdown",
  handler: async () => {
    const docs = await loadProjectDocumentation()

    return {
      contents: [
        {
          uri: "file://project-docs",
          mimeType: "text/markdown",
          text: docs,
        },
      ],
    }
  },
})
```

## Error Handling

This template includes comprehensive error handling for production use:

### Error Types

```typescript
import { ToolError, ErrorCode } from "./types/errors.js"

// Throw specific error types
throw new ToolError(ErrorCode.TOOL_NOT_FOUND, "Tool 'example' not found", {
  toolName: "example",
  availableTools: ["tool1", "tool2"],
})
```

### HTTP Transport Features

- **Rate Limiting**: Configurable per-IP rate limiting
- **Request Timeouts**: Automatic timeout handling
- **Session Management**: Automatic session cleanup and limits
- **Request Size Limits**: Configurable payload size limits
- **Graceful Shutdown**: Proper cleanup of all resources

```typescript
// Configure HTTP transport with error handling
const server = new StreamableHttpServer({
  port: 3000,
  rateLimitConfig: {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  requestTimeoutMs: 30000, // 30 second timeout
})
```

### Error Monitoring

The server provides detailed error information:

- **Structured Error Codes**: Consistent error categorization
- **Error Context**: Additional details for debugging
- **Request Tracing**: Optional request/response logging
- **Health Endpoints**: Monitor server and session status

## Transport Options

### Stdio Transport (Default)

Perfect for local development and integration with MCP clients:

```bash
npm start
```

### HTTP Transport

Ideal for remote access and web-based integrations:

```bash
npm start -- --enable-http --http-port 3000
```

The HTTP transport includes:

- Session management
- CORS support
- Health check endpoint (`/health`)
- Graceful shutdown

## Development Workflow

```bash
# Development with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test
npm run test:watch

# Building
npm run build
npm run clean  # Clean build artifacts
```

## Configuration

### Environment Variables

```bash
# HTTP Transport
ENABLE_HTTP_SERVER=true
HTTP_PORT=3000
HTTP_HOST=localhost

# Add your own environment variables as needed
MY_API_KEY=your-api-key
DATABASE_URL=your-database-url
```

### CLI Arguments

```bash
# HTTP configuration
--enable-http              # Enable HTTP transport
--http-port 3000          # Set HTTP port
--http-host localhost     # Set HTTP host

# Custom arguments (extend in bin/mcp-server.js)
--example-variable value  # Example custom argument
```

## Best Practices

### 1. Tool Design

- **Single Responsibility**: Each tool should do one thing well
- **Input Validation**: Always use Zod schemas for type safety
- **Error Handling**: Provide clear, actionable error messages
- **Documentation**: Use descriptive names and descriptions

### 2. Code Organization

- **Modular Structure**: Keep related functionality together
- **Type Safety**: Leverage TypeScript's strict mode
- **Clean Code**: Follow the established patterns in the template
- **Testing**: Write tests for your tools and handlers

### 3. Performance

- **Async Operations**: Use async/await for I/O operations
- **Resource Management**: Clean up resources properly
- **Caching**: Cache expensive operations when appropriate
- **Error Recovery**: Handle failures gracefully

## Deployment

### Local Development

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t my-mcp-server .
docker run -p 3000:3000 my-mcp-server --enable-http
```

### Production

- Use process managers like PM2 or systemd
- Set up proper logging and monitoring
- Configure environment variables securely
- Use HTTPS for HTTP transport in production

## Examples and Use Cases

This template includes examples for:

- **Calculator Tool**: Basic arithmetic operations
- **Echo Tool**: Message processing and repetition
- **Time Tool**: Current time in various formats
- **Code Review Prompt**: Structured code review templates
- **Documentation Resources**: Access to project documentation

Common use cases for MCP servers:

- **Database Integration**: Query and update databases
- **API Wrappers**: Integrate with external APIs
- **File System Access**: Read and write files
- **Development Tools**: Code analysis, testing, deployment
- **Business Logic**: Custom workflows and processes

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure TypeScript and dependencies are up to date
2. **Transport Issues**: Check port availability and firewall settings
3. **Tool Registration**: Verify tools are imported in index files
4. **Type Errors**: Use proper Zod schemas and TypeScript types

### Debug Mode

```bash
# Enable debug logging
DEBUG=mcp:* npm start

# Inspect server capabilities
npm run inspect
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://modelcontextprotocol.io/specification)
- [Example MCP Servers](https://github.com/modelcontextprotocol/servers)
