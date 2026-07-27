// Prisma 7 configuration file for Tracing Tiny Paws (TTP)
// Docs: https://pris.ly/d/config-datasource
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Seed command — run with: npx prisma db seed
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env[] used instead of env() so prisma generate works in CI
    // without DATABASE_URL set (env() throws on missing vars at config load time)
    url: process.env["DATABASE_URL"],
  },
});
