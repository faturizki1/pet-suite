# ARSITEKTUR PLATFORM KLINIK HEWAN — SUMBER KEBENARAN MUTLAK

---

## IDENTITAS PLATFORM

```
Nama         : VetCare Platform
Versi        : 1.0.0
Stack        : Next.js 14 + TypeScript + PostgreSQL + Drizzle ORM + TailwindCSS + shadcn/ui
Runtime      : Node.js 20 LTS
Package Mgr  : npm
Repo         : GitHub (monorepo)
Deploy       : Self-host via Coolify
Database     : PostgreSQL (Coolify managed service)
Storage      : MinIO (Coolify managed service, S3-compatible)
Auth         : Custom (bcrypt + JWT httpOnly cookie, tanpa refresh token)
Environment  : development | production
Target Server: 1-2 vCPU, 2-4GB RAM
```

---

## PRINSIP ARSITEKTUR

```
1.  Server First       → semua komponen server component by default
2.  Type Safe          → TypeScript strict, tidak ada 'any'
3.  Atomic Transaction  → operasi multi-tabel dalam satu DB transaction (Drizzle tx)
4.  Role Based Access  → setiap layer wajib cek role (middleware + API)
5.  Fail Fast          → validasi input di edge sebelum masuk business logic
6.  Single Source      → satu schema Zod = satu validasi untuk FE dan BE
7.  Snapshot Harga     → harga item selalu disalin ke transaction_items
8.  Soft Delete        → data tidak pernah dihapus fisik kecuali expenses
9.  Audit Trail        → semua mutasi stok dan transaksi tercatat permanen
10. Mobile First        → UI responsive, POS minimal 1024px
11. Self-Contained      → tidak ada dependency ke layanan cloud pihak ketiga
12. Re-check Sensitif   → endpoint kritis selalu re-validasi is_active dari DB
                          saat itu juga, tidak cukup percaya payload token
```

---

## STRUKTUR DIREKTORI LENGKAP

```
vetcare-platform/
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (public)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── layanan/
│   │   │   │   └── page.tsx
│   │   │   ├── dokter/
│   │   │   │   └── page.tsx
│   │   │   └── booking/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── owner/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── users/[id]/page.tsx
│   │   │   │   ├── laporan/page.tsx
│   │   │   │   ├── hewan/page.tsx
│   │   │   │   ├── appointment/page.tsx
│   │   │   │   ├── rawat-inap/page.tsx
│   │   │   │   ├── booking/page.tsx
│   │   │   │   ├── booking/slots/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── dokter/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── appointment/page.tsx
│   │   │   │   ├── rekam-medis/page.tsx
│   │   │   │   ├── rekam-medis/[id]/page.tsx
│   │   │   │   ├── rawat-inap/page.tsx
│   │   │   │   ├── rawat-inap/[id]/page.tsx
│   │   │   │   └── hewan/page.tsx
│   │   │   ├── staff/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── pos/page.tsx
│   │   │   │   ├── inventory/page.tsx
│   │   │   │   ├── appointment/page.tsx
│   │   │   │   ├── rawat-inap/page.tsx
│   │   │   │   ├── rawat-inap/[id]/page.tsx
│   │   │   │   ├── pengeluaran/page.tsx
│   │   │   │   └── booking/page.tsx
│   │   │   └── customer/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── hewan/page.tsx
│   │   │       ├── hewan/[id]/page.tsx
│   │   │       ├── rekam-medis/page.tsx
│   │   │       └── monitoring/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── users/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── pets/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── [id]/vaccines/route.ts
│   │       ├── appointments/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── medical-records/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── inpatients/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── [id]/logs/route.ts
│   │       ├── pos/
│   │       │   ├── catalog/route.ts
│   │       │   └── transactions/
│   │       │       ├── route.ts
│   │       │       └── [id]/route.ts
│   │       ├── inventory/
│   │       │   ├── products/route.ts
│   │       │   ├── products/[id]/route.ts
│   │       │   ├── products/[id]/stock/route.ts
│   │       │   ├── mutations/route.ts
│   │       │   ├── services/route.ts
│   │       │   ├── services/[id]/route.ts
│   │       │   ├── categories/route.ts
│   │       │   └── categories/[id]/route.ts
│   │       ├── expenses/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── reports/
│   │       │   ├── summary/route.ts
│   │       │   ├── revenue/route.ts
│   │       │   ├── breakdown/route.ts
│   │       │   ├── top-products/route.ts
│   │       │   ├── payment-methods/route.ts
│   │       │   ├── transactions/route.ts
│   │       │   ├── stock-alert/route.ts
│   │       │   └── doctors/route.ts
│   │       ├── booking/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   ├── list/route.ts
│   │       │   └── slots/
│   │       │       ├── route.ts
│   │       │       └── [id]/route.ts
│   │       ├── upload/
│   │       │   └── route.ts
│   │       └── settings/
│   │           └── clinic/route.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── button.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── image-upload.tsx
│   │   │   ├── date-range-picker.tsx
│   │   │   └── print-wrapper.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── topbar.tsx
│   │   ├── modules/
│   │   │   ├── pos/
│   │   │   │   ├── catalog-grid.tsx
│   │   │   │   ├── cart.tsx
│   │   │   │   ├── payment-modal.tsx
│   │   │   │   └── receipt.tsx
│   │   │   ├── klinik/
│   │   │   │   ├── medical-record-form.tsx
│   │   │   │   ├── medical-record-detail.tsx
│   │   │   │   ├── inpatient-card.tsx
│   │   │   │   ├── monitoring-timeline.tsx
│   │   │   │   └── monitoring-log-form.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── product-form.tsx
│   │   │   │   ├── stock-mutation-form.tsx
│   │   │   │   └── mutation-table.tsx
│   │   │   ├── laporan/
│   │   │   │   ├── summary-cards.tsx
│   │   │   │   ├── revenue-chart.tsx
│   │   │   │   ├── breakdown-chart.tsx
│   │   │   │   ├── top-products-chart.tsx
│   │   │   │   └── payment-pie-chart.tsx
│   │   │   └── booking/
│   │   │       ├── slot-grid.tsx
│   │   │       ├── booking-form.tsx
│   │   │       └── booking-table.tsx
│   │   └── shared/
│   │       ├── pet-search.tsx
│   │       ├── customer-search.tsx
│   │       ├── dokter-select.tsx
│   │       └── status-badge.tsx
│   ├── db/
│   │   ├── schema.ts
│   │   ├── client.ts
│   │   ├── migrate.ts
│   │   └── seed.ts
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   ├── password.ts
│   │   │   └── guard.ts
│   │   ├── storage/
│   │   │   └── client.ts
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   ├── validations/
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── pet.ts
│   │   │   ├── appointment.ts
│   │   │   ├── medical-record.ts
│   │   │   ├── inpatient.ts
│   │   │   ├── pos.ts
│   │   │   ├── inventory.ts
│   │   │   ├── expense.ts
│   │   │   ├── booking.ts
│   │   │   └── settings.ts
│   │   └── utils/
│   │       ├── invoice.ts
│   │       ├── report.ts
│   │       ├── upload.ts
│   │       ├── format.ts
│   │       └── csv-export.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-pos.ts
│   │   ├── use-upload.ts
│   │   └── use-print.ts
│   └── middleware.ts
├── drizzle/
│   ├── meta/
│   └── (file migrasi auto generate)
├── drizzle.config.ts
├── Dockerfile
├── .dockerignore
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## DATABASE SCHEMA LENGKAP

Catatan: skema didefinisikan sebagai Drizzle schema (`src/db/schema.ts`), ditulis di sini dalam bentuk SQL untuk kemudahan baca. Tidak ada skema `auth.*` karena auth ditangani sepenuhnya oleh aplikasi sendiri.

```sql
-- ============================================
-- TABLE: profiles (root tabel user, gabung auth + profile)
-- ============================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('owner','dokter','staff','customer')),
  nama_lengkap    TEXT NOT NULL,
  no_hp           TEXT,
  alamat          TEXT,
  foto_profil     TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: dokter_profiles
-- ============================================
CREATE TABLE dokter_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  no_str          TEXT,
  spesialisasi    TEXT,
  bio             TEXT,
  jadwal_praktik  JSONB DEFAULT '[]',
  -- [{ hari: "Senin", jam_mulai: "08:00", jam_selesai: "16:00" }]
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: pets
-- ============================================
CREATE TABLE pets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  nama            TEXT NOT NULL,
  spesies         TEXT NOT NULL,
  ras             TEXT,
  jenis_kelamin   TEXT CHECK (jenis_kelamin IN ('jantan','betina')),
  tgl_lahir       DATE,
  berat_kg        NUMERIC(5,2),
  warna           TEXT,
  ciri_khas       TEXT,
  foto            TEXT,
  status          TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','meninggal')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: pet_vaccines
-- ============================================
CREATE TABLE pet_vaccines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pets ON DELETE CASCADE,
  nama_vaksin     TEXT NOT NULL,
  tgl_vaksin      DATE NOT NULL,
  tgl_berikutnya  DATE,
  dokter_id       UUID REFERENCES profiles,
  keterangan      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: categories
-- ============================================
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            TEXT NOT NULL,
  tipe            TEXT CHECK (tipe IN ('produk','layanan'))
);

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES categories,
  kode_produk     TEXT UNIQUE NOT NULL,
  nama            TEXT NOT NULL,
  deskripsi       TEXT,
  foto            TEXT,
  harga_beli      NUMERIC(12,2) DEFAULT 0,
  harga_jual      NUMERIC(12,2) NOT NULL,
  stok            INTEGER DEFAULT 0 CHECK (stok >= 0),
  stok_minimum    INTEGER DEFAULT 5,
  satuan          TEXT DEFAULT 'pcs',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: services
-- ============================================
CREATE TABLE services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES categories,
  nama            TEXT NOT NULL,
  deskripsi       TEXT,
  harga           NUMERIC(12,2) NOT NULL,
  durasi_menit    INTEGER,
  dokter_required BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE: appointments
-- ============================================
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pets,
  dokter_id       UUID REFERENCES profiles,
  customer_id     UUID NOT NULL REFERENCES profiles,
  tgl_janji       TIMESTAMPTZ NOT NULL,
  jenis           TEXT CHECK (jenis IN ('konsultasi','grooming','operasi','vaksin','lainnya')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','konfirmasi','selesai','batal')),
  keluhan         TEXT,
  catatan_staff   TEXT,
  sumber          TEXT DEFAULT 'langsung' CHECK (sumber IN ('langsung','online')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: medical_records
-- ============================================
CREATE TABLE medical_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id              UUID NOT NULL REFERENCES pets,
  dokter_id           UUID NOT NULL REFERENCES profiles,
  appointment_id      UUID REFERENCES appointments,
  tanggal             TIMESTAMPTZ DEFAULT NOW(),
  berat_saat_periksa  NUMERIC(5,2),
  suhu                NUMERIC(4,1),
  keluhan             TEXT,
  anamnesis           TEXT,
  diagnosis           TEXT NOT NULL,
  tindakan            TEXT,
  resep               JSONB,
  -- resep: [{ nama_obat, dosis, frekuensi, durasi, qty, aturan_pakai }]
  catatan_followup    TEXT,
  is_visible_customer BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: inpatients
-- ============================================
CREATE TABLE inpatients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id              UUID NOT NULL REFERENCES pets,
  dokter_id           UUID NOT NULL REFERENCES profiles,
  medical_record_id   UUID REFERENCES medical_records,
  no_kandang          TEXT NOT NULL,
  tgl_masuk           TIMESTAMPTZ DEFAULT NOW(),
  tgl_keluar          TIMESTAMPTZ,
  diagnosis_awal      TEXT,
  tindakan_awal       TEXT,
  status              TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','sembuh','dirujuk','meninggal')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: inpatient_logs
-- ============================================
CREATE TABLE inpatient_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inpatient_id        UUID NOT NULL REFERENCES inpatients ON DELETE CASCADE,
  staff_id            UUID NOT NULL REFERENCES profiles,
  timestamp           TIMESTAMPTZ DEFAULT NOW(),
  kondisi             TEXT CHECK (kondisi IN ('kritis','lemah','stabil','baik','sangat_baik')),
  berat               NUMERIC(5,2),
  suhu                NUMERIC(4,1),
  nafsu_makan         TEXT CHECK (nafsu_makan IN ('tidak_mau','sedikit','normal','lahap')),
  catatan_kondisi     TEXT,
  tindakan_hari_ini   TEXT,
  obat_hari_ini       TEXT,
  foto_urls           JSONB DEFAULT '[]',
  -- foto_urls: ["https://minio.domain.com/clinic-uploads/inpatient-logs/..."]
  is_visible_customer BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE: transactions
-- ============================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_transaksi    TEXT UNIQUE NOT NULL,
  -- format: INV-YYYYMMDD-XXXX (generate di application layer, lihat bagian BUSINESS LOGIC)
  customer_id     UUID REFERENCES profiles,
  kasir_id        UUID NOT NULL REFERENCES profiles,
  tgl_transaksi   TIMESTAMPTZ DEFAULT NOW(),
  subtotal        NUMERIC(12,2) NOT NULL,
  diskon_nominal  NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL,
  metode_bayar    TEXT CHECK (metode_bayar IN ('tunai','transfer','qris','debit')),
  uang_diterima   NUMERIC(12,2),
  kembalian       NUMERIC(12,2),
  status          TEXT DEFAULT 'lunas' CHECK (status IN ('draft','lunas','batal')),
  catatan         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: transaction_items
-- ============================================
CREATE TABLE transaction_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES transactions ON DELETE CASCADE,
  tipe_item       TEXT CHECK (tipe_item IN ('produk','layanan')),
  product_id      UUID REFERENCES products,
  service_id      UUID REFERENCES services,
  nama_item       TEXT NOT NULL,        -- snapshot, immutable setelah lunas
  harga_satuan    NUMERIC(12,2) NOT NULL, -- snapshot, immutable setelah lunas
  qty             INTEGER NOT NULL CHECK (qty > 0),
  diskon_item     NUMERIC(12,2) DEFAULT 0,
  subtotal        NUMERIC(12,2) NOT NULL
);

-- ============================================
-- TABLE: stock_mutations
-- ============================================
CREATE TABLE stock_mutations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products,
  tipe            TEXT CHECK (tipe IN ('masuk','keluar','adjustment')),
  qty_sebelum     INTEGER NOT NULL,
  qty_perubahan   INTEGER NOT NULL,
  qty_sesudah     INTEGER NOT NULL,
  referensi       TEXT,
  -- referensi: no_transaksi jika tipe=keluar, atau 'Manual' jika input langsung
  catatan         TEXT,
  staff_id        UUID NOT NULL REFERENCES profiles,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: expenses
-- ============================================
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori        TEXT NOT NULL,
  deskripsi       TEXT NOT NULL,
  jumlah          NUMERIC(12,2) NOT NULL,
  tgl_pengeluaran DATE NOT NULL,
  foto_struk      TEXT,
  staff_id        UUID NOT NULL REFERENCES profiles,
  created_at      TIMESTAMPTZ DEFAULT NOW()
  -- Catatan: ini SATU-SATUNYA tabel yang boleh hard delete
);

-- ============================================
-- TABLE: booking_slots
-- ============================================
CREATE TABLE booking_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dokter_id       UUID REFERENCES profiles,
  tanggal         DATE NOT NULL,
  jam_mulai       TIME NOT NULL,
  jam_selesai     TIME NOT NULL,
  kuota           INTEGER DEFAULT 1,
  terisi          INTEGER DEFAULT 0,
  is_available    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: online_bookings
-- ============================================
CREATE TABLE online_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         UUID NOT NULL REFERENCES booking_slots,
  customer_id     UUID REFERENCES profiles,
  nama_guest      TEXT,
  no_hp_guest     TEXT,
  nama_hewan      TEXT NOT NULL,
  spesies         TEXT NOT NULL,
  keluhan         TEXT,
  status          TEXT DEFAULT 'menunggu' CHECK (status IN ('menunggu','dikonfirmasi','ditolak','selesai')),
  alasan_tolak    TEXT,
  appointment_id  UUID REFERENCES appointments,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: clinic_info
-- ============================================
CREATE TABLE clinic_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_klinik     TEXT NOT NULL,
  alamat          TEXT,
  no_hp           TEXT,
  email           TEXT,
  jam_buka        JSONB DEFAULT '[]',
  logo_url        TEXT,
  footer_struk    TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
  -- single row table, hanya owner yang bisa update
);
```

---

## DRIZZLE ORM — KONFIGURASI

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
```

```typescript
// src/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 10 // koneksi pool kecil, sesuai VPS 1-2 vCPU
})

export const db = drizzle(queryClient, { schema })
```

```
ATURAN PENGGUNAAN DRIZZLE
├── Semua operasi multi-tabel WAJIB dibungkus db.transaction(async (tx) => {...})
├── Tidak ada raw SQL kecuali untuk kasus FOR UPDATE row lock (pakai sql template Drizzle)
├── Migration dibuat via: npx drizzle-kit generate
├── Migration dijalankan via: npx drizzle-kit migrate (di CI/CD atau saat container start)
└── Tidak ada Prisma, tidak ada binary engine — pure TypeScript, build ringan
```

---

## AUTH — CUSTOM (BCRYPT + JWT COOKIE)

```
KONSEP
├── Tidak ada Supabase Auth, tidak ada auth.users
├── Tabel profiles adalah satu-satunya sumber identitas user
├── Password di-hash dengan bcryptjs (salt rounds: 10)
├── Setelah login sukses → generate JWT, simpan di httpOnly cookie
├── JWT payload: { sub: user_id, role, is_active }
├── JWT expiry: 30 hari
├── TIDAK ADA refresh token, TIDAK ADA tabel sessions
└── Cookie: httpOnly, secure (production), sameSite=lax, path=/
```

```typescript
// src/lib/auth/password.ts
import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

```typescript
// src/lib/auth/session.ts
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const EXPIRY = '30d'

export type SessionPayload = {
  sub: string       // user id
  role: 'owner' | 'dokter' | 'staff' | 'customer'
  is_active: boolean
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// Cookie config dipakai konsisten di semua route yang set/clear cookie
export const SESSION_COOKIE = 'vetcare_session'
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30 // 30 hari, samakan dengan JWT expiry
}
```

```typescript
// src/lib/auth/guard.ts
// Helper dipakai di setiap API route yang butuh re-check is_active sebenarnya
// (lihat ATURAN RE-CHECK SENSITIF di bawah)
import { db } from '@/db/client'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function assertActiveUser(userId: string) {
  const user = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId)
  })
  if (!user || !user.is_active) {
    throw new Error('UNAUTHORIZED_INACTIVE')
  }
  return user
}
```

```
ATURAN RE-CHECK SENSITIF (WAJIB)
├── Middleware & GET routes biasa → cukup percaya payload JWT (cepat, tanpa query DB)
├── Endpoint kritis WAJIB panggil assertActiveUser() yang query ulang ke DB:
│   ├── POS: buat transaksi, batal transaksi
│   ├── Inventory: ubah stok, hapus produk
│   ├── User management: ubah role, nonaktifkan user
│   ├── Medical record & inpatient: create/update
│   └── Expenses: create/delete
└── Alasan: token tetap valid 30 hari walau is_active diubah jadi false,
    re-check ini adalah satu-satunya jalan mencabut akses dengan segera
```

---

## STORAGE — MINIO (S3-COMPATIBLE)

```typescript
// src/lib/storage/client.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,       // https://minio.domainanda.com
  region: 'us-east-1',                          // dummy region, MinIO tidak pakai region asli
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!
  },
  forcePathStyle: true                          // WAJIB true untuk MinIO
})

export const BUCKET = 'clinic-uploads'

export async function uploadFile(path: string, buffer: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read'
  }))
  return `${process.env.MINIO_PUBLIC_URL}/${BUCKET}/${path}`
}

export async function deleteFile(path: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: path }))
}
```

```
KONFIGURASI BUCKET MINIO (manual saat provisioning, sekali saja)
├── Buat bucket: clinic-uploads
├── Set bucket policy: public read (anonymous GetObject)
├── Upload tetap wajib via aplikasi (pakai access key, tidak public write)
└── Tidak ada RLS storage seperti Supabase — kontrol akses dilakukan
    di API route /api/upload sebelum file dikirim ke MinIO

FOLDER CONVENTION (tidak berubah dari sebelumnya)
clinic-uploads/
├── pets/               {pet_id}-{timestamp}.jpg
├── inpatient-logs/     {inpatient_id}/{timestamp}-{n}.jpg
├── products/           {product_id}-{timestamp}.jpg
├── expenses/            {expense_id}-{timestamp}.jpg
├── profiles/             {user_id}-{timestamp}.jpg
└── clinic/                logo.jpg

VALIDASI UPLOAD (tetap berlaku, dicek di API route SEBELUM kirim ke MinIO)
├── Tipe: hanya jpg, png, webp
├── Ukuran: maksimal 5MB per file
├── Jumlah: maksimal 5 foto per log monitoring
└── Hapus file lama dari MinIO jika file diganti (replace)
```

---

## VALIDASI ZOD — SEMUA SCHEMA

```typescript
// src/lib/validations/auth.ts
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['owner','dokter','staff','customer']),
  nama_lengkap: z.string().min(1),
  no_hp: z.string().optional(),
  alamat: z.string().optional()
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

// src/lib/validations/user.ts
export const UpdateUserSchema = z.object({
  nama_lengkap: z.string().min(1).optional(),
  no_hp: z.string().optional(),
  alamat: z.string().optional(),
  is_active: z.boolean().optional()
})

// src/lib/validations/pet.ts
export const CreatePetSchema = z.object({
  owner_id: z.string().uuid(),
  nama: z.string().min(1),
  spesies: z.string().min(1),
  ras: z.string().optional(),
  jenis_kelamin: z.enum(['jantan','betina']).optional(),
  tgl_lahir: z.string().optional(),
  berat_kg: z.number().optional()
})

// src/lib/validations/appointment.ts
export const CreateAppointmentSchema = z.object({
  pet_id: z.string().uuid(),
  dokter_id: z.string().uuid().optional(),
  tgl_janji: z.string(),
  jenis: z.enum(['konsultasi','grooming','operasi','vaksin','lainnya']),
  keluhan: z.string().optional()
})

export const UpdateAppointmentSchema = z.object({
  status: z.enum(['pending','konfirmasi','selesai','batal']),
  catatan_staff: z.string().optional()
})

// src/lib/validations/medical-record.ts
export const CreateMedicalRecordSchema = z.object({
  pet_id: z.string().uuid(),
  dokter_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
  berat_saat_periksa: z.number().optional(),
  suhu: z.number().optional(),
  keluhan: z.string().optional(),
  diagnosis: z.string().min(1),
  tindakan: z.string().optional(),
  resep: z.array(z.object({
    nama_obat: z.string(),
    dosis: z.string(),
    frekuensi: z.string(),
    durasi: z.string(),
    qty: z.number(),
    aturan_pakai: z.string()
  })).optional(),
  catatan_followup: z.string().optional(),
  is_visible_customer: z.boolean().default(true)
})

// src/lib/validations/inpatient.ts
export const CreateInpatientSchema = z.object({
  pet_id: z.string().uuid(),
  dokter_id: z.string().uuid(),
  no_kandang: z.string().min(1),
  diagnosis_awal: z.string().optional(),
  tindakan_awal: z.string().optional()
})

export const CreateInpatientLogSchema = z.object({
  kondisi: z.enum(['kritis','lemah','stabil','baik','sangat_baik']),
  berat: z.number().optional(),
  suhu: z.number().optional(),
  nafsu_makan: z.enum(['tidak_mau','sedikit','normal','lahap']).optional(),
  catatan_kondisi: z.string().min(1),
  tindakan_hari_ini: z.string().optional(),
  obat_hari_ini: z.string().optional(),
  is_visible_customer: z.boolean().default(true)
})

// src/lib/validations/pos.ts
export const CreateTransactionSchema = z.object({
  customer_id: z.string().uuid().optional(),
  items: z.array(z.object({
    tipe_item: z.enum(['produk','layanan']),
    product_id: z.string().uuid().optional(),
    service_id: z.string().uuid().optional(),
    qty: z.number().int().positive(),
    diskon: z.number().min(0).default(0)
  })).min(1),
  metode_bayar: z.enum(['tunai','transfer','qris','debit']),
  diskon_nominal: z.number().min(0).default(0),
  uang_diterima: z.number().optional(),
  catatan: z.string().optional()
})

// src/lib/validations/inventory.ts
export const CreateProductSchema = z.object({
  kode_produk: z.string().min(1),
  category_id: z.string().uuid().optional(),
  nama: z.string().min(1).max(200),
  deskripsi: z.string().optional(),
  harga_beli: z.number().min(0).default(0),
  harga_jual: z.number().positive(),
  stok: z.number().int().min(0).default(0),
  stok_minimum: z.number().int().min(0).default(5),
  satuan: z.string().default('pcs')
})

export const StockMutationSchema = z.object({
  tipe: z.enum(['masuk','adjustment']),
  qty: z.number().int().positive(),
  catatan: z.string().optional()
})

// src/lib/validations/expense.ts
export const CreateExpenseSchema = z.object({
  kategori: z.string().min(1),
  deskripsi: z.string().min(1),
  jumlah: z.number().positive(),
  tgl_pengeluaran: z.string()
})

// src/lib/validations/booking.ts
export const CreateBookingSchema = z.object({
  slot_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  nama_guest: z.string().optional(),
  no_hp_guest: z.string().optional(),
  nama_hewan: z.string().min(1),
  spesies: z.string().min(1),
  keluhan: z.string().optional()
}).refine(
  data => data.customer_id || (data.nama_guest && data.no_hp_guest),
  { message: 'customer_id atau nama_guest + no_hp_guest wajib diisi' }
)
```

---

## CONSTANTS

```typescript
// src/lib/constants.ts
export const ROLES = {
  OWNER: 'owner',
  DOKTER: 'dokter',
  STAFF: 'staff',
  CUSTOMER: 'customer'
} as const

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  KONFIRMASI: 'konfirmasi',
  SELESAI: 'selesai',
  BATAL: 'batal'
} as const

export const INPATIENT_STATUS = {
  AKTIF: 'aktif',
  SEMBUH: 'sembuh',
  DIRUJUK: 'dirujuk',
  MENINGGAL: 'meninggal'
} as const

export const KONDISI_HEWAN = {
  KRITIS: 'kritis',
  LEMAH: 'lemah',
  STABIL: 'stabil',
  BAIK: 'baik',
  SANGAT_BAIK: 'sangat_baik'
} as const

export const METODE_BAYAR = {
  TUNAI: 'tunai',
  TRANSFER: 'transfer',
  QRIS: 'qris',
  DEBIT: 'debit'
} as const

export const TRANSACTION_STATUS = {
  DRAFT: 'draft',
  LUNAS: 'lunas',
  BATAL: 'batal'
} as const

export const BOOKING_STATUS = {
  MENUNGGU: 'menunggu',
  DIKONFIRMASI: 'dikonfirmasi',
  DITOLAK: 'ditolak',
  SELESAI: 'selesai'
} as const

export const UPLOAD_CONFIG = {
  MAX_SIZE_MB: 5,
  MAX_FILES: 5,
  ALLOWED_TYPES: ['image/jpeg','image/png','image/webp'],
  BUCKET: 'clinic-uploads'
} as const

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const

export const SPESIES_OPTIONS = [
  'Kucing','Anjing','Kelinci','Hamster',
  'Burung','Ikan','Reptil','Lainnya'
] as const

export const SESSION_CONFIG = {
  COOKIE_NAME: 'vetcare_session',
  EXPIRY_DAYS: 30
} as const
```

---

## API ROUTE CONTRACT

```typescript
// Standard response wrapper — WAJIB semua route
type ApiSuccess<T> = { data: T; message?: string }
type ApiError = { error: string; code?: string }

// Standard HTTP status:
// 200 → OK
// 201 → Created
// 400 → Validation error / bad request
// 401 → Tidak terautentikasi (cookie tidak ada / JWT invalid)
// 403 → Tidak punya akses (role tidak sesuai, atau is_active=false)
// 404 → Data tidak ditemukan
// 409 → Conflict (stok tidak cukup, slot penuh)
// 500 → Server error

// Wajib di setiap API route:
// 1. Verify JWT dari cookie → 401 jika tidak ada/invalid
// 2. Cek role dari payload JWT → 403 jika tidak sesuai
// 3. Jika endpoint sensitif → assertActiveUser() re-check DB → 403 jika is_active=false
// 4. Parse & validasi body/query dengan Zod → 400 jika invalid
// 5. Business logic dalam try/catch, transaksi multi-tabel pakai db.transaction()
// 6. Return typed response
```

---

## MIDDLEWARE ROUTING

```typescript
// src/middleware.ts
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth/session'

// Route protection map:
const ROLE_ROUTES: Record<string, string[]> = {
  '/owner':    ['owner'],
  '/dokter':   ['dokter', 'owner'],
  '/staff':    ['staff', 'owner'],
  '/customer': ['customer'],
}

// Flow:
// 1. Request masuk
// 2. Jika /api/* → skip middleware (handle auth di tiap route)
// 3. Jika /(public)/* → skip (public)
// 4. Jika /login → skip
// 5. Ambil cookie SESSION_COOKIE, verify via verifySessionToken()
// 6. Jika token tidak ada/invalid → redirect /login
// 7. Ambil role dari payload JWT (TIDAK query DB, demi performa)
// 8. Cek role vs route → redirect/403 jika tidak sesuai
// 9. Lanjut ke page
//
// Catatan: middleware ini TIDAK re-check is_active dari DB (terlalu mahal
// untuk dijalankan di setiap request). Re-check is_active hanya terjadi
// di endpoint sensitif lewat assertActiveUser(), lihat bagian AUTH.
```

---

## ROLE ACCESS MATRIX

```
HALAMAN/FITUR                      OWNER  DOKTER  STAFF  CUSTOMER
─────────────────────────────────────────────────────────────────
Dashboard ringkasan                  ✅     ✅      ✅      ✅
Laporan keuangan lengkap             ✅     ❌      ❌      ❌
Manajemen user                       ✅     ❌      ❌      ❌
Pengaturan klinik                    ✅     ❌      ❌      ❌
Kelola booking slots                 ✅     ❌      ❌      ❌

List semua appointment               ✅     ✅      ✅      ❌
Buat appointment                     ✅     ✅      ✅      ❌
Update status appointment            ✅     ✅      ✅      ❌

Input rekam medis                    ✅     ✅      ❌      ❌
Lihat semua rekam medis              ✅     ✅      ❌      ❌
Lihat rekam medis hewan sendiri      ✅     ✅      ❌      ✅

Admisi rawat inap                    ✅     ✅      ❌      ❌
Input log monitoring                 ✅     ✅      ✅      ❌
Lihat monitoring hewan sendiri       ✅     ✅      ✅      ✅
Update status rawat inap             ✅     ✅      ❌      ❌

Akses POS                            ✅     ❌      ✅      ❌
Batal transaksi                      ✅     ❌      ❌      ❌
Lihat riwayat transaksi sendiri      ✅     ❌      ✅      ✅

Kelola inventory                     ✅     ❌      ✅      ❌
Input pengeluaran                    ✅     ❌      ✅      ❌
Hapus pengeluaran                    ✅     ❌      ❌      ❌

Konfirmasi booking online            ✅     ❌      ✅      ❌
Lihat hewan sendiri                  ✅     ✅      ✅      ✅
Tambah hewan                         ✅     ✅      ✅      ✅
```

---

## BUSINESS LOGIC KRITIS

### POS — Atomic Transaction (Drizzle)
```
URUTAN WAJIB (semua dalam SATU db.transaction()):
1. assertActiveUser(kasir_id) → pastikan kasir masih aktif
2. Validasi semua product_id: is_active=true, stok >= qty
3. Hitung subtotal per item: (harga_satuan × qty) - diskon_item
4. Hitung total: SUM(subtotal) - diskon_nominal
5. Jika metode=tunai: assert uang_diterima >= total
6. Hitung kembalian: uang_diterima - total
7. Generate no_transaksi (lihat bagian NO_TRANSAKSI di bawah)
8. INSERT transactions → dapat id
9. INSERT transaction_items[] (snapshot nama_item & harga_satuan)
10. Untuk setiap produk:
    a. SELECT stok FROM products WHERE id = ? FOR UPDATE (row lock)
    b. Jika stok < qty → throw error, transaction rollback otomatis
    c. UPDATE products SET stok = stok - qty
    d. INSERT stock_mutations (tipe='keluar', referensi=no_transaksi)
11. Jika appointment_id ada: UPDATE appointments SET status='selesai'
12. RETURN transaction dengan no_transaksi untuk struk

ROLLBACK otomatis oleh Drizzle jika ada error di langkah manapun
(seluruh blok db.transaction() di-throw, Postgres rollback semua)
```

### NO_TRANSAKSI — Generator (Application Layer)
```
Catatan: sebelumnya pakai SQL trigger COUNT(*) yang rawan race condition
saat concurrent insert. Sekarang di-generate di dalam db.transaction()
yang sama dengan insert transaksi, menggunakan row lock pada counter:

1. Di awal transaction, SELECT ... FOR UPDATE pada baris counter harian
   (tabel kecil terpisah, misal daily_counters, atau pakai sequence Postgres
   yang di-reset logic-nya per hari di application layer)
2. Increment counter, format: INV-YYYYMMDD-XXXX
3. Insert transaksi dengan no_transaksi yang sudah pasti unik
   (karena row lock mencegah race condition antar transaksi paralel)
```

### STRUK — Format Wajib
```
[NAMA KLINIK]
[ALAMAT] | [NO HP]
─────────────────────────
No    : INV-20240617-0001
Kasir : [nama staff]
Tgl   : 17 Jun 2024, 14:30
─────────────────────────
[nama item]      [qty]x[harga]
                     [subtotal]
─────────────────────────
Subtotal         : Rp xxx
Diskon           : Rp xxx
Total            : Rp xxx
Bayar ([metode]) : Rp xxx
Kembali          : Rp xxx
─────────────────────────
[footer_struk dari clinic_info]
```

### BOOKING — Konfirmasi Flow
```
1. Guest/customer submit booking → status: menunggu, slot.terisi++
2. Jika slot.terisi >= kuota → slot.is_available = false
3. Staff konfirmasi (assertActiveUser dulu):
   a. UPDATE online_bookings SET status='dikonfirmasi'
   b. Auto INSERT appointments:
      - pet_id: cari/create berdasarkan nama_hewan + customer_id
      - dokter_id: dari booking_slots.dokter_id
      - customer_id: dari booking.customer_id
      - tgl_janji: dari slot tanggal + jam_mulai
      - jenis: 'konsultasi'
      - sumber: 'online'
4. Staff tolak → status='ditolak', isi alasan_tolak, slot.terisi--
5. UPDATE online_bookings SET status='selesai' setelah appointment selesai
```

### STOK — Invariant
```
├── Tidak boleh stok negatif → CHECK constraint di DB + validasi aplikasi
├── Setiap perubahan stok WAJIB diiringi INSERT ke stock_mutations
├── Mutasi 'keluar' selalu dari POS, referensi = no_transaksi
├── Mutasi 'masuk' & 'adjustment' selalu manual oleh staff/owner, referensi='Manual'
└── Update stok WAJIB pakai row lock (FOR UPDATE) untuk hindari race condition
    saat dua transaksi POS paralel mengurangi stok produk yang sama
```

### MONITORING — Upload Foto
```
1. Validasi file: hanya jpg/png/webp, max 5MB per file, max 5 foto
2. Upload ke MinIO bucket: clinic-uploads via lib/storage/client.ts
3. Path: inpatient-logs/{inpatient_id}/{timestamp}-{n}.jpg
4. Simpan array URL public ke foto_urls jsonb
5. URL bersifat permanen (bucket public-read)
```

### LAPORAN — Kalkulasi Laba
```
total_pemasukan  = SUM(transactions.total) WHERE status='lunas' AND periode
total_pengeluaran = SUM(expenses.jumlah) WHERE periode
laba_bersih      = total_pemasukan - total_pengeluaran
```

---

## STANDAR KODE

```
TypeScript   : strict: true, no any, no implicit any
API Route    : wajib verify JWT → cek role → (jika sensitif) assertActiveUser
               → zod validate → try/catch → return typed response
Server Comp  : default semua page, gunakan 'use client' hanya untuk interaktivitas
Error        : selalu return { error: string, status: number } yang konsisten
Success      : selalu return { data: T, message?: string }
Upload       : validasi tipe + ukuran sebelum upload, hapus file lama di MinIO jika replace
Stok         : selalu atomic dengan db.transaction(), tidak boleh stok negatif
Harga        : selalu simpan snapshot nama_item & harga_satuan di transaction_items
Soft delete  : user tidak dihapus, hanya is_active = false
DB Access    : semua query lewat Drizzle, tidak ada raw SQL kecuali row lock
```

---

## ATURAN TIDAK BOLEH DILANGGAR

```
DATABASE
├── Tidak boleh hapus fisik: profiles, pets, medical_records,
│   transactions, inpatients, stock_mutations
├── Tidak boleh stok negatif (constraint DB + validasi aplikasi)
├── Tidak boleh ubah: no_transaksi, harga_satuan di transaction_items,
│   nama_item di transaction_items setelah lunas
└── Setiap perubahan stok WAJIB ada record di stock_mutations

API
├── Tidak boleh return data tanpa verifikasi JWT
├── Tidak boleh return data lintas role tanpa cek
├── Tidak boleh skip validasi Zod
├── Tidak boleh expose MINIO_SECRET_KEY atau JWT_SECRET ke client
├── Tidak boleh proses transaksi POS tanpa row lock pada stok
└── Endpoint sensitif tidak boleh skip assertActiveUser() re-check

FRONTEND
├── Tidak boleh simpan role atau token di localStorage (httpOnly cookie saja)
├── Tidak boleh render halaman sebelum role terverifikasi
├── Tidak boleh aksi destruktif tanpa confirm dialog
├── Tidak boleh upload file tanpa validasi tipe dan ukuran
└── Tidak boleh print tanpa CSS @media print

UPLOAD
├── Tipe: hanya jpg, png, webp
├── Ukuran: maksimal 5MB per file
├── Jumlah: maksimal 5 foto per log monitoring
└── Path: wajib ikuti konvensi folder storage
```

---

## ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=postgresql://user:password@postgres-host:5432/vetcare

# Auth
JWT_SECRET=ganti-dengan-random-string-panjang-minimal-32-karakter

# Storage (MinIO)
MINIO_ENDPOINT=https://minio.domainanda.com
MINIO_PUBLIC_URL=https://minio.domainanda.com
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=

# App
NEXT_PUBLIC_APP_URL=https://vetcare.domainanda.com
NODE_ENV=production

# Tidak ada payment gateway
# Tidak ada email service eksternal (notifikasi via UI saja untuk versi 1.0.0)
```

---

## NEXT.CONFIG.JS

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // wajib untuk image Docker minimal di Coolify
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio.domainanda.com',
        pathname: '/clinic-uploads/**'
      }
    ]
  },
  typescript: { tsconfigPath: './tsconfig.json' },
  eslint: { ignoreDuringBuilds: false }
}

module.exports = nextConfig
```

---

## DOCKERFILE — DEPLOY DI COOLIFY

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

```
CATATAN DEPLOY DI COOLIFY
├── Provision PostgreSQL via Coolify "Managed Service" (one-click)
├── Provision MinIO via Coolify "Managed Service" (one-click)
├── App Next.js: deploy dari Dockerfile di atas, set semua env var
│   di Coolify dashboard (bukan .env yang ikut commit)
├── Jalankan migration sekali setelah deploy pertama:
│   docker exec <container> npx drizzle-kit migrate
├── Tidak perlu konfigurasi Kong/GoTrue/Realtime/Studio (semua tidak dipakai)
└── Resource ringan: cukup untuk VPS 1-2 vCPU, 2-4GB RAM
```

---

## TSCONFIG.JSON

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom","dom.iterable","esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## PACKAGE.JSON

```json
{
  "name": "vetcare-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/db/seed.ts"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18",
    "drizzle-orm": "^0.31",
    "postgres": "^3.4",
    "bcryptjs": "^2.4",
    "jose": "^5.4",
    "@aws-sdk/client-s3": "^3.600",
    "zod": "^3.23",
    "react-hook-form": "^7.51",
    "@hookform/resolvers": "^3.3",
    "@tanstack/react-table": "^8.17",
    "recharts": "^2.12",
    "date-fns": "^3.6",
    "react-hot-toast": "^2.4",
    "lucide-react": "^0.383",
    "clsx": "^2.1",
    "tailwind-merge": "^2.3",
    "@radix-ui/react-dialog": "^1.0",
    "@radix-ui/react-dropdown-menu": "^2.0",
    "@radix-ui/react-select": "^2.0",
    "@radix-ui/react-tabs": "^1.0",
    "@radix-ui/react-switch": "^1.0",
    "@radix-ui/react-avatar": "^1.0",
    "@radix-ui/react-popover": "^1.0",
    "class-variance-authority": "^0.7"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/bcryptjs": "^2.4",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10",
    "postcss": "^8",
    "eslint": "^8",
    "eslint-config-next": "14.2.0",
    "drizzle-kit": "^0.22",
    "tsx": "^4.16"
  }
}
```

---

## DESIGN SYSTEM

### Color Palette
```
Primary     : #0EA5E9  (sky-500)     → brand utama, button, link
Primary Dark: #0284C7  (sky-600)     → hover state
Secondary   : #10B981  (emerald-500) → sukses, aktif, selesai
Warning     : #F59E0B  (amber-500)   → pending, peringatan stok
Danger      : #EF4444  (red-500)     → error, batal, kritis
Purple      : #8B5CF6  (violet-500)  → dokter, rekam medis
Gray Base   : #F8FAFC  (slate-50)    → background halaman
Card BG     : #FFFFFF               → background card
Sidebar BG  : #0F172A  (slate-900)  → sidebar gelap
Sidebar Text: #94A3B8  (slate-400)  → menu tidak aktif
Sidebar Act : #FFFFFF               → menu aktif
Border      : #E2E8F0  (slate-200)  → border card, input
Text Primary: #0F172A  (slate-900)  → judul, label
Text Muted  : #64748B  (slate-500)  → deskripsi, placeholder
```

### Typography
```
Font Family : Inter (Google Fonts)
─────────────────────────────────
Page Title  : 24px, font-bold, slate-900
Section Title: 18px, font-semibold, slate-900
Card Title  : 14px, font-semibold, slate-700
Body        : 14px, font-normal, slate-700
Small/Muted : 12px, font-normal, slate-500
Label       : 12px, font-medium, slate-600, uppercase tracking-wide
Badge       : 11px, font-semibold
```

### Spacing & Radius
```
Page Padding  : p-6 (24px)
Card Padding  : p-5 (20px)
Gap antar card: gap-4 (16px)
Border Radius : rounded-xl (card), rounded-lg (input, button), rounded-full (badge, avatar)
Shadow        : shadow-sm (card default), shadow-md (modal, dropdown)
```

### Status Color Mapping
```
Badge Status → Warna:
pending      → amber-100 text-amber-700
konfirmasi   → sky-100 text-sky-700
selesai      → emerald-100 text-emerald-700
batal        → red-100 text-red-700
aktif        → emerald-100 text-emerald-700
sembuh       → sky-100 text-sky-700
dirujuk      → violet-100 text-violet-700
meninggal    → slate-100 text-slate-600
kritis       → red-100 text-red-700
lemah        → orange-100 text-orange-700
stabil       → amber-100 text-amber-700
baik         → sky-100 text-sky-700
sangat_baik  → emerald-100 text-emerald-700
lunas        → emerald-100 text-emerald-700
draft        → slate-100 text-slate-600
```

---

## LAYOUT SISTEM

### Shell Utama (Dashboard)
```
┌──────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixed)    │ MAIN AREA (flex-1)         │
│ ┌────────────────────┐   │ ┌──────────────────────┐   │
│ │ Logo + Nama Klinik │   │ │ TOPBAR (64px)        │   │
│ ├────────────────────┤   │ │ breadcrumb | user    │   │
│ │ Avatar + Nama User │   │ └──────────────────────┘   │
│ │ Badge Role         │   │                            │
│ ├────────────────────┤   │ PAGE CONTENT               │
│ │ NAV MENU           │   │ p-6, overflow-y-auto       │
│ │ > Menu Item        │   │                            │
│ │   Menu Item        │   │                            │
│ │   Menu Item        │   │                            │
│ ├────────────────────┤   │                            │
│ │ Logout Button      │   │                            │
│ └────────────────────┘   └──────────────────────────┘ │
└──────────────────────────────────────────────────────┘

Mobile (<768px):
- Sidebar collapse jadi overlay dengan hamburger toggle
- Topbar tetap fixed
- Content full width
```

### Sidebar Menu per Role
```
OWNER (slate-900 bg, sky-500 accent)
├── 🏠 Dashboard
├── 📊 Laporan
├── 👥 Manajemen User
├── 🐾 Semua Hewan
├── 📅 Appointment
├── 🏥 Rawat Inap
├── 📅 Booking Online
├── ⚙️ Pengaturan Klinik
└── 🚪 Logout

DOKTER (slate-900 bg, violet-500 accent)
├── 🏠 Dashboard
├── 📅 Appointment Saya
├── 📋 Rekam Medis
├── 🏥 Rawat Inap
├── 🐾 Data Hewan
└── 🚪 Logout

STAFF (slate-900 bg, emerald-500 accent)
├── 🏠 Dashboard
├── 🛒 POS Kasir
├── 📦 Inventory
├── 📅 Appointment
├── 🏥 Rawat Inap
├── 💰 Pengeluaran
├── 📅 Booking Online
└── 🚪 Logout

CUSTOMER (slate-900 bg, sky-500 accent)
├── 🏠 Dashboard
├── 🐾 Hewan Saya
├── 📋 Rekam Medis
└── 🏥 Monitoring
└── 🚪 Logout
```

---

## HALAMAN PER MODUL

### 1. LOGIN PAGE
```
Layout: center screen, bg-slate-50

┌─────────────────────────────────┐
│        [Logo Klinik]            │
│      Nama Klinik Hewan          │
│   Masuk ke Panel Manajemen      │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Email                     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Password              👁  │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │      Masuk  [loading]     │  │
│  └───────────────────────────┘  │
│   ⚠ pesan error di sini         │
└─────────────────────────────────┘

Behavior:
- Enter key submit form
- Loading state disable tombol + spinner
- Error shake animation
- Submit ke POST /api/auth/login → set httpOnly cookie → redirect ke /[role]/dashboard
```

### 2. DASHBOARD OWNER
```
┌─────────────────────────────────────────────────┐
│ Selamat datang, [nama] 👋        Hari, Tgl       │
├─────────────────────────────────────────────────┤
│ FILTER PERIODE: [ Hari Ini ▼ ] [Custom Range]   │
├──────────┬──────────┬──────────┬────────────────┤
│💰Pemasuk │💸Pengelu │📈Laba    │🧾Transaksi     │
│Rp xxx    │Rp xxx    │Rp xxx    │NN transaksi    │
│↑12% mtl  │↑5% mtl   │↑8% mtl  │hari ini        │
├──────────┴──────────┴──────────┴────────────────┤
│👥Pasien Baru │🏥Rawat Inap  │📅Appointment      │
│NN hari ini   │NN aktif      │NN hari ini        │
├─────────────────────────┬───────────────────────┤
│ LINE CHART              │ PIE CHART             │
│ Pemasukan vs Pengeluaran│ Metode Pembayaran     │
│ 30 hari terakhir        │ Tunai/QRIS/Transfer   │
├─────────────────────────┴───────────────────────┤
│ BAR CHART — Produk Terlaris (Top 10)            │
├─────────────────────────┬───────────────────────┤
│ ⚠ STOK MENIPIS          │ 🏥 RAWAT INAP AKTIF   │
│ List produk < minimum   │ List pasien aktif     │
│ [Kelola Inventory]      │ [Lihat Semua]         │
└─────────────────────────┴───────────────────────┘
```

### 2B. DASHBOARD DOKTER
```
┌─────────────────────────────────────────────────┐
│ Selamat datang, Dr. [nama] 👋                   │
├──────────┬──────────┬──────────┬────────────────┤
│📅Appt    │🏥Rawat   │📋Rekam   │🐾Pasien        │
│hari ini  │Inap Aktif│Medis Bln │Bulan Ini       │
├──────────┴──────────┴──────────┴────────────────┤
│ APPOINTMENT HARI INI                            │
│ ┌──────────────────────────────────────────┐   │
│ │ 08:00 │ Kucing │ Nama Hewan │ Pemilik  │ ● │   │
│ │ 09:00 │ Anjing │ Nama Hewan │ Pemilik  │ ● │   │
│ └──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ PASIEN RAWAT INAP AKTIF                        │
│ Kandang 1: [Nama Hewan] — Kondisi: Stabil      │
│ Kandang 2: [Nama Hewan] — Kondisi: Baik        │
└─────────────────────────────────────────────────┘
```

### 2C. DASHBOARD STAFF
```
┌──────────┬──────────┬──────────┬────────────────┐
│🛒Transaksi│📦Stok   │📅Appt    │📋Booking       │
│hari ini   │menipis  │hari ini  │menunggu        │
├───────────┴──────────┴──────────┴───────────────┤
│ SHORTCUT AKSI CEPAT                             │
│ [🛒 Buka POS]  [📅 Tambah Appointment]          │
│ [📦 Tambah Stok]  [✅ Konfirmasi Booking]       │
├─────────────────────────────────────────────────┤
│ APPOINTMENT HARI INI (list ringkas)             │
│ BOOKING MENUNGGU KONFIRMASI (list ringkas)      │
└─────────────────────────────────────────────────┘
```

### 2D. DASHBOARD CUSTOMER
```
┌──────────┬──────────┬──────────────────────────┐
│🐾Hewan   │📋Rekam   │🏥Monitoring              │
│Saya      │Medis     │Rawat Inap                │
├──────────┴──────────┴──────────────────────────┤
│ HEWAN SAYA (card grid)                         │
│ ┌────────┐ ┌────────┐                          │
│ │[foto]  │ │[foto]  │                          │
│ │Nama    │ │Nama    │                          │
│ │Kucing  │ │Anjing  │                          │
│ │● Aktif │ │● Aktif │                          │
│ └────────┘ └────────┘                          │
├─────────────────────────────────────────────────┤
│ KUNJUNGAN TERAKHIR                             │
└─────────────────────────────────────────────────┘
```

### 3. INVENTORY
```
PageHeader: "Inventory" | [+ Tambah Produk]

TABS: [Produk] [Layanan] [Kategori] [Mutasi Stok]

TAB PRODUK:
FILTER: [Search] [Kategori ▼] [⚠ Stok Menipis]

TABLE:
┌────┬──────────────┬──────────┬─────────┬───────┬────────┬──────┐
│Foto│Nama + Kode   │Kategori  │Harga    │Stok   │Min Stok│Aksi  │
├────┼──────────────┼──────────┼─────────┼───────┼────────┼──────┤
│[f] │Nama          │Obat      │Rp xx    │ 50    │ 10     │⋮     │
│[f] │Nama          │Makanan   │Rp xx    │⚠ 3   │ 10     │⋮     │
└────┴──────────────┴──────────┴─────────┴───────┴────────┴──────┘
Baris stok < minimum → bg-red-50, stok merah bold

Dropdown ⋮:
- Edit Produk
- Tambah Stok Masuk
- Adjustment Stok
- Riwayat Mutasi
- Nonaktifkan

MODAL TAMBAH STOK MASUK:
- Produk: [nama produk] (readonly)
- Stok Saat Ini: N (readonly)
- Jumlah Masuk* (number)
- Stok Setelah: N+jumlah (auto hitung)
- Catatan (textarea)

MODAL ADJUSTMENT STOK:
- Stok Saat Ini: N (readonly)
- Stok Seharusnya* (number)
- Selisih: ±N (auto hitung, warna merah/hijau)
- Alasan* (textarea)

TAB MUTASI STOK:
TABLE:
┌──────────┬─────────┬───────┬──────┬──────┬────────┬───────────┐
│Tanggal   │Produk   │Tipe   │Sblm  │Ubah  │Sesudah │Referensi  │
├──────────┼─────────┼───────┼──────┼──────┼────────┼───────────┤
│17 Jun    │Nama     │●Masuk │ 10   │+20   │ 30     │Manual     │
│17 Jun    │Nama     │●Keluar│ 30   │-2    │ 28     │INV-xxx    │
└──────────┴─────────┴───────┴──────┴──────┴────────┴───────────┘

TAB LAYANAN:
TABLE dengan CRUD: Nama, Kategori, Harga, Durasi, Dokter Required, Status
```

### 4. LAPORAN (OWNER)
```
PageHeader: "Laporan Keuangan"

FILTER PERIODE:
[Hari Ini] [Minggu Ini] [Bulan Ini] [Tahun Ini] [Custom ▼]
Custom: [dari: ____] [sampai: ____] [Terapkan]

ROW 1 — KARTU RINGKASAN:
┌────────────┬────────────┬────────────┬────────────┐
│💰 Pemasukan│💸Pengeluaran│📈 Laba     │🧾Transaksi │
│ Rp xxx.xxx │ Rp xxx.xxx │ Rp xxx.xxx │ NN total   │
└────────────┴────────────┴────────────┴────────────┘

ROW 2 — CHART:
┌──────────────────────────┬─────────────────────────┐
│ LINE CHART               │ PIE CHART               │
│ Pemasukan vs Pengeluaran │ Metode Pembayaran        │
│ (per hari/minggu/bulan)  │ Tunai NN% | QRIS NN%    │
└──────────────────────────┴─────────────────────────┘

ROW 3 — CHART:
┌──────────────────────────┬─────────────────────────┐
│ BAR CHART                │ BAR CHART               │
│ Produk Terlaris (Top 10) │ Pemasukan per Kategori  │
│                          │ Produk vs Layanan        │
└──────────────────────────┴─────────────────────────┘

ROW 4 — TABEL TRANSAKSI:
PageHeader mini: "Detail Transaksi" | [📥 Export CSV]
TABLE:
┌──────────┬──────────────┬──────────┬──────────┬────────┬──────┐
│No Inv    │Customer      │Kasir     │Total     │Metode  │Status│
└──────────┴──────────────┴──────────┴──────────┴────────┴──────┘

ROW 5 — 2 KOLOM:
┌──────────────────────────┬─────────────────────────┐
│ ⚠ STOK MENIPIS           │ 👨‍⚕️ PERFORMA DOKTER      │
│ Produk | Stok | Min      │ Dokter | Pasien | Bulan  │
└──────────────────────────┴─────────────────────────┘
```

### 5. BOOKING ONLINE — PUBLIC
```
LANDING PAGE /:
┌─────────────────────────────────────────────────┐
│ NAVBAR: Logo | Layanan | Dokter | [Booking] [Login]│
├─────────────────────────────────────────────────┤
│ HERO SECTION                                    │
│ "Kesehatan Hewan Peliharaan Anda,               │
│  Prioritas Kami"                                │
│ [Booking Sekarang] [Lihat Layanan]              │
│ [ilustrasi dokter hewan]                        │
├─────────────────────────────────────────────────┤
│ LAYANAN UNGGULAN (grid 3)                       │
│ 🏥 Konsultasi | 🛁 Grooming | 🏨 Rawat Inap     │
├─────────────────────────────────────────────────┤
│ TIM DOKTER (card grid)                          │
│ [Foto] Dr. Nama | Spesialisasi | Bio singkat    │
├─────────────────────────────────────────────────┤
│ INFO KLINIK                                     │
│ Jam buka | Alamat | Kontak | Maps embed         │
├─────────────────────────────────────────────────┤
│ FOOTER                                          │
└─────────────────────────────────────────────────┘

HALAMAN BOOKING /booking:
Step indicator: [1. Pilih Jadwal] → [2. Data Hewan] → [3. Konfirmasi]

STEP 1 — Pilih Jadwal:
- Pilih Dokter (dropdown, opsional)
- Pilih Tanggal (date picker, hanya hari yang ada slot)
- Grid slot tersedia:
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ 08:00    │ │ 09:00    │ │ 10:00    │
  │ Tersedia │ │ Penuh    │ │ Tersedia │
  └──────────┘ └──────────┘ └──────────┘
  Slot penuh → disabled, warna abu

STEP 2 — Data Hewan:
(Jika customer login → nama & HP terisi otomatis)
- Nama Pemilik*, No HP*, Email
- Nama Hewan*, Spesies*
- Keluhan (textarea)

STEP 3 — Konfirmasi:
- Ringkasan: dokter, tanggal, jam, nama hewan, keluhan
- [Kirim Booking]
- Setelah submit: success screen
  "Booking terkirim! Kami akan menghubungi Anda untuk konfirmasi."

HALAMAN STAFF — MANAJEMEN BOOKING:
TABLE dengan filter status:
┌──────────┬─────────┬──────────┬─────────┬──────────┬────────┐
│Tgl Booking│Nama    │Hewan     │Slot     │Status    │Aksi    │
├──────────┼─────────┼──────────┼─────────┼──────────┼────────┤
│17 Jun    │ Andi    │ Milo     │08:00    │●Menunggu │✅ ❌   │
└──────────┴─────────┴──────────┴─────────┴──────────┴────────┘
✅ → Modal konfirmasi (auto buat appointment)
❌ → Modal tolak (wajib isi alasan)
```

### 6. HALAMAN CUSTOMER — REKAM MEDIS & MONITORING
```
REKAM MEDIS CUSTOMER /customer/rekam-medis:
- Filter: Pilih Hewan (tab per hewan yang dimiliki)
- Card per rekam medis (hanya yang is_visible_customer=true):
  Tanggal | Dokter | Diagnosis | [Lihat Detail]
- Detail: sama dengan halaman dokter tapi read-only, tanpa resep detail dosis

MONITORING CUSTOMER /customer/monitoring:
- Hanya tampil jika ada hewan yang sedang rawat inap
- Card hewan rawat inap:
  Nama | Kandang | Masuk sejak
  Kondisi terakhir: ● Stabil (update 2 jam lalu)
- Timeline log (hanya is_visible_customer=true):
  Kondisi, Catatan, Foto grid
- Foto bisa di-tap → lightbox fullscreen
```

---

## KOMPONEN INTERAKSI KRITIS

### Toast Notification
```
Posisi    : top-right
Sukses    : bg-emerald-500, icon ✓, auto dismiss 3 detik
Error     : bg-red-500, icon ✗, auto dismiss 5 detik
Warning   : bg-amber-500, icon ⚠, auto dismiss 4 detik
Info      : bg-sky-500, icon ℹ, auto dismiss 3 detik
```

### Loading States
```
Button submit    : spinner kiri + teks "Menyimpan..."
Tabel data       : skeleton rows (5 baris placeholder)
Card dashboard   : skeleton card
Halaman penuh    : center spinner dengan overlay
Upload foto      : progress bar + persentase
```

### Empty States
```
Tiap tabel/list kosong tampilkan:
[ilustrasi sederhana]
"Belum ada [nama data]"
"[deskripsi singkat]"
[Tombol aksi primer jika relevan]
```

### Confirm Dialog
```
Semua aksi destruktif wajib confirm:
- Nonaktifkan user
- Batal transaksi
- Hapus pengeluaran
- Tolak booking
- Pulangkan pasien

Format:
Judul  : "Konfirmasi [Aksi]"
Body   : "Apakah Anda yakin ingin [aksi]? [konsekuensi]"
Tombol : [Batal] [Ya, [Aksi]] ← tombol aksi warna danger
```

---

## RESPONSIVE BREAKPOINT

```
Mobile  < 768px  : 1 kolom, sidebar overlay, tabel scroll horizontal
Tablet  768-1024 : 2 kolom grid, sidebar collapsible
Desktop > 1024px : layout penuh seperti wireframe di atas

POS page: minimum 1024px, tidak dioptimasi untuk mobile
Print   : CSS khusus @media print untuk struk dan rekam medis
```

---

## PRINT CSS — STRUK & REKAM MEDIS

```css
@media print {
  sidebar, topbar, button, filter → display: none
  content → width: 100%, padding: 0
  struk → max-width: 80mm (thermal printer)
  rekam medis → A4, font 12px, semua border hitam
  page-break → rekam medis satu halaman jika memungkinkan
}
```

---

## KOMPONEN UI DASAR

```
src/components/ui/
├── Input.tsx           props: label, error, required, ...HTMLInput
├── Select.tsx          props: label, options, error, ...radix
├── Modal.tsx           props: open, onClose, title, children
├── Table.tsx           props: columns, data, pagination, search
├── Badge.tsx           props: status → warna otomatis per value
├── Card.tsx            props: title, value, icon, trend, color
├── PageHeader.tsx      props: title, subtitle, action
├── LoadingSpinner.tsx
├── EmptyState.tsx      props: title, description, action?
├── ConfirmDialog.tsx   props: open, onConfirm, title, description
├── ImageUpload.tsx     props: onUpload, preview, multiple?, maxSize=5MB
├── DateRangePicker.tsx props: from, to, onChange
└── PrintWrapper.tsx    props: children (handle print CSS)
```
