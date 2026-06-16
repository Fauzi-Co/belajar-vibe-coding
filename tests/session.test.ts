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

describe("Session endpoints", () => {
  it("current dan logout alur lengkap", async () => {
    // registrasi
    await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Fauzi", email: "fauzi@example.com", password: "password123" }),
    });

    // login
    const loginRes = await request("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fauzi@example.com", password: "password123" }),
    });
    const loginBody = (await loginRes.json()) as { data: string };
    const token = loginBody.data;

    // current
    const cur = await request("/api/users/current", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(cur.status).toBe(200);
    const curBody = (await cur.json()) as { data: { email: string } };
    expect(curBody.data.email).toBe("fauzi@example.com");

    // logout
    const out = await request("/api/users/logout", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(out.status).toBe(200);
    const outBody = (await out.json()) as { data: string };
    expect(outBody.data).toBe("OK");

    // current setelah logout
    const cur2 = await request("/api/users/current", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(cur2.status).toBe(401);
  });
});
