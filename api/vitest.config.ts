import { defineConfig } from "vitest/config";

// The source uses NodeNext-style ".js" extensions on relative imports (so the
// compiled ESM resolves at runtime). Vite/Vitest don't map ".js"→".ts" by
// default, so this pre-resolver strips the extension and lets Vite find the .ts.
export default defineConfig({
  plugins: [
    {
      name: "strip-js-ext",
      enforce: "pre",
      async resolveId(source, importer) {
        if (importer && source.startsWith(".") && source.endsWith(".js")) {
          const resolved = await this.resolve(source.replace(/\.js$/, ""), importer, {
            skipSelf: true,
          });
          if (resolved) return resolved;
        }
        return null;
      },
    },
  ],
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: { LOG_LEVEL: "silent" },
  },
});
