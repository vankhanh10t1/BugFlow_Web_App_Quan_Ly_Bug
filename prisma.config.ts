import { loadEnvConfig } from "@next/env";
import { defineConfig, env } from "prisma/config";
import { normalizePostgresUrl } from "./src/lib/database-url";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: normalizePostgresUrl(env("DIRECT_URL")),
  },
});
