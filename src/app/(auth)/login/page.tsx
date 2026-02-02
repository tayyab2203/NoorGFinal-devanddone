"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/shared/LoginForm";
import Link from "next/link";

function LoginContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#333333]">Sign in</h1>
      <p className="text-sm text-[#333333]/70">
        Sign in with Google to access your account, orders, and wishlist.
      </p>
      <LoginForm />
      <p className="text-center text-sm text-[#333333]/70">
        <Link href="/admin/login" className="font-medium text-[#C4A747] hover:underline">
          Admin sign in
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-[#333333]/70">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
