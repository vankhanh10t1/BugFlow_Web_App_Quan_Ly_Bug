import { spawn } from "node:child_process";
import process from "node:process";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const playwrightArgs = ["playwright", "test", ...process.argv.slice(2)];
let server;

function spawnNode(args, options = {}) {
  return spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    ...options,
  });
}

async function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (server?.exitCode !== null) {
      throw new Error(`Next.js exited before ${url} became ready.`);
    }

    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // The development server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;

  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  if (server.exitCode === null) server.kill("SIGKILL");
}

async function main() {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    server = spawnNode([
      "node_modules/next/dist/bin/next",
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      port,
    ]);
    await waitForServer(`${baseURL}/login`);
  }

  const runner = spawnNode(
    ["node_modules/@playwright/test/cli.js", ...playwrightArgs.slice(1)],
    {
      env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL },
    },
  );

  const exitCode = await new Promise((resolve) => {
    runner.once("exit", (code) => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await stopServer();
    process.exit(1);
  });
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await stopServer();
}
