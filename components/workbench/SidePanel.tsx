
import React from 'react';
import { useSession } from '../../contexts/SessionContext';
import FileExplorer from '../FileExplorer';
import GitPanel from '../GitPanel';
import { PanelRightClose, Container, Search } from 'lucide-react';

interface SidePanelProps { 
    width: number;
    activeActivity: 'files' | 'git' | 'search';
    onClose: () => void; 
    onFileSelect: (path: string) => void; 
}

export const SidePanel: React.FC<SidePanelProps> = ({ width, activeActivity, onClose, onFileSelect }) => {
    const { fs, sessionId, addTerminalLine } = useSession();

    return (
        <div style={{ width }} className="flex flex-col border-r border-[#27272a] bg-[#18181b] transition-all duration-300 h-full">
            <div className="h-9 flex items-center justify-between px-3 border-b border-[#27272a] bg-[#18181b]">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {activeActivity === 'files' ? 'Explorer' : activeActivity === 'git' ? 'Source Control' : 'Search'}
                </span>
                <button onClick={onClose} className="text-neutral-600 hover:text-neutral-300 transition-colors">
                    <PanelRightClose size={14} className="rotate-180" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeActivity === 'files' && (
                    <div className="animate-fade-in">
                        <div className="px-3 py-2 text-[10px] text-blue-400/80 font-mono border-b border-[#27272a] flex items-center gap-2 bg-blue-500/5">
                             <Container size={10} /> 
                             <span className="truncate">{sessionId}</span>
                        </div>
                        <div className="py-2">
                            <FileExplorer node={fs.root} onFileClick={onFileSelect} />
                        </div>
                    </div>
                )}
                
                {activeActivity === 'git' && (
                    <div className="animate-fade-in h-full">
                        <GitPanel onRunCommand={(cmd) => addTerminalLine(cmd)} changedFiles={[]} />
                    </div>
                )}

                {activeActivity === 'search' && (
                    <div className="p-4 flex flex-col items-center justify-center h-64 text-neutral-500 gap-2 animate-fade-in">
                        <Search size={24} className="opacity-50" />
                        <span className="text-xs">No results found.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
