import { Elysia, t } from "elysia";
import { registerUser, getCurrentUser, logoutUser } from "../services/users-service";
import { extractBearerToken, isUuid } from "../utils/auth";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .get("/current", async ({ request, set }) => {
    try {
      const token = extractBearerToken(request);
      if (!token || !isUuid(token)) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const user = await getCurrentUser(token);

      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      return { data: user };
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  }, {
    detail: {
      summary: "Ambil user aktif berdasarkan token",
      tags: ["User"]
    },
    headers: t.Object({
      authorization: t.Optional(t.String({ description: "Bearer <token>" }))
    }),
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Numeric(),
          name: t.String(),
          email: t.String(),
          created_at: t.Any()
        })
      }),
      401: t.Object({
        error: t.String()
      })
    }
  })
  .delete("/logout", async ({ request, set }) => {
    try {
      const token = extractBearerToken(request);
      if (!token || !isUuid(token)) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const result = await logoutUser(token);
      return { data: result };
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  }, {
    detail: {
      summary: "Logout (hapus session)",
      tags: ["User"]
    },
    headers: t.Object({
      authorization: t.Optional(t.String({ description: "Bearer <token>" }))
    }),
    response: {
      200: t.Object({
        data: t.String()
      }),
      401: t.Object({
        error: t.String()
      })
    }
  })
  .post("/", async ({ body, set }) => {
    try {
      const { name, email, password } = body;

      if (!name || !email || !password) {
        set.status = 400;
        return { error: "Semua field wajib diisi" };
      }

      const result = await registerUser(name, email, password);

      return { data: result };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    detail: {
      summary: "Registrasi pengguna baru",
      tags: ["User"]
    },
    body: t.Object({
      name: t.String({ description: "Nama pengguna" }),
      email: t.String({ description: "Email pengguna" }),
      password: t.String({ description: "Password pengguna" })
    }),
    response: {
      200: t.Object({
        data: t.String()
      }),
      400: t.Object({
        error: t.String()
      })
    }
  });
