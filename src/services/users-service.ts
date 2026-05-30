import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUsers.length > 0) {
    throw new Error("email sudah terdaftar");
  }

  const hashedPassword = await hash(password, 10);

  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return "OK";
}
