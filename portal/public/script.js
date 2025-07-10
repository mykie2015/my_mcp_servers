// Global state
let servers = [];
let filteredServers = [];
let currentServer = null;

// DOM elements
const serversGrid = document.getElementById('serversGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const serverModal = document.getElementById('serverModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupSearch();
    fetchServers();
    setupModalHandlers();
});

// Navigation setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSectionElement = document.getElementById(targetSection);
            if (targetSectionElement) {
                targetSectionElement.classList.add('active');
            }
        });
    });
}

// Search and filter setup
function setupSearch() {
    searchInput.addEventListener('input', handleSearch);
    categoryFilter.addEventListener('change', handleSearch);
}

function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value.toLowerCase();
    
    filteredServers = servers.filter(server => {
        const matchesSearch = !searchTerm || 
            server.name.toLowerCase().includes(searchTerm) ||
            server.description.toLowerCase().includes(searchTerm) ||
            server.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory ||
            server.keywords.some(keyword => keyword.toLowerCase().includes(selectedCategory));
        
        return matchesSearch && matchesCategory;
    });
    
    renderServers();
}

// Fetch servers from API
async function fetchServers() {
    try {
        showLoading();
        const response = await fetch('/api/servers');
        
        if (!response.ok) {
            throw new Error('Failed to fetch servers');
        }
        
        servers = await response.json();
        filteredServers = [...servers];
        renderServers();
    } catch (error) {
        console.error('Error fetching servers:', error);
        showError('Failed to load servers. Please try again.');
    }
}

// Show loading state
function showLoading() {
    serversGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading MCP servers...</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    serversGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Render servers
function renderServers() {
    if (filteredServers.length === 0) {
        serversGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i>
                <p>No servers found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    serversGrid.innerHTML = filteredServers.map(server => createServerCard(server)).join('');
}

// Create server card HTML
function createServerCard(server) {
    const cardConfig = server.card || {};
    const serverIcon = cardConfig.icon || getServerIcon(server);
    const features = cardConfig.features || server.features || [];
    const displayFeatures = features.slice(0, 3); // Show first 3 features
    const hasMoreFeatures = features.length > 3;
    const shortDescription = cardConfig.shortDescription || server.description;
    
    return `
        <div class="server-card" onclick="showServerDetails('${server.id}')">
            <div class="server-header">
                <div class="server-icon" style="background: ${cardConfig.color || '#3b82f6'}">
                    ${serverIcon.includes('fa-') ? `<i class="${serverIcon}"></i>` : serverIcon}
                </div>
                <div class="server-version">v${server.version}</div>
            </div>
            
            <h3 class="server-title">${server.name}</h3>
            <p class="server-description">${shortDescription}</p>
            
            <div class="server-features">
                ${displayFeatures.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                ${hasMoreFeatures ? `<span class="feature-tag">+${features.length - 3} more</span>` : ''}
            </div>
            
            <div class="server-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); copyServerConfig('${server.id}')">
                    <i class="fas fa-copy"></i>
                    Copy Config
                </button>
                ${server.inspector?.enabled !== false ? `
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); runInspector('${server.id}')">
                        <i class="fas fa-search"></i>
                        Inspector
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="event.stopPropagation(); showServerDetails('${server.id}')">
                    <i class="fas fa-info-circle"></i>
                    Details
                </button>
            </div>
        </div>
    `;
}

// Get server icon based on server type
function getServerIcon(server) {
    const name = server.name.toLowerCase();
    const keywords = server.keywords.join(' ').toLowerCase();
    
    if (name.includes('time') || keywords.includes('time')) {
        return '<i class="fas fa-clock"></i>';
    } else if (name.includes('weather') || keywords.includes('weather')) {
        return '<i class="fas fa-cloud-sun"></i>';
    } else if (name.includes('database') || keywords.includes('database')) {
        return '<i class="fas fa-database"></i>';
    } else if (name.includes('api') || keywords.includes('api')) {
        return '<i class="fas fa-plug"></i>';
    } else if (name.includes('file') || keywords.includes('file')) {
        return '<i class="fas fa-file"></i>';
    } else {
        return server.name.charAt(0).toUpperCase();
    }
}

// Show server details in modal
async function showServerDetails(serverId) {
    try {
        const server = servers.find(s => s.id === serverId);
        if (!server) return;
        
        currentServer = server;
        modalTitle.textContent = server.name;
        
        // Show basic details first
        modalBody.innerHTML = `
            <div class="server-detail-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading server details...</p>
            </div>
        `;
        
        serverModal.classList.add('active');
        
        // Fetch detailed information
        const response = await fetch(`/api/servers/${serverId}`);
        const detailedServer = await response.json();
        
        // Try to fetch README
        let readmeContent = '';
        try {
            const readmeResponse = await fetch(`/api/servers/${serverId}/readme`);
            if (readmeResponse.ok) {
                const readmeData = await readmeResponse.json();
                readmeContent = readmeData.content;
            }
        } catch (error) {
            console.log('No README available for', serverId);
        }
        
        modalBody.innerHTML = createServerDetailHTML(detailedServer, readmeContent);
        
    } catch (error) {
        console.error('Error showing server details:', error);
        modalBody.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load server details.</p>
            </div>
        `;
    }
}

// Create server detail HTML
function createServerDetailHTML(server, readmeContent) {
    const details = server.details || {};
    const configExample = generateConfigExample(server);
    const installInstructions = generateInstallInstructions(server);
    
    return `
        <div class="server-details">
            <div class="detail-section">
                <h3><i class="fas fa-info-circle"></i> About</h3>
                <p>${details.overview || server.description}</p>
                
                <div class="detail-info">
                    <div class="info-item">
                        <strong>Version:</strong> ${server.version}
                    </div>
                    <div class="info-item">
                        <strong>Author:</strong> ${server.author}
                    </div>
                    <div class="info-item">
                        <strong>License:</strong> ${server.license}
                    </div>
                    <div class="info-item">
                        <strong>Category:</strong> ${server.category || 'utility'}
                    </div>
                </div>
            </div>
            
            ${details.capabilities && details.capabilities.length > 0 ? `
                <div class="detail-section">
                    <h3><i class="fas fa-star"></i> Capabilities</h3>
                    <ul>
                        ${details.capabilities.map(capability => `<li>${capability}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${details.tools && details.tools.length > 0 ? `
                <div class="detail-section">
                    <h3><i class="fas fa-tools"></i> Tools</h3>
                    <div class="tools-list">
                        ${details.tools.map(tool => `
                            <div class="tool-item">
                                <strong>${tool.name}</strong>
                                <p>${tool.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${details.prompts && details.prompts.length > 0 ? `
                <div class="detail-section">
                    <h3><i class="fas fa-comment-dots"></i> Prompts</h3>
                    <div class="prompts-list">
                        ${details.prompts.map(prompt => `
                            <div class="prompt-item">
                                <strong>${prompt.name}</strong>
                                <p>${prompt.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${details.resources && details.resources.length > 0 ? `
                <div class="detail-section">
                    <h3><i class="fas fa-database"></i> Resources</h3>
                    <div class="resources-list">
                        ${details.resources.map(resource => `
                            <div class="resource-item">
                                <strong>${resource.name}</strong>
                                <p>${resource.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${(server.card?.features || server.features || []).length > 0 ? `
                <div class="detail-section">
                    <h3><i class="fas fa-tags"></i> Features</h3>
                    <div class="features-list">
                        ${(server.card?.features || server.features || []).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h3><i class="fas fa-cog"></i> Configuration</h3>
                <p>Add this configuration to your Claude Desktop config:</p>
                <div class="code-block">
                    <button class="copy-btn" onclick="copyToClipboard(this.nextElementSibling.textContent)">
                        <i class="fas fa-copy"></i>
                    </button>
                    <pre><code>${configExample}</code></pre>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-download"></i> Installation</h3>
                <div class="install-steps">
                    ${installInstructions}
                </div>
            </div>
            
            ${readmeContent ? `
                <div class="detail-section">
                    <h3><i class="fas fa-book"></i> Documentation</h3>
                    <div class="readme-content">
                        <pre>${readmeContent}</pre>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Generate configuration example
function generateConfigExample(server) {
    const serverPath = server.path.replace(/\\/g, '/');
    const config = server.configuration?.claude_desktop || {
        command: "node",
        args: [`${serverPath}/build/index.js`],
        env: {}
    };
    
    // Update the args to use the full path
    const updatedConfig = {
        ...config,
        args: config.args.map(arg => arg.includes('/') ? arg : `${serverPath}/${arg}`)
    };
    
    return JSON.stringify({
        mcpServers: {
            [server.id]: updatedConfig
        }
    }, null, 2);
}

// Generate installation instructions
function generateInstallInstructions(server) {
    const installation = server.installation || {};
    const steps = installation.steps || [
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
    ];
    
    let stepNumber = 1;
    let stepsHTML = `
        <div class="install-step">
            <div class="step-number">${stepNumber++}</div>
            <div class="step-content">
                <h4>Navigate to server directory</h4>
                <div class="code-block">
                    <button class="copy-btn" onclick="copyToClipboard('cd ${server.path}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <code>cd ${server.path}</code>
                </div>
            </div>
        </div>
    `;
    
    steps.forEach(step => {
        stepsHTML += `
            <div class="install-step">
                <div class="step-number">${stepNumber++}</div>
                <div class="step-content">
                    <h4>${step.title}</h4>
                    ${step.command ? `
                        <div class="code-block">
                            <button class="copy-btn" onclick="copyToClipboard('${step.command}')">
                                <i class="fas fa-copy"></i>
                            </button>
                            <code>${step.command}</code>
                        </div>
                    ` : ''}
                    <p>${step.description}</p>
                </div>
            </div>
        `;
    });
    
    stepsHTML += `
        <div class="install-step">
            <div class="step-number">${stepNumber}</div>
            <div class="step-content">
                <h4>Add to Claude Desktop</h4>
                <p>Copy the configuration above and add it to your Claude Desktop settings.</p>
            </div>
        </div>
    `;
    
    return stepsHTML;
}

// Copy server configuration to clipboard
async function copyServerConfig(serverId) {
    try {
        const server = servers.find(s => s.id === serverId);
        if (!server) return;
        
        const config = generateConfigExample(server);
        await navigator.clipboard.writeText(config);
        
        // Show success feedback
        showToast('Configuration copied to clipboard!', 'success');
    } catch (error) {
        console.error('Error copying config:', error);
        showToast('Failed to copy configuration', 'error');
    }
}

// Run MCP Inspector for a server
async function runInspector(serverId) {
    try {
        const server = servers.find(s => s.id === serverId);
        if (!server) return;
        
        const inspector = server.inspector || {};
        const inspectorCommand = `cd "${server.path}" && ${inspector.command || 'npm run inspector'}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(inspectorCommand);
        
        // Show instructions
        showInspectorInstructions(inspectorCommand, server);
        
    } catch (error) {
        console.error('Error running inspector:', error);
        showToast('Failed to prepare inspector command', 'error');
    }
}

// Show inspector instructions in modal
function showInspectorInstructions(command, server) {
    const inspector = server.inspector || {};
    const examples = inspector.examples || [];
    
    modalTitle.textContent = 'MCP Inspector';
    modalBody.innerHTML = `
        <div class="inspector-instructions">
            <div class="instruction-section">
                <h3><i class="fas fa-terminal"></i> Run Inspector</h3>
                <p>${inspector.description || 'The inspector command has been copied to your clipboard. Follow these steps:'}</p>
                
                <div class="instruction-steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Open Terminal</h4>
                            <p>Open a new terminal window or tab</p>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Paste and Run Command</h4>
                            <div class="code-block">
                                <button class="copy-btn" onclick="copyToClipboard('${command}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <pre><code>${command}</code></pre>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Test Your Server</h4>
                            <p>The inspector will start and provide a web interface to test your MCP server's tools, prompts, and resources.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            ${examples.length > 0 ? `
                <div class="instruction-section">
                    <h3><i class="fas fa-play-circle"></i> Example Usage</h3>
                    <p>Try these examples once the inspector is running:</p>
                    <div class="inspector-examples">
                        ${examples.map(example => `
                            <div class="example-item">
                                <h4>${example.tool}</h4>
                                <p>${example.description}</p>
                                <div class="code-block">
                                    <button class="copy-btn" onclick="copyToClipboard('${JSON.stringify(example.params, null, 2)}')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <pre><code>${JSON.stringify(example.params, null, 2)}</code></pre>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="instruction-section">
                <h3><i class="fas fa-info-circle"></i> About MCP Inspector</h3>
                <p>The MCP Inspector is a debugging tool that allows you to:</p>
                <ul>
                    <li>Test server tools and see their outputs</li>
                    <li>Browse available prompts and resources</li>
                    <li>Debug server communication</li>
                    <li>Validate server responses</li>
                </ul>
            </div>
        </div>
    `;
    
    serverModal.classList.add('active');
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast('Failed to copy', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Add toast styles if not already present
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #1f1f1f;
                color: #ffffff;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                border: 1px solid #374151;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            }
            
            .toast-success {
                border-color: #10b981;
                color: #10b981;
            }
            
            .toast-error {
                border-color: #ef4444;
                color: #ef4444;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Modal handlers
function setupModalHandlers() {
    // Close modal when clicking outside
    serverModal.addEventListener('click', function(e) {
        if (e.target === serverModal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && serverModal.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    serverModal.classList.remove('active');
    currentServer = null;
}

// Create new server (placeholder function)
function createServer() {
    const name = document.getElementById('serverName').value;
    const description = document.getElementById('serverDescription').value;
    const keywords = document.getElementById('serverKeywords').value;
    
    if (!name || !description) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    showToast('Server creation feature coming soon!', 'info');
    
    // Clear form
    document.getElementById('serverName').value = '';
    document.getElementById('serverDescription').value = '';
    document.getElementById('serverKeywords').value = '';
}

// Add additional styles for server details
const detailStyles = `
    .server-details {
        color: #ffffff;
    }
    
    .detail-section {
        margin-bottom: 2rem;
    }
    
    .detail-section h3 {
        margin-bottom: 1rem;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .detail-section h3 i {
        color: #3b82f6;
    }
    
    .detail-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .info-item {
        background: #2a2a2a;
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid #374151;
    }
    
    .info-item strong {
        color: #3b82f6;
    }
    
    .features-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .code-block {
        background: #1a1a1a;
        border: 1px solid #374151;
        border-radius: 0.5rem;
        position: relative;
        margin: 1rem 0;
    }
    
    .code-block pre {
        margin: 0;
        padding: 1rem;
        overflow-x: auto;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
    }
    
    .copy-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: #374151;
        border: none;
        color: #9ca3af;
        padding: 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.3s ease;
    }
    
    .copy-btn:hover {
        background: #4b5563;
        color: #ffffff;
    }
    
    .install-steps {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .install-step {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .step-number {
        background: #3b82f6;
        color: #ffffff;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
    }
    
    .step-content {
        flex: 1;
    }
    
    .step-content h4 {
        margin-bottom: 0.5rem;
        color: #ffffff;
    }
    
    .readme-content {
        background: #1a1a1a;
        border: 1px solid #374151;
        border-radius: 0.5rem;
        padding: 1rem;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .readme-content pre {
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        white-space: pre-wrap;
        color: #e5e7eb;
        margin: 0;
    }
    
    .server-detail-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        color: #9ca3af;
    }
    
    .server-detail-loading i {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
    
    .error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        color: #ef4444;
    }
    
    .error i {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
`;

// Add the styles to the page
if (!document.getElementById('detail-styles')) {
    const style = document.createElement('style');
    style.id = 'detail-styles';
    style.textContent = detailStyles;
    document.head.appendChild(style);
} 