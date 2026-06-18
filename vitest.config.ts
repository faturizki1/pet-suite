import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

// Load .env.test for vitest config
const envPath = path.resolve(__dirname, ".env.test");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=");
    process.env[key] = value;
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    exclude: ["node_modules"],
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});