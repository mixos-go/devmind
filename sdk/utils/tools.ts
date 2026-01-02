import { ToolDefinition, ToolResult } from '../types';

export async function executeToolWithTimeout(
  tool: ToolDefinition,
  args: Record<string, unknown>,
  timeoutMs = 10000
): Promise<ToolResult> {
  if (!tool.execute) {
    return { toolCallId: '', result: `Error: Tool ${tool.name} has no executor`, isError: true };
  }

  const p = tool.execute(args).then((res: string) => ({ toolCallId: '', result: res }));

  const timeout = new Promise<ToolResult>(resolve =>
    setTimeout(() => resolve({ toolCallId: '', result: 'Error: timeout', isError: true }), timeoutMs)
  );

  return Promise.race([p, timeout]);
}

export default executeToolWithTimeout;
