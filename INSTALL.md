# Installation Guide

Since `chrome-console-capture` is not yet published to npm, here are the various ways to install and use it:

## For Development/Testing

### 1. Clone and Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/chrome-console-capture.git
cd chrome-console-capture

# Install dependencies
npm install

# Test the package
npm run example

# Use the CLI locally
node bin/chrome-console-capture.js https://example.com
```

### 2. Install Globally from Local Directory

```bash
# From the chrome-console-capture directory
npm install -g .

# Now you can use it anywhere
chrome-console-capture https://example.com
```

### 3. Link for Development

```bash
# From the chrome-console-capture directory
npm link

# Now it's available globally and updates automatically
chrome-console-capture https://example.com
```

## For Your Projects

### Install from GitHub

```bash
# Install from GitHub (replace with your repository)
npm install https://github.com/yourusername/chrome-console-capture.git

# Install a specific branch
npm install https://github.com/yourusername/chrome-console-capture.git#main

# Install a specific commit
npm install https://github.com/yourusername/chrome-console-capture.git#commit-hash
```

## Quick Test

After installation, test that everything works:

```bash
# Test CLI (if installed globally)
chrome-console-capture https://example.com --help

# Test programmatically
node -e "console.log(require('chrome-console-capture'))"
```