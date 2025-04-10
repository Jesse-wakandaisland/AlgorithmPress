/**
 * AlgorithmPress Dock Integration
 * This script integrates the dock with the main PHP-WASM Builder
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the PHP-WASM Builder to initialize
  const checkBuilderInterval = setInterval(function() {
    if (window.PHPWasmBuilder && window.PHPWasmBuilder.getState) {
      clearInterval(checkBuilderInterval);
      initDock();
    }
  }, 100);
  
  // Maximum wait time of 5 seconds
  setTimeout(function() {
    clearInterval(checkBuilderInterval);
    // Try to initialize dock anyway
    initDock();
  }, 5000);
  
  /**
   * Initialize the dock
   */
  function initDock() {
    console.log('Initializing AlgorithmPress Dock...');
    
    // Inject dock HTML if not already present
    if (!document.getElementById('algorithm-press-dock')) {
      // Create dock container
      const dockHTML = `
        <div id="algorithm-press-dock" class="algorithm-press-dock">
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
        </div>
      `;
      
      // Inject dock HTML
      const dockContainer = document.createElement('div');
      dockContainer.innerHTML = dockHTML;
      document.body.appendChild(dockContainer.firstElementChild);
      
      // Inject dock styles
      const dockStyles = `
        /* AlgorithmPress Dock Styles */
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
        
        /* System Panel Styles */
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
          background-color: rgba(255, 255, 255, 0.2);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
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
      `;
      
      const styleEl = document.createElement('style');
      styleEl.textContent = dockStyles;
      document.head.appendChild(styleEl);
      
      // Initialize Font Awesome if not already loaded
      if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
      }
    }
    
    // Add event listeners to dock buttons
    setupDockButtons();
    
    // Initialize AlgorithmPress Dock if available
    if (window.AlgorithmPressDock && typeof window.AlgorithmPressDock.initialize === 'function') {
      window.AlgorithmPressDock.initialize();
    } else {
      console.warn('AlgorithmPressDock module not found, using basic dock functionality');
    }
  }
  
  /**
   * Set up dock button event listeners
   */
  function setupDockButtons() {
    // Voice Control button
    const voiceBtn = document.getElementById('voice-control-dock-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function() {
        if (window.VoiceControlSystem) {
          if (window.VoiceControlSystem.isListening && window.VoiceControlSystem.isListening()) {
            window.VoiceControlSystem.stopListening();
            voiceBtn.classList.remove('active');
          } else {
            window.VoiceControlSystem.startListening();
            voiceBtn.classList.add('active');
          }
        } else {
          showToast('error', 'Voice Control System not available');
        }
      });
    }
    
    // NexusGrid button
    const nexusBtn = document.getElementById('nexus-grid-dock-btn');
    if (nexusBtn) {
      nexusBtn.addEventListener('click', function() {
        togglePanel('nexus-grid');
      });
    }
    
    // Demo System button
    const demoBtn = document.getElementById('demo-system-dock-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', function() {
        togglePanel('demo-system');
      });
    }
    
    // Implementation Example button
    const implBtn = document.getElementById('implementation-dock-btn');
    if (implBtn) {
      implBtn.addEventListener('click', function() {
        togglePanel('implementation');
      });
    }
    
    // Rainbow Indicator button
    const rainbowBtn = document.getElementById('rainbow-indicator-dock-btn');
    if (rainbowBtn) {
      rainbowBtn.addEventListener('click', function() {
        togglePanel('rainbow-indicator');
      });
    }
    
    // Cubbit Storage button
    const cubbitBtn = document.getElementById('cubbit-storage-dock-btn');
    if (cubbitBtn) {
      cubbitBtn.addEventListener('click', function() {
        togglePanel('cubbit-storage');
      });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings-dock-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        togglePanel('settings');
      });
    }
  }
  
  /**
   * Toggle a panel's visibility
   * @param {string} panelId - Panel identifier
   */
  function togglePanel(panelId) {
    let panel = document.getElementById(`${panelId}-panel`);
    const button = document.getElementById(`${panelId}-dock-btn`);
    
    // Create panel if it doesn't exist
    if (!panel) {
      panel = createPanel(panelId);
      if (!panel) return;
    }
    
    // Toggle panel visibility
    if (panel.classList.contains('hidden')) {
      // Hide all other panels first
      document.querySelectorAll('.system-panel').forEach(p => {
        p.classList.add('hidden');
      });
      
      // Show this panel
      panel.classList.remove('hidden');
      
      // Update button state
      if (button) {
        button.classList.add('active');
      }
    } else {
      panel.classList.add('hidden');
      
      // Update button state
      if (button) {
        button.classList.remove('active');
      }
    }
  }
  
  /**
   * Create a panel for the specified module
   * @param {string} panelId - Panel identifier
   * @returns {HTMLElement} - The created panel element
   */
  function createPanel(panelId) {
    let panelTitle = '';
    let panelContent = '';
    
    switch (panelId) {
      case 'nexus-grid':
        panelTitle = 'NexusGrid';
        panelContent = `
          <div class="nexus-grid-content">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading NexusGrid...</span>
            </div>
          </div>
        `;
        break;
        
      case 'demo-system':
        panelTitle = 'Demonstration System';
        panelContent = `
          <div class="demo-system-content">
            <div class="demo-categories">
              <h3>Demo Categories</h3>
              <div class="demo-category-list">
                <button class="demo-category-btn active" data-category="web-app">Web Apps</button>
                <button class="demo-category-btn" data-category="business">Business</button>
                <button class="demo-category-btn" data-category="education">Education</button>
                <button class="demo-category-btn" data-category="productivity">Productivity</button>
                <button class="demo-category-btn" data-category="games">Games</button>
              </div>
            </div>
            <div class="demo-showcase">
              <h3>Available Demos</h3>
              <div class="demo-list">
                <div class="loading-spinner">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Loading demos...</span>
                </div>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'implementation':
        panelTitle = 'Implementation Example';
        panelContent = `
          <div class="implementation-content">
            <h3>Rainbow Border Event Indicator</h3>
            <div class="implementation-demo">
              <div class="implementation-controls">
                <button class="btn btn-primary" id="start-indicator-btn">Start Indicator</button>
                <button class="btn btn-secondary" id="stop-indicator-btn">Stop Indicator</button>
                <button class="btn btn-info" id="toggle-indicator-btn">Toggle Indicator</button>
              </div>
              <div class="indicator-preview" id="indicator-preview">
                <div class="preview-content">
                  <h4>Preview Area</h4>
                  <p>This area will show the rainbow border effect when active.</p>
                </div>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'rainbow-indicator':
        panelTitle = 'Rainbow Indicator Settings';
        panelContent = `
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
                <div class="form-check">
                  <input type="checkbox" id="auto-hooks" class="form-check-input" checked>
                  <label for="auto-hooks" class="form-check-label">Enable Auto Hooks</label>
                </div>
              </div>
              <div class="color-presets">
                <h4>Color Presets</h4>
                <div class="preset-buttons">
                  <button class="btn btn-sm btn-outline-primary" data-preset="rainbow">Rainbow</button>
                  <button class="btn btn-sm btn-outline-info" data-preset="ocean">Ocean</button>
                  <button class="btn btn-sm btn-outline-warning" data-preset="sunset">Sunset</button>
                  <button class="btn btn-sm btn-outline-success" data-preset="forest">Forest</button>
                </div>
              </div>
              <div class="form-actions mt-4">
                <button id="apply-effects-btn" class="btn btn-primary">Apply Effects</button>
                <button id="preview-effects-btn" class="btn btn-secondary">Preview</button>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'cubbit-storage':
        panelTitle = 'Cubbit Storage';
        panelContent = `
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
              <div class="form-actions mt-3">
                <button id="cubbit-connect-btn" class="btn btn-primary">Connect</button>
                <button id="cubbit-disconnect-btn" class="btn btn-secondary">Disconnect</button>
              </div>
            </div>
            <div class="cubbit-status mt-4">
              <h4>Connection Status</h4>
              <div class="status-indicator">
                <span class="status-dot"></span>
                <span class="status-text">Not connected</span>
              </div>
            </div>
            <div class="cubbit-projects mt-4 hidden">
              <h4>Your Projects</h4>
              <div class="project-list">
                <div class="loading-spinner">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Loading projects...</span>
                </div>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'settings':
        panelTitle = 'AlgorithmPress Settings';
        panelContent = `
          <div class="settings-content">
            <nav>
              <div class="nav nav-tabs mb-3" id="settings-tabs" role="tablist">
                <button class="nav-link active" id="general-tab" data-bs-toggle="tab" data-bs-target="#general-panel" type="button" role="tab" aria-controls="general-panel" aria-selected="true">General</button>
                <button class="nav-link" id="appearance-tab" data-bs-toggle="tab" data-bs-target="#appearance-panel" type="button" role="tab" aria-controls="appearance-panel" aria-selected="false">Appearance</button>
                <button class="nav-link" id="modules-tab" data-bs-toggle="tab" data-bs-target="#modules-panel" type="button" role="tab" aria-controls="modules-panel" aria-selected="false">Modules</button>
                <button class="nav-link" id="notifications-tab" data-bs-toggle="tab" data-bs-target="#notifications-panel" type="button" role="tab" aria-controls="notifications-panel" aria-selected="false">Notifications</button>
              </div>
            </nav>
            <div class="tab-content" id="settings-tab-content">
              <div class="tab-pane fade show active" id="general-panel" role="tabpanel" aria-labelledby="general-tab">
                <h3>General Settings</h3>
                <div class="card mb-4">
                  <div class="card-body">
                    <h4 class="card-title">Builder Preferences</h4>
                    <div class="mb-3">
                      <div class="form-check">
                        <input type="checkbox" id="auto-save" class="form-check-input" checked>
                        <label class="form-check-label" for="auto-save">Enable auto-save</label>
                      </div>
                    </div>
                    <div class="mb-3">
                      <label for="save-interval" class="form-label">Auto-save interval (seconds)</label>
                      <input type="number" id="save-interval" class="form-control" value="60" min="30" max="300">
                    </div>
                    <div class="mb-3">
                      <label for="default-theme" class="form-label">Default theme</label>
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
              </div>
              <div class="tab-pane fade" id="appearance-panel" role="tabpanel" aria-labelledby="appearance-tab">
                <h3>Appearance Settings</h3>
                <div class="card mb-4">
                  <div class="card-body">
                    <h4 class="card-title">UI Preferences</h4>
                    <div class="mb-3">
                      <label for="ui-color-scheme" class="form-label">Color Scheme</label>
                      <select id="ui-color-scheme" class="form-select">
                        <option value="default">Default (Yellow/Blue)</option>
                        <option value="dark">Dark Mode</option>
                        <option value="light">Light Mode</option>
                        <option value="sunset">Sunset</option>
                        <option value="forest">Forest</option>
                        <option value="ocean">Ocean</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="font-size" class="form-label">UI Font Size</label>
                      <select id="font-size" class="form-select">
                        <option value="small">Small</option>
                        <option value="medium" selected>Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="animation-speed" class="form-label">Animation Speed</label>
                      <select id="animation-speed" class="form-select">
                        <option value="fast">Fast</option>
                        <option value="normal" selected>Normal</option>
                        <option value="slow">Slow</option>
                        <option value="none">No Animations</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tab-pane fade" id="modules-panel" role="tabpanel" aria-labelledby="modules-tab">
                <h3>Module Settings</h3>
                <div class="card mb-4">
                  <div class="card-body">
                    <h4 class="card-title">Module Management</h4>
                    <div class="list-group">
                      <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h5 class="mb-1">Voice Control</h5>
                          <p class="mb-0 text-muted">Enable voice commands for the builder</p>
                        </div>
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="voice-control-switch" checked>
                        </div>
                      </div>
                      <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h5 class="mb-1">NexusGrid</h5>
                          <p class="mb-0 text-muted">Decentralized application platform</p>
                        </div>
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="nexus-grid-switch" checked>
                        </div>
                      </div>
                      <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h5 class="mb-1">Demonstration System</h5>
                          <p class="mb-0 text-muted">Demo application generator</p>
                        </div>
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="demo-system-switch" checked>
                        </div>
                      </div>
                      <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h5 class="mb-1">Rainbow Indicator</h5>
                          <p class="mb-0 text-muted">Visual feedback for operations</p>
                        </div>
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="rainbow-indicator-switch" checked>
                        </div>
                      </div>
                      <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h5 class="mb-1">Cubbit Storage</h5>
                          <p class="mb-0 text-muted">Decentralized storage integration</p>
                        </div>
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="cubbit-storage-switch" checked>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tab-pane fade" id="notifications-panel" role="tabpanel" aria-labelledby="notifications-tab">
                <h3>Notification Settings</h3>
                <div class="card mb-4">
                  <div class="card-body">
                    <h4 class="card-title">Notification Preferences</h4>
                    <div class="mb-3">
                      <div class="form-check">
                        <input type="checkbox" id="enable-notifications" class="form-check-input" checked>
                        <label class="form-check-label" for="enable-notifications">Enable notifications</label>
                      </div>
                    </div>
                    <div class="mb-3">
                      <div class="form-check">
                        <input type="checkbox" id="notification-sound" class="form-check-input" checked>
                        <label class="form-check-label" for="notification-sound">Play sound for notifications</label>
                      </div>
                    </div>
                    <div class="mb-3">
                      <label for="notification-position" class="form-label">Notification Position</label>
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
            </div>
            <div class="d-flex justify-content-end mt-3">
              <button id="save-settings-btn" class="btn btn-primary me-2">Save Settings</button>
              <button id="reset-settings-btn" class="btn btn-secondary">Reset to Defaults</button>
            </div>
          </div>
        `;
        break;
        
      default:
        return null;
    }
    
    // Create panel element
    const panel = document.createElement('div');
    panel.id = `${panelId}-panel`;
    panel.className = 'system-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>${panelTitle}</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="${panelId}-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        ${panelContent}
      </div>
    `;
    
    // Add to document
    document.body.appendChild(panel);
    
    // Add close button event listener
    document.getElementById(`${panelId}-close-btn`).addEventListener('click', function() {
      togglePanel(panelId);
    });
    
    // Add specific event listeners based on panel type
    setupPanelEventListeners(panelId);
    
    return panel;
  }
  
  /**
   * Set up event listeners for a specific panel
   * @param {string} panelId - Panel identifier
   */
  function setupPanelEventListeners(panelId) {
    switch (panelId) {
      case 'implementation':
        // Add implementation panel event listeners
        document.getElementById('start-indicator-btn')?.addEventListener('click', function() {
          if (window.RainbowIndicator) {
            const previewEl = document.getElementById('indicator-preview');
            if (previewEl && !window.previewIndicator) {
              window.previewIndicator = RainbowIndicator.init(previewEl, {
                borderSize: 4,
                glowSize: 20,
                animationSpeed: 4
              });
            }
            if (window.previewIndicator) {
              window.previewIndicator.start();
            }
          } else {
            showToast('error', 'Rainbow Indicator not available');
          }
        });
        
        document.getElementById('stop-indicator-btn')?.addEventListener('click', function() {
          if (window.previewIndicator) {
            window.previewIndicator.stop();
          }
        });
        
        document.getElementById('toggle-indicator-btn')?.addEventListener('click', function() {
          if (window.previewIndicator) {
            window.previewIndicator.toggle();
          }
        });
        break;
        
      case 'rainbow-indicator':
        // Add range input event listeners
        document.querySelectorAll('#rainbow-indicator-panel .form-range')?.forEach(range => {
          range.addEventListener('input', function() {
            this.nextElementSibling.textContent = this.value + (
              this.id === 'animation-speed' ? 's' : 'px'
            );
          });
        });
        
        // Apply button event listener
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
        
        // Preview button event listener
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
        break;
        
      case 'cubbit-storage':
        // Connect button event listener
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
            showToast('error', 'Cubbit Storage module not available');
          }
        });
        
        // Disconnect button event listener
        document.getElementById('cubbit-disconnect-btn')?.addEventListener('click', function() {
          if (window.CubbitStorage) {
            window.CubbitStorage.disconnect().then(() => {
              showToast('success', 'Disconnected from Cubbit DS3');
              updateCubbitStorageStatus(false);
            }).catch(error => {
              showToast('error', 'Disconnection failed: ' + error.message);
            });
          } else {
            showToast('error', 'Cubbit Storage module not available');
          }
        });
        break;
        
      case 'settings':
        // Save settings button event listener
        document.getElementById('save-settings-btn')?.addEventListener('click', function() {
          saveSettings();
          showToast('success', 'Settings saved successfully');
        });
        
        // Reset settings button event listener
        document.getElementById('reset-settings-btn')?.addEventListener('click', function() {
          if (confirm('Are you sure you want to reset all settings to defaults?')) {
            resetSettings();
            showToast('info', 'Settings reset to defaults');
          }
        });
        break;
    }
  }
  
  /**
   * Update Cubbit Storage status
   * @param {boolean} connected - Whether Cubbit storage is connected
   */
  function updateCubbitStorageStatus(connected) {
    const statusDot = document.querySelector('.cubbit-status .status-dot');
    const statusText = document.querySelector('.cubbit-status .status-text');
    const projectsList = document.querySelector('.cubbit-projects');
    
    if (statusDot && statusText) {
      if (connected) {
        statusDot.style.backgroundColor = 'rgba(46, 204, 113, 0.8)';
        statusText.textContent = 'Connected';
        
        if (projectsList) {
          projectsList.classList.remove('hidden');
        }
      } else {
        statusDot.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        statusText.textContent = 'Not connected';
        
        if (projectsList) {
          projectsList.classList.add('hidden');
        }
      }
    }
  }
  
  /**
   * Save user settings
   */
  function saveSettings() {
    // Get settings from form
    const settings = {
      general: {
        autoSave: document.getElementById('auto-save')?.checked || false,
        saveInterval: parseInt(document.getElementById('save-interval')?.value || '60'),
        defaultTheme: document.getElementById('default-theme')?.value || 'bootstrap'
      },
      appearance: {
        colorScheme: document.getElementById('ui-color-scheme')?.value || 'default',
        fontSize: document.getElementById('font-size')?.value || 'medium',
        animationSpeed: document.getElementById('animation-speed')?.value || 'normal'
      },
      modules: {
        voiceControl: document.getElementById('voice-control-switch')?.checked || false,
        nexusGrid: document.getElementById('nexus-grid-switch')?.checked || false,
        demoSystem: document.getElementById('demo-system-switch')?.checked || false,
        rainbowIndicator: document.getElementById('rainbow-indicator-switch')?.checked || false,
        cubbitStorage: document.getElementById('cubbit-storage-switch')?.checked || false
      },
      notifications: {
        enabled: document.getElementById('enable-notifications')?.checked || false,
        sound: document.getElementById('notification-sound')?.checked || false,
        position: document.getElementById('notification-position')?.value || 'bottom-right'
      }
    };
    
    // Save settings to local storage
    localStorage.setItem('algorithm_press_settings', JSON.stringify(settings));
    
    // Apply settings
    applySettings(settings);
  }
  
  /**
   * Reset settings to defaults
   */
  function resetSettings() {
    // Default settings
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
        voiceControl: true,
        nexusGrid: true,
        demoSystem: true,
        rainbowIndicator: true,
        cubbitStorage: true
      },
      notifications: {
        enabled: true,
        sound: true,
        position: 'bottom-right'
      }
    };
    
    // Update form with default values
    if (document.getElementById('auto-save')) document.getElementById('auto-save').checked = defaultSettings.general.autoSave;
    if (document.getElementById('save-interval')) document.getElementById('save-interval').value = defaultSettings.general.saveInterval;
    if (document.getElementById('default-theme')) document.getElementById('default-theme').value = defaultSettings.general.defaultTheme;
    
    if (document.getElementById('ui-color-scheme')) document.getElementById('ui-color-scheme').value = defaultSettings.appearance.colorScheme;
    if (document.getElementById('font-size')) document.getElementById('font-size').value = defaultSettings.appearance.fontSize;
    if (document.getElementById('animation-speed')) document.getElementById('animation-speed').value = defaultSettings.appearance.animationSpeed;
    
    if (document.getElementById('voice-control-switch')) document.getElementById('voice-control-switch').checked = defaultSettings.modules.voiceControl;
    if (document.getElementById('nexus-grid-switch')) document.getElementById('nexus-grid-switch').checked = defaultSettings.modules.nexusGrid;
    if (document.getElementById('demo-system-switch')) document.getElementById('demo-system-switch').checked = defaultSettings.modules.demoSystem;
    if (document.getElementById('rainbow-indicator-switch')) document.getElementById('rainbow-indicator-switch').checked = defaultSettings.modules.rainbowIndicator;
    if (document.getElementById('cubbit-storage-switch')) document.getElementById('cubbit-storage-switch').checked = defaultSettings.modules.cubbitStorage;
    
    if (document.getElementById('enable-notifications')) document.getElementById('enable-notifications').checked = defaultSettings.notifications.enabled;
    if (document.getElementById('notification-sound')) document.getElementById('notification-sound').checked = defaultSettings.notifications.sound;
    if (document.getElementById('notification-position')) document.getElementById('notification-position').value = defaultSettings.notifications.position;
    
    // Save default settings to local storage
    localStorage.setItem('algorithm_press_settings', JSON.stringify(defaultSettings));
    
    // Apply settings
    applySettings(defaultSettings);
  }
  
  /**
   * Apply settings to the UI
   * @param {Object} settings - Settings to apply
   */
  function applySettings(settings) {
    // Apply module visibility settings
    if (settings.modules) {
      document.getElementById('voice-control-dock-btn').style.display = settings.modules.voiceControl ? '' : 'none';
      document.getElementById('nexus-grid-dock-btn').style.display = settings.modules.nexusGrid ? '' : 'none';
      document.getElementById('demo-system-dock-btn').style.display = settings.modules.demoSystem ? '' : 'none';
      document.getElementById('rainbow-indicator-dock-btn').style.display = settings.modules.rainbowIndicator ? '' : 'none';
      document.getElementById('cubbit-storage-dock-btn').style.display = settings.modules.cubbitStorage ? '' : 'none';
    }
    
    // Apply appearance settings
    if (settings.appearance) {
      // Apply color scheme
      document.documentElement.setAttribute('data-color-scheme', settings.appearance.colorScheme);
      
      // Apply font size
      document.documentElement.setAttribute('data-font-size', settings.appearance.fontSize);
      
      // Apply animation speed
      document.documentElement.setAttribute('data-animation-speed', settings.appearance.animationSpeed);
    }
    
    // Apply notification settings
    if (settings.notifications) {
      // Update toast container position if it exists
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) {
        toastContainer.className = `toast-container position-fixed p-3 ${settings.notifications.position.replace('-', ' ')}`;
      }
    }
    
    // Apply theme if PHP-WASM Builder is available
    if (window.PHPWasmBuilder && settings.general && settings.general.defaultTheme) {
      try {
        // Get current state
        const state = window.PHPWasmBuilder.getState();
        
        // If no project exists or current theme is different
        if (!state.currentProject || state.currentProject.theme !== settings.general.defaultTheme) {
          // Update theme selector
          const themeSelector = document.getElementById('theme-selector');
          if (themeSelector) {
            themeSelector.value = settings.general.defaultTheme;
            
            // Trigger change event
            const event = new Event('change');
            themeSelector.dispatchEvent(event);
          }
        }
      } catch (error) {
        console.error('Error applying theme setting:', error);
      }
    }
  }
  
  /**
   * Show a toast notification
   * @param {string} type - Notification type (success, info, warning, error)
   * @param {string} message - Notification message
   */
  function showToast(type, message) {
    // Check if function exists in the global scope
    if (typeof window.PHPWasmBuilder !== 'undefined' && typeof window.PHPWasmBuilder.showToast === 'function') {
      window.PHPWasmBuilder.showToast(type, message);
      return;
    }
    
    // Fallback implementation
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Get settings for notification position
    const settings = JSON.parse(localStorage.getItem('algorithm_press_settings') || '{}');
    const position = settings.notifications?.position || 'bottom-right';
    
    // Add to document
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      // Create toast container
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = `toast-container position-fixed p-3 ${position.replace('-', ' ')}`;
      document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toastEl);
    
    // Initialize and show toast
    if (window.bootstrap && window.bootstrap.Toast) {
      const toast = new window.bootstrap.Toast(toastEl, {
        delay: 5000
      });
      toast.show();
    } else {
      // Fallback if Bootstrap is not available
      toastEl.style.opacity = '1';
      setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => {
          toastEl.remove();
        }, 300);
      }, 5000);
    }
    
    // Remove after hiding
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
});
