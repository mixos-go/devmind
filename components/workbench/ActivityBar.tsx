import React from 'react';
import { Box, FileCode, GitBranch, Search, Settings, RefreshCw } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import clsx from 'clsx';

interface ActivityBarProps {
  activeActivity: 'files' | 'git' | 'search';
  onActivityChange: (activity: 'files' | 'git' | 'search') => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeActivity, onActivityChange }) => {
    const { refreshSession } = useSession();
    return (
         <div className="w-12 bg-[#09090b] border-r border-[#27272a] flex flex-col items-center py-4 gap-6 z-20">
             <div className="text-blue-500"><Box size={24} /></div>
             
             <button 
                onClick={() => onActivityChange('files')}
                className={clsx("p-2 rounded-lg transition-all", activeActivity === 'files' ? "bg-[#27272a] text-white" : "text-neutral-500 hover:text-white")}
                title="Explorer"
             >
                <FileCode size={20} />
             </button>
             
             <button 
                onClick={() => onActivityChange('git')}
                className={clsx("p-2 rounded-lg transition-all", activeActivity === 'git' ? "bg-[#27272a] text-white" : "text-neutral-500 hover:text-white")}
                title="Source Control"
             >
                <GitBranch size={20} />
             </button>

             <button 
                onClick={() => onActivityChange('search')}
                className={clsx("p-2 rounded-lg transition-all", activeActivity === 'search' ? "bg-[#27272a] text-white" : "text-neutral-500 hover:text-white")}
                title="Search"
             >
                <Search size={20} />
             </button>

             <div className="flex-1" />
             <button onClick={refreshSession} className="text-green-500 hover:text-green-400 p-2" title="Reset Session"><RefreshCw size={20} /></button>
             <button className="text-neutral-500 p-2" title="Settings"><Settings size={20} /></button>
         </div>
    );
};