import { ChildProcess, spawn } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "node:module";
const __dirname = dirname(fileURLToPath(import.meta.url));

const entry = resolve(__dirname, "main.tsx");
const RESTART_CODE = 69;

let child: ChildProcess;

function start() {
  child = spawn(
    process.execPath,
    ["--import", "tsx", "--import", `./zeyah-bot/importer-1.mjs`, entry],
    {
      stdio: "inherit",
    },
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`Bot terminated by signal: ${signal}`);
      process.exit(0);
    }

    if (code === RESTART_CODE) {
      console.log("Restart signal received. Rebooting...");
      setTimeout(start, 1000);
      return;
    }

    console.log(`Bot exited with code ${code}. Not restarting.`);
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error("Spawn error:", err);
    process.exit(1);
  });
}

process.on("SIGINT", () => {
  child?.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child?.kill("SIGTERM");
});

start();
