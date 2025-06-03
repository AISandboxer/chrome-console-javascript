const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const CDP = require('chrome-remote-interface');
const chalk = require('chalk');

class ChromeConsole {
  constructor(options) {
    this.url = options.url;
    this.command = options.command;
    this.delay = options.delay || 2000;
    this.browser = null;
    this.page = null;
    this.childProcess = null;
  }

  async start() {
    console.log(chalk.blue('🚀 Starting chrome-console...'));
    
    // Start the dev process
    this.startDevProcess();
    
    // Wait for the dev server to start
    console.log(chalk.yellow(`⏳ Waiting ${this.delay}ms for dev server to start...`));
    await this.sleep(this.delay);
    
    // Launch Chrome and connect to it
    await this.launchChrome();
    
    // Keep the process running
    await this.waitForExit();
  }

  startDevProcess() {
    console.log(chalk.green(`📦 Executing: ${this.command}`));
    
    // Parse the command
    const parts = this.command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    // Spawn the child process
    this.childProcess = spawn(cmd, args, {
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    // Handle stdout from the dev process
    this.childProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(line);
      });
    });
    
    // Handle stderr from the dev process
    this.childProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(chalk.red(line));
      });
    });
    
    // Handle process exit
    this.childProcess.on('exit', (code) => {
      console.log(chalk.yellow(`Process exited with code ${code}`));
      this.cleanup();
    });
  }

  async launchChrome() {
    try {
      console.log(chalk.blue('🌐 Launching Chrome...'));
      
      // Launch browser with debugging port
      this.browser = await puppeteer.launch({
        headless: false,
        args: ['--remote-debugging-port=9222'],
        defaultViewport: null
      });
      
      // Create a new page
      this.page = await this.browser.newPage();
      
      // Set up console message handling using CDP
      await this.setupConsoleListening();
      
      // Navigate to the URL
      console.log(chalk.blue(`🔗 Navigating to ${this.url}`));
      await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
      
    } catch (error) {
      console.error(chalk.red('❌ Error launching Chrome:'), error);
      throw error;
    }
  }

  async setupConsoleListening() {
    try {
      // Get the websocket endpoint
      const wsEndpoint = this.browser.wsEndpoint();
      const pageTarget = await this.page.target();
      const targetId = pageTarget._targetId;
      
      // Connect to Chrome DevTools Protocol
      const client = await CDP({
        target: `ws://localhost:9222/devtools/page/${targetId}`
      });
      
      // Enable necessary domains
      await client.Runtime.enable();
      await client.Console.enable();
      
      // Track processed messages to avoid duplicates
      const processedMessages = new Set();
      
      // Helper function to format console arguments
      const formatArgs = (args) => {
        if (!args || args.length === 0) return '';
        
        const firstArg = args[0];
        
        // Check if first argument is a format string
        if (firstArg.type === 'string' && firstArg.value && firstArg.value.includes('%')) {
          let formatString = firstArg.value;
          let argIndex = 1;
          
          // Process format specifiers
          formatString = formatString.replace(/%[sdifocO%]/g, (match) => {
            if (match === '%%') return '%'; // Escaped percent
            if (argIndex >= args.length) return match;
            
            const arg = args[argIndex++];
            
            switch (match) {
              case '%s': // String
                if (arg.type === 'string') return arg.value;
                if (arg.type === 'number' || arg.type === 'boolean') return String(arg.value);
                if (arg.type === 'undefined') return 'undefined';
                if (arg.type === 'object' && arg.subtype === 'null') return 'null';
                if (arg.description) return arg.description;
                return JSON.stringify(arg);
                
              case '%d': // Integer
              case '%i': // Integer
                if (arg.type === 'number') return parseInt(arg.value, 10);
                return parseInt(String(arg.value), 10) || 0;
                
              case '%f': // Float
                if (arg.type === 'number') return arg.value;
                return parseFloat(String(arg.value)) || 0;
                
              case '%o': // Object with optimally useful formatting
              case '%O': // Object with generic JavaScript object formatting
                if (arg.type === 'object' && arg.preview) {
                  return arg.description || JSON.stringify(arg);
                }
                if (arg.description) return arg.description;
                return JSON.stringify(arg);
                
              case '%c': // CSS styling (ignore for terminal)
                return '';
                
              default:
                return match;
            }
          });
          
          // Append any remaining arguments
          const remainingArgs = [];
          for (let i = argIndex; i < args.length; i++) {
            const arg = args[i];
            if (arg.type === 'string') {
              remainingArgs.push(arg.value);
            } else if (arg.type === 'number' || arg.type === 'boolean') {
              remainingArgs.push(String(arg.value));
            } else if (arg.type === 'undefined') {
              remainingArgs.push('undefined');
            } else if (arg.type === 'object' && arg.subtype === 'null') {
              remainingArgs.push('null');
            } else if (arg.description) {
              remainingArgs.push(arg.description);
            } else {
              remainingArgs.push(JSON.stringify(arg));
            }
          }
          
          if (remainingArgs.length > 0) {
            formatString += ' ' + remainingArgs.join(' ');
          }
          
          return formatString;
        } else {
          // No format string, just join all arguments
          return args.map(arg => {
            if (arg.type === 'string') {
              return arg.value;
            } else if (arg.type === 'number' || arg.type === 'boolean') {
              return String(arg.value);
            } else if (arg.type === 'undefined') {
              return 'undefined';
            } else if (arg.type === 'object' && arg.subtype === 'null') {
              return 'null';
            } else if (arg.description) {
              return arg.description;
            } else {
              return JSON.stringify(arg);
            }
          }).join(' ');
        }
      };
      
      // Listen for runtime console API calls (primary handler)
      client.Runtime.consoleAPICalled((params) => {
        const { type, args, executionContextId, timestamp } = params;
        
        if (!args || args.length === 0) return;
        
        // Create a unique message identifier
        const messageId = `${timestamp}-${type}-${executionContextId}`;
        processedMessages.add(messageId);
        
        // Format the message
        const message = formatArgs(args);
        
        // Determine the color based on console method
        let prefix = '[CHROME CONSOLE]';
        let colorFn = chalk.white;
        
        switch (type) {
          case 'error':
            colorFn = chalk.red;
            prefix = '[CHROME CONSOLE ERROR]';
            break;
          case 'warning':
          case 'warn':
            colorFn = chalk.yellow;
            prefix = '[CHROME CONSOLE WARN]';
            break;
          case 'info':
            colorFn = chalk.blue;
            prefix = '[CHROME CONSOLE INFO]';
            break;
          case 'debug':
            colorFn = chalk.gray;
            prefix = '[CHROME CONSOLE DEBUG]';
            break;
          case 'log':
          default:
            colorFn = chalk.white;
            prefix = '[CHROME CONSOLE LOG]';
        }
        
        console.log(colorFn(message));
      });
      
      // Listen for console messages that don't come through Runtime.consoleAPICalled
      client.Console.messageAdded((params) => {
        const { level, text, type, url, line, column, timestamp } = params.message;
        
        // Skip if we've already processed this through Runtime.consoleAPICalled
        const messageId = `${timestamp}-${level}-${params.message.executionContextId}`;
        if (processedMessages.has(messageId)) return;
        
        // Only process if we have text (these are usually browser-generated messages)
        if (!text) return;
        
        // Format the console output
        let prefix = '[CHROME CONSOLE]';
        let colorFn = chalk.white;
        
        switch (level) {
          case 'error':
            colorFn = chalk.red;
            prefix = '[CHROME CONSOLE ERROR]';
            break;
          case 'warning':
            colorFn = chalk.yellow;
            prefix = '[CHROME CONSOLE WARN]';
            break;
          case 'info':
            colorFn = chalk.blue;
            prefix = '[CHROME CONSOLE INFO]';
            break;
          case 'debug':
            colorFn = chalk.gray;
            prefix = '[CHROME CONSOLE DEBUG]';
            break;
          default:
            colorFn = chalk.white;
            prefix = '[CHROME CONSOLE LOG]';
        }
        
        // Output the console message
        console.log(colorFn(text));
        
        // If there's location info, show it
        if (url && line) {
          console.log(chalk.gray(`    at ${url}:${line}:${column || 0}`));
        }
      });
      
      console.log(chalk.green('✅ Chrome DevTools Protocol connected'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error setting up console listening:'), error);
      throw error;
    }
  }

  async waitForExit() {
    // Handle process termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n👋 Shutting down...'));
      this.cleanup();
    });
    
    process.on('SIGTERM', () => {
      this.cleanup();
    });
    
    // Keep the process running
    await new Promise(() => {});
  }

  async cleanup() {
    // Close the browser
    if (this.browser) {
      await this.browser.close();
    }
    
    // Kill the child process
    if (this.childProcess && !this.childProcess.killed) {
      this.childProcess.kill();
    }
    
    process.exit(0);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ChromeConsole; 