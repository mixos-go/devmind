import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string | undefined) => void;
  fileName: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ content, language, onChange, fileName }) => {
  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      <div className="h-8 bg-[#2d2d2d] flex items-center px-4 border-b border-[#1e1e1e] text-sm text-gray-300">
        <span className="opacity-80 italic">{fileName}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={content}
          theme="vs-dark"
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;