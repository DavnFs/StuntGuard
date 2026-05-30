import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const pythonFromVenv = join(rootDir, ".venv", isWindows ? "Scripts/python.exe" : "bin/python");
const pythonCommand = existsSync(pythonFromVenv) ? pythonFromVenv : "python";
const viteScript = join(rootDir, "frontend", "node_modules", "vite", "bin", "vite.js");
const hasLocalVite = existsSync(viteScript);
const children = [];
let shuttingDown = false;
const smokeTest = process.argv.includes("--smoke");

function getRuntimeEnv() {
  const env = { PYTHONUNBUFFERED: "1" };
  for (const [key, value] of Object.entries(process.env)) {
    if (!key || key.includes("=") || value === undefined) {
      continue;
    }
    env[key] = value;
  }
  return env;
}

function writePrefixed(name, chunk) {
  const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    console.log(`[${name}] ${line}`);
  }
}

function start(name, command, args, cwd) {
  let child;
  try {
    child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: getRuntimeEnv(),
      windowsHide: true,
    });
  } catch (error) {
    console.error(`[${name}] failed to start: ${error.message}`);
    stopAll(1);
    return;
  }

  children.push(child);
  child.stdout.on("data", (chunk) => writePrefixed(name, chunk));
  child.stderr.on("data", (chunk) => writePrefixed(name, chunk));
  child.on("error", (error) => {
    if (!shuttingDown) {
      console.error(`[${name}] failed to start: ${error.message}`);
      stopAll(1);
    }
  });
  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${name}] stopped with ${signal ?? `exit code ${code}`}`);
      stopAll(code ?? 1);
    }
  });
}

function stopAll(exitCode = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  setTimeout(() => process.exit(exitCode), 300);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

console.log("Starting StuntGuard backend at http://127.0.0.1:8000");
console.log("Starting StuntGuard frontend at http://127.0.0.1:5173");

start(
  "backend",
  pythonCommand,
  ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
  join(rootDir, "backend"),
);

start(
  "frontend",
  hasLocalVite ? process.execPath : isWindows ? process.env.ComSpec || "cmd.exe" : "npm",
  hasLocalVite
    ? [viteScript, "--host", "127.0.0.1", "--port", "5173"]
    : isWindows
      ? ["/d", "/s", "/c", "npm run dev -- --host 127.0.0.1 --port 5173"]
      : ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
  join(rootDir, "frontend"),
);

if (smokeTest) {
  setTimeout(() => stopAll(0), 5000);
}
