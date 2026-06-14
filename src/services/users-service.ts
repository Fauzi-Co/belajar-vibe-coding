import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string | Date | null;
}

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

export async function getCurrentUser(token: string): Promise<User | null> {
  const sessionList = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (sessionList.length === 0) return null;

  const session = sessionList[0];

  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (userList.length === 0) return null;

  const user = userList[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt?.toISOString?.() ?? user.createdAt,
  };
}

export async function logoutUser(token: string): Promise<string> {
  // Delete matching sessions
  await db.delete(sessions).where(eq(sessions.token, token));

  // Verify deletion
  const remaining = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (remaining.length > 0) {
    throw new Error("Unauthorized");
  }

  return "OK";
}
