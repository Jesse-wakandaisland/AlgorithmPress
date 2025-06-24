<?php
/**
 * PHP-WASM Builder Demo Project
 * A simple blog demo showcasing PHP-WASM capabilities
 */

// Initialize session
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

// Initialize database
$dbPath = 'blog.sqlite';
$db = new SQLite3($dbPath);

// Create tables if they don't exist
$db->exec('
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
');

$db->exec('
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
  )
');

// Insert sample data if tables are empty
$postCount = $db->querySingle("SELECT COUNT(*) FROM posts");
if ($postCount === 0) {
  $db->exec("
    INSERT INTO posts (title, content, author) VALUES
    ('Welcome to PHP-WASM Blog', 'This is a demo blog running entirely in your browser using PHP-WASM. No server required!', 'Admin'),
    ('How PHP-WASM Works', 'PHP-WASM compiles the PHP interpreter to WebAssembly, allowing PHP to run directly in your browser.', 'Admin'),
    ('Building Decentralized Apps', 'With PHP-WASM and decentralized storage like Cubbit, you can create fully decentralized web applications.', 'Admin')
  ");
  
  $db->exec("
    INSERT INTO comments (post_id, author, content) VALUES
    (1, 'User1', 'This is amazing! PHP in the browser without a server.'),
    (1, 'User2', 'I never thought this would be possible!'),
    (2, 'User3', 'The possibilities are endless with this technology.'),
    (3, 'User4', 'Decentralized apps are the future of the web.')
  ");
}

// Handle form submissions
$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (isset($_POST['action'])) {
    // Add new post
    if ($_POST['action'] === 'add_post') {
      $title = trim($_POST['title'] ?? '');
      $content = trim($_POST['content'] ?? '');
      $author = trim($_POST['author'] ?? 'Anonymous');
      
      if (empty($title) || empty($content)) {
        $message = '<div class="alert alert-danger">Please fill in all required fields.</div>';
      } else {
        $stmt = $db->prepare('INSERT INTO posts (title, content, author) VALUES (:title, :content, :author)');
        $stmt->bindValue(':title', $title, SQLITE3_TEXT);
        $stmt->bindValue(':content', $content, SQLITE3_TEXT);
        $stmt->bindValue(':author', $author, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        if ($result) {
          $message = '<div class="alert alert-success">Post added successfully!</div>';
          // Redirect to avoid form resubmission
          header("Location: " . $_SERVER['PHP_SELF']);
          exit;
        } else {
          $message = '<div class="alert alert-danger">Failed to add post.</div>';
        }
      }
    }
    
    // Add new comment
    if ($_POST['action'] === 'add_comment') {
      $postId = intval($_POST['post_id'] ?? 0);
      $content = trim($_POST['content'] ?? '');
      $author = trim($_POST['author'] ?? 'Anonymous');
      
      if (empty($content) || $postId === 0) {
        $message = '<div class="alert alert-danger">Please fill in all required fields.</div>';
      } else {
        $stmt = $db->prepare('INSERT INTO comments (post_id, author, content) VALUES (:post_id, :author, :content)');
        $stmt->bindValue(':post_id', $postId, SQLITE3_INTEGER);
        $stmt->bindValue(':content', $content, SQLITE3_TEXT);
        $stmt->bindValue(':author', $author, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        if ($result) {
          $message = '<div class="alert alert-success">Comment added successfully!</div>';
          // Redirect to avoid form resubmission
          header("Location: " . $_SERVER['PHP_SELF'] . "?view=post&id=" . $postId);
          exit;
        } else {
          $message = '<div class="alert alert-danger">Failed to add comment.</div>';
        }
      }
    }
  }
}

// Determine the current view
$view = $_GET['view'] ?? 'home';
$postId = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Helper function to format dates
function formatDate($dateString) {
  $date = new DateTime($dateString);
  return $date->format('F j, Y, g:i a');
}

// Helper function to generate a preview of content
function getPreview($content, $length = 150) {
  if (function_exists('mb_substr')) {
    if (mb_strlen($content, 'UTF-8') <= $length) {
      return $content;
    }
    return mb_substr($content, 0, $length, 'UTF-8') . '...';
  } else {
    // Fallback for non-mbstring environments (less ideal for UTF-8)
    if (strlen($content) <= $length) {
      return $content;
    }
    return substr($content, 0, $length) . '...';
  }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PHP-WASM Blog Demo</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <!-- Custom CSS -->
  <style>
    body {
      background-color: #f8f9fa;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .navbar {
      background-color: rgba(13, 110, 253, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    
    .card {
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
      border: none;
    }
    
    .card-header {
      background-color: rgba(13, 110, 253, 0.1);
      border-bottom: 1px solid rgba(13, 110, 253, 0.2);
      padding: 15px 20px;
    }
    
    .blog-title {
      font-size: 2.5rem;
      background: linear-gradient(45deg, #0d6efd, #6610f2);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-bottom: 0;
    }
    
    .post-meta {
      font-size: 0.9rem;
      color: #6c757d;
    }
    
    .comment {
      background-color: rgba(248, 249, 250, 0.5);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 3px solid #0d6efd;
    }
    
    .btn-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
    
    .btn-primary:hover {
      background-color: #0b5ed7;
      border-color: #0a58ca;
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar navbar-expand-lg navbar-dark mb-4">
    <div class="container">
      <a class="navbar-brand" href="?view=home">PHP-WASM Blog</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link <?php echo $view === 'home' ? 'active' : ''; ?>" href="?view=home">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo $view === 'new_post' ? 'active' : ''; ?>" href="?view=new_post">New Post</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo $view === 'about' ? 'active' : ''; ?>" href="?view=about">About</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  
  <div class="container mb-5">
    <!-- Display flash messages -->
    <?php echo $message; ?>
    
    <!-- Main Content -->
    <?php if ($view === 'home'): ?>
      <div class="row">
        <div class="col-md-8">
          <h1 class="blog-title mb-4">Latest Posts</h1>
          
          <?php
          $posts = $db->query('SELECT * FROM posts ORDER BY created_at DESC');
          while ($post = $posts->fetchArray(SQLITE3_ASSOC)):
          ?>
            <div class="card mb-4">
              <div class="card-header">
                <h2 class="card-title">
                  <a href="?view=post&id=<?php echo $post['id']; ?>" class="text-decoration-none">
                    <?php echo htmlspecialchars($post['title']); ?>
                  </a>
                </h2>
                <div class="post-meta">
                  By <?php echo htmlspecialchars($post['author']); ?> on 
                  <?php echo formatDate($post['created_at']); ?>
                </div>
              </div>
              <div class="card-body">
                <p class="card-text">
                  <?php echo nl2br(htmlspecialchars(getPreview($post['content']))); ?>
                </p>
                <a href="?view=post&id=<?php echo $post['id']; ?>" class="btn btn-primary">Read More</a>
              </div>
            </div>
          <?php endwhile; ?>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h3>About This Blog</h3>
            </div>
            <div class="card-body">
              <p>This is a demo blog built with PHP-WASM. It runs entirely in your browser - no server required!</p>
              <p>PHP-WASM allows you to run PHP applications client-side, making it perfect for decentralized apps.</p>
            </div>
          </div>
        </div>
      </div>
    
    <?php elseif ($view === 'post' && $postId > 0): ?>
      <?php
      $stmt = $db->prepare('SELECT * FROM posts WHERE id = :id');
      $stmt->bindValue(':id', $postId, SQLITE3_INTEGER);
      $post = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
      
      if ($post):
      ?>
        <div class="row">
          <div class="col-md-8">
            <div class="card mb-4">
              <div class="card-header">
                <h1 class="card-title"><?php echo htmlspecialchars($post['title']); ?></h1>
                <div class="post-meta">
                  By <?php echo htmlspecialchars($post['author']); ?> on 
                  <?php echo formatDate($post['created_at']); ?>
                </div>
              </div>
              <div class="card-body">
                <div class="post-content mb-4">
                  <?php echo nl2br(htmlspecialchars($post['content'])); ?>
                </div>
                
                <hr>
                
                <h3>Comments</h3>
                <?php
                $stmt = $db->prepare('SELECT * FROM comments WHERE post_id = :post_id ORDER BY created_at ASC');
                $stmt->bindValue(':post_id', $postId, SQLITE3_INTEGER);
                $comments = $stmt->execute();
                
                $hasComments = false;
                while ($comment = $comments->fetchArray(SQLITE3_ASSOC)):
                  $hasComments = true;
                ?>
                  <div class="comment">
                    <div class="comment-meta mb-2">
                      <strong><?php echo htmlspecialchars($comment['author']); ?></strong> on 
                      <?php echo formatDate($comment['created_at']); ?>
                    </div>
                    <div class="comment-content">
                      <?php echo nl2br(htmlspecialchars($comment['content'])); ?>
                    </div>
                  </div>
                <?php endwhile; ?>
                
                <?php if (!$hasComments): ?>
                  <p>No comments yet. Be the first to comment!</p>
                <?php endif; ?>
                
                <div class="card mt-4">
                  <div class="card-header">
                    <h4>Add a Comment</h4>
                  </div>
                  <div class="card-body">
                    <form method="post">
                      <input type="hidden" name="action" value="add_comment">
                      <input type="hidden" name="post_id" value="<?php echo $postId; ?>">
                      
                      <div class="mb-3">
                        <label for="author" class="form-label">Your Name</label>
                        <input type="text" class="form-control" id="author" name="author" required>
                      </div>
                      
                      <div class="mb-3">
                        <label for="content" class="form-label">Comment</label>
                        <textarea class="form-control" id="content" name="content" rows="3" required></textarea>
                      </div>
                      
                      <button type="submit" class="btn btn-primary">Submit Comment</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="card sticky-top" style="top: 20px;">
              <div class="card-header">
                <h3>Recent Posts</h3>
              </div>
              <div class="card-body">
                <ul class="list-unstyled">
                  <?php
                  $recentPosts = $db->query('SELECT id, title FROM posts ORDER BY created_at DESC LIMIT 5');
                  while ($recentPost = $recentPosts->fetchArray(SQLITE3_ASSOC)):
                  ?>
                    <li class="mb-2">
                      <a href="?view=post&id=<?php echo $recentPost['id']; ?>" class="text-decoration-none">
                        <?php echo htmlspecialchars($recentPost['title']); ?>
                      </a>
                    </li>
                  <?php endwhile; ?>
                </ul>
              </div>
            </div>
          </div>
        </div>
      <?php else: ?>
        <div class="alert alert-warning">Post not found.</div>
        <a href="?view=home" class="btn btn-primary">Back to Home</a>
      <?php endif; ?>
    
    <?php elseif ($view === 'new_post'): ?>
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h2>Create New Post</h2>
            </div>
            <div class="card-body">
              <form method="post">
                <input type="hidden" name="action" value="add_post">
                
                <div class="mb-3">
                  <label for="title" class="form-label">Title</label>
                  <input type="text" class="form-control" id="title" name="title" required>
                </div>
                
                <div class="mb-3">
                  <label for="author" class="form-label">Author</label>
                  <input type="text" class="form-control" id="author" name="author" required>
                </div>
                
                <div class="mb-3">
                  <label for="content" class="form-label">Content</label>
                  <textarea class="form-control" id="content" name="content" rows="10" required></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary">Publish Post</button>
              </form>
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h3>Posting Guidelines</h3>
            </div>
            <div class="card-body">
              <ul>
                <li>Be respectful and constructive.</li>
                <li>Use proper formatting for readability.</li>
                <li>You can use multiple paragraphs in your content.</li>
                <li>All posts are stored in your browser using PHP-WASM's virtual filesystem.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    
    <?php elseif ($view === 'about'): ?>
      <div class="card">
        <div class="card-header">
          <h1>About PHP-WASM Blog</h1>
        </div>
        <div class="card-body">
          <h3>What is PHP-WASM?</h3>
          <p>PHP-WASM is a groundbreaking technology that allows PHP to run directly in web browsers using WebAssembly. This eliminates the need for a traditional server, making it possible to create fully client-side PHP applications.</p>
          
          <h3>How This Demo Works</h3>
          <p>This blog demo showcases the capabilities of PHP-WASM. All PHP code executes in your browser, and data is stored in a virtual SQLite database using PHP-WASM's virtual filesystem. In a real application, this could be combined with decentralized storage like Cubbit DS3 to create fully decentralized web applications.</p>
          
          <h3>Technical Features</h3>
          <ul>
            <li>Client-side PHP execution via WebAssembly</li>
            <li>SQLite database using PHP's SQLite3 extension</li>
            <li>PHP sessions for state management</li>
            <li>All data stored locally in your browser</li>
            <li>No server required - everything runs in the client</li>
          </ul>
          
          <h3>Built With</h3>
          <ul>
            <li>PHP-WASM</li>
            <li>Bootstrap 5</li>
            <li>SQLite</li>
            <li>PHP-WASM Builder</li>
          </ul>
        </div>
      </div>
    <?php endif; ?>
  </div>
  
  <footer class="bg-dark text-white text-center py-4 mt-auto">
    <div class="container">
      <p class="mb-0">PHP-WASM Blog Demo &copy; <?php echo date("Y"); ?> | Built with PHP-WASM Builder</p>
      <p class="small mb-0">Runs entirely in your browser - no server required!</p>
    </div>
  </footer>
  
  <!-- Bootstrap JS Bundle -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
