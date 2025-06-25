import React, { useState, useEffect } from 'react';
import { ApiEndpoint, TestSuite, TestCase } from '../ApiManagerApp'; // Assuming these are exported from ApiManagerApp

// Props for TestManager
export interface TestManagerProps {
  endpoints: ApiEndpoint[]; // For selecting target endpoint for a suite
  testSuites: TestSuite[];
  onAddTestSuite: (newTestSuiteData: Omit<TestSuite, 'id' | 'testCases'> & { testCases?: Omit<TestCase, 'id'>[] }) => TestSuite; // Return created suite with ID
  onUpdateTestSuite: (updatedTestSuite: TestSuite) => void;
  onDeleteTestSuite: (id: string) => void;
  generateId: () => string;
}

// Mock UI components (to be replaced with actual shadcn/ui or similar)
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


const EMPTY_TEST_SUITE_DATA_FORM: Omit<TestSuite, 'id' | 'testCases'> = {
  name: '',
  description: '',
  // endpointId will be part of the form data, but not directly on TestSuite type yet
};

interface TestSuiteFormProps {
  suiteToEdit: TestSuite | null;
  endpoints: ApiEndpoint[];
  onSave: (data: TestSuite | Omit<TestSuite, 'id'>) => void;
  onCancel: () => void;
  generateId: () => string;
}

const TestSuiteForm: React.FC<TestSuiteFormProps> = ({ suiteToEdit, endpoints, onSave, onCancel, generateId }) => {
  const [formData, setFormData] = useState<Partial<TestSuite> & { selectedEndpointId?: string }>(
    suiteToEdit
      ? { ...suiteToEdit, selectedEndpointId: suiteToEdit.testCases?.[0]?.endpointId || '' } // Assuming all test cases in a suite target the same endpoint for now
      : { ...EMPTY_TEST_SUITE_DATA_FORM, testCases: [], selectedEndpointId: endpoints[0]?.id || '' }
  );

  const isEditing = !!formData.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enhanced TestCase management
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [editingTestCaseIndex, setEditingTestCaseIndex] = useState<number | null>(null);

  const handleOpenTestCaseForm = (testCase: TestCase | null, index?: number) => {
    setEditingTestCase(testCase ? {...testCase} : { // Create new or copy existing
      id: generateId('tc_'),
      name: `Test Case ${(formData.testCases?.length || 0) + 1}`,
      description: '',
      endpointId: formData.selectedEndpointId || '',
      expectedStatusCode: 200,
      requestOverrides: { headers: [], body: '' },
      expectedBodyContains: '',
      expectedHeaders: [],
    });
    setEditingTestCaseIndex(index === undefined ? null : index); // null for new, index for edit
  };

  const handleCloseTestCaseForm = () => {
    setEditingTestCase(null);
    setEditingTestCaseIndex(null);
  };

  const handleSaveTestCase = (testCaseData: TestCase) => {
    setFormData(prev => {
      const newTestCases = [...(prev.testCases || [])];
      if (editingTestCaseIndex !== null) { // Editing existing
        newTestCases[editingTestCaseIndex] = testCaseData;
      } else { // Adding new
        newTestCases.push(testCaseData);
      }
      return { ...prev, testCases: newTestCases };
    });
    handleCloseTestCaseForm();
  };

  const handleRemoveTestCase = (testCaseId: string) => {
    setFormData(prev => ({
        ...prev,
        testCases: (prev.testCases || []).filter(tc => tc.id !== testCaseId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For simplicity, if we add test cases, ensure they all point to the selectedEndpointId
    // A more robust solution might allow different endpoints per test case or group them by endpoint.
    const finalTestCases = (formData.testCases || []).map(tc => ({
        ...tc,
        endpointId: formData.selectedEndpointId || tc.endpointId // Prioritize form's selected endpoint
    }));

    const saveData: TestSuite | Omit<TestSuite, 'id'> = {
      ...(isEditing ? { id: formData.id! } : {}),
      name: formData.name || 'Untitled Suite',
      description: formData.description || '',
      testCases: finalTestCases,
    };
    onSave(saveData);
  };

  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Test Suite' : 'Add New Test Suite'}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div><Label htmlFor="name">Suite Name:</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required /></div>
        <div><Label htmlFor="description">Description:</Label><Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} /></div>
        <div>
          <Label htmlFor="selectedEndpointId">Target Endpoint:</Label>
          <Select
            id="selectedEndpointId"
            name="selectedEndpointId"
            value={formData.selectedEndpointId || ''}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select an endpoint</option>
            {endpoints.map(ep => (
              <option key={ep.id} value={ep.id}>{ep.name} ({ep.method} {ep.url})</option>
            ))}
          </Select>
        </div>

        <div style={{border: '1px solid #eee', padding: '10px', borderRadius: '4px', marginTop: '15px'}}>
            <h4 style={{marginTop:0, marginBottom:'10px'}}>Test Cases ({formData.testCases?.length || 0})</h4>
            {(formData.testCases || []).map((tc, index) => (
                <div key={tc.id} style={{borderBottom: '1px dashed #eee', paddingBottom:'10px', marginBottom:'10px', display: 'flex', justifyContent: 'space-between', alignItems:'flex-start'}}>
                    <div>
                        <p style={{margin:0, fontWeight:'bold'}}>{tc.name}</p>
                        <p style={{margin:'2px 0', fontSize:'0.9em', color:'#555'}}>{tc.description}</p>
                        <small>Endpoint: {endpoints.find(ep => ep.id === tc.endpointId)?.name || 'N/A'} | Expected Status: {tc.expectedStatusCode}</small><br/>
                        <small>Expected Body Contains: "{tc.expectedBodyContains || 'N/A'}"</small><br/>
                        <small>Overrides: H({tc.requestOverrides?.headers?.length || 0}) B({tc.requestOverrides?.body ? 'Y': 'N'}) | Expected Headers: {tc.expectedHeaders?.length || 0}</small>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap: '5px', alignItems:'flex-end'}}>
                        <Button type="button" onClick={() => handleOpenTestCaseForm(tc, index)} style={{fontSize:'0.8em', padding:'3px 8px', background:'#eef', border:'1px solid #ccd'}}>Edit</Button>
                        <Button type="button" onClick={() => handleRemoveTestCase(tc.id)} style={{fontSize:'0.8em', padding:'3px 8px', background:'#ffefef', border:'1px solid #ffcccc'}}>Remove</Button>
                    </div>
                </div>
            ))}
            <Button type="button" onClick={() => handleOpenTestCaseForm(null)} style={{marginTop:'10px', border:'1px solid #ccc', padding:'5px 10px'}}>Add New Test Case</Button>
        </div>

        {editingTestCase && (
            <Dialog open={!!editingTestCase} onOpenChange={() => handleCloseTestCaseForm()}>
                 <TestCaseForm
                    testCase={editingTestCase}
                    endpoints={endpoints} // Pass endpoints for selection if needed for overrides (though current TC links to suite's endpoint)
                    onSave={handleSaveTestCase}
                    onCancel={handleCloseTestCaseForm}
                    generateId={generateId}
                 />
            </Dialog>
        )}

      </DialogContent>
      <DialogFooter>
        <Button type="button" onClick={onCancel} variant="outline" style={{cursor: 'pointer', padding: '8px 15px', border: '1px solid #ccc'}}>Cancel</Button>
        <Button type="submit" style={{background: '#ccffcc', cursor: 'pointer', padding: '8px 15px', border: '1px solid #aaffaa'}}>Save Suite</Button>
      </DialogFooter>
    </form>
  );
};

// ### TestCaseForm Sub-component ###
interface TestCaseFormProps {
  testCase: TestCase; // Always receives a test case object (new or existing)
  endpoints: ApiEndpoint[]; // Available endpoints (mainly for reference, tc.endpointId is primary)
  onSave: (data: TestCase) => void;
  onCancel: () => void;
  generateId: () => string; // For new KeyValuePairs within overrides
}

const TestCaseForm: React.FC<TestCaseFormProps> = ({ testCase, endpoints, onSave, onCancel, generateId }) => {
  const [formData, setFormData] = useState<TestCase>({ ...testCase });

  useEffect(() => { // Ensure form updates if the initial testCase prop changes (e.g. opening for a new one)
    setFormData({...testCase});
  }, [testCase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRequestOverrideChange = (
    listName: 'headers', // Only headers for now, body is direct
    index: number,
    field: 'name' | 'value',
    value: string
  ) => {
    setFormData(prev => {
      const currentOverrides = prev.requestOverrides || { headers: [], body: '' };
      const list = [...(currentOverrides[listName] || [])];
      list[index] = { ...list[index], id: list[index]?.id || generateId(), [field]: value };
      return { ...prev, requestOverrides: { ...currentOverrides, [listName]: list } };
    });
  };

  const addRequestOverrideItem = (listName: 'headers') => {
    setFormData(prev => {
      const currentOverrides = prev.requestOverrides || { headers: [], body: '' };
      const list = [...(currentOverrides[listName] || [])];
      return { ...prev, requestOverrides: { ...currentOverrides, [listName]: [...list, { id: generateId(), name: '', value: '' }] } };
    });
  };

  const removeRequestOverrideItem = (listName: 'headers', idToRemove: string) => {
     setFormData(prev => {
      const currentOverrides = prev.requestOverrides || { headers: [], body: '' };
      const list = (currentOverrides[listName] || []).filter(item => item.id !== idToRemove);
      return { ...prev, requestOverrides: { ...currentOverrides, [listName]: list } };
    });
  };

  const handleExpectedHeaderChange = (
    index: number,
    field: 'name' | 'value',
    value: string
  ) => {
    setFormData(prev => {
      const list = [...(prev.expectedHeaders || [])];
      list[index] = { ...list[index], id: list[index]?.id || generateId(), [field]: value };
      return { ...prev, expectedHeaders: list };
    });
  };

  const addExpectedHeaderItem = () => {
    setFormData(prev => ({
      ...prev,
      expectedHeaders: [...(prev.expectedHeaders || []), { id: generateId(), name: '', value: '' }]
    }));
  };

  const removeExpectedHeaderItem = (idToRemove: string) => {
     setFormData(prev => ({
      ...prev,
      expectedHeaders: (prev.expectedHeaders || []).filter(item => item.id !== idToRemove)
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderKeyValueListEditor = (
    listName: 'headers' | 'parameters', // 'parameters' might be for expected query params later
    items: KeyValuePair[] = [],
    onChangeHandler: (index: number, field: 'name' | 'value', value: string) => void,
    onAddItemHandler: () => void,
    onRemoveItemHandler: (id: string) => void,
    title: string
  ) => (
    <div style={{border: '1px solid #e0e0e0', padding: '8px', borderRadius: '4px', marginTop: '8px'}}>
      <h5 style={{ marginTop: '0', marginBottom: '8px', fontSize: '0.95em' }}>{title}</h5>
      {items.map((item, index) => (
        <div key={item.id} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
          <Input type="text" placeholder="Name" value={item.name} onChange={(e) => onChangeHandler(index, 'name', e.target.value)} style={{flex:1, fontSize: '0.9em', padding: '4px'}} />
          <Input type="text" placeholder="Value" value={item.value} onChange={(e) => onChangeHandler(index, 'value', e.target.value)} style={{flex:1, fontSize: '0.9em', padding: '4px'}} />
          <Button type="button" onClick={() => onRemoveItemHandler(item.id)} style={{padding: '2px 5px', background: '#ffeeee', border: '1px solid #ffdddd', cursor: 'pointer', fontSize: '0.75em'}}>X</Button>
        </div>
      ))}
      <Button type="button" onClick={onAddItemHandler} style={{padding: '4px 8px', marginTop: '5px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '0.9em'}}>Add</Button>
    </div>
  );


  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
      <DialogHeader>
        <DialogTitle>{formData.id.startsWith('tc_temp_') ? 'Add Test Case' : 'Edit Test Case'}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div><Label htmlFor="tc_name">Test Case Name:</Label><Input id="tc_name" name="name" value={formData.name} onChange={handleChange} required /></div>
        <div><Label htmlFor="tc_description">Description:</Label><Textarea id="tc_description" name="description" value={formData.description} onChange={handleChange} /></div>
        <div>
            <Label htmlFor="tc_endpointId">Target Endpoint (from Suite):</Label>
            <Select id="tc_endpointId" name="endpointId" value={formData.endpointId} onChange={handleChange} required disabled>
                 {/* Disabled as it's tied to the suite's endpoint. Could be enabled for overrides. */}
                {endpoints.map(ep => ( <option key={ep.id} value={ep.id}>{ep.name}</option> ))}
            </Select>
        </div>

        <h4 style={{ marginTop: '15px', marginBottom: '5px', fontSize: '1.0em' }}>Request Overrides</h4>
        {renderKeyValueListEditor('headers', formData.requestOverrides?.headers || [],
            (idx, fld, val) => handleRequestOverrideChange('headers', idx, fld, val),
            () => addRequestOverrideItem('headers'),
            (id) => removeRequestOverrideItem('headers'),
            "Override Headers"
        )}
        <div><Label htmlFor="tc_overrideBody">Override Body:</Label><Textarea id="tc_overrideBody" name="requestOverrides.body" value={formData.requestOverrides?.body || ''}
            onChange={(e) => setFormData(prev => ({...prev, requestOverrides: {...(prev.requestOverrides || {headers:[]}), body: e.target.value }}))} />
        </div>

        <h4 style={{ marginTop: '15px', marginBottom: '5px', fontSize: '1.0em' }}>Assertions</h4>
        <div><Label htmlFor="tc_expectedStatusCode">Expected Status Code:</Label><Input id="tc_expectedStatusCode" name="expectedStatusCode" type="number" value={formData.expectedStatusCode} onChange={handleChange} required /></div>
        <div><Label htmlFor="tc_expectedBodyContains">Expected Body Contains (text):</Label><Input id="tc_expectedBodyContains" name="expectedBodyContains" value={formData.expectedBodyContains || ''} onChange={handleChange} /></div>
        {renderKeyValueListEditor('headers', formData.expectedHeaders || [],
            handleExpectedHeaderChange,
            addExpectedHeaderItem,
            removeExpectedHeaderItem,
            "Expected Headers (Key-Value)"
        )}

      </DialogContent>
      <DialogFooter>
        <Button type="button" onClick={onCancel} variant="outline" style={{cursor: 'pointer', padding: '8px 15px', border: '1px solid #ccc'}}>Cancel</Button>
        <Button type="submit" style={{background: '#ccffcc', cursor: 'pointer', padding: '8px 15px', border: '1px solid #aaffaa'}}>Save Test Case</Button>
      </DialogFooter>
    </form>
  );
};


const TestManager: React.FC<TestManagerProps> = ({
  endpoints,
  testSuites,
  onAddTestSuite,
  onUpdateTestSuite,
  onDeleteTestSuite,
  generateId,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false); // For TestSuiteForm
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);

  // State for test suite execution results
  const [isSuiteRunning, setIsSuiteRunning] = useState<string | null>(null); // Holds ID of running suite
  const [suiteRunResults, setSuiteRunResults] = useState<Array<{ testCaseId: string; testCaseName: string; passed: boolean; actualStatus?: number; expectedStatus?: number; actualBody?: string; expectedBodyPattern?: string; actualHeaders?: Record<string,string>, expectedHeaderChecks?: {name:string; value?:string; present:boolean; pass:boolean}[]; error?: string; }> | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);


  const handleOpenAddForm = () => {
    setEditingSuite(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (suite: TestSuite) => {
    setEditingSuite(suite);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSuite(null);
  };

  const handleSaveSuite = (data: TestSuite | Omit<TestSuite, 'id'>) => {
    if ((data as TestSuite).id) {
      onUpdateTestSuite(data as TestSuite);
    } else {
      // Ensure new suites get an ID and empty testCases array if not provided
      const newSuiteData = {
        ...(data as Omit<TestSuite, 'id'>),
        testCases: (data as TestSuite).testCases || [], // Ensure testCases is an array
      };
      onAddTestSuite(newSuiteData);
    }
    handleCloseForm();
  };

  const handleDeleteSuite = (id: string) => {
    if (window.confirm('Are you sure you want to delete this test suite?')) {
      onDeleteTestSuite(id);
    }
  };

  const handleRunSuite = async (suite: TestSuite) => {
    if (!suite || !suite.testCases || suite.testCases.length === 0) {
      alert("This test suite has no test cases to run.");
      return;
    }
    setIsSuiteRunning(suite.id);
    setSuiteRunResults(null); // Clear previous results
    setIsResultsModalOpen(true); // Open modal to show progress/results

    const results: typeof suiteRunResults = [];

    for (const tc of suite.testCases) {
      const endpoint = endpoints.find(ep => ep.id === tc.endpointId);
      if (!endpoint) {
        results.push({
          testCaseId: tc.id,
          testCaseName: tc.name,
          passed: false,
          error: `Endpoint with ID ${tc.endpointId} not found.`,
        });
        setSuiteRunResults([...results]); // Update results progressively
        continue;
      }

      // Construct request from endpoint and overrides
      let url = tc.requestOverrides?.url || endpoint.url; // Allow URL override in TC if added later
      const method = tc.requestOverrides?.method || endpoint.method; // Allow method override

      const baseHeaders = endpoint.headers || [];
      const overrideHeaders = tc.requestOverrides?.headers || [];
      const mergedHeaders: KeyValuePair[] = [...baseHeaders];
      overrideHeaders.forEach(oh => {
        const index = mergedHeaders.findIndex(bh => bh.name.toLowerCase() === oh.name.toLowerCase());
        if (index > -1) mergedHeaders[index] = { ...oh, id: mergedHeaders[index].id }; // Update existing
        else mergedHeaders.push({...oh, id: generateId('hdr_override_')}); // Add new
      });

      const baseParams = endpoint.parameters || [];
      const overrideParams = tc.requestOverrides?.parameters || []; // Assuming parameters can be overridden
      const mergedParams: KeyValuePair[] = [...baseParams];
       overrideParams.forEach(op => {
        const index = mergedParams.findIndex(bp => bp.name.toLowerCase() === op.name.toLowerCase());
        if (index > -1) mergedParams[index] = { ...op, id: mergedParams[index].id };
        else mergedParams.push({...op, id: generateId('prm_override_')});
      });


      const body = tc.requestOverrides?.body !== undefined ? tc.requestOverrides.body : endpoint.body;
      const contentType = tc.requestOverrides?.contentType || endpoint.contentType; // Allow content type override

      // Construct query string for GET requests if params exist
      if (method === 'GET' && mergedParams.length > 0) {
        const query = new URLSearchParams();
        mergedParams.forEach(p => { if (p.name) query.append(p.name, p.value); });
        url = `${url}?${query.toString()}`;
      }

      const requestHeadersObj: Record<string, string> = {};
      mergedHeaders.forEach(h => { if (h.name) requestHeadersObj[h.name] = h.value; });
      if (method !== 'GET' && method !== 'DELETE' && body) {
        requestHeadersObj['Content-Type'] = contentType || 'application/json';
      }

      const fetchOptions: RequestInit = {
        method: method,
        headers: requestHeadersObj,
      };
      if (method !== 'GET' && method !== 'DELETE' && body !== undefined && body !== null) {
        fetchOptions.body = body;
      }

      let actualStatus: number | undefined;
      let actualBody: string | undefined;
      let actualHeadersObj: Record<string, string> = {};
      let tcPassed = true;
      let errorMessage: string | undefined;
      const expectedHeaderChecks: {name:string; value?:string; present:boolean; pass:boolean}[] = [];

      try {
        const response = await fetch(url, fetchOptions);
        actualStatus = response.status;

        response.headers.forEach((value, key) => {
          actualHeadersObj[key.toLowerCase()] = value; // Store headers as lowercase for case-insensitive checks
        });

        actualBody = await response.text(); // Get body as text for string contains check

        // --- Assertions ---
        // Status Code
        if (actualStatus !== tc.expectedStatusCode) {
          tcPassed = false;
        }
        // Body Contains
        if (tc.expectedBodyContains && !actualBody.includes(tc.expectedBodyContains)) {
          tcPassed = false;
        }
        // Expected Headers
        if (tc.expectedHeaders && tc.expectedHeaders.length > 0) {
            for (const eh of tc.expectedHeaders) {
                const headerCheckResult = {name: eh.name, value: eh.value, present: false, pass: false};
                const actualHeaderValue = actualHeadersObj[eh.name.toLowerCase()];
                if (actualHeaderValue !== undefined) {
                    headerCheckResult.present = true;
                    if (eh.value) { // If a value is specified, check for match
                        headerCheckResult.pass = actualHeaderValue.includes(eh.value); // Simple includes check for now
                    } else { // If no value specified, just check for presence
                        headerCheckResult.pass = true;
                    }
                }
                if (!headerCheckResult.pass) tcPassed = false;
                expectedHeaderChecks.push(headerCheckResult);
            }
        }


      } catch (err: any) {
        tcPassed = false;
        errorMessage = err.message || "Fetch error";
      }

      results.push({
        testCaseId: tc.id,
        testCaseName: tc.name,
        passed: tcPassed,
        actualStatus,
        expectedStatus: tc.expectedStatusCode,
        actualBody,
        expectedBodyPattern: tc.expectedBodyContains,
        actualHeaders: actualHeadersObj,
        expectedHeaderChecks,
        error: errorMessage,
      });
      setSuiteRunResults([...results]); // Update results progressively
    }
    setIsSuiteRunning(null); // Mark suite as finished
  };


  return (
    <div style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Manage Test Suites</h2>
        <Button onClick={handleOpenAddForm} style={{ padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', background: '#e0e0e0' }}>
          Add New Test Suite
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <TestSuiteForm
          suiteToEdit={editingSuite}
          endpoints={endpoints}
          onSave={handleSaveSuite}
          onCancel={handleCloseForm}
          generateId={generateId}
        />
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Suite Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Test Cases</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testSuites.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} style={{ textAlign: 'center' }}>
                No test suites configured yet.
              </TableCell>
            </TableRow>
          )}
          {testSuites.map((suite) => (
            <TableRow key={suite.id}>
              <TableCell>{suite.name}</TableCell>
              <TableCell style={{maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{suite.description}</TableCell>
              <TableCell>{suite.testCases?.length || 0}</TableCell>
              <TableCell>
                <Button onClick={() => handleOpenEditForm(suite)} style={{ marginRight: '5px', cursor: 'pointer', padding: '5px 10px', border: '1px solid #ccc' }}>Edit</Button>
                <Button
                    onClick={() => handleRunSuite(suite)}
                    disabled={isSuiteRunning === suite.id}
                    style={{ marginRight: '5px', cursor: 'pointer', padding: '5px 10px', border: '1px solid #ccc', background: '#e6ffe6' }}
                >
                  {isSuiteRunning === suite.id ? 'Running...' : 'Run Suite'}
                </Button>
                <Button onClick={() => handleDeleteSuite(suite.id)} variant="destructive" style={{ cursor: 'pointer', background: '#ffdddd', color: 'darkred', padding: '5px 10px', border: '1px solid #ffaaaa' }}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Results Modal */}
      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogHeader>
          <DialogTitle>Test Suite Results</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {isSuiteRunning && <p>Running suite (ID: {isSuiteRunning})... Results will appear below.</p>}
          {!suiteRunResults && !isSuiteRunning && <p>No results to display. Run a test suite.</p>}
          {suiteRunResults && (
            <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
              {suiteRunResults.map(result => (
                <div key={result.testCaseId} style={{ marginBottom: '15px', padding: '10px', border: `2px solid ${result.passed ? 'green' : 'red'}`, borderRadius: '4px`, background: result.passed ? '#f0fff0' : '#fff0f0' }}>
                  <h4 style={{marginTop:0, color: result.passed ? 'green' : 'red'}}>{result.testCaseName}: {result.passed ? 'PASSED' : 'FAILED'}</h4>
                  {result.error && <p style={{color:'red'}}><strong>Error:</strong> {result.error}</p>}
                  <p><strong>Status:</strong> Expected {result.expectedStatus}, Got {result.actualStatus ?? 'N/A'}</p>
                  {result.expectedBodyPattern && <p><strong>Body Contains:</strong> Expected "{result.expectedBodyPattern}", Actual: "{result.actualBody?.substring(0,100) ?? 'N/A'}{ (result.actualBody?.length || 0) > 100 ? '...' : ''}"</p>}

                  {result.expectedHeaderChecks && result.expectedHeaderChecks.length > 0 && (
                    <div>
                        <strong>Header Checks:</strong>
                        <ul style={{fontSize: '0.9em', listStyleType:'none', paddingLeft:'10px'}}>
                        {result.expectedHeaderChecks.map((hc,idx) => (
                            <li key={idx} style={{color: hc.pass ? 'green' : 'red'}}>
                                {hc.name}: Expected {hc.value ? `to include "${hc.value}"` : 'to be present'} - {hc.pass ? 'Pass' : 'Fail'} (Actual: "{result.actualHeaders?.[hc.name.toLowerCase()] || 'Not Present'}")
                            </li>
                        ))}
                        </ul>
                    </div>
                  )}
                  {!result.passed && result.actualBody && (
                     <div><details><summary style={{cursor:'pointer', fontSize:'0.9em'}}>View Full Actual Body</summary><pre style={{fontSize: '0.8em', background: '#eee', padding: '5px', borderRadius: '3px', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>{typeof result.actualBody === 'object' ? JSON.stringify(result.actualBody, null, 2) : String(result.actualBody)}</pre></details></div>
                  )}
                </div>
              ))}
              {isSuiteRunning === null && <p style={{fontWeight:'bold', marginTop:'15px'}}>Suite run finished.</p>}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => setIsResultsModalOpen(false)} style={{cursor: 'pointer', padding: '8px 15px', border: '1px solid #ccc'}}>Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default TestManager;
