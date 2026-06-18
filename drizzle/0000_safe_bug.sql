CREATE TABLE IF NOT EXISTS "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"dokter_id" uuid,
	"customer_id" uuid NOT NULL,
	"tgl_janji" timestamp with time zone NOT NULL,
	"jenis" text,
	"status" text DEFAULT 'pending',
	"keluhan" text,
	"catatan_staff" text,
	"sumber" text DEFAULT 'langsung',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dokter_id" uuid,
	"tanggal" date NOT NULL,
	"jam_mulai" time NOT NULL,
	"jam_selesai" time NOT NULL,
	"kuota" integer DEFAULT 1,
	"terisi" integer DEFAULT 0,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"tipe" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinic_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_klinik" text NOT NULL,
	"alamat" text,
	"no_hp" text,
	"email" text,
	"jam_buka" jsonb DEFAULT '[]',
	"logo_url" text,
	"footer_struk" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" date NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_counters_tanggal_unique" UNIQUE("tanggal")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dokter_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"no_str" text,
	"spesialisasi" text,
	"bio" text,
	"jadwal_praktik" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kategori" text NOT NULL,
	"deskripsi" text NOT NULL,
	"jumlah" numeric(12, 2) NOT NULL,
	"tgl_pengeluaran" date NOT NULL,
	"foto_struk" text,
	"staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inpatient_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inpatient_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now(),
	"kondisi" text,
	"berat" numeric(5, 2),
	"suhu" numeric(4, 1),
	"nafsu_makan" text,
	"catatan_kondisi" text,
	"tindakan_hari_ini" text,
	"obat_hari_ini" text,
	"foto_urls" jsonb DEFAULT '[]',
	"is_visible_customer" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inpatients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"dokter_id" uuid NOT NULL,
	"medical_record_id" uuid,
	"no_kandang" text NOT NULL,
	"tgl_masuk" timestamp with time zone DEFAULT now(),
	"tgl_keluar" timestamp with time zone,
	"diagnosis_awal" text,
	"tindakan_awal" text,
	"status" text DEFAULT 'aktif',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"dokter_id" uuid NOT NULL,
	"appointment_id" uuid,
	"tanggal" timestamp with time zone DEFAULT now(),
	"berat_saat_periksa" numeric(5, 2),
	"suhu" numeric(4, 1),
	"keluhan" text,
	"anamnesis" text,
	"diagnosis" text NOT NULL,
	"tindakan" text,
	"resep" jsonb,
	"catatan_followup" text,
	"is_visible_customer" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"customer_id" uuid,
	"nama_guest" text,
	"no_hp_guest" text,
	"nama_hewan" text NOT NULL,
	"spesies" text NOT NULL,
	"keluhan" text,
	"status" text DEFAULT 'menunggu',
	"alasan_tolak" text,
	"appointment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pet_vaccines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"nama_vaksin" text NOT NULL,
	"tgl_vaksin" date NOT NULL,
	"tgl_berikutnya" date,
	"dokter_id" uuid,
	"keterangan" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"nama" text NOT NULL,
	"spesies" text NOT NULL,
	"ras" text,
	"jenis_kelamin" text,
	"tgl_lahir" date,
	"berat_kg" numeric(5, 2),
	"warna" text,
	"ciri_khas" text,
	"foto" text,
	"status" text DEFAULT 'aktif',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"kode_produk" text NOT NULL,
	"nama" text NOT NULL,
	"deskripsi" text,
	"foto" text,
	"harga_beli" numeric(12, 2) DEFAULT '0',
	"harga_jual" numeric(12, 2) NOT NULL,
	"stok" integer DEFAULT 0,
	"stok_minimum" integer DEFAULT 5,
	"satuan" text DEFAULT 'pcs',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_kode_produk_unique" UNIQUE("kode_produk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"nama_lengkap" text NOT NULL,
	"no_hp" text,
	"alamat" text,
	"foto_profil" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"nama" text NOT NULL,
	"deskripsi" text,
	"harga" numeric(12, 2) NOT NULL,
	"durasi_menit" integer,
	"dokter_required" boolean DEFAULT false,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_mutations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"tipe" text,
	"qty_sebelum" integer NOT NULL,
	"qty_perubahan" integer NOT NULL,
	"qty_sesudah" integer NOT NULL,
	"referensi" text,
	"catatan" text,
	"staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"tipe_item" text,
	"product_id" uuid,
	"service_id" uuid,
	"nama_item" text NOT NULL,
	"harga_satuan" numeric(12, 2) NOT NULL,
	"qty" integer NOT NULL,
	"diskon_item" numeric(12, 2) DEFAULT '0',
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"no_transaksi" text NOT NULL,
	"customer_id" uuid,
	"kasir_id" uuid NOT NULL,
	"tgl_transaksi" timestamp with time zone DEFAULT now(),
	"subtotal" numeric(12, 2) NOT NULL,
	"diskon_nominal" numeric(12, 2) DEFAULT '0',
	"total" numeric(12, 2) NOT NULL,
	"metode_bayar" text,
	"uang_diterima" numeric(12, 2),
	"kembalian" numeric(12, 2),
	"status" text DEFAULT 'lunas',
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "transactions_no_transaksi_unique" UNIQUE("no_transaksi")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_dokter_id_profiles_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_dokter_id_profiles_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dokter_profiles" ADD CONSTRAINT "dokter_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_staff_id_profiles_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inpatient_logs" ADD CONSTRAINT "inpatient_logs_inpatient_id_inpatients_id_fk" FOREIGN KEY ("inpatient_id") REFERENCES "public"."inpatients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inpatient_logs" ADD CONSTRAINT "inpatient_logs_staff_id_profiles_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inpatients" ADD CONSTRAINT "inpatients_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inpatients" ADD CONSTRAINT "inpatients_dokter_id_profiles_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inpatients" ADD CONSTRAINT "inpatients_medical_record_id_medical_records_id_fk" FOREIGN KEY ("medical_record_id") REFERENCES "public"."medical_records"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_dokter_id_profiles_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online_bookings" ADD CONSTRAINT "online_bookings_slot_id_booking_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."booking_slots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online_bookings" ADD CONSTRAINT "online_bookings_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online_bookings" ADD CONSTRAINT "online_bookings_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pet_vaccines" ADD CONSTRAINT "pet_vaccines_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pet_vaccines" ADD CONSTRAINT "pet_vaccines_dokter_id_profiles_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_staff_id_profiles_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_kasir_id_profiles_id_fk" FOREIGN KEY ("kasir_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
