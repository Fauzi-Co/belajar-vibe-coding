import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .get("/", () => ({
    status: "ok",
    message: "Bun + Elysia + Drizzle + MySQL server is up and running!",
    timestamp: new Date().toISOString()
  }))
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return { success: true, data: allUsers };
    } catch (error: any) {
      return { 
        success: false, 
        message: "Database connection failed or table does not exist. Make sure your MySQL database is running and credentials in .env are correct.",
        error: error.message 
      };
    }
  })
  .use(usersRoute)
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
