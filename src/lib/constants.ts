export const ROLES = {
  OWNER: "owner",
  DOKTER: "dokter",
  STAFF: "staff",
  CUSTOMER: "customer",
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  KONFIRMASI: "konfirmasi",
  SELESAI: "selesai",
  BATAL: "batal",
} as const;

export const INPATIENT_STATUS = {
  AKTIF: "aktif",
  SEMBUH: "sembuh",
  DIRUJUK: "dirujuk",
  MENINGGAL: "meninggal",
} as const;

export const KONDISI_HEWAN = {
  KRITIS: "kritis",
  LEMAH: "lemah",
  STABIL: "stabil",
  BAIK: "baik",
  SANGAT_BAIK: "sangat_baik",
} as const;

export const METODE_BAYAR = {
  TUNAI: "tunai",
  TRANSFER: "transfer",
  QRIS: "qris",
  DEBIT: "debit",
} as const;

export const TRANSACTION_STATUS = {
  DRAFT: "draft",
  LUNAS: "lunas",
  BATAL: "batal",
} as const;

export const BOOKING_STATUS = {
  MENUNGGU: "menunggu",
  DIKONFIRMASI: "dikonfirmasi",
  DITOLAK: "ditolak",
  SELESAI: "selesai",
} as const;

export const UPLOAD_CONFIG = {
  MAX_SIZE_MB: 5,
  MAX_FILES: 5,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  BUCKET: "clinic-uploads",
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SPESIES_OPTIONS = [
  "Kucing",
  "Anjing",
  "Kelinci",
  "Hamster",
  "Burung",
  "Ikan",
  "Reptil",
  "Lainnya",
] as const;

export const SESSION_CONFIG = {
  COOKIE_NAME: "vetcare_session",
  EXPIRY_DAYS: 30,
} as const;