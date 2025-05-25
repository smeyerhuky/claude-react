import { memo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal, X, Minimize2, Maximize2, Trash2, Copy } from 'lucide-react';

const LogEntry = memo(({ entry, index }) => {
  const getLogColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-400 border-red-500/20 bg-red-500/10';
      case 'warn': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
      case 'info': return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
      case 'success': return 'text-green-400 border-green-500/20 bg-green-500/10';
      case 'debug': return 'text-gray-400 border-gray-500/20 bg-gray-500/10';
      default: return 'text-white border-gray-500/20 bg-gray-500/10';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className={`p-2 mb-1 rounded border ${getLogColor(entry.level)} font-mono text-xs`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-1 py-0">
            {entry.level.toUpperCase()}
          </Badge>
          <span className="text-gray-500">{formatTimestamp(entry.timestamp)}</span>
          {entry.context && (
            <span className="text-purple-400">[{entry.context}]</span>
          )}
        </div>
        <span className="text-gray-500">#{index + 1}</span>
      </div>
      <div className="whitespace-pre-wrap break-words">
        {entry.message}
      </div>
      {entry.data && (
        <details className="mt-1">
          <summary className="cursor-pointer text-gray-400 hover:text-white">
            Show data
          </summary>
          <pre className="mt-1 p-2 bg-black/30 rounded text-xs overflow-auto">
            {JSON.stringify(entry.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
});

LogEntry.displayName = 'LogEntry';

export const ConsoleDrawer = memo(({ logs, onClear, isOpen, onToggle, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef(null);
  const endRef = useRef(null);
  
  // Copy logs to clipboard
  const copyLogs = async () => {
    const logText = logs.map(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
      const context = entry.context ? `[${entry.context}] ` : '';
      const data = entry.data ? `\nData: ${JSON.stringify(entry.data, null, 2)}` : '';
      return `[${entry.level.toUpperCase()}] ${timestamp} ${context}${entry.message}${data}`;
    }).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      // Could show a toast here, but keeping it simple
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = logText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (endRef.current && !isMinimized) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isMinimized]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[45vw]">
      <Card className="bg-gray-900/98 border-gray-700 shadow-2xl backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <CardTitle className="text-sm text-green-400">Console Logs</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {logs.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={copyLogs}
                className="w-6 h-6 p-0 text-blue-400 hover:text-blue-300"
                title="Copy logs to clipboard"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClear}
                className="w-6 h-6 p-0 text-yellow-400 hover:text-yellow-300"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-6 h-6 p-0"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="w-6 h-6 p-0 text-red-400 hover:text-red-300"
                title="Close console"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0">
            <ScrollArea 
              ref={scrollAreaRef}
              className="h-60 p-2"
            >
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No console logs yet</p>
                  <p className="text-xs">Upload a file to see logs</p>
                </div>
              ) : (
                <>
                  {logs.map((entry, index) => (
                    <LogEntry key={`${entry.timestamp}-${index}`} entry={entry} index={index} />
                  ))}
                  <div ref={endRef} />
                </>
              )}
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
});

ConsoleDrawer.displayName = 'ConsoleDrawer';