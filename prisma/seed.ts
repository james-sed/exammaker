import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_EMAIL = process.env.SEED_EMAIL ?? "demo@exammaker.app";
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "password123";

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: "Demo User",
      email: DEMO_EMAIL,
      password,
    },
  });

  console.log(`Ensured demo user: ${user.email}`);
  console.log("Sign in with the demo credentials from SEED_EMAIL / SEED_PASSWORD.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
