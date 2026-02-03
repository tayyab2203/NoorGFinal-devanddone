"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ADMIN_ROUTES, COLORS, PAYMENT_METHOD } from "@/lib/constants";
import { useUpdateAdminProfile } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const updateProfile = useUpdateAdminProfile();
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
  }, [session?.user?.email]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    try {
      const res = await updateProfile.mutateAsync({
        email: email.trim(),
        currentPassword: currentPassword.trim() || undefined,
      });
      setEmailSuccess(res.message);
      setEmail(res.email);
      setCurrentPassword("");
      await updateSession?.({ user: { ...session?.user, email: res.email } });
    } catch (e) {
      setEmailError(getApiErrorMessage(e));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!currentPassword.trim()) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    try {
      const res = await updateProfile.mutateAsync({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPasswordError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Settings</h1>

      <div className="rounded-xl border border-[#eee] bg-white p-6">
        <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>Admin profile</h2>
        <div className="mt-4 flex items-center gap-4">
          {session?.user?.image ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
              <Image src={session.user.image} alt="" fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-xl font-semibold" style={{ color: COLORS.goldAccent }}>
              {session?.user?.name?.charAt(0) ?? "?"}
            </div>
          )}
          <div>
            <p className="font-semibold" style={{ color: COLORS.primaryDark }}>{session?.user?.name ?? "—"}</p>
            <p className="text-sm text-[#333333]/70">{session?.user?.email ?? "—"}</p>
            <p className="text-xs text-[#333333]/60">Role: {(session?.user as { role?: string })?.role ?? "—"}</p>
          </div>
        </div>

        {/* Change Email */}
        <div className="mt-6 border-t border-[#eee] pt-6">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: COLORS.primaryDark }}>Change email</h3>
          <form onSubmit={handleEmailSubmit} className="flex flex-wrap gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="New email"
              className="max-w-xs border-[#ddd]"
              required
            />
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password (leave blank if you sign in with Google)"
              className="max-w-xs border-[#ddd]"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              disabled={updateProfile.isLoading}
              style={{ backgroundColor: COLORS.goldAccent, color: COLORS.primaryDark }}
            >
              {updateProfile.isLoading ? "Updating…" : "Update email"}
            </Button>
          </form>
          {emailError && (
            <p className="mt-2 text-sm text-red-600" role="alert">{emailError}</p>
          )}
          {emailSuccess && (
            <p className="mt-2 text-sm text-green-700" role="status">{emailSuccess}</p>
          )}
        </div>

        {/* Change Password */}
        <div className="mt-6 border-t border-[#eee] pt-6">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: COLORS.primaryDark }}>Change password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="border-[#ddd]"
              autoComplete="current-password"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="border-[#ddd]"
              autoComplete="new-password"
              minLength={6}
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="border-[#ddd]"
              autoComplete="new-password"
            />
            <Button
              type="submit"
              disabled={updateProfile.isLoading}
              style={{ backgroundColor: COLORS.goldAccent, color: COLORS.primaryDark }}
            >
              {updateProfile.isLoading ? "Updating…" : "Update password"}
            </Button>
          </form>
          {passwordError && (
            <p className="mt-2 text-sm text-red-600" role="alert">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="mt-2 text-sm text-green-700" role="status">{passwordSuccess}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#eee] bg-white p-6">
        <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>Payment methods (mock)</h2>
        <p className="mt-2 text-sm text-[#333333]/70">Payments are simulated. No real gateway is connected.</p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 rounded-lg border border-[#eee] px-4 py-3">
            <span className="font-medium" style={{ color: COLORS.primaryDark }}>Easypaisa</span>
            <span className="text-xs text-[#333333]/60">({PAYMENT_METHOD.EASYPAISA})</span>
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-[#eee] px-4 py-3">
            <span className="font-medium" style={{ color: COLORS.primaryDark }}>JazzCash</span>
            <span className="text-xs text-[#333333]/60">({PAYMENT_METHOD.JAZZCASH})</span>
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-[#eee] px-4 py-3">
            <span className="font-medium" style={{ color: COLORS.primaryDark }}>Bank Transfer</span>
            <span className="text-xs text-[#333333]/60">({PAYMENT_METHOD.BANK_TRANSFER})</span>
          </li>
        </ul>
        <p className="mt-4 rounded-lg bg-[#F5F3EE] px-4 py-2 text-sm text-[#333333]/80">Mock mode: reference numbers are generated; status can be updated from order detail.</p>
      </div>

      <div className="rounded-xl border border-[#eee] bg-white p-6">
        <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>Site settings</h2>
        <p className="mt-2 text-sm text-[#333333]/70">Store name, contact email, and other site settings can be added here in a future update.</p>
      </div>
    </div>
  );
}
