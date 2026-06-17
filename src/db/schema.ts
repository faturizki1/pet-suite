import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  numeric,
  integer,
  jsonb,
  time,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// TABLE: profiles
// ============================================
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  namaLengkap: text("nama_lengkap").notNull(),
  noHp: text("no_hp"),
  alamat: text("alamat"),
  fotoProfil: text("foto_profil"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: dokter_profiles
// ============================================
export const dokterProfiles = pgTable("dokter_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  noStr: text("no_str"),
  spesialisasi: text("spesialisasi"),
  bio: text("bio"),
  jadwalPraktik: jsonb("jadwal_praktik").default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: pets
// ============================================
export const pets = pgTable("pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  nama: text("nama").notNull(),
  spesies: text("spesies").notNull(),
  ras: text("ras"),
  jenisKelamin: text("jenis_kelamin"),
  tglLahir: date("tgl_lahir"),
  beratKg: numeric("berat_kg", { precision: 5, scale: 2 }),
  warna: text("warna"),
  ciriKhas: text("ciri_khas"),
  foto: text("foto"),
  status: text("status").default("aktif"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: pet_vaccines
// ============================================
export const petVaccines = pgTable("pet_vaccines", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  namaVaksin: text("nama_vaksin").notNull(),
  tglVaksin: date("tgl_vaksin").notNull(),
  tglBerikutnya: date("tgl_berikutnya"),
  dokterId: uuid("dokter_id").references(() => profiles.id),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: categories
// ============================================
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: text("nama").notNull(),
  tipe: text("tipe"),
});

// ============================================
// TABLE: products
// ============================================
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  kodeProduk: text("kode_produk").unique().notNull(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  foto: text("foto"),
  hargaBeli: numeric("harga_beli", { precision: 12, scale: 2 }).default("0"),
  hargaJual: numeric("harga_jual", { precision: 12, scale: 2 }).notNull(),
  stok: integer("stok").default(0),
  stokMinimum: integer("stok_minimum").default(5),
  satuan: text("satuan").default("pcs"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: services
// ============================================
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  harga: numeric("harga", { precision: 12, scale: 2 }).notNull(),
  durasiMenit: integer("durasi_menit"),
  dokterRequired: boolean("dokter_required").default(false),
  isActive: boolean("is_active").default(true),
});

// ============================================
// TABLE: appointments
// ============================================
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id),
  dokterId: uuid("dokter_id").references(() => profiles.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => profiles.id),
  tglJanji: timestamp("tgl_janji", { withTimezone: true }).notNull(),
  jenis: text("jenis"),
  status: text("status").default("pending"),
  keluhan: text("keluhan"),
  catatanStaff: text("catatan_staff"),
  sumber: text("sumber").default("langsung"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: medical_records
// ============================================
export const medicalRecords = pgTable("medical_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id),
  dokterId: uuid("dokter_id")
    .notNull()
    .references(() => profiles.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  tanggal: timestamp("tanggal", { withTimezone: true }).defaultNow(),
  beratSaatPeriksa: numeric("berat_saat_periksa", { precision: 5, scale: 2 }),
  suhu: numeric("suhu", { precision: 4, scale: 1 }),
  keluhan: text("keluhan"),
  anamnesis: text("anamnesis"),
  diagnosis: text("diagnosis").notNull(),
  tindakan: text("tindakan"),
  resep: jsonb("resep"),
  catatanFollowup: text("catatan_followup"),
  isVisibleCustomer: boolean("is_visible_customer").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: inpatients
// ============================================
export const inpatients = pgTable("inpatients", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id),
  dokterId: uuid("dokter_id")
    .notNull()
    .references(() => profiles.id),
  medicalRecordId: uuid("medical_record_id").references(
    () => medicalRecords.id
  ),
  noKandang: text("no_kandang").notNull(),
  tglMasuk: timestamp("tgl_masuk", { withTimezone: true }).defaultNow(),
  tglKeluar: timestamp("tgl_keluar", { withTimezone: true }),
  diagnosisAwal: text("diagnosis_awal"),
  tindakanAwal: text("tindakan_awal"),
  status: text("status").default("aktif"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: inpatient_logs
// ============================================
export const inpatientLogs = pgTable("inpatient_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  inpatientId: uuid("inpatient_id")
    .notNull()
    .references(() => inpatients.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => profiles.id),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  kondisi: text("kondisi"),
  berat: numeric("berat", { precision: 5, scale: 2 }),
  suhu: numeric("suhu", { precision: 4, scale: 1 }),
  nafsuMakan: text("nafsu_makan"),
  catatanKondisi: text("catatan_kondisi"),
  tindakanHariIni: text("tindakan_hari_ini"),
  obatHariIni: text("obat_hari_ini"),
  fotoUrls: jsonb("foto_urls").default("[]"),
  isVisibleCustomer: boolean("is_visible_customer").default(true),
});

// ============================================
// TABLE: transactions
// ============================================
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  noTransaksi: text("no_transaksi").unique().notNull(),
  customerId: uuid("customer_id").references(() => profiles.id),
  kasirId: uuid("kasir_id")
    .notNull()
    .references(() => profiles.id),
  tglTransaksi: timestamp("tgl_transaksi", { withTimezone: true }).defaultNow(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  diskonNominal: numeric("diskon_nominal", {
    precision: 12,
    scale: 2,
  }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  metodeBayar: text("metode_bayar"),
  uangDiterima: numeric("uang_diterima", { precision: 12, scale: 2 }),
  kembalian: numeric("kembalian", { precision: 12, scale: 2 }),
  status: text("status").default("lunas"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: transaction_items
// ============================================
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  tipeItem: text("tipe_item"),
  productId: uuid("product_id").references(() => products.id),
  serviceId: uuid("service_id").references(() => services.id),
  namaItem: text("nama_item").notNull(),
  hargaSatuan: numeric("harga_satuan", {
    precision: 12,
    scale: 2,
  }).notNull(),
  qty: integer("qty").notNull(),
  diskonItem: numeric("diskon_item", { precision: 12, scale: 2 }).default("0"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// ============================================
// TABLE: stock_mutations
// ============================================
export const stockMutations = pgTable("stock_mutations", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  tipe: text("tipe"),
  qtySebelum: integer("qty_sebelum").notNull(),
  qtyPerubahan: integer("qty_perubahan").notNull(),
  qtySesudah: integer("qty_sesudah").notNull(),
  referensi: text("referensi"),
  catatan: text("catatan"),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: expenses
// ============================================
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  kategori: text("kategori").notNull(),
  deskripsi: text("deskripsi").notNull(),
  jumlah: numeric("jumlah", { precision: 12, scale: 2 }).notNull(),
  tglPengeluaran: date("tgl_pengeluaran").notNull(),
  fotoStruk: text("foto_struk"),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: booking_slots
// ============================================
export const bookingSlots = pgTable("booking_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  dokterId: uuid("dokter_id").references(() => profiles.id),
  tanggal: date("tanggal").notNull(),
  jamMulai: time("jam_mulai").notNull(),
  jamSelesai: time("jam_selesai").notNull(),
  kuota: integer("kuota").default(1),
  terisi: integer("terisi").default(0),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: online_bookings
// ============================================
export const onlineBookings = pgTable("online_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id")
    .notNull()
    .references(() => bookingSlots.id),
  customerId: uuid("customer_id").references(() => profiles.id),
  namaGuest: text("nama_guest"),
  noHpGuest: text("no_hp_guest"),
  namaHewan: text("nama_hewan").notNull(),
  spesies: text("spesies").notNull(),
  keluhan: text("keluhan"),
  status: text("status").default("menunggu"),
  alasanTolak: text("alasan_tolak"),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// TABLE: daily_counters (untuk no_transaksi row lock)
// ============================================
export const dailyCounters = pgTable("daily_counters", {
  id: uuid("id").primaryKey().defaultRandom(),
  tanggal: date("tanggal").notNull().unique(),
  counter: integer("counter").default(0).notNull(),
});

// ============================================
// TABLE: clinic_info
// ============================================
export const clinicInfo = pgTable("clinic_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  namaKlinik: text("nama_klinik").notNull(),
  alamat: text("alamat"),
  noHp: text("no_hp"),
  email: text("email"),
  jamBuka: jsonb("jam_buka").default("[]"),
  logoUrl: text("logo_url"),
  footerStruk: text("footer_struk"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  dokterProfile: one(dokterProfiles, {
    fields: [profiles.id],
    references: [dokterProfiles.userId],
  }),
  pets: many(pets, { relationName: "owner" }),
  appointmentsAsDokter: many(appointments, { relationName: "dokter" }),
  appointmentsAsCustomer: many(appointments, { relationName: "customer" }),
  medicalRecords: many(medicalRecords, { relationName: "dokter" }),
  inpatientsAsDokter: many(inpatients, { relationName: "dokter" }),
  inpatientLogs: many(inpatientLogs, { relationName: "staff" }),
  transactionsAsKasir: many(transactions, { relationName: "kasir" }),
  transactionsAsCustomer: many(transactions, { relationName: "customer" }),
  stockMutations: many(stockMutations, { relationName: "staff" }),
  expenses: many(expenses, { relationName: "staff" }),
  bookingSlots: many(bookingSlots, { relationName: "dokter" }),
  onlineBookings: many(onlineBookings, { relationName: "customer" }),
  petVaccines: many(petVaccines, { relationName: "dokter" }),
}));

export const dokterProfilesRelations = relations(dokterProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [dokterProfiles.userId],
    references: [profiles.id],
  }),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [pets.ownerId],
    references: [profiles.id],
    relationName: "owner",
  }),
  vaccines: many(petVaccines),
  appointments: many(appointments),
  medicalRecords: many(medicalRecords),
  inpatients: many(inpatients),
}));

export const petVaccinesRelations = relations(petVaccines, ({ one }) => ({
  pet: one(pets, {
    fields: [petVaccines.petId],
    references: [pets.id],
  }),
  dokter: one(profiles, {
    fields: [petVaccines.dokterId],
    references: [profiles.id],
    relationName: "dokter",
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  services: many(services),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  transactionItems: many(transactionItems),
  stockMutations: many(stockMutations),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  transactionItems: many(transactionItems),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  pet: one(pets, {
    fields: [appointments.petId],
    references: [pets.id],
  }),
  dokter: one(profiles, {
    fields: [appointments.dokterId],
    references: [profiles.id],
    relationName: "dokter",
  }),
  customer: one(profiles, {
    fields: [appointments.customerId],
    references: [profiles.id],
    relationName: "customer",
  }),
  medicalRecord: one(medicalRecords, {
    fields: [appointments.id],
    references: [medicalRecords.appointmentId],
  }),
  onlineBooking: one(onlineBookings, {
    fields: [appointments.id],
    references: [onlineBookings.appointmentId],
  }),
}));

export const medicalRecordsRelations = relations(
  medicalRecords,
  ({ one }) => ({
    pet: one(pets, {
      fields: [medicalRecords.petId],
      references: [pets.id],
    }),
    dokter: one(profiles, {
      fields: [medicalRecords.dokterId],
      references: [profiles.id],
      relationName: "dokter",
    }),
    appointment: one(appointments, {
      fields: [medicalRecords.appointmentId],
      references: [appointments.id],
    }),
    inpatient: one(inpatients, {
      fields: [medicalRecords.id],
      references: [inpatients.medicalRecordId],
    }),
  })
);

export const inpatientsRelations = relations(inpatients, ({ one, many }) => ({
  pet: one(pets, {
    fields: [inpatients.petId],
    references: [pets.id],
  }),
  dokter: one(profiles, {
    fields: [inpatients.dokterId],
    references: [profiles.id],
    relationName: "dokter",
  }),
  medicalRecord: one(medicalRecords, {
    fields: [inpatients.medicalRecordId],
    references: [medicalRecords.id],
  }),
  logs: many(inpatientLogs),
}));

export const inpatientLogsRelations = relations(inpatientLogs, ({ one }) => ({
  inpatient: one(inpatients, {
    fields: [inpatientLogs.inpatientId],
    references: [inpatients.id],
  }),
  staff: one(profiles, {
    fields: [inpatientLogs.staffId],
    references: [profiles.id],
    relationName: "staff",
  }),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    customer: one(profiles, {
      fields: [transactions.customerId],
      references: [profiles.id],
      relationName: "customer",
    }),
    kasir: one(profiles, {
      fields: [transactions.kasirId],
      references: [profiles.id],
      relationName: "kasir",
    }),
    items: many(transactionItems),
  })
);

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
    product: one(products, {
      fields: [transactionItems.productId],
      references: [products.id],
    }),
    service: one(services, {
      fields: [transactionItems.serviceId],
      references: [services.id],
    }),
  })
);

export const stockMutationsRelations = relations(stockMutations, ({ one }) => ({
  product: one(products, {
    fields: [stockMutations.productId],
    references: [products.id],
  }),
  staff: one(profiles, {
    fields: [stockMutations.staffId],
    references: [profiles.id],
    relationName: "staff",
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  staff: one(profiles, {
    fields: [expenses.staffId],
    references: [profiles.id],
    relationName: "staff",
  }),
}));

export const bookingSlotsRelations = relations(bookingSlots, ({ one, many }) => ({
  dokter: one(profiles, {
    fields: [bookingSlots.dokterId],
    references: [profiles.id],
    relationName: "dokter",
  }),
  onlineBookings: many(onlineBookings),
}));

export const onlineBookingsRelations = relations(onlineBookings, ({ one }) => ({
  slot: one(bookingSlots, {
    fields: [onlineBookings.slotId],
    references: [bookingSlots.id],
  }),
  customer: one(profiles, {
    fields: [onlineBookings.customerId],
    references: [profiles.id],
    relationName: "customer",
  }),
  appointment: one(appointments, {
    fields: [onlineBookings.appointmentId],
    references: [appointments.id],
  }),
}));