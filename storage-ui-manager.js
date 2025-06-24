/**
 * Storage UI Manager for AlgorithmPress
 * Provides comprehensive UI for managing storage providers
 */

const StorageUIManager = (function() {
  'use strict';

  let isInitialized = false;
  let currentProvider = null;
  let storageModal = null;

  /**
   * Initialize the Storage UI Manager
   */
  async function initialize() {
    if (isInitialized) return;

    try {
      await StorageConfigManager.initialize();
      createStorageModal();
      bindEvents();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Storage UI Manager:', error);
      throw error;
    }
  }

  /**
   * Create the storage configuration modal
   */
  function createStorageModal() {
    const modalHTML = `
      <div class="modal fade" id="storage-config-modal" tabindex="-1" aria-labelledby="storageConfigModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="storageConfigModalLabel">
                <i class="fas fa-cloud"></i> Storage Configuration
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <!-- Provider List -->
                <div class="col-md-4">
                  <h6>Storage Providers</h6>
                  <div class="list-group" id="provider-list">
                    <!-- Providers will be populated here -->
                  </div>
                  
                  <div class="mt-3">
                    <button class="btn btn-outline-primary btn-sm" id="import-config-btn">
                      <i class="fas fa-upload"></i> Import Config
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" id="export-config-btn">
                      <i class="fas fa-download"></i> Export Config
                    </button>
                  </div>
                </div>
                
                <!-- Configuration Form -->
                <div class="col-md-8">
                  <div id="provider-config-form">
                    <div class="text-center text-muted py-5">
                      <i class="fas fa-arrow-left fa-2x mb-3"></i>
                      <p>Select a storage provider to configure</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" id="save-config-btn" style="display: none;">
                Save Configuration
              </button>
              <button type="button" class="btn btn-success" id="test-connection-btn" style="display: none;">
                <i class="fas fa-plug"></i> Test Connection
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Hidden file input for import -->
      <input type="file" id="config-file-input" accept=".json" style="display: none;">
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('storage-config-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    storageModal = new bootstrap.Modal(document.getElementById('storage-config-modal'));
  }

  /**
   * Populate the provider list
   */
  function populateProviderList() {
    const providerList = document.getElementById('provider-list');
    // Show all providers, not just configured ones
    const allProviders = Object.values(UnifiedStorage.PROVIDERS);

    providerList.innerHTML = '';

    // Group providers by category (as before)
    const categories = {
      'Traditional Cloud': [
        UnifiedStorage.PROVIDERS.AWS_S3,
        UnifiedStorage.PROVIDERS.GOOGLE_CLOUD,
        UnifiedStorage.PROVIDERS.AZURE_BLOB
      ],
      'Object Storage': [
        UnifiedStorage.PROVIDERS.DIGITALOCEAN,
        UnifiedStorage.PROVIDERS.VULTR,
        UnifiedStorage.PROVIDERS.OVHCLOUD,
        UnifiedStorage.PROVIDERS.ALIBABA_OSS,
        UnifiedStorage.PROVIDERS.BACKBLAZE_B2,
        UnifiedStorage.PROVIDERS.WASABI,
        UnifiedStorage.PROVIDERS.LINODE
      ],
      'Decentralized': [
        UnifiedStorage.PROVIDERS.CUBBIT
      ],
      'Web3 Storage': [
        UnifiedStorage.PROVIDERS.IPFS,
        UnifiedStorage.PROVIDERS.STORJ,
        UnifiedStorage.PROVIDERS.ARWEAVE,
        UnifiedStorage.PROVIDERS.FILECOIN,
        UnifiedStorage.PROVIDERS.SIA,
        UnifiedStorage.PROVIDERS.SWARM
      ],
      'Local': [
        UnifiedStorage.PROVIDERS.LOCAL
      ]
    };

    Object.entries(categories).forEach(([category, providers]) => {
      // Add category header
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'list-group-item list-group-item-secondary';
      categoryHeader.innerHTML = `<strong>${category}</strong>`;
      providerList.appendChild(categoryHeader);

      providers.forEach(provider => {
        // Show even if not configured
        const config = StorageConfigManager.DEFAULT_CONFIGS[provider] || { name: provider, icon: 'fas fa-database', fields: [] };
        const isConfigured = StorageConfigManager.getConfiguredProviders().includes(provider);
        const listItem = document.createElement('a');
        listItem.href = '#';
        listItem.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center`;
        listItem.dataset.provider = provider;
        
        listItem.innerHTML = `
          <div>
            <i class="${config.icon} me-2"></i>
            ${config.name}
          </div>
          ${isConfigured ? '<span class="badge bg-success">Configured</span>' : ''}
        `;

        listItem.addEventListener('click', (e) => {
          e.preventDefault();
          selectProvider(provider);
        });

        providerList.appendChild(listItem);
      });
    });
  }

  /**
   * Select a provider and show its configuration form
   */
  function selectProvider(provider) {
    currentProvider = provider;
    
    // Update active state in list
    document.querySelectorAll('#provider-list .list-group-item-action').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-provider="${provider}"]`).classList.add('active');

    // Show configuration form
    showProviderConfigForm(provider);
    
    // Show action buttons
    document.getElementById('save-config-btn').style.display = 'inline-block';
    document.getElementById('test-connection-btn').style.display = 'inline-block';
  }

  /**
   * Show configuration form for a provider
   */
  function showProviderConfigForm(provider) {
    const config = StorageConfigManager.DEFAULT_CONFIGS[provider];
    const existingConfig = StorageConfigManager.getConfig(provider) || {};
    const formContainer = document.getElementById('provider-config-form');

    let formHTML = `
      <div class="d-flex align-items-center mb-3">
        <i class="${config.icon} fa-2x me-3"></i>
        <div>
          <h5 class="mb-0">${config.name}</h5>
          <small class="text-muted">Configure your ${config.name} storage settings</small>
        </div>
      </div>
      
      <form id="provider-form">
    `;

    config.fields.forEach(field => {
      const value = existingConfig[field.name] || '';
      const fieldId = `field-${field.name}`;
      
      formHTML += `<div class="mb-3">`;
      formHTML += `<label for="${fieldId}" class="form-label">
        ${field.label}
        ${field.required ? '<span class="text-danger">*</span>' : ''}
      </label>`;

      switch (field.type) {
        case 'text':
          formHTML += `<input type="text" class="form-control" id="${fieldId}" name="${field.name}" 
            value="${value}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
          break;
        
        case 'password':
          formHTML += `<input type="password" class="form-control" id="${fieldId}" name="${field.name}" 
            value="${value}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
          break;
        
        case 'textarea':
          formHTML += `<textarea class="form-control" id="${fieldId}" name="${field.name}" rows="4" 
            placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>${value}</textarea>`;
          break;
        
        case 'select':
          formHTML += `<select class="form-select" id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>`;
          formHTML += `<option value="">Select ${field.label}</option>`;
          field.options.forEach(option => {
            const selected = value === option ? 'selected' : '';
            formHTML += `<option value="${option}" ${selected}>${option}</option>`;
          });
          formHTML += `</select>`;
          break;
        
        case 'checkbox':
          const checked = value ? 'checked' : '';
          formHTML += `<div class="form-check">
            <input class="form-check-input" type="checkbox" id="${fieldId}" name="${field.name}" ${checked}>
            <label class="form-check-label" for="${fieldId}">${field.label}</label>
          </div>`;
          break;
      }

      if (field.help) {
        formHTML += `<div class="form-text">${field.help}</div>`;
      }

      formHTML += `</div>`;
    });

    formHTML += `</form>`;

    // Add connection status if configured
    const isConfigured = StorageConfigManager.getConfiguredProviders().includes(provider);
    if (isConfigured) {
      formHTML += `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          This provider is already configured. You can update the settings or test the connection.
        </div>
      `;
    }

    formContainer.innerHTML = formHTML;
  }

  /**
   * Save provider configuration
   */
  async function saveProviderConfig() {
    if (!currentProvider) return;

    const form = document.getElementById('provider-form');
    const formData = new FormData(form);
    const config = {};

    // Extract form data
    for (const [key, value] of formData.entries()) {
      config[key] = value;
    }

    // Handle checkboxes separately
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      config[checkbox.name] = checkbox.checked;
    });

    try {
      // Validate configuration
      const errors = StorageConfigManager.validateConfig(currentProvider, config);
      if (errors.length > 0) {
        showAlert('danger', 'Validation Error', errors.join('<br>'));
        return;
      }

      // Save configuration
      await StorageConfigManager.setConfig(currentProvider, config);
      
      // Update UI
      populateProviderList();
      showAlert('success', 'Success', 'Configuration saved successfully!');
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
      showAlert('danger', 'Error', `Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Test provider connection
   */
  async function testProviderConnection() {
    if (!currentProvider) return;

    const form = document.getElementById('provider-form');
    const formData = new FormData(form);
    const config = {};

    // Extract form data
    for (const [key, value] of formData.entries()) {
      config[key] = value;
    }

    // Handle checkboxes
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      config[checkbox.name] = checkbox.checked;
    });

    const testBtn = document.getElementById('test-connection-btn');
    const originalText = testBtn.innerHTML;
    
    try {
      testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
      testBtn.disabled = true;

      const result = await StorageConfigManager.testConnection(currentProvider, config);
      
      if (result.success) {
        showAlert('success', 'Connection Test', 'Connection successful!');
      } else {
        showAlert('danger', 'Connection Test', `Connection failed: ${result.message}`);
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
      showAlert('danger', 'Connection Test', `Connection test failed: ${error.message}`);
    } finally {
      testBtn.innerHTML = originalText;
      testBtn.disabled = false;
    }
  }

  /**
   * Show alert message
   */
  function showAlert(type, title, message) {
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <strong>${title}:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    const formContainer = document.getElementById('provider-config-form');
    const existingAlert = formContainer.querySelector('.alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    formContainer.insertAdjacentHTML('afterbegin', alertHTML);
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Save configuration
    document.getElementById('save-config-btn').addEventListener('click', saveProviderConfig);
    
    // Test connection
    document.getElementById('test-connection-btn').addEventListener('click', testProviderConnection);
    
    // Import/Export configuration
    document.getElementById('import-config-btn').addEventListener('click', importConfiguration);
    document.getElementById('export-config-btn').addEventListener('click', exportConfiguration);
    
    // File input for import
    document.getElementById('config-file-input').addEventListener('change', handleConfigFileImport);
    
    // Modal events
    document.getElementById('storage-config-modal').addEventListener('shown.bs.modal', () => {
      populateProviderList();
    });
  }

  /**
   * Export configuration
   */
  async function exportConfiguration() {
    try {
      const encryptedConfig = await StorageConfigManager.exportConfigurations();
      const blob = new Blob([JSON.stringify(encryptedConfig, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `algorithmpress-storage-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showAlert('success', 'Export', 'Configuration exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      showAlert('danger', 'Export Error', `Failed to export configuration: ${error.message}`);
    }
  }

  /**
   * Import configuration
   */
  function importConfiguration() {
    document.getElementById('config-file-input').click();
  }

  /**
   * Handle configuration file import
   */
  async function handleConfigFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const encryptedConfig = JSON.parse(text);
      
      const success = await StorageConfigManager.importConfigurations(encryptedConfig);
      
      if (success) {
        populateProviderList();
        showAlert('success', 'Import', 'Configuration imported successfully!');
      } else {
        showAlert('danger', 'Import Error', 'Failed to import configuration. Please check the file format.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      showAlert('danger', 'Import Error', `Failed to import configuration: ${error.message}`);
    }
    
    // Reset file input
    event.target.value = '';
  }

  // Public API
  return {
    initialize,
    
    /**
     * Show the storage configuration modal
     */
    showModal: () => {
      if (!isInitialized) {
        throw new Error('StorageUIManager not initialized');
      }
      storageModal.show();
    },
    
    /**
     * Hide the storage configuration modal
     */
    hideModal: () => {
      if (storageModal) {
        storageModal.hide();
      }
    },
    
    /**
     * Check if initialized
     */
    isInitialized: () => isInitialized
  };
})();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageUIManager;
} else if (typeof window !== 'undefined') {
  window.StorageUIManager = StorageUIManager;
}
