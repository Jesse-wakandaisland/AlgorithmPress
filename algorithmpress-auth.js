/**
 * Complete Authentication System Implementation
 * 
 * This adds a comprehensive user authentication system that works alongside
 * the existing GitHub authentication system, providing a unified auth experience.
 */

// Authentication System IIFE
const AevovAuth = (() => {
  'use strict';
  
  // Authentication state
  let authState = {
    isAuthenticated: false,
    user: null,
    token: null,
    expiresAt: 0,
    provider: null, // 'local', 'github', 'google', etc.
    scopes: []
  };
  
  // Create event system if AevovCore is not available
  const events = typeof AevovCore !== 'undefined' ? 
                 AevovCore.createEventBus() : 
                 createSimpleEventBus();
  
  /**
   * Simple event bus implementation if AevovCore is not available
   * @return {Object} Event bus methods
   */
  function createSimpleEventBus() {
    const events = {};
    
    return {
      on: (event, callback) => {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
        return () => {
          events[event] = events[event].filter(cb => cb !== callback);
        };
      },
      emit: (event, data) => {
        if (events[event]) {
          events[event].forEach(callback => callback(data));
        }
      }
    };
  }
  
  /**
   * Initialize the auth system
   */
  const init = () => {
    console.log('Initializing Aevov authentication system...');
    
    // Try to load saved auth state
    loadAuthState();
    
    // Listen for GitHub auth events if GitHub integration is available
    if (typeof AevovGitHub !== 'undefined') {
      AevovGitHub.events.on('github:auth:success', (data) => {
        handleGitHubAuth(data);
      });
      
      AevovGitHub.events.on('github:logout', () => {
        // Only logout if GitHub was the provider
        if (authState.provider === 'github') {
          logout();
        }
      });
    }
    
    // Dispatch initialized event
    document.dispatchEvent(new CustomEvent('aevov:auth-initialized'));
    
    return true;
  };
  
  /**
   * Load auth state from storage
   */
  const loadAuthState = () => {
    try {
      const savedAuth = localStorage.getItem('aevov_auth_state');
      
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        
        // Check if token is expired
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          authState = parsed;
          
          // Emit auth loaded event
          events.emit('auth:loaded', {
            user: authState.user,
            provider: authState.provider
          });
        } else {
          // Clear expired auth
          localStorage.removeItem('aevov_auth_state');
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  };
  
  /**
   * Save auth state to storage
   */
  const saveAuthState = () => {
    try {
      localStorage.setItem('aevov_auth_state', JSON.stringify(authState));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };
  
  /**
   * Handle GitHub authentication
   * @param {Object} data - GitHub auth data
   */
  const handleGitHubAuth = (data) => {
    // Update auth state with GitHub data
    authState = {
      isAuthenticated: true,
      user: data.user,
      token: data.token,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      provider: 'github',
      scopes: data.scopes || []
    };
    
    // Save auth state
    saveAuthState();
    
    // Emit auth success event
    events.emit('auth:success', {
      user: authState.user,
      provider: 'github'
    });
  };
  
  /**
   * Authenticate with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @return {Promise<Object>} Auth result
   */
  const loginWithEmail = async (email, password) => {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // In a real implementation, this would make an API request
      // Here, we'll simulate a successful login
      
      events.emit('auth:login:started');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check credentials (in production, this would be server-side)
      if (email === 'demo@aevov.io' && password === 'demo123') {
        // Set auth state
        authState = {
          isAuthenticated: true,
          user: {
            id: 'user_1',
            email,
            name: 'Demo User',
            avatarUrl: null
          },
          token: 'simulated_jwt_token',
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          provider: 'local',
          scopes: ['read', 'write']
        };
        
        // Save auth state
        saveAuthState();
        
        // Emit auth success event
        events.emit('auth:success', {
          user: authState.user,
          provider: 'local'
        });
        
        return {
          success: true,
          user: authState.user
        };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      // Emit auth error event
      events.emit('auth:error', { error: error.message });
      
      throw error;
    }
  };
  
  /**
   * Sign up with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User name
   * @return {Promise<Object>} Signup result
   */
  const signupWithEmail = async (email, password, name) => {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // In a real implementation, this would make an API request
      // Here, we'll simulate a successful signup
      
      events.emit('auth:signup:started');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Set auth state with new user
      authState = {
        isAuthenticated: true,
        user: {
          id: `user_${Date.now().toString(36)}`,
          email,
          name: name || email.split('@')[0],
          avatarUrl: null
        },
        token: 'simulated_jwt_token',
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        provider: 'local',
        scopes: ['read', 'write']
      };
      
      // Save auth state
      saveAuthState();
      
      // Emit auth success event
      events.emit('auth:success', {
        user: authState.user,
        provider: 'local'
      });
      
      return {
        success: true,
        user: authState.user
      };
    } catch (error) {
      // Emit auth error event
      events.emit('auth:error', { error: error.message });
      
      throw error;
    }
  };
  
  /**
   * Login with GitHub (delegates to AevovGitHub)
   */
  const loginWithGitHub = () => {
    if (typeof AevovGitHub === 'undefined') {
      throw new Error('GitHub integration not available');
    }
    
    AevovGitHub.login();
  };
  
  /**
   * Logout the current user
   */
  const logout = () => {
    // Clear auth state
    authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      expiresAt: 0,
      provider: null,
      scopes: []
    };
    
    // Remove from storage
    localStorage.removeItem('aevov_auth_state');
    
    // Emit logout event
    events.emit('auth:logout');
  };
  
  /**
   * Check if user is authenticated
   * @return {boolean} Authentication status
   */
  const isAuthenticated = () => {
    return authState.isAuthenticated && authState.expiresAt > Date.now();
  };
  
  /**
   * Get current user
   * @return {Object|null} Current user or null if not authenticated
   */
  const getCurrentUser = () => {
    if (!isAuthenticated()) {
      return null;
    }
    
    return authState.user;
  };
  
  /**
   * Get auth token
   * @return {string|null} Auth token or null if not authenticated
   */
  const getToken = () => {
    if (!isAuthenticated()) {
      return null;
    }
    
    return authState.token;
  };
  
  /**
   * Check if a specific scope is available
   * @param {string} scope - Scope to check
   * @return {boolean} True if scope is available
   */
  const hasScope = (scope) => {
    if (!isAuthenticated() || !authState.scopes) {
      return false;
    }
    
    return authState.scopes.includes(scope);
  };
  
  /**
   * Create an authentication UI
   * @param {string} containerId - Container element ID
   * @param {Object} options - UI options
   */
  const createAuthUI = (containerId, options = {}) => {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Auth UI container not found: ${containerId}`);
      return;
    }
    
    // Create UI elements
    const authUI = document.createElement('div');
    authUI.className = 'aevov-auth-ui';
    
    // Update UI based on auth state
    const updateUI = () => {
      if (isAuthenticated()) {
        // Logged in state
        authUI.innerHTML = `
          <div class="auth-user-info">
            <div class="user-avatar">
              ${authState.user.avatarUrl ? `<img src="${authState.user.avatarUrl}" alt="Avatar">` : 
                `<div class="avatar-placeholder">${authState.user.name.charAt(0)}</div>`}
            </div>
            <div class="user-details">
              <div class="user-name">${authState.user.name}</div>
              <div class="user-email">${authState.user.email}</div>
              <div class="auth-provider">via ${authState.provider}</div>
            </div>
            <button class="logout-button">Logout</button>
          </div>
        `;
        
        // Add logout handler
        const logoutButton = authUI.querySelector('.logout-button');
        logoutButton.addEventListener('click', logout);
      } else {
        // Logged out state
        authUI.innerHTML = `
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login">Login</button>
            <button class="auth-tab" data-tab="signup">Sign Up</button>
          </div>
          
          <div class="auth-form login-form active">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" class="auth-input">
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" class="auth-input">
            </div>
            <div class="auth-error login-error"></div>
            <button class="auth-button login-button">Login</button>
            
            <div class="auth-divider">or</div>
            
            <button class="github-auth-button">
              <span class="github-icon">GitHub</span>
              Login with GitHub
            </button>
          </div>
          
          <div class="auth-form signup-form">
            <div class="form-group">
              <label for="signup-name">Name</label>
              <input type="text" id="signup-name" class="auth-input">
            </div>
            <div class="form-group">
              <label for="signup-email">Email</label>
              <input type="email" id="signup-email" class="auth-input">
            </div>
            <div class="form-group">
              <label for="signup-password">Password</label>
              <input type="password" id="signup-password" class="auth-input">
            </div>
            <div class="auth-error signup-error"></div>
            <button class="auth-button signup-button">Sign Up</button>
          </div>
        `;
        
        // Add tab switching
        const tabs = authUI.querySelectorAll('.auth-tab');
        const forms = authUI.querySelectorAll('.auth-form');
        
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update forms
            forms.forEach(form => form.classList.remove('active'));
            authUI.querySelector(`.${tabName}-form`).classList.add('active');
          });
        });
        
        // Add login handler
        const loginButton = authUI.querySelector('.login-button');
        const loginError = authUI.querySelector('.login-error');
        
        loginButton.addEventListener('click', async () => {
          const email = authUI.querySelector('#login-email').value;
          const password = authUI.querySelector('#login-password').value;
          
          try {
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
            loginError.textContent = '';
            
            await loginWithEmail(email, password);
            
            // UI will be updated by the event listener
          } catch (error) {
            loginError.textContent = error.message;
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
          }
        });
        
        // Add signup handler
        const signupButton = authUI.querySelector('.signup-button');
        const signupError = authUI.querySelector('.signup-error');
        
        signupButton.addEventListener('click', async () => {
          const name = authUI.querySelector('#signup-name').value;
          const email = authUI.querySelector('#signup-email').value;
          const password = authUI.querySelector('#signup-password').value;
          
          try {
            signupButton.disabled = true;
            signupButton.textContent = 'Signing up...';
            signupError.textContent = '';
            
            await signupWithEmail(email, password, name);
            
            // UI will be updated by the event listener
          } catch (error) {
            signupError.textContent = error.message;
            signupButton.disabled = false;
            signupButton.textContent = 'Sign Up';
          }
        });
        
        // Add GitHub login handler
        const githubButton = authUI.querySelector('.github-auth-button');
        
        githubButton.addEventListener('click', () => {
          try {
            loginWithGitHub();
          } catch (error) {
            loginError.textContent = error.message;
          }
        });
      }
    };
    
    // Update UI initially
    updateUI();
    
    // Listen for auth events to update UI
    events.on('auth:success', updateUI);
    events.on('auth:logout', updateUI);
    
    // Add to container
    container.innerHTML = '';
    container.appendChild(authUI);
    
    // Add basic styles if not provided externally
    if (!document.getElementById('aevov-auth-styles')) {
      const styles = document.createElement('style');
      styles.id = 'aevov-auth-styles';
      styles.textContent = `
        .aevov-auth-ui {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 8px;
          background: var(--colors-background, #fff);
          box-shadow: var(--shadows-md, 0 4px 6px rgba(0, 0, 0, 0.1));
        }
        
        .auth-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--colors-border, #e0e0e0);
        }
        
        .auth-tab {
          flex: 1;
          padding: 10px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          opacity: 0.7;
        }
        
        .auth-tab.active {
          opacity: 1;
          border-bottom: 2px solid var(--colors-primary, #0042DA);
        }
        
        .auth-form {
          display: none;
        }
        
        .auth-form.active {
          display: block;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .auth-input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--colors-border, #e0e0e0);
          border-radius: 4px;
          font-size: 14px;
        }
        
        .auth-button {
          width: 100%;
          padding: 10px;
          background: var(--colors-primary, #0042DA);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }
        
        .auth-divider {
          margin: 20px 0;
          text-align: center;
          position: relative;
        }
        
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: var(--colors-border, #e0e0e0);
        }
        
        .auth-divider::before {
          left: 0;
        }
        
        .auth-divider::after {
          right: 0;
        }
        
        .github-auth-button {
          width: 100%;
          padding: 10px;
          background: #24292e;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .github-icon {
          margin-right: 10px;
        }
        
        .auth-error {
          color: var(--colors-error, #f44336);
          font-size: 14px;
          margin-bottom: 10px;
          min-height: 20px;
        }
        
        .auth-user-info {
          display: flex;
          align-items: center;
        }
        
        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          margin-right: 15px;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: var(--colors-primary, #0042DA);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .user-details {
          flex: 1;
        }
        
        .user-name {
          font-weight: bold;
          font-size: 16px;
        }
        
        .user-email {
          font-size: 14px;
          opacity: 0.8;
        }
        
        .auth-provider {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 5px;
        }
        
        .logout-button {
          padding: 8px 12px;
          background: none;
          border: 1px solid var(--colors-border, #e0e0e0);
          border-radius: 4px;
          cursor: pointer;
        }
      `;
      document.head.appendChild(styles);
    }
  };
  
  // Public API
  return {
    init,
    loginWithEmail,
    signupWithEmail,
    loginWithGitHub,
    logout,
    isAuthenticated,
    getCurrentUser,
    getToken,
    hasScope,
    createAuthUI,
    events
  };
})();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    AevovAuth.init();
    console.log('AevovAuth initialized successfully');
    
    // Dispatch initialized event
    document.dispatchEvent(new CustomEvent('aevov:auth-loaded'));
  } catch (error) {
    console.error('AevovAuth initialization failed:', error);
  }
});