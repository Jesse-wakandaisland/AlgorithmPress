/**
 * Web3 Storage Provider Implementations for AlgorithmPress
 * Decentralized storage solutions for the future of web applications
 */

/**
 * Initialize IPFS Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeIpfsStorage(config) {
  const { 
    gateway = 'https://ipfs.io/ipfs/',
    apiEndpoint = 'https://api.pinata.cloud',
    pinataApiKey,
    pinataSecretKey,
    useLocalNode = false,
    localNodeUrl = 'http://localhost:5001'
  } = config;

  // Use Pinata for pinning if API keys are provided
  const usePinata = pinataApiKey && pinataSecretKey;
  const baseUrl = useLocalNode ? localNodeUrl : (usePinata ? apiEndpoint : null);

  if (!baseUrl && !usePinata) {
    throw new Error('IPFS configuration requires either local node URL or Pinata API credentials');
  }

  async function pinToIPFS(data, metadata = {}) {
    if (usePinata) {
      const formData = new FormData();
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], 
        { type: 'application/json' });
      
      formData.append('file', blob, metadata.name || 'data.json');
      
      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: metadata.name || 'AlgorithmPress Data',
          keyvalues: metadata
        }));
      }

      const response = await fetch(`${apiEndpoint}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    } else {
      // Use local IPFS node
      const formData = new FormData();
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)]);
      formData.append('file', blob);

      const response = await fetch(`${baseUrl}/api/v0/add`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.Hash;
    }
  }

  async function getFromIPFS(hash) {
    const response = await fetch(`${gateway}${hash}`);
    
    if (!response.ok) {
      throw new Error(`IPFS download failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('json')) {
      const text = await response.text();
      return JSON.parse(text);
    }

    return await response.text();
  }

  return {
    save: async (key, data, options = {}) => {
      const hash = await pinToIPFS(data, { ...options.metadata, key });
      
      // Store key-to-hash mapping in localStorage for retrieval
      const mappingKey = `ipfs_mapping_${key}`;
      localStorage.setItem(mappingKey, hash);
      
      return {
        key,
        hash,
        url: `${gateway}${hash}`,
        size: typeof data === 'string' ? data.length : JSON.stringify(data).length
      };
    },

    load: async (key, options = {}) => {
      // Get hash from mapping
      const mappingKey = `ipfs_mapping_${key}`;
      const hash = localStorage.getItem(mappingKey);
      
      if (!hash) {
        return null;
      }

      return await getFromIPFS(hash);
    },

    remove: async (key, options = {}) => {
      // Remove mapping (note: IPFS content is immutable)
      const mappingKey = `ipfs_mapping_${key}`;
      localStorage.removeItem(mappingKey);
      return true;
    },

    list: async (prefix = '', options = {}) => {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`ipfs_mapping_${prefix}`)) {
          const originalKey = key.replace('ipfs_mapping_', '');
          const hash = localStorage.getItem(key);
          items.push({
            key: originalKey,
            hash,
            size: 0, // Size not easily determinable
            lastModified: new Date()
          });
        }
      }
      return items;
    }
  };
}

/**
 * Initialize Storj DCS Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeStorjStorage(config) {
  const { 
    accessGrant,
    satellite = 'us1.storj.io:7777',
    bucket,
    apiKey,
    passphrase,
    encryptionKey
  } = config;

  if (!accessGrant && (!apiKey || !passphrase)) {
    throw new Error('Storj requires either access grant or API key with passphrase');
  }

  // Storj uses S3-compatible API
  const endpoint = `https://gateway.storjshare.io`;
  
  // For browser usage, we'll use the S3-compatible gateway
  return initializeS3CompatibleStorage({
    accessKeyId: accessGrant || apiKey,
    secretAccessKey: passphrase || encryptionKey,
    bucket,
    endpoint,
    region: 'us-east-1', // Storj uses this as default
    forcePathStyle: true
  });
}

/**
 * Initialize Arweave Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeArweaveStorage(config) {
  const { 
    gateway = 'https://arweave.net',
    wallet,
    bundlrNode = 'https://node1.bundlr.network'
  } = config;

  if (!wallet) {
    throw new Error('Arweave wallet is required');
  }

  // Import Arweave wallet
  let arweaveWallet;
  try {
    arweaveWallet = typeof wallet === 'string' ? JSON.parse(wallet) : wallet;
  } catch (error) {
    throw new Error('Invalid Arweave wallet format');
  }

  async function uploadToArweave(data, tags = []) {
    // For browser usage, we'll use Bundlr for easier uploads
    const dataBuffer = new TextEncoder().encode(
      typeof data === 'string' ? data : JSON.stringify(data)
    );

    // Create transaction
    const transaction = {
      data: Array.from(dataBuffer),
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'AlgorithmPress' },
        ...tags
      ]
    };

    // This is a simplified implementation
    // In production, use the official Arweave SDK
    const response = await fetch(`${bundlrNode}/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      throw new Error(`Arweave upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  async function getFromArweave(txId) {
    const response = await fetch(`${gateway}/${txId}`);
    
    if (!response.ok) {
      throw new Error(`Arweave download failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('json')) {
      const text = await response.text();
      return JSON.parse(text);
    }

    return await response.text();
  }

  return {
    save: async (key, data, options = {}) => {
      const tags = [
        { name: 'Key', value: key },
        ...(options.tags || [])
      ];
      
      const txId = await uploadToArweave(data, tags);
      
      // Store key-to-txId mapping
      const mappingKey = `arweave_mapping_${key}`;
      localStorage.setItem(mappingKey, txId);
      
      return {
        key,
        txId,
        url: `${gateway}/${txId}`,
        size: typeof data === 'string' ? data.length : JSON.stringify(data).length
      };
    },

    load: async (key, options = {}) => {
      const mappingKey = `arweave_mapping_${key}`;
      const txId = localStorage.getItem(mappingKey);
      
      if (!txId) {
        return null;
      }

      return await getFromArweave(txId);
    },

    remove: async (key, options = {}) => {
      // Remove mapping (Arweave data is permanent)
      const mappingKey = `arweave_mapping_${key}`;
      localStorage.removeItem(mappingKey);
      return true;
    },

    list: async (prefix = '', options = {}) => {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`arweave_mapping_${prefix}`)) {
          const originalKey = key.replace('arweave_mapping_', '');
          const txId = localStorage.getItem(key);
          items.push({
            key: originalKey,
            txId,
            size: 0,
            lastModified: new Date()
          });
        }
      }
      return items;
    }
  };
}

/**
 * Initialize Filecoin Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeFilecoinStorage(config) {
  const { 
    web3StorageToken,
    lighthouseApiKey,
    provider = 'web3.storage' // or 'lighthouse'
  } = config;

  if (provider === 'web3.storage') {
    if (!web3StorageToken) {
      throw new Error('Web3.Storage token is required');
    }

    return {
      save: async (key, data, options = {}) => {
        const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], 
          { type: 'application/json' });
        
        const formData = new FormData();
        formData.append('file', blob, `${key}.json`);

        const response = await fetch('https://api.web3.storage/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${web3StorageToken}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Web3.Storage upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return {
          key,
          cid: result.cid,
          url: `https://${result.cid}.ipfs.w3s.link`,
          size: blob.size
        };
      },

      load: async (key, options = {}) => {
        // Implementation depends on how you store CID mappings
        throw new Error('Load operation requires CID mapping implementation');
      },

      remove: async (key, options = {}) => {
        // Web3.Storage doesn't support deletion
        return true;
      },

      list: async (prefix = '', options = {}) => {
        // Implementation depends on metadata storage
        return [];
      }
    };
  }

  throw new Error(`Unsupported Filecoin provider: ${provider}`);
}

/**
 * Initialize Sia Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeSiaStorage(config) {
  const { 
    apiUrl = 'http://localhost:9980',
    apiPassword,
    skynetPortal = 'https://siasky.net'
  } = config;

  // For browser usage, we'll use Skynet portal
  return {
    save: async (key, data, options = {}) => {
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], 
        { type: 'application/json' });
      
      const formData = new FormData();
      formData.append('file', blob, `${key}.json`);

      const response = await fetch(`${skynetPortal}/skynet/skyfile`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Skynet upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store key-to-skylink mapping
      const mappingKey = `sia_mapping_${key}`;
      localStorage.setItem(mappingKey, result.skylink);
      
      return {
        key,
        skylink: result.skylink,
        url: `${skynetPortal}/${result.skylink}`,
        size: blob.size
      };
    },

    load: async (key, options = {}) => {
      const mappingKey = `sia_mapping_${key}`;
      const skylink = localStorage.getItem(mappingKey);
      
      if (!skylink) {
        return null;
      }

      const response = await fetch(`${skynetPortal}/${skylink}`);
      
      if (!response.ok) {
        throw new Error(`Skynet download failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('json')) {
        const text = await response.text();
        return JSON.parse(text);
      }

      return await response.text();
    },

    remove: async (key, options = {}) => {
      const mappingKey = `sia_mapping_${key}`;
      localStorage.removeItem(mappingKey);
      return true;
    },

    list: async (prefix = '', options = {}) => {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`sia_mapping_${prefix}`)) {
          const originalKey = key.replace('sia_mapping_', '');
          const skylink = localStorage.getItem(key);
          items.push({
            key: originalKey,
            skylink,
            size: 0,
            lastModified: new Date()
          });
        }
      }
      return items;
    }
  };
}

/**
 * Initialize Swarm Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeSwarmStorage(config) {
  const { 
    gateway = 'https://gateway.ethswarm.org',
    beeApiUrl = 'http://localhost:1633'
  } = config;

  return {
    save: async (key, data, options = {}) => {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      
      const response = await fetch(`${gateway}/bytes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`Swarm upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store key-to-hash mapping
      const mappingKey = `swarm_mapping_${key}`;
      localStorage.setItem(mappingKey, result.reference);
      
      return {
        key,
        reference: result.reference,
        url: `${gateway}/bytes/${result.reference}`,
        size: payload.length
      };
    },

    load: async (key, options = {}) => {
      const mappingKey = `swarm_mapping_${key}`;
      const reference = localStorage.getItem(mappingKey);
      
      if (!reference) {
        return null;
      }

      const response = await fetch(`${gateway}/bytes/${reference}`);
      
      if (!response.ok) {
        throw new Error(`Swarm download failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('json')) {
        const text = await response.text();
        return JSON.parse(text);
      }

      return await response.text();
    },

    remove: async (key, options = {}) => {
      const mappingKey = `swarm_mapping_${key}`;
      localStorage.removeItem(mappingKey);
      return true;
    },

    list: async (prefix = '', options = {}) => {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`swarm_mapping_${prefix}`)) {
          const originalKey = key.replace('swarm_mapping_', '');
          const reference = localStorage.getItem(key);
          items.push({
            key: originalKey,
            reference,
            size: 0,
            lastModified: new Date()
          });
        }
      }
      return items;
    }
  };
}
