/**
 * Enhanced Storage System Initialization for AlgorithmPress
 * Integrates all storage providers and monitoring systems
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedStorage);
  } else {
    initializeEnhancedStorage();
  }

  async function initializeEnhancedStorage() {
    try {
      console.log('Initializing Enhanced Storage System...');

      // Initialize error monitoring first
      await ErrorMonitoringSystem.initialize({
        enableConsoleLogging: true,
        enablePerformanceMonitoring: true,
        enableStorageMetrics: true,
        maxLogEntries: 1000
      });

      ErrorMonitoringSystem.logInfo(
        ErrorMonitoringSystem.ERROR_CATEGORIES.RUNTIME,
        'Enhanced Storage System initialization started'
      );

      // Initialize storage configuration manager
      await StorageConfigManager.initialize();

      // Initialize storage UI manager
      await StorageUIManager.initialize();

      // Initialize unified storage with default configuration
      const defaultConfig = {
        primaryProvider: 'localStorage',
        fallbackProviders: ['localStorage'],
        settings: {
          retryAttempts: 3,
          retryDelay: 1000,
          connectionTimeout: 30000,
          enableFailover: true,
          enableCaching: true,
          enableCompression: false,
          enableEncryption: false
        },
        providers: {
          localStorage: {}
        }
      };

      await UnifiedStorage.initialize(defaultConfig);

      // Set up event listeners for storage monitoring
      setupStorageMonitoring();

      // Set up UI event handlers
      setupUIEventHandlers();

      // Update storage statistics display
      updateStorageStatistics();

      // Set up periodic statistics updates
      setInterval(updateStorageStatistics, 5000); // Every 5 seconds

      ErrorMonitoringSystem.logInfo(
        ErrorMonitoringSystem.ERROR_CATEGORIES.RUNTIME,
        'Enhanced Storage System initialized successfully'
      );

      console.log('Enhanced Storage System initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Enhanced Storage System:', error);

      if (typeof ErrorMonitoringSystem !== 'undefined') {
        ErrorMonitoringSystem.logError(
          ErrorMonitoringSystem.ERROR_CATEGORIES.RUNTIME,
          'Failed to initialize Enhanced Storage System',
          { error: error.message },
          error
        );
      }
    }
  }

  function setupStorageMonitoring() {
    // Monitor storage operations
    UnifiedStorage.addEventListener('success', (data) => {
      ErrorMonitoringSystem.recordStorageMetric(
        data.operation,
        data.provider,
        Date.now() - (data.startTime || Date.now()),
        true
      );

      ErrorMonitoringSystem.logDebug(
        ErrorMonitoringSystem.ERROR_CATEGORIES.STORAGE,
        `Storage operation successful: ${data.operation} on ${data.provider}`
      );
    });

    UnifiedStorage.addEventListener('error', (data) => {
      ErrorMonitoringSystem.recordStorageMetric(
        data.operation,
        data.provider,
        Date.now() - (data.startTime || Date.now()),
        false,
        data.error
      );

      ErrorMonitoringSystem.logError(
        ErrorMonitoringSystem.ERROR_CATEGORIES.STORAGE,
        `Storage operation failed: ${data.operation} on ${data.provider}`,
        { error: data.error.message },
        data.error
      );
    });

    UnifiedStorage.addEventListener('failover', (data) => {
      ErrorMonitoringSystem.logWarning(
        ErrorMonitoringSystem.ERROR_CATEGORIES.STORAGE,
        `Storage failover: ${data.from} -> ${data.to}`,
        { operation: data.operation, key: data.key }
      );
    });

    UnifiedStorage.addEventListener('retry', (data) => {
      ErrorMonitoringSystem.logInfo(
        ErrorMonitoringSystem.ERROR_CATEGORIES.STORAGE,
        `Storage operation retry: attempt ${data.attempt}/${data.maxRetries}`,
        { delay: data.delay, error: data.error.message }
      );
    });
  }

  function setupUIEventHandlers() {
    // Configure storage button
    const configureBtn = document.getElementById('configure-storage-btn');
    if (configureBtn) {
      configureBtn.addEventListener('click', () => {
        try {
          StorageUIManager.showModal();
        } catch (error) {
          console.error('Failed to show storage configuration modal:', error);
          ErrorMonitoringSystem.logError(
            ErrorMonitoringSystem.ERROR_CATEGORIES.UI,
            'Failed to show storage configuration modal',
            null,
            error
          );
        }
      });
    }

    // Primary storage provider selector
    const providerSelect = document.getElementById('primary-storage-provider');
    if (providerSelect) {
      providerSelect.addEventListener('change', async (event) => {
        try {
          const selectedProvider = event.target.value;
          await updatePrimaryStorageProvider(selectedProvider);
        } catch (error) {
          console.error('Failed to update primary storage provider:', error);
          ErrorMonitoringSystem.logError(
            ErrorMonitoringSystem.ERROR_CATEGORIES.STORAGE,
            'Failed to update primary storage provider',
            { provider: event.target.value },
            error
          );
        }
      });
    }

    // Storage options checkboxes
    const failoverCheckbox = document.getElementById('enable-failover');
    if (failoverCheckbox) {
      failoverCheckbox.addEventListener('change', (event) => {
        UnifiedStorage.updateSettings({ enableFailover: event.target.checked });
      });
    }

    const cachingCheckbox = document.getElementById('enable-caching');
    if (cachingCheckbox) {
      cachingCheckbox.addEventListener('change', (event) => {
        UnifiedStorage.updateSettings({ enableCaching: event.target.checked });
      });
    }

    const encryptionCheckbox = document.getElementById('enable-encryption');
    if (encryptionCheckbox) {
      encryptionCheckbox.addEventListener('change', (event) => {
        UnifiedStorage.updateSettings({ enableEncryption: event.target.checked });
      });
    }

    // View storage statistics button
    const viewStatsBtn = document.getElementById('view-storage-stats');
    if (viewStatsBtn) {
      viewStatsBtn.addEventListener('click', showDetailedStorageStats);
    }

    // Run module tests button
    const runTestsBtn = document.getElementById('run-module-tests');
    if (runTestsBtn) {
      runTestsBtn.addEventListener('click', () => {
        if (typeof ComprehensiveModuleTester !== 'undefined') {
          ComprehensiveModuleTester.showTester();
          ComprehensiveModuleTester.runAllTests();
        } else {
          console.error('ComprehensiveModuleTester not available');
          showNotification('error', 'Test Error', 'Module tester not available');
        }
      });
    }

    // Auto-fix errors button
    const autoFixBtn = document.getElementById('auto-fix-errors');
    if (autoFixBtn) {
      autoFixBtn.addEventListener('click', () => {
        if (typeof ErrorFixer !== 'undefined') {
          const results = ErrorFixer.runComprehensiveCheck();
          const totalFixes = results.globalFixes + results.moduleFixes;

          if (totalFixes > 0) {
            showNotification('success', 'Auto-Fix Complete',
              `Fixed ${totalFixes} issues (${results.globalFixes} global, ${results.moduleFixes} module-specific)`);
          } else {
            showNotification('info', 'No Issues Found', 'All modules appear to be functioning correctly');
          }

          if (results.errors.length > 0) {
            console.warn('Some fixes failed:', results.errors);
          }
        } else {
          console.error('ErrorFixer not available');
          showNotification('error', 'Fix Error', 'Error fixer not available');
        }
      });
    }
  }

  async function updatePrimaryStorageProvider(provider) {
    try {
      // Check if provider is configured
      const config = StorageConfigManager.getConfig(provider);

      if (!config && provider !== 'localStorage') {
        // Provider not configured, show configuration modal
        StorageUIManager.showModal();

        // Show notification
        showNotification(
          'warning',
          'Provider Not Configured',
          `Please configure ${provider} before using it as primary storage.`
        );

        // Reset to localStorage
        document.getElementById('primary-storage-provider').value = 'localStorage';
        return;
      }

      // Update unified storage configuration
      const currentStats = UnifiedStorage.getStats();
      const newConfig = {
        primaryProvider: provider,
        fallbackProviders: currentStats.fallbackProviders,
        providers: {}
      };

      // Add provider configuration
      if (config) {
        newConfig.providers[provider] = config;
      }

      await UnifiedStorage.initialize(newConfig);

      ErrorMonitoringSystem.logInfo(
        ErrorMonitoringSystem.ERROR_CATEGORIES.STORAGE,
        `Primary storage provider updated to ${provider}`
      );

      showNotification(
        'success',
        'Storage Updated',
        `Primary storage provider changed to ${provider}`
      );

    } catch (error) {
      console.error('Failed to update primary storage provider:', error);
      throw error;
    }
  }

  function updateStorageStatistics() {
    try {
      const storageStats = ErrorMonitoringSystem.getStorageMetrics();
      const performanceStats = ErrorMonitoringSystem.getPerformanceMetrics();

      // Calculate total operations and success rate
      let totalOperations = 0;
      let successfulOperations = 0;

      Object.values(storageStats).forEach(stat => {
        totalOperations += stat.totalOperations;
        successfulOperations += stat.successfulOperations;
      });

      const successRate = totalOperations > 0 ?
        Math.round((successfulOperations / totalOperations) * 100) : 100;

      // Update UI elements
      const operationsElement = document.getElementById('storage-operations-count');
      if (operationsElement) {
        operationsElement.textContent = totalOperations.toString();
      }

      const successRateElement = document.getElementById('storage-success-rate');
      if (successRateElement) {
        successRateElement.textContent = `${successRate}%`;

        // Update badge color based on success rate
        successRateElement.className = 'badge ' +
          (successRate >= 95 ? 'bg-success' :
           successRate >= 80 ? 'bg-warning' : 'bg-danger');
      }

    } catch (error) {
      console.error('Failed to update storage statistics:', error);
    }
  }

  function showDetailedStorageStats() {
    try {
      const errorStats = ErrorMonitoringSystem.getErrorStats();
      const performanceStats = ErrorMonitoringSystem.getPerformanceMetrics();
      const storageStats = ErrorMonitoringSystem.getStorageMetrics();

      // Create detailed stats modal
      const modalHTML = `
        <div class="modal fade" id="storage-stats-modal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="fas fa-chart-bar"></i> Storage Statistics
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-6">
                    <h6>Error Statistics</h6>
                    <ul class="list-group list-group-flush">
                      <li class="list-group-item d-flex justify-content-between">
                        <span>Total Errors (24h)</span>
                        <span class="badge bg-danger">${errorStats.totalErrors}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between">
                        <span>Storage Errors</span>
                        <span class="badge bg-warning">${errorStats.errorsByCategory.storage || 0}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between">
                        <span>Network Errors</span>
                        <span class="badge bg-info">${errorStats.errorsByCategory.network || 0}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="col-md-6">
                    <h6>Performance Metrics</h6>
                    <ul class="list-group list-group-flush">
                      ${Object.entries(performanceStats).map(([name, stats]) => `
                        <li class="list-group-item d-flex justify-content-between">
                          <span>${name}</span>
                          <span class="badge bg-primary">${Math.round(stats.average)}ms</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>

                <div class="mt-4">
                  <h6>Storage Provider Statistics</h6>
                  <div class="table-responsive">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>Provider</th>
                          <th>Operations</th>
                          <th>Success Rate</th>
                          <th>Avg Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${Object.entries(storageStats).map(([key, stats]) => `
                          <tr>
                            <td>${key}</td>
                            <td>${stats.totalOperations}</td>
                            <td>
                              <span class="badge ${stats.successRate >= 0.95 ? 'bg-success' :
                                stats.successRate >= 0.8 ? 'bg-warning' : 'bg-danger'}">
                                ${Math.round(stats.successRate * 100)}%
                              </span>
                            </td>
                            <td>${Math.round(stats.averageDuration)}ms</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" onclick="downloadStorageLogs()">
                  <i class="fas fa-download"></i> Download Logs
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Remove existing modal
      const existingModal = document.getElementById('storage-stats-modal');
      if (existingModal) {
        existingModal.remove();
      }

      // Add new modal
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('storage-stats-modal'));
      modal.show();

    } catch (error) {
      console.error('Failed to show detailed storage stats:', error);
      ErrorMonitoringSystem.logError(
        ErrorMonitoringSystem.ERROR_CATEGORIES.UI,
        'Failed to show detailed storage stats',
        null,
        error
      );
    }
  }

  function showNotification(type, title, message) {
    // Simple notification system - can be enhanced with a proper notification library
    const alertClass = type === 'success' ? 'alert-success' :
                      type === 'warning' ? 'alert-warning' :
                      type === 'error' ? 'alert-danger' : 'alert-info';

    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      <strong>${title}:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Global function for downloading logs
  window.downloadStorageLogs = function() {
    try {
      const logs = ErrorMonitoringSystem.exportLogs('json');
      const blob = new Blob([logs], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `algorithmpress-storage-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download logs:', error);
    }
  };

})();
