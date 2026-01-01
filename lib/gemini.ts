import { GoogleGenAI, Content, Part, FunctionCall } from "@google/genai";
import { AgentProfile, AgentRole, AgentContext, ToolCall, Message, Sender } from "../types";
import { ALL_TOOLS } from "../services/toolsRegistry";
import { createRouterTools } from "./router_tools";

// ============================================
// CONSTANTS
// ============================================

const AI_MODEL = 'gemini-3-pro-preview';
const THINKING_BUDGET = 16000;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateCallId = () => `call_${Math.random().toString(36).substring(2, 11)}`;

const getToolsForProfile = (profile: AgentProfile, routerTools: ReturnType<typeof createRouterTools>) => {
  const registryTools = ALL_TOOLS.filter(t => 
    profile.allowedTools.includes(t.declaration.name)
  );

  return [{
    functionDeclarations: [
      ...registryTools.map(t => t.declaration),
      ...routerTools.map(t => t.declaration)
    ]
  }];
};

const buildMessageParts = (message: Message): Part[] => {
  const parts: Part[] = [];
  
  if (message.text) {
    parts.push({ text: message.text });
  }
  
  if (message.image) {
    const [header, base64] = message.image.split(',');
    const mimeType = header.split(';')[0].split(':')[1];
    parts.push({ inlineData: { mimeType, data: base64 } });
  }
  
  if (message.sender === Sender.AI && message.toolCalls?.length) {
    const toolLog = message.toolCalls
      .map(t => `[Tool Use] ${t.name}(${JSON.stringify(t.args)}) -> ${t.result}`)
      .join('\n');
    parts.push({ text: `\n${toolLog}` });
  }
  
  return parts;
};

const buildHistory = (messages: Message[]): Content[] => {
  const historyContent = messages
    .filter(m => m.sender !== Sender.SYSTEM)
    .map(m => ({
      role: m.sender === Sender.USER ? 'user' : 'model',
      parts: buildMessageParts(m)
    }))
    .filter(c => c.parts.length > 0);

  // Merge consecutive turns from same role
  const merged: Content[] = [];
  for (const item of historyContent) {
    const last = merged[merged.length - 1];
    if (last && last.role === item.role) {
      last.parts.push(...item.parts);
    } else {
      merged.push(item);
    }
  }
  
  return merged;
};

// ============================================
// MAIN EXPORT
// ============================================

interface SendMessageCallbacks {
  onStream: (chunk: string) => void;
  onToolStart: (tool: ToolCall) => void;
  onToolEnd: (toolId: string, result: string) => void;
}

export const sendMessageToAgent = async (
  messages: Message[],
  context: AgentContext,
  activeProfile: AgentProfile,
  onSwitchAgent: (role: AgentRole, reason: string) => Promise<string>,
  onStream: SendMessageCallbacks['onStream'],
  onToolStart: SendMessageCallbacks['onToolStart'],
  onToolEnd: SendMessageCallbacks['onToolEnd']
): Promise<string> => {
  const routerTools = createRouterTools(onSwitchAgent);
  const toolConfig = getToolsForProfile(activeProfile, routerTools);
  const mergedHistory = buildHistory(messages);

  // Determine history and message to send
  let historyToUse = mergedHistory.slice(0, -1);
  let messageToSend = mergedHistory[mergedHistory.length - 1]?.parts || [{ text: '...' }];

  // If last message is from model, continue the conversation
  if (mergedHistory.length > 0 && mergedHistory[mergedHistory.length - 1].role === 'model') {
    historyToUse = mergedHistory;
    messageToSend = [{ text: "Please continue." }];
  }

  const chat = ai.chats.create({
    model: AI_MODEL,
    config: {
      systemInstruction: activeProfile.systemInstruction,
      tools: toolConfig,
      thinkingConfig: { thinkingBudget: THINKING_BUDGET }
    },
    history: historyToUse
  });

  try {
    let response = await chat.sendMessage({ message: messageToSend });
    let finalResponse = "";

    // Tool execution loop
    while (true) {
      const content = response.candidates?.[0]?.content;
      if (!content) break;

      // Handle text response
      const textPart = content.parts.find(p => p.text);
      if (textPart?.text) {
        finalResponse += textPart.text;
        onStream(textPart.text);
      }

      // Handle function calls
      const functionCalls = content.parts
        .filter((p): p is { functionCall: FunctionCall } => 'functionCall' in p)
        .map(p => p.functionCall);

      if (functionCalls.length === 0) break;

      const toolResponses = await Promise.all(
        functionCalls.map(async (call) => {
          const toolMeta: ToolCall = {
            id: generateCallId(),
            name: call.name,
            args: call.args as Record<string, unknown>
          };
          onToolStart(toolMeta);

          let result = "Error: Tool not found";
          try {
            const routerTool = routerTools.find(t => t.declaration.name === call.name);
            const registryTool = ALL_TOOLS.find(t => t.declaration.name === call.name);

            if (routerTool) {
              result = await routerTool.execute(call.args);
            } else if (registryTool) {
              result = await registryTool.execute(call.args as Record<string, unknown>, context);
            }
          } catch (e) {
            result = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
          }

          onToolEnd(toolMeta.id, result);
          return {
            functionResponse: {
              name: call.name,
              response: { result }
            }
          };
        })
      );

      response = await chat.sendMessage({ message: toolResponses });
    }

    return finalResponse;
  } catch (e) {
    console.error('AI Error:', e);
    return "AI Connection Error.";
  }
};
