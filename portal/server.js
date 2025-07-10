const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Function to scan MCP servers
function scanMCPServers() {
  const serversDir = path.join(__dirname, '..', 'servers');
  const servers = [];
  
  try {
    const serverFolders = fs.readdirSync(serversDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const folder of serverFolders) {
      const serverPath = path.join(serversDir, folder);
      const packageJsonPath = path.join(serverPath, 'package.json');
      const configPath = path.join(serverPath, 'mcp-config.json');
      const readmePath = path.join(serverPath, 'README.md');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          let serverConfig = null;
          
          // Try to read MCP config file first
          if (fs.existsSync(configPath)) {
            try {
              serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch (configError) {
              console.error(`Error reading mcp-config.json for ${folder}:`, configError);
            }
          }
          
          const readmeContent = fs.existsSync(readmePath) 
            ? fs.readFileSync(readmePath, 'utf8').substring(0, 300) 
            : '';
          
          // Use config data if available, otherwise fall back to package.json
          if (serverConfig) {
            servers.push({
              id: serverConfig.id || folder,
              name: serverConfig.name || packageJson.name || folder,
              version: serverConfig.version || packageJson.version || '1.0.0',
              description: serverConfig.description || packageJson.description || 'No description available',
              keywords: serverConfig.keywords || packageJson.keywords || [],
              author: serverConfig.author || packageJson.author || 'Unknown',
              license: serverConfig.license || packageJson.license || 'MIT',
              category: serverConfig.category || 'utility',
              path: serverPath,
              
              // Card display information
              card: serverConfig.card || {
                icon: getDefaultIcon(folder),
                color: '#3b82f6',
                shortDescription: serverConfig.description || packageJson.description || 'No description available',
                features: extractFeatures(readmeContent, packageJson),
                tags: serverConfig.keywords || packageJson.keywords || []
              },
              
              // Detailed information
              details: serverConfig.details || {
                overview: serverConfig.description || packageJson.description || 'No description available',
                capabilities: [],
                tools: [],
                prompts: [],
                resources: []
              },
              
              // Installation information
              installation: serverConfig.installation || {
                dependencies: packageJson.dependencies || {},
                devDependencies: packageJson.devDependencies || {},
                steps: [
                  {
                    title: "Install dependencies",
                    command: "npm install",
                    description: "Install all required dependencies"
                  },
                  {
                    title: "Build the server",
                    command: "npm run build",
                    description: "Compile TypeScript to JavaScript"
                  }
                ]
              },
              
              // Inspector configuration
              inspector: serverConfig.inspector || {
                enabled: true,
                command: "npm run inspector",
                description: `Test the ${serverConfig.name || packageJson.name || folder} with the MCP Inspector`,
                examples: []
              },
              
              // Configuration
              configuration: serverConfig.configuration || {
                claude_desktop: {
                  command: "node",
                  args: ["build/index.js"],
                  env: {}
                }
              },
              
              // Legacy fields for backward compatibility
              features: serverConfig.card?.features || extractFeatures(readmeContent, packageJson),
              readme: readmeContent,
              hasReadme: fs.existsSync(readmePath),
              scripts: packageJson.scripts || {},
              dependencies: packageJson.dependencies || {}
            });
          } else {
            // Fallback to old format if no config file
            const features = extractFeatures(readmeContent, packageJson);
            
            servers.push({
              id: folder,
              name: packageJson.name || folder,
              version: packageJson.version || '1.0.0',
              description: packageJson.description || 'No description available',
              keywords: packageJson.keywords || [],
              author: packageJson.author || 'Unknown',
              license: packageJson.license || 'MIT',
              category: 'utility',
              path: serverPath,
              
              // Default card information
              card: {
                icon: getDefaultIcon(folder),
                color: '#3b82f6',
                shortDescription: packageJson.description || 'No description available',
                features: features,
                tags: packageJson.keywords || []
              },
              
              // Default detailed information
              details: {
                overview: packageJson.description || 'No description available',
                capabilities: [],
                tools: [],
                prompts: [],
                resources: []
              },
              
              // Default installation
              installation: {
                dependencies: packageJson.dependencies || {},
                devDependencies: packageJson.devDependencies || {},
                steps: [
                  {
                    title: "Install dependencies", 
                    command: "npm install",
                    description: "Install all required dependencies"
                  },
                  {
                    title: "Build the server",
                    command: "npm run build", 
                    description: "Compile TypeScript to JavaScript"
                  }
                ]
              },
              
              // Default inspector
              inspector: {
                enabled: true,
                command: "npm run inspector",
                description: `Test the ${packageJson.name || folder} with the MCP Inspector`,
                examples: []
              },
              
              // Default configuration
              configuration: {
                claude_desktop: {
                  command: "node",
                  args: ["build/index.js"],
                  env: {}
                }
              },
              
              // Legacy fields
              features: features,
              readme: readmeContent,
              hasReadme: fs.existsSync(readmePath),
              scripts: packageJson.scripts || {},
              dependencies: packageJson.dependencies || {}
            });
          }
        } catch (error) {
          console.error(`Error reading configuration for ${folder}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error scanning servers directory:', error);
  }
  
  return servers;
}

// Function to get default icon based on server folder name
function getDefaultIcon(folderName) {
  const name = folderName.toLowerCase();
  
  if (name.includes('time')) {
    return 'fas fa-clock';
  } else if (name.includes('weather')) {
    return 'fas fa-cloud-sun';
  } else if (name.includes('database') || name.includes('db')) {
    return 'fas fa-database';
  } else if (name.includes('api')) {
    return 'fas fa-plug';
  } else if (name.includes('file')) {
    return 'fas fa-file';
  } else if (name.includes('web') || name.includes('http')) {
    return 'fas fa-globe';
  } else if (name.includes('git')) {
    return 'fab fa-git-alt';
  } else if (name.includes('mail') || name.includes('email')) {
    return 'fas fa-envelope';
  } else if (name.includes('chat') || name.includes('message')) {
    return 'fas fa-comment';
  } else if (name.includes('search')) {
    return 'fas fa-search';
  } else {
    return 'fas fa-server';
  }
}

// Function to extract features from README content
function extractFeatures(readmeContent, packageJson) {
  const features = [];
  
  // Extract from README
  if (readmeContent) {
    const lines = readmeContent.split('\n');
    for (const line of lines) {
      if (line.includes('- **') || line.includes('* **')) {
        const match = line.match(/\*\*([^*]+)\*\*/);
        if (match) {
          features.push(match[1]);
        }
      }
    }
  }
  
  // Extract from package.json keywords
  if (packageJson.keywords) {
    features.push(...packageJson.keywords);
  }
  
  return [...new Set(features)]; // Remove duplicates
}

// API Routes
app.get('/api/servers', (req, res) => {
  const servers = scanMCPServers();
  res.json(servers);
});

app.get('/api/servers/:id', (req, res) => {
  const servers = scanMCPServers();
  const server = servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  res.json(server);
});

// Get server README
app.get('/api/servers/:id/readme', (req, res) => {
  const servers = scanMCPServers();
  const server = servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  const readmePath = path.join(server.path, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    res.json({ content: readmeContent });
  } else {
    res.status(404).json({ error: 'README not found' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Server Portal running on http://localhost:${PORT}`);
  console.log(`📂 Scanning servers from: ${path.join(__dirname, '..', 'servers')}`);
  
  // Log discovered servers
  const servers = scanMCPServers();
  console.log(`📋 Found ${servers.length} MCP server(s):`);
  servers.forEach(server => {
    console.log(`   - ${server.name} (${server.version})`);
  });
}); 