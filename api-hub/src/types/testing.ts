// Defines the structure for an individual test case
export interface TestCase {
  id: string;
  name: string;
  description?: string;
  // Input for the request (e.g., query params for GET, body for POST)
  // This could be more structured if needed, e.g., separate params, headers, body
  requestDetails: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // Optional, defaults to endpoint's method
    pathSuffix?: string; // Optional, appended to endpoint's base URL
    headers?: Array<{ id: string; name: string; value: string }>;
    parameters?: Array<{ id: string; name: string; value: string }>; // Query params
    body?: string; // JSON string, XML, etc.
    contentType?: string;
  };
  // Expected outcomes
  expectedStatus: number;
  expectedResponse?: { // Could be a string for exact match, or a schema for validation
    body?: any; // Could be string, object (for JSON partial match/schema)
    headers?: Array<{ id: string; name: string; value: string; checkType?: 'exact' | 'contains' | 'exists' }>;
    // Potentially add response time limits, etc.
  };
  validateExactBodyMatch?: boolean; // If true, expectedResponse.body must be an exact match
  // Could also include setup/teardown script hooks if advanced
}

// Defines the structure for a Test Suite, which groups multiple TestCases for a specific endpoint
export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  endpointId: string; // The ID of the ApiEndpoint this suite targets
  testCases: TestCase[];
  createdAt: string; // ISO date string
  lastRun?: string; // ISO date string
  // Store summary of last run, or detailed results could be linked
  lastRunResults?: {
    passed: number;
    failed: number;
    total: number;
    duration: number; // ms
    // individualTestCaseResults could be stored here too
  };
}
