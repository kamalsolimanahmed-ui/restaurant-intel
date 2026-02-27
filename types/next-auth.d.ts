import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    email: string;
    restaurantId: string;
    restaurantName: string;
    subscribed: boolean;
    trialEndsAt: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      restaurantId: string;
      restaurantName: string;
      subscribed: boolean;
      trialEndsAt: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    restaurantId?: string;
    restaurantName?: string;
    subscribed?: boolean;
    trialEndsAt?: string | null;
  }
}
