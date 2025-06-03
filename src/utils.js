/**
 * Format a console message for output
 * @param {Object} messageData - The message data object
 * @param {Object} options - Formatting options
 * @returns {string} Formatted message
 */
function formatConsoleMessage(messageData, options) {
  let output = '';
  
  // Add timestamp if enabled
  if (options.timestamp) {
    const timestamp = messageData.timestamp.toISOString();
    output += `[${timestamp}] `;
  }
  
  // Add message type
  const typeLabel = messageData.type.toUpperCase();
  output += `[${typeLabel}] `;
  
  // Add location information if available
  if (messageData.location && messageData.location.url) {
    const { url, lineNumber, columnNumber } = messageData.location;
    const fileName = url.split('/').pop() || url;
    output += `(${fileName}:${lineNumber}:${columnNumber}) `;
  }
  
  // Add the main message text
  output += messageData.text;
  
  // Add stack trace for errors if enabled
  if (options.includeStackTrace && messageData.stack) {
    output += '\n' + messageData.stack;
  }
  
  // Add formatted arguments if they differ from the text
  if (messageData.args && messageData.args.length > 0) {
    const argsText = messageData.args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
    
    // Only add args if they provide additional information
    if (argsText !== messageData.text && argsText.trim()) {
      output += '\n  Args: ' + argsText;
    }
  }
  
  return output;
}

/**
 * Get the appropriate color for a console message type
 * @param {string} type - The console message type
 * @returns {string} Color name for chalk
 */
function getConsoleColor(type) {
  const colorMap = {
    'log': 'white',
    'info': 'blue',
    'warn': 'yellow',
    'warning': 'yellow',
    'error': 'red',
    'debug': 'gray',
    'trace': 'gray',
    'dir': 'cyan',
    'dirxml': 'cyan',
    'table': 'cyan',
    'group': 'magenta',
    'groupCollapsed': 'magenta',
    'groupEnd': 'magenta',
    'assert': 'red',
    'count': 'green',
    'countReset': 'green',
    'time': 'green',
    'timeLog': 'green',
    'timeEnd': 'green',
    'profile': 'yellow',
    'profileEnd': 'yellow',
    'clear': 'gray'
  };
  
  return colorMap[type.toLowerCase()] || 'white';
}

/**
 * Parse command line arguments for file output
 * @param {string} outputArg - The output argument (e.g., "file:output.log")
 * @returns {string|null} The file path or null
 */
function parseOutputArg(outputArg) {
  if (!outputArg) return null;
  
  if (outputArg.startsWith('file:')) {
    return outputArg.substring(5);
  }
  
  // If it's just a path, assume it's a file
  if (outputArg.includes('/') || outputArg.includes('\\') || outputArg.includes('.')) {
    return outputArg;
  }
  
  return null;
}

module.exports = {
  formatConsoleMessage,
  getConsoleColor,
  parseOutputArg
}; 