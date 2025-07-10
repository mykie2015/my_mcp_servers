#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  CallToolRequest,
  GetPromptRequest,
  ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { DateTime, IANAZone } from 'luxon';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'logs.txt');

// Logger function
function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const fullLogEntry = data ? `${logEntry}\nData: ${JSON.stringify(data, null, 2)}\n` : `${logEntry}\n`;
  
  // Write to file only (no console output as it interferes with JSON RPC)
  try {
    fs.appendFileSync(logFile, fullLogEntry);
  } catch (error) {
    // Silently ignore file write errors to avoid breaking MCP communication
  }
}

// Initialize logging
log('INFO', 'Time MCP Server starting up...');

const server = new Server(
  {
    name: 'time-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  }
);

// Helper function to validate timezone
function validateTimezone(timezone: string): boolean {
  log('DEBUG', 'Validating timezone', { timezone });
  const isValid = IANAZone.isValidZone(timezone);
  log('DEBUG', 'Timezone validation result', { timezone, isValid });
  return isValid;
}

// Helper function to get current time in a specific timezone
function getCurrentTime(timezone: string): any {
  log('INFO', 'Getting current time', { timezone });
  
  if (!validateTimezone(timezone)) {
    log('ERROR', 'Invalid timezone provided', { timezone });
    throw new McpError(ErrorCode.InvalidParams, `Invalid timezone: ${timezone}`);
  }
  
  try {
    const dt = DateTime.now().setZone(timezone);
    const result = {
      timezone: timezone,
      datetime: dt.toISO(),
      utc_datetime: dt.toUTC().toISO(),
      local_time: dt.toFormat('HH:mm:ss'),
      local_date: dt.toFormat('yyyy-MM-dd'),
      day_of_week: dt.toFormat('EEEE'),
      is_dst: dt.isInDST,
      offset: dt.toFormat('ZZ'),
      unix_timestamp: dt.toSeconds(),
    };
    
    log('INFO', 'Successfully got current time', { timezone, result });
    return result;
  } catch (error) {
    log('ERROR', 'Error getting current time', { timezone, error });
    throw new McpError(ErrorCode.InternalError, `Error getting current time: ${error}`);
  }
}

// Helper function to convert time between timezones
function convertTime(time: string, fromTimezone: string, toTimezone: string): any {
  if (!validateTimezone(fromTimezone)) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid source timezone: ${fromTimezone}`);
  }
  
  if (!validateTimezone(toTimezone)) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid target timezone: ${toTimezone}`);
  }
  
  // Parse time in format HH:mm or HH:mm:ss
  const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const timeMatch = time.match(timeRegex);
  
  if (!timeMatch) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid time format: ${time}. Use HH:mm or HH:mm:ss`);
  }
  
  const [, hours, minutes, seconds = '00'] = timeMatch;
  
  // Create datetime object for today in the source timezone
  const sourceDt = DateTime.now()
    .setZone(fromTimezone)
    .set({ hour: parseInt(hours), minute: parseInt(minutes), second: parseInt(seconds) });
  
  const targetDt = sourceDt.setZone(toTimezone);
  
  return {
    source: {
      timezone: fromTimezone,
      datetime: sourceDt.toISO(),
      local_time: sourceDt.toFormat('HH:mm:ss'),
      local_date: sourceDt.toFormat('yyyy-MM-dd'),
      offset: sourceDt.toFormat('ZZ'),
      is_dst: sourceDt.isInDST,
    },
    target: {
      timezone: toTimezone,
      datetime: targetDt.toISO(),
      local_time: targetDt.toFormat('HH:mm:ss'),
      local_date: targetDt.toFormat('yyyy-MM-dd'),
      offset: targetDt.toFormat('ZZ'),
      is_dst: targetDt.isInDST,
    },
    time_difference: targetDt.diff(sourceDt, 'hours').toFormat('h') + 'h',
  };
}

// Helper function to get timezone information
function getTimezoneInfo(timezone: string): any {
  log('INFO', 'Getting timezone information', { timezone });
  
  if (!validateTimezone(timezone)) {
    log('ERROR', 'Invalid timezone provided for timezone info', { timezone });
    throw new McpError(ErrorCode.InvalidParams, `Invalid timezone: ${timezone}`);
  }
  
  try {
    const dt = DateTime.now().setZone(timezone);
    const zone = dt.zone;
    
    const result = {
      timezone: timezone,
      name: zone.name,
      abbreviation: dt.toFormat('ZZZZ'),
      offset: dt.toFormat('ZZ'),
      offset_seconds: dt.offset * 60,
      is_dst: dt.isInDST,
      dst_offset: zone.isValid ? (zone as IANAZone).offset(dt.toMillis()) : 0,
    };
    
    log('INFO', 'Successfully got timezone information', { timezone, result });
    return result;
  } catch (error) {
    log('ERROR', 'Error getting timezone information', { timezone, error });
    throw new McpError(ErrorCode.InternalError, `Error getting timezone information: ${error}`);
  }
}

// Helper function to add/subtract time
function addTime(baseTime: string, timezone: string, amount: number, unit: string): any {
  if (!validateTimezone(timezone)) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid timezone: ${timezone}`);
  }
  
  let dt: DateTime;
  
  if (baseTime.toLowerCase() === 'now') {
    dt = DateTime.now().setZone(timezone);
  } else {
    dt = DateTime.fromISO(baseTime, { zone: timezone });
    if (!dt.isValid) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid datetime: ${baseTime}`);
    }
  }
  
  const validUnits = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
  if (!validUnits.includes(unit)) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid unit: ${unit}. Valid units: ${validUnits.join(', ')}`);
  }
  
  // Create a duration object with proper typing
  const duration: any = {};
  duration[unit] = amount;
  const resultDt = dt.plus(duration);
  
  return {
    original: {
      datetime: dt.toISO(),
      local_time: dt.toFormat('HH:mm:ss'),
      local_date: dt.toFormat('yyyy-MM-dd'),
    },
    result: {
      datetime: resultDt.toISO(),
      local_time: resultDt.toFormat('HH:mm:ss'),
      local_date: resultDt.toFormat('yyyy-MM-dd'),
    },
    operation: `${amount > 0 ? 'Added' : 'Subtracted'} ${Math.abs(amount)} ${unit}`,
    difference: resultDt.diff(dt, unit as any).toObject(),
  };
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_current_time',
        description: 'Get the current time in a specific timezone',
        inputSchema: {
          type: 'object',
          properties: {
            timezone: {
              type: 'string',
              description: 'IANA timezone name (e.g., "America/New_York", "Europe/London", "UTC")',
              default: 'UTC',
            },
          },
        },
      },
      {
        name: 'convert_time',
        description: 'Convert time from one timezone to another',
        inputSchema: {
          type: 'object',
          properties: {
            time: {
              type: 'string',
              description: 'Time in HH:mm or HH:mm:ss format',
            },
            from_timezone: {
              type: 'string',
              description: 'Source IANA timezone name',
            },
            to_timezone: {
              type: 'string',
              description: 'Target IANA timezone name',
            },
          },
          required: ['time', 'from_timezone', 'to_timezone'],
        },
      },
      {
        name: 'get_timezone_info',
        description: 'Get detailed information about a timezone',
        inputSchema: {
          type: 'object',
          properties: {
            timezone: {
              type: 'string',
              description: 'IANA timezone name',
            },
          },
          required: ['timezone'],
        },
      },
      {
        name: 'add_time',
        description: 'Add or subtract time from a given datetime',
        inputSchema: {
          type: 'object',
          properties: {
            base_time: {
              type: 'string',
              description: 'Base time in ISO format or "now" for current time',
              default: 'now',
            },
            timezone: {
              type: 'string',
              description: 'IANA timezone name',
              default: 'UTC',
            },
            amount: {
              type: 'number',
              description: 'Amount to add (positive) or subtract (negative)',
            },
            unit: {
              type: 'string',
              description: 'Time unit: years, months, weeks, days, hours, minutes, seconds',
              enum: ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'],
            },
          },
          required: ['amount', 'unit'],
        },
      },
      {
        name: 'list_common_timezones',
        description: 'List common timezones with their current times',
        inputSchema: {
          type: 'object',
          properties: {
            regions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['America', 'Europe', 'Asia', 'Africa', 'Australia', 'Pacific'],
              },
              description: 'Regions to include (default: all)',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;
  
  log('INFO', 'Received tool call', { name, args });
  
  try {
    switch (name) {
      case 'get_current_time': {
        const { timezone = 'UTC' } = (args as { timezone?: string }) || {};
        log('INFO', 'Processing get_current_time', { timezone });
        const result = getCurrentTime(timezone);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case 'convert_time': {
        const { time, from_timezone, to_timezone } = args as {
          time: string;
          from_timezone: string;
          to_timezone: string;
        };
        log('INFO', 'Processing convert_time', { time, from_timezone, to_timezone });
        const result = convertTime(time, from_timezone, to_timezone);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case 'get_timezone_info': {
        const { timezone } = args as { timezone: string };
        log('INFO', 'Processing get_timezone_info', { timezone, rawArgs: args });
        const result = getTimezoneInfo(timezone);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case 'add_time': {
        const { base_time = 'now', timezone = 'UTC', amount, unit } = args as {
          base_time?: string;
          timezone?: string;
          amount: number;
          unit: string;
        };
        const result = addTime(base_time, timezone, amount, unit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case 'list_common_timezones': {
        const { regions } = args as {
          regions?: string[];
        };
        
        // Use default regions if not provided or empty
        const defaultRegions = ['America', 'Europe', 'Asia', 'Africa', 'Australia', 'Pacific'];
        const activeRegions = (!regions || regions.length === 0) ? defaultRegions : regions;
        
        log('INFO', 'Processing list_common_timezones', { regions, activeRegions });
        
        const commonTimezones = [
          'America/New_York',
          'America/Los_Angeles',
          'America/Chicago',
          'America/Denver',
          'America/Toronto',
          'America/Sao_Paulo',
          'Europe/London',
          'Europe/Paris',
          'Europe/Berlin',
          'Europe/Rome',
          'Europe/Madrid',
          'Europe/Moscow',
          'Asia/Tokyo',
          'Asia/Shanghai',
          'Asia/Seoul',
          'Asia/Kolkata',  // Fixed: Mumbai is actually Asia/Kolkata in IANA
          'Asia/Dubai',
          'Asia/Singapore',
          'Africa/Cairo',
          'Africa/Johannesburg',
          'Australia/Sydney',
          'Australia/Melbourne',
          'Pacific/Auckland',
          'Pacific/Honolulu',
        ];
        
        const filteredTimezones = commonTimezones.filter(tz => 
          activeRegions.some(region => tz.startsWith(region))
        );
        
        log('INFO', 'Filtered timezones', { filteredCount: filteredTimezones.length, timezones: filteredTimezones });
        
        const timezoneData = filteredTimezones.map(tz => ({
          timezone: tz,
          ...getCurrentTime(tz),
        }));
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(timezoneData, null, 2),
            },
          ],
        };
      }
      
      default:
        log('ERROR', 'Unknown tool requested', { name });
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    log('ERROR', 'Error in tool execution', { name, error, args });
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Error executing tool ${name}: ${error}`);
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'time_zone_comparison',
        description: 'Generate a comparison of times across multiple timezones',
        arguments: [
          {
            name: 'timezones',
            description: 'Comma-separated list of IANA timezone names',
            required: true,
          },
          {
            name: 'reference_time',
            description: 'Reference time in HH:mm format (optional, defaults to current time)',
            required: false,
          },
        ],
      },
      {
        name: 'meeting_scheduler',
        description: 'Help schedule a meeting across multiple timezones',
        arguments: [
          {
            name: 'participants',
            description: 'JSON object with participant names as keys and their timezones as values',
            required: true,
          },
          {
            name: 'preferred_time_range',
            description: 'Preferred time range in format "HH:mm-HH:mm" (optional)',
            required: false,
          },
        ],
      },
    ],
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request: GetPromptRequest) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'time_zone_comparison': {
      const { timezones, reference_time } = args as {
        timezones: string;
        reference_time?: string;
      };
      
      const timezoneList = timezones.split(',').map(tz => tz.trim());
      const timeData = timezoneList.map(tz => getCurrentTime(tz));
      
      const promptText = `Here's a comparison of times across the specified timezones:

${timeData.map(data => `
**${data.timezone}**
- Current time: ${data.local_time}
- Date: ${data.local_date}
- Day: ${data.day_of_week}
- UTC offset: ${data.offset}
- DST: ${data.is_dst ? 'Yes' : 'No'}
`).join('\n')}

This information can help you coordinate activities across different time zones.`;
      
      return {
        description: `Time zone comparison for: ${timezones}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: promptText,
            },
          },
        ],
      };
    }
    
    case 'meeting_scheduler': {
      const { participants, preferred_time_range } = args as {
        participants: string;
        preferred_time_range?: string;
      };
      
      let participantData;
      try {
        participantData = JSON.parse(participants);
      } catch (error) {
        throw new McpError(ErrorCode.InvalidParams, 'Invalid JSON format for participants');
      }
      
      const participantTimes = Object.entries(participantData).map(([name, timezone]) => ({
        name,
        timezone: timezone as string,
        ...getCurrentTime(timezone as string),
      }));
      
      const promptText = `Meeting scheduling information for participants:

${participantTimes.map(participant => `
**${participant.name}** (${participant.timezone})
- Current time: ${participant.local_time}
- Date: ${participant.local_date}
- UTC offset: ${participant.offset}
`).join('\n')}

${preferred_time_range ? `Preferred time range: ${preferred_time_range}` : ''}

Please suggest optimal meeting times that work for all participants, considering their time zones and any specified preferences.`;
      
      return {
        description: `Meeting scheduler for ${Object.keys(participantData).length} participants`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: promptText,
            },
          },
        ],
      };
    }
    
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown prompt: ${name}`);
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'time://current',
        name: 'Current Time',
        description: 'Current time in UTC',
        mimeType: 'application/json',
      },
      {
        uri: 'time://zones',
        name: 'Available Timezones',
        description: 'List of available IANA timezones',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource requests
server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
  const { uri } = request.params;
  
  switch (uri) {
    case 'time://current': {
      const currentTime = getCurrentTime('UTC');
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(currentTime, null, 2),
          },
        ],
      };
    }
    
    case 'time://zones': {
      // Get a comprehensive list of IANA timezones
      const zones = Intl.supportedValuesOf('timeZone');
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              count: zones.length,
              timezones: zones.sort(),
            }, null, 2),
          },
        ],
      };
    }
    
    default:
      throw new McpError(ErrorCode.InvalidParams, `Unknown resource: ${uri}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Time MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 