import { FunctionDeclaration } from "@google/genai";
import React from 'react';

// ============================================
// ENUMS
// ============================================

export enum Sender {
  USER = 'user',
  AI = 'model',
  SYSTEM = 'system'
}

export type InputMode = 'build' | 'plan' | 'fix';

export type TerminalLineType = 'output' | 'command' | 'error' | 'success';

// ============================================
// AGENT TYPES
// ============================================

export type AgentRole = 'orchestrator' | 'coder' | 'architect' | 'debugger' | 'designer';

export interface AgentProfile {
  id: AgentRole;
  name: string;
  description: string;
  systemInstruction: string;
  color: string;
  icon: string;
  allowedTools: string[];
}

// ============================================
// MESSAGE & TOOL TYPES
// ============================================

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  thoughts?: string;
  toolCalls?: ToolCall[];
  timestamp: number;
  image?: string;
}

// ============================================
// FILE SYSTEM TYPES
// ============================================

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface FileSystemState {
  root: FileNode;
}

// ============================================
// PACKAGE TYPES
// ============================================

export interface Package {
  name: string;
  manager: string;
  version: string;
}

// ============================================
// AGENT CONTEXT & TOOLS
// ============================================

export interface AgentContext {
  fs: FileSystemState;
  setFs: React.Dispatch<React.SetStateAction<FileSystemState>>;
  addTerminalLine: (line: string, type?: TerminalLineType) => void;
  packages: Package[];
  setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
}

export interface AgentTool {
  declaration: FunctionDeclaration;
  execute: (args: Record<string, unknown>, context: AgentContext) => Promise<string>;
}