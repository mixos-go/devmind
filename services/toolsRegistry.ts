import { Type } from "@google/genai";
import { AgentTool, AgentContext, TerminalLineType } from "../types";
import { writeFileNode, readFileNode, listDirNode, deleteNode } from "./virtualFileSystem";

// ============================================
// TYPES
// ============================================

type ToolArgs = Record<string, unknown>;
type ToolHandler = (args: ToolArgs, ctx: AgentContext) => Promise<string>;

interface ToolParam {
  type: typeof Type.STRING | typeof Type.NUMBER | typeof Type.BOOLEAN;
  description?: string;
  optional?: boolean;
}

// ============================================
// TOOL FACTORY
// ============================================

const createTool = (
  name: string,
  description: string,
  params: Record<string, ToolParam>,
  handler: ToolHandler
): AgentTool => {
  const apiProperties: Record<string, Omit<ToolParam, 'optional'>> = {};
  const required: string[] = [];

  for (const [key, param] of Object.entries(params)) {
    const { optional, ...rest } = param;
    apiProperties[key] = rest;
    if (!optional) required.push(key);
  }

  return {
    declaration: {
      name,
      description,
      parameters: {
        type: Type.OBJECT,
        properties: apiProperties,
        required,
      },
    },
    execute: handler,
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const isValidPath = (path: string): boolean => {
  return !path.includes('src/src') && !path.includes('//');
};

const generateHash = () => Math.random().toString(16).substring(2, 9);

// ============================================
// FILE SYSTEM HANDLERS
// ============================================

const handleWrite: ToolHandler = async (args, ctx) => {
  const path = args.path as string;
  const content = args.content as string;

  if (!isValidPath(path)) {
    return `Error: Invalid path detected (${path}). Please verify you are not creating nested 'src' directories.`;
  }

  ctx.setFs(prev => ({ ...prev, root: writeFileNode(prev.root, path, content) }));
  ctx.addTerminalLine(`> wrote ${path}`, 'success');
  return `Successfully wrote to ${path}`;
};

const handleRead: ToolHandler = async (args, ctx) => {
  const path = args.path as string;
  ctx.addTerminalLine(`> cat ${path}`, 'command');
  return readFileNode(ctx.fs.root, path);
};

const handleReplace: ToolHandler = async (args, ctx) => {
  const path = args.path as string;
  const original = args.original as string;
  const replacement = args.replacement as string;

  ctx.addTerminalLine(`> patching ${path}...`, 'command');
  const content = readFileNode(ctx.fs.root, path);
  
  if (content.startsWith('Error')) return content;
  if (!content.includes(original)) {
    return `Error: Original text segment not found in ${path}. Ensure whitespace matches exactly.`;
  }

  const newContent = content.replace(original, replacement);
  ctx.setFs(prev => ({ ...prev, root: writeFileNode(prev.root, path, newContent) }));
  ctx.addTerminalLine(`> patched ${path}`, 'success');
  return `Successfully patched ${path}`;
};

const handleList: ToolHandler = async (args, ctx) => {
  const path = args.path as string;
  ctx.addTerminalLine(`> ls ${path}`, 'command');
  return listDirNode(ctx.fs.root, path);
};

const handleDelete: ToolHandler = async (args, ctx) => {
  const path = args.path as string;
  const force = args.force as boolean;
  const sensitiveFiles = ['.env', 'package.json', 'tsconfig.json', '.git/config'];
  const isSensitive = sensitiveFiles.some(f => path.endsWith(f));

  if (isSensitive && !force) {
    ctx.addTerminalLine(`> rm ${path} [BLOCKED]`, 'error');
    return `SAFETY LOCK: Sensitive file (${path}). Ask user for confirmation, then retry with force: true.`;
  }

  ctx.setFs(prev => ({ ...prev, root: deleteNode(prev.root, path) }));
  ctx.addTerminalLine(`> rm ${path}`, 'error');
  return `Deleted ${path}`;
};

// ============================================
// TERMINAL HANDLERS
// ============================================

const handleExec: ToolHandler = async (args, ctx) => {
  const command = args.command as string;
  ctx.addTerminalLine(`$ ${command}`, 'command');
  await delay(800);

  if (command.startsWith('python') || command.startsWith('node')) {
    ctx.addTerminalLine('Running process...', 'output');
    return "Process finished with exit code 0.";
  }

  return `Executed: ${command}. (Simulation)`;
};

// ============================================
// PACKAGE HANDLERS
// ============================================

const createPackageInstaller = (manager: string): ToolHandler => async (args, ctx) => {
  const packageName = args.packageName as string;
  ctx.addTerminalLine(`$ ${manager} install ${packageName}`, 'command');

  const exists = ctx.packages.some(p => p.name === packageName && p.manager === manager);
  if (exists) {
    ctx.addTerminalLine(`> Package ${packageName} is already installed.`, 'output');
    return `Package ${packageName} is already installed.`;
  }

  ctx.addTerminalLine(`> Resolving ${packageName}...`, 'output');
  await delay(1000);

  ctx.setPackages(prev => [...prev, { name: packageName, manager, version: 'latest' }]);

  // Update manifest files
  if (manager === 'npm') {
    const packageJson = readFileNode(ctx.fs.root, 'package.json');
    if (!packageJson.startsWith('Error')) {
      try {
        const json = JSON.parse(packageJson);
        json.dependencies = { ...json.dependencies, [packageName]: "^1.0.0" };
        ctx.setFs(prev => ({ ...prev, root: writeFileNode(prev.root, 'package.json', JSON.stringify(json, null, 2)) }));
        ctx.addTerminalLine(`> Updated package.json`, 'success');
      } catch { /* ignore */ }
    }
  } else if (manager === 'pip') {
    const reqs = readFileNode(ctx.fs.root, 'requirements.txt');
    if (!reqs.startsWith('Error')) {
      ctx.setFs(prev => ({ ...prev, root: writeFileNode(prev.root, 'requirements.txt', `${reqs}\n${packageName}`) }));
      ctx.addTerminalLine(`> Updated requirements.txt`, 'success');
    }
  }

  ctx.addTerminalLine(`> Installed ${packageName}`, 'success');
  return `Successfully installed ${packageName} via ${manager}`;
};

// ============================================
// PROJECT SCAFFOLDING
// ============================================

const PROJECT_TEMPLATES: Record<string, { files: (name: string) => Record<string, string>; packages: { name: string; manager: string; version: string }[] }> = {
  react: {
    files: (name) => ({
      [`${name}/package.json`]: JSON.stringify({ name: "react-app", version: "1.0.0", dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" } }, null, 2),
      [`${name}/src/App.jsx`]: 'export default function App() { return <h1>Hello World</h1> }',
      [`${name}/public/index.html`]: '<html><body><div id="root"></div></body></html>'
    }),
    packages: [
      { name: 'react', manager: 'npm', version: '^18.0.0' },
      { name: 'react-dom', manager: 'npm', version: '^18.0.0' }
    ]
  },
  python: {
    files: (name) => ({
      [`${name}/requirements.txt`]: 'requests\nnumpy',
      [`${name}/main.py`]: 'import sys\nprint("Hello Python")'
    }),
    packages: [
      { name: 'requests', manager: 'pip', version: 'latest' },
      { name: 'numpy', manager: 'pip', version: 'latest' }
    ]
  }
};

const handleScaffold: ToolHandler = async (args, ctx) => {
  const projectName = args.projectName as string;
  const template = args.template as string;

  ctx.addTerminalLine(`> scaffolding project: ${projectName} (${template})`, 'success');

  const templateConfig = PROJECT_TEMPLATES[template];
  const files = templateConfig?.files(projectName) ?? { [`${projectName}/README.md`]: `# ${projectName}\nGenerated by DevMind.` };

  ctx.setFs(prev => {
    let newRoot = prev.root;
    for (const [path, content] of Object.entries(files)) {
      newRoot = writeFileNode(newRoot, path, content);
    }
    return { ...prev, root: newRoot };
  });

  if (templateConfig?.packages) {
    ctx.setPackages(prev => [...prev, ...templateConfig.packages]);
  }

  return `Project ${projectName} scaffolded using ${template} template.`;
};

// ============================================
// GIT HANDLERS
// ============================================

const handleGitInit: ToolHandler = async (_, ctx) => {
  ctx.addTerminalLine('$ git init', 'command');
  const config = '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false';
  ctx.setFs(prev => ({ ...prev, root: writeFileNode(prev.root, '.git/config', config) }));
  ctx.addTerminalLine('> Initialized empty Git repository in .git/', 'success');
  return 'Initialized empty Git repository.';
};

const handleGitAdd: ToolHandler = async (args, ctx) => {
  const path = args.path as string;
  ctx.addTerminalLine(`$ git add ${path}`, 'command');
  
  if (path === '.') return 'Staged all files.';
  
  const content = readFileNode(ctx.fs.root, path);
  if (content.startsWith('Error')) {
    ctx.addTerminalLine(`> fatal: pathspec '${path}' did not match any files`, 'error');
    return `Error: File ${path} not found.`;
  }
  return `Staged ${path}`;
};

const handleGitCommit: ToolHandler = async (args, ctx) => {
  const message = args.message as string;
  const hash = generateHash();
  ctx.addTerminalLine(`$ git commit -m "${message}"`, 'command');
  ctx.addTerminalLine(`[main ${hash}] ${message}`, 'success');
  return `[main ${hash}] ${message}`;
};

const handleGitStatus: ToolHandler = async (_, ctx) => {
  ctx.addTerminalLine(`$ git status`, 'command');
  return `On branch main\nNothing to commit, working tree clean`;
};

// ============================================
// TOOL DEFINITIONS
// ============================================

const PACKAGE_MANAGERS = ['npm', 'pip', 'cargo', 'gem', 'go'] as const;

const fileTools: AgentTool[] = [
  createTool('read_file', 'Read content of a file.', { path: { type: Type.STRING } }, handleRead),
  createTool('write_file', 'Create or overwrite a file.', { path: { type: Type.STRING }, content: { type: Type.STRING } }, handleWrite),
  createTool('append_file', 'Append content to a file.', { path: { type: Type.STRING }, content: { type: Type.STRING } }, async (args, ctx) => {
    const current = readFileNode(ctx.fs.root, args.path as string);
    if (current.startsWith('Error')) return current;
    return handleWrite({ path: args.path, content: current + '\n' + args.content }, ctx);
  }),
  createTool('apply_text_replacement', 'Replace a text segment in a file.', {
    path: { type: Type.STRING, description: "Path to the file" },
    original: { type: Type.STRING, description: "Exact text to replace" },
    replacement: { type: Type.STRING, description: "New text" }
  }, handleReplace),
  createTool('list_directory', 'List files in a directory.', { path: { type: Type.STRING } }, handleList),
  createTool('delete_file', 'Delete a file. CAUTION: Irreversible.', {
    path: { type: Type.STRING },
    force: { type: Type.BOOLEAN, description: "Force delete sensitive files", optional: true }
  }, handleDelete),
];

const gitTools: AgentTool[] = [
  createTool('git_init', 'Initialize git repository.', {}, handleGitInit),
  createTool('git_add', 'Stage files for commit.', { path: { type: Type.STRING } }, handleGitAdd),
  createTool('git_commit', 'Commit changes.', { message: { type: Type.STRING } }, handleGitCommit),
  createTool('git_status', 'Show working tree status.', {}, handleGitStatus),
];

const devTools: AgentTool[] = [
  createTool('execute_terminal_command', 'Execute a shell command (sandbox).', { command: { type: Type.STRING } }, handleExec),
  createTool('scaffold_project', 'Generate a new project from template.', {
    projectName: { type: Type.STRING },
    template: { type: Type.STRING, description: "react, python, node, rust, go" }
  }, handleScaffold),
  createTool('run_tests', 'Run the test suite.', {}, async (_, ctx) => handleExec({ command: 'npm test' }, ctx)),
  createTool('lint_code', 'Run linter.', {}, async (_, ctx) => handleExec({ command: 'npm run lint' }, ctx)),
  createTool('build_project', 'Build the project.', {}, async (_, ctx) => handleExec({ command: 'npm run build' }, ctx)),
  createTool('format_code', 'Auto-format code.', { path: { type: Type.STRING } }, async (args, ctx) => handleExec({ command: `prettier --write ${args.path}` }, ctx)),
  createTool('start_dev_server', 'Start dev server.', { port: { type: Type.NUMBER, optional: true } }, async (args, ctx) => {
    ctx.addTerminalLine(`> Server starting on port ${args.port || 3000}...`, 'success');
    return "Server started.";
  }),
  createTool('stop_dev_server', 'Stop dev server.', {}, async (_, ctx) => {
    ctx.addTerminalLine(`> Server stopped.`, 'error');
    return "Server stopped.";
  }),
];

const utilityTools: AgentTool[] = [
  createTool('search_documentation', 'Search docs.', { query: { type: Type.STRING } }, async (args) => 
    `Simulated search for: ${args.query}. Found 3 relevant articles.`),
  createTool('explain_error', 'Analyze an error.', { error: { type: Type.STRING } }, async (args) => 
    `Analysis: '${args.error}' typically occurs when a dependency is missing.`),
  createTool('plan_agent_task', 'Create a task plan.', { task: { type: Type.STRING } }, async () => "Plan created."),
  createTool('check_system_health', 'Check system health.', {}, async () => "System healthy. CPU: 12%, RAM: 4GB free."),
];

const packageTools: AgentTool[] = PACKAGE_MANAGERS.map(mgr =>
  createTool(`install_package_${mgr}`, `Install a package using ${mgr}.`, { packageName: { type: Type.STRING } }, createPackageInstaller(mgr))
);

export const ALL_TOOLS: AgentTool[] = [
  ...fileTools,
  ...gitTools,
  ...devTools,
  ...utilityTools,
  ...packageTools,
];