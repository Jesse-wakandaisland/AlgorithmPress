/**
 * Error Monitoring and Logging System for AlgorithmPress
 * Production-ready error handling, logging, and monitoring
 */
console.log('[ErrorMonitoringSystem] Script start');

const ErrorMonitoringSystem = (function() {
  'use strict';
  console.log('[ErrorMonitoringSystem] IIFE start');

  // Error levels
  const ERROR_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal'
  };

  // Error categories
  const ERROR_CATEGORIES = {
    STORAGE: 'storage',
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    PERMISSION: 'permission',
    CONFIGURATION: 'configuration',
    RUNTIME: 'runtime',
    UI: 'ui'
  };

  // Configuration
  const config = {
    maxLogEntries: 1000,
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    remoteEndpoint: null,
    enableUserNotifications: true,
    enablePerformanceMonitoring: true,
    enableStorageMetrics: true,
    retentionDays: 7
  };

  // Storage for logs and metrics
  const logs = [];
  const metrics = {
    errors: new Map(),
    performance: new Map(),
    storage: new Map()
  };

  // Event listeners
  const listeners = {
    error: [],
    warning: [],
    info: [],
    metric: []
  };

  /**
   * Initialize the error monitoring system
   */
  function initialize(options = {}) {
    Object.assign(config, options);

    // Set up global error handlers
    setupGlobalErrorHandlers();
    
    // Set up performance monitoring
    if (config.enablePerformanceMonitoring) {
      setupPerformanceMonitoring();
    }

    // Load existing logs from storage
    loadLogsFromStorage();

    // Set up periodic cleanup
    setInterval(cleanupOldLogs, 60000); // Every minute

    log(ERROR_LEVELS.INFO, ERROR_CATEGORIES.RUNTIME, 'Error monitoring system initialized');
  }

  /**
   * Set up global error handlers
   */
  function setupGlobalErrorHandlers() {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      logError(ERROR_CATEGORIES.RUNTIME, 'Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError(ERROR_CATEGORIES.RUNTIME, 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Network errors
    window.addEventListener('offline', () => {
      logWarning(ERROR_CATEGORIES.NETWORK, 'Network connection lost');
    });

    window.addEventListener('online', () => {
      logInfo(ERROR_CATEGORIES.NETWORK, 'Network connection restored');
    });
  }

  /**
   * Set up performance monitoring
   */
  function setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          recordMetric('page_load_time', perfData.loadEventEnd - perfData.fetchStart);
          recordMetric('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart);
          recordMetric('first_paint', perfData.responseEnd - perfData.fetchStart);
        }
      }, 0);
    });

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          recordMetric(`resource_${entry.initiatorType}_time`, entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Log a message with specified level and category
   */
  function log(level, category, message, data = null, error = null) {
    const logEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error: error ? serializeError(error) : null,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: getSessionId()
    };

    // Add to logs array
    logs.push(logEntry);

    // Maintain max log entries
    if (logs.length > config.maxLogEntries) {
      logs.shift();
    }

    // Console logging
    if (config.enableConsoleLogging) {
      const consoleMethod = getConsoleMethod(level);
      const logMessage = `[${level.toUpperCase()}] [${category}] ${message}`;
      
      if (data || error) {
        console[consoleMethod](logMessage, { data, error });
      } else {
        console[consoleMethod](logMessage);
      }
    }

    // Remote logging
    if (config.enableRemoteLogging && config.remoteEndpoint) {
      sendToRemoteEndpoint(logEntry);
    }

    // User notifications
    if (config.enableUserNotifications && level === ERROR_LEVELS.ERROR) {
      showUserNotification(message, 'error');
    }

    // Notify listeners
    notifyListeners(level, logEntry);

    // Update error metrics
    updateErrorMetrics(level, category);

    // Save to storage
    saveLogsToStorage();
  }

  /**
   * Convenience methods for different log levels
   */
  function logDebug(category, message, data = null) {
    log(ERROR_LEVELS.DEBUG, category, message, data);
  }

  function logInfo(category, message, data = null) {
    log(ERROR_LEVELS.INFO, category, message, data);
  }

  function logWarning(category, message, data = null) {
    log(ERROR_LEVELS.WARN, category, message, data);
  }

  function logError(category, message, data = null, error = null) {
    log(ERROR_LEVELS.ERROR, category, message, data, error);
  }

  function logFatal(category, message, data = null, error = null) {
    log(ERROR_LEVELS.FATAL, category, message, data, error);
  }

  /**
   * Record a performance metric
   */
  function recordMetric(name, value, tags = {}) {
    const metricEntry = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    if (!metrics.performance.has(name)) {
      metrics.performance.set(name, []);
    }

    metrics.performance.get(name).push(metricEntry);

    // Notify listeners
    notifyListeners('metric', metricEntry);

    // Keep only recent metrics (last 1000 entries per metric)
    const metricArray = metrics.performance.get(name);
    if (metricArray.length > 1000) {
      metricArray.shift();
    }
  }

  /**
   * Record storage operation metrics
   */
  function recordStorageMetric(operation, provider, duration, success, error = null) {
    const metricKey = `${operation}_${provider}`;
    
    if (!metrics.storage.has(metricKey)) {
      metrics.storage.set(metricKey, {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        totalDuration: 0,
        averageDuration: 0,
        errors: []
      });
    }

    const metric = metrics.storage.get(metricKey);
    metric.totalOperations++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.totalOperations;

    if (success) {
      metric.successfulOperations++;
    } else {
      metric.failedOperations++;
      if (error) {
        metric.errors.push({
          timestamp: Date.now(),
          error: serializeError(error)
        });
        
        // Keep only last 100 errors
        if (metric.errors.length > 100) {
          metric.errors.shift();
        }
      }
    }

    // Log significant issues
    const failureRate = metric.failedOperations / metric.totalOperations;
    if (failureRate > 0.1 && metric.totalOperations > 10) {
      logWarning(ERROR_CATEGORIES.STORAGE, 
        `High failure rate for ${operation} on ${provider}`, 
        { failureRate, totalOperations: metric.totalOperations }
      );
    }
  }

  /**
   * Get error statistics
   */
  function getErrorStats() {
    const stats = {
      totalErrors: 0,
      errorsByLevel: {},
      errorsByCategory: {},
      recentErrors: [],
      topErrors: []
    };

    // Initialize counters
    Object.values(ERROR_LEVELS).forEach(level => {
      stats.errorsByLevel[level] = 0;
    });

    Object.values(ERROR_CATEGORIES).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });

    // Count errors
    const recentLogs = logs.filter(log => 
      Date.now() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    recentLogs.forEach(log => {
      if (log.level === ERROR_LEVELS.ERROR || log.level === ERROR_LEVELS.FATAL) {
        stats.totalErrors++;
        stats.errorsByLevel[log.level]++;
        stats.errorsByCategory[log.category]++;
        
        if (stats.recentErrors.length < 10) {
          stats.recentErrors.push(log);
        }
      }
    });

    // Get top error messages
    const errorCounts = {};
    recentLogs.forEach(log => {
      if (log.level === ERROR_LEVELS.ERROR || log.level === ERROR_LEVELS.FATAL) {
        errorCounts[log.message] = (errorCounts[log.message] || 0) + 1;
      }
    });

    stats.topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    return stats;
  }

  /**
   * Get performance metrics
   */
  function getPerformanceMetrics() {
    const performanceStats = {};

    metrics.performance.forEach((values, name) => {
      const recentValues = values.filter(v => 
        Date.now() - v.timestamp < 60 * 60 * 1000 // Last hour
      );

      if (recentValues.length > 0) {
        const sum = recentValues.reduce((acc, v) => acc + v.value, 0);
        const avg = sum / recentValues.length;
        const min = Math.min(...recentValues.map(v => v.value));
        const max = Math.max(...recentValues.map(v => v.value));

        performanceStats[name] = {
          count: recentValues.length,
          average: avg,
          min,
          max,
          total: sum
        };
      }
    });

    return performanceStats;
  }

  /**
   * Get storage metrics
   */
  function getStorageMetrics() {
    const storageStats = {};

    metrics.storage.forEach((metric, key) => {
      storageStats[key] = {
        ...metric,
        successRate: metric.totalOperations > 0 ? 
          metric.successfulOperations / metric.totalOperations : 0,
        failureRate: metric.totalOperations > 0 ? 
          metric.failedOperations / metric.totalOperations : 0
      };
    });

    return storageStats;
  }

  /**
   * Export logs for analysis
   */
  function exportLogs(format = 'json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      logs: logs,
      metrics: {
        performance: Object.fromEntries(metrics.performance),
        storage: Object.fromEntries(metrics.storage)
      },
      stats: {
        errors: getErrorStats(),
        performance: getPerformanceMetrics(),
        storage: getStorageMetrics()
      }
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return convertLogsToCSV(logs);
    }

    return exportData;
  }

  /**
   * Helper functions
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function getSessionId() {
    let sessionId = sessionStorage.getItem('algorithmpress_session_id');
    if (!sessionId) {
      sessionId = generateId();
      sessionStorage.setItem('algorithmpress_session_id', sessionId);
    }
    return sessionId;
  }

  function serializeError(error) {
    if (!error) return null;
    
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    };
  }

  function getConsoleMethod(level) {
    switch (level) {
      case ERROR_LEVELS.DEBUG: return 'debug';
      case ERROR_LEVELS.INFO: return 'info';
      case ERROR_LEVELS.WARN: return 'warn';
      case ERROR_LEVELS.ERROR: return 'error';
      case ERROR_LEVELS.FATAL: return 'error';
      default: return 'log';
    }
  }

  function updateErrorMetrics(level, category) {
    const key = `${level}_${category}`;
    metrics.errors.set(key, (metrics.errors.get(key) || 0) + 1);
  }

  function notifyListeners(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  function showUserNotification(message, type) {
    // Use window.showToast if available (potentially provided by UI framework)
    if (typeof window.showToast === 'function') {
      // Assuming window.showToast takes (type, message) or similar
      // Adjust if the actual signature is different
      window.showToast(type === ERROR_LEVELS.ERROR ? 'error' : 'info', message);
    } else {
      // Fallback if no global toast function is found
      console.warn(`[User Notification - ${type}]: ${message}`);
    }
  }

  function sendToRemoteEndpoint(logEntry) {
    // Implementation for remote logging
    fetch(config.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(error => {
      console.error('Failed to send log to remote endpoint:', error);
    });
  }

  function saveLogsToStorage() {
    try {
      const recentLogs = logs.slice(-100); // Keep only last 100 logs in storage
      localStorage.setItem('algorithmpress_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }

  function loadLogsFromStorage() {
    try {
      const storedLogs = localStorage.getItem('algorithmpress_logs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        logs.push(...parsedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
  }

  function cleanupOldLogs() {
    const cutoffTime = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Remove old logs
    for (let i = logs.length - 1; i >= 0; i--) {
      if (new Date(logs[i].timestamp).getTime() < cutoffTime) {
        logs.splice(i, 1);
      }
    }

    // Clean up old metrics
    metrics.performance.forEach((values, name) => {
      const filtered = values.filter(v => v.timestamp > cutoffTime);
      metrics.performance.set(name, filtered);
    });
  }

  function convertLogsToCSV(logs) {
    const headers = ['timestamp', 'level', 'category', 'message', 'url', 'sessionId'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.url,
        log.sessionId
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Public API
  return {
    ERROR_LEVELS,
    ERROR_CATEGORIES,
    initialize,
    log,
    logDebug,
    logInfo,
    logWarning,
    logError,
    logFatal,
    recordMetric,
    recordStorageMetric,
    getErrorStats,
    getPerformanceMetrics,
    getStorageMetrics,
    exportLogs,
    
    // Event management
    addEventListener: (event, callback) => {
      if (listeners[event]) {
        listeners[event].push(callback);
      }
    },
    
    removeEventListener: (event, callback) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(callback);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      }
    },
    
    // Configuration
    updateConfig: (newConfig) => {
      Object.assign(config, newConfig);
    },
    
    getConfig: () => ({ ...config })
  };
})();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorMonitoringSystem;
} else if (typeof window !== 'undefined') {
  window.ErrorMonitoringSystem = ErrorMonitoringSystem;
  console.log('[ErrorMonitoringSystem] Assigned to window.ErrorMonitoringSystem');
}
console.log('[ErrorMonitoringSystem] Script end');
