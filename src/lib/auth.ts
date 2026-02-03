import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/lib/constants";

// Extend Session (global augmentation)
declare module "next-auth" {
  interface Session {
    user: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
    accessToken?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    sub?: string;
  }
}

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const { connectDB } = await import("@/lib/db/mongodb");
          const { User } = await import("@/lib/db/models");
          await connectDB();
          const email = (credentials.email as string).trim().toLowerCase();
          const raw = await User.findOne({ email }).lean();
          type UserDoc = { _id: { toString: () => string }; email?: string; name?: string; image?: string | null; role?: string; passwordHash?: string | null };
          const dbUser = raw as unknown as UserDoc | null;
          if (!dbUser || dbUser.role !== USER_ROLE.ADMIN) return null;
          const hash = dbUser.passwordHash;
          if (!hash) return null;
          const match = await compare(credentials.password as string, hash);
          if (!match) return null;
          return {
            id: dbUser._id.toString(),
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
            role: dbUser.role,
          };
        } catch (e) {
          console.error("[auth] Credentials authorize error:", e);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: import("@auth/core/jwt").JWT;
      user?: import("next-auth").User;
      account?: import("next-auth").Account | null;
    }) {
      if (user) {
        if (account?.provider === "credentials") {
          token.id = (user as { id?: string }).id;
          token.role = (user as { role?: string }).role ?? USER_ROLE.ADMIN;
          return token;
        }
        if (account?.provider === "google") {
          try {
            const { connectDB } = await import("@/lib/db/mongodb");
            const { User } = await import("@/lib/db/models");
            await connectDB();
            const email = (user?.email ?? "").toString().toLowerCase();
            let dbUser = await User.findOne({ email });
            if (!dbUser) {
              const u = user as { name?: string; image?: string | null };
            dbUser = await User.create({
                name: u.name ?? "User",
                email,
                image: u.image ?? null,
                role: USER_ROLE.CUSTOMER,
              });
            }
            token.id = dbUser._id.toString();
            token.role = dbUser.role === USER_ROLE.ADMIN ? USER_ROLE.CUSTOMER : dbUser.role;
          } catch (e) {
            console.error("[auth] DB sync error:", e);
            token.id = token.sub ?? undefined;
            token.role = USER_ROLE.CUSTOMER;
          }
        }
      }
      return token;
    },
    session({
      session,
      token,
    }: {
      session: import("next-auth").Session;
      token: import("@auth/core/jwt").JWT;
    }) {
      if (session.user) {
        const id = token.id ?? token.sub;
        (session.user as { id?: string | null }).id =
          typeof id === "string" ? id : null;
        session.user.role = (token.role as string) ?? USER_ROLE.CUSTOMER;
      }
      session.accessToken = token as unknown as string;
      return session;
    },
    redirect({ url, baseUrl }: { url?: string; baseUrl: string }) {
      if (url && url.startsWith("/")) return `${baseUrl}${url}`;
      if (url && new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/account`;
    },
    authorized({
      auth,
      request,
    }: {
      auth: import("next-auth").Session | null;
      request: { nextUrl: { pathname: string }; url: string };
    }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/account")) {
        return !!auth?.user;
      }
      // Allow unauthenticated access to admin login page
      if (pathname === "/admin/login") {
        return true;
      }
      if (pathname.startsWith("/admin")) {
        if (!auth?.user) return false;
        const role = (auth.user as { role?: string }).role;
        if (role !== USER_ROLE.ADMIN) {
          return NextResponse.redirect(
            new URL("/admin/login", request.url)
          );
        }
        return true;
      }
      return true;
    },
  },
};

const { handlers, auth } = NextAuth(authOptions as unknown as import("next-auth").NextAuthConfig);

export { auth, handlers };
