import React, { useState } from 'react';
import { Message, Sender, ToolCall } from '../types';
import { Bot, User, BrainCircuit, TerminalSquare, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import WorkflowVisualizer from './WorkflowVisualizer';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;
  const [showThoughts, setShowThoughts] = useState(true);

  // Parse text to extract <thinking> tags if not already parsed
  let thoughts = message.thoughts;
  let cleanText = message.text;

  // Rudimentary parsing if raw text still contains tags
  if (!thoughts && cleanText.includes('<thinking>')) {
      const start = cleanText.indexOf('<thinking>');
      const end = cleanText.indexOf('</thinking>');
      if (start !== -1 && end !== -1) {
          thoughts = cleanText.substring(start + 10, end).trim();
          cleanText = cleanText.substring(0, start) + cleanText.substring(end + 11);
      }
  }

  return (
    <div className={clsx("flex gap-4 p-6 animate-slide-up transition-colors duration-300", isUser ? "bg-neutral-900/50" : "bg-neutral-950")}>
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <User size={18} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center animate-pulse-slow shadow-lg shadow-purple-900/20">
            <Bot size={18} className="text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-hidden">
        {/* User Image Attachment */}
        {isUser && message.image && (
             <div className="mb-2">
                 <img src={message.image} alt="User upload" className="max-w-xs rounded-lg border border-neutral-700 shadow-md transition-transform hover:scale-105" />
             </div>
        )}

        {/* AI Thoughts - Visualized */}
        {!isUser && thoughts && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden shadow-sm transition-all duration-300">
            <button 
              onClick={() => setShowThoughts(!showThoughts)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-neutral-800/50 hover:bg-neutral-800 text-xs text-neutral-400 font-mono transition-colors"
            >
              <BrainCircuit size={14} className="text-purple-400" />
              <span>Thinking Process</span>
              <span className="ml-auto opacity-50 transition-opacity hover:opacity-100">{showThoughts ? 'Hide' : 'Show'}</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showThoughts ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
               <WorkflowVisualizer thoughts={thoughts} />
            </div>
          </div>
        )}

        {/* Tool Executions */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-2">
            {message.toolCalls.map((tool) => (
              <div key={tool.id} className="group relative">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800 cursor-default">
                    <TerminalSquare size={14} />
                    <span className="text-blue-400 font-bold">{tool.name}</span>
                    <span className="truncate max-w-md opacity-70">{JSON.stringify(tool.args)}</span>
                    <CheckCircle2 size={14} className="ml-auto text-green-500/50 group-hover:text-green-500 transition-colors" />
                </div>
                {tool.result && (
                     <div className="hidden group-hover:block absolute z-10 top-full mt-1 left-0 bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs p-2 rounded shadow-xl w-full max-w-lg whitespace-pre-wrap animate-fade-in">
                         Result: {tool.result}
                     </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Main Text Content */}
        <div className="prose prose-invert prose-sm max-w-none prose-code:text-blue-300 prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 prose-pre:shadow-sm">
          <ReactMarkdown>{cleanText}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;