/**
 * AlgorithmPress Modules Integration
 * Initializes and connects all modules with the dock
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing AlgorithmPress modules...');
  
  // Initialize Module Framework if available
  if (window.ModuleFramework) {
    window.ModuleFramework.initialize();
  }
  
  // Initialize API Gateway if available
  if (window.ApiGateway) {
    window.ApiGateway.initialize();
  }
  
  // Initialize plugin system if available
  if (window.PluginSystem) {
    window.PluginSystem.initialize();
  }
  
  // Ensure dock is created
  ensureDockExists();

  // Initialize modules
  initializeModules();
  
  // Add module panels to DOM if they don't exist
  ensureModulePanelsExist();
  
  console.log('AlgorithmPress modules initialized');
  
  /**
   * Ensure dock exists
   */
  function ensureDockExists() {
    if (document.getElementById('algorithm-press-dock')) {
      console.log('Dock already exists');
      return;
    }
    
    console.log('Creating dock...');
    
    // Create dock element
    const dock = document.createElement('div');
    dock.id = 'algorithm-press-dock';
    dock.className = 'algorithm-press-dock';
    
    dock.innerHTML = `
      <div class="dock-container">
        <button class="dock-button" id="voice-control-dock-btn" title="Voice Control">
          <i class="fas fa-microphone"></i>
          <span class="dock-button-label">Voice</span>
        </button>
        <button class="dock-button" id="nexus-grid-dock-btn" title="NexusGrid">
          <i class="fas fa-th"></i>
          <span class="dock-button-label">NexusGrid</span>
        </button>
        <button class="dock-button" id="demo-system-dock-btn" title="Demonstration System">
          <i class="fas fa-laptop-code"></i>
          <span class="dock-button-label">Demos</span>
        </button>
        <button class="dock-button" id="implementation-dock-btn" title="Implementation Example">
          <i class="fas fa-code-branch"></i>
          <span class="dock-button-label">Impl</span>
        </button>
        <button class="dock-button" id="rainbow-indicator-dock-btn" title="Rainbow Indicator">
          <i class="fas fa-rainbow"></i>
          <span class="dock-button-label">Effects</span>
        </button>
        <button class="dock-button" id="cubbit-storage-dock-btn" title="Cubbit Storage">
          <i class="fas fa-cloud"></i>
          <span class="dock-button-label">Storage</span>
        </button>
        <button class="dock-button" id="settings-dock-btn" title="Settings">
          <i class="fas fa-cog"></i>
          <span class="dock-button-label">Settings</span>
        </button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(dock);
    
    // Add dock styles if not already present
    if (!document.getElementById('algorithm-press-dock-styles')) {
      const style = document.createElement('style');
      style.id = 'algorithm-press-dock-styles';
      style.textContent = `
        .algorithm-press-dock {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9000;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none; /* Make container transparent to clicks */
        }
        
        .dock-container {
          background-color: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          padding: 10px 20px;
          display: flex;
          gap: 14px;
          align-items: center;
          pointer-events: auto; /* Enable pointer events for the actual dock */
        }
        
        .dock-button {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          border: none;
          background-color: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
          position: relative;
          color: #333;
          padding: 0;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .dock-button i {
          font-size: 24px;
          margin-bottom: 4px;
          background-image: linear-gradient(to right, #ff9966, #ff5e62);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transition: transform 0.2s ease;
        }
        
        .dock-button .dock-button-label {
          font-family: 'Alegreya Sans SC', sans-serif;
          font-size: 11px;
          font-weight: 500;
          transition: opacity 0.2s ease;
          opacity: 0.7;
        }
        
        /* Hover and active states */
        .dock-button:hover {
          transform: translateY(-8px) scale(1.05);
          background-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 7px 20px rgba(0, 0, 0, 0.15);
        }
        
        .dock-button:hover i {
          transform: scale(1.1);
        }
        
        .dock-button:hover .dock-button-label {
          opacity: 1;
        }
        
        .dock-button:active {
          transform: translateY(-2px) scale(0.98);
        }
        
        .dock-button.active {
          background-image: linear-gradient(135deg, rgba(252, 234, 187, 0.4), rgba(248, 181, 0, 0.4));
          box-shadow: 0 0 20px rgba(255, 193, 7, 0.4);
          transform: translateY(-8px) scale(1.05);
        }
        
        /* Tooltip styles */
        .dock-button::before {
          content: attr(title);
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          white-space: nowrap;
          font-size: 12px;
          opacity: 0;
          transition: all 0.2s ease;
          pointer-events: none;
        }
        
        .dock-button::after {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          border-width: 5px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.7) transparent transparent transparent;
          opacity: 0;
          transition: all 0.2s ease;
          pointer-events: none;
        }
        
        .dock-button:hover::before,
        .dock-button:hover::after {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
        
        /* Badge for notifications */
        .dock-button .dock-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: #e74c3c;
          color: white;
          font-size: 10px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .dock-container {
            max-width: 95vw;
            overflow-x: auto;
            padding: 8px 15px;
            gap: 10px;
          }
          
          .dock-button {
            width: 50px;
            height: 50px;
            border-radius: 15px;
          }
          
          .dock-button i {
            font-size: 20px;
          }
          
          .dock-button .dock-button-label {
            font-size: 9px;
          }
        }
        
        /* Animation for dock appearance */
        @keyframes dockFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .algorithm-press-dock {
          animation: dockFadeIn 0.5s ease-out forwards;
        }
        
        .system-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          max-width: 1000px;
          height: 80%;
          max-height: 700px;
          background-color: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          z-index: 9500;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        .system-panel.hidden {
          opacity: 0;
          transform: translate(-50%, -60%);
          pointer-events: none;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .panel-header h2 {
          margin: 0;
          font-family: 'Alegreya Sans SC', sans-serif;
          font-size: 1.5rem;
          background-image: linear-gradient(to right, #ff9966, #ff5e62);
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
        }
        
        .panel-controls {
          display: flex;
          gap: 10px;
        }
        
        .panel-close-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          background-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .panel-close-btn:hover {
          background-color: rgba(255, 87, 34, 0.3);
          transform: rotate(90deg);
        }
        
        .panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        
        .hidden {
          display: none !important;
        }
      `;
      
      document.head.appendChild(style);
    }
  }
  
  /**
   * Initialize all modules
   */
  function initializeModules() {
    // Initialize NexusGrid
    if (window.NexusGrid && typeof window.NexusGrid.initialize === 'function') {
      window.NexusGrid.initialize()
        .then(() => {
          console.log('NexusGrid initialized');
          updateDockButton('nexus-grid', true);
        })
        .catch(error => {
          console.error('Failed to initialize NexusGrid:', error);
        });
    }
    
    // Initialize DemoSystem
    if (window.DemoSystem && typeof window.DemoSystem.initialize === 'function') {
      window.DemoSystem.initialize()
        .then(() => {
          console.log('Demonstration System initialized');
          updateDockButton('demo-system', true);
        })
        .catch(error => {
          console.error('Failed to initialize Demonstration System:', error);
        });
    }
    
    // Initialize ImplementationExample
    if (window.ImplementationExample && typeof window.ImplementationExample.initialize === 'function') {
      window.ImplementationExample.initialize()
        .then(() => {
          console.log('Implementation Example initialized');
          updateDockButton('implementation', true);
        })
        .catch(error => {
          console.error('Failed to initialize Implementation Example:', error);
        });
    }
    
    // Initialize VoiceControlSystem
    if (window.VoiceControlSystem && typeof window.VoiceControlSystem.initialize === 'function') {
      window.VoiceControlSystem.initialize()
        .then(() => {
          console.log('Voice Control System initialized');
          updateDockButton('voice-control', true);
        })
        .catch(error => {
          console.error('Failed to initialize Voice Control System:', error);
        });
    }
  }
  
  /**
   * Update dock button state
   * @param {string} moduleId - Module ID
   * @param {boolean} available - Whether the module is available
   */
  function updateDockButton(moduleId, available) {
    const button = document.getElementById(`${moduleId}-dock-btn`);
    if (!button) return;
    
    if (available) {
      button.classList.add('module-available');
    } else {
      button.classList.remove('module-available');
    }
  }
  
  /**
   * Ensure all module panels exist
   */
  function ensureModulePanelsExist() {
    // Set up dock button click handlers
    setupDockButtons();
  }
  
  /**
   * Set up dock button click handlers
   */
  function setupDockButtons() {
    // NexusGrid button
    const nexusGridBtn = document.getElementById('nexus-grid-dock-btn');
    if (nexusGridBtn) {
      nexusGridBtn.addEventListener('click', function() {
        toggleModule('nexus-grid');
      });
    }
    
    // Demo System button
    const demoSystemBtn = document.getElementById('demo-system-dock-btn');
    if (demoSystemBtn) {
      demoSystemBtn.addEventListener('click', function() {
        toggleModule('demo-system');
      });
    }
    
    // Implementation Example button
    const implementationBtn = document.getElementById('implementation-dock-btn');
    if (implementationBtn) {
      implementationBtn.addEventListener('click', function() {
        toggleModule('implementation');
      });
    }
    
    // Voice Control button
    const voiceControlBtn = document.getElementById('voice-control-dock-btn');
    if (voiceControlBtn) {
      voiceControlBtn.addEventListener('click', function() {
        toggleModule('voice-control');
      });
    }
    
    // Rainbow Indicator button
    const rainbowIndicatorBtn = document.getElementById('rainbow-indicator-dock-btn');
    if (rainbowIndicatorBtn) {
      rainbowIndicatorBtn.addEventListener('click', function() {
        toggleModule('rainbow-indicator');
      });
    }
    
    // Cubbit Storage button
    const cubbitStorageBtn = document.getElementById('cubbit-storage-dock-btn');
    if (cubbitStorageBtn) {
      cubbitStorageBtn.addEventListener('click', function() {
        toggleModule('cubbit-storage');
      });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings-dock-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        toggleModule('settings');
      });
    }
  }
  
  /**
   * Toggle a module
   * @param {string} moduleId - Module ID
   */
  function toggleModule(moduleId) {
    // Hide all panels first
    hideAllPanels();
    
    // Get button
    const button = document.getElementById(`${moduleId}-dock-btn`);
    
    // Toggle module based on ID
    switch (moduleId) {
      case 'nexus-grid':
        if (window.NexusGrid && typeof window.NexusGrid.togglePanel === 'function') {
          const visible = window.NexusGrid.togglePanel();
          if (button) button.classList.toggle('active', visible);
        } else {
          console.warn('NexusGrid module not found');
          showToast('warning', 'NexusGrid module not found');
        }
        break;
        
      case 'demo-system':
        if (window.DemoSystem && typeof window.DemoSystem.togglePanel === 'function') {
          const visible = window.DemoSystem.togglePanel();
          if (button) button.classList.toggle('active', visible);
        } else {
          console.warn('Demonstration System module not found');
          showToast('warning', 'Demonstration System module not found');
        }
        break;
        
      case 'implementation':
        if (window.ImplementationExample && typeof window.ImplementationExample.togglePanel === 'function') {
          const visible = window.ImplementationExample.togglePanel();
          if (button) button.classList.toggle('active', visible);
        } else {
          console.warn('Implementation Example module not found');
          showToast('warning', 'Implementation Example module not found');
        }
        break;
        
      case 'voice-control':
        if (window.VoiceControlSystem) {
          if (window.VoiceControlSystem.isListening && window.VoiceControlSystem.isListening()) {
            window.VoiceControlSystem.stopListening();
            if (button) button.classList.remove('active');
          } else {
            window.VoiceControlSystem.startListening();
            if (button) button.classList.add('active');
          }
        } else {
          console.warn('Voice Control System module not found');
          showToast('warning', 'Voice Control System module not found');
        }
        break;
        
      case 'rainbow-indicator':
        toggleRainbowIndicator();
        break;
        
      case 'cubbit-storage':
        toggleCubbitStorage();
        break;
        
      case 'settings':
        toggleSettings();
        break;
        
      default:
        console.warn(`Unknown module: ${moduleId}`);
        break;
    }
  }
  
  /**
   * Hide all system panels
   */
  function hideAllPanels() {
    document.querySelectorAll('.system-panel').forEach(panel => {
      panel.classList.add('hidden');
    });
    
    // Reset active state on dock buttons
    document.querySelectorAll('.dock-button').forEach(button => {
      button.classList.remove('active');
    });
  }
  
  /**
   * Toggle Rainbow Indicator
   */
  function toggleRainbowIndicator() {
    // Check if panel exists
    let panel = document.getElementById('rainbow-indicator-panel');
    
    // Create panel if it doesn't exist
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'rainbow-indicator-panel';
      panel.className = 'system-panel rainbow-indicator-panel hidden';
      
      panel.innerHTML = `
        <div class="panel-header">
          <h2>Rainbow Indicator Settings</h2>
          <div class="panel-controls">
            <button class="panel-close-btn" id="rainbow-indicator-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="panel-body">
          <div class="rainbow-indicator-content">
            <h3>Configure Effects</h3>
            <div class="settings-form">
              <div class="form-group">
                <label for="border-size">Border Size</label>
                <input type="range" id="border-size" min="1" max="10" value="4" class="form-range">
                <span class="range-value">4px</span>
              </div>
              <div class="form-group">
                <label for="glow-size">Glow Size</label>
                <input type="range" id="glow-size" min="0" max="50" value="20" class="form-range">
                <span class="range-value">20px</span>
              </div>
              <div class="form-group">
                <label for="animation-speed">Animation Speed</label>
                <input type="range" id="animation-speed" min="1" max="10" value="4" class="form-range">
                <span class="range-value">4s</span>
              </div>
              <div class="form-group">
                <label for="auto-hooks">
                  <input type="checkbox" id="auto-hooks" checked>
                  Enable Auto Hooks
                </label>
              </div>
              <div class="color-presets">
                <h4>Color Presets</h4>
                <div class="preset-buttons">
                  <button class="preset-btn" data-preset="rainbow">Rainbow</button>
                  <button class="preset-btn" data-preset="ocean">Ocean</button>
                  <button class="preset-btn" data-preset="sunset">Sunset</button>
                  <button class="preset-btn" data-preset="forest">Forest</button>
                </div>
              </div>
              <div class="form-actions">
                <button id="apply-effects-btn" class="btn btn-primary">Apply Effects</button>
                <button id="preview-effects-btn" class="btn btn-secondary">Preview</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      // Add close button event listener
      document.getElementById('rainbow-indicator-close-btn').addEventListener('click', function() {
        panel.classList.add('hidden');
        document.getElementById('rainbow-indicator-dock-btn').classList.remove('active');
      });
      
      // Add range input event listeners
      document.querySelectorAll('#rainbow-indicator-panel .form-range').forEach(range => {
        range.addEventListener('input', function() {
          this.nextElementSibling.textContent = this.value + (this.id === 'animation-speed' ? 's' : 'px');
        });
      });
      
      // Add apply button event listener
      document.getElementById('apply-effects-btn')?.addEventListener('click', function() {
        if (window.RainbowIndicator && window.appEventIndicator) {
          const borderSize = parseInt(document.getElementById('border-size').value);
          const glowSize = parseInt(document.getElementById('glow-size').value);
          const animationSpeed = parseInt(document.getElementById('animation-speed').value);
          const autoHooks = document.getElementById('auto-hooks').checked;
          
          // Update indicator settings
          window.appEventIndicator.updateSettings({
            borderSize,
            glowSize,
            animationSpeed,
            useAutoHooks: autoHooks
          });
          
          showToast('success', 'Rainbow indicator settings applied');
        } else {
          showToast('error', 'Rainbow Indicator not available');
        }
      });
      
      // Add preview button event listener
      document.getElementById('preview-effects-btn')?.addEventListener('click', function() {
        if (window.appEventIndicator) {
          window.appEventIndicator.start();
          
          setTimeout(() => {
            window.appEventIndicator.stop();
          }, 2000);
        } else {
          showToast('error', 'Rainbow Indicator not available');
        }
      });
    }
    
    // Toggle panel visibility
    panel.classList.remove('hidden');
    document.getElementById('rainbow-indicator-dock-btn').classList.add('active');
  }
  
  /**
   * Toggle Cubbit Storage
   */
  function toggleCubbitStorage() {
    // Check if panel exists
    let panel = document.getElementById('cubbit-storage-panel');
    
    // Create panel if it doesn't exist
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'cubbit-storage-panel';
      panel.className = 'system-panel cubbit-storage-panel hidden';
      
      panel.innerHTML = `
        <div class="panel-header">
          <h2>Cubbit Storage</h2>
          <div class="panel-controls">
            <button class="panel-close-btn" id="cubbit-storage-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="panel-body">
          <div class="cubbit-storage-content">
            <h3>Decentralized Storage</h3>
            <div class="cubbit-settings">
              <div class="form-group">
                <label for="cubbit-api-key-panel">Cubbit API Key</label>
                <input type="password" id="cubbit-api-key-panel" class="form-control" placeholder="Enter your Cubbit API key">
              </div>
              <div class="form-group">
                <label for="cubbit-bucket-panel">Bucket Name</label>
                <input type="text" id="cubbit-bucket-panel" class="form-control" placeholder="php-wasm-projects">
              </div>
              <div class="form-actions">
                <button id="cubbit-connect-btn" class="btn btn-primary">Connect</button>
                <button id="cubbit-disconnect-btn" class="btn btn-secondary">Disconnect</button>
              </div>
            </div>
            <div class="cubbit-status">
              <h4>Connection Status</h4>
              <div class="status-indicator">
                <span class="status-dot"></span>
                <span class="status-text">Not connected</span>
              </div>
            </div>
            <div class="cubbit-projects hidden">
              <h4>Your Projects</h4>
              <div class="project-list">
                <div class="loading-spinner">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Loading projects...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      // Add close button event listener
      document.getElementById('cubbit-storage-close-btn').addEventListener('click', function() {
        panel.classList.add('hidden');
        document.getElementById('cubbit-storage-dock-btn').classList.remove('active');
      });
      
      // Add connect button event listener
      document.getElementById('cubbit-connect-btn')?.addEventListener('click', function() {
        const apiKey = document.getElementById('cubbit-api-key-panel').value;
        const bucketName = document.getElementById('cubbit-bucket-panel').value || 'php-wasm-projects';
        
        if (!apiKey) {
          showToast('error', 'API key is required');
          return;
        }
        
        if (window.CubbitStorage) {
          window.CubbitStorage.initialize({
            apiKey: apiKey,
            bucketName: bucketName
          }).then(() => {
            showToast('success', 'Connected to Cubbit DS3');
            updateCubbitStorageStatus(true);
          }).catch(error => {
            showToast('error', 'Connection failed: ' + error.message);
          });
        } else {
          showToast('error', 'Cubbit Storage not available');
        }
      });
    }
    
    // Toggle panel visibility
    panel.classList.remove('hidden');
    document.getElementById('cubbit-storage-dock-btn').classList.add('active');
  }
  
  /**
   * Update Cubbit Storage status
   * @param {boolean} connected - Whether storage is connected
   */
  function updateCubbitStorageStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const projectsSection = document.querySelector('.cubbit-projects');
    
    if (statusDot && statusText) {
      if (connected) {
        statusDot.style.backgroundColor = 'rgba(46, 204, 113, 0.8)';
        statusText.textContent = 'Connected';
        
        if (projectsSection) {
          projectsSection.classList.remove('hidden');
        }
      } else {
        statusDot.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        statusText.textContent = 'Not connected';
        
        if (projectsSection) {
          projectsSection.classList.add('hidden');
        }
      }
    }
  }
  
  /**
   * Toggle Settings
   */
  function toggleSettings() {
    // Check if panel exists
    let panel = document.getElementById('settings-panel');
    
    // Create panel if it doesn't exist
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'settings-panel';
      panel.className = 'system-panel settings-panel hidden';
      
      panel.innerHTML = `
        <div class="panel-header">
          <h2>AlgorithmPress Settings</h2>
          <div class="panel-controls">
            <button class="panel-close-btn" id="settings-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="panel-body">
          <div class="settings-content">
            <div class="settings-tabs">
              <button class="settings-tab active" data-tab="general">General</button>
              <button class="settings-tab" data-tab="appearance">Appearance</button>
              <button class="settings-tab" data-tab="modules">Modules</button>
              <button class="settings-tab" data-tab="notifications">Notifications</button>
            </div>
            <div class="settings-panels">
              <div class="settings-tab-panel active" id="general-panel">
                <h3>General Settings</h3>
                <div class="settings-group">
                  <h4>Builder Preferences</h4>
                  <div class="form-group">
                    <label for="auto-save">
                      <input type="checkbox" id="auto-save" checked>
                      Enable auto-save
                    </label>
                  </div>
                  <div class="form-group">
                    <label for="save-interval">Auto-save interval (seconds)</label>
                    <input type="number" id="save-interval" class="form-control" value="60" min="30" max="300">
                  </div>
                  <div class="form-group">
                    <label for="default-theme">Default theme</label>
                    <select id="default-theme" class="form-select">
                      <option value="bootstrap">Bootstrap</option>
                      <option value="material">Material Design</option>
                      <option value="bulma">Bulma</option>
                      <option value="tailwind">Tailwind</option>
                      <option value="none">No Framework</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="settings-tab-panel" id="appearance-panel">
                <h3>Appearance Settings</h3>
                <div class="settings-group">
                  <h4>UI Preferences</h4>
                  <div class="form-group">
                    <label for="ui-color-scheme">Color Scheme</label>
                    <select id="ui-color-scheme" class="form-select">
                      <option value="default">Default (Yellow/Blue)</option>
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                      <option value="sunset">Sunset</option>
                      <option value="forest">Forest</option>
                      <option value="ocean">Ocean</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="font-size">UI Font Size</label>
                    <select id="font-size" class="form-select">
                      <option value="small">Small</option>
                      <option value="medium" selected>Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="animation-speed">Animation Speed</label>
                    <select id="animation-speed" class="form-select">
                      <option value="fast">Fast</option>
                      <option value="normal" selected>Normal</option>
                      <option value="slow">Slow</option>
                      <option value="none">No Animations</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="settings-tab-panel" id="modules-panel">
                <h3>Module Settings</h3>
                <div class="settings-group">
                  <h4>Module Management</h4>
                  <div class="module-list">
                    <div class="module-item">
                      <div class="module-info">
                        <h5>Voice Control</h5>
                        <p>Enable voice commands for the builder</p>
                      </div>
                      <div class="module-toggle">
                        <label class="switch">
                          <input type="checkbox" checked data-module="voice-control">
                          <span class="slider round"></span>
                        </label>
                      </div>
                    </div>
                    <div class="module-item">
                      <div class="module-info">
                        <h5>NexusGrid</h5>
                        <p>Decentralized application platform</p>
                      </div>
                      <div class="module-toggle">
                        <label class="switch">
                          <input type="checkbox" checked data-module="nexus-grid">
                          <span class="slider round"></span>
                        </label>
                      </div>
                    </div>
                    <div class="module-item">
                      <div class="module-info">
                        <h5>Demonstration System</h5>
                        <p>Demo application generator</p>
                      </div>
                      <div class="module-toggle">
                        <label class="switch">
                          <input type="checkbox" checked data-module="demo-system">
                          <span class="slider round"></span>
                        </label>
                      </div>
                    </div>
                    <div class="module-item">
                      <div class="module-info">
                        <h5>Rainbow Indicator</h5>
                        <p>Visual feedback for operations</p>
                      </div>
                      <div class="module-toggle">
                        <label class="switch">
                          <input type="checkbox" checked data-module="rainbow-indicator">
                          <span class="slider round"></span>
                        </label>
                      </div>
                    </div>
                    <div class="module-item">
                      <div class="module-info">
                        <h5>Cubbit Storage</h5>
                        <p>Decentralized storage integration</p>
                      </div>
                      <div class="module-toggle">
                        <label class="switch">
                          <input type="checkbox" checked data-module="cubbit-storage">
                          <span class="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="settings-tab-panel" id="notifications-panel">
                <h3>Notification Settings</h3>
                <div class="settings-group">
                  <h4>Notification Preferences</h4>
                  <div class="form-group">
                    <label for="enable-notifications">
                      <input type="checkbox" id="enable-notifications" checked>
                      Enable notifications
                    </label>
                  </div>
                  <div class="form-group">
                    <label for="notification-sound">
                      <input type="checkbox" id="notification-sound" checked>
                      Play sound for notifications
                    </label>
                  </div>
                  <div class="form-group">
                    <label for="notification-position">Notification Position</label>
                    <select id="notification-position" class="form-select">
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="bottom-right" selected>Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="settings-actions">
              <button id="save-settings-btn" class="btn btn-primary">Save Settings</button>
              <button id="reset-settings-btn" class="btn btn-secondary">Reset to Defaults</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      // Add close button event listener
      document.getElementById('settings-close-btn').addEventListener('click', function() {
        panel.classList.add('hidden');
        document.getElementById('settings-dock-btn').classList.remove('active');
      });
      
      // Add settings tabs functionality
      document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          // Remove active class from all tabs
          document.querySelectorAll('.settings-tab').forEach(t => {
            t.classList.remove('active');
          });
          
          // Add active class to clicked tab
          this.classList.add('active');
          
          // Hide all panels
          document.querySelectorAll('.settings-tab-panel').forEach(p => {
            p.classList.remove('active');
          });
          
          // Show selected panel
          const tabId = this.getAttribute('data-tab');
          document.getElementById(`${tabId}-panel`).classList.add('active');
        });
      });
      
      // Add save settings button event listener
      document.getElementById('save-settings-btn')?.addEventListener('click', function() {
        // Get settings values
        const settings = {
          general: {
            autoSave: document.getElementById('auto-save').checked,
            saveInterval: parseInt(document.getElementById('save-interval').value),
            defaultTheme: document.getElementById('default-theme').value
          },
          appearance: {
            colorScheme: document.getElementById('ui-color-scheme').value,
            fontSize: document.getElementById('font-size').value,
            animationSpeed: document.getElementById('animation-speed').value
          },
          modules: {
            enabledModules: Array.from(document.querySelectorAll('.module-toggle input[type="checkbox"]'))
              .filter(checkbox => checkbox.checked)
              .map(checkbox => checkbox.getAttribute('data-module'))
          },
          notifications: {
            enabled: document.getElementById('enable-notifications').checked,
            sound: document.getElementById('notification-sound').checked,
            position: document.getElementById('notification-position').value
          }
        };
        
        // Save settings
        localStorage.setItem('algorithm_press_settings', JSON.stringify(settings));
        
        // Apply settings
        applySettings(settings);
        
        showToast('success', 'Settings saved successfully');
      });
      
      // Add reset settings button event listener
      document.getElementById('reset-settings-btn')?.addEventListener('click', function() {
        // Reset settings to defaults
        const defaultSettings = {
          general: {
            autoSave: true,
            saveInterval: 60,
            defaultTheme: 'bootstrap'
          },
          appearance: {
            colorScheme: 'default',
            fontSize: 'medium',
            animationSpeed: 'normal'
          },
          modules: {
            enabledModules: ['voice-control', 'nexus-grid', 'demo-system', 'rainbow-indicator', 'cubbit-storage']
          },
          notifications: {
            enabled: true,
            sound: true,
            position: 'bottom-right'
          }
        };
        
        // Save default settings
        localStorage.setItem('algorithm_press_settings', JSON.stringify(defaultSettings));
        
        // Apply default settings
        applySettings(defaultSettings);
        
        // Update UI
        document.getElementById('auto-save').checked = defaultSettings.general.autoSave;
        document.getElementById('save-interval').value = defaultSettings.general.saveInterval;
        document.getElementById('default-theme').value = defaultSettings.general.defaultTheme;
        document.getElementById('ui-color-scheme').value = defaultSettings.appearance.colorScheme;
        document.getElementById('font-size').value = defaultSettings.appearance.fontSize;
        document.getElementById('animation-speed').value = defaultSettings.appearance.animationSpeed;
        document.getElementById('enable-notifications').checked = defaultSettings.notifications.enabled;
        document.getElementById('notification-sound').checked = defaultSettings.notifications.sound;
        document.getElementById('notification-position').value = defaultSettings.notifications.position;
        
        document.querySelectorAll('.module-toggle input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = defaultSettings.modules.enabledModules.includes(checkbox.getAttribute('data-module'));
        });
        
        showToast('info', 'Settings reset to defaults');
      });
    }
    
    // Toggle panel visibility
    panel.classList.remove('hidden');
    document.getElementById('settings-dock-btn').classList.add('active');
  }
  
  /**
   * Apply settings
   * @param {Object} settings - Settings object
   */
  function applySettings(settings) {
    // Apply module visibility
    if (settings.modules && settings.modules.enabledModules) {
      document.querySelectorAll('.dock-button').forEach(button => {
        const moduleId = button.id.replace('-dock-btn', '');
        button.style.display = settings.modules.enabledModules.includes(moduleId) ? '' : 'none';
      });
    }
    
    // Apply appearance settings
    if (settings.appearance) {
      document.documentElement.setAttribute('data-color-scheme', settings.appearance.colorScheme);
      document.documentElement.setAttribute('data-font-size', settings.appearance.fontSize);
      document.documentElement.setAttribute('data-animation-speed', settings.appearance.animationSpeed);
    }
  }
  
  /**
   * Show a toast notification
   * @param {string} type - Notification type (success, info, warning, error)
   * @param {string} message - Notification message
   */
  function showToast(type, message) {
    // Check if function exists in the global scope
    if (typeof window.showToast === 'function') {
      window.showToast(type, message);
      return;
    }
    
    // Create toast container if not exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      // Get settings for position
      const settings = JSON.parse(localStorage.getItem('algorithm_press_settings') || '{}');
      const position = settings.notifications?.position || 'bottom-right';
      
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = `toast-container position-fixed p-3 ${position}`;
      document.body.appendChild(toastContainer);
      
      // Add toast container styles
      const style = document.createElement('style');
      style.textContent = `
        .toast-container {
          z-index: 9999;
        }
        
        .toast-container.top-right {
          top: 0;
          right: 0;
        }
        
        .toast-container.top-left {
          top: 0;
          left: 0;
        }
        
        .toast-container.bottom-right {
          bottom: 0;
          right: 0;
        }
        
        .toast-container.bottom-left {
          bottom: 0;
          left: 0;
        }
        
        .toast {
          width: 350px;
          max-width: 100%;
          font-size: 0.875rem;
          pointer-events: auto;
          background-color: rgba(255, 255, 255, 0.85);
          background-clip: padding-box;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          border-radius: 0.25rem;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }
        
        .toast.success {
          background-color: rgba(25, 135, 84, 0.9);
          color: white;
        }
        
        .toast.info {
          background-color: rgba(13, 110, 253, 0.9);
          color: white;
        }
        
        .toast.warning {
          background-color: rgba(255, 193, 7, 0.9);
          color: black;
        }
        
        .toast.error {
          background-color: rgba(220, 53, 69, 0.9);
          color: white;
        }
        
        .toast-header {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          color: #6c757d;
          background-color: rgba(255, 255, 255, 0.85);
          background-clip: padding-box;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .toast-body {
          padding: 0.75rem;
        }
        
        .toast.showing {
          opacity: 0;
        }
        
        .toast.show {
          display: block;
          opacity: 1;
        }
        
        .toast.hide {
          display: none;
        }
        
        @keyframes toast-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes toast-fade-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
        
        .toast.show {
          animation: toast-fade-in 0.3s ease forwards;
        }
        
        .toast.hiding {
          animation: toast-fade-out 0.3s ease forwards;
        }
      `;
      
      document.head.appendChild(style);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    
    toast.innerHTML = `
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hiding');
      
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
});
