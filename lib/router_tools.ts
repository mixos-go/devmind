import { Type } from "@google/genai";
import { AgentRole } from "../types";

export const createRouterTools = (
    onSwitchAgent: (role: AgentRole, reason: string) => Promise<string>
) => [
    {
        declaration: {
            name: 'switch_agent',
            description: 'Delegate the current task to a specialized agent profile (Coder, Architect, Debugger, etc).',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    target_agent: { 
                        type: Type.STRING, 
                        description: 'Role to switch to: "coder", "architect", "debugger", "designer", "orchestrator"' 
                    },
                    reason: { 
                        type: Type.STRING, 
                        description: 'Explanation for why this agent is best suited for the task.' 
                    }
                },
                required: ['target_agent', 'reason']
            }
        },
        execute: async (args: any) => {
            return await onSwitchAgent(args.target_agent as AgentRole, args.reason);
        }
    }
];
