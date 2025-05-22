/**
 * Unit tests for PublishingSystem.js
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
 *        "testEnvironment": "jsdom", // Or node, if no browser APIs are used directly
 *        "setupFilesAfterEnv": ["./jest.setup.js"], // For global mocks
 *        "resetMocks": true
 *      }
 *    }
 *    Create `jest.setup.js` for global mocks (e.g., for window.AP and localStorage):
 *    // jest.setup.js
 *    global.AP = {
 *      handleError: jest.fn(),
 *      showToast: jest.fn(),
 *    };
 *    const localStorageMock = (function() {
 *      let store = {};
 *      return {
 *        getItem: function(key) { return store[key] || null; },
 *        setItem: function(key, value) { store[key] = value.toString(); },
 *        removeItem: function(key) { delete store[key]; },
 *        clear: function() { store = {}; }
 *      };
 *    })();
 *    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
 *
 * How to Run Tests:
 *   npm test js/publishing-system.test.js
 *   or
 *   yarn test js/publishing-system.test.js
 */

// Global mocks (alternative to jest.setup.js)
if (typeof global.AP === 'undefined') {
  global.AP = { handleError: jest.fn(), showToast: jest.fn() };
}
if (typeof global.localStorage === 'undefined') {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: jest.fn(key => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; })
    };
  })();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
}

describe('PublishingSystem', () => {
  let PublishingSystem;

  const site1Data = { id: 'site1', name: 'Test Site 1', url: 'http://site1.test' };
  const site2Data = { id: 'site2', name: 'Test Site 2', url: 'http://site2.test' };
  
  const postContentType = {
      id: 'post',
      name: 'Post',
      fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richtext' },
          { name: 'author', type: 'text', defaultValue: 'Admin' }
      ]
  };
  const pageContentType = {
      id: 'page',
      name: 'Page',
      fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'body', type: 'markdown' }
      ]
  };
  const categoryTaxonomy = {
      id: 'category',
      name: 'Category',
      appliesTo: ['post']
  };


  beforeEach(() => {
    jest.resetModules();
    PublishingSystem = require('./publishing-system'); // Assuming it's exported

    // Clear global mocks and localStorage
    global.AP.handleError.mockClear();
    global.AP.showToast.mockClear();
    global.localStorage.clear(); // Clears the store in our mock
    jest.clearAllMocks(); // Resets jest.fn() calls etc.

    // Initialize the system for each test.
    // This will set up a default site or load from (mocked) localStorage.
    PublishingSystem.initialize(); 
  });

  describe('Initialization', () => {
    it('should initialize with a default site if no data in localStorage', () => {
      expect(PublishingSystem.getCurrentSite()).toBeDefined();
      expect(PublishingSystem.getCurrentSite().name).toBe('Default Site'); // Assuming this is the default
      expect(localStorage.getItem).toHaveBeenCalledWith('publishingSystemData');
    });

    it('should load data from localStorage if present', () => {
      const mockData = {
        sites: { [site1Data.id]: site1Data },
        currentSiteId: site1Data.id,
        siteData: {
          [site1Data.id]: {
            contentTypes: {},
            taxonomies: {},
            items: {}
          }
        }
      };
      localStorage.setItem('publishingSystemData', JSON.stringify(mockData));
      
      jest.resetModules(); // Force re-require to pick up new localStorage state before init
      PublishingSystem = require('./publishing-system');
      PublishingSystem.initialize();

      expect(PublishingSystem.getCurrentSite().id).toBe(site1Data.id);
      expect(PublishingSystem.getAllSites().length).toBe(1);
    });
    
    it('should handle corrupted JSON in localStorage gracefully', () => {
        localStorage.setItem('publishingSystemData', 'invalid json');
        console.error = jest.fn(); // Suppress console error for this test

        // Initialize should not throw but fall back to default or handle error
        expect(() => PublishingSystem.initialize()).not.toThrow();
        expect(PublishingSystem.getCurrentSite()).toBeDefined(); // Should have a default site
        expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), "Failed to load data from localStorage");
        console.error.mockRestore();
    });
  });

  describe('Site Management', () => {
    it('should create a new site and switch to it', () => {
      const newSite = PublishingSystem.createSite('New Site Alpha', 'http://alpha.test');
      expect(newSite).toBeDefined();
      expect(newSite.name).toBe('New Site Alpha');
      expect(PublishingSystem.getCurrentSite().id).toBe(newSite.id);
      expect(PublishingSystem.getAllSites().length).toBe(2); // Default + New Site Alpha
      expect(localStorage.setItem).toHaveBeenCalledWith('publishingSystemData', expect.stringContaining(newSite.id));
    });

    it('should switch between sites', () => {
      PublishingSystem.createSite(site1Data.name, site1Data.url, site1Data.id); // Create site1
      const site2 = PublishingSystem.createSite(site2Data.name, site2Data.url, site2Data.id); // Create site2, now current
      
      expect(PublishingSystem.getCurrentSite().id).toBe(site2.id);
      PublishingSystem.switchSite(site1Data.id);
      expect(PublishingSystem.getCurrentSite().id).toBe(site1Data.id);
    });
    
    it('should not switch to a non-existent site', () => {
        const currentSiteId = PublishingSystem.getCurrentSite().id;
        PublishingSystem.switchSite('non-existent-site-id');
        expect(PublishingSystem.getCurrentSite().id).toBe(currentSiteId); // Should remain unchanged
        expect(AP.showToast).toHaveBeenCalledWith("Site 'non-existent-site-id' not found.", "error");
    });

    it('should delete a site', () => {
      const siteToDelete = PublishingSystem.createSite('ToDelete', 'http://delete.test');
      PublishingSystem.createSite('AnotherSite', 'http://another.test'); // Create another to switch to
      
      const siteIdToDelete = siteToDelete.id;
      PublishingSystem.deleteSite(siteIdToDelete);
      
      expect(PublishingSystem.getAllSites().find(s => s.id === siteIdToDelete)).toBeUndefined();
      expect(localStorage.setItem).toHaveBeenCalledWith('publishingSystemData', expect.not.stringContaining(siteIdToDelete));
      // Ensure current site is valid after deletion
      expect(PublishingSystem.getCurrentSite()).toBeDefined(); 
      expect(PublishingSystem.getCurrentSite().id).not.toBe(siteIdToDelete);
    });

    it('should handle deleting the last site (recreates default)', () => {
        const defaultSite = PublishingSystem.getCurrentSite();
        PublishingSystem.deleteSite(defaultSite.id);
        
        expect(PublishingSystem.getAllSites().length).toBe(1); // A new default site should be created
        expect(PublishingSystem.getCurrentSite()).toBeDefined();
        expect(PublishingSystem.getCurrentSite().name).toBe('Default Site'); // Or whatever default is
    });
  });

  describe('Content Type Management', () => {
    it('should register a new content type for the current site', () => {
      PublishingSystem.registerContentType(postContentType);
      const retrieved = PublishingSystem.getContentType('post');
      expect(retrieved).toEqual(postContentType);
      expect(PublishingSystem.getAllContentTypes().length).toBe(1);
    });

    it('should not register a content type with a duplicate ID', () => {
      PublishingSystem.registerContentType(postContentType);
      console.warn = jest.fn();
      PublishingSystem.registerContentType(postContentType); // Try again
      expect(console.warn).toHaveBeenCalledWith("Content type 'post' already exists.");
      expect(PublishingSystem.getAllContentTypes().length).toBe(1);
      console.warn.mockRestore();
    });
    
    it('should return undefined for a non-existent content type', () => {
        expect(PublishingSystem.getContentType('non-existent-type')).toBeUndefined();
    });
  });

  describe('Taxonomy Management', () => {
    it('should register a new taxonomy for the current site', () => {
      PublishingSystem.registerTaxonomy(categoryTaxonomy);
      const retrieved = PublishingSystem.getTaxonomy('category');
      expect(retrieved).toEqual(categoryTaxonomy);
      expect(PublishingSystem.getAllTaxonomies().length).toBe(1);
    });

    it('should add and retrieve terms for a taxonomy', () => {
      PublishingSystem.registerTaxonomy(categoryTaxonomy);
      PublishingSystem.addTerm('category', 'Tech');
      PublishingSystem.addTerm('category', 'News');
      
      const terms = PublishingSystem.getTerms('category');
      expect(terms).toEqual([{id: 'tech', name: 'Tech'}, {id: 'news', name: 'News'}]); // IDs are slugified
    });
    
    it('should remove a term from a taxonomy', () => {
        PublishingSystem.registerTaxonomy(categoryTaxonomy);
        PublishingSystem.addTerm('category', 'Tech');
        PublishingSystem.addTerm('category', 'News');
        PublishingSystem.removeTerm('category', 'tech'); // Use ID
        
        const terms = PublishingSystem.getTerms('category');
        expect(terms).toEqual([{id: 'news', name: 'News'}]);
    });

    it('should not add a duplicate term (by name/slug)', () => {
        PublishingSystem.registerTaxonomy(categoryTaxonomy);
        PublishingSystem.addTerm('category', 'Tech');
        PublishingSystem.addTerm('category', 'Tech'); // Add again
        expect(PublishingSystem.getTerms('category').length).toBe(1);
    });
  });

  describe('Content Item Management', () => {
    beforeEach(() => {
      // Ensure content types are registered for these tests
      PublishingSystem.registerContentType(postContentType);
      PublishingSystem.registerContentType(pageContentType);
      PublishingSystem.registerTaxonomy(categoryTaxonomy);
    });

    it('should create a content item with default values', () => {
      const newItem = PublishingSystem.createContentItem('post', { title: 'My First Post' });
      expect(newItem).toBeDefined();
      expect(newItem.id).toBeDefined();
      expect(newItem.contentTypeId).toBe('post');
      expect(newItem.title).toBe('My First Post');
      expect(newItem.author).toBe('Admin'); // Default value from content type
      expect(newItem.createdAt).toBeDefined();
      expect(newItem.updatedAt).toBeDefined();
    });
    
    it('should fail to create item if content type does not exist', () => {
        const item = PublishingSystem.createContentItem('nonExistentType', { title: 'Test' });
        expect(item).toBeNull();
        expect(AP.showToast).toHaveBeenCalledWith("Content type 'nonExistentType' not found.", "error");
    });

    it('should save and retrieve a content item', () => {
      const itemData = { title: 'Saving Test', content: 'Some content here' };
      const newItem = PublishingSystem.createContentItem('post', itemData);
      PublishingSystem.saveContentItem(newItem);
      
      const retrievedItem = PublishingSystem.getContentItem('post', newItem.id);
      expect(retrievedItem).toEqual(newItem); // Should include all fields, id, timestamps
      expect(retrievedItem.title).toBe('Saving Test');
    });

    it('should update an existing content item', () => {
      const newItem = PublishingSystem.createContentItem('post', { title: 'Original Title' });
      PublishingSystem.saveContentItem(newItem);
      
      const updatedItemData = { ...newItem, title: 'Updated Title', status: 'published' };
      PublishingSystem.saveContentItem(updatedItemData);
      
      const retrievedItem = PublishingSystem.getContentItem('post', newItem.id);
      expect(retrievedItem.title).toBe('Updated Title');
      expect(retrievedItem.status).toBe('published');
      expect(retrievedItem.updatedAt).not.toBe(newItem.createdAt);
    });

    it('should delete a content item', () => {
      const newItem = PublishingSystem.createContentItem('post', { title: 'To Delete' });
      PublishingSystem.saveContentItem(newItem);
      
      PublishingSystem.deleteContentItem('post', newItem.id);
      const retrievedItem = PublishingSystem.getContentItem('post', newItem.id);
      expect(retrievedItem).toBeNull();
    });

    it('should get all content items of a specific type', () => {
      PublishingSystem.saveContentItem(PublishingSystem.createContentItem('post', { title: 'Post 1' }));
      PublishingSystem.saveContentItem(PublishingSystem.createContentItem('post', { title: 'Post 2' }));
      PublishingSystem.saveContentItem(PublishingSystem.createContentItem('page', { title: 'Page 1' })); // Different type
      
      const posts = PublishingSystem.getAllContentItems('post');
      expect(posts.length).toBe(2);
      const pages = PublishingSystem.getAllContentItems('page');
      expect(pages.length).toBe(1);
    });
    
    it('should assign and retrieve taxonomy terms for a content item', () => {
        PublishingSystem.addTerm('category', 'Tech');
        PublishingSystem.addTerm('category', 'Tutorials');

        const item = PublishingSystem.createContentItem('post', { title: 'Taxonomy Test' });
        item.taxonomies = { category: ['tech', 'tutorials'] }; // Assign by term IDs
        PublishingSystem.saveContentItem(item);

        const retrieved = PublishingSystem.getContentItem('post', item.id);
        expect(retrieved.taxonomies.category).toEqual(['tech', 'tutorials']);
    });
  });

  describe('Data Persistence & Integrity', () => {
    it('should persist all data to localStorage on changes', () => {
      PublishingSystem.createSite('Site Alpha', 'http://alpha.com');
      PublishingSystem.registerContentType(postContentType);
      const item = PublishingSystem.createContentItem('post', { title: 'Persistent Post' });
      PublishingSystem.saveContentItem(item);

      // Check if localStorage.setItem was called after these operations
      // The exact number of calls can be brittle, so check if it was called with relevant data
      expect(localStorage.setItem).toHaveBeenCalledWith('publishingSystemData', 
        expect.stringContaining('Site Alpha'));
      expect(localStorage.setItem).toHaveBeenCalledWith('publishingSystemData', 
        expect.stringContaining(postContentType.id));
      expect(localStorage.setItem).toHaveBeenCalledWith('publishingSystemData', 
        expect.stringContaining('Persistent Post'));
    });

    it('should load persisted data correctly on re-initialization', () => {
      // Step 1: Create data and let it be "saved"
      const site = PublishingSystem.createSite('Site Beta', 'http://beta.com');
      PublishingSystem.registerContentType(pageContentType);
      const pageItem = PublishingSystem.createContentItem('page', { title: 'Beta Page' });
      PublishingSystem.saveContentItem(pageItem);
      
      // Capture the data that would have been saved
      const savedDataString = localStorage.setItem.mock.calls.pop()[1]; // Get last call's data

      // Step 2: Reset and re-initialize with this data
      jest.resetModules();
      global.localStorage.clear(); // Clear the store
      global.localStorage.setItem('publishingSystemData', savedDataString); // Prime localStorage for next init

      const NewPublishingSystem = require('./publishing-system');
      NewPublishingSystem.initialize();
      
      expect(NewPublishingSystem.getCurrentSite().name).toBe('Site Beta');
      expect(NewPublishingSystem.getContentType('page')).toEqual(pageContentType);
      const items = NewPublishingSystem.getAllContentItems('page');
      expect(items.length).toBe(1);
      expect(items[0].title).toBe('Beta Page');
    });
  });
});
