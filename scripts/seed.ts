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
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { connectDB } from "../src/lib/db/mongodb";
import { User, Product, Collection } from "../src/lib/db/models";
import { USER_ROLE } from "../src/lib/constants";
import { PRODUCT_STATUS } from "../src/lib/constants";
import { MOCK_PRODUCTS, MOCK_COLLECTIONS, COLLECTION_PRODUCT_IDS } from "../src/lib/mockData";

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

  const productCount = await Product.countDocuments();
  if (productCount === 0 && MOCK_PRODUCTS.length > 0) {
    const idMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const p of MOCK_PRODUCTS) {
      const doc = await Product.create({
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice ?? null,
        material: p.material,
        rating: p.rating,
        SKU: p.SKU,
        status: p.status ?? PRODUCT_STATUS.ACTIVE,
        categoryId: p.categoryId ?? "",
        images: p.images ?? [],
        variants: p.variants ?? [],
      });
      idMap[p.id] = doc._id;
    }
    console.log("Seeded", Object.keys(idMap).length, "products");

    const collectionCount = await Collection.countDocuments();
    if (collectionCount === 0 && MOCK_COLLECTIONS.length > 0) {
      for (const c of MOCK_COLLECTIONS) {
        const productIds = (COLLECTION_PRODUCT_IDS as Record<string, string[]>)[c.slug] ?? [];
        const refs = productIds.map((oldId) => idMap[oldId]).filter(Boolean);
        await Collection.create({
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
          displayOrder: c.displayOrder,
          productIds: refs,
        });
      }
      console.log("Seeded", MOCK_COLLECTIONS.length, "collections");
    }
  } else {
    console.log("Products already present or no mock data, skipping product/collection seed.");
  }

  console.log("Seed done.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
