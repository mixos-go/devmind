import { LLMClient, createConfig, Message, ToolDefinition } from '../sdk';

// Types
export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface AICommandContext {
  currentFile?: { path: string; content: string };
  selectedText?: string;
  terminalHistory?: string[];
  workingDirectory?: string;
  projectContext?: string;
}

export interface AICommandResult {
  success: boolean;
  response: string;
  thinking?: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result: string;
  }>;
  error?: string;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onThinking?: (thinking: string) => void;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onToolResult?: (name: string, result: string) => void;
  onComplete?: (result: AICommandResult) => void;
  onError?: (error: Error) => void;
}

// Terminal-specific tools
const terminalTools: ToolDefinition[] = [
  {
    name: 'run_command',
    description: 'Execute a shell command in the terminal',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
        workingDirectory: {
          type: 'string',
          description: 'Optional working directory for the command',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to write',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list',
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to list recursively',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_code',
    description: 'Search for patterns in code files',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Search pattern (regex supported)',
        },
        path: {
          type: 'string',
          description: 'Directory to search in',
        },
        fileTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'File extensions to include (e.g., [".ts", ".tsx"])',
        },
      },
      required: ['pattern'],
    },
  },
];

// Terminal AI Service
export class TerminalAIService {
  private client: LLMClient | null = null;
  private currentProvider: AIProvider = 'gemini';
  private apiKeys: Partial<Record<AIProvider, string>> = {};
  private toolExecutors: Map<string, (args: Record<string, unknown>) => Promise<string>> = new Map();

  constructor() {
    this.registerDefaultToolExecutors();
  }

  // Initialize with API keys
  initialize(keys: Partial<Record<AIProvider, string>>): void {
    this.apiKeys = keys;
    this.createClient();
  }

  // Set active provider
  setProvider(provider: AIProvider): void {
    this.currentProvider = provider;
    this.createClient();
  }

  // Get current provider
  getProvider(): AIProvider {
    return this.currentProvider;
  }

  // Create/recreate client
  private createClient(): void {
    const apiKey = this.apiKeys[this.currentProvider];
    if (!apiKey) {
      this.client = null;
      return;
    }

    const config = createConfig({
      providers: {
        [this.currentProvider]: { apiKey },
      },
      defaultProvider: this.currentProvider,
    });

    this.client = new LLMClient(config);
  }

  // Register tool executor
  registerToolExecutor(
    name: string,
    executor: (args: Record<string, unknown>) => Promise<string>
  ): void {
    this.toolExecutors.set(name, executor);
  }

  // Register default tool executors (stubs - should be connected to actual runtime)
  private registerDefaultToolExecutors(): void {
    this.toolExecutors.set('run_command', async (args) => {
      return `[Simulated] Would execute: ${args.command}`;
    });

    this.toolExecutors.set('read_file', async (args) => {
      return `[Simulated] Would read file: ${args.path}`;
    });

    this.toolExecutors.set('write_file', async (args) => {
      return `[Simulated] Would write to: ${args.path}`;
    });

    this.toolExecutors.set('list_files', async (args) => {
      return `[Simulated] Would list: ${args.path}`;
    });

    this.toolExecutors.set('search_code', async (args) => {
      return `[Simulated] Would search for: ${args.pattern}`;
    });
  }

  // Build system prompt with context
  private buildSystemPrompt(context?: AICommandContext): string {
    let prompt = `You are DevMind AI, an intelligent coding assistant integrated into a terminal environment.
You help developers with coding tasks, debugging, file operations, and general programming questions.

Guidelines:
- Be concise and direct in your responses
- When suggesting code changes, show the specific changes needed
- Use tools when appropriate to interact with the file system
- Format code blocks with appropriate language tags
- If you need more context, ask clarifying questions
`;

    if (context?.currentFile) {
      prompt += `\n\nCurrent file: ${context.currentFile.path}\n\`\`\`\n${context.currentFile.content.slice(0, 2000)}\n\`\`\``;
    }

    if (context?.selectedText) {
      prompt += `\n\nSelected text:\n\`\`\`\n${context.selectedText}\n\`\`\``;
    }

    if (context?.workingDirectory) {
      prompt += `\n\nWorking directory: ${context.workingDirectory}`;
    }

    if (context?.projectContext) {
      prompt += `\n\nProject context: ${context.projectContext}`;
    }

    return prompt;
  }

  // Process AI command (non-streaming)
  async processCommand(
    prompt: string,
    context?: AICommandContext
  ): Promise<AICommandResult> {
    if (!this.client) {
      return {
        success: false,
        response: '',
        error: `No API key configured for ${this.currentProvider}. Please set your API key in settings.`,
      };
    }

    try {
      const messages: Message[] = [{ role: 'user', content: prompt }];
      const systemPrompt = this.buildSystemPrompt(context);

      // Prepare tools with executors
      const toolsWithExecutors = terminalTools.map((tool) => ({
        ...tool,
        execute: async (args: Record<string, unknown>) => {
          const executor = this.toolExecutors.get(tool.name);
          if (executor) {
            return await executor(args);
          }
          return `Tool ${tool.name} not implemented`;
        },
      }));

      const response = await this.client.chat({
        messages,
        systemPrompt,
        tools: toolsWithExecutors,
        temperature: 0.7,
      });

      return {
        success: true,
        response: response.content || '',
        thinking: response.thinking,
        toolCalls: response.toolCalls?.map((tc) => ({
          name: tc.name,
          args: tc.arguments,
          result: '', // Would be filled by tool execution
        })),
      };
    } catch (error) {
      return {
        success: false,
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Process AI command with streaming
  async processCommandStream(
    prompt: string,
    context?: AICommandContext,
    callbacks?: StreamCallbacks
  ): Promise<AICommandResult> {
    if (!this.client) {
      const error = new Error(
        `No API key configured for ${this.currentProvider}. Please set your API key in settings.`
      );
      callbacks?.onError?.(error);
      return {
        success: false,
        response: '',
        error: error.message,
      };
    }

    try {
      const messages: Message[] = [{ role: 'user', content: prompt }];
      const systemPrompt = this.buildSystemPrompt(context);

      // Prepare tools with executors
      const toolsWithExecutors = terminalTools.map((tool) => ({
        ...tool,
        execute: async (args: Record<string, unknown>) => {
          callbacks?.onToolCall?.(tool.name, args);
          const executor = this.toolExecutors.get(tool.name);
          let result = `Tool ${tool.name} not implemented`;
          if (executor) {
            result = await executor(args);
          }
          callbacks?.onToolResult?.(tool.name, result);
          return result;
        },
      }));

      let fullResponse = '';
      let thinking = '';
      const toolCalls: AICommandResult['toolCalls'] = [];

      for await (const event of this.client.stream({
        messages,
        systemPrompt,
        tools: toolsWithExecutors,
        temperature: 0.7,
      })) {
        if (event.type === 'text' && event.content) {
          fullResponse += event.content;
          callbacks?.onToken?.(event.content);
        } else if (event.type === 'thinking' && event.content) {
          thinking += event.content;
          callbacks?.onThinking?.(event.content);
        }
      }

      const result: AICommandResult = {
        success: true,
        response: fullResponse,
        thinking: thinking || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };

      callbacks?.onComplete?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      callbacks?.onError?.(err);
      return {
        success: false,
        response: '',
        error: err.message,
      };
    }
  }

  // Quick helpers
  async explain(code: string, language?: string): Promise<string> {
    const prompt = `Explain this ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``;
    const result = await this.processCommand(prompt);
    return result.success ? result.response : result.error || 'Failed to explain';
  }

  async fix(code: string, error: string, language?: string): Promise<string> {
    const prompt = `Fix this ${language || 'code'} that has the following error:\n\nError: ${error}\n\nCode:\n\`\`\`${language || ''}\n${code}\n\`\`\``;
    const result = await this.processCommand(prompt);
    return result.success ? result.response : result.error || 'Failed to fix';
  }

  async suggest(description: string): Promise<string> {
    const prompt = `Suggest a command or code snippet for: ${description}`;
    const result = await this.processCommand(prompt);
    return result.success ? result.response : result.error || 'Failed to suggest';
  }
}

// Singleton instance
let terminalAIInstance: TerminalAIService | null = null;

export function getTerminalAI(): TerminalAIService {
  if (!terminalAIInstance) {
    terminalAIInstance = new TerminalAIService();
  }
  return terminalAIInstance;
}

// Legacy export for backward compatibility
export async function processAICommand(command: string): Promise<string> {
  const service = getTerminalAI();
  const result = await service.processCommand(command);
  return result.success ? result.response : result.error || 'Error processing command';
}

export default TerminalAIService;
