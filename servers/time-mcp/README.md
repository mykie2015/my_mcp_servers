# Time MCP Server

A comprehensive Model Context Protocol (MCP) server that provides time and timezone conversion capabilities. This server enables LLMs to work with time-related operations, timezone conversions, and scheduling across multiple time zones.

## Features

### 🕐 Tools
- **get_current_time**: Get current time in any IANA timezone
- **convert_time**: Convert time between different timezones
- **get_timezone_info**: Get detailed timezone information
- **add_time**: Add or subtract time from a given datetime
- **list_common_timezones**: List common timezones with current times

### 📝 Prompts
- **time_zone_comparison**: Generate comparison across multiple timezones
- **meeting_scheduler**: Help schedule meetings across timezones

### 📚 Resources
- **time://current**: Current UTC time
- **time://zones**: List of all available IANA timezones

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Build the Server
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## Usage

### Running the Server
```bash
npm start
```

### Testing with MCP Inspector
```bash
npm run inspector
```

## Configuration

### Claude Desktop
Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "time-mcp": {
      "command": "node",
      "args": ["/path/to/time-mcp/build/index.js"]
    }
  }
}
```

### Other MCP Clients
The server communicates via stdio and can be used with any MCP-compatible client.

## API Reference

### Tools

#### get_current_time
Get the current time in a specific timezone.

```json
{
  "name": "get_current_time",
  "arguments": {
    "timezone": "America/New_York"
  }
}
```

**Response:**
```json
{
  "timezone": "America/New_York",
  "datetime": "2024-01-01T12:00:00.000-05:00",
  "utc_datetime": "2024-01-01T17:00:00.000Z",
  "local_time": "12:00:00",
  "local_date": "2024-01-01",
  "day_of_week": "Monday",
  "is_dst": false,
  "offset": "-05:00",
  "unix_timestamp": 1704117600
}
```

#### convert_time
Convert time between different timezones.

```json
{
  "name": "convert_time",
  "arguments": {
    "time": "14:30",
    "from_timezone": "Europe/London",
    "to_timezone": "Asia/Tokyo"
  }
}
```

#### get_timezone_info
Get detailed information about a timezone.

```json
{
  "name": "get_timezone_info",
  "arguments": {
    "timezone": "Australia/Sydney"
  }
}
```

#### add_time
Add or subtract time from a given datetime.

```json
{
  "name": "add_time",
  "arguments": {
    "base_time": "now",
    "timezone": "UTC",
    "amount": 3,
    "unit": "hours"
  }
}
```

#### list_common_timezones
List common timezones with their current times.

```json
{
  "name": "list_common_timezones",
  "arguments": {
    "regions": ["America", "Europe"]
  }
}
```

### Prompts

#### time_zone_comparison
Generate a comparison of times across multiple timezones.

```json
{
  "name": "time_zone_comparison",
  "arguments": {
    "timezones": "America/New_York,Europe/London,Asia/Tokyo"
  }
}
```

#### meeting_scheduler
Help schedule meetings across multiple timezones.

```json
{
  "name": "meeting_scheduler",
  "arguments": {
    "participants": "{\"Alice\": \"America/New_York\", \"Bob\": \"Europe/London\", \"Charlie\": \"Asia/Tokyo\"}",
    "preferred_time_range": "09:00-17:00"
  }
}
```

### Resources

#### time://current
Get current UTC time as a resource.

#### time://zones
Get a list of all available IANA timezones.

## Examples

### Basic Time Queries
- "What time is it in Tokyo?"
- "What time is it now in New York?"
- "Convert 3 PM London time to Tokyo time"

### Timezone Conversions
- "When it's 2 PM in San Francisco, what time is it in Sydney?"
- "Convert 9:30 AM EST to GMT"

### Meeting Scheduling
- "I need to schedule a meeting with people in New York, London, and Tokyo. What's a good time?"
- "Compare current times in major world cities"

### Time Calculations
- "What time will it be in 3 hours from now in Paris?"
- "Add 2 days to the current time in Mumbai"

## Supported Timezones

The server supports all IANA timezone identifiers. Some common examples:

### Americas
- America/New_York (Eastern Time)
- America/Los_Angeles (Pacific Time)
- America/Chicago (Central Time)
- America/Denver (Mountain Time)
- America/Toronto
- America/Sao_Paulo

### Europe
- Europe/London
- Europe/Paris
- Europe/Berlin
- Europe/Rome
- Europe/Madrid
- Europe/Moscow

### Asia
- Asia/Tokyo
- Asia/Shanghai
- Asia/Seoul
- Asia/Mumbai
- Asia/Dubai
- Asia/Singapore

### Others
- Australia/Sydney
- Australia/Melbourne
- Africa/Cairo
- Africa/Johannesburg
- Pacific/Auckland
- Pacific/Honolulu

## Error Handling

The server provides detailed error messages for:
- Invalid timezone names
- Invalid time formats
- Invalid date/time values
- Missing required parameters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues, please open an issue in the repository. 