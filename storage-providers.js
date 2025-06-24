/**
 * Storage Provider Implementations for AlgorithmPress
 * Comprehensive support for major cloud storage providers
 */

/**
 * Initialize Local Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeLocalStorage(config) {
  return {
    save: async (key, data, options = {}) => {
      try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(key, serializedData);
        return { key, size: serializedData.length, timestamp: Date.now() };
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          throw new Error('Local storage quota exceeded');
        }
        throw error;
      }
    },

    load: async (key, options = {}) => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        throw new Error(`Failed to parse data for key ${key}: ${error.message}`);
      }
    },

    remove: async (key, options = {}) => {
      localStorage.removeItem(key);
      return true;
    },

    list: async (prefix = '', options = {}) => {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const data = localStorage.getItem(key);
          items.push({
            key,
            size: data ? data.length : 0,
            lastModified: new Date()
          });
        }
      }
      return items;
    }
  };
}

/**
 * Initialize Cubbit Storage Provider (Enhanced)
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeCubbitStorage(config) {
  if (!config.apiKey || !config.bucketName) {
    throw new Error('Cubbit API key and bucket name are required');
  }

  // Use existing CubbitStorage if available
  if (typeof CubbitStorage !== 'undefined') {
    await CubbitStorage.initialize(config);
    return {
      save: (key, data, options = {}) => CubbitStorage.saveProject(data, key),
      load: (key, options = {}) => CubbitStorage.loadProject(key),
      remove: (key, options = {}) => CubbitStorage.deleteProject(key),
      list: (prefix = '', options = {}) => CubbitStorage.listProjects()
    };
  }

  throw new Error('CubbitStorage module not available');
}

/**
 * Initialize AWS S3 Compatible Storage Provider
 * Supports AWS S3, DigitalOcean Spaces, Vultr, OVHcloud, Alibaba OSS, Backblaze B2, Wasabi, Linode
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeS3CompatibleStorage(config) {
  const {
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    endpoint,
    forcePathStyle = false,
    signatureVersion = 'v4'
  } = config;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Access key ID, secret access key, and bucket are required');
  }

  // AWS Signature V4 implementation
  async function signRequest(method, url, headers, payload = '') {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';

    headers['x-amz-date'] = timeStamp;
    headers['x-amz-content-sha256'] = await sha256(payload);

    const canonicalRequest = createCanonicalRequest(method, url, headers, payload);
    const stringToSign = createStringToSign(timeStamp, dateStamp, region, canonicalRequest);
    const signature = await createSignature(secretAccessKey, dateStamp, region, stringToSign);

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/${region}/s3/aws4_request, SignedHeaders=${getSignedHeaders(headers)}, Signature=${signature}`;
    headers['Authorization'] = authHeader;

    return headers;
  }

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function createCanonicalRequest(method, url, headers, payload) {
    const urlObj = new URL(url);
    const canonicalUri = urlObj.pathname;
    const canonicalQueryString = urlObj.search.slice(1);

    const sortedHeaders = Object.keys(headers).sort().map(key =>
      `${key.toLowerCase()}:${headers[key].trim()}`
    ).join('\n');

    const signedHeaders = getSignedHeaders(headers);
    const payloadHash = headers['x-amz-content-sha256'];

    return `${method}\n${canonicalUri}\n${canonicalQueryString}\n${sortedHeaders}\n\n${signedHeaders}\n${payloadHash}`;
  }

  function createStringToSign(timeStamp, dateStamp, region, canonicalRequest) {
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const hashedCanonicalRequest = sha256(canonicalRequest);

    return `${algorithm}\n${timeStamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  }

  async function createSignature(secretKey, dateStamp, region, stringToSign) {
    const kDate = await hmacSha256(`AWS4${secretKey}`, dateStamp);
    const kRegion = await hmacSha256(kDate, region);
    const kService = await hmacSha256(kRegion, 's3');
    const kSigning = await hmacSha256(kService, 'aws4_request');
    const signature = await hmacSha256(kSigning, stringToSign);

    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hmacSha256(key, message) {
    const keyBuffer = typeof key === 'string' ? new TextEncoder().encode(key) : key;
    const messageBuffer = new TextEncoder().encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    return await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  }

  function getSignedHeaders(headers) {
    return Object.keys(headers).map(key => key.toLowerCase()).sort().join(';');
  }

  // Build the base URL
  const baseUrl = endpoint || `https://s3.${region}.amazonaws.com`;
  const bucketUrl = forcePathStyle ? `${baseUrl}/${bucket}` : `https://${bucket}.s3.${region}.amazonaws.com`;

  return {
    save: async (key, data, options = {}) => {
      const url = `${bucketUrl}/${encodeURIComponent(key)}`;
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      const contentType = options.contentType || 'application/json';

      const headers = {
        'Content-Type': contentType,
        'Content-Length': payload.length.toString()
      };

      // Add metadata headers
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([k, v]) => {
          headers[`x-amz-meta-${k}`] = v;
        });
      }

      const signedHeaders = await signRequest('PUT', url, headers, payload);

      const response = await fetch(url, {
        method: 'PUT',
        headers: signedHeaders,
        body: payload
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
      }

      return {
        key,
        etag: response.headers.get('ETag'),
        url,
        size: payload.length
      };
    },

    load: async (key, options = {}) => {
      const url = `${bucketUrl}/${encodeURIComponent(key)}`;
      const headers = {};

      const signedHeaders = await signRequest('GET', url, headers);

      const response = await fetch(url, {
        method: 'GET',
        headers: signedHeaders
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`S3 download failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('json')) {
        const text = await response.text();
        return JSON.parse(text);
      }

      return await response.text();
    },

    remove: async (key, options = {}) => {
      const url = `${bucketUrl}/${encodeURIComponent(key)}`;
      const headers = {};

      const signedHeaders = await signRequest('DELETE', url, headers);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: signedHeaders
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`S3 delete failed: ${response.status} ${response.statusText}`);
      }

      return true;
    },

    list: async (prefix = '', options = {}) => {
      const url = `${bucketUrl}?list-type=2&prefix=${encodeURIComponent(prefix)}`;
      const headers = {};

      const signedHeaders = await signRequest('GET', url, headers);

      const response = await fetch(url, {
        method: 'GET',
        headers: signedHeaders
      });

      if (!response.ok) {
        throw new Error(`S3 list failed: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      const items = [];
      const contents = xmlDoc.getElementsByTagName('Contents');

      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];
        const key = content.getElementsByTagName('Key')[0]?.textContent;
        const size = parseInt(content.getElementsByTagName('Size')[0]?.textContent || '0');
        const lastModified = new Date(content.getElementsByTagName('LastModified')[0]?.textContent);

        if (key) {
          items.push({ key, size, lastModified });
        }
      }

      return items;
    }
  };
}

// Provider-specific initialization functions
async function initializeAwsS3Storage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    region: config.region || 'us-east-1'
  });
}

async function initializeDigitalOceanStorage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    endpoint: `https://${config.region || 'nyc3'}.digitaloceanspaces.com`,
    forcePathStyle: false
  });
}

async function initializeVultrStorage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    endpoint: `https://${config.region || 'ewr1'}.vultrobjects.com`,
    forcePathStyle: false
  });
}

async function initializeOvhCloudStorage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    endpoint: `https://s3.${config.region || 'gra'}.cloud.ovh.net`,
    forcePathStyle: false
  });
}

async function initializeAlibabaOssStorage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    endpoint: `https://oss-${config.region || 'cn-hangzhou'}.aliyuncs.com`,
    forcePathStyle: false
  });
}

async function initializeBackblazeB2Storage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    endpoint: `https://s3.${config.region || 'us-west-000'}.backblazeb2.com`,
    forcePathStyle: false
  });
}

async function initializeWasabiStorage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    endpoint: `https://s3.${config.region || 'us-east-1'}.wasabisys.com`,
    forcePathStyle: false
  });
}

async function initializeLinodeStorage(config) {
  return initializeS3CompatibleStorage({
    ...config,
    endpoint: `https://${config.region || 'us-east-1'}.linodeobjects.com`,
    forcePathStyle: false
  });
}

/**
 * Initialize Google Cloud Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeGoogleCloudStorage(config) {
  const { projectId, keyFile, bucket } = config;

  if (!projectId || !keyFile || !bucket) {
    throw new Error('Google Cloud project ID, key file, and bucket are required');
  }

  // For browser environment, we'll use the REST API with service account key
  const serviceAccount = typeof keyFile === 'string' ? JSON.parse(keyFile) : keyFile;

  async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // Create JWT token (simplified implementation)
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payloadStr = btoa(JSON.stringify(payload));
    const signature = await signJWT(`${header}.${payloadStr}`, serviceAccount.private_key);

    const jwt = `${header}.${payloadStr}.${signature}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const tokenData = await response.json();
    return tokenData.access_token;
  }

  async function signJWT(data, privateKey) {
    // Simplified JWT signing - in production, use a proper JWT library
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(data)
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  function pemToArrayBuffer(pem) {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  return {
    save: async (key, data, options = {}) => {
      const token = await getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(key)}`;
      const payload = typeof data === 'string' ? data : JSON.stringify(data);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': options.contentType || 'application/json'
        },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`Google Cloud Storage upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        key,
        id: result.id,
        url: result.selfLink,
        size: parseInt(result.size)
      };
    },

    load: async (key, options = {}) => {
      const token = await getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(key)}?alt=media`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Google Cloud Storage download failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('json')) {
        const text = await response.text();
        return JSON.parse(text);
      }

      return await response.text();
    },

    remove: async (key, options = {}) => {
      const token = await getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(key)}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Google Cloud Storage delete failed: ${response.status} ${response.statusText}`);
      }

      return true;
    },

    list: async (prefix = '', options = {}) => {
      const token = await getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o?prefix=${encodeURIComponent(prefix)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Google Cloud Storage list failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return (result.items || []).map(item => ({
        key: item.name,
        size: parseInt(item.size),
        lastModified: new Date(item.updated)
      }));
    }
  };
}

/**
 * Initialize Azure Blob Storage Provider
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} - Provider instance
 */
async function initializeAzureBlobStorage(config) {
  const { accountName, accountKey, containerName } = config;

  if (!accountName || !accountKey || !containerName) {
    throw new Error('Azure account name, account key, and container name are required');
  }

  const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;

  async function createAuthHeader(method, url, headers = {}) {
    const urlObj = new URL(url);
    const canonicalizedResource = `/${accountName}${urlObj.pathname}${urlObj.search}`;

    const date = new Date().toUTCString();
    headers['x-ms-date'] = date;
    headers['x-ms-version'] = '2020-04-08';

    const canonicalizedHeaders = Object.keys(headers)
      .filter(key => key.startsWith('x-ms-'))
      .sort()
      .map(key => `${key}:${headers[key]}`)
      .join('\n');

    const stringToSign = [
      method,
      headers['Content-Encoding'] || '',
      headers['Content-Language'] || '',
      headers['Content-Length'] || '',
      headers['Content-MD5'] || '',
      headers['Content-Type'] || '',
      headers['Date'] || '',
      headers['If-Modified-Since'] || '',
      headers['If-Match'] || '',
      headers['If-None-Match'] || '',
      headers['If-Unmodified-Since'] || '',
      headers['Range'] || '',
      canonicalizedHeaders,
      canonicalizedResource
    ].join('\n');

    const signature = await hmacSha256(accountKey, stringToSign);
    headers['Authorization'] = `SharedKey ${accountName}:${signature}`;

    return headers;
  }

  async function hmacSha256(key, message) {
    const keyBuffer = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const messageBuffer = new TextEncoder().encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  return {
    save: async (key, data, options = {}) => {
      const url = `${baseUrl}/${encodeURIComponent(key)}`;
      const payload = typeof data === 'string' ? data : JSON.stringify(data);

      const headers = {
        'Content-Type': options.contentType || 'application/json',
        'Content-Length': payload.length.toString(),
        'x-ms-blob-type': 'BlockBlob'
      };

      const authHeaders = await createAuthHeader('PUT', url, headers);

      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: payload
      });

      if (!response.ok) {
        throw new Error(`Azure Blob Storage upload failed: ${response.status} ${response.statusText}`);
      }

      return {
        key,
        etag: response.headers.get('ETag'),
        url,
        size: payload.length
      };
    },

    load: async (key, options = {}) => {
      const url = `${baseUrl}/${encodeURIComponent(key)}`;
      const headers = await createAuthHeader('GET', url);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Azure Blob Storage download failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('json')) {
        const text = await response.text();
        return JSON.parse(text);
      }

      return await response.text();
    },

    remove: async (key, options = {}) => {
      const url = `${baseUrl}/${encodeURIComponent(key)}`;
      const headers = await createAuthHeader('DELETE', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Azure Blob Storage delete failed: ${response.status} ${response.statusText}`);
      }

      return true;
    },

    list: async (prefix = '', options = {}) => {
      const url = `${baseUrl}?restype=container&comp=list&prefix=${encodeURIComponent(prefix)}`;
      const headers = await createAuthHeader('GET', url);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Azure Blob Storage list failed: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      const items = [];
      const blobs = xmlDoc.getElementsByTagName('Blob');

      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i];
        const name = blob.getElementsByTagName('Name')[0]?.textContent;
        const size = parseInt(blob.getElementsByTagName('Content-Length')[0]?.textContent || '0');
        const lastModified = new Date(blob.getElementsByTagName('Last-Modified')[0]?.textContent);

        if (name) {
          items.push({ key: name, size, lastModified });
        }
      }

      return items;
    }
  };
}
