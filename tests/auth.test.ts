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

describe("POST /api/login", () => {
  it("sukses login setelah registrasi", async () => {
    // registrasi dulu
    await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Fauzi", email: "fauzi@example.com", password: "password123" }),
    });

    const res = await request("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fauzi@example.com", password: "password123" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: string };
    expect(body.data).toBeTruthy();
  });

  it("gagal login dengan password salah", async () => {
    await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Fauzi", email: "fauzi@example.com", password: "password123" }),
    });

    const res = await request("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fauzi@example.com", password: "wrongpass" }),
    });
    expect(res.status).toBe(400);
  });
});
