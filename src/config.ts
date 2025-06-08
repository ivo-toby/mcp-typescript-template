import { z } from "zod"
import dotenv from "dotenv"

dotenv.config()

const configSchema = z.object({
  ENABLE_HTTP_SERVER: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  HTTP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("3000"),
  HTTP_HOST: z.string().default("localhost"),
})

export const config = configSchema.parse(process.env)
