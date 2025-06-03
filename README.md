# Chrome Console Capture

A powerful npm package for capturing and streaming Chrome DevTools console output to your terminal or files. Perfect for debugging, testing, and monitoring web applications.

## Features

- 📊 **Real-time Console Capture**: Stream console messages as they appear in Chrome DevTools
- 🎨 **Colorized Output**: Beautiful colored output in terminal (customizable)
- 📁 **File Logging**: Optional output to files with automatic directory creation
- 🔍 **Message Filtering**: Filter messages by type (log, info, warn, error, etc.)
- 📋 **Multiple Formats**: Support for default, JSON, and raw output formats
- 🛠️ **Programmatic API**: Use as a library in your Node.js applications
- 🖥️ **CLI Tool**: Ready-to-use command-line interface
- 🎯 **Custom Handlers**: Register custom message handlers for advanced processing
- 🌐 **Full Chrome Control**: Access to Puppeteer page and browser instances

## Installation

```bash
npm install chrome-console-capture
```

Or install globally for CLI usage:

```bash
npm install -g chrome-console-capture
```

## Quick Start

### CLI Usage

```bash
# Basic usage
chrome-console-capture https://example.com

# Save output to file
chrome-console-capture https://example.com -o console.log

# Run in headless mode with JSON output
chrome-console-capture https://example.com --headless --format json

# Filter only errors and warnings
chrome-console-capture https://example.com --filter-type error,warn
```

### Programmatic Usage

```javascript
const ChromeConsoleCapture = require('chrome-console-capture');

async function captureConsole() {
  const capture = new ChromeConsoleCapture({
    headless: false,
    outputFile: 'console-output.log',
    colorize: true,
    timestamp: true
  });

  // Start capturing
  await capture.start('https://example.com');

  // Optional: Execute custom code in the page
  await capture.evaluate(() => {
    console.log('Hello from injected code!');
  });

  // Stop when done (or use Ctrl+C)
  // await capture.stop();
}

captureConsole();
```

## API Reference

### Constructor Options

```javascript
const capture = new ChromeConsoleCapture({
  headless: false,          // Run Chrome in headless mode
  outputFile: null,         // Path to save console output
  colorize: true,           // Use colors in terminal output
  timestamp: true,          // Include timestamps
  includeStackTrace: false, // Include stack traces for errors
  filter: null,             // Custom filter function
  format: 'default',        // Output format: 'default', 'json', 'raw'
  browserArgs: [],          // Additional Chrome arguments
  viewport: {               // Browser viewport size
    width: 1280,
    height: 800
  }
});
```

### Methods

#### `start(url)`
Start capturing console output from the specified URL.

```javascript
await capture.start('https://example.com');
```

#### `stop()`
Stop capturing and close the browser.

```javascript
await capture.stop();
```

#### `onMessage(handler)`
Register a custom message handler.

```javascript
capture.onMessage((messageData) => {
  if (messageData.type === 'error') {
    // Handle errors specially
    console.log('Error detected:', messageData.text);
  }
});
```

#### `evaluate(fn, ...args)`
Execute JavaScript in the page context.

```javascript
const result = await capture.evaluate(() => {
  return document.title;
});
```

#### `goto(url)`
Navigate to a new URL.

```javascript
await capture.goto('https://example.com/page2');
```

#### `getPage()` / `getBrowser()`
Get the underlying Puppeteer Page or Browser instance for advanced usage.

```javascript
const page = capture.getPage();
await page.screenshot({ path: 'screenshot.png' });
```

## CLI Options

```
Usage: chrome-console-capture <url> [options]

Options:
  -o, --output          Output file path
  -h, --headless        Run Chrome in headless mode
  -f, --format          Output format (choices: "default", "json", "raw")
      --no-color        Disable colored output
      --no-timestamp    Disable timestamps in output
  -s, --stack-trace     Include stack traces for errors
      --filter-type     Filter messages by type (comma-separated)
      --browser-args    Additional Chrome arguments (comma-separated)
      --width           Viewport width (default: 1280)
      --height          Viewport height (default: 800)
      --help            Show help
```

## Message Data Structure

Each captured message has the following structure:

```javascript
{
  type: 'log',              // Message type: log, info, warn, error, etc.
  text: 'Message text',     // The console message text
  timestamp: Date,          // When the message was logged
  location: {               // Source location (if available)
    url: 'https://...',
    lineNumber: 123,
    columnNumber: 45
  },
  args: [],                 // Original console arguments
  stack: '...'             // Stack trace (for errors)
}
```

## Examples

### Filter and Process Specific Messages

```javascript
const capture = new ChromeConsoleCapture({
  filter: (msg) => msg.type === 'error' || msg.type === 'warn',
  format: 'json'
});

capture.onMessage((msg) => {
  // Send errors to monitoring service
  if (msg.type === 'error') {
    sendToMonitoring(msg);
  }
});
```

### Automated Testing

```javascript
const capture = new ChromeConsoleCapture({ headless: true });

await capture.start('http://localhost:3000');

// Run tests
await capture.evaluate(() => {
  // Your test code here
});

// Check for console errors
let hasErrors = false;
capture.onMessage((msg) => {
  if (msg.type === 'error') {
    hasErrors = true;
  }
});

// Later...
if (hasErrors) {
  console.log('Tests failed with console errors');
  process.exit(1);
}
```

### Monitoring Production Sites

```javascript
const capture = new ChromeConsoleCapture({
  headless: true,
  outputFile: `logs/console-${new Date().toISOString()}.log`,
  format: 'json'
});

// Monitor for 5 minutes
await capture.start('https://production-site.com');

setTimeout(async () => {
  await capture.stop();
  // Analyze logs...
}, 5 * 60 * 1000);
```

## Output Formats

### Default Format
Structured, human-readable output with timestamps and colors:
```
[2024-01-20T10:30:45.123Z] [LOG] (script.js:10:15) Hello World
[2024-01-20T10:30:45.456Z] [ERROR] (app.js:25:10) Uncaught TypeError: Cannot read property 'foo' of undefined
```

### JSON Format
Machine-readable JSON output, one message per line:
```json
{"type":"log","text":"Hello World","timestamp":"2024-01-20T10:30:45.123Z","location":{...},"args":[...]}
{"type":"error","text":"Uncaught TypeError...","timestamp":"2024-01-20T10:30:45.456Z","stack":"..."}
```

### Raw Format
Plain text output, just the message content:
```
Hello World
Uncaught TypeError: Cannot read property 'foo' of undefined
```

## Browser Arguments

Pass additional Chrome arguments for special requirements:

```bash
chrome-console-capture https://example.com --browser-args "--disable-web-security,--no-sandbox"
```

Or programmatically:

```javascript
const capture = new ChromeConsoleCapture({
  browserArgs: ['--disable-web-security', '--no-sandbox']
});
```

## Troubleshooting

### Chrome not found
Puppeteer will download Chrome automatically on first run. If you have issues, you can specify a Chrome executable:

```javascript
const capture = new ChromeConsoleCapture({
  browserArgs: ['--executable-path=/path/to/chrome']
});
```

### Permission errors
On some systems, you may need to add `--no-sandbox` to browser arguments:

```javascript
const capture = new ChromeConsoleCapture({
  browserArgs: ['--no-sandbox']
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details. 