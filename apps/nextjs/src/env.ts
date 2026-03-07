import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated env – use this instead of process.env in the Next.js app.
 * Load root .env via: pnpm run dev (uses dotenv -e ../../.env) or set vars in apps/nextjs/.env
 */
export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url()
      .optional()
      .default("https://myecclesia.org.uk"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
});
