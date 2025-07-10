# My MCP Servers

A comprehensive collection of Model Context Protocol (MCP) servers with a modern web portal for browsing and managing them. This repository provides both server implementations and tooling to make working with MCP servers easier.

## 🚀 Features

### Web Portal
- **Modern UI**: Beautiful dark theme interface similar to cursor.directory
- **Server Browser**: Visual cards displaying server information with search and filtering
- **Configuration Management**: One-click copy of Claude Desktop configurations
- **Installation Guides**: Step-by-step instructions for each server
- **Live Documentation**: Integrated README viewing and server status

### MCP Servers
- **Time MCP Server**: Comprehensive time and timezone conversion capabilities
- **Extensible Architecture**: Easy to add new MCP servers to the collection
- **TypeScript Support**: Modern development with full type safety
- **Production Ready**: Built and tested server implementations

## 📁 Project Structure

```
my_mcp_servers/
├── portal/                  # Web portal for managing MCP servers
│   ├── server.js           # Express server
│   ├── package.json        # Portal dependencies
│   └── public/             # Frontend assets
│       ├── index.html      # Main portal interface
│       ├── styles.css      # Modern dark theme styling
│       └── script.js       # Frontend JavaScript
├── servers/                # MCP server implementations
│   └── time-mcp/          # Time and timezone MCP server
│       ├── src/           # TypeScript source code
│       ├── build/         # Compiled JavaScript
│       └── package.json   # Server dependencies
├── clients/               # MCP client implementations
└── README.md             # This file
```

## 🛠️ Quick Start

### Portal Setup
1. **Navigate to portal directory**
   ```bash
   cd portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the portal**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Time MCP Server Setup
1. **Navigate to server directory**
   ```bash
   cd servers/time-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the server**
   ```bash
   npm run build
   ```

4. **Test the server**
   ```bash
   npm run inspector
   ```

## 🔧 Adding to Claude Desktop

### Automatic Configuration (via Portal)
1. Open the portal at `http://localhost:3000`
2. Find the server you want to add
3. Click "Copy Config" on the server card
4. Open Claude Desktop settings
5. Paste the configuration in the MCP section
6. Restart Claude Desktop

### Manual Configuration
Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "time-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/my_mcp_servers/servers/time-mcp/build/index.js"]
    }
  }
}
```

## 📋 Available Servers

### Time MCP Server
A comprehensive server for time and timezone operations:

**Tools:**
- `get_current_time` - Get current time in any IANA timezone
- `convert_time` - Convert time between different timezones
- `get_timezone_info` - Get detailed timezone information
- `add_time` - Add or subtract time from a given datetime
- `list_common_timezones` - List common timezones with current times

**Prompts:**
- `time_zone_comparison` - Generate comparison across multiple timezones
- `meeting_scheduler` - Help schedule meetings across timezones

**Resources:**
- `time://current` - Current UTC time
- `time://zones` - List of all available IANA timezones

## 🎯 Usage Examples

### Via Portal
1. Browse available servers in the web interface
2. View server details and documentation
3. Copy configuration for Claude Desktop
4. Follow installation instructions

### Via Claude Desktop
Once configured, you can use natural language:
- "What time is it in Tokyo?"
- "Convert 3 PM EST to Paris time"
- "Help me schedule a meeting across New York, London, and Tokyo"

## 🔨 Development

### Adding New Servers
1. Create a new directory under `servers/`
2. Implement your MCP server following the MCP specification
3. Add appropriate `package.json` and `README.md`
4. The portal will automatically detect and display your server

### Portal Development
```bash
cd portal
npm run dev  # Development mode with auto-reload
```

### Server Development
```bash
cd servers/time-mcp
npm run dev  # Development mode with TypeScript watching
```

## 🧪 Testing

### Portal Testing
```bash
cd portal
npm start
# Visit http://localhost:3000 to test the interface
```

### Server Testing
```bash
cd servers/time-mcp
npm run inspector  # Test with MCP Inspector
```

## 📦 Dependencies

### Portal
- Express.js for web server
- CORS for cross-origin requests
- Modern vanilla JavaScript frontend

### Time MCP Server
- @modelcontextprotocol/sdk for MCP implementation
- Luxon for robust date/time handling
- TypeScript for type safety

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your MCP server or portal enhancement
4. Test thoroughly
5. Submit a pull request

### Server Contribution Guidelines
- Follow the MCP specification
- Include comprehensive documentation
- Add appropriate TypeScript types
- Provide usage examples
- Include proper error handling

## 📚 Resources

- [Model Context Protocol Specification](https://github.com/anthropics/model-context-protocol)
- [Claude Desktop](https://claude.ai/desktop)
- [MCP SDK Documentation](https://github.com/anthropics/mcp-servers)

## 📄 License

MIT License - see individual package.json files for details

## 🆘 Support

For issues or questions:
1. Check the server logs in the console
2. Verify MCP servers are properly built
3. Ensure all dependencies are installed
4. Test servers individually before adding to Claude Desktop

## 🔮 Future Plans

- Additional MCP servers (weather, calculator, file operations)
- Server templates and scaffolding tools
- Configuration validation
- Server testing interface
- Export/import configurations
- Server analytics and monitoring