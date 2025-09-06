import { useState, useRef, useCallback, useEffect } from 'react';
import { MessageSquare, Edit3, Trash2, Eye, Code, Download } from 'lucide-react';

const MarkdownCommentSystem = () => {
  const [sourceText, setSourceText] = useState(`# Interactive Markdown Comment System

This is a **sample document** that demonstrates the commenting system with enhanced syntax highlighting.

## Features

- Highlight any text to add comments
- View all comments in the sidebar
- Copy comments with referenced text
- Edit and delete comments
- **Enhanced syntax highlighting** for multiple languages
- Proper text alignment and formatting

## Usage Instructions

1. **Add source text** in the editor panel
2. **Switch to view mode** to see formatted text
3. **Select any text** to highlight and comment
4. **Manage comments** using the sidebar controls

> This is a blockquote that you can comment on! Notice how the text is properly left-aligned now.

### JavaScript Example

\`\`\`javascript
function addComment(text, selection) {
  const comment = {
    id: Date.now(),
    text: text.trim(),
    selectedText: selection,
    timestamp: new Date(),
    // This is a comment
    isActive: true
  };
  
  return comment;
}

// Arrow function example
const processComments = (comments) => {
  return comments.filter(comment => comment.isActive);
};
\`\`\`

### Python Example

\`\`\`python
def create_comment(text, selection):
    """Create a new comment object"""
    comment = {
        'id': time.time(),
        'text': text.strip(),
        'selected_text': selection,
        'timestamp': datetime.now(),
        # This is a comment in Python
        'is_active': True
    }
    
    return comment

# List comprehension example
active_comments = [c for c in comments if c['is_active']]
\`\`\`

### CSS Example

\`\`\`css
.comment-highlight {
  background-color: #fef3c7;
  border-radius: 4px;
  padding: 2px 4px;
  transition: all 0.2s ease;
}

.comment-highlight:hover {
  background-color: #fcd34d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
\`\`\`

### Inline Code

You can also use \`inline code\` like \`useState\` or \`className\` which will be properly highlighted.

Try selecting this text and adding your first comment! The enhanced syntax highlighting makes code much more readable.

## New Features

- **Language detection** for code blocks
- **Proper text alignment** (no more centering!)
- **Better contrast** in dark code themes
- **Language labels** on code blocks`);

  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  
  const contentRef = useRef(null);
  const textareaRef = useRef(null);

  // Enhanced markdown renderer with syntax highlighting
  const renderMarkdown = (text) => {
    // Language-specific syntax highlighting patterns
    const syntaxHighlight = (code, language) => {
      const patterns = {
        javascript: [
          { pattern: /\b(function|const|let|var|return|if|else|for|while|class|import|export|from|default)\b/g, class: 'text-purple-600 font-medium' },
          { pattern: /\b(true|false|null|undefined)\b/g, class: 'text-blue-600' },
          { pattern: /"([^"\\]|\\.)*"/g, class: 'text-green-600' },
          { pattern: /'([^'\\]|\\.)*'/g, class: 'text-green-600' },
          { pattern: /\/\/.*$/gm, class: 'text-gray-500 italic' },
          { pattern: /\/\*[\s\S]*?\*\//g, class: 'text-gray-500 italic' },
          { pattern: /\b\d+\b/g, class: 'text-orange-600' }
        ],
        python: [
          { pattern: /\b(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|pass|break|continue)\b/g, class: 'text-purple-600 font-medium' },
          { pattern: /\b(True|False|None)\b/g, class: 'text-blue-600' },
          { pattern: /"([^"\\]|\\.)*"/g, class: 'text-green-600' },
          { pattern: /'([^'\\]|\\.)*'/g, class: 'text-green-600' },
          { pattern: /#.*$/gm, class: 'text-gray-500 italic' },
          { pattern: /\b\d+\b/g, class: 'text-orange-600' }
        ],
        css: [
          { pattern: /\b(color|background|margin|padding|border|width|height|display|position|flex|grid)\b/g, class: 'text-blue-600' },
          { pattern: /#[a-fA-F0-9]{3,6}\b/g, class: 'text-orange-600' },
          { pattern: /\.[a-zA-Z-_][a-zA-Z0-9-_]*/g, class: 'text-green-600' },
          { pattern: /"([^"\\]|\\.)*"/g, class: 'text-green-600' },
          { pattern: /'([^'\\]|\\.)*'/g, class: 'text-green-600' }
        ]
      };

      let highlightedCode = code;
      const langPatterns = patterns[language?.toLowerCase()] || patterns.javascript;
      
      langPatterns.forEach(({ pattern, class: className }) => {
        highlightedCode = highlightedCode.replace(pattern, `<span class="${className}">$&</span>`);
      });
      
      return highlightedCode;
    };

    let html = text
      // Code blocks with syntax highlighting
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, (_, language, code) => {
        const highlightedCode = syntaxHighlight(code.trim(), language);
        const langLabel = language ? `<div class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">${language}</div>` : '';
        return `<div class="bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto">
          ${langLabel}
          <pre class="text-gray-100"><code class="text-sm font-mono leading-relaxed">${highlightedCode}</code></pre>
        </div>`;
      })
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800 border-b border-gray-200 pb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-6 text-gray-900 border-b-2 border-gray-400 pb-3">$1</h1>')
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1 text-gray-700">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1 text-gray-700 list-decimal">$1</li>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-gray-700">$1</em>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600 border">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-3 my-4 bg-blue-50 text-gray-700 italic rounded-r-md">$1</blockquote>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      // Paragraphs (convert double line breaks to paragraphs)
      .replace(/\n\s*\n/gim, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      // Single line breaks
      .replace(/\n/gim, '<br>');

    // Wrap in paragraph tags if not already structured
    if (!html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>')) {
      html = `<p class="mb-4 text-gray-700 leading-relaxed">${html}</p>`;
    } else {
      html = `<p class="mb-4 text-gray-700 leading-relaxed">${html}</p>`;
    }

    return html;
  };

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (isEditing) return; // Don't allow selection in edit mode
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 0 && contentRef.current) {
      const range = selection.getRangeAt(0);
      
      if (contentRef.current.contains(range.commonAncestorContainer)) {
        setSelectedText(text);
        setShowCommentForm(true);
        setCommentText('');
      }
    }
  }, [isEditing]);

  // Add comment
  const addComment = () => {
    if (commentText.trim() && selectedText.trim()) {
      const newComment = {
        id: Date.now(),
        text: commentText.trim(),
        selectedText: selectedText.trim(),
        timestamp: new Date(),
        highlightColor: `hsl(${Math.random() * 360}, 70%, 85%)`
      };
      
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setSelectedText('');
      setShowCommentForm(false);
      
      // Clear selection
      window.getSelection().removeAllRanges();
    }
  };

  // Edit comment
  const startEditComment = (comment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
  };

  const saveEditComment = () => {
    if (editingComment && commentText.trim()) {
      setComments(prev => 
        prev.map(comment => 
          comment.id === editingComment.id 
            ? { ...comment, text: commentText.trim() }
            : comment
        )
      );
      setEditingComment(null);
      setCommentText('');
    }
  };

  // Delete comment
  const deleteComment = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  // Copy all comments
  const copyAllComments = () => {
    const formattedComments = comments.map((comment, index) => {
      return `## Comment ${index + 1}
**Referenced Text:** "${comment.selectedText}"
**Comment:** ${comment.text}
**Timestamp:** ${comment.timestamp.toLocaleString()}
---`;
    }).join('\n\n');

    const fullExport = `# Comments Export
**Total Comments:** ${comments.length}
**Export Date:** ${new Date().toLocaleString()}

${formattedComments}`;

    navigator.clipboard.writeText(fullExport).then(() => {
      alert('All comments copied to clipboard!');
    });
  };

  // Highlight text in rendered content
  const highlightCommentsInText = (text) => {
    let highlightedText = text;
    
    comments.forEach(comment => {
      const regex = new RegExp(`(${comment.selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(
        regex, 
        `<span class="comment-highlight cursor-pointer rounded px-1 transition-all duration-200" 
         style="background-color: ${comment.highlightColor}; border: 2px solid ${highlightedCommentId === comment.id ? '#3B82F6' : 'transparent'}" 
         data-comment-id="${comment.id}" 
         title="Click to view comment">$1</span>`
      );
    });
    
    return highlightedText;
  };

  // Handle click on highlighted text
  useEffect(() => {
    const handleHighlightClick = (e) => {
      if (e.target.classList.contains('comment-highlight')) {
        const commentId = parseInt(e.target.getAttribute('data-comment-id'));
        setHighlightedCommentId(commentId);
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('click', handleHighlightClick);
      return () => {
        currentRef.removeEventListener('click', handleHighlightClick);
      };
    }
  }, [comments]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="mr-2" />
            Markdown Comment System
          </h1>
          
          <div className="flex items-center space-x-2">
            {/* Simple Edit/View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsEditing(true)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isEditing ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2 ${
                  !isEditing ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
            </div>
            
            {/* Export Comments Button */}
            <button
              onClick={copyAllComments}
              disabled={comments.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export ({comments.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Primary Content Pane */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">
              {isEditing ? 'Markdown Source' : 'Formatted View'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditing ? 'Edit your markdown content' : 'Select text to add comments'}
            </p>
          </div>
          
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="flex-1 w-full p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed border-none"
              placeholder="Enter your markdown text here..."
            />
          ) : (
            <div
              ref={contentRef}
              className="flex-1 p-6 max-w-none text-left overflow-auto"
              onMouseUp={handleTextSelection}
              dangerouslySetInnerHTML={{
                __html: highlightCommentsInText(renderMarkdown(sourceText))
              }}
            />
          )}
        </div>

        {/* Comments Sidebar - Only in view mode */}
        {!isEditing && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="font-semibold text-gray-800">Comments ({comments.length})</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`bg-white rounded-lg p-4 border transition-all duration-200 ${
                    highlightedCommentId === comment.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-2">
                    {comment.timestamp.toLocaleString()}
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded text-sm mb-3 border-l-4" style={{borderLeftColor: comment.highlightColor}}>
                    <span className="text-gray-600">Reference: </span>
                    <span className="font-medium">&quot;{comment.selectedText}&quot;</span>
                  </div>
                  
                  <div className="text-sm text-gray-800 mb-3">
                    {comment.text}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditComment(comment)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit comment"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm mt-1">Select text to add comments</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comment Form Modal */}
      {showCommentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Text:
              </label>
              <div className="bg-gray-100 p-2 rounded text-sm border">
                &quot;{selectedText}&quot;
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment:
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Enter your comment here..."
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCommentForm(false);
                  setSelectedText('');
                  setCommentText('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Comment Modal */}
      {editingComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Edit Comment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referenced Text:
              </label>
              <div className="bg-gray-100 p-2 rounded text-sm border">
                &quot;{editingComment.selectedText}&quot;
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment:
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingComment(null);
                  setCommentText('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownCommentSystem;