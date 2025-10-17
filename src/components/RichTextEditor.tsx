import React, { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your content...",
  height = "400px"
}) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image',
    'align',
    'color', 'background'
  ];

  return (
    <div className="rich-text-editor-wrapper">
      <style>{`
        .rich-text-editor-wrapper .quill {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .rich-text-editor-wrapper .ql-toolbar {
          background: hsl(var(--muted) / 0.5);
          border: none;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .rich-text-editor-wrapper .ql-container {
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
          min-height: ${height};
        }
        
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${height};
          color: hsl(var(--foreground));
        }
        
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-fill {
          fill: hsl(var(--foreground));
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-picker-label {
          color: hsl(var(--foreground));
        }
        
        .rich-text-editor-wrapper .ql-toolbar button:hover,
        .rich-text-editor-wrapper .ql-toolbar button:focus {
          color: hsl(var(--primary));
        }
        
        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar button:focus .ql-stroke {
          stroke: hsl(var(--primary));
        }
        
        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill,
        .rich-text-editor-wrapper .ql-toolbar button:focus .ql-fill {
          fill: hsl(var(--primary));
        }
        
        .rich-text-editor-wrapper .ql-toolbar button.ql-active,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-item.ql-selected {
          color: hsl(var(--primary));
        }
        
        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-item.ql-selected .ql-stroke {
          stroke: hsl(var(--primary));
        }
        
        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-fill,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-item.ql-selected .ql-fill {
          fill: hsl(var(--primary));
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};