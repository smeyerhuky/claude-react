import { useState, useRef, useCallback, useEffect } from 'react';
import { MessageSquare, Edit3, Trash2, Eye, Code, Download } from 'lucide-react';

const MarkdownCommentSystem = () => {
  const [sourceText, setSourceText] = useState(`# Interactive Markdown Comment System

This is a **sample document** that demonstrates the commenting system.

## Features

- Highlight any text to add comments
- View all comments in the sidebar
- Copy comments with referenced text
- Edit and delete comments
- Full markdown support

## Usage Instructions

1. **Add source text** in the editor panel
2. **Switch to view mode** to see formatted text
3. **Select any text** to highlight and comment
4. **Manage comments** using the sidebar controls

> This is a blockquote that you can comment on!

### Code Example

\`\`\`javascript
function addComment(text, selection) {
  return {
    id: Date.now(),
    text,
    selectedText: selection,
    timestamp: new Date()
  };
}
\`\`\`

Try selecting this text and adding your first comment!`);

  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'view', 'split'
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  
  const contentRef = useRef(null);
  const textareaRef = useRef(null);

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto my-3"><code class="text-sm">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-50 italic">$1</blockquote>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    return html;
  };

  // Handle text selection
  const handleTextSelection = useCallback(() => {
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
  }, []);

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

    if (contentRef.current) {
      contentRef.current.addEventListener('click', handleHighlightClick);
      return () => {
        if (contentRef.current) {
          contentRef.current.removeEventListener('click', handleHighlightClick);
        }
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
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'edit' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'split' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('view')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'view' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            
            {/* Copy Comments Button */}
            <button
              onClick={copyAllComments}
              disabled={comments.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Comments ({comments.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-gray-200 bg-white`}>
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Markdown Source</h2>
            </div>
            <textarea
              ref={textareaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm"
              placeholder="Enter your markdown text here..."
            />
          </div>
        )}

        {/* Rendered Content Panel */}
        {(viewMode === 'view' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex`}>
            {/* Main Content */}
            <div className="flex-1 bg-white overflow-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Formatted View</h2>
                <p className="text-sm text-gray-600 mt-1">Select text to add comments</p>
              </div>
              <div
                ref={contentRef}
                className="p-6 prose prose-sm max-w-none"
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={{
                  __html: highlightCommentsInText(renderMarkdown(sourceText))
                }}
              />
            </div>

            {/* Comments Sidebar */}
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
                      <span className="font-medium">&quot;{comment.selectedText}"</span>
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
                    <p className="text-sm mt-1">Select text to add your first comment</p>
                  </div>
                )}
              </div>
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
                "{selectedText}"
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
                "{editingComment.selectedText}"
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