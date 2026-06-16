import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

const NAME_MIN = 2;
const NAME_MAX = 255;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const EMAIL_MAX = 320;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistrationInput(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    throw new Error("Semua field wajib diisi");
  }

  if (name.length < NAME_MIN) {
    throw new Error(`Nama terlalu pendek (minimal ${NAME_MIN} karakter)`);
  }

  if (name.length > NAME_MAX) {
    throw new Error(`Nama terlalu panjang (maks ${NAME_MAX} karakter)`);
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Format email tidak valid");
  }

  if (password.length < PASSWORD_MIN) {
    throw new Error(`Panjang password minimal ${PASSWORD_MIN} karakter`);
  }

  if (password.length > PASSWORD_MAX) {
    throw new Error(`Panjang password maksimal ${PASSWORD_MAX} karakter`);
  }

  if (email.length > EMAIL_MAX) {
    throw new Error(`Email terlalu panjang (maks ${EMAIL_MAX} karakter)`);
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

/**
 * Mendaftarkan pengguna baru.
 *
 * Melakukan validasi terhadap `name`, `email`, dan `password`, memastikan
 * email belum terdaftar, melakukan hashing pada password, lalu memasukkan
 * record pengguna baru ke database.
 *
 * @param name - Nama tampilan untuk pengguna baru
 * @param email - Alamat email untuk pengguna baru
 * @param password - Password plaintext yang akan di-hash sebelum disimpan
 * @returns String "OK" saat pendaftaran berhasil
 * @throws Error jika validasi gagal atau email sudah ada
 */


export async function getCurrentUser(token: string): Promise<User | null> {
  const sessionList = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  const session = sessionList[0];
  if (!session) return null;

  const userId = session.userId;
  if (userId == null) return null;

  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userList[0];
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt?.toISOString?.() ?? user.createdAt,
  };
}

/**
 * Mengambil data pengguna yang sedang terautentikasi berdasarkan token sesi.
 *
 * Mencari sesi berdasarkan `token`, lalu mengambil record pengguna yang
 * terkait. Mengembalikan objek `User` dengan field terpilih atau `null` jika
 * sesi atau pengguna tidak ditemukan.
 *
 * @param token - Token sesi untuk mengidentifikasi sesi pengguna aktif
 * @returns Objek `User` atau `null` ketika sesi tidak valid atau kedaluwarsa
 */


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

/**
 * Mengeluarkan (logout) pengguna dengan menghapus sesi yang cocok dengan token.
 *
 * Menghapus baris sesi manapun yang memiliki `token` tersebut dan memverifikasi
 * bahwa tidak ada sesi yang tersisa. Mengembalikan "OK" saat berhasil atau
 * melempar Error jika sesi tidak dapat dihapus.
 *
 * @param token - Token sesi yang akan dihapus
 * @returns "OK" saat proses logout berhasil
 */

