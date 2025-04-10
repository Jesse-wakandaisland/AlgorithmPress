/**
 * Cubbit DS3 Storage Integration
 * Enables decentralized storage for PHP-WASM Builder projects
 */

const CubbitStorage = (function() {
  'use strict';
  
  // Private variables
  let isInitialized = false;
  let apiKey = null;
  let bucketName = null;
  let baseUrl = 'https://api.cubbit.io';
  let currentUser = null;
  
  // Event listeners
  const listeners = {
    'ready': [],
    'error': [],
    'progress': []
  };
  
  /**
   * Initialize Cubbit DS3 Storage
   * @param {Object} config - Configuration options
   * @returns {Promise} - Promise that resolves when initialized
   */
  function initialize(config = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Set configuration
        apiKey = config.apiKey || apiKey;
        bucketName = config.bucketName || bucketName;
        baseUrl = config.baseUrl || baseUrl;
        
        if (!apiKey) {
          throw new Error('Cubbit API key is required');
        }
        
        if (!bucketName) {
          throw new Error('Cubbit bucket name is required');
        }
        
        // Verify credentials and bucket existence
        verifyCredentials()
          .then(() => checkBucketExists())
          .then(() => {
            isInitialized = true;
            notifyListeners('ready', { bucketName });
            resolve();
          })
          .catch(error => {
            notifyListeners('error', { error });
            reject(error);
          });
      } catch (error) {
        notifyListeners('error', { error });
        reject(error);
      }
    });
  }
  
  /**
   * Verify API credentials
   * @returns {Promise} - Promise that resolves when verified
   */
  function verifyCredentials() {
    return new Promise((resolve, reject) => {
      fetch(`${baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          currentUser = data;
          resolve(data);
        })
        .catch(error => {
          console.error('Failed to verify Cubbit credentials:', error);
          reject(error);
        });
    });
  }
  
  /**
   * Check if bucket exists, create if it doesn't
   * @returns {Promise} - Promise that resolves when bucket exists
   */
  function checkBucketExists() {
    return new Promise((resolve, reject) => {
      fetch(`${baseUrl}/s3/buckets/${bucketName}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
        .then(response => {
          if (response.ok) {
            // Bucket exists
            resolve(true);
          } else if (response.status === 404) {
            // Bucket doesn't exist, create it
            return createBucket();
          } else {
            throw new Error(`Failed to check bucket: ${response.status} ${response.statusText}`);
          }
        })
        .then(result => {
          if (result === true) {
            resolve(true);
          }
        })
        .catch(error => {
          console.error('Failed to check/create bucket:', error);
          reject(error);
        });
    });
  }
  
  /**
   * Create a new bucket
   * @returns {Promise} - Promise that resolves when bucket is created
   */
  function createBucket() {
    return new Promise((resolve, reject) => {
      fetch(`${baseUrl}/s3/buckets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: bucketName,
          acl: 'private'
        })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to create bucket: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(() => {
          console.log(`Created bucket: ${bucketName}`);
          resolve(true);
        })
        .catch(error => {
          console.error('Failed to create bucket:', error);
          reject(error);
        });
    });
  }
  
  /**
   * Save a project to Cubbit DS3
   * @param {Object} project - Project data to save
   * @param {string} projectId - Project identifier
   * @returns {Promise} - Promise that resolves when project is saved
   */
  function saveProject(project, projectId) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      try {
        // Convert project to JSON
        const projectData = JSON.stringify(project);
        
        // Upload project data
        uploadFile(`projects/${projectId}.json`, projectData, 'application/json')
          .then(result => {
            console.log(`Project saved to Cubbit: ${projectId}`);
            resolve(result);
          })
          .catch(error => {
            console.error(`Failed to save project ${projectId}:`, error);
            reject(error);
          });
      } catch (error) {
        console.error('Failed to save project:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Load a project from Cubbit DS3
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - Promise that resolves with project data
   */
  function loadProject(projectId) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      downloadFile(`projects/${projectId}.json`)
        .then(projectData => {
          try {
            const project = JSON.parse(projectData);
            resolve(project);
          } catch (error) {
            console.error(`Failed to parse project data for ${projectId}:`, error);
            reject(error);
          }
        })
        .catch(error => {
          console.error(`Failed to load project ${projectId}:`, error);
          reject(error);
        });
    });
  }
  
  /**
   * List available projects from Cubbit DS3
   * @returns {Promise<Array>} - Promise that resolves with array of project info
   */
  function listProjects() {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      // List all files in the projects directory
      listDirectory('projects/')
        .then(files => {
          // Filter for JSON files
          const projectFiles = files.filter(file => file.key.endsWith('.json'));
          
          // Load metadata for each project
          const projectPromises = projectFiles.map(file => {
            const projectId = file.key.replace('projects/', '').replace('.json', '');
            return getFileMetadata(`projects/${projectId}.json`)
              .then(metadata => ({
                id: projectId,
                name: metadata.metadata?.name || projectId,
                lastModified: new Date(metadata.lastModified),
                size: metadata.size
              }))
              .catch(error => {
                console.warn(`Failed to get metadata for project ${projectId}:`, error);
                return null;
              });
          });
          
          // Wait for all metadata to be loaded
          return Promise.all(projectPromises);
        })
        .then(projects => {
          // Filter out failed loads
          const validProjects = projects.filter(p => p !== null);
          resolve(validProjects);
        })
        .catch(error => {
          console.error('Failed to list projects:', error);
          reject(error);
        });
    });
  }
  
  /**
   * Delete a project from Cubbit DS3
   * @param {string} projectId - Project identifier
   * @returns {Promise<boolean>} - Promise that resolves with success status
   */
  function deleteProject(projectId) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      deleteFile(`projects/${projectId}.json`)
        .then(() => {
          console.log(`Project deleted from Cubbit: ${projectId}`);
          resolve(true);
        })
        .catch(error => {
          console.error(`Failed to delete project ${projectId}:`, error);
          reject(error);
        });
    });
  }
  
  /**
   * Upload a file to Cubbit DS3
   * @param {string} path - File path/key in the bucket
   * @param {string|Blob} content - File content
   * @param {string} contentType - MIME type of the content
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<Object>} - Promise that resolves with upload result
   */
  function uploadFile(path, content, contentType = 'application/octet-stream', metadata = {}) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      // Prepare the request
      const url = `${baseUrl}/s3/buckets/${bucketName}/objects/${encodeURIComponent(path)}`;
      
      // Convert content to Blob if it's a string
      const blob = typeof content === 'string' ? new Blob([content], { type: contentType }) : content;
      
      // Set up metadata headers
      const metadataHeaders = {};
      Object.entries(metadata).forEach(([key, value]) => {
        metadataHeaders[`x-amz-meta-${key}`] = value;
      });
      
      // Create XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
      xhr.setRequestHeader('Content-Type', contentType);
      
      // Add metadata headers
      Object.entries(metadataHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          notifyListeners('progress', { path, progress, loaded: event.loaded, total: event.total });
        }
      };
      
      // Handle response
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            path,
            etag: xhr.getResponseHeader('ETag'),
            url: `${baseUrl}/s3/buckets/${bucketName}/objects/${encodeURIComponent(path)}`
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };
      
      // Send the blob
      xhr.send(blob);
    });
  }
  
  /**
   * Download a file from Cubbit DS3
   * @param {string} path - File path/key in the bucket
   * @returns {Promise<string|Blob>} - Promise that resolves with file content
   */
  function downloadFile(path) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      // Prepare the request
      const url = `${baseUrl}/s3/buckets/${bucketName}/objects/${encodeURIComponent(path)}`;
      
      // Create XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
      xhr.responseType = 'blob';
      
      // Track download progress
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          notifyListeners('progress', { path, progress, loaded: event.loaded, total: event.total });
        }
      };
      
      // Handle response
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response;
          
          // Get content type
          const contentType = xhr.getResponseHeader('Content-Type');
          
          // If it's JSON or text, convert to string
          if (contentType && (contentType.includes('json') || contentType.includes('text'))) {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result);
            };
            reader.onerror = () => {
              reject(new Error('Failed to read blob as text'));
            };
            reader.readAsText(blob);
          } else {
            // Otherwise return the blob
            resolve(blob);
          }
        } else {
          reject(new Error(`Download failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during download'));
      };
      
      // Send the request
      xhr.send();
    });
  }
  
  /**
   * Get metadata for a file
   * @param {string} path - File path/key in the bucket
   * @returns {Promise<Object>} - Promise that resolves with file metadata
   */
  function getFileMetadata(path) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      // Prepare the request
      const url = `${baseUrl}/s3/buckets/${bucketName}/objects/${encodeURIComponent(path)}`;
      
      fetch(url, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to get file metadata: ${response.status} ${response.statusText}`);
          }
          
          // Extract metadata from headers
          const metadata = {};
          response.headers.forEach((value, key) => {
            if (key.startsWith('x-amz-meta-')) {
              const metaKey = key.replace('x-amz-meta-', '');
              metadata[metaKey] = value;
            }
          });
          
          resolve({
            path,
            size: parseInt(response.headers.get('Content-Length') || '0', 10),
            contentType: response.headers.get('Content-Type'),
            etag: response.headers.get('ETag'),
            lastModified: response.headers.get('Last-Modified'),
            metadata
          });
        })
        .catch(error => {
          console.error(`Failed to get metadata for ${path}:`, error);
          reject(error);
        });
    });
  }
  
  /**
   * Delete a file from Cubbit DS3
   * @param {string} path - File path/key in the bucket
   * @returns {Promise<boolean>} - Promise that resolves with success status
   */
  function deleteFile(path) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      // Prepare the request
      const url = `${baseUrl}/s3/buckets/${bucketName}/objects/${encodeURIComponent(path)}`;
      
      fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
          }
          
          resolve(true);
        })
        .catch(error => {
          console.error(`Failed to delete ${path}:`, error);
          reject(error);
        });
    });
  }
  
  /**
   * List files in a directory
   * @param {string} prefix - Directory prefix
   * @returns {Promise<Array>} - Promise that resolves with array of file info
   */
  function listDirectory(prefix = '') {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      // Prepare the request
      const url = `${baseUrl}/s3/buckets/${bucketName}/objects?prefix=${encodeURIComponent(prefix)}`;
      
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to list directory: ${response.status} ${response.statusText}`);
          }
          
          return response.json();
        })
        .then(data => {
          // Map response to simplified object
          const files = data.contents.map(item => ({
            key: item.key,
            size: item.size,
            lastModified: new Date(item.lastModified),
            etag: item.etag
          }));
          
          resolve(files);
        })
        .catch(error => {
          console.error(`Failed to list directory ${prefix}:`, error);
          reject(error);
        });
    });
  }
  
  /**
   * Generate a public URL for a file
   * @param {string} path - File path/key in the bucket
   * @param {number} expiresIn - Expiration time in seconds (default: 3600)
   * @returns {Promise<string>} - Promise that resolves with public URL
   */
  function getPublicUrl(path, expiresIn = 3600) {
    return new Promise((resolve, reject) => {
      if (!isInitialized) {
        reject(new Error('Cubbit storage is not initialized'));
        return;
      }
      
      // Prepare the request
      const url = `${baseUrl}/s3/buckets/${bucketName}/objects/${encodeURIComponent(path)}/presigned-url?expires=${expiresIn}`;
      
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to generate public URL: ${response.status} ${response.statusText}`);
          }
          
          return response.json();
        })
        .then(data => {
          resolve(data.url);
        })
        .catch(error => {
          console.error(`Failed to generate public URL for ${path}:`, error);
          reject(error);
        });
    });
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  function addEventListener(event, callback) {
    if (listeners[event]) {
      listeners[event].push(callback);
    }
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  function removeEventListener(event, callback) {
    if (listeners[event]) {
      const index = listeners[event].indexOf(callback);
      if (index !== -1) {
        listeners[event].splice(index, 1);
      }
    }
  }
  
  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  function notifyListeners(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(callback => callback(data));
    }
  }
  
  /**
   * Check if Cubbit storage is initialized
   * @returns {boolean} - Whether storage is initialized
   */
  function checkInitialized() {
    return isInitialized;
  }
  
  /**
   * Get current bucket name
   * @returns {string} - Bucket name
   */
  function getBucketName() {
    return bucketName;
  }
  
  /**
   * Get current user information
   * @returns {Object} - User information
   */
  function getCurrentUser() {
    return currentUser;
  }
  
  // Public API
  return {
    initialize,
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    uploadFile,
    downloadFile,
    getFileMetadata,
    deleteFile,
    listDirectory,
    getPublicUrl,
    addEventListener,
    removeEventListener,
    isInitialized: checkInitialized,
    getBucketName,
    getCurrentUser
  };
})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CubbitStorage;
}
