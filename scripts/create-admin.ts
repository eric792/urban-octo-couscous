/* Creates an admin account, or resets the password of an existing one.
 * Usage:  npm run admin:create -- owner@zenamour.co.za "a-long-strong-password" "Owner Name" */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const [emailArg, password, fullName = "Zen Amour Admin"] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !password) {
    throw new Error('Usage: npm run admin:create -- you@example.co.za "strong-password" "Your Name"');
  }
  if (password.length < 12) throw new Error("Use a password of at least 12 characters.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, passwordHash, fullName, role: "ADMIN" },
  });
  console.log(`Admin ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
