"use client";

import { useSession } from "next-auth/react";
import { User, Shield, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GOLD = "#C4A747";

export default function AccountSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#333333] md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-[#333333]/70">
          Manage your account preferences and security.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-[#eee] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" style={{ color: GOLD }} />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#333333]/80">
            <p className="font-medium text-[#333333]">{session?.user?.name ?? "—"}</p>
            <p className="mt-1">{session?.user?.email ?? "—"}</p>
            <p className="mt-2 text-[#333333]/60">
              Profile details are managed through your sign-in provider.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#eee] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" style={{ color: GOLD }} />
              Email & notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#333333]/80">
            <p className="text-[#333333]/60">
              Notification preferences can be added here in a future update.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#eee] shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" style={{ color: GOLD }} />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#333333]/80">
            <p className="text-[#333333]/60">
              You signed in with your existing account. Password and security
              options are managed by your authentication provider.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
