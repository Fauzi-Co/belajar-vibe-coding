# Issue: Implementasi Registrasi User Baru (API & Database)

## Deskripsi Task
Buatlah fitur registrasi user baru yang mencakup pembuatan tabel database `users`, logic enkripsi password menggunakan bcrypt, pembuatan service registrasi, dan pembuatan endpoint API menggunakan Elysia.js.

---

## 1. Spesifikasi Database (Tabel `users`)
Gunakan **Drizzle ORM** (dengan target database MySQL/MariaDB) untuk mendefinisikan skema tabel `users` dengan kolom-kolom berikut:

| Nama Kolom | Tipe Data | Atribut / Keterangan |
| :--- | :--- | :--- |
| `id` | Integer | Auto Increment, Primary Key |
| `name` | Varchar(255) | Not Null |
| `email` | Varchar(255) | Not Null, Unique |
| `password` | Varchar(255) | Not Null (Disimpan sebagai hash bcrypt) |
| `created_at` | Timestamp | Default: Current Timestamp (`defaultNow()`) |

---

## 2. Spesifikasi API Endpoint
### **Endpoint: `POST /api/users`**

#### **Request Body:**
Format data dikirim sebagai JSON:
```json
{
  "name": "eko",
  "email": "eko@localhost.com",
  "password": "rahasia"
}
```

#### **Response Body (Success - 200 OK / 201 Created):**
```json
{
  "data": "OK"
}
```

#### **Response Body (Error - Contoh: Email sudah terdaftar - 400 Bad Request):**
```json
{
  "error": "email sudah terdaftar"
}
```

---

## 3. Struktur Folder dan File
Struktur folder di dalam direktori `src` harus mengikuti konvensi berikut:
*   **`src/routes/`**: Berisi routing Elysia.js.
    *   File Name: `users-route.ts`
*   **`src/services/`**: Berisi logic aplikasi (database access, hashing, checks).
    *   File Name: `users-service.ts`

```text
src/
├── db/
│   ├── index.ts
│   └── schema.ts
├── routes/
│   └── users-route.ts
├── services/
│   └── users-service.ts
└── index.ts
```

---

## 4. Langkah-Langkah Implementasi

Ikuti langkah-langkah di bawah ini untuk mengimplementasikan fitur ini:

### **Langkah 1: Membuat Skema Database**
1. Buka file `src/db/schema.ts`.
2. Impor modul yang dibutuhkan dari `drizzle-orm/mysql-core` (seperti `mysqlTable`, `int`, `varchar`, `timestamp`).
3. Buat dan ekspor konstanta tabel `users` sesuai spesifikasi kolom di atas. Pastikan kolom `email` ditambahkan decorator/method `.unique()`.
4. Simpan file tersebut.

### **Langkah 2: Generate dan Push Migrasi Database**
Jalankan perintah berikut di terminal untuk memperbarui database MySQL Anda sesuai dengan skema baru:
1. Generate file migrasi:
   ```bash
   bun run db:generate
   ```
2. Terapkan (push) perubahan skema ke database:
   ```bash
   bun run db:push
   ```

### **Langkah 3: Membuat Service Registrasi (`users-service.ts`)**
1. Buat file baru di `src/services/users-service.ts`.
2. Impor `db` dari `../db` dan tabel `users` dari `../db/schema`.
3. Impor fungsi `hash` dari library `bcryptjs`.
4. Buat fungsi asynchronous bernama `registerUser(name, email, password)`.
5. **Logic Validasi Email**:
   * Cari user di database berdasarkan email yang dikirim (`db.select().from(users).where(eq(users.email, email))`).
   * Jika user ditemukan (panjang array hasil pencarian > 0), lemparkan error: `throw new Error("email sudah terdaftar")`.
6. **Logic Hashing Password**:
   * Lakukan hashing pada password menggunakan bcrypt dengan cost factor/salt rounds `10`:
     ```typescript
     const hashedPassword = await hash(password, 10);
     ```
7. **Logic Insert Data**:
   * Masukkan data user baru ke database:
     ```typescript
     await db.insert(users).values({
       name,
       email,
       password: hashedPassword
     });
     ```
8. Kembalikan nilai string `"OK"`.

### **Langkah 4: Membuat Router Elysia (`users-route.ts`)**
1. Buat file baru di `src/routes/users-route.ts`.
2. Impor `Elysia` dari `elysia` dan fungsi `registerUser` dari `../services/users-service`.
3. Buat instance Elysia baru dengan prefix `/api/users`:
   ```typescript
   export const usersRoute = new Elysia({ prefix: "/api/users" })
   ```
4. Tambahkan handler POST pada route root (`/` yang berarti `/api/users/`):
   ```typescript
   .post("/", async ({ body, set }) => {
       // logic route handler
   })
   ```
5. Di dalam route handler:
   * Ekstrak `name`, `email`, dan `password` dari `body` (lakukan parsing tipe data ke string).
   * Lakukan validasi sederhana: jika salah satu field kosong, set `set.status = 400` dan kembalikan `{ error: "Semua field wajib diisi" }`.
   * Panggil fungsi `registerUser(name, email, password)` dalam blok `try-catch`.
   * Jika sukses, kembalikan `{ data: result }` (di mana `result` bernilai `"OK"`).
   * Jika terjadi error (blok `catch`), set `set.status = 400` dan kembalikan `{ error: error.message }` (untuk menangani pesan "email sudah terdaftar").

### **Langkah 5: Mendaftarkan Router ke Main App (`index.ts`)**
1. Buka file server utama di `src/index.ts`.
2. Impor `usersRoute` dari `./routes/users-route`.
3. Registrasikan router tersebut menggunakan method `.use()` pada instance Elysia utama:
   ```typescript
   const app = new Elysia()
     // ... route lainnya ...
     .use(usersRoute)
     .listen(process.env.PORT || 3000);
   ```

### **Langkah 6: Verifikasi & Testing**
Jalankan server lokal dengan perintah:
```bash
bun run dev
```

Gunakan tools API client (Postman, Insomnia, Thunder Client, atau `curl`) untuk memverifikasi endpoint:

1. **Test Case 1: Registrasi Berhasil**
   * **Method**: `POST`
   * **URL**: `http://localhost:3000/api/users`
   * **Body (JSON)**:
     ```json
     {
       "name": "eko",
       "email": "eko@localhost.com",
       "password": "rahasia"
     }
     ```
   * **Expected Response**: Status `200 OK` atau `201 Created`, body: `{ "data": "OK" }`.

2. **Test Case 2: Registrasi dengan Email yang Sama (Error)**
   * Kirim request yang sama persis untuk kedua kalinya.
   * **Expected Response**: Status `400 Bad Request`, body: `{ "error": "email sudah terdaftar" }`.
