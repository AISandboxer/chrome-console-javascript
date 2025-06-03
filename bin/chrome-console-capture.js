#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ChromeConsoleCapture = require('../index');
const { parseOutputArg } = require('../src/utils');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <url> [options]')
  .command('$0 <url>', 'Capture console output from a Chrome tab', (yargs) => {
    yargs.positional('url', {
      describe: 'URL to load and capture console output from',
      type: 'string'
    });
  })
  .option('output', {
    alias: 'o',
    describe: 'Output file path (e.g., --output output.log or -o logs/console.log)',
    type: 'string'
  })
  .option('headless', {
    alias: 'h',
    describe: 'Run Chrome in headless mode',
    type: 'boolean',
    default: false
  })
  .option('format', {
    alias: 'f',
    describe: 'Output format',
    choices: ['default', 'json', 'raw'],
    default: 'default'
  })
  .option('no-color', {
    describe: 'Disable colored output',
    type: 'boolean'
  })
  .option('no-timestamp', {
    describe: 'Disable timestamps in output',
    type: 'boolean'
  })
  .option('stack-trace', {
    alias: 's',
    describe: 'Include stack traces for errors',
    type: 'boolean',
    default: false
  })
  .option('filter-type', {
    describe: 'Filter messages by type (comma-separated)',
    type: 'string'
  })
  .option('browser-args', {
    describe: 'Additional Chrome arguments (comma-separated)',
    type: 'string'
  })
  .option('width', {
    describe: 'Viewport width',
    type: 'number',
    default: 1280
  })
  .option('height', {
    describe: 'Viewport height',
    type: 'number',
    default: 800
  })
  .example('$0 https://example.com', 'Capture console output from example.com')
  .example('$0 http://localhost:3000 -o debug.log', 'Capture to a file')
  .example('$0 https://myapp.com --headless --format json', 'Run headless with JSON output')
  .example('$0 https://myapp.com --filter-type log,error', 'Only capture log and error messages')
  .help()
  .argv;

async function main() {
  const { url } = argv;
  
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  // Prepare options
  const options = {
    headless: argv.headless,
    outputFile: parseOutputArg(argv.output),
    colorize: !argv['no-color'],
    timestamp: !argv['no-timestamp'],
    includeStackTrace: argv['stack-trace'],
    format: argv.format,
    viewport: {
      width: argv.width,
      height: argv.height
    }
  };

  // Parse browser args
  if (argv['browser-args']) {
    options.browserArgs = argv['browser-args'].split(',').map(arg => arg.trim());
  }

  // Setup filter if specified
  if (argv['filter-type']) {
    const allowedTypes = argv['filter-type'].split(',').map(t => t.trim().toLowerCase());
    options.filter = (messageData) => {
      return allowedTypes.includes(messageData.type.toLowerCase());
    };
  }

  // Create capture instance
  const capture = new ChromeConsoleCapture(options);

  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\nStopping Chrome console capture...');
    await capture.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await capture.stop();
    process.exit(0);
  });

  try {
    console.log(`Starting Chrome console capture for: ${url}`);
    if (options.outputFile) {
      console.log(`Output will be saved to: ${options.outputFile}`);
    }
    console.log('Press Ctrl+C to stop...\n');

    // Start capturing
    await capture.start(url);

    // Keep the process running
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error.message);
    await capture.stop();
    process.exit(1);
  }
}

// Run the CLI
main(); 