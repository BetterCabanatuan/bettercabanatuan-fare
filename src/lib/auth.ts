import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";

import { isAdminEmail } from "@/lib/admins";
import { db } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  // Magic link is the only way in; no passwords, no social providers.
  emailAndPassword: { enabled: false },
  databaseHooks: {
    user: {
      create: {
        // Second gate behind sendMagicLink: no account is ever created for a non-admin.
        before: async (user) => (isAdminEmail(user.email) ? { data: user } : false),
      },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 10,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        // Non-admins get the same "check your email" response but nothing is sent,
        // so the form doesn't reveal which addresses are admins.
        if (!isAdminEmail(email)) return;
        await sendMagicLinkEmail({ email, url });
      },
    }),
    // Must be last: lets server actions set the session cookie.
    nextCookies(),
  ],
});
