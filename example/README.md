# Chrome Console Example

This is a simple example demonstrating how to use `chrome-console-capture` with a web application.

## Running the Example

1. First, install the dependencies from the root directory:
   ```bash
   cd ..
   npm install
   ```

2. Then run the example with chrome-console:
   ```bash
   cd example
   npm run dev:console
   ```

This will:
- Start an HTTP server on port 8080
- Launch Chrome and navigate to http://localhost:8080
- Display combined console output from both the server and Chrome

## What to Expect

The example page includes buttons to test different console methods:
- `console.log()` - Regular log messages
- `console.info()` - Informational messages
- `console.warn()` - Warning messages
- `console.error()` - Error messages
- `console.debug()` - Debug messages

You'll see all these messages in your terminal, prefixed with `[CHROME LOG]`, `[CHROME INFO]`, etc.

The page also automatically logs messages on load and periodically, so you can see real-time console capture. 