import { Elysia } from "elysia";
import { loginUser } from "../services/auth-service";

export const authRoute = new Elysia({ prefix: "/api" })
  .post("/login", async ({ body, set }) => {
    try {
      const { email, password } = body as {
        email?: string;
        password?: string;
      };

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
  });
