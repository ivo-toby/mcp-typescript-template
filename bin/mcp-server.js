#!/usr/bin/env node
/* eslint-disable no-undef */

async function main() {
  // Find the delivery token argument
  const exampleVariable = process.argv.findIndex((arg) => arg === "--example-variable")
  if (exampleVariable !== -1 && process.argv[exampleVariable + 1]) {
    process.env.EXAMPLE_VARIABLE = process.argv[exampleVariable + 1]
  }

  // Import and run the bundled server after env var is set
  await import("../dist/bundle.js")
}

main().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})
