import React, { useState, useEffect, useRef } from 'react';

const VSCodeAnimation = () => {
  // Animation state
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // VSCode UI state
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [inputDialogValue, setInputDialogValue] = useState('');
  const [hoverItem, setHoverItem] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [textContent, setTextContent] = useState('');

  // Customizable parameters
  const [theme, setTheme] = useState('dark');
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [animationDuration, setAnimationDuration] = useState(500); // ms per step

  // File system state
  const [fileSystem, setFileSystem] = useState({
    name: 'root',
    type: 'folder',
    children: []
  });

  // Generate file creation steps
  const generateCreateFileSteps = (filename, parent, position, content, fileType = 'js') => {
    const steps = [];

    // Right-click in explorer
    steps.push({
      action: 'rightClickExplorer',
      target: parent,
      position,
      description: `Right-click in ${parent} folder`
    });

    // Show context menu
    steps.push({
      action: 'showContextMenu',
      items: ['New File', 'New Folder', 'Refresh', 'Find in Files'],
      position,
      description: 'Display context menu'
    });

    // Hover on "New File" option
    steps.push({
      action: 'hoverMenuItem',
      item: 'New File',
      description: 'Hover on "New File" option'
    });

    // Click on "New File" option
    steps.push({
      action: 'clickMenuItem',
      item: 'New File',
      description: 'Click on "New File" option'
    });

    // Show input dialog for filename
    steps.push({
      action: 'showInputDialog',
      placeholder: 'Enter filename',
      description: 'Show input dialog for filename'
    });

    // Type filename
    let progress = '';
    for (let i = 0; i < filename.length; i++) {
      progress += filename[i];
      steps.push({
        action: 'typeInInputDialog',
        text: progress,
        description: `Type filename: "${progress}"`
      });
    }

    // Confirm input dialog
    steps.push({
      action: 'confirmInputDialog',
      description: 'Confirm filename'
    });

    // Create file in explorer
    steps.push({
      action: 'createFile',
      name: filename,
      parent,
      fileType,
      description: `Create "${filename}" file in explorer`
    });

    // Open the file in editor
    steps.push({
      action: 'openFile',
      file: filename,
      parent,
      description: `Open "${filename}" in editor`
    });

    // Type content if provided
    if (content) {
      let contentProgress = '';
      const contentLines = content.split('\n');

      for (let i = 0; i < contentLines.length; i++) {
        contentProgress += (i > 0 ? '\n' : '') + contentLines[i];
        steps.push({
          action: 'typeInEditor',
          content: contentProgress,
          description: `Type content line ${i+1} for "${filename}"`
        });
      }

      // Save the file
      steps.push({
        action: 'saveFile',
        file: filename,
        parent,
        description: `Save "${filename}"`
      });
    }

    return steps;
  };

  // Generate folder creation steps
  const generateCreateFolderSteps = (foldername, parent, position) => {
    const steps = [];

    // Right-click in explorer
    steps.push({
      action: 'rightClickExplorer',
      target: parent,
      position,
      description: `Right-click in ${parent} folder`
    });

    // Show context menu
    steps.push({
      action: 'showContextMenu',
      items: ['New File', 'New Folder', 'Refresh', 'Find in Files'],
      position,
      description: 'Display context menu'
    });

    // Hover on "New Folder" option
    steps.push({
      action: 'hoverMenuItem',
      item: 'New Folder',
      description: 'Hover on "New Folder" option'
    });

    // Click on "New Folder" option
    steps.push({
      action: 'clickMenuItem',
      item: 'New Folder',
      description: 'Click on "New Folder" option'
    });

    // Show input dialog for foldername
    steps.push({
      action: 'showInputDialog',
      placeholder: 'Enter folder name',
      description: 'Show input dialog for folder name'
    });

    // Type foldername
    let progress = '';
    for (let i = 0; i < foldername.length; i++) {
      progress += foldername[i];
      steps.push({
        action: 'typeInInputDialog',
        text: progress,
        description: `Type folder name: "${progress}"`
      });
    }

    // Confirm input dialog
    steps.push({
      action: 'confirmInputDialog',
      description: 'Confirm folder name'
    });

    // Create folder in explorer
    steps.push({
      action: 'createFolder',
      name: foldername,
      parent,
      description: `Create "${foldername}" folder in explorer`
    });

    return steps;
  };

  // Create all animation steps
  const createAnimationSteps = () => {
    let allSteps = [];

    // Step 0: Initial state
    allSteps.push({
      action: 'init',
      description: 'Initial VSCode state'
    });

    // Create src folder
    allSteps = [
      ...allSteps,
      ...generateCreateFolderSteps('src', 'root', { x: 100, y: 50 })
    ];

    // Create components folder in src
    allSteps = [
      ...allSteps,
      ...generateCreateFolderSteps('components', 'src', { x: 120, y: 80 })
    ];

    // Create utils folder in src
    allSteps = [
      ...allSteps,
      ...generateCreateFolderSteps('utils', 'src', { x: 120, y: 100 })
    ];

    // Create public folder
    allSteps = [
      ...allSteps,
      ...generateCreateFolderSteps('public', 'root', { x: 100, y: 120 })
    ];

    // Create index.html in public
    allSteps = [
      ...allSteps,
      ...generateCreateFileSteps('index.html', 'public', { x: 120, y: 140 },
        '<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="root"></div>\n  <script src="../src/index.js"></script>\n</body>\n</html>',
        'html'
      )
    ];

    // Create styles.css in public
    allSteps = [
      ...allSteps,
      ...generateCreateFileSteps('styles.css', 'public', { x: 120, y: 160 },
        'body {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 1rem;\n}',
        'css'
      )
    ];

    // Create index.js in src
    allSteps = [
      ...allSteps,
      ...generateCreateFileSteps('index.js', 'src', { x: 120, y: 180 },
        "import React from 'react';\n\n// This is where we'll mount our app\nconst rootElement = document.getElementById('root');\n\n// App component will be defined in a separate file\nfunction renderApp() {\n  // Import the App component when ready\n  console.log('Application initialized');\n}"
      )
    ];

    // Create App.js in src
    allSteps = [
      ...allSteps,
      ...generateCreateFileSteps('App.js', 'src', { x: 120, y: 200 },
        "// Simple component definition\nfunction App() {\n  // State for our counter\n  const [count, setCount] = React.useState(0);\n\n  return (\n    <div className=\"app\">\n      <header className=\"header\">\n        <h1>My Application</h1>\n      </header>\n      <main className=\"container\">\n        <h2>Welcome to My App</h2>\n        <button onClick={() => setCount(count + 1)}>\n          Count: {count}\n        </button>\n      </main>\n      <footer className=\"footer\">\n        <p>© 2025 My Company</p>\n      </footer>\n    </div>\n  );\n}"
      )
    ];

    return allSteps;
  };

  const animationSteps = useRef(createAnimationSteps());

  // Find a folder in the file system
  const findFolder = (node, path) => {
    if (!path || path === 'root') return node;

    const parts = path.split('/');
    let current = node;

    for (const part of parts) {
      if (part === 'root') continue;

      const found = current.children.find(
        child => child.name === part && child.type === 'folder'
      );

      if (!found) return null;
      current = found;
    }

    return current;
  };

  // Add a file or folder to the file system
  const addToFileSystem = (parentPath, name, type, content = '', fileType = 'js') => {
    const newFileSystem = JSON.parse(JSON.stringify(fileSystem));
    const parent = findFolder(newFileSystem, parentPath);

    if (parent) {
      parent.children.push({
        name,
        type,
        content,
        fileType,
        children: type === 'folder' ? [] : undefined
      });
    }

    setFileSystem(newFileSystem);
  };

  // Execute a single animation step
  const executeStep = (step) => {
    if (!step) return;

    switch (step.action) {
      case 'init':
        // Reset to initial state
        setShowContextMenu(false);
        setInputDialogOpen(false);
        setInputDialogValue('');
        setHoverItem(null);
        setTextContent('');
        setActiveFile(null);
        break;

      case 'rightClickExplorer':
        setShowContextMenu(true);
        setContextMenuPosition(step.position);
        break;

      case 'showContextMenu':
        // Already handled by rightClickExplorer
        break;

      case 'hoverMenuItem':
        setHoverItem(step.item);
        break;

      case 'clickMenuItem':
        setShowContextMenu(false);
        setHoverItem(null);

        if (step.item === 'New File' || step.item === 'New Folder') {
          setInputDialogOpen(true);
          setInputDialogValue('');
        }
        break;

      case 'showInputDialog':
        // Already handled by clickMenuItem
        break;

      case 'typeInInputDialog':
        setInputDialogValue(step.text);
        break;

      case 'confirmInputDialog':
        setInputDialogOpen(false);
        break;

      case 'createFile':
        addToFileSystem(step.parent, step.name, 'file', '', step.fileType || 'js');
        break;

      case 'createFolder':
        addToFileSystem(step.parent, step.name, 'folder');
        break;

      case 'openFile':
        setActiveFile({ name: step.file, parent: step.parent });
        setTextContent('');
        break;

      case 'typeInEditor':
        setTextContent(step.content);
        break;

      case 'saveFile':
        // In a real implementation, we would update the file content
        // in the file system here
        break;

      default:
        break;
    }
  };

  // Animation playback effect
  useEffect(() => {
    let timer;

    if (isPlaying && currentStep < animationSteps.current.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => {
          executeStep(animationSteps.current[prev + 1]);
          return prev + 1;
        });
      }, animationDuration / playbackSpeed);
    } else if (currentStep >= animationSteps.current.length - 1) {
      setIsPlaying(false);
    }

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, playbackSpeed, animationDuration]);

  // Initialize the first step
  useEffect(() => {
    executeStep(animationSteps.current[0]);
  }, []);

  // Render file tree recursively
  const renderFileTree = (node, path = 'root', depth = 0) => {
    const fullPath = path === 'root' ? node.name : `${path}/${node.name}`;
    const isActive = activeFile && activeFile.parent === path && activeFile.name === node.name;

    // File/folder icon based on type and file extension
    const getIcon = (node) => {
      if (node.type === 'folder') return '📁';

      const extension = node.name.split('.').pop();
      switch (extension) {
        case 'html': return '🌐';
        case 'css': return '🎨';
        case 'js': return '📜';
        case 'json': return '📋';
        case 'md': return '📝';
        default: return '📄';
      }
    };

    return (
      <div key={fullPath} style={{ paddingLeft: `${depth * 16}px` }}>
        <div
          className={`file-item ${isActive ? 'active' : ''}`}
          onClick={() => {
            if (node.type === 'file') {
              setActiveFile({ name: node.name, parent: path });
              setTextContent(node.content || '');
            }
          }}
        >
          <span className="file-icon">{getIcon(node)}</span>
          <span className="file-name">{node.name}</span>
        </div>

        {node.type === 'folder' && node.children && node.children.map(child =>
          renderFileTree(child, fullPath, depth + 1)
        )}
      </div>
    );
  };

  // Scrubber control handler
  const handleScrubberChange = (e) => {
    const newStep = parseInt(e.target.value, 10);

    // Reset state to initial and replay all steps up to the new position
    setFileSystem({
      name: 'root',
      type: 'folder',
      children: []
    });

    setShowContextMenu(false);
    setInputDialogOpen(false);
    setInputDialogValue('');
    setHoverItem(null);
    setTextContent('');
    setActiveFile(null);

    // Apply all steps up to the selected one
    for (let i = 0; i <= newStep; i++) {
      executeStep(animationSteps.current[i]);
    }

    setCurrentStep(newStep);
    setIsPlaying(false);
  };

  // Animation control handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);

    // Reset state to initial
    setFileSystem({
      name: 'root',
      type: 'folder',
      children: []
    });

    executeStep(animationSteps.current[0]);
  };

  // Helper component: VSCode Sidebar
  const VSCodeSidebar = ({ width }) => {
    return (
      <div className="sidebar" style={{ width: `${width}px` }}>
        <div className="explorer-header">
          <span>EXPLORER</span>
        </div>
        <div className="file-list">
          {renderFileTree(fileSystem)}
        </div>
      </div>
    );
  };

  // Helper component: VSCode Editor
  const VSCodeEditor = () => {
    const getFileType = () => {
      if (!activeFile) return 'plaintext';

      const extension = activeFile.name.split('.').pop();
      switch (extension) {
        case 'html': return 'html';
        case 'css': return 'css';
        case 'js': return 'javascript';
        default: return 'plaintext';
      }
    };

    return (
      <div className="editor">
        {activeFile ? (
          <>
            <div className="editor-header">
              <span className="tab active">{activeFile.name}</span>
            </div>
            <div className="editor-content">
              <pre className={`language-${getFileType()}`}>{textContent}</pre>
            </div>
          </>
        ) : (
          <div className="empty-editor">
            <span>Select a file to edit</span>
          </div>
        )}
      </div>
    );
  };

  // Helper component: Context Menu
  const ContextMenu = () => {
    if (!showContextMenu) return null;

    const items = animationSteps.current[currentStep]?.items ||
      ['New File', 'New Folder', 'Refresh', 'Find in Files'];

    return (
      <div
        className="context-menu"
        style={{
          left: `${contextMenuPosition.x}px`,
          top: `${contextMenuPosition.y}px`
        }}
      >
        {items.map(item => (
          <div
            key={item}
            className={`menu-item ${hoverItem === item ? 'hovered' : ''}`}
          >
            {item}
          </div>
        ))}
      </div>
    );
  };

  // Helper component: Input Dialog
  const InputDialog = () => {
    if (!inputDialogOpen) return null;

    return (
      <div className="input-dialog-overlay">
        <div className="input-dialog">
          <div className="dialog-header">
            <span>{hoverItem}</span>
          </div>
          <div className="dialog-content">
            <input
              type="text"
              value={inputDialogValue}
              readOnly
              placeholder="Enter name"
            />
          </div>
          <div className="dialog-actions">
            <button>OK</button>
            <button>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`vscode-container ${theme}`}>
      {/* VSCode interface */}
      <div className="vscode-interface">
        <VSCodeSidebar width={sidebarWidth} />
        <VSCodeEditor />
        <ContextMenu />
        <InputDialog />
      </div>

      {/* Animation controls */}
      <div className="animation-controls">
        <div className="control-buttons">
          <button onClick={handleReset}>Reset</button>
          {isPlaying ?
            <button onClick={handlePause}>Pause</button> :
            <button onClick={handlePlay}>Play</button>
          }
        </div>

        <div className="scrubber">
          <input
            type="range"
            min={0}
            max={animationSteps.current.length - 1}
            value={currentStep}
            onChange={handleScrubberChange}
            className="scrubber-input"
          />
          <div className="step-indicator">
            Step {currentStep + 1} of {animationSteps.current.length}: {animationSteps.current[currentStep]?.description || ''}
          </div>
        </div>

        <div className="control-group">
          <label>Speed:</label>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.5}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="speed-slider"
          />
          <span>{playbackSpeed}x</span>
        </div>

        {/* Customization controls */}
        <div className="customization-controls">
          <div className="control-group">
            <label>Theme:</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="theme-select"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="high-contrast">High Contrast</option>
            </select>
          </div>

          <div className="control-group">
            <label>Sidebar Width:</label>
            <input
              type="range"
              min={150}
              max={400}
              value={sidebarWidth}
              onChange={(e) => setSidebarWidth(parseInt(e.target.value, 10))}
              className="sidebar-width-slider"
            />
            <span>{sidebarWidth}px</span>
          </div>

          <div className="control-group">
            <label>Step Duration:</label>
            <input
              type="range"
              min={100}
              max={1000}
              step={100}
              value={animationDuration}
              onChange={(e) => setAnimationDuration(parseInt(e.target.value, 10))}
              className="duration-slider"
            />
            <span>{animationDuration}ms</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vscode-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 600px;
          border: 1px solid #252526;
          border-radius: 4px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .vscode-container.dark {
          background-color: #1e1e1e;
          color: #d4d4d4;
        }

        .vscode-container.light {
          background-color: #ffffff;
          color: #333333;
        }

        .vscode-container.high-contrast {
          background-color: #000000;
          color: #ffffff;
        }

        .vscode-interface {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .sidebar {
          height: 100%;
          background-color: #252526;
          overflow-y: auto;
          border-right: 1px solid #383838;
        }

        .explorer-header {
          padding: 8px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          background-color: #333333;
        }

        .file-list {
          padding: 8px 0;
        }

        .file-item {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          cursor: pointer;
        }

        .file-item:hover {
          background-color: #2a2d2e;
        }

        .file-item.active {
          background-color: #37373d;
        }

        .file-icon {
          margin-right: 6px;
          font-size: 14px;
        }

        .file-name {
          font-size: 13px;
        }

        .editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: #1e1e1e;
        }

        .editor-header {
          display: flex;
          background-color: #2d2d2d;
          border-bottom: 1px solid #383838;
        }

        .tab {
          padding: 8px 12px;
          font-size: 13px;
          background-color: #2d2d2d;
          border-right: 1px solid #383838;
        }

        .tab.active {
          background-color: #1e1e1e;
        }

        .editor-content {
          flex: 1;
          padding: 0;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 14px;
          overflow: auto;
          background-color: #1e1e1e;
        }

        .code-container {
          display: flex;
          min-height: 100%;
        }

        .line-numbers {
          padding: 8px 0;
          width: 50px;
          text-align: right;
          background-color: #1e1e1e;
          color: #858585;
          user-select: none;
          border-right: 1px solid #333;
        }

        .line-number {
          padding: 0 8px 0 0;
          font-size: 14px;
          line-height: 20px;
        }

        .code-content {
          flex: 1;
          margin: 0;
          padding: 8px 0 8px 12px;
          text-align: left;
          background-color: transparent;
          white-space: pre;
          word-wrap: normal;
          overflow-x: auto;
        }

        .code-line {
          min-height: 20px;
          line-height: 20px;
        }

        /* Syntax highlighting colors */
        .keyword {
          color: #569cd6;
        }

        .string {
          color: #ce9178;
        }

        .comment {
          color: #6a9955;
        }

        .tag {
          color: #569cd6;
        }

        .selector {
          color: #d7ba7d;
        }

        .property {
          color: #9cdcfe;
        }

        .value {
          color: #ce9178;
        }

        .attr-name {
          color: #9cdcfe;
        }

        .attr-value {
          color: #ce9178;
        }

        .empty-editor {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c6c6c;
        }

        .context-menu {
          position: absolute;
          background-color: #252526;
          border: 1px solid #3c3c3c;
          border-radius: 2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          z-index: 1000;
        }

        .menu-item {
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
        }

        .menu-item:hover, .menu-item.hovered {
          background-color: #04395e;
        }

        .input-dialog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 2000;
        }

        .input-dialog {
          width: 400px;
          background-color: #252526;
          border: 1px solid #3c3c3c;
          border-radius: 2px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }

        .dialog-header {
          padding: 8px 12px;
          font-size: 14px;
          border-bottom: 1px solid #3c3c3c;
        }

        .dialog-content {
          padding: 16px;
        }

        .dialog-content input {
          width: 100%;
          padding: 6px 8px;
          background-color: #3c3c3c;
          border: 1px solid #5f5f5f;
          border-radius: 2px;
          color: #d4d4d4;
          outline: none;
        }

        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          padding: 8px 12px;
          border-top: 1px solid #3c3c3c;
        }

        .dialog-actions button {
          margin-left: 8px;
          padding: 6px 12px;
          background-color: #0e639c;
          border: none;
          border-radius: 2px;
          color: white;
          cursor: pointer;
        }

        .dialog-actions button:hover {
          background-color: #1177bb;
        }

        .animation-controls {
          padding: 12px;
          background-color: #252526;
          border-top: 1px solid #383838;
        }

        .control-buttons {
          display: flex;
          gap: 8px;
        }

        .control-buttons button {
          padding: 6px 12px;
          background-color: #0e639c;
          border: none;
          border-radius: 2px;
          color: white;
          cursor: pointer;
        }

        .scrubber {
          margin: 12px 0;
        }

        .scrubber-input {
          width: 100%;
          accent-color: #0e639c;
        }

        .step-indicator {
          margin-top: 4px;
          font-size: 12px;
          color: #a0a0a0;
        }

        .control-group {
          display: flex;
          align-items: center;
          margin-top: 8px;
        }

        .control-group label {
          width: 100px;
          font-size: 12px;
        }

        .control-group input, .control-group select {
          flex: 1;
          margin: 0 8px;
        }

        .customization-controls {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #383838;
        }
      `}</style>
    </div>
  );
};

export default VSCodeAnimation;
