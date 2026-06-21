import { Elysia, t } from "elysia";
import { loginUser } from "../services/auth-service";

export const authRoute = new Elysia({ prefix: "/api" })
  .post("/login", async ({ body, set }) => {
    try {
      const { email, password } = body;

      if (!email || !password) {
        set.status = 400;
        return { error: "Email dan Password Salah" }; // As per issue req or standard validation
      }

      const token = await loginUser(email, password);
      return { data: token };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    detail: {
      summary: "Login / Buat session",
      tags: ["Auth"]
    },
    body: t.Object({
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
