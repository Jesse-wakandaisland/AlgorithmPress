import React from 'react';
import ReactDOM from 'react-dom/client'; // Using client for React 18+
import ApiManagerApp from './ApiManagerApp';

// This is the ID of the div in AlgorithmPress.html where the React app will be mounted.
const APP_ROOT_ELEMENT_ID = 'api-hub-root';

const rootElement = document.getElementById(APP_ROOT_ELEMENT_ID);

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ApiManagerApp />
    </React.StrictMode>
  );
  console.log('[api-hub/index.tsx] React API Manager app mounted successfully.');
} else {
  console.error(
    `[api-hub/index.tsx] Error: Could not find root element with ID '${APP_ROOT_ELEMENT_ID}'. ` +
    'The API Hub React application will not be mounted. ' +
    'Ensure a <div id=\"api-hub-root\"></div> exists in AlgorithmPress.html.'
  );
}

// If you have a global CSS file for the api-hub (e.g., processed from Tailwind)
// you might import it here, though typically it's better handled by the bundler
// and linked in the main HTML or inlined.
// For example: import './styles/globals.css';
// This will be handled by the api-hub.min.css placeholder for now.

// This script (after bundling into api-hub.min.js) will be included in AlgorithmPress.html.
// It assumes React and ReactDOM are available (either bundled with it or loaded separately).
// The build process defined in Step 2 of the plan will be responsible for creating
// api-hub.min.js from this and other .tsx files.
