# Chrome Console Capture - Quick Start Guide

## Installation

First, install the package dependencies:

```bash
npm install
```

## Testing the Package Locally

### 1. Run the Demo

Test the package with the included demo:

```bash
npm run example
```

This will:
- Open Chrome with the test page
- Start capturing console output
- Display colorized console messages in your terminal
- Save output to `examples/console-output.log`

### 2. Use the CLI

Test the CLI interface:

```bash
# Basic usage
node bin/chrome-console-capture.js https://example.com

# With file output
node bin/chrome-console-capture.js https://example.com -o output.log

# Headless mode with JSON format
node bin/chrome-console-capture.js https://example.com --headless --format json
```

### 3. Run Integration Tests

Test the integration example:

```bash
node examples/integration.js
```

## Using in Your Project

### As a Dependency

First, install the package (since it's not on npm yet):

```bash
# From GitHub
npm install https://github.com/yourusername/chrome-console-capture.git
```

Then use it in your code:

```javascript
const ChromeConsoleCapture = require('chrome-console-capture');

async function captureMyApp() {
  const capture = new ChromeConsoleCapture({
    headless: false,
    outputFile: 'console.log'
  });

  await capture.start('http://localhost:3000');
  
  // Your app's console output will now be captured!
}
```

### Global CLI Installation

```bash
# From the chrome-console-capture directory
npm install -g .

# Or using npm link
npm link

# Use anywhere
chrome-console-capture https://myapp.com
```

## Common Use Cases

### 1. Debug Production Issues

```bash
chrome-console-capture https://production-app.com -o debug.log --headless
```

### 2. Monitor Errors Only

```bash
chrome-console-capture https://myapp.com --filter-type error,warn
```

### 3. Automated Testing

```javascript
const capture = new ChromeConsoleCapture({ headless: true });
capture.onMessage(msg => {
  if (msg.type === 'error') {
    console.error('Test failed:', msg.text);
    process.exit(1);
  }
});
```

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Run `chrome-console-capture --help` for CLI options
- See [examples/](examples/) for more usage examples 