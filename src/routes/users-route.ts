import { Elysia } from "elysia";
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
  })
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
