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
        console.log(chalk.gray('[DEV]'), line);
      });
    });
    
    // Handle stderr from the dev process
    this.childProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(chalk.red('[DEV ERROR]'), line);
      });
    });
    
    // Handle process exit
    this.childProcess.on('exit', (code) => {
      console.log(chalk.yellow(`[DEV] Process exited with code ${code}`));
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
      
      // Listen for console API calls
      client.Console.messageAdded((params) => {
        const { level, text, args, type, url, line, column } = params.message;
        
        // Format the console output
        let prefix = '[CHROME]';
        let colorFn = chalk.white;
        
        switch (level) {
          case 'error':
            colorFn = chalk.red;
            prefix = '[CHROME ERROR]';
            break;
          case 'warning':
            colorFn = chalk.yellow;
            prefix = '[CHROME WARN]';
            break;
          case 'info':
            colorFn = chalk.blue;
            prefix = '[CHROME INFO]';
            break;
          case 'debug':
            colorFn = chalk.gray;
            prefix = '[CHROME DEBUG]';
            break;
          default:
            colorFn = chalk.white;
            prefix = '[CHROME LOG]';
        }
        
        // Output the console message
        if (text) {
          console.log(colorFn(prefix), text);
        }
        
        // If there's location info, show it
        if (url && line) {
          console.log(chalk.gray(`    at ${url}:${line}:${column || 0}`));
        }
      });
      
      // Also listen for runtime console API calls for better coverage
      client.Runtime.consoleAPICalled((params) => {
        const { type, args, executionContextId, timestamp } = params;
        
        if (!args || args.length === 0) return;
        
        // Extract the text from the arguments
        const messages = args.map(arg => {
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
        
        // Determine the color based on console method
        let prefix = '[CHROME]';
        let colorFn = chalk.white;
        
        switch (type) {
          case 'error':
            colorFn = chalk.red;
            prefix = '[CHROME ERROR]';
            break;
          case 'warning':
            colorFn = chalk.yellow;
            prefix = '[CHROME WARN]';
            break;
          case 'info':
            colorFn = chalk.blue;
            prefix = '[CHROME INFO]';
            break;
          case 'debug':
            colorFn = chalk.gray;
            prefix = '[CHROME DEBUG]';
            break;
          case 'log':
          default:
            colorFn = chalk.white;
            prefix = '[CHROME LOG]';
        }
        
        console.log(colorFn(prefix), messages);
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