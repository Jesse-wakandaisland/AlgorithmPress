/**
 * AlgorithmPress PHP Component Templates
 * Collection of PHP component templates for the AlgorithmPress PHP-WASM Builder
 */

const PHPComponentTemplates = [
  // Basic Components
  {
    id: 'text-block',
    name: 'Text Block',
    description: 'A simple text block with PHP variable support',
    category: 'Basic',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 5h16v2H4V5zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" fill="currentColor"/>
    </svg>`,
    template: `<div class="text-component">
  <?php echo htmlspecialchars("{{ content }}"); ?>
</div>`,
    defaultProps: {
      content: 'Text content here',
      className: ''
    },
    properties: [
      {
        name: 'content',
        label: 'Content',
        type: 'textarea',
        description: 'Text content (supports PHP variables)'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  {
    id: 'heading',
    name: 'Heading',
    description: 'Heading element with PHP variable support',
    category: 'Basic',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4h6v2H7v12H5V6H2V4h2zm10 0h6v2h-3v12h-2V6h-3V4h2z" fill="currentColor"/>
    </svg>`,
    template: `<{{ tag }} class="heading-component {{ className }}">
  <?php echo htmlspecialchars("{{ content }}"); ?>
</{{ tag }}>`,
    defaultProps: {
      tag: 'h2',
      content: 'Heading',
      className: ''
    },
    properties: [
      {
        name: 'tag',
        label: 'Heading Level',
        type: 'select',
        options: [
          { value: 'h1', label: 'H1' },
          { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' },
          { value: 'h4', label: 'H4' },
          { value: 'h5', label: 'H5' },
          { value: 'h6', label: 'H6' }
        ],
        description: 'Heading level tag'
      },
      {
        name: 'content',
        label: 'Content',
        type: 'text',
        description: 'Heading text (supports PHP variables)'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Image element with PHP variable support for src',
    category: 'Basic',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/>
    </svg>`,
    template: `<img src="<?php echo htmlspecialchars("{{ src }}"); ?>" alt="<?php echo htmlspecialchars("{{ alt }}"); ?>" class="image-component {{ className }}" style="max-width: {{ maxWidth }}; height: {{ height }};" />`,
    defaultProps: {
      src: 'https://via.placeholder.com/300x200',
      alt: 'Image',
      maxWidth: '100%',
      height: 'auto',
      className: ''
    },
    properties: [
      {
        name: 'src',
        label: 'Image Source',
        type: 'text',
        description: 'URL of the image (supports PHP variables)'
      },
      {
        name: 'alt',
        label: 'Alt Text',
        type: 'text',
        description: 'Alternative text for the image'
      },
      {
        name: 'maxWidth',
        label: 'Max Width',
        type: 'text',
        description: 'Maximum width (px, %, etc.)'
      },
      {
        name: 'height',
        label: 'Height',
        type: 'text',
        description: 'Height (px, auto, etc.)'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  {
    id: 'container',
    name: 'Container',
    description: 'A container div for organizing content',
    category: 'Basic',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor"/>
    </svg>`,
    template: `<div class="container-component {{ className }}" style="padding: {{ padding }}; margin: {{ margin }}; background-color: {{ backgroundColor }};">
  <!-- Container content goes here -->
  <?php echo "{{ content }}"; ?>
</div>`,
    defaultProps: {
      content: '<!-- Drag components here -->',
      padding: '20px',
      margin: '0',
      backgroundColor: 'transparent',
      className: ''
    },
    properties: [
      {
        name: 'content',
        label: 'Content',
        type: 'textarea',
        description: 'HTML content for the container'
      },
      {
        name: 'padding',
        label: 'Padding',
        type: 'text',
        description: 'Padding (px, em, etc.)'
      },
      {
        name: 'margin',
        label: 'Margin',
        type: 'text',
        description: 'Margin (px, em, etc.)'
      },
      {
        name: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        description: 'Background color of the container'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  
  // PHP-Specific Components
  {
    id: 'php-code',
    name: 'PHP Code',
    description: 'Raw PHP code execution',
    category: 'PHP',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 18.08c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10zm-5.68-7.73h1.36c.07-.69.35-1.22.83-1.59.5-.39 1.12-.58 1.86-.58.86 0 1.54.23 2.05.69s.77 1.08.77 1.87c0 .73-.3 1.45-.89 2.17-.6.72-1.53 1.47-2.8 2.25V16h4.05v-1h-2.34c.87-.51 1.56-1.02 2.07-1.54.51-.52.77-1.12.77-1.82 0-.75-.28-1.35-.84-1.79-.56-.44-1.29-.66-2.19-.66-1.16 0-2.04.3-2.62.9-.58.6-.92 1.45-1.02 2.54v.15h-.06z" fill="currentColor"/>
    </svg>`,
    template: `<div class="php-code-component {{ className }}">
<?php
{{ code }}
?>
</div>`,
    defaultProps: {
      code: '// Your PHP code here\n$greeting = "Hello World!";\necho $greeting;',
      className: ''
    },
    properties: [
      {
        name: 'code',
        label: 'PHP Code',
        type: 'code',
        language: 'php',
        description: 'PHP code to execute'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  {
    id: 'php-include',
    name: 'PHP Include',
    description: 'Include an external PHP file',
    category: 'PHP',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
    </svg>`,
    template: `<div class="php-include-component {{ className }}">
<?php
include "{{ filename }}";
?>
</div>`,
    defaultProps: {
      filename: 'includes/header.php',
      className: ''
    },
    properties: [
      {
        name: 'filename',
        label: 'File Path',
        type: 'text',
        description: 'Path to the PHP file to include'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  {
    id: 'php-form',
    name: 'PHP Form',
    description: 'Form with PHP processing',
    category: 'PHP',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H7c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z" fill="currentColor"/>
      <path d="M7 9h10v2H7V9zm0 4h7v2H7v-2z" fill="currentColor"/>
    </svg>`,
    template: `<div class="php-form-component {{ className }}">
  <?php
  // Define variables
  $formSubmitted = false;
  $formData = [];
  $formErrors = [];
  
  // Check if form was submitted
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $formSubmitted = true;
    
    {{ processingCode }}
    
    // Collect form data
    foreach ($_POST as $key => $value) {
      $formData[$key] = htmlspecialchars($value);
    }
  }
  ?>
  
  <form method="post" action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>" class="{{ formClass }}">
    {{ formFields }}
    
    <button type="submit" class="{{ submitButtonClass }}">{{ submitButtonText }}</button>
  </form>
  
  <?php if ($formSubmitted): ?>
    <div class="{{ successMessageClass }}" style="margin-top: 20px;">
      {{ successMessage }}
      
      <pre>
        <?php if ({{ showDebug }}) print_r($formData); ?>
      </pre>
    </div>
  <?php endif; ?>
</div>`,
    defaultProps: {
      formFields: `<!-- Name field -->
<div class="form-group mb-3">
  <label for="name">Name</label>
  <input type="text" class="form-control" id="name" name="name" required>
</div>

<!-- Email field -->
<div class="form-group mb-3">
  <label for="email">Email</label>
  <input type="email" class="form-control" id="email" name="email" required>
</div>

<!-- Message field -->
<div class="form-group mb-3">
  <label for="message">Message</label>
  <textarea class="form-control" id="message" name="message" rows="3" required></textarea>
</div>`,
      processingCode: `// Validate inputs
if (empty($_POST['name'])) {
  $formErrors['name'] = 'Name is required';
}

if (empty($_POST['email'])) {
  $formErrors['email'] = 'Email is required';
} elseif (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
  $formErrors['email'] = 'Email is invalid';
}

if (empty($_POST['message'])) {
  $formErrors['message'] = 'Message is required';
}

// If no errors, process form
if (empty($formErrors)) {
  // Here you can save to database, send email, etc.
  // For example:
  // mail('your@email.com', 'Contact Form Submission', $_POST['message'], "From: {$_POST['email']}");
}`,
      successMessage: '<p>Thank you for your submission! We will get back to you soon.</p>',
      formClass: 'needs-validation',
      submitButtonText: 'Submit',
      submitButtonClass: 'btn btn-primary',
      successMessageClass: 'alert alert-success',
      showDebug: 'false',
      className: ''
    },
    properties: [
      {
        name: 'formFields',
        label: 'Form Fields',
        type: 'textarea',
        description: 'HTML for form fields'
      },
      {
        name: 'processingCode',
        label: 'Processing Code',
        type: 'code',
        language: 'php',
        description: 'PHP code for form processing'
      },
      {
        name: 'successMessage',
        label: 'Success Message',
        type: 'textarea',
        description: 'Message shown after successful submission'
      },
      {
        name: 'formClass',
        label: 'Form Class',
        type: 'text',
        description: 'CSS class for the form'
      },
      {
        name: 'submitButtonText',
        label: 'Submit Button Text',
        type: 'text',
        description: 'Text for the submit button'
      },
      {
        name: 'submitButtonClass',
        label: 'Submit Button Class',
        type: 'text',
        description: 'CSS class for the submit button'
      },
      {
        name: 'successMessageClass',
        label: 'Success Message Class',
        type: 'text',
        description: 'CSS class for the success message'
      },
      {
        name: 'showDebug',
        label: 'Show Debug',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ],
        description: 'Show debug information'
      },
      {
        name: 'className',
        label: 'Container Class',
        type: 'text',
        description: 'Additional CSS classes for container'
      }
    ]
  },
  
  // Database Components
  {
    id: 'sqlite-database',
    name: 'SQLite Database',
    description: 'SQLite database operations',
    category: 'Database',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 13V6c0-1.1-.9-2-2-2H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5l4 4V9l-4 4z" fill="currentColor"/>
    </svg>`,
    template: `<div class="sqlite-component {{ className }}">
<?php
// Initialize SQLite database
$dbPath = '{{ dbName }}.sqlite';
$db = new SQLite3($dbPath);

// Create table if it doesn't exist
$db->exec('
  CREATE TABLE IF NOT EXISTS {{ tableName }} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    {{ tableSchema }}
  )
');

{{ customCode }}

// Sample query to display data
$results = $db->query('SELECT * FROM {{ tableName }} LIMIT {{ limit }}');

// Display results in a table
if ($results) {
?>
  <{{ tableWrapperTag }} class="{{ tableClass }}">
    <thead>
      <tr>
        <th>ID</th>
        <?php
        // Get the table columns (excluding ID)
        $columns = [];
        $tableInfo = $db->query("PRAGMA table_info({{ tableName }})");
        while ($col = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
          if ($col['name'] !== 'id') {
            $columns[] = $col['name'];
            echo "<th>" . htmlspecialchars(ucfirst($col['name'])) . "</th>";
          }
        }
        ?>
      </tr>
    </thead>
    <tbody>
      <?php
      while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['id']) . "</td>";
        foreach ($columns as $column) {
          echo "<td>" . htmlspecialchars($row[$column] ?? '') . "</td>";
        }
        echo "</tr>";
      }
      ?>
    </tbody>
  </{{ tableWrapperTag }}>
<?php
} else {
  echo '<div class="alert alert-warning">No results found</div>';
}

// Close the database connection
$db->close();
?>
</div>`,
    defaultProps: {
      dbName: 'myapp',
      tableName: 'users',
      tableSchema: 'name TEXT,\n    email TEXT,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
      customCode: '// Add sample data if table is empty\n$count = $db->querySingle("SELECT COUNT(*) FROM users");\nif ($count === 0) {\n  $db->exec(\'\n    INSERT INTO users (name, email) VALUES\n    ("John Doe", "john@example.com"),\n    ("Jane Smith", "jane@example.com"),\n    ("Bob Johnson", "bob@example.com")\n  \');\n}',
      limit: 10,
      tableWrapperTag: 'table',
      tableClass: 'table table-striped',
      className: ''
    },
    properties: [
      {
        name: 'dbName',
        label: 'Database Name',
        type: 'text',
        description: 'Name of the SQLite database'
      },
      {
        name: 'tableName',
        label: 'Table Name',
        type: 'text',
        description: 'Name of the database table'
      },
      {
        name: 'tableSchema',
        label: 'Table Schema',
        type: 'textarea',
        description: 'SQL schema definition (without ID field)'
      },
      {
        name: 'customCode',
        label: 'Custom Code',
        type: 'code',
        language: 'php',
        description: 'Custom PHP code for database operations'
      },
      {
        name: 'limit',
        label: 'Results Limit',
        type: 'number',
        description: 'Maximum number of results to display'
      },
      {
        name: 'tableWrapperTag',
        label: 'Table Wrapper Tag',
        type: 'select',
        options: [
          { value: 'table', label: 'table' },
          { value: 'div', label: 'div' }
        ],
        description: 'HTML tag for the table wrapper'
      },
      {
        name: 'tableClass',
        label: 'Table Class',
        type: 'text',
        description: 'CSS class for the table'
      },
      {
        name: 'className',
        label: 'Container Class',
        type: 'text',
        description: 'Additional CSS classes for container'
      }
    ]
  },
  
  // Dynamic Content Components
  {
    id: 'conditional-content',
    name: 'Conditional Content',
    description: 'Show content based on conditions',
    category: 'Dynamic',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 5h10v2h2V3h-6V1h-2v2H5v4h2V5zm10 14h-4v-2h4v2zM17 9H7v2h10V9zm0 4H7v2h10v-2zM7 17h6v2H7v-2z" fill="currentColor"/>
    </svg>`,
    template: `<div class="conditional-component {{ className }}">
<?php
// Evaluate the condition
$condition = {{ condition }};

// Show the appropriate content based on the condition
if ($condition) {
?>
  <div class="condition-true">
    {{ trueContent }}
  </div>
<?php
} else {
?>
  <div class="condition-false">
    {{ falseContent }}
  </div>
<?php
}
?>
</div>`,
    defaultProps: {
      condition: 'isset($_GET["show"]) && $_GET["show"] === "true"',
      trueContent: '<p>This content is shown when the condition is true.</p>',
      falseContent: '<p>This content is shown when the condition is false.</p>',
      className: ''
    },
    properties: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'code',
        language: 'php',
        description: 'PHP condition to evaluate'
      },
      {
        name: 'trueContent',
        label: 'True Content',
        type: 'textarea',
        description: 'Content to show when condition is true'
      },
      {
        name: 'falseContent',
        label: 'False Content',
        type: 'textarea',
        description: 'Content to show when condition is false'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  {
    id: 'loop',
    name: 'PHP Loop',
    description: 'Repeat content with a PHP loop',
    category: 'Dynamic',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor"/>
    </svg>`,
    template: `<div class="loop-component {{ className }}">
<?php
// Define the array to iterate over
$items = {{ array }};

// Loop through the items
foreach ($items as $index => $item) {
?>
  <div class="loop-item">
    {{ itemTemplate }}
  </div>
<?php
}
?>
</div>`,
    defaultProps: {
      array: '[1, 2, 3, 4, 5]',
      itemTemplate: '<p>Item #<?php echo $index + 1; ?>: <?php echo $item; ?></p>',
      className: ''
    },
    properties: [
      {
        name: 'array',
        label: 'Array',
        type: 'code',
        language: 'php',
        description: 'PHP array to iterate over'
      },
      {
        name: 'itemTemplate',
        label: 'Item Template',
        type: 'textarea',
        description: 'Template for each item (use $index and $item variables)'
      },
      {
        name: 'className',
        label: 'CSS Class',
        type: 'text',
        description: 'Additional CSS classes'
      }
    ]
  },
  
  // API Components
  {
    id: 'api-request',
    name: 'API Request',
    description: 'Make an API request using PHP',
    category: 'API',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.05 13h2.92c.15 2.18 1.1 4.19 2.59 5.71L6.09 20.1c-2.35-1.84-3.88-4.71-4.04-7.1zm19.9 0c-.15 2.39-1.69 5.26-4.04 7.1l-1.47-1.39c1.49-1.52 2.44-3.53 2.59-5.71h2.92zM10 20.2c-1.35-.85-2.37-2.09-2.85-3.57-.22-.68-.33-1.4-.33-2.14v-2.24h7.36v2.24c0 .75-.11 1.47-.33 2.14-.48 1.48-1.5 2.72-2.85 3.57v.8h2v1h-5v-1h2v-.8zM14 8h-4v1h4V8zM10 5h4v1h-4V5zM6.09 3.9l1.47 1.39C6.07 6.82 5.12 8.83 4.97 11H2.05c.16-2.39 1.7-5.26 4.04-7.1zM17.91 5.29L19.38 3.9c2.35 1.84 3.89 4.71 4.04 7.1h-2.92c-.15-2.17-1.1-4.18-2.59-5.71z" fill="currentColor"/>
    </svg>`,
    template: `<div class="api-request-component {{ className }}">
<?php
// Define the API URL
$apiUrl = "{{ apiUrl }}";

// Set up request options
$options = [
  'http' => [
    'method' => "{{ method }}",
    'header' => "Content-Type: {{ contentType }}\\r\\n" .
                "Accept: application/json\\r\\n" .
                {{ customHeaders }}
                "User-Agent: PHP-WASM/1.0\\r\\n",
    'content' => {{ requestBody }},
    'timeout' => {{ timeout }}
  ]
];

// Create the context
$context = stream_context_create($options);

// Make the request
try {
  $response = file_get_contents($apiUrl, false, $context);
  $httpStatus = $http_response_header[0];
  
  // Process the response
  if ($response !== false) {
    // Decode JSON response
    $data = json_decode($response, true);
    
    // Display the results based on the selected format
    if ("{{ displayFormat }}" === "raw") {
      echo "<pre>";
      echo htmlspecialchars($response);
      echo "</pre>";
    } elseif ("{{ displayFormat }}" === "formatted") {
      echo "<pre>";
      echo htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT));
      echo "</pre>";
    } elseif ("{{ displayFormat }}" === "table" && is_array($data)) {
      // Display as table if data is suitable
      echo "<table class='{{ tableClass }}'>";
      
      // Handle different data structures
      if (isset($data[0]) && is_array($data[0])) {
        // Array of objects
        echo "<thead><tr>";
        foreach (array_keys($data[0]) as $key) {
          echo "<th>" . htmlspecialchars($key) . "</th>";
        }
        echo "</tr></thead><tbody>";
        
        foreach ($data as $item) {
          echo "<tr>";
          foreach ($item as $value) {
            echo "<td>" . (is_array($value) ? "[Array]" : htmlspecialchars((string)$value)) . "</td>";
          }
          echo "</tr>";
        }
        echo "</tbody>";
      } elseif (is_array($data)) {
        // Single object
        echo "<tbody>";
        foreach ($data as $key => $value) {
          echo "<tr>";
          echo "<th>" . htmlspecialchars($key) . "</th>";
          echo "<td>" . (is_array($value) ? "[Array]" : htmlspecialchars((string)$value)) . "</td>";
          echo "</tr>";
        }
        echo "</tbody>";
      }
      
      echo "</table>";
    } elseif ("{{ displayFormat }}" === "custom") {
      // Custom display format
      {{ customDisplay }}
    }
  } else {
    echo "<div class='{{ errorClass }}'>Failed to get response: " . htmlspecialchars($httpStatus) . "</div>";
  }
} catch (Exception $e) {
  echo "<div class='{{ errorClass }}'>Error: " . htmlspecialchars($e->getMessage()) . "</div>";
}
?>
</div>`,
    defaultProps: {
      apiUrl: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      contentType: 'application/json',
      customHeaders: '',
      requestBody: '""',
      timeout: 30,
      displayFormat: 'formatted',
      tableClass: 'table table-striped',
      errorClass: 'alert alert-danger',
      customDisplay: '// Custom display code\nif (isset($data["title"])) {\n  echo "<h2>" . htmlspecialchars($data["title"]) . "</h2>";\n}\nif (isset($data["body"])) {\n  echo "<p>" . nl2br(htmlspecialchars($data["body"])) . "</p>";\n}',
      className: ''
    },
    properties: [
      {
        name: 'apiUrl',
        label: 'API URL',
        type: 'text',
        description: 'URL of the API endpoint'
      },
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' }
        ],
        description: 'HTTP method for the request'
      },
      {
        name: 'contentType',
        label: 'Content Type',
        type: 'select',
        options: [
          { value: 'application/json', label: 'application/json' },
          { value: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded' },
          { value: 'text/plain', label: 'text/plain' }
        ],
        description: 'Content type header'
      },
      {
        name: 'customHeaders',
        label: 'Custom Headers',
        type: 'textarea',
        description: 'Additional HTTP headers (one per line: "Header: value\\r\\n" .)'
      },
      {
        name: 'requestBody',
        label: 'Request Body',
        type: 'code',
        language: 'php',
        description: 'Body content for POST, PUT requests'
      },
      {
        name: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        description: 'Request timeout in seconds'
      },
      {
        name: 'displayFormat',
        label: 'Display Format',
        type: 'select',
        options: [
          { value: 'raw', label: 'Raw Response' },
          { value: 'formatted', label: 'Formatted JSON' },
          { value: 'table', label: 'Table' },
          { value: 'custom', label: 'Custom' }
        ],
        description: 'How to display the response'
      },
      {
        name: 'tableClass',
        label: 'Table Class',
        type: 'text',
        description: 'CSS class for table display format'
      },
      {
        name: 'errorClass',
        label: 'Error Class',
        type: 'text',
        description: 'CSS class for error messages'
      },
      {
        name: 'customDisplay',
        label: 'Custom Display',
        type: 'code',
        language: 'php',
        description: 'Custom PHP code for displaying the response'
      },
      {
        name: 'className',
        label: 'Container Class',
        type: 'text',
        description: 'Additional CSS classes for container'
      }
    ]
  },
  
  // UI Components
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'Tabbed interface with PHP content',
    category: 'UI',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h10v4h8v10z" fill="currentColor"/>
    </svg>`,
    template: `<div class="tabs-component {{ className }}">
  <?php
  // Define the active tab
  $activeTab = isset($_GET['tab']) ? $_GET['tab'] : '{{ defaultTab }}';
  
  // Define tabs array
  $tabs = {{ tabsArray }};
  ?>
  
  <ul class="{{ tabsClass }}">
    <?php foreach ($tabs as $tabId => $tabName): ?>
      <li class="{{ tabItemClass }}">
        <a href="?tab=<?php echo htmlspecialchars($tabId); ?>" 
           class="<?php echo $activeTab === $tabId ? '{{ activeTabClass }}' : '{{ tabLinkClass }}'; ?>">
          <?php echo htmlspecialchars($tabName); ?>
        </a>
      </li>
    <?php endforeach; ?>
  </ul>
  
  <div class="{{ tabContentClass }}">
    <?php if ($activeTab === 'tab1'): ?>
      <div id="tab1-content">
        {{ tab1Content }}
      </div>
    <?php elseif ($activeTab === 'tab2'): ?>
      <div id="tab2-content">
        {{ tab2Content }}
      </div>
    <?php elseif ($activeTab === 'tab3'): ?>
      <div id="tab3-content">
        {{ tab3Content }}
      </div>
    <?php endif; ?>
  </div>
</div>`,
    defaultProps: {
      tabsArray: "[\n  'tab1' => 'Tab 1',\n  'tab2' => 'Tab 2',\n  'tab3' => 'Tab 3'\n]",
      defaultTab: 'tab1',
      tab1Content: '<p>This is the content for Tab 1.</p>',
      tab2Content: '<p>This is the content for Tab 2.</p>',
      tab3Content: '<p>This is the content for Tab 3.</p>',
      tabsClass: 'nav nav-tabs',
      tabItemClass: 'nav-item',
      tabLinkClass: 'nav-link',
      activeTabClass: 'nav-link active',
      tabContentClass: 'tab-content p-3 border border-top-0 rounded-bottom',
      className: ''
    },
    properties: [
      {
        name: 'tabsArray',
        label: 'Tabs Array',
        type: 'code',
        language: 'php',
        description: 'PHP array of tab IDs and names'
      },
      {
        name: 'defaultTab',
        label: 'Default Tab',
        type: 'text',
        description: 'ID of the default active tab'
      },
      {
        name: 'tab1Content',
        label: 'Tab 1 Content',
        type: 'textarea',
        description: 'Content for Tab 1'
      },
      {
        name: 'tab2Content',
        label: 'Tab 2 Content',
        type: 'textarea',
        description: 'Content for Tab 2'
      },
      {
        name: 'tab3Content',
        label: 'Tab 3 Content',
        type: 'textarea',
        description: 'Content for Tab 3'
      },
      {
        name: 'tabsClass',
        label: 'Tabs Container Class',
        type: 'text',
        description: 'CSS class for tabs container'
      },
      {
        name: 'tabItemClass',
        label: 'Tab Item Class',
        type: 'text',
        description: 'CSS class for tab items'
      },
      {
        name: 'tabLinkClass',
        label: 'Tab Link Class',
        type: 'text',
        description: 'CSS class for tab links'
      },
      {
        name: 'activeTabClass',
        label: 'Active Tab Class',
        type: 'text',
        description: 'CSS class for active tab'
      },
      {
        name: 'tabContentClass',
        label: 'Tab Content Class',
        type: 'text',
        description: 'CSS class for tab content container'
      },
      {
        name: 'className',
        label: 'Container Class',
        type: 'text',
        description: 'Additional CSS classes for container'
      }
    ]
  },
  
  // Utility Components
  {
    id: 'user-session',
    name: 'User Session',
    description: 'Manage PHP sessions for user data',
    category: 'Utility',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
    </svg>`,
    template: `<div class="session-component {{ className }}">
<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

// Handle session operations based on the mode
$mode = "{{ mode }}";

// Generate a unique session ID if needed
if (!isset($_SESSION['session_id'])) {
  $_SESSION['session_id'] = uniqid();
}

// Initialize session variable if it doesn't exist
$sessionKey = "{{ sessionKey }}";
if (!isset($_SESSION[$sessionKey]) && $mode !== 'clear') {
  $_SESSION[$sessionKey] = {{ initialValue }};
}

// Execute custom session code
{{ customSessionCode }}

// Handle different modes
if ($mode === 'display') {
  // Display session data
  if (isset($_SESSION[$sessionKey])) {
    if (is_array($_SESSION[$sessionKey])) {
      echo "<pre>" . htmlspecialchars(json_encode($_SESSION[$sessionKey], JSON_PRETTY_PRINT)) . "</pre>";
    } else {
      echo "<p>" . htmlspecialchars($_SESSION[$sessionKey]) . "</p>";
    }
  } else {
    echo "<p class='{{ notFoundClass }}'>Session variable not found.</p>";
  }
} elseif ($mode === 'form') {
  // Show form to modify session data
?>
  <form method="post" action="">
    <input type="hidden" name="session_action" value="update">
    <div class="mb-3">
      <label for="session_value" class="form-label">{{ formLabel }}</label>
      <?php if (is_array($_SESSION[$sessionKey])): ?>
        <textarea name="session_value" id="session_value" class="form-control" rows="5"><?php echo htmlspecialchars(json_encode($_SESSION[$sessionKey], JSON_PRETTY_PRINT)); ?></textarea>
      <?php else: ?>
        <input type="text" name="session_value" id="session_value" class="form-control" value="<?php echo htmlspecialchars($_SESSION[$sessionKey]); ?>">
      <?php endif; ?>
    </div>
    <button type="submit" class="btn btn-primary">Update</button>
  </form>
<?php
  // Process form submission
  if (isset($_POST['session_action']) && $_POST['session_action'] === 'update') {
    $newValue = $_POST['session_value'];
    
    // Try to decode JSON if it's an array
    if (is_array($_SESSION[$sessionKey])) {
      try {
        $decodedValue = json_decode($newValue, true);
        if (json_last_error() === JSON_ERROR_NONE) {
          $_SESSION[$sessionKey] = $decodedValue;
          echo "<div class='{{ successClass }}'>Session updated successfully!</div>";
        } else {
          echo "<div class='{{ errorClass }}'>Invalid JSON format.</div>";
        }
      } catch (Exception $e) {
        echo "<div class='{{ errorClass }}'>Error: " . htmlspecialchars($e->getMessage()) . "</div>";
      }
    } else {
      $_SESSION[$sessionKey] = $newValue;
      echo "<div class='{{ successClass }}'>Session updated successfully!</div>";
    }
  }
} elseif ($mode === 'clear') {
  // Clear the session
  if (isset($_SESSION[$sessionKey])) {
    unset($_SESSION[$sessionKey]);
    echo "<div class='{{ successClass }}'>Session variable cleared.</div>";
  } else {
    echo "<div class='{{ notFoundClass }}'>Session variable not found.</div>";
  }
}
?>
</div>`,
    defaultProps: {
      mode: 'display',
      sessionKey: 'user_data',
      initialValue: '[]',
      customSessionCode: '// Custom session code here\n// Example: track page visits\nif (!isset($_SESSION["page_visits"])) {\n  $_SESSION["page_visits"] = 0;\n}\n$_SESSION["page_visits"]++;',
      formLabel: 'Session Data:',
      successClass: 'alert alert-success mt-3',
      errorClass: 'alert alert-danger mt-3',
      notFoundClass: 'alert alert-warning',
      className: ''
    },
    properties: [
      {
        name: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'display', label: 'Display' },
          { value: 'form', label: 'Edit Form' },
          { value: 'clear', label: 'Clear' }
        ],
        description: 'Operation mode for session data'
      },
      {
        name: 'sessionKey',
        label: 'Session Key',
        type: 'text',
        description: 'Name of the session variable'
      },
      {
        name: 'initialValue',
        label: 'Initial Value',
        type: 'code',
        language: 'php',
        description: 'Initial value if session is not set'
      },
      {
        name: 'customSessionCode',
        label: 'Custom Session Code',
        type: 'code',
        language: 'php',
        description: 'Custom PHP code for session operations'
      },
      {
        name: 'formLabel',
        label: 'Form Label',
        type: 'text',
        description: 'Label for the edit form'
      },
      {
        name: 'successClass',
        label: 'Success Message Class',
        type: 'text',
        description: 'CSS class for success messages'
      },
      {
        name: 'errorClass',
        label: 'Error Message Class',
        type: 'text',
        description: 'CSS class for error messages'
      },
      {
        name: 'notFoundClass',
        label: 'Not Found Message Class',
        type: 'text',
        description: 'CSS class for not found messages'
      },
      {
        name: 'className',
        label: 'Container Class',
        type: 'text',
        description: 'Additional CSS classes for container'
      }
    ]
  }
];

// Export the components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PHPComponentTemplates;
}
