/**
 * Comprehensive Module Tester for AlgorithmPress
 * Tests all modules for errors, missing dependencies, and functionality
 */

const ComprehensiveModuleTester = (function() {
  'use strict';

  // Test results storage
  let testResults = {
    modules: {},
    dependencies: {},
    errors: [],
    warnings: [],
    summary: {
      totalModules: 0,
      passedModules: 0,
      failedModules: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    }
  };

  // Module definitions and their expected properties/methods
  const moduleDefinitions = {
    'UnifiedStorage': {
      type: 'object',
      required: ['initialize', 'save', 'load', 'remove', 'list', 'PROVIDERS'],
      optional: [
        'addEventListener', 'removeEventListener', 'getStats', 'updateSettings',
        'initializeProvider', 'initializeLocalStorage', 'initializeCubbitStorage',
        'initializeAwsS3Storage', 'initializeGoogleCloudStorage', 'initializeAzureBlobStorage',
        'initializeDigitalOceanStorage', 'initializeVultrStorage', 'initializeOvhCloudStorage',
        'initializeAlibabaOssStorage', 'initializeBackblazeB2Storage', 'initializeWasabiStorage',
        'initializeLinodeStorage', 'initializeIpfsStorage', 'initializeStorjStorage',
        'initializeArweaveStorage', 'initializeFilecoinStorage', 'initializeSiaStorage', 'initializeSwarmStorage'
      ]
    },
    'StorageConfigManager': {
      type: 'object',
      required: ['initialize', 'getConfig', 'setConfig', 'validateConfig'],
      optional: [
        'removeConfig', 'getConfiguredProviders', 'testConnection',
        'exportConfigurations', 'importConfigurations',
        'setActiveStorageSettings', 'getActiveStorageSettings', 'DEFAULT_CONFIGS'
      ]
    },
    'StorageUIManager': { // Assuming this file exists: storage-ui-manager.js
      type: 'object',
      required: ['initialize', 'showModal', 'hideModal'],
      optional: ['isInitialized']
    },
    'ErrorMonitoringSystem': {
      type: 'object',
      required: ['initialize', 'logError', 'logWarning', 'logInfo'],
      optional: ['getErrorStats', 'getPerformanceMetrics', 'exportLogs']
    },
    'VoiceControlSystem': {
      type: 'object',
      required: ['initialize', 'startListening', 'stopListening'],
      optional: ['isListening', 'pauseListening', 'resumeListening']
    },
    'NexusGrid': {
      type: 'object',
      required: ['initialize'],
      optional: ['togglePanel', 'createGrid', 'addNode']
    },
    'DemoSystem': {
      type: 'object',
      required: ['initialize'],
      optional: ['togglePanel', 'createDemo', 'runDemo']
    },
    'ImplementationExample': {
      type: 'object',
      required: ['initialize'],
      optional: ['togglePanel', 'showExample']
    },
    'CubbitStorage': {
      type: 'object',
      required: ['initialize'],
      optional: ['saveProject', 'loadProject', 'listProjects']
    },
    'RainbowIndicator': {
      type: 'object',
      required: [],
      optional: ['start', 'stop', 'updateSettings']
    },
    'ModuleFramework': {
      type: 'object',
      required: ['initialize', 'registerModule', 'getModule'],
      optional: ['loadModule', 'unloadModule', 'getModules', 'on', 'off', 'emit', 'getModuleStatus', 'setModuleStatus', 'MODULE_STATUS']
    },
    'PublishingSystem': {
      type: 'object',
      required: ['initialize', 'togglePublishingPanel'],
      optional: ['showPublishingPanel', 'hidePublishingPanel', 'isInitialized', 'getSettings', 'updateSettings']
    },
    'EcommerceSystem': {
      type: 'object',
      required: ['initialize', 'togglePanel'],
      optional: ['showPanel', 'hidePanel', 'isInitialized', 'getSettings', 'updateSettings', 'addProduct', 'refreshProductsView']
    },
    'ErrorFixer': {
      type: 'object',
      required: ['initialize', 'runComprehensiveCheck'],
      optional: ['applyGlobalFixes', 'applyModuleFixes', 'tryAutoFix']
    },
    'ApiGateway': { // Corrected casing to PascalCase
      type: 'object',
      required: ['initialize', 'registerApi', 'call'],
      optional: ['unregisterApi', 'getHistory', 'clearHistory', 'getApis']
    },
    'PluginSystemModule': {
      type: 'object',
      required: ['initialize', 'registerPlugin', 'activatePlugin', 'deactivatePlugin'],
      optional: ['getPlugin', 'listPlugins', 'listActivePlugins', 'isPluginActive', 'addHook', 'removeHook', 'triggerHook']
    },
    'WordPressConnector': {
      type: 'object',
      required: ['init', 'toggleConnectorPanel'],
      optional: ['getSites', 'getCurrentSite', 'callApi', 'getSettings', 'updateSettings']
    },
    'PHPWasmIntegration': {
      type: 'object',
      required: ['initialize', 'executeCode', 'createFile', 'readFile'],
      optional: ['executeFile', 'createDirectory', 'listFiles', 'reset', 'isInitialized', 'getPhpVersion', 'setPhpVersion', 'loadExtension', 'getLoadedExtensions']
    },
    'PHPWasmBuilder': {
      type: 'object',
      required: ['initialize', 'createNewProject', 'saveCurrentProject', 'loadProject'],
      optional: ['exportProject', 'showPreview', 'addComponent', 'getState', 'setTheme', 'undo', 'redo', 'getProjectData', 'loadComponents']
    },
    'PHPWasmExporter': {
      type: 'object',
      required: ['initialize', 'exportProject'],
      optional: ['deployProject', 'EXPORT_FORMATS', 'DEPLOYMENT_TARGETS']
    },
    // ProductionInitialization exposes getProductionStatus
    // This is tested via globalFunctionTests as 'getProductionStatus'
  };

  // DOM element tests
  const domElementTests = [
    { id: 'algorithm-press-dock', description: 'Main dock element' },
    { id: 'components-tab', description: 'Components tab' },
    { id: 'properties-tab', description: 'Properties tab' },
    { id: 'php-settings-tab', description: 'PHP settings tab' },
    { id: 'storage-tab', description: 'Storage tab' },
    { id: 'preview-btn', description: 'Preview button' },
    { id: 'configure-storage-btn', description: 'Configure storage button' }
  ];

  // Required global functions
  const globalFunctionTests = [
    'initializeLocalStorage',
    'initializeAwsS3Storage',
    'initializeGoogleCloudStorage',
    'initializeAzureBlobStorage',
    'initializeDigitalOceanStorage',
    'initializeVultrStorage',
    'initializeOvhCloudStorage',
    'initializeAlibabaOssStorage',
    'initializeBackblazeB2Storage',
    'initializeWasabiStorage',
    'initializeLinodeStorage',
    'initializeIpfsStorage',
    'initializeStorjStorage',
    'initializeArweaveStorage',
    'initializeFilecoinStorage',
    'initializeSiaStorage',
    'initializeSwarmStorage',
    'getProductionStatus' // Added from ProductionInitialization
  ];

  /**
   * Initialize the comprehensive module tester
   */
  function initialize() {
    console.log('🧪 Initializing Comprehensive Module Tester...');

    // Reset test results
    resetTestResults();

    // Create test UI
    createTestUI();

    console.log('✅ Comprehensive Module Tester initialized');
  }

  /**
   * Reset test results
   */
  function resetTestResults() {
    testResults = {
      modules: {},
      dependencies: {},
      errors: [],
      warnings: [],
      summary: {
        totalModules: 0,
        passedModules: 0,
        failedModules: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      }
    };
  }

  /**
   * Create test UI
   */
  function createTestUI() {
    // Remove existing test UI
    const existingUI = document.getElementById('module-tester-ui');
    if (existingUI) {
      existingUI.remove();
    }

    // Create test UI container
    const testUI = document.createElement('div');
    testUI.id = 'module-tester-ui';
    testUI.className = 'module-tester-ui';

    testUI.innerHTML = `
      <div class="tester-header">
        <h3>🧪 AlgorithmPress Module Tester</h3>
        <div class="tester-controls">
          <button id="run-all-tests-btn" class="btn btn-primary">Run All Tests</button>
          <button id="run-module-tests-btn" class="btn btn-secondary">Test Modules</button>
          <button id="run-dom-tests-btn" class="btn btn-secondary">Test DOM</button>
          <button id="run-function-tests-btn" class="btn btn-secondary">Test Functions</button>
          <button id="auto-fix-btn" class="btn btn-warning">Auto-Fix Issues</button>
          <button id="export-results-btn" class="btn btn-outline-primary">Export Results</button>
          <button id="close-tester-btn" class="btn btn-outline-secondary">Close</button>
        </div>
      </div>
      <div class="tester-body">
        <div class="test-summary">
          <div class="summary-item">
            <span class="summary-label">Total Tests:</span>
            <span class="summary-value" id="total-tests">0</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Passed:</span>
            <span class="summary-value passed" id="passed-tests">0</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Failed:</span>
            <span class="summary-value failed" id="failed-tests">0</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Modules:</span>
            <span class="summary-value" id="module-count">0</span>
          </div>
        </div>
        <div class="test-results" id="test-results">
          <div class="no-tests">Click "Run All Tests" to start testing</div>
        </div>
      </div>
    `;

    // Add styles
    const styles = `
      <style>
        .module-tester-ui {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 1000px;
          height: 80%;
          max-height: 700px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .tester-header {
          padding: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 15px 15px 0 0;
        }

        .tester-header h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .tester-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tester-controls .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #28a745;
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-outline-primary {
          background: transparent;
          color: white;
          border: 1px solid white;
        }

        .btn-outline-secondary {
          background: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .tester-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .test-summary {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .summary-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .summary-value.passed {
          color: #28a745;
        }

        .summary-value.failed {
          color: #dc3545;
        }

        .test-results {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 15px;
          max-height: 400px;
          overflow-y: auto;
        }

        .no-tests {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 40px;
        }

        .test-category {
          margin-bottom: 20px;
        }

        .test-category h4 {
          margin: 0 0 10px 0;
          padding: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 6px;
          font-size: 16px;
        }

        .test-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          margin: 5px 0;
          border-radius: 4px;
          border-left: 4px solid #ddd;
        }

        .test-item.passed {
          background: rgba(40, 167, 69, 0.1);
          border-left-color: #28a745;
        }

        .test-item.failed {
          background: rgba(220, 53, 69, 0.1);
          border-left-color: #dc3545;
        }

        .test-item.warning {
          background: rgba(255, 193, 7, 0.1);
          border-left-color: #ffc107;
        }

        .test-name {
          font-weight: 500;
        }

        .test-status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: bold;
        }

        .test-status.passed {
          background: #28a745;
          color: white;
        }

        .test-status.failed {
          background: #dc3545;
          color: white;
        }

        .test-status.warning {
          background: #ffc107;
          color: #333;
        }

        .test-details {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }

        .error-details {
          background: rgba(220, 53, 69, 0.1);
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
        }
      </style>
    `;

    // Add styles to head
    document.head.insertAdjacentHTML('beforeend', styles);

    // Add to body
    document.body.appendChild(testUI);

    // Set up event listeners
    setupTestUIEventListeners();
  }

  /**
   * Set up test UI event listeners
   */
  function setupTestUIEventListeners() {
    document.getElementById('run-all-tests-btn').addEventListener('click', runAllTests);
    document.getElementById('run-module-tests-btn').addEventListener('click', runModuleTests);
    document.getElementById('run-dom-tests-btn').addEventListener('click', runDOMTests);
    document.getElementById('run-function-tests-btn').addEventListener('click', runFunctionTests);
    document.getElementById('auto-fix-btn').addEventListener('click', runAutoFix);
    document.getElementById('export-results-btn').addEventListener('click', exportTestResults);
    document.getElementById('close-tester-btn').addEventListener('click', closeTester);
  }

  /**
   * Run all tests
   */
  async function runAllTests() {
    console.log('🚀 Running all tests...');

    resetTestResults();
    updateTestSummary();

    const resultsContainer = document.getElementById('test-results');
    resultsContainer.innerHTML = '<div class="loading">Running tests...</div>';

    try {
      // Run different test categories
      await runModuleTests(false);
      await runDOMTests(false);
      await runFunctionTests(false);
      await runDependencyTests();

      // Display results
      displayTestResults();

      console.log('✅ All tests completed');
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      testResults.errors.push({
        type: 'Test Execution Error',
        message: error.message,
        stack: error.stack
      });
      displayTestResults();
    }
  }

  /**
   * Run module tests
   */
  async function runModuleTests(displayResults = true) {
    console.log('🔍 Testing modules...');

    for (const [moduleName, definition] of Object.entries(moduleDefinitions)) {
      const moduleResult = {
        name: moduleName,
        exists: false,
        type: null,
        requiredMethods: [],
        optionalMethods: [],
        errors: [],
        warnings: []
      };

      try {
        // Check if module exists
        const module = window[moduleName];
        if (module) {
          moduleResult.exists = true;
          moduleResult.type = typeof module;

          // Check required methods
          for (const method of definition.required) {
            if (typeof module[method] === 'function' || module[method] !== undefined) {
              moduleResult.requiredMethods.push({ name: method, exists: true });
              testResults.summary.passedTests++;
            } else {
              moduleResult.requiredMethods.push({ name: method, exists: false });
              moduleResult.errors.push(`Missing required method: ${method}`);
              testResults.summary.failedTests++;
            }
            testResults.summary.totalTests++;
          }

          // Check optional methods
          for (const method of definition.optional) {
            if (typeof module[method] === 'function' || module[method] !== undefined) {
              moduleResult.optionalMethods.push({ name: method, exists: true });
            } else {
              moduleResult.optionalMethods.push({ name: method, exists: false });
              moduleResult.warnings.push(`Missing optional method: ${method}`);
            }
          }

          testResults.summary.passedModules++;
        } else {
          moduleResult.errors.push('Module not found in global scope');
          testResults.summary.failedModules++;
          testResults.summary.failedTests++;
          testResults.summary.totalTests++;
        }
      } catch (error) {
        moduleResult.errors.push(`Error testing module: ${error.message}`);
        testResults.summary.failedModules++;
      }

      testResults.modules[moduleName] = moduleResult;
      testResults.summary.totalModules++;
    }

    if (displayResults) {
      displayTestResults();
    }
  }

  /**
   * Run DOM tests
   */
  async function runDOMTests(displayResults = true) {
    console.log('🔍 Testing DOM elements...');

    testResults.dom = {};

    for (const elementTest of domElementTests) {
      const domResult = {
        id: elementTest.id,
        description: elementTest.description,
        exists: false,
        visible: false,
        errors: []
      };

      try {
        const element = document.getElementById(elementTest.id);
        if (element) {
          domResult.exists = true;

          // Check if element is visible
          const style = window.getComputedStyle(element);
          domResult.visible = style.display !== 'none' && style.visibility !== 'hidden';

          testResults.summary.passedTests++;
        } else {
          domResult.errors.push('Element not found in DOM');
          testResults.summary.failedTests++;
        }
      } catch (error) {
        domResult.errors.push(`Error testing DOM element: ${error.message}`);
        testResults.summary.failedTests++;
      }

      testResults.dom[elementTest.id] = domResult;
      testResults.summary.totalTests++;
    }

    if (displayResults) {
      displayTestResults();
    }
  }

  /**
   * Run function tests
   */
  async function runFunctionTests(displayResults = true) {
    console.log('🔍 Testing global functions...');

    testResults.functions = {};

    for (const functionName of globalFunctionTests) {
      const functionResult = {
        name: functionName,
        exists: false,
        type: null,
        errors: []
      };

      try {
        const func = window[functionName];
        if (func) {
          functionResult.exists = true;
          functionResult.type = typeof func;

          if (typeof func === 'function') {
            testResults.summary.passedTests++;
          } else {
            functionResult.errors.push(`Expected function, got ${typeof func}`);
            testResults.summary.failedTests++;
          }
        } else {
          functionResult.errors.push('Function not found in global scope');
          testResults.summary.failedTests++;
        }
      } catch (error) {
        functionResult.errors.push(`Error testing function: ${error.message}`);
        testResults.summary.failedTests++;
      }

      testResults.functions[functionName] = functionResult;
      testResults.summary.totalTests++;
    }

    if (displayResults) {
      displayTestResults();
    }
  }

  /**
   * Run dependency tests
   */
  async function runDependencyTests() {
    console.log('🔍 Testing dependencies...');

    const dependencies = [
      { name: 'bootstrap', check: () => window.bootstrap },
      { name: 'jQuery', check: () => window.$ || window.jQuery },
      { name: 'FontAwesome', check: () => document.querySelector('link[href*="font-awesome"]') },
      { name: 'Web Speech API', check: () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window },
      { name: 'Web Crypto API', check: () => window.crypto && window.crypto.subtle },
      { name: 'Fetch API', check: () => window.fetch },
      { name: 'LocalStorage', check: () => window.localStorage },
      { name: 'SessionStorage', check: () => window.sessionStorage }
    ];

    testResults.dependencies = {};

    for (const dep of dependencies) {
      const depResult = {
        name: dep.name,
        available: false,
        errors: []
      };

      try {
        depResult.available = !!dep.check();
        if (depResult.available) {
          testResults.summary.passedTests++;
        } else {
          depResult.errors.push('Dependency not available');
          testResults.summary.failedTests++;
        }
      } catch (error) {
        depResult.errors.push(`Error checking dependency: ${error.message}`);
        testResults.summary.failedTests++;
      }

      testResults.dependencies[dep.name] = depResult;
      testResults.summary.totalTests++;
    }
  }

  /**
   * Display test results
   */
  function displayTestResults() {
    const resultsContainer = document.getElementById('test-results');
    let html = '';

    // Module tests
    if (Object.keys(testResults.modules).length > 0) {
      html += '<div class="test-category"><h4>📦 Module Tests</h4>';
      for (const [moduleName, result] of Object.entries(testResults.modules)) {
        const status = result.exists && result.errors.length === 0 ? 'passed' : 'failed';
        html += `
          <div class="test-item ${status}">
            <div>
              <div class="test-name">${moduleName}</div>
              <div class="test-details">
                Type: ${result.type || 'undefined'} |
                Required: ${result.requiredMethods.filter(m => m.exists).length}/${result.requiredMethods.length} |
                Optional: ${result.optionalMethods.filter(m => m.exists).length}/${result.optionalMethods.length}
              </div>
              ${result.errors.length > 0 ? `<div class="error-details">${result.errors.join('\n')}</div>` : ''}
            </div>
            <div class="test-status ${status}">${status.toUpperCase()}</div>
          </div>
        `;
      }
      html += '</div>';
    }

    // DOM tests
    if (testResults.dom && Object.keys(testResults.dom).length > 0) {
      html += '<div class="test-category"><h4>🌐 DOM Element Tests</h4>';
      for (const [elementId, result] of Object.entries(testResults.dom)) {
        const status = result.exists ? 'passed' : 'failed';
        html += `
          <div class="test-item ${status}">
            <div>
              <div class="test-name">${elementId}</div>
              <div class="test-details">
                ${result.description} | Exists: ${result.exists} | Visible: ${result.visible}
              </div>
              ${result.errors.length > 0 ? `<div class="error-details">${result.errors.join('\n')}</div>` : ''}
            </div>
            <div class="test-status ${status}">${status.toUpperCase()}</div>
          </div>
        `;
      }
      html += '</div>';
    }

    // Function tests
    if (testResults.functions && Object.keys(testResults.functions).length > 0) {
      html += '<div class="test-category"><h4>⚙️ Function Tests</h4>';
      for (const [functionName, result] of Object.entries(testResults.functions)) {
        const status = result.exists && result.type === 'function' ? 'passed' : 'failed';
        html += `
          <div class="test-item ${status}">
            <div>
              <div class="test-name">${functionName}</div>
              <div class="test-details">Type: ${result.type || 'undefined'}</div>
              ${result.errors.length > 0 ? `<div class="error-details">${result.errors.join('\n')}</div>` : ''}
            </div>
            <div class="test-status ${status}">${status.toUpperCase()}</div>
          </div>
        `;
      }
      html += '</div>';
    }

    // Dependency tests
    if (testResults.dependencies && Object.keys(testResults.dependencies).length > 0) {
      html += '<div class="test-category"><h4>📚 Dependency Tests</h4>';
      for (const [depName, result] of Object.entries(testResults.dependencies)) {
        const status = result.available ? 'passed' : 'failed';
        html += `
          <div class="test-item ${status}">
            <div>
              <div class="test-name">${depName}</div>
              <div class="test-details">Available: ${result.available}</div>
              ${result.errors.length > 0 ? `<div class="error-details">${result.errors.join('\n')}</div>` : ''}
            </div>
            <div class="test-status ${status}">${status.toUpperCase()}</div>
          </div>
        `;
      }
      html += '</div>';
    }

    resultsContainer.innerHTML = html || '<div class="no-tests">No test results available</div>';
    updateTestSummary();
  }

  /**
   * Update test summary
   */
  function updateTestSummary() {
    document.getElementById('total-tests').textContent = testResults.summary.totalTests;
    document.getElementById('passed-tests').textContent = testResults.summary.passedTests;
    document.getElementById('failed-tests').textContent = testResults.summary.failedTests;
    document.getElementById('module-count').textContent = testResults.summary.totalModules;
  }

  /**
   * Export test results
   */
  function exportTestResults() {
    const results = {
      timestamp: new Date().toISOString(),
      summary: testResults.summary,
      results: testResults,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `algorithmpress-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Run auto-fix
   */
  function runAutoFix() {
    console.log('🔧 Running auto-fix...');

    const resultsContainer = document.getElementById('test-results');
    const originalContent = resultsContainer.innerHTML;
    resultsContainer.innerHTML = '<div class="loading">Running auto-fix...</div>';

    try {
      if (typeof ErrorFixer !== 'undefined') {
        const results = ErrorFixer.runComprehensiveCheck();

        // Update test results with fix information
        testResults.autoFix = {
          globalFixes: results.globalFixes,
          moduleFixes: results.moduleFixes,
          errors: results.errors,
          timestamp: new Date().toISOString()
        };

        // Re-run tests after fixes
        setTimeout(async () => {
          await runAllTests();

          // Show fix summary
          const fixSummary = `
            <div class="test-category">
              <h4>🔧 Auto-Fix Results</h4>
              <div class="test-item ${results.globalFixes + results.moduleFixes > 0 ? 'passed' : 'warning'}">
                <div>
                  <div class="test-name">Auto-Fix Summary</div>
                  <div class="test-details">
                    Global fixes: ${results.globalFixes} |
                    Module fixes: ${results.moduleFixes} |
                    Errors: ${results.errors.length}
                  </div>
                  ${results.errors.length > 0 ? `<div class="error-details">${results.errors.join('\n')}</div>` : ''}
                </div>
                <div class="test-status ${results.globalFixes + results.moduleFixes > 0 ? 'passed' : 'warning'}">
                  ${results.globalFixes + results.moduleFixes > 0 ? 'FIXED' : 'NO ISSUES'}
                </div>
              </div>
            </div>
          `;

          resultsContainer.insertAdjacentHTML('afterbegin', fixSummary);
        }, 100);

      } else {
        resultsContainer.innerHTML = originalContent;
        resultsContainer.insertAdjacentHTML('afterbegin', `
          <div class="test-category">
            <h4>🔧 Auto-Fix Results</h4>
            <div class="test-item failed">
              <div>
                <div class="test-name">ErrorFixer Not Available</div>
                <div class="test-details">The ErrorFixer module is not loaded</div>
              </div>
              <div class="test-status failed">FAILED</div>
            </div>
          </div>
        `);
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
      resultsContainer.innerHTML = originalContent;
      resultsContainer.insertAdjacentHTML('afterbegin', `
        <div class="test-category">
          <h4>🔧 Auto-Fix Results</h4>
          <div class="test-item failed">
            <div>
              <div class="test-name">Auto-Fix Error</div>
              <div class="test-details">Failed to run auto-fix</div>
              <div class="error-details">${error.message}</div>
            </div>
            <div class="test-status failed">ERROR</div>
          </div>
        </div>
      `);
    }
  }

  /**
   * Close tester
   */
  function closeTester() {
    const ui = document.getElementById('module-tester-ui');
    if (ui) {
      ui.style.display = 'none';
    }
  }

  /**
   * Public API
   */
  return {
    initialize,
    runAllTests,
    runModuleTests,
    runDOMTests,
    runFunctionTests,
    runAutoFix,
    getTestResults: () => testResults,
    showTester: () => {
      const ui = document.getElementById('module-tester-ui');
      if (ui) {
        ui.style.display = 'flex';
      } else {
        createTestUI();
      }
    },
    closeTester
  };

})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ComprehensiveModuleTester.initialize();
  });
} else {
  ComprehensiveModuleTester.initialize();
}

// Export for global access
window.ComprehensiveModuleTester = ComprehensiveModuleTester;
