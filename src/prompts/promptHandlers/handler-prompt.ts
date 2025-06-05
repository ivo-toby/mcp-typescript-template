import { PromptResult } from "../handlePrompt"

/**
 * Handler for exploring GraphQL schema prompt
 * @param args Optional arguments for the prompt
 * @returns Prompt result with messages
 */
export function someHandler(args?: Record<string, string>): PromptResult {
  const goal = args?.goal || "default goal"

  return {
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: "Some prompt that will help the llm",
        },
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `Some other prompt.`,
        },
      },
    ],
  }
}

/**
 * Export all GraphQL prompt handlers
 */
export const promptHandlers = {
  "some-handler": (args?: Record<string, string>) => someHandler(args),
}
