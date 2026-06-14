import { Elysia } from "elysia";
import { registerUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    try {
      const { name, email, password } = body as {
        name: string;
        email: string;
        password: string;
      };

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
  });
