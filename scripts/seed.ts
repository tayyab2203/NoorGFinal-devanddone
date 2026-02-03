/**
 * Seed script: create admin user (email + password) and optionally seed products/collections.
 * Run: npm run seed
 * Requires: MONGODB_URI (or DATABASE_URL), ADMIN_EMAIL, ADMIN_PASSWORD for admin login.
 * Loads .env.local then .env so local overrides work.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();
import { hash } from "bcryptjs";
import { connectDB } from "../src/lib/db/mongodb";
import { User } from "../src/lib/db/models";
import { USER_ROLE } from "../src/lib/constants";

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? "";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

async function seed() {
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI or DATABASE_URL");
    process.exit(1);
  }

  await connectDB();
  console.log("Connected to MongoDB");

  if (ADMIN_EMAIL) {
    const update: { role: string; passwordHash?: string; name?: string; image?: null } = {
      role: USER_ROLE.ADMIN,
    };
    if (ADMIN_PASSWORD.length >= 8) {
      update.passwordHash = await hash(ADMIN_PASSWORD, 10);
    } else {
      console.warn("ADMIN_PASSWORD not set or too short (min 8). Admin will need to set password via DB or re-seed.");
    }
    const user = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: update,
        $setOnInsert: { name: "Admin", image: null },
      },
      { new: true, upsert: true }
    );
    console.log("Admin user set:", user.email, "role:", user.role, update.passwordHash ? "(password set)" : "(no password)");
  } else {
    console.log("Set ADMIN_EMAIL and ADMIN_PASSWORD in env to create an admin user.");
  }

  console.log("Seed done. Add products and collections via the Admin panel.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
