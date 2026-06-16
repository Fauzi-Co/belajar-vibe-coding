import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import crypto from "crypto";

/**
 * Melakukan autentikasi pengguna dan membuat token sesi.
 *
 * Langkah:
 * - Mencari pengguna berdasarkan `email`.
 * - Memverifikasi `password` yang diberikan terhadap hash password yang tersimpan.
 * - Jika kredensial valid, membuat baris sesi baru dengan token acak.
 * - Mengembalikan token sesi yang dibuat.
 *
 * Melempar Error dengan pesan generik jika autentikasi gagal agar tidak
 * memberitahukan apakah email atau password yang salah.
 *
 * @param email - Alamat email pengguna untuk mencari akun
 * @param password - Password plaintext yang akan diverifikasi terhadap hash
 * @returns Token sesi baru sebagai string saat autentikasi berhasil
 */
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
  if (!user) {
    throw new Error("Email dan Password Salah");
  }
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
