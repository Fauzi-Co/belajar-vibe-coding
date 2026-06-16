# belajar-vibe-coding

Proyek contoh API sederhana menggunakan Bun, Elysia, Drizzle (MySQL) dan Drizzle-kit.

**Ringkasan singkat**: aplikasi menyediakan endpoint registrasi, autentikasi, sesi (current/logout), dan utilitas sederhana untuk pengelolaan user menggunakan MySQL sebagai penyimpanan.

**Arsitektur**

- **`src/`**: kode sumber aplikasi. Entrypoint: [src/index.ts](src/index.ts).
	- **Routing**: [src/routes/users-route.ts](src/routes/users-route.ts), [src/routes/auth-route.ts](src/routes/auth-route.ts)
	- **Services / business logic**: [src/services/users-service.ts](src/services/users-service.ts), [src/services/auth-service.ts](src/services/auth-service.ts)
	- **Database**: koneksi dan instance `db` di [src/db/index.ts](src/db/index.ts); skema tabel di [src/db/schema.ts](src/db/schema.ts)

- **`tests/`**: kumpulan tes menggunakan `bun:test` (integration tests yang mengirim HTTP request ke server).
- **`drizzle/`**: folder berisi skrip SQL/migration yang dihasilkan.
- Konfigurasi Drizzle: `drizzle.config.ts`.

**API yang tersedia**

- POST `/api/users` — Registrasi pengguna
	- Body JSON: `{ "name": string, "email": string, "password": string }`
	- Respon sukses: `200 OK` `{ "data": "OK" }`
	- Error: `400` dengan pesan validasi (nama, email, password)
	- Lihat implementasi: [src/routes/users-route.ts](src/routes/users-route.ts) dan validasi di [src/services/users-service.ts](src/services/users-service.ts)

- POST `/api/login` — Login / buat session
	- Body JSON: `{ "email": string, "password": string }`
	- Respon sukses: `200 OK` `{ "data": "<token>" }` (UUID token)
	- Error: `400` jika kredensial salah
	- Implementasi: [src/routes/auth-route.ts](src/routes/auth-route.ts) dan [src/services/auth-service.ts](src/services/auth-service.ts)

- GET `/api/users/current` — Ambil user aktif berdasarkan token
	- Header: `Authorization: Bearer <token>`
	- Respon sukses: `200 OK` `{ "data": { id, name, email, created_at } }`
	- Error: `401` jika token tidak valid atau tidak ada

- DELETE `/api/users/logout` — Logout (hapus session)
	- Header: `Authorization: Bearer <token>`
	- Respon sukses: `200 OK` `{ "data": "OK" }`
	- Error: `401` jika token tidak valid

Selain itu ada beberapa route utilitas di [src/index.ts](src/index.ts) seperti `/` dan `GET /users` (debug).

**Schema Database** (lihat [src/db/schema.ts](src/db/schema.ts))

- Tabel `users`:
	- `id` INT PRIMARY KEY AUTO_INCREMENT
	- `name` VARCHAR(255) NOT NULL
	- `email` VARCHAR(255) NOT NULL UNIQUE
	- `password` VARCHAR(255) NOT NULL (tersimpan sebagai hash)
	- `created_at` TIMESTAMP DEFAULT NOW()

- Tabel `sessions`:
	- `id` INT PRIMARY KEY AUTO_INCREMENT
	- `token` VARCHAR(255) NOT NULL
	- `user_id` INT REFERENCES `users(id)`
	- `created_at` TIMESTAMP DEFAULT NOW()

**Teknologi & Library utama**

- Bun — runtime dan tooling (`bun install`, `bun test`, `bun run`).
- Elysia — web framework ringan untuk HTTP API.
- Drizzle ORM — tipe-safe query builder & schema untuk MySQL.
- drizzle-kit — CLI untuk generate/push migrations.
- mysql2 — konektor MySQL (promise API).
- bcryptjs — hashing password.
- dotenv — (dipakai bila ingin memuat `.env`).

**Persiapan & Setup**

1. Install Bun: ikuti panduan di https://bun.sh/
2. Install dependensi:

```bash
bun install
```

3. Siapkan database MySQL dan set environment variable `DATABASE_URL`. Contoh format:

```
mysql://user:password@127.0.0.1:3306/dbname
```

Contoh (POSIX):

```bash
export DATABASE_URL='mysql://user:pass@127.0.0.1:3306/belajar_vibe'
```

Contoh (PowerShell):

```powershell
$env:DATABASE_URL='mysql://user:pass@127.0.0.1:3306/belajar_vibe'
```

4. Menerapkan schema/migrasi (opsional jika sudah memiliki tabel):

```bash
# Gunakan drizzle-kit untuk push/generate jika diperlukan
bun run db:push
bun run db:generate
```

5. Jalankan aplikasi:

```bash
# mode produksi
bun run start

# mode pengembangan (hot reload)
bun run dev
```

Setelah aplikasi jalan, server default mendengarkan di `http://localhost:3000` kecuali jika `PORT` diset.

**Menjalankan Tes**

- Tes berada di folder `tests/` dan menggunakan `bun:test` (integration tests yang mengirim HTTP request ke server).
- Penting: test akan memanggil `resetDatabase()` yang menghapus data pada tabel `sessions` dan `users`. Pastikan `DATABASE_URL` menunjuk ke database test (JANGAN gunakan database produksi).

Contoh menjalankan semua tes:

```bash
export DATABASE_URL='mysql://user:pass@127.0.0.1:3306/test_db' # POSIX
# atau di PowerShell:
$env:DATABASE_URL='mysql://user:pass@127.0.0.1:3306/test_db'

bun test
```

Menjalankan satu file test:

```bash
bun test tests/users.test.ts
```

**File dan lokasi penting**

- Entrypoint: [src/index.ts](src/index.ts)
- Routes: [src/routes/users-route.ts](src/routes/users-route.ts), [src/routes/auth-route.ts](src/routes/auth-route.ts)
- Services: [src/services/users-service.ts](src/services/users-service.ts), [src/services/auth-service.ts](src/services/auth-service.ts)
- DB connection & schema: [src/db/index.ts](src/db/index.ts), [src/db/schema.ts](src/db/schema.ts)
- Tests: [tests/](tests/)

**Catatan tambahan**

- Jangan jalankan tes terhadap database produksi — tes akan menghapus data di tabel `users` dan `sessions`.


