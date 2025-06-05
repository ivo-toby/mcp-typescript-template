import { toolRegistry } from "../tools/index.js"

export function getTools() {
  return toolRegistry.getToolsList()
}
