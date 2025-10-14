import React, { useState, useEffect, useRef } from 'react';

const MarkdownViewer = () => {
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  const defaultMarkdown = `# Markdown Viewer

## Features
- **Real-time preview** with IDE-style rendering
- Word count tracking
- Copy buttons for code blocks with line numbers
- Support for headers, bold, italic, code blocks
- Lists and links
- Professional coding aesthetics

## Try it out!

Edit this text in **editor mode** to see the live preview update.

### Code Example

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);

function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 10);
console.log(\`Sum: \${result}\`);
\`\`\`

### Python Example

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")
\`\`\`

### Lists
- First item
- Second item
- Third item with **bold** and *italic*

### Inline Code
You can use \`const x = 42;\` inline code as well.

### Links
Check out [React](https://react.dev) for more info!
`;

  useEffect(() => {
    setContent(defaultMarkdown);
  }, []);

  useEffect(() => {
    const words = content.trim().split(/\s+/).length;
    setWordCount(content.trim() ? words : 0);
  }, [content]);

  // Code block component with copy button
  const CodeBlock = ({ code, language, id }) => {
    const lines = code.trim().split('\n');

    const handleCopy = () => {
      navigator.clipboard.writeText(code.trim()).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    };

    return (
      <div className="relative my-4 group">
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {language || 'code'}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {copiedId === id ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-b-lg overflow-x-auto">
          <pre className="p-4">
            <code className="text-sm leading-relaxed">
              {lines.map((line, idx) => (
                <div key={idx} className="flex">
                  <span className="select-none text-gray-600 w-10 inline-block text-right pr-4 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-gray-100 flex-1">{line || '\n'}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    );
  };

  // Parse markdown into structured elements
  const parseMarkdown = () => {
    const lines = content.split('\n');
    const elements = [];
    let i = 0;
    let codeBlockId = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        const language = line.trim().slice(3).trim();
        const codeLines = [];
        i++;

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }

        elements.push({
          type: 'codeblock',
          content: codeLines.join('\n'),
          language: language,
          id: `code-${codeBlockId++}`
        });
        i++;
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push({ type: 'h1', content: line.slice(2) });
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push({ type: 'h2', content: line.slice(3) });
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push({ type: 'h3', content: line.slice(4) });
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push({ type: 'h4', content: line.slice(5) });
        i++;
        continue;
      }

      // Lists
      if (line.match(/^[-*]\s+/)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
          listItems.push(lines[i].replace(/^[-*]\s+/, ''));
          i++;
        }
        elements.push({ type: 'ul', items: listItems });
        continue;
      }

      if (line.match(/^\d+\.\s+/)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
          i++;
        }
        elements.push({ type: 'ol', items: listItems });
        continue;
      }

      // Horizontal rule
      if (line.trim() === '---') {
        elements.push({ type: 'hr' });
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push({ type: 'blockquote', content: line.slice(2) });
        i++;
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        elements.push({ type: 'br' });
        i++;
        continue;
      }

      // Paragraph
      elements.push({ type: 'p', content: line });
      i++;
    }

    return elements;
  };

  // Process inline markdown (bold, italic, code, links)
  const processInline = (text) => {
    if (!text) return '';

    // Store code blocks temporarily to prevent nested processing
    const codeBlocks = [];
    let processed = text.replace(/`([^`]+)`/g, (match, code) => {
      codeBlocks.push(code);
      return `__CODE_${codeBlocks.length - 1}__`;
    });

    // Links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      return `<a href="${url}" class="text-blue-600 hover:text-blue-700 underline font-medium" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // Bold and italic
    processed = processed.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>');
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Restore code blocks
    processed = processed.replace(/__CODE_(\d+)__/g, (match, idx) => {
      return `<code class="bg-gray-800 text-emerald-400 px-2 py-0.5 rounded font-mono text-sm">${codeBlocks[idx]}</code>`;
    });

    return processed;
  };

  // Render parsed elements
  const renderElement = (element, idx) => {
    switch (element.type) {
      case 'h1':
        return (
          <h1 key={idx} className="text-3xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">
            <span dangerouslySetInnerHTML={{ __html: processInline(element.content) }} />
          </h1>
        );
      case 'h2':
        return (
          <h2 key={idx} className="text-2xl font-bold mt-6 mb-3 text-gray-900">
            <span dangerouslySetInnerHTML={{ __html: processInline(element.content) }} />
          </h2>
        );
      case 'h3':
        return (
          <h3 key={idx} className="text-xl font-semibold mt-5 mb-2 text-gray-800">
            <span dangerouslySetInnerHTML={{ __html: processInline(element.content) }} />
          </h3>
        );
      case 'h4':
        return (
          <h4 key={idx} className="text-lg font-semibold mt-4 mb-2 text-gray-800">
            <span dangerouslySetInnerHTML={{ __html: processInline(element.content) }} />
          </h4>
        );
      case 'codeblock':
        return <CodeBlock key={idx} code={element.content} language={element.language} id={element.id} />;
      case 'ul':
        return (
          <ul key={idx} className="my-3 ml-6 space-y-1">
            {element.items.map((item, i) => (
              <li key={i} className="list-disc text-gray-700 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: processInline(item) }} />
              </li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={idx} className="my-3 ml-6 space-y-1">
            {element.items.map((item, i) => (
              <li key={i} className="list-decimal text-gray-700 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: processInline(item) }} />
              </li>
            ))}
          </ol>
        );
      case 'blockquote':
        return (
          <blockquote key={idx} className="border-l-4 border-blue-500 pl-4 py-2 my-3 italic text-gray-700 bg-blue-50">
            <span dangerouslySetInnerHTML={{ __html: processInline(element.content) }} />
          </blockquote>
        );
      case 'hr':
        return <hr key={idx} className="my-6 border-gray-300" />;
      case 'br':
        return <div key={idx} className="h-2" />;
      case 'p':
        return (
          <p key={idx} className="my-2 text-gray-700 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: processInline(element.content) }} />
          </p>
        );
      default:
        return null;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'text/markdown' || file.name.endsWith('.md'))) {
      const reader = new FileReader();
      reader.onload = (e) => setContent(e.target.result);
      reader.readAsText(file);
    } else {
      alert('Please upload a .md or .markdown file');
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content).then(() => {
      alert('Copied to clipboard!');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Markdown IDE</h1>
                <p className="text-xs text-gray-500">{wordCount} words</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isPreview
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPreview ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  )}
                </svg>
                {isPreview ? 'Preview' : 'Edit'}
              </button>

              <label className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-green-700 transition-all flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
                <input type="file" accept=".md,.markdown" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={downloadMarkdown}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>

              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-lg shadow-sm border-x border-b border-gray-200 min-h-[600px]">
          {isPreview ? (
            <div className="p-8 font-sans">
              {parseMarkdown().map((element, idx) => renderElement(element, idx))}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[700px] p-6 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-b-lg bg-gray-50 text-gray-900 leading-relaxed"
              placeholder="# Start typing your markdown here..."
              spellCheck="false"
            />
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-bold mb-4 text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0"># Header 1</code>
                <span className="text-xs text-gray-500 mt-1">Main heading</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0">## Header 2</code>
                <span className="text-xs text-gray-500 mt-1">Subheading</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0">**bold**</code>
                <span className="text-xs text-gray-500 mt-1">Bold text</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0">*italic*</code>
                <span className="text-xs text-gray-500 mt-1">Italic text</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0">`code`</code>
                <span className="text-xs text-gray-500 mt-1">Inline code</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0">[link](url)</code>
                <span className="text-xs text-gray-500 mt-1">Hyperlink</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0">- item</code>
                <span className="text-xs text-gray-500 mt-1">List item</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono flex-shrink-0">```lang```</code>
                <span className="text-xs text-gray-500 mt-1">Code block</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownViewer;
