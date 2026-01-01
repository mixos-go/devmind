import React from 'react';
import { FileNode } from '../types';
import { Folder, FileCode, ChevronRight, ChevronDown } from 'lucide-react';

interface FileExplorerProps {
  node: FileNode;
  depth?: number;
  onFileClick?: (path: string) => void;
  currentPath?: string; // Accumulate path for correct lookup
}

const FileExplorer: React.FC<FileExplorerProps> = ({ node, depth = 0, onFileClick, currentPath = '' }) => {
  const [isOpen, setIsOpen] = React.useState(node.isOpen || false);

  const toggleOpen = () => setIsOpen(!isOpen);

  // Construct full path for this node
  const fullPath = currentPath ? (currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`) : (node.name === 'root' ? '' : node.name);

  if (node.type === 'file') {
    return (
      <div 
        onClick={() => onFileClick && onFileClick(fullPath)}
        className="flex items-center gap-2 py-1 px-2 hover:bg-neutral-800 cursor-pointer text-gray-400 text-sm transition-colors duration-200 group"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <FileCode size={14} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
        <span className="group-hover:text-gray-300 transition-colors">{node.name}</span>
      </div>
    );
  }

  // Directory
  // Don't render root folder name if it's top level, just children (optional visual preference, but let's keep it clean)
  if (node.name === 'root' && depth === 0) {
      return (
        <div>
            {node.children?.map((child, idx) => (
                <FileExplorer key={idx} node={child} depth={0} onFileClick={onFileClick} currentPath="" />
            ))}
        </div>
      )
  }

  return (
    <div>
      <div 
        className="flex items-center gap-2 py-1 px-2 hover:bg-neutral-800 cursor-pointer text-gray-300 text-sm font-medium transition-colors duration-200 select-none"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={toggleOpen}
      >
        <div className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
             <ChevronDown size={14} />
        </div>
        <Folder size={14} className="text-yellow-500" />
        <span>{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div className="animate-fade-in border-l border-neutral-800/50 ml-2">
          {node.children.map((child, idx) => (
            <div key={idx} style={{ marginLeft: '-8px' }}>
                <FileExplorer node={child} depth={depth + 1} onFileClick={onFileClick} currentPath={fullPath} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;