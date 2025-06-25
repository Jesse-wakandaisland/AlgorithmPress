import React, { useState } from 'react';
import { ApiEndpoint, KeyValuePair } from '../ApiManagerApp'; // Assuming ApiEndpoint is exported from ApiManagerApp

// Props for EndpointManager
export interface EndpointManagerProps {
  endpoints: ApiEndpoint[];
  onAddEndpoint: (newEndpointData: Omit<ApiEndpoint, 'id'>) => void;
  onUpdateEndpoint: (updatedEndpoint: ApiEndpoint) => void;
  onDeleteEndpoint: (id: string) => void;
  generateId: () => string; // To ensure consistent ID generation
}

// Mock UI components (to be replaced with actual shadcn/ui or similar)
// These should ideally be imported from a shared UI library or ../ui/
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }> = ({ children, ...props }) => <button {...props}>{children}</button>;
const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, ...props }) => <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props}>{children}</table>;
const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => <thead {...props}>{children}</thead>;
const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => <tbody {...props}>{children}</tbody>;
const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, ...props }) => <tr {...props}>{children}</tr>;
const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }} {...props}>{children}</th>;
const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props}>{children}</td>;
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: 'calc(100% - 18px)', boxSizing: 'border-box' }} {...props} />;
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({children, ...props}) => <select style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }} {...props}>{children}</select>;
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => <textarea style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: 'calc(100% - 18px)', minHeight: '80px', boxSizing: 'border-box' }} {...props} />;
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({children, ...props}) => <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}} {...props}>{children}</label>;

// Basic Modal Placeholder
const Dialog: React.FC<{open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode}> = ({open, children}) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      {/* Added className 'api-hub-modal-content' for NaraUI targeting */}
      <div className="api-hub-modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {children}
      </div>
    </div>
  );
};
const DialogHeader: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontSize: '1.5em', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>{children}</div>;
const DialogTitle: React.FC<{children: React.ReactNode}> = ({children}) => <h2 style={{margin:0}}>{children}</h2>;
const DialogContent: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{paddingTop: '10px'}}>{children}</div>;
const DialogFooter: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>{children}</div>;


const EMPTY_ENDPOINT_DATA_FORM: Omit<ApiEndpoint, 'id'> = {
  name: '',
  method: 'GET',
  url: '',
  version: 'v1',
  description: '',
  headers: [],
  parameters: [],
  body: '',
  contentType: 'application/json',
  auth: { type: 'none' },
  timeout: 30000,
  retryCount: 0,
  followRedirects: true,
  cacheResponse: false,
};


interface EndpointFormProps {
  endpointToEdit: ApiEndpoint | null; // null for add, ApiEndpoint for edit
  onSave: (data: ApiEndpoint | Omit<ApiEndpoint, 'id'>) => void;
  onCancel: () => void;
  generateId: () => string;
}

const EndpointForm: React.FC<EndpointFormProps> = ({ endpointToEdit, onSave, onCancel, generateId }) => {
  const [formData, setFormData] = useState<ApiEndpoint | Omit<ApiEndpoint, 'id'>>(
    endpointToEdit ? { ...endpointToEdit } : { ...EMPTY_ENDPOINT_DATA_FORM }
  );

  const isEditing = !!(formData as ApiEndpoint).id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith("auth.")) {
      const authField = name.split(".")[1];
      setFormData(prev => ({ ...prev, auth: { ...(prev.auth || {type: 'none'}), [authField]: type === 'checkbox' ? checked : value } }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({...prev, [name]: parseInt(value, 10) || 0}));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleKeyValueChange = (
    listName: 'headers' | 'parameters',
    index: number,
    field: 'name' | 'value',
    value: string
  ) => {
    setFormData(prev => {
      const list = [...prev[listName]];
      list[index] = { ...list[index], id: list[index]?.id || generateId(), [field]: value };
      return { ...prev, [listName]: list };
    });
  };

  const addKeyValueItem = (listName: 'headers' | 'parameters') => {
    setFormData(prev => ({
      ...prev,
      [listName]: [...prev[listName], { id: generateId(), name: '', value: '' }]
    }));
  };

  const removeKeyValueItem = (listName: 'headers' | 'parameters', idToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter(item => item.id !== idToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderKeyValueList = (listName: 'headers' | 'parameters', items: KeyValuePair[]) => (
    <div style={{border: '1px solid #eee', padding: '10px', borderRadius: '4px', marginTop: '10px'}}>
      <h4 style={{ marginTop: '0', marginBottom: '10px', fontSize: '1em' }}>{listName.charAt(0).toUpperCase() + listName.slice(1)}</h4>
      {items.map((item, index) => (
        <div key={item.id} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
          <Input type="text" placeholder="Name" value={item.name} onChange={(e) => handleKeyValueChange(listName, index, 'name', e.target.value)} style={{flex:1}} />
          <Input type="text" placeholder="Value" value={item.value} onChange={(e) => handleKeyValueChange(listName, index, 'value', e.target.value)} style={{flex:1}} />
          <Button type="button" onClick={() => removeKeyValueItem(listName, item.id)} style={{padding: '5px 8px', background: '#ffcccc', border: '1px solid #ffaaaa', cursor: 'pointer'}}>X</Button>
        </div>
      ))}
      <Button type="button" onClick={() => addKeyValueItem(listName)} style={{padding: '5px 10px', marginTop: '5px', border: '1px solid #ccc', cursor: 'pointer'}}>Add {listName === 'headers' ? 'Header' : 'Parameter'}</Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Endpoint' : 'Add New Endpoint'}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div><Label htmlFor="name">Name:</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
        <div>
          <Label htmlFor="method">Method:</Label>
          <Select id="method" name="method" value={formData.method} onChange={handleChange}>
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="url">URL:</Label><Input id="url" name="url" type="url" value={formData.url} onChange={handleChange} required /></div>
        <div><Label htmlFor="version">Version:</Label><Input id="version" name="version" value={formData.version} onChange={handleChange} /></div>
        <div><Label htmlFor="description">Description:</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} /></div>

        {renderKeyValueList('headers', formData.headers)}
        {renderKeyValueList('parameters', formData.parameters)}

        <div>
          <Label htmlFor="contentType">Body Content Type:</Label>
          <Select id="contentType" name="contentType" value={formData.contentType} onChange={handleChange}>
            {['application/json', 'application/xml', 'text/plain', 'application/x-www-form-urlencoded'].map(ct => <option key={ct} value={ct}>{ct}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="body">Request Body:</Label><Textarea id="body" name="body" value={formData.body} onChange={handleChange} placeholder='e.g., {"key": "value"}' /></div>

        <div>
          <Label htmlFor="auth.type">Auth Type:</Label>
          <Select id="auth.type" name="auth.type" value={formData.auth.type} onChange={handleChange}>
            {['none', 'basic', 'bearer', 'api-key'].map(at => <option key={at} value={at}>{at.charAt(0).toUpperCase() + at.slice(1)}</option>)}
          </Select>
        </div>

        {formData.auth.type === 'basic' && (
          <>
            <div><Label htmlFor="auth.username">Username:</Label><Input id="auth.username" name="auth.username" value={formData.auth.username || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="auth.password">Password:</Label><Input id="auth.password" name="auth.password" type="password" value={formData.auth.password || ''} onChange={handleChange} /></div>
          </>
        )}
        {formData.auth.type === 'bearer' && (
          <div><Label htmlFor="auth.token">Bearer Token:</Label><Input id="auth.token" name="auth.token" value={formData.auth.token || ''} onChange={handleChange} /></div>
        )}
        {formData.auth.type === 'api-key' && (
          <>
            <div><Label htmlFor="auth.keyName">API Key Name (Header/Query):</Label><Input id="auth.keyName" name="auth.keyName" value={formData.auth.keyName || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="auth.keyValue">API Key Value:</Label><Input id="auth.keyValue" name="auth.keyValue" type="password" value={formData.auth.keyValue || ''} onChange={handleChange} /></div>
            <div>
              <Label htmlFor="auth.addTo">Add To:</Label>
              <Select id="auth.addTo" name="auth.addTo" value={formData.auth.addTo || 'header'} onChange={handleChange}>
                <option value="header">Header</option>
                <option value="query">Query Parameter</option>
              </Select>
            </div>
          </>
        )}

        <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '1.1em', borderTop: '1px solid #eee', paddingTop: '15px' }}>Advanced Options</h4>
        <div><Label htmlFor="timeout">Timeout (ms):</Label><Input id="timeout" name="timeout" type="number" value={formData.timeout} onChange={handleChange} /></div>
        <div><Label htmlFor="retryCount">Retry Count:</Label><Input id="retryCount" name="retryCount" type="number" value={formData.retryCount} onChange={handleChange} /></div>
        <div style={{display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px'}}><Input id="followRedirects" name="followRedirects" type="checkbox" checked={formData.followRedirects} onChange={handleChange} style={{width: 'auto'}} /><Label htmlFor="followRedirects" style={{marginBottom:0, fontWeight:'normal'}}>Follow Redirects</Label></div>
        <div style={{display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px'}}><Input id="cacheResponse" name="cacheResponse" type="checkbox" checked={formData.cacheResponse} onChange={handleChange} style={{width: 'auto'}} /><Label htmlFor="cacheResponse" style={{marginBottom:0, fontWeight:'normal'}}>Cache Response</Label></div>
      </DialogContent>
      <DialogFooter>
        <Button type="button" onClick={onCancel} variant="outline" style={{cursor: 'pointer', padding: '8px 15px', border: '1px solid #ccc'}}>Cancel</Button>
        <Button type="submit" style={{background: '#ccffcc', cursor: 'pointer', padding: '8px 15px', border: '1px solid #aaffaa'}}>Save Endpoint</Button>
      </DialogFooter>
    </form>
  );
};


const EndpointManager: React.FC<EndpointManagerProps> = ({
  endpoints,
  onAddEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  generateId,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ApiEndpoint | null>(null);

  // State for Test Console
  const [isTestConsoleOpen, setIsTestConsoleOpen] = useState(false);
  const [endpointToTest, setEndpointToTest] = useState<ApiEndpoint | null>(null);
  // TestRequest can be partial as user might not fill everything or it's a GET request
  const [testRequest, setTestRequest] = useState<Partial<Pick<ApiEndpoint, 'url' | 'method' | 'headers' | 'parameters' | 'body' | 'contentType'>>>({});
  const [testResponse, setTestResponse] = useState<{status: number; statusText: string; headers: Record<string,string>; body: any; duration: number} | null>(null);
  const [isTesting, setIsTesting] = useState(false);


  const handleOpenAddForm = () => {
    setEditingEndpoint(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (endpoint: ApiEndpoint) => {
    setEditingEndpoint(endpoint);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEndpoint(null);
  };

  const handleSaveEndpoint = (data: ApiEndpoint | Omit<ApiEndpoint, 'id'>) => {
    if ((data as ApiEndpoint).id) {
      onUpdateEndpoint(data as ApiEndpoint);
    } else {
      onAddEndpoint(data as Omit<ApiEndpoint, 'id'>);
    }
    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      onDeleteEndpoint(id);
    }
  };

  const handleOpenTestConsole = (endpoint: ApiEndpoint) => {
    setEndpointToTest(endpoint);
    // Pre-fill testRequest with endpoint data, creating deep copies for mutable parts like headers/params
    setTestRequest({
      url: endpoint.url,
      method: endpoint.method,
      headers: JSON.parse(JSON.stringify(endpoint.headers || [])),
      parameters: JSON.parse(JSON.stringify(endpoint.parameters || [])),
      body: endpoint.body,
      contentType: endpoint.contentType,
    });
    setTestResponse(null); // Clear previous response
    setIsTesting(false);
    setIsTestConsoleOpen(true);
  };

  const handleCloseTestConsole = () => {
    setIsTestConsoleOpen(false);
    setEndpointToTest(null);
  };

  const handleSendTestRequest = async () => {
    if (!endpointToTest || !testRequest.url || !testRequest.method) return;
    setIsTesting(true);
    setTestResponse(null);

    let url = testRequest.url;
    const { method, headers = [], parameters = [], body, contentType } = testRequest;

    // Construct query string for GET requests if params exist
    if (method === 'GET' && parameters.length > 0) {
      const query = new URLSearchParams();
      parameters.forEach(p => { if (p.name) query.append(p.name, p.value); });
      url = `${url}?${query.toString()}`;
    }

    const requestHeaders: Record<string, string> = {};
    headers.forEach(h => { if (h.name) requestHeaders[h.name] = h.value; });
    if (method !== 'GET' && method !== 'DELETE' && body) { // Only add Content-Type if there's a body and not GET/DELETE
        requestHeaders['Content-Type'] = contentType || 'application/json';
    }


    const fetchOptions: RequestInit = {
      method: method,
      headers: requestHeaders,
    };

    if (method !== 'GET' && method !== 'DELETE' && body !== undefined && body !== null) {
        fetchOptions.body = body;
    }


    const startTime = performance.now();
    try {
      const response = await fetch(url, fetchOptions);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });

      let responseBodyContent: any;
      const resContentType = response.headers.get('content-type');
      if (resContentType && resContentType.includes('application/json')) {
        try {
            responseBodyContent = await response.json();
        } catch (jsonError) {
            console.warn("Failed to parse JSON response, falling back to text:", jsonError)
            // If JSON parsing fails, try to get text (response might be malformed JSON or not JSON at all)
            responseBodyContent = await response.text(); // This needs a new response.text() call as body is consumed
            // To re-read, one would typically clone the response *before* the first .json() or .text() attempt.
            // For simplicity here, if .json() fails, we might lose the body or need to re-fetch/handle.
            // A better approach is to get as text first, then try to parse.
            // Let's adjust:
            const textBody = await response.text(); // Get text first
            try {
                responseBodyContent = JSON.parse(textBody);
            } catch (parseError) {
                responseBodyContent = textBody; // Fallback to text if JSON.parse fails
            }
        }
      } else {
        responseBodyContent = await response.text();
      }

      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeadersObj,
        body: responseBodyContent,
        duration,
      });

    } catch (error: any) {
      const endTime = performance.now();
      setTestResponse({
        status: 0, // Indicate fetch error
        statusText: 'Fetch Error',
        headers: {},
        body: error.message || 'Failed to fetch. Check network or CORS.',
        duration: Math.round(endTime - startTime),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Sub-component for Test Console
  const TestConsole: React.FC = () => {
    if (!isTestConsoleOpen || !endpointToTest) return null;

    const handleTestRequestChange = (
        field: keyof typeof testRequest,
        value: any
    ) => {
      setTestRequest(prev => ({ ...prev, [field]: value }));
    };

    const handleTestKeyValueChange = (
      listName: 'headers' | 'parameters',
      index: number,
      field: 'name' | 'value',
      value: string
    ) => {
      setTestRequest(prev => {
        const currentList = prev[listName] || []; // Ensure list exists
        const list = [...currentList]; // Create a mutable copy
        list[index] = { ...list[index], id: list[index]?.id || generateId(), [field]: value };
        return { ...prev, [listName]: list };
      });
    };

    const addTestKeyValueItem = (listName: 'headers' | 'parameters') => {
      setTestRequest(prev => ({
        ...prev,
        [listName]: [...(prev[listName] || []), { id: generateId(), name: '', value: '' }]
      }));
    };

    const removeTestKeyValueItem = (listName: 'headers' | 'parameters', idToRemove: string) => {
      setTestRequest(prev => ({
        ...prev,
        [listName]: (prev[listName] || []).filter(item => item.id !== idToRemove)
      }));
    };

    const renderTestKeyValueList = (listName: 'headers' | 'parameters', items: KeyValuePair[] = []) => (
      <div style={{border: '1px solid #eee', padding: '10px', borderRadius: '4px', marginTop: '10px'}}>
        <h5 style={{ marginTop: '0', marginBottom: '10px', fontSize: '0.9em' }}>{listName.charAt(0).toUpperCase() + listName.slice(1)}</h5>
        {items.map((item, index) => (
          <div key={item.id} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
            <Input type="text" placeholder="Name" value={item.name} onChange={(e) => handleTestKeyValueChange(listName, index, 'name', e.target.value)} style={{flex:1, fontSize: '0.9em', padding: '5px'}} />
            <Input type="text" placeholder="Value" value={item.value} onChange={(e) => handleTestKeyValueChange(listName, index, 'value', e.target.value)} style={{flex:1, fontSize: '0.9em', padding: '5px'}} />
            <Button type="button" onClick={() => removeTestKeyValueItem(listName, item.id)} style={{padding: '3px 6px', background: '#ffcccc', border: '1px solid #ffaaaa', cursor: 'pointer', fontSize: '0.8em'}}>X</Button>
          </div>
        ))}
        <Button type="button" onClick={() => addTestKeyValueItem(listName)} style={{padding: '5px 10px', marginTop: '5px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '0.9em'}}>Add</Button>
      </div>
    );

    return (
      <Dialog open={isTestConsoleOpen} onOpenChange={setIsTestConsoleOpen}>
        <DialogHeader>
          <DialogTitle>Test Endpoint: {endpointToTest.name}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div><Label htmlFor="test_url">URL:</Label><Input id="test_url" name="url" value={testRequest.url || ''} onChange={(e) => handleTestRequestChange('url', e.target.value)} /></div>
            <div>
              <Label htmlFor="test_method">Method:</Label>
              <Select id="test_method" name="method" value={testRequest.method || 'GET'} onChange={(e) => handleTestRequestChange('method', e.target.value as ApiEndpoint['method'])}>
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>

            {renderTestKeyValueList('headers', testRequest.headers || [])}
            {renderTestKeyValueList('parameters', testRequest.parameters || [])}

            <div>
              <Label htmlFor="test_contentType">Body Content Type:</Label>
              <Select id="test_contentType" name="contentType" value={testRequest.contentType || 'application/json'} onChange={(e) => handleTestRequestChange('contentType', e.target.value)}>
                {['application/json', 'application/xml', 'text/plain', 'application/x-www-form-urlencoded'].map(ct => <option key={ct} value={ct}>{ct}</option>)}
              </Select>
            </div>
            <div><Label htmlFor="test_body">Request Body:</Label><Textarea id="test_body" name="body" value={testRequest.body || ''} onChange={(e) => handleTestRequestChange('body', e.target.value)} placeholder='Test request body (if applicable)' /></div>

            {testResponse && (
              <div style={{marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '4px', background: '#f9f9f9'}}>
                <h4 style={{marginTop:0}}>Response (Status: <span style={{color: testResponse.status >= 200 && testResponse.status < 300 ? 'green' : 'red'}}>{testResponse.status} {testResponse.statusText}</span>)</h4>
                <p style={{fontSize: '0.8em', color: '#555'}}>Duration: {testResponse.duration}ms</p>
                <div>
                  <h5 style={{fontSize: '0.9em'}}>Headers:</h5>
                  <pre style={{fontSize: '0.8em', background: '#eee', padding: '5px', borderRadius: '3px', maxHeight: '100px', overflowY: 'auto'}}>{JSON.stringify(testResponse.headers, null, 2)}</pre>
                </div>
                <div>
                  <h5 style={{fontSize: '0.9em', marginTop: '10px'}}>Body:</h5>
                  <pre style={{fontSize: '0.8em', background: '#eee', padding: '5px', borderRadius: '3px', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                    {typeof testResponse.body === 'object' ? JSON.stringify(testResponse.body, null, 2) : String(testResponse.body)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" onClick={handleCloseTestConsole} variant="outline" style={{cursor: 'pointer', padding: '8px 15px', border: '1px solid #ccc'}}>Close</Button>
          <Button type="button" onClick={handleSendTestRequest} disabled={isTesting} style={{background: '#ccffcc', cursor: 'pointer', padding: '8px 15px', border: '1px solid #aaffaa'}}>
            {isTesting ? 'Sending...' : 'Send Test Request'}
          </Button>
        </DialogFooter>
      </Dialog>
    );
  };


  return (
    <div style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Manage API Endpoints</h2>
        <Button onClick={handleOpenAddForm} style={{ padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', background: '#e0e0e0' }}>
          Add New Endpoint
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          {/* Removed DialogContent wrapper here as EndpointForm now includes DialogHeader/Content/Footer */}
          <EndpointForm
            endpointToEdit={editingEndpoint}
            onSave={handleSaveEndpoint}
            onCancel={handleCloseForm}
            generateId={generateId}
          />
      </Dialog>

      <TestConsole /> {/* Render the TestConsole modal */}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} style={{ textAlign: 'center' }}>
                No endpoints configured yet.
              </TableCell>
            </TableRow>
          )}
          {endpoints.map((ep) => (
            <TableRow key={ep.id}>
              <TableCell>{ep.name}</TableCell>
              <TableCell>{ep.method}</TableCell>
              <TableCell style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.url}</TableCell>
              <TableCell>{ep.version}</TableCell>
              <TableCell>
                <Button onClick={() => handleOpenEditForm(ep)} style={{ marginRight: '5px', cursor: 'pointer', padding: '5px 10px', border: '1px solid #ccc' }}>Edit</Button>
                <Button onClick={() => handleOpenTestConsole(ep)} style={{ marginRight: '5px', cursor: 'pointer', padding: '5px 10px', border: '1px solid #ccc', background: '#e6ffe6' }}>Test</Button>
                <Button onClick={() => handleDelete(ep.id)} variant="destructive" style={{ cursor: 'pointer', background: '#ffdddd', color: 'darkred', padding: '5px 10px', border: '1px solid #ffaaaa' }}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EndpointManager;
