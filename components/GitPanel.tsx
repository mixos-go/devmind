import React, { useState } from 'react';
import { GitBranch, GitCommit, GitPullRequest, Plus, Play, RotateCcw } from 'lucide-react';

interface GitPanelProps {
  onRunCommand: (cmd: string) => void;
  changedFiles: string[]; 
}

const GitPanel: React.FC<GitPanelProps> = ({ onRunCommand, changedFiles = [] }) => {
  const [commitMessage, setCommitMessage] = useState('');

  const handleCommit = () => {
    if (!commitMessage) return;
    onRunCommand(`git commit -m "${commitMessage}"`);
    setCommitMessage('');
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-gray-300">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100 mb-4">
          <GitBranch size={16} className="text-orange-500" />
          <span>Source Control</span>
        </div>
        
        <div className="flex gap-2 mb-4">
             <button 
                onClick={() => onRunCommand('git init')}
                className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded text-xs border border-neutral-700 transition-colors"
             >
                Init
             </button>
             <button 
                onClick={() => onRunCommand('git status')}
                className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded text-xs border border-neutral-700 transition-colors"
             >
                Status
             </button>
        </div>

        <div className="space-y-2">
            <textarea 
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Message (e.g. 'Fix login bug')" 
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:border-blue-600 resize-none h-20"
            />
            <button 
                onClick={handleCommit}
                disabled={!commitMessage}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
            >
                <GitCommit size={14} />
                Commit Changes
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              <span>Changes</span>
              <span className="bg-neutral-800 px-1.5 rounded-full">{changedFiles.length}</span>
          </div>
          {changedFiles.length === 0 ? (
              <div className="text-xs text-neutral-600 italic text-center py-4">
                  No changes detected
              </div>
          ) : (
              <div className="space-y-1">
                  {changedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between group p-1 hover:bg-neutral-800 rounded cursor-pointer">
                          <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-orange-400 font-mono text-xs">M</span>
                              <span className="text-xs text-neutral-300 truncate">{file}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => onRunCommand(`git add ${file}`)} title="Stage" className="p-1 hover:text-green-400"><Plus size={12}/></button>
                              <button onClick={() => onRunCommand(`git checkout ${file}`)} title="Discard" className="p-1 hover:text-red-400"><RotateCcw size={12}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default GitPanel;