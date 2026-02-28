import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// NextAuth v5: AUTH_SECRET is read automatically from the environment.
// Do NOT pass `secret` in the config — v5 will throw a Configuration error
// if AUTH_SECRET is missing from env, and passing it manually causes conflicts.

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Vercel and custom domains
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        console.log("🔍 [authorize] called with email:", email);

        if (!email || !password) {
          console.log("🔍 [authorize] missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { restaurant: true },
          });

          console.log("🔍 [authorize] user found:", user ? `id=${user.id}` : "NOT FOUND");

          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(password, user.password);
          console.log("🔍 [authorize] password valid:", isPasswordValid);

          if (!isPasswordValid) return null;

          const result = {
            id: user.id,
            email: user.email,
            restaurantId: user.restaurantId,
            restaurantName: user.restaurant?.name ?? "",
            subscribed: user.subscribed,
            trialEndsAt: user.trialEndsAt?.toISOString() || null,
          };
          console.log("🔍 [authorize] returning:", JSON.stringify(result));
          return result;
        } catch (error) {
          console.error("🔍 [authorize] DB ERROR:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh login — populate token from user object
        token.id = user.id;
        token.email = user.email;
        token.restaurantId = (user as any).restaurantId;
        token.restaurantName = (user as any).restaurantName;
        token.subscribed = (user as any).subscribed;
        token.trialEndsAt = (user as any).trialEndsAt;
        token._lastRefreshed = Date.now();
      } else {
        // Token refresh — re-sync subscription status from DB every hour
        const ONE_HOUR = 60 * 60 * 1000;
        const lastRefreshed = (token._lastRefreshed as number) || 0;
        if (token.id && Date.now() - lastRefreshed > ONE_HOUR) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { subscribed: true, trialEndsAt: true },
            });
            if (dbUser) {
              token.subscribed = dbUser.subscribed;
              token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null;
              token._lastRefreshed = Date.now();
            }
          } catch {
            // Keep existing token on DB failure
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log("🔍 [session] token:", JSON.stringify(token));
      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        restaurantId: token.restaurantId as string,
        restaurantName: token.restaurantName as string,
        subscribed: token.subscribed as boolean,
        trialEndsAt: token.trialEndsAt as string | null,
      };
      console.log("🔍 [session] session.user:", JSON.stringify(session.user));
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
