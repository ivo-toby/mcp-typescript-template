import { promptRegistry } from "./registry.js"

// Example: Code review prompt
promptRegistry.register({
  name: "code_review",
  description: "Generate a code review prompt for the given code",
  arguments: [
    {
      name: "code",
      description: "The code to review",
      required: true,
    },
    {
      name: "language",
      description: "Programming language of the code",
      required: false,
    },
  ],
  handler: async (args) => {
    const code = args?.code || ""
    const language = args?.language || "unknown"

    return {
      messages: [
        {
          role: "system" as const,
          content: {
            type: "text" as const,
            text: "You are an expert code reviewer. Provide constructive feedback on code quality, best practices, potential bugs, and improvements.",
          },
        },
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Please review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
          },
        },
      ],
    }
  },
})

// Example: Documentation prompt
promptRegistry.register({
  name: "generate_docs",
  description: "Generate documentation for a function or class",
  arguments: [
    {
      name: "code",
      description: "The code to document",
      required: true,
    },
    {
      name: "style",
      description: "Documentation style (jsdoc, sphinx, etc.)",
      required: false,
    },
  ],
  handler: async (args) => {
    const code = args?.code || ""
    const style = args?.style || "standard"

    return {
      messages: [
        {
          role: "system" as const,
          content: {
            type: "text" as const,
            text: `You are a technical writer. Generate clear, comprehensive documentation in ${style} style.`,
          },
        },
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Generate documentation for this code:\n\n\`\`\`\n${code}\n\`\`\``,
          },
        },
      ],
    }
  },
})

// Example: Explain code prompt
promptRegistry.register({
  name: "explain_code",
  description: "Explain how a piece of code works",
  arguments: [
    {
      name: "code",
      description: "The code to explain",
      required: true,
    },
    {
      name: "level",
      description: "Explanation level (beginner, intermediate, advanced)",
      required: false,
    },
  ],
  handler: async (args) => {
    const code = args?.code || ""
    const level = args?.level || "intermediate"

    return {
      messages: [
        {
          role: "system" as const,
          content: {
            type: "text" as const,
            text: `You are a programming instructor. Explain code clearly for a ${level} level audience.`,
          },
        },
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Please explain how this code works:\n\n\`\`\`\n${code}\n\`\`\``,
          },
        },
      ],
    }
  },
})

// Example: Bug fix prompt
promptRegistry.register({
  name: "fix_bug",
  description: "Analyze code and suggest bug fixes",
  arguments: [
    {
      name: "code",
      description: "The buggy code to analyze",
      required: true,
    },
    {
      name: "error_message",
      description: "Error message or description of the bug",
      required: false,
    },
  ],
  handler: async (args) => {
    const code = args?.code || ""
    const errorMessage = args?.error_message || "No specific error provided"

    return {
      messages: [
        {
          role: "system" as const,
          content: {
            type: "text" as const,
            text: "You are a debugging expert. Analyze the code, identify potential issues, and provide clear solutions.",
          },
        },
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Please help fix this code. Error: ${errorMessage}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
          },
        },
      ],
    }
  },
})

// Example: Refactor prompt
promptRegistry.register({
  name: "refactor_code",
  description: "Suggest code refactoring improvements",
  arguments: [
    {
      name: "code",
      description: "The code to refactor",
      required: true,
    },
    {
      name: "focus",
      description: "Refactoring focus (performance, readability, maintainability)",
      required: false,
    },
  ],
  handler: async (args) => {
    const code = args?.code || ""
    const focus = args?.focus || "general improvement"

    return {
      messages: [
        {
          role: "system" as const,
          content: {
            type: "text" as const,
            text: `You are a code refactoring expert. Focus on ${focus} while maintaining functionality.`,
          },
        },
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Please refactor this code:\n\n\`\`\`\n${code}\n\`\`\``,
          },
        },
      ],
    }
  },
})
