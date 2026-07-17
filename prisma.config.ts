import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";
import { normalizePostgresUrl } from "./src/lib/database-url";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DIRECT_URL or DATABASE_URL must be configured");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: normalizePostgresUrl(databaseUrl),
  },
});
