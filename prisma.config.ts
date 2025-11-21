import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Set DATABASE_URL here (Prisma v7 handles it via config)
    url: env("DATABASE_URL"),
  },
  // If you also use shadow DB or other URLs, configure here similarly
  migrations: {
    path: "prisma/migrations",
  },
});
