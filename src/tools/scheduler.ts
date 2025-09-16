// FILE: src/tools/scheduler.ts
import { z } from "zod";

const inputSchema = z.object({
  timezone: z.string().default("UTC"),
  preferredDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).default([
    "mon",
    "wed",
    "fri",
  ]),
});

export type SchedulerInput = z.infer<typeof inputSchema>;

export async function run(rawInput: unknown) {
  const input = inputSchema.parse(rawInput ?? {});
  const slots = input.preferredDays.map((day, index) => ({
    day,
    time: index % 2 === 0 ? "09:00" : "14:00",
    timezone: input.timezone,
  }));
  return { slots };
}
