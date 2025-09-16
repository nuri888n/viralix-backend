// FILE: src/orchestration/registry.ts
export type ToolLoader = () => Promise<{ run: (input: unknown) => Promise<unknown> | unknown }>;

export const toolRegistry: Record<string, ToolLoader> = {
  captions: () => import("../tools/captions"),
  scheduler: () => import("../tools/scheduler"),
  accounts: () => import("../tools/accounts"),
  posts: () => import("../tools/posts"),
};

export function hasTool(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(toolRegistry, name);
}
