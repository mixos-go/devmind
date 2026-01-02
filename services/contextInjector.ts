import { AgentContext } from '../types';

export function collectContext(overrides?: Partial<AgentContext>): AgentContext {
  // Minimal context collector stub: cwd, openFiles, lastOutput
  return {
    currentDirectory: overrides?.currentDirectory || process.cwd(),
    openFiles: overrides?.openFiles || [],
    lastOutput: overrides?.lastOutput || '',
    lastError: overrides?.lastError,
    gitStatus: overrides?.gitStatus,
    runningProcesses: overrides?.runningProcesses || [],
  } as AgentContext;
}

export default collectContext;
