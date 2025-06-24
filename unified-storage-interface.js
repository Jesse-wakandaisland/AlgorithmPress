/**
 * Unified Storage Interface for AlgorithmPress
 * Supports multiple cloud storage providers with a consistent API
 * Production-ready with error handling, retry logic, and failover
 */

const UnifiedStorage = (function() {
  'use strict';

  // Storage provider types
  const PROVIDERS = {
    LOCAL: 'localStorage',
    CUBBIT: 'cubbit',
    AWS_S3: 'aws-s3',
    GOOGLE_CLOUD: 'google-cloud',
    AZURE_BLOB: 'azure-blob',
    DIGITALOCEAN: 'digitalocean',
    VULTR: 'vultr',
    OVHCLOUD: 'ovhcloud',
    ALIBABA_OSS: 'alibaba-oss',
    BACKBLAZE_B2: 'backblaze-b2',
    WASABI: 'wasabi',
    LINODE: 'linode',
    // Web3 Storage Providers
    IPFS: 'ipfs',
    STORJ: 'storj',
    ARWEAVE: 'arweave',
    FILECOIN: 'filecoin',
    SIA: 'sia',
    SWARM: 'swarm'
  };

  // Provider configurations
  const providerConfigs = new Map();
  const activeProviders = new Map();
  let primaryProvider = PROVIDERS.LOCAL;
  let fallbackProviders = [PROVIDERS.LOCAL];

  // Global settings
  const settings = {
    retryAttempts: 3,
    retryDelay: 1000,
    connectionTimeout: 30000,
    enableFailover: true,
    enableCaching: true,
    cacheExpiry: 300000, // 5 minutes
    enableCompression: true,
    enableEncryption: false,
    encryptionKey: null
  };

  // Event system
  const eventListeners = {
    'initialized': [],
    'error': [],
    'progress': [],
    'retry': [],
    'failover': [],
    'success': []
  };

  // Cache for frequently accessed data
  const cache = new Map();

  /**
   * Initialize the unified storage system
   * @param {Object} config - Configuration object
   * @returns {Promise<boolean>} - Success status
   */
  function initialize(config = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // Merge configuration
        Object.assign(settings, config.settings || {});

        // Set primary provider
        if (config.primaryProvider && PROVIDERS[config.primaryProvider.toUpperCase()]) {
          primaryProvider = PROVIDERS[config.primaryProvider.toUpperCase()];
        }

        // Set fallback providers
        if (config.fallbackProviders && Array.isArray(config.fallbackProviders)) {
          fallbackProviders = config.fallbackProviders.map(p =>
            PROVIDERS[p.toUpperCase()] || p
          );
        }

        // Initialize providers
        if (config.providers) {
          for (const [providerType, providerConfig] of Object.entries(config.providers)) {
            await initializeProvider(providerType, providerConfig);
          }
        }

        // Always ensure localStorage is available as fallback
        if (!activeProviders.has(PROVIDERS.LOCAL)) {
          await initializeProvider(PROVIDERS.LOCAL, {});
        }

        notifyListeners('initialized', {
          primaryProvider,
          fallbackProviders,
          activeProviders: Array.from(activeProviders.keys())
        });

        resolve(true);
      } catch (error) {
        notifyListeners('error', { error, context: 'initialization' });
        reject(error);
      }
    });
  }

  /**
   * Initialize a specific storage provider
   * @param {string} providerType - Type of provider
   * @param {Object} config - Provider configuration
   * @returns {Promise<boolean>} - Success status
   */
  async function initializeProvider(providerType, config) {
    try {
      let provider;

      switch (providerType) {
        case PROVIDERS.LOCAL:
          provider = await initializeLocalStorage(config);
          break;
        case PROVIDERS.CUBBIT:
          provider = await initializeCubbitStorage(config);
          break;
        case PROVIDERS.AWS_S3:
          provider = await initializeAwsS3Storage(config);
          break;
        case PROVIDERS.GOOGLE_CLOUD:
          provider = await initializeGoogleCloudStorage(config);
          break;
        case PROVIDERS.AZURE_BLOB:
          provider = await initializeAzureBlobStorage(config);
          break;
        case PROVIDERS.DIGITALOCEAN:
          provider = await initializeDigitalOceanStorage(config);
          break;
        case PROVIDERS.VULTR:
          provider = await initializeVultrStorage(config);
          break;
        case PROVIDERS.OVHCLOUD:
          provider = await initializeOvhCloudStorage(config);
          break;
        case PROVIDERS.ALIBABA_OSS:
          provider = await initializeAlibabaOssStorage(config);
          break;
        case PROVIDERS.BACKBLAZE_B2:
          provider = await initializeBackblazeB2Storage(config);
          break;
        case PROVIDERS.WASABI:
          provider = await initializeWasabiStorage(config);
          break;
        case PROVIDERS.LINODE:
          provider = await initializeLinodeStorage(config);
          break;
        case PROVIDERS.IPFS:
          provider = await initializeIpfsStorage(config);
          break;
        case PROVIDERS.STORJ:
          provider = await initializeStorjStorage(config);
          break;
        case PROVIDERS.ARWEAVE:
          provider = await initializeArweaveStorage(config);
          break;
        case PROVIDERS.FILECOIN:
          provider = await initializeFilecoinStorage(config);
          break;
        case PROVIDERS.SIA:
          provider = await initializeSiaStorage(config);
          break;
        case PROVIDERS.SWARM:
          provider = await initializeSwarmStorage(config);
          break;
        default:
          throw new Error(`Unsupported provider type: ${providerType}`);
      }

      if (provider) {
        providerConfigs.set(providerType, config);
        activeProviders.set(providerType, provider);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to initialize provider ${providerType}:`, error);
      throw error;
    }
  }

  /**
   * Save data with automatic provider selection and failover
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} - Storage result
   */
  async function save(key, data, options = {}) {
    const providers = [primaryProvider, ...fallbackProviders];
    let lastError;

    for (const providerType of providers) {
      try {
        const provider = activeProviders.get(providerType);
        if (!provider) continue;

        const result = await executeWithRetry(
          () => provider.save(key, data, options),
          settings.retryAttempts
        );

        // Cache the data if caching is enabled
        if (settings.enableCaching) {
          setCacheItem(key, data, options.cacheExpiry || settings.cacheExpiry);
        }

        notifyListeners('success', {
          operation: 'save',
          key,
          provider: providerType,
          result
        });

        return { success: true, provider: providerType, result };
      } catch (error) {
        lastError = error;
        notifyListeners('error', {
          operation: 'save',
          key,
          provider: providerType,
          error
        });

        if (settings.enableFailover && providers.indexOf(providerType) < providers.length - 1) {
          notifyListeners('failover', {
            from: providerType,
            to: providers[providers.indexOf(providerType) + 1],
            operation: 'save',
            key
          });
        }
      }
    }

    throw new Error(`Failed to save data to any provider. Last error: ${lastError?.message}`);
  }

  /**
   * Load data with automatic provider selection and failover
   * @param {string} key - Storage key
   * @param {Object} options - Load options
   * @returns {Promise<any>} - Loaded data
   */
  async function load(key, options = {}) {
    // Check cache first
    if (settings.enableCaching && !options.skipCache) {
      const cachedData = getCacheItem(key);
      if (cachedData !== null) {
        return cachedData;
      }
    }

    const providers = [primaryProvider, ...fallbackProviders];
    let lastError;

    for (const providerType of providers) {
      try {
        const provider = activeProviders.get(providerType);
        if (!provider) continue;

        const data = await executeWithRetry(
          () => provider.load(key, options),
          settings.retryAttempts
        );

        // Cache the loaded data
        if (settings.enableCaching && data !== null) {
          setCacheItem(key, data, options.cacheExpiry || settings.cacheExpiry);
        }

        notifyListeners('success', {
          operation: 'load',
          key,
          provider: providerType,
          data
        });

        return data;
      } catch (error) {
        lastError = error;
        notifyListeners('error', {
          operation: 'load',
          key,
          provider: providerType,
          error
        });

        if (settings.enableFailover && providers.indexOf(providerType) < providers.length - 1) {
          notifyListeners('failover', {
            from: providerType,
            to: providers[providers.indexOf(providerType) + 1],
            operation: 'load',
            key
          });
        }
      }
    }

    throw new Error(`Failed to load data from any provider. Last error: ${lastError?.message}`);
  }

  /**
   * Delete data with automatic provider selection and failover
   * @param {string} key - Storage key
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} - Success status
   */
  async function remove(key, options = {}) {
    const providers = [primaryProvider, ...fallbackProviders];
    let lastError;
    let success = false;

    for (const providerType of providers) {
      try {
        const provider = activeProviders.get(providerType);
        if (!provider) continue;

        await executeWithRetry(
          () => provider.remove(key, options),
          settings.retryAttempts
        );

        success = true;

        // Remove from cache
        if (settings.enableCaching) {
          cache.delete(key);
        }

        notifyListeners('success', {
          operation: 'remove',
          key,
          provider: providerType
        });

        break; // Success, no need to try other providers
      } catch (error) {
        lastError = error;
        notifyListeners('error', {
          operation: 'remove',
          key,
          provider: providerType,
          error
        });
      }
    }

    if (!success) {
      throw new Error(`Failed to remove data from any provider. Last error: ${lastError?.message}`);
    }

    return true;
  }

  /**
   * List items with automatic provider selection
   * @param {string} prefix - Key prefix to filter
   * @param {Object} options - List options
   * @returns {Promise<Array>} - List of items
   */
  async function list(prefix = '', options = {}) {
    const providers = [primaryProvider, ...fallbackProviders];
    let lastError;

    for (const providerType of providers) {
      try {
        const provider = activeProviders.get(providerType);
        if (!provider) continue;

        const items = await executeWithRetry(
          () => provider.list(prefix, options),
          settings.retryAttempts
        );

        notifyListeners('success', {
          operation: 'list',
          prefix,
          provider: providerType,
          items
        });

        return items;
      } catch (error) {
        lastError = error;
        notifyListeners('error', {
          operation: 'list',
          prefix,
          provider: providerType,
          error
        });
      }
    }

    throw new Error(`Failed to list items from any provider. Last error: ${lastError?.message}`);
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Function to execute
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<any>} - Function result
   */
  async function executeWithRetry(fn, maxRetries = settings.retryAttempts) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = settings.retryDelay * Math.pow(2, attempt); // Exponential backoff
          notifyListeners('retry', {
            attempt: attempt + 1,
            maxRetries,
            delay,
            error
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Cache management functions
   */
  function setCacheItem(key, data, expiry = settings.cacheExpiry) {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  function getCacheItem(key) {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiry) {
      cache.delete(key);
      return null;
    }

    return item.data;
  }

  function clearCache() {
    cache.clear();
  }

  /**
   * Event management functions
   */
  function addEventListener(event, callback) {
    if (eventListeners[event]) {
      eventListeners[event].push(callback);
    }
  }

  function removeEventListener(event, callback) {
    if (eventListeners[event]) {
      const index = eventListeners[event].indexOf(callback);
      if (index > -1) {
        eventListeners[event].splice(index, 1);
      }
    }
  }

  function notifyListeners(event, data) {
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} - Storage statistics
   */
  function getStats() {
    return {
      primaryProvider,
      fallbackProviders,
      activeProviders: Array.from(activeProviders.keys()),
      cacheSize: cache.size,
      settings: { ...settings }
    };
  }

  /**
   * Update settings
   * @param {Object} newSettings - New settings to merge
   */
  function updateSettings(newSettings) {
    Object.assign(settings, newSettings);
  }

  // Public API
  return {
    PROVIDERS,
    initialize,
    save,
    load,
    remove,
    list,
    clearCache,
    addEventListener,
    removeEventListener,
    getStats,
    updateSettings,
    // Provider initialization functions
    initializeProvider,
    // Expose provider initialization functions for direct use
    initializeLocalStorage,
    initializeCubbitStorage,
    initializeAwsS3Storage,
    initializeGoogleCloudStorage,
    initializeAzureBlobStorage,
    initializeDigitalOceanStorage,
    initializeVultrStorage,
    initializeOvhCloudStorage,
    initializeAlibabaOssStorage,
    initializeBackblazeB2Storage,
    initializeWasabiStorage,
    initializeLinodeStorage,
    initializeIpfsStorage,
    initializeStorjStorage,
    initializeArweaveStorage,
    initializeFilecoinStorage,
    initializeSiaStorage,
    initializeSwarmStorage
  };
})();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedStorage;
} else if (typeof window !== 'undefined') {
  window.UnifiedStorage = UnifiedStorage;
}
