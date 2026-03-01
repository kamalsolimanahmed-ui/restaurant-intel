"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-for-development"
);

export async function signUp(
  email: string,
  password: string,
  restaurantName: string,
  country: string
) {
  const hashed = await bcrypt.hash(password, 10);

  // 1. Create Restaurant first
  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantName,
      country,
      currency: "USD",
    },
  });

  // 2. Create User linked to Restaurant
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      restaurantId: restaurant.id,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  return user;
}

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { restaurant: true },
  });

  if (!user) throw new Error("Invalid email or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid password");

  // Create JWT session token
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    restaurantId: user.restaurantId,
    restaurantName: user.restaurant?.name || "",
    subscribed: user.subscribed,
    trialEndsAt: user.trialEndsAt?.toISOString() || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return user;
}

export async function signOut() {
  (await cookies()).delete("session");
}

// Replacement for auth() that reads our custom JWT cookie
// The rest of your app expects auth() to return { user: { ... } }
export async function auth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        restaurantId: payload.restaurantId as string,
        restaurantName: payload.restaurantName as string,
        subscribed: payload.subscribed as boolean,
        trialEndsAt: payload.trialEndsAt as string | null,
      },
    };
  } catch (err) {
    return null; // invalid/expired token
  }
}

export async function getSession() {
  return await auth();
}
