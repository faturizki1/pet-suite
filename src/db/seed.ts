import { db } from "./client";
import { profiles, clinicInfo } from "./schema";
import { hashPassword } from "@/lib/auth/password";

async function seed() {
  console.log("Seeding database...");

  // Create default owner
  const passwordHash = await hashPassword("admin123");
  const [owner] = await db
    .insert(profiles)
    .values({
      email: "admin@vetcare.com",
      passwordHash,
      role: "owner",
      namaLengkap: "Admin Klinik",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  if (owner) {
    console.log(`Owner created: ${owner.email}`);
  } else {
    console.log("Owner already exists, skipped");
  }

  // Create default clinic info
  const existing = await db.query.clinicInfo.findFirst();
  if (!existing) {
    await db.insert(clinicInfo).values({
      namaKlinik: "VetCare Klinik Hewan",
      alamat: "Jl. Contoh No. 123",
      noHp: "08123456789",
      email: "info@vetcare.com",
      jamBuka: JSON.stringify([
        { hari: "Senin", jam_mulai: "08:00", jam_selesai: "17:00" },
        { hari: "Selasa", jam_mulai: "08:00", jam_selesai: "17:00" },
        { hari: "Rabu", jam_mulai: "08:00", jam_selesai: "17:00" },
        { hari: "Kamis", jam_mulai: "08:00", jam_selesai: "17:00" },
        { hari: "Jumat", jam_mulai: "08:00", jam_selesai: "17:00" },
        { hari: "Sabtu", jam_mulai: "08:00", jam_selesai: "14:00" },
      ]),
      footerStruk: "Terima kasih telah mempercayakan kesehatan hewan Anda kepada kami.",
    });
    console.log("Clinic info created");
  }

  console.log("Seed complete!");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));