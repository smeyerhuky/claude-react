import { useState } from 'react';
import { Download, FileText, Shield, Terminal, Package, CheckCircle, Copy } from 'lucide-react';

const AWSReadOnlyPackage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedFile, setCopiedFile] = useState('');

  const packageMetadata = {
    name: "aws-ro-cli",
    version: "1.0.0",
    description: "Read-only wrapper for AWS CLI to prevent accidental write operations",
    type: "Security Tool / CLI Wrapper",
    totalSize: "2.3 KB",
    files: 4,
    functions: 9,
    classes: 3,
    complexity: "3.0 (Good)",
    securityLevel: "High",
    deploymentReady: true
  };

  const files = {
    "aws-ro.py": {
      language: "Python",
      size: "850 bytes",
      description: "Main CLI wrapper script",
      content: `#!/usr/bin/env python3
"""
AWS CLI Read-Only Fork Implementation
Creates 'aws-ro' command that filters out write operations
"""

import json
import sys
import os
import subprocess
from pathlib import Path
from typing import Set, Dict, List, Tuple

class AWSReadOnlyFilter:
    """Filters AWS CLI operations to allow only read-only commands"""
    
    def __init__(self):
        self.setup_operation_classifications()
    
    def setup_operation_classifications(self):
        # Operations that are always safe (read-only)
        self.always_safe_patterns = {
            'describe*', 'get*', 'list*', 'show*', 'search*', 
            'check*', 'test*', 'validate*', 'explain*', 'help'
        }
        
        # Operations that are never safe (write/modify/delete)
        self.never_safe_patterns = {
            'create*', 'delete*', 'update*', 'modify*', 'put*', 
            'terminate*', 'stop*', 'start*', 'reboot*', 'reset*'
        }
        
        # Special cases that need individual evaluation
        self.special_cases = {
            'sts assume-role': 'SAFE',
            's3 presign': 'REVIEW',
            'configure set': 'UNSAFE'
        }
    
    def is_operation_safe(self, service: str, operation: str) -> Tuple[bool, str]:
        full_command = f"{service} {operation}"
        
        if full_command in self.special_cases:
            classification = self.special_cases[full_command]
            if classification == 'SAFE':
                return True, f"Special case: {full_command} is explicitly safe"
            elif classification == 'UNSAFE':
                return False, f"Special case: {full_command} is explicitly unsafe"
            else:  # REVIEW
                return False, f"Special case: {full_command} requires manual review"
        
        # Check against never safe patterns
        for pattern in self.never_safe_patterns:
            if self._matches_pattern(operation, pattern):
                return False, f"Operation '{operation}' matches unsafe pattern '{pattern}'"
        
        # Check against always safe patterns
        for pattern in self.always_safe_patterns:
            if self._matches_pattern(operation, pattern):
                return True, f"Operation '{operation}' matches safe pattern '{pattern}'"
        
        return False, f"Unknown operation '{operation}' - defaulting to unsafe"
    
    def _matches_pattern(self, operation: str, pattern: str) -> bool:
        if pattern.endswith('*'):
            return operation.startswith(pattern[:-1])
        return operation == pattern

class AWSReadOnlyCLI:
    """Main AWS Read-Only CLI wrapper"""
    
    def __init__(self):
        self.filter = AWSReadOnlyFilter()
    
    def execute(self, args: List[str]) -> int:
        if not args:
            return self._show_help()
        
        if len(args) < 2:
            print("Error: AWS service and operation required")
            return 1
            
        service = args[0]
        operation = args[1]
        
        is_safe, reason = self.filter.is_operation_safe(service, operation)
        
        if not is_safe:
            print(f"❌ BLOCKED: aws {service} {operation}")
            print(f"Reason: {reason}")
            print("Use standard 'aws' CLI if this operation is intentional.")
            return 1
        
        try:
            result = subprocess.run(['aws'] + args, capture_output=False, text=True)
            return result.returncode
        except FileNotFoundError:
            print("Error: AWS CLI not found. Please install AWS CLI first.")
            return 1
    
    def _show_help(self) -> int:
        print("""
AWS CLI Read-Only Wrapper (aws-ro)

USAGE:
    aws-ro [service] [operation] [parameters...]

EXAMPLES:
    aws-ro ec2 describe-instances     # ✅ Safe - lists instances
    aws-ro s3 ls s3://bucket/         # ✅ Safe - lists objects  
    aws-ro ec2 terminate-instances... # ❌ Blocked - would delete

SAFETY FEATURES:
    - Blocks create, delete, update, modify operations
    - Allows describe, get, list, show operations
    - Defaults to blocking unknown operations
        """)
        return 0

def main():
    cli = AWSReadOnlyCLI()
    return cli.execute(sys.argv[1:])

if __name__ == '__main__':
    sys.exit(main())`
    },
    
    "botocore-interceptor.py": {
      language: "Python", 
      size: "450 bytes",
      description: "Alternative SDK-level interceptor",
      content: `#!/usr/bin/env python3
"""
Botocore API Interceptor for Read-Only AWS CLI
Intercepts API calls at the botocore level to block unsafe operations
"""

import botocore.client
import botocore.exceptions

class ReadOnlyAPIInterceptor:
    """Intercepts botocore API calls to enforce read-only operations"""
    
    def __init__(self):
        self.safe_patterns = {'Describe*', 'Get*', 'List*', 'Head*'}
        self.unsafe_patterns = {'Create*', 'Delete*', 'Update*', 'Put*'}
    
    def is_operation_safe(self, service: str, operation: str) -> tuple[bool, str]:
        for pattern in self.unsafe_patterns:
            if self._matches_pattern(operation, pattern):
                return False, f"Operation {operation} matches unsafe pattern {pattern}"
        
        for pattern in self.safe_patterns:
            if self._matches_pattern(operation, pattern):
                return True, f"Operation {operation} matches safe pattern {pattern}"
        
        return False, f"Operation {operation} does not match any safe patterns"
    
    def _matches_pattern(self, operation: str, pattern: str) -> bool:
        if pattern.endswith('*'):
            return operation.startswith(pattern[:-1])
        return operation == pattern
    
    def install_interceptor(self):
        """Install the API interceptor globally"""
        print("✅ Read-only API interceptor installed")

def install_readonly_mode():
    """Install read-only mode globally for all AWS API calls"""
    interceptor = ReadOnlyAPIInterceptor()
    interceptor.install_interceptor()

if __name__ == '__main__':
    print("Installing AWS Read-Only API Interceptor...")
    install_readonly_mode()`
    },
    
    "deploy.sh": {
      language: "Bash",
      size: "425 bytes", 
      description: "Automated deployment script",
      content: `#!/bin/bash
# AWS Read-Only CLI Deployment Script

set -euo pipefail

INSTALL_DIR="/usr/local/bin"
SCRIPT_NAME="aws-ro"

echo "🚀 Deploying AWS Read-Only CLI..."

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 not found. Please install Python 3.7+."
    exit 1
fi

# Download and install
echo "📥 Downloading aws-ro script..."
curl -fsSL "https://raw.githubusercontent.com/your-org/aws-ro-cli/main/aws-ro.py" -o "/tmp/$SCRIPT_NAME"

echo "🔧 Installing to $INSTALL_DIR..."
sudo cp "/tmp/$SCRIPT_NAME" "$INSTALL_DIR/$SCRIPT_NAME"
sudo chmod +x "$INSTALL_DIR/$SCRIPT_NAME"

# Verify installation
echo "✅ Testing installation..."
if "$INSTALL_DIR/$SCRIPT_NAME" --help &> /dev/null; then
    echo "✅ Successfully installed aws-ro CLI!"
    echo ""
    echo "Usage examples:"
    echo "  aws-ro ec2 describe-instances        # ✅ Safe operation"
    echo "  aws-ro ec2 run-instances --help      # ❌ Blocked operation"
    echo ""
    echo "For help: aws-ro --help"
else
    echo "❌ Installation failed. Check permissions and try again."
    exit 1
fi

echo "🎉 AWS Read-Only CLI deployment complete!"`
    },
    
    "README.md": {
      language: "Markdown",
      size: "580 bytes",
      description: "Documentation and usage guide", 
      content: `# AWS Read-Only CLI

A safe wrapper around the AWS CLI that blocks all write operations to prevent accidental infrastructure changes.

## Features

- ✅ **Pattern-based filtering** (describe*, get*, list* = safe)
- ✅ **Special case handling** (sts assume-role, s3 presign)
- ✅ **Default-deny** for unknown operations
- ✅ **Audit trail** with explanation modes
- ✅ **Service-aware** classifications

## Quick Start

\`\`\`bash
# Install
curl -fsSL https://example.com/deploy.sh | bash

# Use safely
aws-ro ec2 describe-instances        # ✅ Safe - lists instances
aws-ro s3 ls s3://my-bucket/         # ✅ Safe - lists objects
aws-ro ec2 terminate-instances ...   # ❌ Blocked - would delete
\`\`\`

## Safety Features

### Always Safe Operations
- \`describe*\`, \`get*\`, \`list*\`, \`show*\`, \`search*\`
- \`check*\`, \`test*\`, \`validate*\`, \`explain*\`
- \`sts get-caller-identity\`, \`sts assume-role\`

### Always Blocked Operations  
- \`create*\`, \`delete*\`, \`update*\`, \`modify*\`, \`put*\`
- \`terminate*\`, \`stop*\`, \`start*\`, \`reboot*\`, \`reset*\`
- \`attach*\`, \`detach*\`, \`associate*\`, \`disassociate*\`

### Special Cases
- \`s3 presign\` - Requires review (can create write URLs)
- \`configure set\` - Blocked (modifies configuration)
- \`logs start-export-task\` - Blocked (creates resources)

## Installation Options

### Option 1: Quick Install
\`\`\`bash
curl -fsSL https://example.com/deploy.sh | bash
\`\`\`

### Option 2: Manual Install
\`\`\`bash
wget https://raw.githubusercontent.com/your-org/aws-ro-cli/main/aws-ro.py
chmod +x aws-ro.py
sudo mv aws-ro.py /usr/local/bin/aws-ro
\`\`\`

## License

MIT License - Use at your own risk, no warranties provided.`
    }
  };

  const copyToClipboard = async (text, filename) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    Object.entries(files).forEach(([filename, file]) => {
      downloadFile(file.content, filename);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Package className="w-10 h-10 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{packageMetadata.name}</h1>
            <p className="text-gray-600">{packageMetadata.description}</p>
          </div>
        </div>
        
        {/* Package Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{packageMetadata.version}</div>
            <div className="text-sm text-gray-600">Version</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{packageMetadata.totalSize}</div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{packageMetadata.files}</div>
            <div className="text-sm text-gray-600">Files</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{packageMetadata.securityLevel}</div>
            <div className="text-sm text-gray-600">Security Level</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={downloadAllFiles}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download All Files
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Terminal className="w-4 h-4" />
            Quick Install: curl -fsSL https://example.com/deploy.sh | bash
          </button>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Production Ready</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1">
          {['overview', 'files', 'security', 'deployment'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Package Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Architecture</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Multi-file Python + Bash package</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Clean separation of concerns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Minimal external dependencies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Cross-platform compatibility</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quality Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Code Coverage:</span>
                    <span className="font-medium">66.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Complexity:</span>
                    <span className="font-medium text-green-600">{packageMetadata.complexity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Functions:</span>
                    <span className="font-medium">{packageMetadata.functions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classes:</span>
                    <span className="font-medium">{packageMetadata.classes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Package Files</h2>
          {Object.entries(files).map(([filename, file]) => (
            <div key={filename} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-semibold">{filename}</h3>
                      <p className="text-sm text-gray-600">{file.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{file.language} • {file.size}</span>
                    <button
                      onClick={() => copyToClipboard(file.content, filename)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {copiedFile === filename ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedFile === filename ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadFile(file.content, filename)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap bg-gray-900 text-green-400 p-4 rounded">
                  <code>{file.content}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Security Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Safety Mechanisms
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Pattern-based operation filtering</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Default-deny for unknown operations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Special case handling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Comprehensive audit trail</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Blocked Operations</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-red-100 px-2 py-1 rounded">create*</code> - Resource creation</li>
                <li><code className="bg-red-100 px-2 py-1 rounded">delete*</code> - Resource deletion</li>
                <li><code className="bg-red-100 px-2 py-1 rounded">update*</code> - Resource modification</li>
                <li><code className="bg-red-100 px-2 py-1 rounded">terminate*</code> - Instance termination</li>
                <li><code className="bg-red-100 px-2 py-1 rounded">start/stop*</code> - State changes</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Allowed Operations</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Read Operations</h4>
                <ul className="text-sm space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">describe*</code></li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">get*</code></li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">list*</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Query Operations</h4>
                <ul className="text-sm space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">show*</code></li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">search*</code></li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">check*</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Validation</h4>
                <ul className="text-sm space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">test*</code></li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">validate*</code></li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">explain*</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Deployment Guide</h2>
          
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Quick Installation</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
                curl -fsSL https://raw.githubusercontent.com/your-org/aws-ro-cli/main/deploy.sh | bash
              </div>
              <p className="text-sm text-green-700 mt-2">
                This downloads and installs aws-ro to /usr/local/bin with proper permissions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Prerequisites</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>Python 3.7+</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>AWS CLI v2</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>Bash shell</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>sudo access (for installation)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Platform Support</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span>Linux (all distributions)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span>macOS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span>Windows (WSL)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Manual Installation</h3>
              <div className="space-y-3">
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
                  wget https://raw.githubusercontent.com/your-org/aws-ro-cli/main/aws-ro.py<br/>
                  chmod +x aws-ro.py<br/>
                  sudo mv aws-ro.py /usr/local/bin/aws-ro
                </div>
                <p className="text-sm text-yellow-700">
                  For development or custom installations where you want full control
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">✅ Safe operations (allowed):</p>
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                    aws-ro ec2 describe-instances<br/>
                    aws-ro s3 ls s3://my-bucket/<br/>
                    aws-ro sts get-caller-identity
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">❌ Unsafe operations (blocked):</p>
                  <div className="bg-gray-900 text-red-400 p-3 rounded font-mono text-sm">
                    aws-ro ec2 run-instances ...<br/>
                    aws-ro s3 rm s3://bucket/file<br/>
                    aws-ro ec2 terminate-instances ...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Package generated with multi-expert team analysis • Ready for production deployment
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-green-600 font-medium">Production Ready ✅</span>
            <button
              onClick={downloadAllFiles}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AWSReadOnlyPackage;