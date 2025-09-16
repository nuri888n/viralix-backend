// FILE: src/orchestration/runTool.ts
import { toolRegistry, ToolLoader } from "./registry";

export interface RunToolOptions<TInput = unknown> {
  name: keyof typeof toolRegistry;
  input: TInput;
}

export async function runTool<TInput, TResult>({ name, input }: RunToolOptions<TInput>): Promise<TResult> {
  const loader: ToolLoader | undefined = toolRegistry[name as string];
  if (!loader) {
    throw new Error(`Unbekanntes Tool: ${String(name)}`);
  }

  const module = await loader();
  if (!module || typeof (module as any).run !== "function") {
    throw new Error(`Tool ${String(name)} exportiert keine run-Funktion`);
  }

  return (module as any).run(input) as Promise<TResult>;
}
