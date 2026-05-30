# Issue: Implementasi API Registrasi User

## Ringkasan

Implementasikan fitur registrasi user baru dengan endpoint `POST /api/users`. Password harus di-hash menggunakan **bcrypt** sebelum disimpan ke database. Jika email sudah terdaftar, kembalikan pesan error.

---

## Konteks Proyek Saat Ini

Proyek ini menggunakan tech stack berikut:
- **Runtime**: Bun
- **Framework**: Elysia.js
- **ORM**: Drizzle ORM
- **Database**: MySQL (MariaDB via XAMPP, port 3307)
- **Database Name**: `belajar_vibe_coding`

### Struktur Folder Saat Ini

```
src/
├── db/
│   ├── index.ts      ← koneksi database (JANGAN DIUBAH)
│   └── schema.ts     ← definisi tabel (PERLU DIMODIFIKASI)
└── index.ts           ← entry point Elysia (PERLU DIMODIFIKASI)
```

### File Penting yang Sudah Ada

<details>
<summary><b>src/db/schema.ts</b> (kondisi saat ini)</summary>

```typescript
import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

</details>

<details>
<summary><b>src/db/index.ts</b> (JANGAN DIUBAH)</summary>

```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const pool = mysql.createPool({
  uri: connectionString,
});

export const db = drizzle(pool, { schema, mode: "default" });
```

</details>

<details>
<summary><b>src/index.ts</b> (kondisi saat ini)</summary>

```typescript
import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";

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
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
```

</details>

<details>
<summary><b>package.json</b> (kondisi saat ini)</summary>

```json
{
  "name": "belajar-vibe-coding",
  "module": "src/index.ts",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "start": "bun run src/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "drizzle-kit": "^0.31.10"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.2",
    "elysia": "^1.4.28",
    "mysql2": "^3.22.4"
  }
}
```

</details>

---

## Spesifikasi API

### Endpoint

| Method | Path          | Deskripsi            |
|--------|---------------|----------------------|
| POST   | `/api/users`  | Registrasi user baru |

### Request Body

```json
{
    "name": "eko",
    "email": "eko@localhost.com",
    "password": "rahasia"
}
```

Semua field wajib diisi (`name`, `email`, `password`).

### Response Body — Sukses (HTTP 200)

```json
{
    "data": "OK"
}
```

### Response Body — Error: Email Duplikat (HTTP 400)

```json
{
    "error": "email sudah terdaftar"
}
```

---

## Spesifikasi Tabel Database

Tabel `users` yang sudah ada perlu ditambahkan kolom `password`:

| Kolom        | Tipe           | Constraint                         |
|-------------|----------------|------------------------------------|
| `id`        | INTEGER        | PRIMARY KEY, AUTO INCREMENT        |
| `name`      | VARCHAR(255)   | NOT NULL                           |
| `email`     | VARCHAR(255)   | NOT NULL, UNIQUE                   |
| `password`  | VARCHAR(255)   | NOT NULL _(hash bcrypt)_           |
| `created_at`| TIMESTAMP      | DEFAULT CURRENT_TIMESTAMP          |

> **Penting**: Kolom `password` menyimpan **hash bcrypt**, bukan plain text.

---

## Struktur Folder Setelah Implementasi

```
src/
├── db/
│   ├── index.ts           ← koneksi database (TIDAK BERUBAH)
│   └── schema.ts          ← ✏️ MODIFIKASI: tambah kolom password
├── routes/
│   └── users-route.ts     ← 🆕 BARU: routing endpoint user
├── services/
│   └── users-service.ts   ← 🆕 BARU: logic bisnis registrasi
└── index.ts               ← ✏️ MODIFIKASI: import & gunakan users route
```

---

## Tahapan Implementasi

> **⚠️ PENTING**: Kerjakan tahapan ini **SECARA BERURUTAN** dari Tahap 1 sampai Tahap 7. Jangan loncat ke tahap selanjutnya sebelum tahap sebelumnya selesai dan benar.

---

### Tahap 1: Install Dependency `bcryptjs`

Library `bcryptjs` digunakan untuk melakukan hashing password. Kita juga butuh type definition-nya agar TypeScript tidak error.

**Jalankan perintah ini di terminal:**

```bash
bun add bcryptjs
bun add -d @types/bcryptjs
```

**Cara verifikasi berhasil:**
- Buka `package.json`
- Pastikan `"bcryptjs"` ada di bagian `"dependencies"`
- Pastikan `"@types/bcryptjs"` ada di bagian `"devDependencies"`

---

### Tahap 2: Modifikasi Schema Database

**File:** `src/db/schema.ts`
**Aksi:** Tambahkan kolom `password` ke definisi tabel `users`

**Perubahan yang dilakukan (diff):**

```diff
 import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";
 
 export const users = mysqlTable("users", {
   id: serial("id").primaryKey(),
   name: varchar("name", { length: 255 }).notNull(),
   email: varchar("email", { length: 255 }).notNull().unique(),
+  password: varchar("password", { length: 255 }).notNull(),
   createdAt: timestamp("created_at").defaultNow(),
 });
```

**Isi lengkap file setelah dimodifikasi:**

```typescript
import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Setelah file disimpan, sync perubahan schema ke database:**

```bash
bun run db:push
```

**Cara verifikasi berhasil:**
- Perintah `db:push` tidak menampilkan error
- Kolom `password` sudah ada di tabel `users` di database

---

### Tahap 3: Buat Service — `src/services/users-service.ts`

**File:** `src/services/users-service.ts` _(file baru)_
**Aksi:** Buat folder `src/services/` lalu buat file `users-service.ts` di dalamnya

File ini berisi **logic bisnis** untuk registrasi user. Tugasnya:
1. Mengecek apakah email sudah terdaftar di database
2. Jika sudah → throw Error
3. Jika belum → hash password dengan bcrypt, lalu insert user baru

**Isi lengkap file:**

```typescript
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  // 1. Cek apakah email sudah terdaftar
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUsers.length > 0) {
    throw new Error("email sudah terdaftar");
  }

  // 2. Hash password menggunakan bcrypt (salt rounds = 10)
  const hashedPassword = await hash(password, 10);

  // 3. Insert user baru ke database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return "OK";
}
```

**Penjelasan kode:**
- `eq` dari `drizzle-orm` digunakan untuk membuat kondisi WHERE (`WHERE email = ?`)
- `hash(password, 10)` artinya hash password dengan 10 salt rounds (standar keamanan yang umum)
- Function ini me-return string `"OK"` jika berhasil, atau throw `Error` jika email sudah ada

---

### Tahap 4: Buat Route — `src/routes/users-route.ts`

**File:** `src/routes/users-route.ts` _(file baru)_
**Aksi:** Buat folder `src/routes/` lalu buat file `users-route.ts` di dalamnya

File ini berisi **definisi routing** Elysia untuk endpoint user. Tugasnya:
1. Menerima request `POST /api/users`
2. Mengambil `name`, `email`, `password` dari request body
3. Memanggil function `registerUser` dari service
4. Mengembalikan response sukses atau error

**Isi lengkap file:**

```typescript
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

      const result = await registerUser(name, email, password);

      return { data: result };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
```

**Penjelasan kode:**
- `new Elysia({ prefix: "/api/users" })` artinya semua route di dalam instance ini akan dimulai dengan `/api/users`
- `.post("/", ...)` artinya endpoint `POST /api/users/` → menjadi `POST /api/users`
- `body as { ... }` adalah type assertion agar TypeScript tahu struktur body
- `set.status = 400` mengatur HTTP status code menjadi 400 (Bad Request) saat error
- Block `try-catch` menangkap Error yang di-throw oleh `registerUser`

---

### Tahap 5: Modifikasi Entry Point

**File:** `src/index.ts`
**Aksi:** Import dan gunakan route baru di aplikasi Elysia

**Perubahan yang dilakukan (diff):**

```diff
 import { Elysia } from "elysia";
 import { db } from "./db";
 import { users } from "./db/schema";
+import { usersRoute } from "./routes/users-route";
 
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
+  .use(usersRoute)
   .listen(process.env.PORT || 3000);
```

**Isi lengkap file setelah dimodifikasi:**

```typescript
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
```

**Penjelasan perubahan:**
- Baris `import { usersRoute }` mengimpor route yang kita buat di Tahap 4
- `.use(usersRoute)` mendaftarkan route tersebut ke aplikasi Elysia
- Letakkan `.use(usersRoute)` **sebelum** `.listen()`

---

### Tahap 6: Update File `.env`

**File:** `.env`
**Aksi:** Sesuaikan `DATABASE_URL` dengan konfigurasi MySQL lokal (port 3307, tanpa password)

**Kondisi saat ini:**

```
DATABASE_URL="mysql://root:password@127.0.0.1:3306/belajar_vibe_coding"
PORT=3000
```

**Ubah menjadi:**

```
DATABASE_URL="mysql://root@127.0.0.1:3307/belajar_vibe_coding"
PORT=3000
```

> **Catatan:** Sesuaikan username, password, dan port MySQL dengan konfigurasi di komputer kamu. Contoh di atas menggunakan user `root` tanpa password pada port `3307`.

---

### Tahap 7: Testing

#### 7.1 Jalankan Server

```bash
bun run dev
```

Pastikan muncul pesan:
```
🦊 Elysia is running at http://localhost:3000
```

Jika ada error, baca pesan error-nya dan perbaiki sebelum lanjut.

#### 7.2 Test Registrasi User Baru (Harus Sukses)

Buka terminal baru, lalu jalankan:

```bash
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d "{\"name\": \"eko\", \"email\": \"eko@localhost.com\", \"password\": \"rahasia\"}"
```

**Response yang diharapkan:**

```json
{"data":"OK"}
```

✅ Jika response seperti di atas, registrasi berhasil.

#### 7.3 Test Email Duplikat (Harus Error)

Jalankan perintah curl yang **sama persis** seperti 7.2 sekali lagi:

```bash
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d "{\"name\": \"eko\", \"email\": \"eko@localhost.com\", \"password\": \"rahasia\"}"
```

**Response yang diharapkan:**

```json
{"error":"email sudah terdaftar"}
```

✅ Jika response seperti di atas, validasi email duplikat berfungsi.

#### 7.4 Verifikasi Data di Database

Jalankan perintah berikut untuk melihat data di tabel `users`:

```bash
mysql -u root -P 3307 -h 127.0.0.1 belajar_vibe_coding -e "SELECT id, name, email, LEFT(password, 30) AS password_preview, created_at FROM users;"
```

**Yang harus dicek:**
- ✅ Data user `eko` tersimpan di database
- ✅ Kolom `password` berisi hash bcrypt (dimulai dengan `$2a$` atau `$2b$`), **BUKAN** plain text `"rahasia"`
- ✅ Kolom `created_at` terisi otomatis

---

## Checklist Akhir

Centang semua item berikut sebelum dianggap selesai:

- [ ] Library `bcryptjs` terinstall di `dependencies`
- [ ] Library `@types/bcryptjs` terinstall di `devDependencies`
- [ ] Kolom `password` sudah ditambahkan di `src/db/schema.ts`
- [ ] `bun run db:push` berhasil tanpa error
- [ ] File `src/services/users-service.ts` sudah dibuat dan berisi logic registrasi
- [ ] File `src/routes/users-route.ts` sudah dibuat dan berisi routing `POST /`
- [ ] File `src/index.ts` sudah ditambah import `usersRoute` dan `.use(usersRoute)`
- [ ] File `.env` sudah mengarah ke MySQL yang benar (port 3307)
- [ ] Server bisa berjalan tanpa error (`bun run dev`)
- [ ] Test registrasi sukses → response `{"data":"OK"}`
- [ ] Test email duplikat → response `{"error":"email sudah terdaftar"}`
- [ ] Password tersimpan sebagai hash bcrypt di database (bukan plain text)
