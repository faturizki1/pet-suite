import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function assertActiveUser(userId: string) {
  const user = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
  if (!user || !user.isActive) {
    throw new Error("UNAUTHORIZED_INACTIVE");
  }
  return user;
}