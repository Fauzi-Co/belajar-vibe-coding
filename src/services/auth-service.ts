import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import crypto from "crypto";

export async function loginUser(email: string, password: string): Promise<string> {
  const userList = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userList.length === 0) {
    throw new Error("Email dan Password Salah");
  }

  const user = userList[0];
  const isMatch = await compare(password, user.password);

  if (!isMatch) {
    throw new Error("Email dan Password Salah");
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
}
