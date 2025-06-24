/**
 * Storage Configuration Manager for AlgorithmPress
 * Manages storage provider configurations with encryption and validation
 */

const StorageConfigManager = (function() {
  'use strict';

  // Configuration storage key
  const CONFIG_STORAGE_KEY = 'algorithmpress_storage_config'; // Stores all available provider configs
  const ACTIVE_STORAGE_SETTINGS_KEY = 'algorithmpress_active_storage_settings'; // Stores the chosen primary provider and its config
  const ENCRYPTION_KEY_STORAGE = 'algorithmpress_encryption_key';

  // Default configurations for each provider
  const DEFAULT_CONFIGS = {
    [UnifiedStorage.PROVIDERS.AWS_S3]: {
      name: 'Amazon S3',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key ID' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Secret Access Key' },
        { name: 'region', type: 'select', required: true, label: 'Region', 
          options: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1'] },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fab fa-aws'
    },

    [UnifiedStorage.PROVIDERS.GOOGLE_CLOUD]: {
      name: 'Google Cloud Storage',
      fields: [
        { name: 'projectId', type: 'text', required: true, label: 'Project ID' },
        { name: 'keyFile', type: 'textarea', required: true, label: 'Service Account Key (JSON)' },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fab fa-google'
    },

    [UnifiedStorage.PROVIDERS.AZURE_BLOB]: {
      name: 'Azure Blob Storage',
      fields: [
        { name: 'accountName', type: 'text', required: true, label: 'Account Name' },
        { name: 'accountKey', type: 'password', required: true, label: 'Account Key' },
        { name: 'containerName', type: 'text', required: true, label: 'Container Name' }
      ],
      testConnection: true,
      icon: 'fab fa-microsoft'
    },

    [UnifiedStorage.PROVIDERS.DIGITALOCEAN]: {
      name: 'DigitalOcean Spaces',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Secret Key' },
        { name: 'region', type: 'select', required: true, label: 'Region',
          options: ['nyc3', 'ams3', 'sgp1', 'fra1', 'sfo3'] },
        { name: 'bucket', type: 'text', required: true, label: 'Space Name' }
      ],
      testConnection: true,
      icon: 'fab fa-digital-ocean'
    },

    [UnifiedStorage.PROVIDERS.VULTR]: {
      name: 'Vultr Object Storage',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Secret Key' },
        { name: 'region', type: 'select', required: true, label: 'Region',
          options: ['ewr1', 'sjc1', 'ams1'] },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fas fa-server'
    },

    [UnifiedStorage.PROVIDERS.OVHCLOUD]: {
      name: 'OVHcloud Object Storage',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Secret Key' },
        { name: 'region', type: 'select', required: true, label: 'Region',
          options: ['gra', 'sbg', 'bhs', 'waw'] },
        { name: 'bucket', type: 'text', required: true, label: 'Container Name' }
      ],
      testConnection: true,
      icon: 'fas fa-cloud'
    },

    [UnifiedStorage.PROVIDERS.ALIBABA_OSS]: {
      name: 'Alibaba Cloud OSS',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key ID' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Access Key Secret' },
        { name: 'region', type: 'select', required: true, label: 'Region',
          options: ['cn-hangzhou', 'cn-shanghai', 'cn-beijing', 'us-west-1', 'ap-southeast-1'] },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fas fa-cloud'
    },

    [UnifiedStorage.PROVIDERS.BACKBLAZE_B2]: {
      name: 'Backblaze B2',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Key ID' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Application Key' },
        { name: 'region', type: 'select', required: true, label: 'Region',
          options: ['us-west-000', 'us-west-001', 'eu-central-003'] },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fas fa-archive'
    },

    [UnifiedStorage.PROVIDERS.WASABI]: {
      name: 'Wasabi Hot Cloud Storage',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Secret Key' },
        { name: 'region', type: 'select', required: true, label: 'Region',
          options: ['us-east-1', 'us-east-2', 'us-west-1', 'eu-central-1', 'ap-northeast-1'] },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fas fa-fire'
    },

    [UnifiedStorage.PROVIDERS.LINODE]: {
      name: 'Linode Object Storage',
      fields: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key' },
        { name: 'secretAccessKey', type: 'password', required: true, label: 'Secret Key' },
        { name: 'region', type: 'select', required: true, label: 'Region',
          options: ['us-east-1', 'eu-central-1', 'ap-south-1'] },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fas fa-server'
    },

    [UnifiedStorage.PROVIDERS.CUBBIT]: {
      name: 'Cubbit DS3',
      fields: [
        { name: 'apiKey', type: 'password', required: true, label: 'API Key' },
        { name: 'bucketName', type: 'text', required: true, label: 'Bucket Name' },
        { name: 'baseUrl', type: 'text', required: false, label: 'Base URL', 
          placeholder: 'https://api.cubbit.io' }
      ],
      testConnection: true,
      icon: 'fas fa-cube'
    },

    // Web3 Storage Providers
    [UnifiedStorage.PROVIDERS.IPFS]: {
      name: 'IPFS',
      fields: [
        { name: 'gateway', type: 'text', required: false, label: 'IPFS Gateway',
          placeholder: 'https://ipfs.io/ipfs/' },
        { name: 'pinataApiKey', type: 'text', required: false, label: 'Pinata API Key' },
        { name: 'pinataSecretKey', type: 'password', required: false, label: 'Pinata Secret Key' },
        { name: 'useLocalNode', type: 'checkbox', required: false, label: 'Use Local IPFS Node' },
        { name: 'localNodeUrl', type: 'text', required: false, label: 'Local Node URL',
          placeholder: 'http://localhost:5001' }
      ],
      testConnection: true,
      icon: 'fas fa-network-wired'
    },

    [UnifiedStorage.PROVIDERS.STORJ]: {
      name: 'Storj DCS',
      fields: [
        { name: 'accessGrant', type: 'textarea', required: false, label: 'Access Grant' },
        { name: 'apiKey', type: 'text', required: false, label: 'API Key' },
        { name: 'passphrase', type: 'password', required: false, label: 'Passphrase' },
        { name: 'satellite', type: 'text', required: false, label: 'Satellite',
          placeholder: 'us1.storj.io:7777' },
        { name: 'bucket', type: 'text', required: true, label: 'Bucket Name' }
      ],
      testConnection: true,
      icon: 'fas fa-satellite'
    },

    [UnifiedStorage.PROVIDERS.ARWEAVE]: {
      name: 'Arweave',
      fields: [
        { name: 'wallet', type: 'textarea', required: true, label: 'Wallet JSON' },
        { name: 'gateway', type: 'text', required: false, label: 'Gateway URL',
          placeholder: 'https://arweave.net' },
        { name: 'bundlrNode', type: 'text', required: false, label: 'Bundlr Node',
          placeholder: 'https://node1.bundlr.network' }
      ],
      testConnection: true,
      icon: 'fas fa-infinity'
    },

    [UnifiedStorage.PROVIDERS.FILECOIN]: {
      name: 'Filecoin',
      fields: [
        { name: 'web3StorageToken', type: 'password', required: false, label: 'Web3.Storage Token' },
        { name: 'lighthouseApiKey', type: 'password', required: false, label: 'Lighthouse API Key' },
        { name: 'provider', type: 'select', required: true, label: 'Provider',
          options: ['web3.storage', 'lighthouse'] }
      ],
      testConnection: true,
      icon: 'fas fa-coins'
    },

    [UnifiedStorage.PROVIDERS.SIA]: {
      name: 'Sia Skynet',
      fields: [
        { name: 'skynetPortal', type: 'text', required: false, label: 'Skynet Portal',
          placeholder: 'https://siasky.net' },
        { name: 'apiUrl', type: 'text', required: false, label: 'Local API URL',
          placeholder: 'http://localhost:9980' },
        { name: 'apiPassword', type: 'password', required: false, label: 'API Password' }
      ],
      testConnection: true,
      icon: 'fas fa-cloud-upload-alt'
    },

    [UnifiedStorage.PROVIDERS.SWARM]: {
      name: 'Ethereum Swarm',
      fields: [
        { name: 'gateway', type: 'text', required: false, label: 'Swarm Gateway',
          placeholder: 'https://gateway.ethswarm.org' },
        { name: 'beeApiUrl', type: 'text', required: false, label: 'Bee API URL',
          placeholder: 'http://localhost:1633' }
      ],
      testConnection: true,
      icon: 'fab fa-ethereum'
    }
  };

  // Encryption utilities
  async function generateEncryptionKey() {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  async function encryptData(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  async function decryptData(encryptedData, key) {
    const iv = new Uint8Array(encryptedData.iv);
    const data = new Uint8Array(encryptedData.data);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decodedData = new TextDecoder().decode(decrypted);
    return JSON.parse(decodedData);
  }

  // Configuration management
  let encryptionKey = null;
  let configurations = new Map();

  /**
   * Initialize the configuration manager
   */
  async function initialize() {
    try {
      // Try to load existing encryption key
      const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
      if (storedKey) {
        const keyData = JSON.parse(storedKey);
        encryptionKey = await crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new encryption key
        encryptionKey = await generateEncryptionKey();
        const exportedKey = await crypto.subtle.exportKey('jwk', encryptionKey);
        localStorage.setItem(ENCRYPTION_KEY_STORAGE, JSON.stringify(exportedKey));
      }

      // Load configurations
      await loadConfigurations();
    } catch (error) {
      console.error('Failed to initialize configuration manager:', error);
      throw error;
    }
  }

  /**
   * Load configurations from storage
   */
  async function loadConfigurations() {
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        const encryptedData = JSON.parse(storedConfig);
        const decryptedData = await decryptData(encryptedData, encryptionKey);
        
        configurations.clear();
        Object.entries(decryptedData).forEach(([provider, config]) => {
          configurations.set(provider, config);
        });
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
      configurations.clear();
    }
  }

  /**
   * Save configurations to storage
   */
  async function saveConfigurations() {
    try {
      const configData = Object.fromEntries(configurations);
      const encryptedData = await encryptData(configData, encryptionKey);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Failed to save configurations:', error);
      throw error;
    }
  }

  // Public API
  return {
    DEFAULT_CONFIGS,
    initialize,
    
    /**
     * Get configuration for a provider
     */
    getConfig: (provider) => configurations.get(provider),
    
    /**
     * Set configuration for a provider
     */
    setConfig: async (provider, config) => {
      configurations.set(provider, config);
      await saveConfigurations();
    },
    
    /**
     * Remove configuration for a provider
     */
    removeConfig: async (provider) => {
      configurations.delete(provider);
      await saveConfigurations();
    },
    
    /**
     * Get all configured providers
     */
    getConfiguredProviders: () => Array.from(configurations.keys()),
    
    /**
     * Validate configuration for a provider
     */
    validateConfig: (provider, config) => {
      const providerConfig = DEFAULT_CONFIGS[provider];
      if (!providerConfig) {
        throw new Error(`Unknown provider: ${provider}`);
      }

      const errors = [];
      providerConfig.fields.forEach(field => {
        if (field.required && (!config[field.name] || config[field.name].trim() === '')) {
          errors.push(`${field.label} is required`);
        }
      });

      return errors;
    },
    
    /**
     * Test connection for a provider
     */
    testConnection: async (provider, config) => {
      try {
        // Initialize the provider with the config
        const providerInstance = await UnifiedStorage.initializeProvider(provider, config);
        
        // Try a simple operation (list with empty prefix)
        await providerInstance.list('', { limit: 1 });
        
        return { success: true, message: 'Connection successful' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
    
    /**
     * Export configurations (encrypted)
     */
    exportConfigurations: async () => {
      const configData = Object.fromEntries(configurations);
      return await encryptData(configData, encryptionKey);
    },
    
    /**
     * Import configurations
     */
    importConfigurations: async (encryptedData) => {
      try {
        const configData = await decryptData(encryptedData, encryptionKey);
        configurations.clear();
        Object.entries(configData).forEach(([provider, config]) => {
          configurations.set(provider, config);
        });
        await saveConfigurations();
        return true;
      } catch (error) {
        console.error('Failed to import configurations:', error);
        return false;
      }
    },

    /**
     * Set the active storage provider settings
     */
    setActiveStorageSettings: async (providerType, providerConfig) => {
      try {
        const settingsToSave = { providerType, config: providerConfig };
        const encryptedSettings = await encryptData(settingsToSave, encryptionKey);
        localStorage.setItem(ACTIVE_STORAGE_SETTINGS_KEY, JSON.stringify(encryptedSettings));
        console.log(`Active storage set to: ${providerType}`);
      } catch (error) {
        console.error('Failed to set active storage settings:', error);
        throw error;
      }
    },

    /**
     * Get the active storage provider settings
     * @returns {Promise<Object|null>} { providerType: string, config: Object } or null if not set
     */
    getActiveStorageSettings: async () => {
      try {
        const storedSettings = localStorage.getItem(ACTIVE_STORAGE_SETTINGS_KEY);
        if (storedSettings) {
          const encryptedData = JSON.parse(storedSettings);
          const decryptedSettings = await decryptData(encryptedData, encryptionKey);
          return decryptedSettings; // Should be { providerType, config }
        }
        return null; // No active setting stored
      } catch (error) {
        console.error('Failed to get active storage settings:', error);
        // Fallback or default if necessary, e.g., return { providerType: UnifiedStorage.PROVIDERS.LOCAL, config: {} };
        return null;
      }
    }
  };
})();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageConfigManager;
} else if (typeof window !== 'undefined') {
  window.StorageConfigManager = StorageConfigManager;
}
