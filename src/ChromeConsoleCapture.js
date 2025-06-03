const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { formatConsoleMessage, getConsoleColor } = require('./utils');

class ChromeConsoleCapture {
  constructor(options = {}) {
    this.options = {
      headless: false,
      outputFile: null,
      colorize: true,
      timestamp: true,
      includeStackTrace: false,
      filter: null, // function to filter messages
      format: 'default', // 'default', 'json', 'raw'
      browserArgs: [],
      viewport: { width: 1280, height: 800 },
      ...options
    };
    
    this.browser = null;
    this.page = null;
    this.fileStream = null;
    this.messageHandlers = [];
  }

  /**
   * Start capturing console output from a URL
   * @param {string} url - The URL to navigate to
   * @returns {Promise<void>}
   */
  async start(url) {
    try {
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: this.options.browserArgs
      });

      // Create a new page
      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport(this.options.viewport);

      // Setup console message handling
      this.setupConsoleHandling();

      // Setup file output if specified
      if (this.options.outputFile) {
        this.setupFileOutput();
      }

      // Navigate to the URL
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded'
      });

    } catch (error) {
      console.error('Error starting Chrome console capture:', error);
      throw error;
    }
  }

  /**
   * Setup console message handling
   */
  setupConsoleHandling() {
    // Listen to console events
    this.page.on('console', async (msg) => {
      try {
        const messageData = {
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date(),
          location: msg.location(),
          args: []
        };

        // Get detailed information about console arguments
        for (const arg of msg.args()) {
          try {
            const value = await arg.jsonValue();
            messageData.args.push(value);
          } catch (e) {
            // If we can't serialize, get a string representation
            messageData.args.push(await arg.toString());
          }
        }

        // Apply filter if provided
        if (this.options.filter && !this.options.filter(messageData)) {
          return;
        }

        // Process the message
        this.processMessage(messageData);
        
        // Call any registered handlers
        this.messageHandlers.forEach(handler => handler(messageData));
        
      } catch (error) {
        console.error('Error processing console message:', error);
      }
    });

    // Listen to page errors
    this.page.on('pageerror', (error) => {
      const messageData = {
        type: 'error',
        text: error.message,
        timestamp: new Date(),
        stack: error.stack
      };
      
      this.processMessage(messageData);
      this.messageHandlers.forEach(handler => handler(messageData));
    });

    // Listen to request failures
    this.page.on('requestfailed', (request) => {
      const messageData = {
        type: 'error',
        text: `Request failed: ${request.url()} - ${request.failure().errorText}`,
        timestamp: new Date()
      };
      
      this.processMessage(messageData);
      this.messageHandlers.forEach(handler => handler(messageData));
    });
  }

  /**
   * Process and output a console message
   */
  processMessage(messageData) {
    let output = '';

    switch (this.options.format) {
      case 'json':
        output = JSON.stringify(messageData) + '\n';
        break;
      case 'raw':
        output = messageData.text + '\n';
        break;
      default:
        output = formatConsoleMessage(messageData, this.options) + '\n';
    }

    // Output to console
    if (this.options.colorize && this.options.format === 'default') {
      const chalk = require('chalk');
      const color = getConsoleColor(messageData.type);
      process.stdout.write(chalk[color](output));
    } else {
      process.stdout.write(output);
    }

    // Output to file if configured
    if (this.fileStream) {
      // Strip ANSI color codes for file output
      const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
      this.fileStream.write(cleanOutput);
    }
  }

  /**
   * Setup file output stream
   */
  setupFileOutput() {
    const outputPath = path.resolve(this.options.outputFile);
    const outputDir = path.dirname(outputPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.fileStream = fs.createWriteStream(outputPath, { flags: 'a' });
    this.fileStream.write(`\n=== Chrome Console Capture Started at ${new Date().toISOString()} ===\n\n`);
  }

  /**
   * Register a custom message handler
   * @param {Function} handler - Function to handle console messages
   */
  onMessage(handler) {
    if (typeof handler === 'function') {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * Execute JavaScript in the page context
   * @param {Function|string} fn - Function or code to execute
   * @param {...any} args - Arguments to pass to the function
   */
  async evaluate(fn, ...args) {
    if (!this.page) {
      throw new Error('Page not initialized. Call start() first.');
    }
    return await this.page.evaluate(fn, ...args);
  }

  /**
   * Get the current page instance
   * @returns {puppeteer.Page}
   */
  getPage() {
    return this.page;
  }

  /**
   * Get the current browser instance
   * @returns {puppeteer.Browser}
   */
  getBrowser() {
    return this.browser;
  }

  /**
   * Navigate to a new URL
   * @param {string} url - The URL to navigate to
   */
  async goto(url) {
    if (!this.page) {
      throw new Error('Page not initialized. Call start() first.');
    }
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded'
    });
  }

  /**
   * Stop capturing and close the browser
   */
  async stop() {
    if (this.fileStream) {
      this.fileStream.write(`\n=== Chrome Console Capture Ended at ${new Date().toISOString()} ===\n`);
      this.fileStream.end();
    }

    if (this.browser) {
      await this.browser.close();
    }

    this.browser = null;
    this.page = null;
    this.fileStream = null;
    this.messageHandlers = [];
  }
}

module.exports = ChromeConsoleCapture; 