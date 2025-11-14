const http = require('http');
const fs = require('fs');
const path = require('path');

// Load responses from CSV file at startup
let responses = [];
try {
  const csvData = fs.readFileSync('responses.csv', 'utf8');
  const lines = csvData.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const parts = line.split(',');
      const keyword = parts[0].trim();
      const response = parts[1].trim();
      let redirect = '';
      if (parts[2]) {
        redirect = parts[2].trim();
      }
      
      responses.push({
        keyword: keyword,
        response: response,
        redirect: redirect
      });
    }
  }
  console.log('Loaded responses:', responses);
} catch (err) {
  console.error('Error loading responses.csv:', err);
}

// Find matching response based on keyword
function findResponse(userMessage) {
  const msg = userMessage.toLowerCase();
  
  for (let i = 0; i < responses.length; i++) {
    const item = responses[i];
    const keyword = item.keyword.toLowerCase();

    if (msg.includes(keyword)) {
      // if joke, then tell the user the punchline!
      if (keyword === 'joke') {
        const punchline = item.response + (item.redirect ? ' ' + item.redirect : '');
        return {
          message: punchline,
          redirect: ''
        };
      }
      return {
        message: item.response,
        redirect: item.redirect
      };
    }
  }
  
  return {
    message: "I didn't catch that.",
    redirect: ''
  };
} 

// Need to run a check for if the keyword is joke to not prompt a redirect, because its parts[2] is more text, not a path

// Create HTTP server
const server = http.createServer(function(req, res) {
  console.log('Request:', req.method, req.url);
  
  // Handle POST /chat endpoint
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    
    req.on('data', function(chunk) {
      body = body + chunk.toString();
    });
    
    req.on('end', function() {
      try {
        const data = JSON.parse(body);
        const message = data.message;
        const response = findResponse(message);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid request', redirect: '' }));
      }
    });
    return;
  }
  
  // Serve static files
  let filePath;
  
  if (req.url === '/') {
    filePath = path.join(__dirname, 'public', 'index.html');
  } else {
    const reqPath = req.url.substring(1);
    filePath = path.join(__dirname, reqPath);
  }
  
  console.log('Trying to serve:', filePath);
  
  fs.readFile(filePath, function(err, data) {
    if (err) {
      console.error('File not found:', filePath);
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
    
    const ext = path.extname(filePath);
    let contentType = 'text/plain';
    
    if (ext === '.html') {
      contentType = 'text/html';
    }
    if (ext === '.css') {
      contentType = 'text/css';
    }
    if (ext === '.js') {
      contentType = 'application/javascript';
    }
    if (ext === '.csv') {
      contentType = 'text/csv';
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(3000, function() {
  console.log('Server running at http://localhost:3000/');
});