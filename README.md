# chrome-console

A dead simple npm package that combines Chrome DevTools console output with your dev process output. Perfect for debugging web applications during development.

## Features

- 🔄 Combines console output from Chrome with your dev server output
- 🎨 Color-coded output for easy identification
- 🚀 Simple CLI interface
- 📦 Uses Chrome DevTools Protocol for reliable console capture

## Installation

Install directly from GitHub:

```bash
npm install -g https://github.com/yourusername/chrome-console-capture.git
```

Or add it to your project:

```bash
npm install --save-dev https://github.com/yourusername/chrome-console-capture.git
```

## Usage

### Basic Usage

```bash
chrome-console --url http://localhost:3000 --execute "npm run dev"
```

### With Custom Delay

If your dev server takes longer to start, you can adjust the delay:

```bash
chrome-console --url http://localhost:3000 --execute "npm run dev" --delay 5000
```

### In package.json

Add a script to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:console": "chrome-console --url http://localhost:5173 --execute \"npm run dev\""
  }
}
```

Then run:

```bash
npm run dev:console
```

## CLI Options

- `--url, -u` (required): The URL to open in Chrome
- `--execute, -e` (required): The command to execute
- `--delay, -d` (optional): Delay in milliseconds before opening Chrome (default: 2000)
- `--help, -h`: Show help

## Output Format

The Chrome console output is color-coded and prefixed for easy identification:

- Dev process output appears unmodified (stdout in default color, stderr in red)
- `[CHROME CONSOLE LOG]` - console.log() from Chrome (white)
- `[CHROME CONSOLE ERROR]` - console.error() from Chrome (red)
- `[CHROME CONSOLE WARN]` - console.warn() from Chrome (yellow)
- `[CHROME CONSOLE INFO]` - console.info() from Chrome (blue)
- `[CHROME CONSOLE DEBUG]` - console.debug() from Chrome (gray)

## Example Output

```
🚀 Starting chrome-console...
📦 Executing: npm run dev
⏳ Waiting 2000ms for dev server to start...
> my-app@1.0.0 dev
> vite
VITE v4.4.5  ready in 320 ms
➜  Local:   http://localhost:5173/
🌐 Launching Chrome...
✅ Chrome DevTools Protocol connected
🔗 Navigating to http://localhost:5173
[CHROME LOG] App initialized
[CHROME INFO] User logged in
[CHROME ERROR] Failed to fetch data
    at http://localhost:5173/main.js:42:10
```

## How It Works

1. Starts your dev process (e.g., `npm run dev`)
2. Waits for the specified delay to let the server start
3. Launches Chrome with remote debugging enabled
4. Connects to Chrome using the DevTools Protocol
5. Navigates to your specified URL
6. Captures and displays all console output from both Chrome and your dev process

## Requirements

- Node.js >= 14.0.0
- Chrome browser installed

## License

MIT 