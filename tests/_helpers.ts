import { spawn, ChildProcess } from "child_process";
import { pool } from "../src/db";

let serverProcess: ChildProcess | null = null;

export async function resetDatabase() {
  // Hapus sessions dulu karena bergantung pada users
  await pool.query("DELETE FROM sessions;");
  await pool.query("DELETE FROM users;");
}

export function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (serverProcess) return resolve();
    serverProcess = spawn("bun", ["run", "src/index.ts"], {
      stdio: ["ignore", "inherit", "inherit"],
      shell: true,
    });
    serverProcess.on("error", (err) => reject(err));

    // Poll root endpoint until server responds or timeout
    const timeout = 5000;
    const start = Date.now();
    const port = process.env.PORT || "3000";

    async function waitReady() {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/`);
        if (res.ok) return resolve();
      } catch (e) {
        // ignore
      }
      if (Date.now() - start > timeout) {
        return reject(new Error("Server did not start in time"));
      }
      setTimeout(waitReady, 100);
    }

    waitReady();
  });
}

export function stopServer() {
  if (!serverProcess) return;
  try {
    serverProcess.kill();
  } catch (e) {
    // ignore
  }
  serverProcess = null;
}

export async function request(path: string, opts?: RequestInit) {
  const url = `http://127.0.0.1:${process.env.PORT || 3000}${path}`;
  return fetch(url, opts);
}
