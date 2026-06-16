import { beforeAll, afterAll, beforeEach, describe, it, expect } from "bun:test";
import { startServer, stopServer, resetDatabase, request } from "./_helpers";

beforeAll(async () => {
  await startServer();
});

afterAll(() => {
  stopServer();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("POST /api/users - register", () => {
  it("sukses registrasi dengan payload valid", async () => {
    const res = await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Fauzi", email: "fauzi@example.com", password: "password123" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: string };
    expect(body.data).toBe("OK");
  });

  it("gagal jika field kosong", async () => {
    const res = await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "", password: "" }),
    });

    expect(res.status).toBe(400);
  });
});
