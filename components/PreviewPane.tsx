import React from 'react';
import { EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PreviewPaneProps {
  content: string;
  fileName: string;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ content, fileName }) => {
  const isHtml = fileName.endsWith('.html');
  const isMarkdown = fileName.endsWith('.md');

  if (!fileName) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-2 bg-neutral-900">
        <EyeOff size={24} />
        <span className="text-sm">No file selected</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
       <div className="h-8 bg-neutral-100 border-b border-neutral-200 flex items-center px-4 justify-between">
           <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Live Preview</span>
           <span className="text-xs text-neutral-400">{fileName}</span>
       </div>
       <div className="flex-1 overflow-auto bg-white relative">
         {isHtml ? (
           <iframe
             title="preview"
             srcDoc={content}
             className="w-full h-full border-none"
             sandbox="allow-scripts"
           />
         ) : isMarkdown ? (
           <div className="prose prose-sm p-6 max-w-none text-gray-800">
             <ReactMarkdown>{content}</ReactMarkdown>
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-2 bg-neutral-50">
             <EyeOff size={24} />
             <span className="text-sm">No preview available for this file type</span>
           </div>
         )}
       </div>
    </div>
  );
};

export default PreviewPane;