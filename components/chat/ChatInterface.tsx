
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import ChatMessage from '../ChatMessage'; 
import { sendMessageToAgent } from '../../lib/gemini';
import { Send, Paperclip, Eraser } from 'lucide-react';
import { Sender, Message } from '../../types';

interface ChatInterfaceProps {
    activeFileContext?: { name: string, content: string };
}

export default function ChatInterface({ activeFileContext }: ChatInterfaceProps) {
    const { messages, addMessage, activeProfile, agentContext, switchAgent, setMessages, refreshSession } = useSession();
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;
        
        const userText = input;
        
        // 1. Context Injection: If a file is open, prepend it (hidden from UI, but sent to LLM)
        let systemContextInjection = "";
        if (activeFileContext) {
            systemContextInjection = `\n\n[System Note]: User currently has '${activeFileContext.name}' open. Content:\n\`\`\`\n${activeFileContext.content.substring(0, 2000)}\n\`\`\`\n`;
        }

        const userMsg: Message = { 
            id: Date.now().toString(), 
            sender: Sender.USER, 
            text: userText, 
            timestamp: Date.now() 
        };
        
        addMessage(userMsg);
        setInput('');
        setIsProcessing(true);

        // Placeholder for AI
        const aiMsgId = (Date.now() + 1).toString();
        addMessage({ 
            id: aiMsgId, 
            sender: Sender.AI, 
            text: '', 
            thoughts: '', 
            toolCalls: [], 
            timestamp: Date.now() 
        });

        // Prepare messages for API (inject context into the last user message clone for the logic only)
        const apiMessages = [...messages, { ...userMsg, text: userText + systemContextInjection }];

        try {
            const responseText = await sendMessageToAgent(
                apiMessages,
                agentContext,
                activeProfile,
                async (role, reason) => {
                    switchAgent(role);
                    // Insert a system event message
                    setMessages(prev => {
                        // Ensure we don't duplicate system messages if logic retries
                        if (prev[prev.length - 1].text.includes(`Switching to`)) return prev;
                        return [...prev, {
                            id: `sys_${Date.now()}`, 
                            sender: Sender.SYSTEM,
                            text: `🔄 **Orchestration Event**: Switching to **${role.toUpperCase()}** agent.\nReason: ${reason}`, 
                            timestamp: Date.now()
                        }];
                    });
                    return `Switched to ${role}.`;
                },
                (chunk) => {
                    setMessages(prev => {
                         const idx = prev.findIndex(m => m.id === aiMsgId);
                         if(idx === -1) return prev;
                         const newMsgs = [...prev];
                         // Simple append
                         newMsgs[idx] = { ...newMsgs[idx], text: newMsgs[idx].text + chunk };
                         return newMsgs;
                    });
                },
                (tool) => setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, toolCalls: [...(m.toolCalls || []), tool] } : m)),
                (toolId, result) => setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, toolCalls: m.toolCalls?.map(t => t.id === toolId ? { ...t, result } : t) } : m))
            );
            
            // Post-processing to separate Thoughts from Content if Gemini mixed them
            setMessages(prev => prev.map(m => {
                if(m.id === aiMsgId) {
                    let text = responseText;
                    let thoughts = m.thoughts;
                    // Robust extraction of thinking blocks
                    const thinkMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
                    if (thinkMatch) {
                        thoughts = thinkMatch[1].trim();
                        text = text.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
                    }
                    return { ...m, text, thoughts };
                }
                return m;
            }));

        } catch (e) { console.error(e); } finally { setIsProcessing(false); }
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b]">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {messages.map((msg, idx) => (
                    msg.sender === Sender.SYSTEM ? 
                    <div key={idx} className="flex justify-center my-2 animate-fade-in">
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                             {msg.text.replace(/\*\*/g, '')}
                        </span>
                    </div> :
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                {isProcessing && (
                    <div className="pl-12 flex items-center gap-2 animate-pulse">
                        <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                        <div className="h-2 w-2 bg-purple-500 rounded-full animation-delay-200"></div>
                        <div className="h-2 w-2 bg-purple-500 rounded-full animation-delay-400"></div>
                        <span className="text-xs text-purple-400 font-mono ml-2">Neural processing active...</span>
                    </div>
                )}
                <div ref={endRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 bg-[#0c0c0e] border-t border-[#27272a]">
                 <div className="relative bg-[#1e1e1e] rounded-xl border border-[#333] focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-lg">
                     <textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                        placeholder={`Message ${activeProfile.name}... (Enter to send)`} 
                        className="w-full bg-transparent text-sm p-4 pr-12 text-gray-200 outline-none resize-none min-h-[60px] max-h-[200px]"
                        rows={1}
                     />
                     
                     <div className="absolute right-2 bottom-2 flex items-center gap-1">
                         <button 
                             onClick={() => refreshSession()}
                             className="p-2 text-neutral-500 hover:text-red-400 transition-colors rounded-lg"
                             title="Clear Context"
                         >
                             <Eraser size={16} />
                         </button>
                         <button 
                             onClick={handleSend} 
                             disabled={!input.trim() || isProcessing} 
                             className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                         >
                             <Send size={16} />
                         </button>
                     </div>
                 </div>
                 <div className="flex justify-between mt-2 px-1">
                     <span className="text-[10px] text-neutral-500">
                         {activeFileContext ? `Active Context: ${activeFileContext.name}` : "No active file context"}
                     </span>
                     <span className="text-[10px] text-neutral-600 font-mono">
                         Model: Gemini 3 Pro
                     </span>
                 </div>
            </div>
        </div>
    );
}
