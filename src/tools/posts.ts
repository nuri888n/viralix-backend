// FILE: src/tools/posts.ts
import { z } from "zod";

const inputSchema = z.object({
  limit: z.number().int().positive().max(20).default(5),
});

export type PostsInput = z.infer<typeof inputSchema>;

export async function run(rawInput: unknown) {
  const input = inputSchema.parse(rawInput ?? {});
  const now = Date.now();
  const posts = Array.from({ length: input.limit }).map((_, index) => ({
    id: index + 1,
    title: `Post #${index + 1}`,
    scheduledFor: new Date(now + index * 3600_000).toISOString(),
  }));
  return { posts };
}
