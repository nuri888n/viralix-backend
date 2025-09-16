// FILE: src/tools/accounts.ts
import { z } from "zod";

const inputSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube"]).default("instagram"),
});

export type AccountsInput = z.infer<typeof inputSchema>;

export async function run(rawInput: unknown) {
  const input = inputSchema.parse(rawInput ?? {});
  return {
    account: {
      platform: input.platform,
      status: "connected",
      lastSync: new Date().toISOString(),
    },
  };
}
