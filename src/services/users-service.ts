import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

const MAX_NAME_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistrationInput(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    throw new Error("Semua field wajib diisi");
  }

  if (name.length > MAX_NAME_LENGTH) {
    throw new Error("Nama terlalu panjang (maks 255 karakter)");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Format email tidak valid");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("Panjang password minimal 8 karakter");
  }
}

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
  // Validasi input
  validateRegistrationInput(name, email, password);
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
