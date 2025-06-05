import { z } from "zod"
import { toolRegistry } from "./registry.js"

// Example: Calculator tool
const calculatorInputSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]),
  a: z.number(),
  b: z.number(),
})

const calculatorOutputSchema = z.object({
  result: z.number(),
  operation: z.string(),
})

toolRegistry.register({
  name: "calculator",
  description: "Perform basic arithmetic operations",
  inputSchema: calculatorInputSchema,
  outputSchema: calculatorOutputSchema,
  handler: async (args) => {
    const { operation, a, b } = args
    let result: number

    switch (operation) {
      case "add":
        result = a + b
        break
      case "subtract":
        result = a - b
        break
      case "multiply":
        result = a * b
        break
      case "divide":
        if (b === 0) throw new Error("Division by zero")
        result = a / b
        break
    }

    return {
      result,
      operation: `${a} ${operation} ${b}`,
    }
  },
})

// Example: Echo tool
const echoInputSchema = z.object({
  message: z.string(),
  repeat: z.number().min(1).max(10).default(1),
})

toolRegistry.register({
  name: "echo",
  description: "Echo a message back, optionally repeated",
  inputSchema: echoInputSchema,
  handler: async (args) => {
    const { message, repeat } = args
    return Array(repeat).fill(message).join(" ")
  },
})

// Example: Current time tool
const timeInputSchema = z.object({
  timezone: z.string().optional(),
  format: z.enum(["iso", "locale", "timestamp"]).default("iso"),
})

toolRegistry.register({
  name: "current_time",
  description: "Get the current time in various formats",
  inputSchema: timeInputSchema,
  handler: async (args) => {
    const { format, timezone } = args
    const now = new Date()

    switch (format) {
      case "iso":
        return timezone ? now.toLocaleString("en-US", { timeZone: timezone }) : now.toISOString()
      case "locale":
        return timezone ? now.toLocaleString("en-US", { timeZone: timezone }) : now.toLocaleString()
      case "timestamp":
        return now.getTime().toString()
      default:
        return now.toISOString()
    }
  },
})