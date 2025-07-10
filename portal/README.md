# MCP Server Portal

A modern web portal for browsing and managing your Model Context Protocol (MCP) servers. This portal provides a beautiful interface to discover, configure, and deploy MCP servers similar to cursor.directory.

## Features

### 🎯 Browse MCP Servers
- **Visual Server Cards**: Beautiful cards displaying server information
- **Search & Filter**: Find servers by name, description, or keywords
- **Category Filtering**: Filter servers by category (time, utility, API, etc.)
- **Server Details**: Comprehensive information about each server

### 📋 Server Management
- **Copy Configuration**: One-click copy of Claude Desktop configurations
- **Installation Guide**: Step-by-step instructions for each server
- **Documentation**: Integrated README viewing
- **Server Status**: Live server information and metadata

### 🎨 Modern Interface
- **Dark Theme**: Beautiful dark UI matching modern development tools
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Elements**: Smooth animations and transitions
- **Toast Notifications**: User-friendly feedback system

## Screenshots

The portal provides a clean, professional interface similar to cursor.directory with:
- Featured server cards with icons and descriptions
- Search and filtering capabilities
- Detailed server information modals
- Configuration copy functionality
- Installation instructions

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MCP servers in the `../servers/` directory

### Installation

1. **Navigate to portal directory**
   ```bash
   cd portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## Usage

### Browsing Servers
1. Visit the portal in your browser
2. Browse available MCP servers on the main page
3. Use the search bar to find specific servers
4. Filter by categories using the dropdown

### Server Details
1. Click on any server card to view details
2. View server information, features, and documentation
3. Copy the configuration for Claude Desktop
4. Follow the installation instructions

### Adding Server to Claude Desktop
1. Click "Copy Config" on any server card
2. Open Claude Desktop settings
3. Navigate to the MCP configuration section
4. Paste the configuration
5. Restart Claude Desktop

## Portal Structure

```
portal/
├── package.json          # Dependencies and scripts
├── server.js             # Express server
├── public/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Styling
│   └── script.js         # Frontend JavaScript
└── README.md            # This file
```

## API Endpoints

The portal provides several API endpoints:

- `GET /api/servers` - List all available servers
- `GET /api/servers/:id` - Get detailed server information
- `GET /api/servers/:id/readme` - Get server README content

## Customization

### Adding New Server Categories
Update the category filter in `public/index.html`:
```html
<select id="categoryFilter">
    <option value="">All Categories</option>
    <option value="your-category">Your Category</option>
</select>
```

### Custom Server Icons
The portal automatically assigns icons based on server names and keywords. You can customize the icon logic in `public/script.js` in the `getServerIcon()` function.

### Styling
All styles are in `public/styles.css`. The portal uses:
- CSS Grid for responsive layouts
- CSS Custom Properties for theming
- Modern CSS features like `backdrop-filter`

## Server Detection

The portal automatically scans the `../servers/` directory for MCP servers. It looks for:
- `package.json` files to extract server metadata
- `README.md` files for documentation
- Build scripts and dependencies

### Server Requirements
For optimal detection, your MCP servers should have:
- A `package.json` with name, description, and keywords
- A `README.md` with feature descriptions
- Build scripts (typically `npm run build`)
- A `build/` directory with the compiled server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see package.json for details

## Related Projects

- [Model Context Protocol](https://github.com/anthropics/model-context-protocol)
- [Claude Desktop](https://claude.ai/desktop)
- [MCP Servers](https://github.com/anthropics/mcp-servers)

## Support

For issues or questions:
1. Check the server logs in the console
2. Verify your MCP servers are properly configured
3. Ensure all dependencies are installed
4. Check that the servers directory exists and contains valid MCP servers

## Future Features

- Server creation wizard
- Server templates
- Configuration validation
- Server testing interface
- Export/import configurations
- Server analytics and monitoring 