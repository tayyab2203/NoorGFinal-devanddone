import { hash, compare } from "bcryptjs";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models";
import { successAdmin, error } from "@/lib/api/response";
import { requireAdmin, getSession } from "@/lib/auth-server";
import mongoose from "mongoose";

/** PATCH /api/admin/profile - Update logged-in admin's email and/or password */
export async function PATCH(request: Request) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return error("Unauthorized", 401);
  }

  let body: { email?: string; currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON", 400);
  }

  const { email: newEmail, currentPassword, newPassword } = body;
  const wantsEmailChange = typeof newEmail === "string" && newEmail.trim().length > 0;
  const wantsPasswordChange = typeof newPassword === "string" && newPassword.trim().length > 0;

  if (!wantsEmailChange && !wantsPasswordChange) {
    return error("Provide email and/or newPassword to update", 400);
  }

  if (wantsPasswordChange) {
    if (!currentPassword || typeof currentPassword !== "string") {
      return error("Current password is required to change password", 400);
    }
    if (newPassword!.length < 6) {
      return error("New password must be at least 6 characters", 400);
    }
  }

  if (wantsEmailChange) {
    const trimmed = newEmail!.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return error("Invalid email format", 400);
    }
  }

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return error("User not found", 404);
    if (user.role !== "ADMIN") return error("Forbidden", 403);

    const hashVal = (user as { passwordHash?: string | null }).passwordHash;

    // Google sign-in users have no password: allow email-only update; block password change
    if (!hashVal && wantsPasswordChange) {
      return error("Admin account uses Google sign-in; password change not available", 400);
    }

    if (hashVal && wantsPasswordChange) {
      const match = await compare(currentPassword!, hashVal);
      if (!match) return error("Current password is incorrect", 400);
    }
    if (hashVal && wantsEmailChange) {
      if (!currentPassword?.trim()) return error("Current password is required to change email", 400);
      const match = await compare(currentPassword, hashVal);
      if (!match) return error("Current password is incorrect", 400);
    }

    if (wantsEmailChange) {
      const existing = await User.findOne({
        email: newEmail!.trim().toLowerCase(),
        _id: { $ne: new mongoose.Types.ObjectId(userId) },
      });
      if (existing) return error("Email is already in use", 400);
      user.email = newEmail!.trim().toLowerCase();
    }

    if (wantsPasswordChange && hashVal) {
      (user as { passwordHash: string }).passwordHash = await hash(newPassword!, 10);
    }

    await user.save();

    return successAdmin({
      email: user.email,
      message: wantsEmailChange && wantsPasswordChange
        ? "Email and password updated"
        : wantsEmailChange
          ? "Email updated"
          : "Password updated",
    });
  } catch (e) {
    console.error("[api/admin/profile] PATCH:", e);
    return error("Failed to update profile", 500);
  }
}
