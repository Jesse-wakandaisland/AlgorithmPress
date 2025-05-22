/**
 * Unit tests for CubbitStorage.js
 *
 * How to Set Up Jest:
 * 1. Install Jest:
 *    npm install --save-dev jest
 *    or
 *    yarn add --dev jest
 *
 * 2. Configure Jest:
 *    In `package.json`:
 *    {
 *      "scripts": {
 *        "test": "jest"
 *      },
 *      "jest": {
 *        "testEnvironment": "jsdom",
 *        "setupFilesAfterEnv": ["./jest.setup.js"], // For global mocks
 *        "resetMocks": true
 *      }
 *    }
 *    Create `jest.setup.js` for global mocks (e.g., for window.AP):
 *    // jest.setup.js
 *    global.AP = {
 *      handleError: jest.fn(),
 *      showToast: jest.fn(),
 *    };
 *
 * How to Run Tests:
 *   npm test js/cubbit-storage-integration.test.js
 *   or
 *   yarn test js/cubbit-storage-integration.test.js
 */

// Global mocks (alternative to jest.setup.js, but setup file is cleaner)
if (typeof global.AP === 'undefined') {
  global.AP = {
    handleError: jest.fn(),
    showToast: jest.fn(),
  };
}

describe('CubbitStorage', () => {
  let CubbitStorage;
  let mockFetch;
  let mockXHR;
  let mockUpload;

  const mockApiKey = 'test-api-key';
  const mockBucketName = 'test-bucket';
  const mockBaseUrl = 'https://api.cubbit.io';

  beforeEach(() => {
    jest.resetModules(); // Reset modules to get a fresh CubbitStorage instance
    CubbitStorage = require('./cubbit-storage-integration');

    // Clear mocks
    global.AP.handleError.mockClear();
    global.AP.showToast.mockClear();

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock XMLHttpRequest
    mockUpload = {
      onprogress: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockXHR = {
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn(),
      getResponseHeader: jest.fn(),
      upload: mockUpload,
      onprogress: null, // for download progress
      onload: null,
      onerror: null,
      status: 200,
      statusText: 'OK',
      response: new Blob(['default response data']),
      readyState: 4,
    };
    global.XMLHttpRequest = jest.fn(() => mockXHR);
    global.Blob = jest.fn(content => ({ content, type: 'application/octet-stream' })); // Basic Blob mock
    global.FileReader = jest.fn(() => ({
        readAsText: jest.fn(function(blob) { this.onload({ target: { result: blob.content.join('') }}); }),
        onerror: null,
        onload: null,
    }));
  });

  afterEach(() => {
    delete global.fetch;
    delete global.XMLHttpRequest;
    delete global.Blob;
    delete global.FileReader;
  });

  describe('Initialization', () => {
    it('should initialize successfully if API key and bucket are valid', async () => {
      mockFetch
        .mockResolvedValueOnce({ // verifyCredentials
          ok: true,
          json: () => Promise.resolve({ user: 'test-user' }),
        })
        .mockResolvedValueOnce({ // checkBucketExists (HEAD)
          ok: true,
        });

      await expect(CubbitStorage.initialize({ apiKey: mockApiKey, bucketName: mockBucketName })).resolves.toBeUndefined();
      expect(CubbitStorage.isInitialized()).toBe(true);
      expect(CubbitStorage.getBucketName()).toBe(mockBucketName);
      expect(global.AP.handleError).not.toHaveBeenCalled();
    });

    it('should create bucket if it does not exist during initialization', async () => {
      mockFetch
        .mockResolvedValueOnce({ // verifyCredentials
          ok: true,
          json: () => Promise.resolve({ user: 'test-user' }),
        })
        .mockResolvedValueOnce({ // checkBucketExists (HEAD) - 404 Not Found
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({ // createBucket (POST)
          ok: true,
          json: () => Promise.resolve({ message: 'Bucket created' }),
        });

      await CubbitStorage.initialize({ apiKey: mockApiKey, bucketName: mockBucketName });
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/s3/buckets`, expect.objectContaining({ method: 'POST' }));
      expect(CubbitStorage.isInitialized()).toBe(true);
    });
    
    it('should reject initialization if API key is missing', async () => {
      await expect(CubbitStorage.initialize({ bucketName: mockBucketName })).rejects.toThrow('Cubbit API key is required');
      expect(global.AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Cubbit Initialization Error');
    });

    it('should reject initialization if bucket name is missing', async () => {
      await expect(CubbitStorage.initialize({ apiKey: mockApiKey })).rejects.toThrow('Cubbit bucket name is required');
      expect(global.AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Cubbit Initialization Error');
    });

    it('should reject initialization if verifyCredentials fails', async () => {
      mockFetch.mockResolvedValueOnce({ // verifyCredentials
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });
      await expect(CubbitStorage.initialize({ apiKey: mockApiKey, bucketName: mockBucketName })).rejects.toThrow('Authentication failed: 401 Unauthorized');
      expect(global.AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to verify Cubbit credentials');
    });

    it('should reject initialization if checkBucketExists fails (not 404)', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // verifyCredentials
        .mockResolvedValueOnce({ // checkBucketExists (HEAD)
          ok: false,
          status: 500,
          statusText: 'Server Error',
        });
      await expect(CubbitStorage.initialize({ apiKey: mockApiKey, bucketName: mockBucketName })).rejects.toThrow('Failed to check bucket: 500 Server Error');
      expect(global.AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to check/create Cubbit bucket');
    });
  });

  describe('File Operations (after initialization)', () => {
    beforeEach(async () => {
      // Simulate successful initialization
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: 'test-user' }) })
        .mockResolvedValueOnce({ ok: true });
      await CubbitStorage.initialize({ apiKey: mockApiKey, bucketName: mockBucketName });
      mockFetch.mockClear(); // Clear init calls for subsequent tests
      global.AP.handleError.mockClear();
    });

    it('should upload a file successfully', async () => {
      const filePath = 'test/file.txt';
      const content = 'Hello Cubbit';
      
      const uploadPromise = CubbitStorage.uploadFile(filePath, content, 'text/plain');
      // Simulate XHR events
      if (mockXHR.onload) mockXHR.onload();

      await expect(uploadPromise).resolves.toEqual(expect.objectContaining({ path: filePath }));
      expect(mockXHR.open).toHaveBeenCalledWith('PUT', `${mockBaseUrl}/s3/buckets/${mockBucketName}/objects/${encodeURIComponent(filePath)}`, true);
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Authorization', `Bearer ${mockApiKey}`);
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockXHR.send).toHaveBeenCalledWith(expect.any(Object)); // Blob
    });
    
    it('should trigger progress event during upload', (done) => {
        const filePath = 'test/file.txt';
        const content = 'Large content';
        const progressCallback = jest.fn();
        CubbitStorage.addEventListener('progress', progressCallback);

        CubbitStorage.uploadFile(filePath, content).catch(() => {}); // We don't care about resolve/reject here

        // Simulate progress event
        const progressEvent = { lengthComputable: true, loaded: 50, total: 100 };
        if (mockXHR.upload && mockXHR.upload.onprogress) {
            mockXHR.upload.onprogress(progressEvent);
        }
        
        expect(progressCallback).toHaveBeenCalledWith({ path: filePath, progress: 50, loaded: 50, total: 100 });
        done();
    });

    it('should download a text file successfully', async () => {
      const filePath = 'test/file.txt';
      const fileContent = 'File content from Cubbit';
      mockXHR.response = new Blob([fileContent]); // Simulate Blob response
      mockXHR.getResponseHeader = jest.fn(header => header === 'Content-Type' ? 'text/plain' : null);

      const downloadPromise = CubbitStorage.downloadFile(filePath);
      if (mockXHR.onload) mockXHR.onload(); // Trigger onload for XHR

      await expect(downloadPromise).resolves.toBe(fileContent);
      expect(mockXHR.open).toHaveBeenCalledWith('GET', expect.stringContaining(filePath), true);
    });
    
    it('should download a blob file successfully', async () => {
        const filePath = 'test/image.png';
        const blobContent = new Blob(['image data'], { type: 'image/png' });
        mockXHR.response = blobContent;
        mockXHR.getResponseHeader = jest.fn(header => header === 'Content-Type' ? 'image/png' : null);

        const downloadPromise = CubbitStorage.downloadFile(filePath);
        if (mockXHR.onload) mockXHR.onload();

        const result = await downloadPromise;
        expect(result).toBe(blobContent);
    });

    it('should handle upload failure', async () => {
      mockXHR.status = 500;
      mockXHR.statusText = 'Server Error';
      
      const uploadPromise = CubbitStorage.uploadFile('fail.txt', 'data');
      if (mockXHR.onload) mockXHR.onload(); // Trigger onload which will now reject due to status

      await expect(uploadPromise).rejects.toThrow('Upload failed: 500 Server Error');
      expect(global.AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Cubbit upload for fail.txt failed');
    });

    it('should handle download failure', async () => {
      mockXHR.status = 404;
      mockXHR.statusText = 'Not Found';
      
      const downloadPromise = CubbitStorage.downloadFile('notfound.txt');
      if (mockXHR.onload) mockXHR.onload();

      await expect(downloadPromise).rejects.toThrow('Download failed: 404 Not Found');
      expect(global.AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Cubbit download for notfound.txt failed');
    });
    
    it('should get file metadata', async () => {
        const path = 'info.txt';
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Map([
                ['Content-Length', '123'],
                ['Content-Type', 'text/plain'],
                ['ETag', '"abc"'],
                ['Last-Modified', 'Wed, 21 Oct 2015 07:28:00 GMT'],
                ['x-amz-meta-custom', 'value']
            ])
        });
        const metadata = await CubbitStorage.getFileMetadata(path);
        expect(metadata).toEqual({
            path,
            size: 123,
            contentType: 'text/plain',
            etag: '"abc"',
            lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
            metadata: { custom: 'value' }
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(path), expect.objectContaining({ method: 'HEAD' }));
    });

    it('should delete a file', async () => {
        const path = 'delete_me.txt';
        mockFetch.mockResolvedValueOnce({ ok: true });
        await expect(CubbitStorage.deleteFile(path)).resolves.toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(path), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should list files in a directory', async () => {
        const prefix = 'my_folder/';
        const mockResponse = { contents: [{ key: 'file1.txt', size: 10, lastModified: new Date().toISOString(), etag: '"1"' }] };
        mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponse) });
        
        const files = await CubbitStorage.listDirectory(prefix);
        expect(files.length).toBe(1);
        expect(files[0].key).toBe('file1.txt');
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(`prefix=${encodeURIComponent(prefix)}`), expect.objectContaining({ method: 'GET' }));
    });

    it('should get a public URL', async () => {
        const path = 'public.txt';
        const mockUrl = 'https://presigned.url/public.txt';
        mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ url: mockUrl }) });

        const url = await CubbitStorage.getPublicUrl(path);
        expect(url).toBe(mockUrl);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(`${path}/presigned-url?expires=3600`), expect.objectContaining({ method: 'GET' }));
    });
  });

  describe('Project Operations (after initialization)', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: 'test-user' }) })
        .mockResolvedValueOnce({ ok: true });
      await CubbitStorage.initialize({ apiKey: mockApiKey, bucketName: mockBucketName });
      mockFetch.mockClear(); // Clear init calls
      global.AP.handleError.mockClear();
      global.AP.showToast.mockClear();
    });

    it('should save a project', async () => {
      const project = { id: 'proj1', name: 'My Project', data: 'test' };
      const projectId = 'proj1';
      // Mock XHR for uploadFile call within saveProject
      global.XMLHttpRequest = jest.fn(() => {
          setTimeout(() => mockXHR.onload && mockXHR.onload(), 0); // Simulate async success
          return mockXHR;
      });

      await expect(CubbitStorage.saveProject(project, projectId)).resolves.toEqual(expect.objectContaining({ path: `projects/${projectId}.json` }));
      expect(mockXHR.send).toHaveBeenCalledWith(expect.objectContaining({ content: [JSON.stringify(project)] }));
    });

    it('should load a project', async () => {
      const projectId = 'proj1';
      const projectData = { id: 'proj1', name: 'Loaded Project' };
      // Mock XHR for downloadFile call
      mockXHR.response = new Blob([JSON.stringify(projectData)]);
      mockXHR.getResponseHeader = jest.fn().mockReturnValue('application/json');
      global.XMLHttpRequest = jest.fn(() => {
          setTimeout(() => mockXHR.onload && mockXHR.onload(), 0);
          return mockXHR;
      });
      
      const project = await CubbitStorage.loadProject(projectId);
      expect(project).toEqual(projectData);
    });
    
    it('should fail to load project if JSON parsing fails', async () => {
        const projectId = 'proj_bad_json';
        mockXHR.response = new Blob(['invalid json']);
        mockXHR.getResponseHeader = jest.fn().mockReturnValue('application/json');
        global.XMLHttpRequest = jest.fn(() => {
            setTimeout(() => mockXHR.onload && mockXHR.onload(), 0);
            return mockXHR;
        });

        await expect(CubbitStorage.loadProject(projectId)).rejects.toThrow(expect.any(Error)); // Error from JSON.parse
        expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), `Failed to parse project data for ${projectId}`);
    });

    it('should list projects', async () => {
      const listResponse = { contents: [
        { key: 'projects/proj1.json', size: 100, lastModified: new Date().toISOString() }
      ]};
      const metadataResponse = { 
        headers: new Map([['Content-Length', '100'], ['x-amz-meta-name', 'Project One']]) 
      };
      Object.defineProperty(metadataResponse, 'ok', { value: true }); // Make it behave like a Response object

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(listResponse) }) // listDirectory
        .mockResolvedValueOnce(metadataResponse); // getFileMetadata

      const projects = await CubbitStorage.listProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].id).toBe('proj1');
      expect(projects[0].name).toBe('Project One');
    });

    it('should delete a project', async () => {
      const projectId = 'delete_proj1';
      mockFetch.mockResolvedValueOnce({ ok: true }); // deleteFile
      await CubbitStorage.deleteProject(projectId);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(`projects/${projectId}.json`), expect.objectContaining({ method: 'DELETE' }));
      expect(AP.showToast).toHaveBeenCalledWith(`Project ${projectId} deleted successfully from Cubbit.`, 'success');
    });
  });
  
  describe('Operations when not initialized', () => {
    const operations = [
        { name: 'saveProject', args: [{}, 'id'] },
        { name: 'loadProject', args: ['id'] },
        { name: 'listProjects', args: [] },
        { name: 'deleteProject', args: ['id'] },
        { name: 'uploadFile', args: ['path', 'content'] },
        { name: 'downloadFile', args: ['path'] },
        { name: 'getFileMetadata', args: ['path'] },
        { name: 'deleteFile', args: ['path'] },
        { name: 'listDirectory', args: ['path'] },
        { name: 'getPublicUrl', args: ['path'] },
    ];

    operations.forEach(op => {
        it(`should reject ${op.name} if not initialized`, async () => {
            // CubbitStorage is fresh here due to beforeEach in parent describe
            await expect(CubbitStorage[op.name](...op.args)).rejects.toThrow('Cubbit storage is not initialized');
            // Check if AP.handleError was called with the "not initialized" error and a context
            expect(AP.handleError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Cubbit storage is not initialized' }),
                expect.stringContaining(op.name.replace(/([A-Z])/g, ' $1').trim()) // e.g. "Save Project Error"
            );
        });
    });
  });

  describe('Event Handling', () => {
    it('should add and notify event listeners', () => {
      const readyCallback = jest.fn();
      CubbitStorage.addEventListener('ready', readyCallback);

      // Simulate initialization success path to trigger 'ready'
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true });
      
      return CubbitStorage.initialize({ apiKey: mockApiKey, bucketName: mockBucketName }).then(() => {
        expect(readyCallback).toHaveBeenCalledWith({ bucketName: mockBucketName });
      });
    });
  });
});
