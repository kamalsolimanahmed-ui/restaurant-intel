import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";



const authConfig = {
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only",
  trustHost: process.env.AUTH_TRUST_HOST === "true",
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

        if (!email || !password) {
          return null;
        }


        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { restaurant: true },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            restaurantId: user.restaurantId,
            restaurantName: user.restaurant?.name ?? "",
            subscribed: user.subscribed,
            trialEndsAt: user.trialEndsAt?.toISOString() || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      // Case 1: fresh login — write all fields from the user object
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.restaurantId = user.restaurantId;
        token.restaurantName = user.restaurantName;
        token.subscribed = user.subscribed;
        token.trialEndsAt = user.trialEndsAt;
        token._lastRefreshed = Date.now();
        return token;
      }

      // Case 2: token refresh — re-fetch subscription & trial status from DB
      // This ensures stale JWTs (missing trialEndsAt) always get corrected.
      // Only re-fetch at most once per hour to avoid DB hammering.
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
          // DB unavailable — keep existing token values, don't crash auth
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          restaurantId: token.restaurantId,
          restaurantName: token.restaurantName,
          subscribed: token.subscribed,
          trialEndsAt: token.trialEndsAt,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/signup",
    error: "/auth/login",
  },
};

// Create the NextAuth instance
const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
});

export { handlers, auth, signIn, signOut };
