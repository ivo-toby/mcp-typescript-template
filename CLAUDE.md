# Contentful GraphQL MCP - Development Guide

## Common Commands

- Build: `npm run build`
- Type Check: `npm run typecheck`
- Lint: `npm run lint`
- Run Tests: `npm test`
- Run Single Test: `npx vitest run test/path/to/test.test.ts`
- Run Tests in Watch Mode: `npm run test:watch`
- Dev Mode (watch & rebuild): `npm run dev`

## Code Style Guidelines

- **Formatting**: Uses Prettier with 100 char width, no semicolons, double quotes
- **TypeScript**: Use strict typing, avoid `any` when possible
- **Imports**: Order from external to internal, group related imports
- **Naming**: Use camelCase for variables/functions, PascalCase for types/interfaces
- **Error Handling**: Always handle errors in async functions with try/catch blocks
- **Documentation**: Add JSDoc style comments for functions and interfaces

## Entity Structure

- Each handler should focus on a single responsibility

## Testing

Tests use Vitest with a lightweight unit testing approach. Current test structure:

- `test/unit/` - Lightweight unit tests for public API functions

Focus on testing behavior, not implementation details. See `test/README.md` for detailed testing guidelines.

## Context

This is a MCP Server that enables LLM's to connect to Contentful GraphQL Endpoint.
