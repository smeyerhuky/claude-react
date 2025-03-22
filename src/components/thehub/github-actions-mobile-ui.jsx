import React, { useState, useEffect } from 'react';
import { 
  Github, 
  FileText, 
  Edit, 
  Play, 
  BarChart2, 
  Upload, 
  ChevronRight, 
  User, 
  Search, 
  ArrowLeft,
  Code,
  RefreshCw,
  Check,
  X,
  Calendar,
  Clock,
  AlertCircle,
  Folder,
  File,
  Settings,
  LogOut
} from 'lucide-react';

const GitHubActionsMobileManager = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('repos');
  const [activeView, setActiveView] = useState('list'); // list, detail, file, editor
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  // Data state
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [workflows, setWorkflows] = useState([]);
  const [deployments, setDeployments] = useState([]);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Mock data for the prototype
  useEffect(() => {
    if (isAuthenticated) {
      // Mock repositories data
      setRepositories([
        { id: 1, name: 'personal-site', description: 'My personal website built with React', isPrivate: false, updatedAt: '2023-04-15T10:30:00Z' },
        { id: 2, name: 'image-gallery', description: 'A responsive image gallery component', isPrivate: true, updatedAt: '2023-04-12T14:22:00Z' },
        { id: 3, name: 'todo-app', description: 'Todo application with React and Firebase', isPrivate: false, updatedAt: '2023-04-10T09:15:00Z' }
      ]);
      
      // Mock user data
      setUser({
        login: 'johndoe',
        avatar_url: 'https://api.placeholder/64'
      });
    }
  }, [isAuthenticated]);
  
  // Load files when selecting a repository
  useEffect(() => {
    if (selectedRepo) {
      setIsLoading(true);
      
      // Mock files data
      setTimeout(() => {
        setFiles([
          { id: 1, name: 'index.html', type: 'file', path: 'index.html', size: '4.2 KB', updatedAt: '2023-04-14T10:30:00Z' },
          { id: 2, name: 'src', type: 'folder', path: 'src', updatedAt: '2023-04-13T08:20:00Z' },
          { id: 3, name: 'README.md', type: 'file', path: 'README.md', size: '2.1 KB', updatedAt: '2023-04-10T15:45:00Z' },
          { id: 4, name: '.github', type: 'folder', path: '.github', updatedAt: '2023-04-09T11:30:00Z' },
          { id: 5, name: 'package.json', type: 'file', path: 'package.json', size: '1.8 KB', updatedAt: '2023-04-08T09:15:00Z' }
        ]);
        
        // Mock workflows data
        setWorkflows([
          { id: 1, name: 'Build and Deploy', filename: 'deploy.yml', status: 'success', lastRun: '2023-04-14T16:30:00Z' },
          { id: 2, name: 'Run Tests', filename: 'test.yml', status: 'failed', lastRun: '2023-04-14T16:28:00Z' }
        ]);
        
        setIsLoading(false);
        setActiveView('detail');
        setBreadcrumbs([selectedRepo.name]);
      }, 500);
    }
  }, [selectedRepo]);
  
  // Load file content when selecting a file
  useEffect(() => {
    if (selectedFile && selectedFile.type === 'file') {
      setIsLoading(true);
      
      // Mock file content
      setTimeout(() => {
        if (selectedFile.name === 'index.html') {
          setFileContent(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script src="./src/index.js"></script>
</body>
</html>`);
        } else if (selectedFile.name === 'README.md') {
          setFileContent(`# Project Title

A brief description of what this project does and who it's for.

## Installation

\`\`\`bash
npm install my-project
cd my-project
npm start
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## License

[MIT](https://choosealicense.com/licenses/mit/)`);
        } else if (selectedFile.name === 'package.json') {
          setFileContent(`{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A brief description",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`);
        }
        
        setIsLoading(false);
        setActiveView('file');
        setBreadcrumbs([...breadcrumbs, selectedFile.name]);
      }, 500);
    }
  }, [selectedFile]);
  
  // Handle GitHub authentication
  const handleLogin = () => {
    setAuthLoading(true);
    
    // Mock OAuth flow
    setTimeout(() => {
      setIsAuthenticated(true);
      setAuthLoading(false);
      showNotification('Successfully authenticated with GitHub', 'success');
    }, 1500);
  };
  
  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRepositories([]);
    setSelectedRepo(null);
    setFiles([]);
    setSelectedFile(null);
    setFileContent('');
    setWorkflows([]);
    setActiveTab('repos');
    setActiveView('list');
    setBreadcrumbs([]);
    showNotification('Logged out successfully', 'success');
  };
  
  // Navigate to repository detail
  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
  };
  
  // Navigate to file detail
  const handleSelectFile = (file) => {
    if (file.type === 'folder') {
      // Handle folder navigation (not implemented in prototype)
      showNotification('Folder navigation will be implemented in the full version', 'info');
    } else {
      setSelectedFile(file);
    }
  };
  
  // Handle file editing
  const handleEditFile = () => {
    setActiveView('editor');
  };
  
  // Save file changes
  const handleSaveFile = () => {
    setActiveView('file');
    showNotification('Changes saved successfully', 'success');
  };
  
  // Go back based on current view
  const handleBack = () => {
    if (activeView === 'detail') {
      setSelectedRepo(null);
      setActiveView('list');
      setBreadcrumbs([]);
    } else if (activeView === 'file') {
      setSelectedFile(null);
      setActiveView('detail');
      setBreadcrumbs([selectedRepo.name]);
    } else if (activeView === 'editor') {
      setActiveView('file');
    }
  };
  
  // Display notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Trigger a workflow
  const handleRunWorkflow = (workflow) => {
    setIsLoading(true);
    
    // Mock workflow execution
    setTimeout(() => {
      setIsLoading(false);
      showNotification(`Workflow "${workflow.name}" triggered successfully`, 'success');
    }, 1000);
  };
  
  // Filter repositories based on search query
  const filteredRepositories = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format relative time
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };
  
  // Get status color based on workflow status
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'running': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };
  
  // Get status icon based on workflow status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <Check className="w-5 h-5 text-green-500" />;
      case 'failed': return <X className="w-5 h-5 text-red-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Render based on authentication state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <GitHub className="w-16 h-16 mb-4 text-gray-800" />
            <h1 className="text-2xl font-bold text-center">GitHub Actions Mobile Manager</h1>
            <p className="mt-2 text-center text-gray-600">Manage your repositories, files, and workflows on the go</p>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={authLoading}
            className="flex items-center justify-center w-full py-3 mt-4 text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            {authLoading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <GitHub className="w-5 h-5 mr-2" />
            )}
            {authLoading ? 'Connecting...' : 'Sign in with GitHub'}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white shadow-sm">
        {activeView !== 'list' ? (
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>
        ) : (
          <div className="flex items-center">
            <GitHub className="w-6 h-6 mr-2 text-gray-800" />
            <span className="font-semibold">GitHub Mobile</span>
          </div>
        )}
        
        {/* Breadcrumbs for navigation context */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center overflow-x-auto whitespace-nowrap">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
                <span className="text-sm font-medium text-gray-600">{crumb}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center">
          <img 
            src={user?.avatar_url || '/api/placeholder/32/32'} 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 p-4">
        {/* Authentication welcome message */}
        {isAuthenticated && activeView === 'list' && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Welcome, {user?.login}</h2>
            <p className="text-gray-600">Manage your GitHub repositories and workflows</p>
          </div>
        )}
        
        {/* Search Bar */}
        {activeView === 'list' && (
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        
        {/* Repository List View */}
        {activeView === 'list' && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Your Repositories</h3>
            {filteredRepositories.length > 0 ? (
              filteredRepositories.map(repo => (
                <div
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  className="flex items-center p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-medium">{repo.name}</h4>
                      {repo.isPrivate && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">Private</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{repo.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Updated {getRelativeTime(repo.updatedAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow">
                {searchQuery ? 'No repositories matching your search' : 'No repositories found'}
              </div>
            )}
          </div>
        )}
        
        {/* Repository Detail View */}
        {activeView === 'detail' && selectedRepo && (
          <div className="space-y-6">
            {/* Repository Info */}
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold">{selectedRepo.name}</h3>
              <p className="mt-1 text-gray-600">{selectedRepo.description}</p>
              <div className="flex items-center mt-3 text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Updated {getRelativeTime(selectedRepo.updatedAt)}</span>
              </div>
            </div>
            
            {/* Files Section */}
            <div className="space-y-2">
              <h4 className="flex items-center text-lg font-medium">
                <FileText className="w-5 h-5 mr-2" />
                Files
              </h4>
              <div className="overflow-hidden bg-white rounded-lg shadow">
                {files.map(file => (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className="flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 last:border-b-0"
                  >
                    <div className="mr-3">
                      {file.type === 'folder' ? (
                        <Folder className="w-5 h-5 text-blue-500" />
                      ) : (
                        <File className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      {file.type === 'file' && (
                        <p className="text-xs text-gray-500">{file.size}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        {getRelativeTime(file.updatedAt)}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Workflows Section */}
            <div className="space-y-2">
              <h4 className="flex items-center text-lg font-medium">
                <Play className="w-5 h-5 mr-2" />
                Workflows
              </h4>
              <div className="overflow-hidden bg-white rounded-lg shadow">
                {workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className="p-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(workflow.status)}
                        <span className="ml-2 font-medium">{workflow.name}</span>
                      </div>
                      <button
                        onClick={() => handleRunWorkflow(workflow)}
                        className="px-3 py-1 text-sm text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                      >
                        Run
                      </button>
                    </div>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Code className="w-3 h-3 mr-1" />
                      <span>{workflow.filename}</span>
                      <span className="mx-2">•</span>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Last run {getRelativeTime(workflow.lastRun)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* File Detail View */}
        {activeView === 'file' && selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
              <button
                onClick={handleEditFile}
                className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
            
            <div className="p-4 overflow-auto text-sm font-mono text-gray-800 bg-gray-100 rounded-lg shadow whitespace-pre-wrap">
              {fileContent}
            </div>
          </div>
        )}
        
        {/* File Editor View */}
        {activeView === 'editor' && selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editing: {selectedFile.name}</h3>
              <button
                onClick={handleSaveFile}
                className="flex items-center px-3 py-1 text-sm text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                <Check className="w-4 h-4 mr-1" />
                Save
              </button>
            </div>
            
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full h-64 p-4 text-sm font-mono text-gray-800 bg-white border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-lg">
              <RefreshCw className="w-8 h-8 mb-2 text-blue-500 animate-spin" />
              <p className="text-gray-700">Loading...</p>
            </div>
          </div>
        )}
        
        {/* Notification */}
        {notification && (
          <div className={`fixed bottom-4 left-4 right-4 p-3 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <Check className="w-5 h-5 mr-2" />
              ) : notification.type === 'error' ? (
                <X className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        )}
      </main>
      
      {/* Bottom Tab Navigation */}
      <nav className="sticky bottom-0 z-10 flex items-center justify-around w-full h-16 bg-white border-t border-gray-200">
        <button
          onClick={() => setActiveTab('repos')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'repos' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <GitHub className="w-6 h-6" />
          <span className="mt-1 text-xs">Repos</span>
        </button>
        
        <button
          onClick={() => {
            showNotification('Workflows section will be implemented in the full version', 'info');
          }}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'workflows' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <Play className="w-6 h-6" />
          <span className="mt-1 text-xs">Workflows</span>
        </button>
        
        <button
          onClick={() => {
            showNotification('Analytics section will be implemented in the full version', 'info');
          }}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'analytics' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <BarChart2 className="w-6 h-6" />
          <span className="mt-1 text-xs">Analytics</span>
        </button>
        
        <button
          onClick={() => {
            handleLogout();
          }}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <LogOut className="w-6 h-6" />
          <span className="mt-1 text-xs">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default GitHubActionsMobileManager;
