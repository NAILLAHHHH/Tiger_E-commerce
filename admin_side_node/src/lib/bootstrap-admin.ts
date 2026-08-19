import bcrypt from "bcryptjs";
import { prisma } from "../db.js";

export function bootstrapAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || "admin@tygamart.com").toLowerCase().trim();
}

/**
 * Ensures the permanent owner account exists and matches ADMIN_EMAIL / ADMIN_PASSWORD.
 * Safe to run on every boot — use strong values in production env.
 */
export async function ensureBootstrapAdmin() {
  const email = bootstrapAdminEmail();
  const password = process.env.ADMIN_PASSWORD || "change-me-owner-password";
  const hash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hash,
      name: process.env.ADMIN_NAME || "TygaMart Owner",
      isOwner: true,
    },
    update: {
      passwordHash: hash,
      isOwner: true,
      name: process.env.ADMIN_NAME || "TygaMart Owner",
    },
  });

  // Only one owner: clear flag on anyone else
  await prisma.adminUser.updateMany({
    where: { email: { not: email }, isOwner: true },
    data: { isOwner: false },
  });

  return { email };
}
