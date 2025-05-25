import { useState, useCallback } from 'react';

export const useConsoleLogger = () => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addLog = useCallback((level, message, context = null, data = null) => {
    const entry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data
    };
    
    setLogs(prev => [...prev, entry]);
    
    // Also log to browser console for fallback
    const consoleMethod = console[level] || console.log;
    const prefix = context ? `[${context}]` : '';
    if (data) {
      consoleMethod(`${prefix} ${message}`, data);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }
  }, []);

  const log = useCallback((message, context = null, data = null) => {
    addLog('log', message, context, data);
  }, [addLog]);

  const info = useCallback((message, context = null, data = null) => {
    addLog('info', message, context, data);
  }, [addLog]);

  const warn = useCallback((message, context = null, data = null) => {
    addLog('warn', message, context, data);
  }, [addLog]);

  const error = useCallback((message, context = null, data = null) => {
    addLog('error', message, context, data);
  }, [addLog]);

  const success = useCallback((message, context = null, data = null) => {
    addLog('success', message, context, data);
  }, [addLog]);

  const debug = useCallback((message, context = null, data = null) => {
    addLog('debug', message, context, data);
  }, [addLog]);

  const clear = useCallback(() => {
    setLogs([]);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    logs,
    isOpen,
    log,
    info,
    warn,
    error,
    success,
    debug,
    clear,
    toggle,
    close,
    open
  };
};