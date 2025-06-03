/**
 * Integration example: Using chrome-console-capture in a testing scenario
 * This example shows how to integrate console capture into your test suite
 * 
 * Note: Since the package is not on npm yet, install it with:
 * npm install https://github.com/yourusername/chrome-console-capture.git
 */

const ChromeConsoleCapture = require('../index');
const fs = require('fs');
const path = require('path');

class WebAppTester {
  constructor(appUrl) {
    this.appUrl = appUrl;
    this.errors = [];
    this.warnings = [];
    this.logFile = path.join(__dirname, `test-${Date.now()}.log`);
  }

  async runTests() {
    console.log('🚀 Starting web app tests with console monitoring...\n');

    const capture = new ChromeConsoleCapture({
      headless: true, // Run in background
      outputFile: this.logFile,
      colorize: true,
      timestamp: true,
      includeStackTrace: true,
      format: 'default'
    });

    // Collect errors and warnings
    capture.onMessage((msg) => {
      if (msg.type === 'error') {
        this.errors.push(msg);
      } else if (msg.type === 'warn' || msg.type === 'warning') {
        this.warnings.push(msg);
      }
    });

    try {
      // Start monitoring
      await capture.start(this.appUrl);
      console.log(`✅ Connected to ${this.appUrl}`);

      // Run test scenarios
      await this.testUserLogin(capture);
      await this.testDataLoading(capture);
      await this.testFormSubmission(capture);
      await this.testErrorHandling(capture);

      // Generate report
      this.generateReport();

      // Stop capture
      await capture.stop();

      // Return test results
      return {
        passed: this.errors.length === 0,
        errors: this.errors.length,
        warnings: this.warnings.length,
        logFile: this.logFile
      };

    } catch (error) {
      console.error('❌ Test failed:', error);
      await capture.stop();
      throw error;
    }
  }

  async testUserLogin(capture) {
    console.log('\n📋 Testing user login...');
    
    await capture.evaluate(() => {
      console.log('Attempting user login');
      // Simulate login
      if (typeof login === 'function') {
        login('testuser', 'password123');
      } else {
        console.warn('Login function not found');
      }
    });

    // Wait for potential async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async testDataLoading(capture) {
    console.log('📋 Testing data loading...');
    
    await capture.evaluate(() => {
      console.log('Loading application data');
      // Simulate data fetch
      fetch('/api/data')
        .then(res => {
          console.log('Data loaded successfully');
          return res.json();
        })
        .catch(err => {
          console.error('Failed to load data:', err);
        });
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async testFormSubmission(capture) {
    console.log('📋 Testing form submission...');
    
    await capture.evaluate(() => {
      console.log('Testing form validation');
      // Simulate form submission
      const form = document.querySelector('form');
      if (form) {
        console.log('Form found, triggering submit');
        const event = new Event('submit');
        form.dispatchEvent(event);
      } else {
        console.info('No forms found on page');
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async testErrorHandling(capture) {
    console.log('📋 Testing error handling...');
    
    await capture.evaluate(() => {
      console.log('Testing error scenarios');
      
      // Test handled error
      try {
        throw new Error('Test handled error');
      } catch (e) {
        console.error('Caught error (expected):', e.message);
      }

      // Test warning
      console.warn('This is a test warning');

      // Test debug info
      console.debug('Debug information', { testData: true });
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  generateReport() {
    console.log('\n📊 Test Report:');
    console.log('═══════════════════════════════════════');
    
    if (this.errors.length === 0) {
      console.log('✅ No errors detected!');
    } else {
      console.log(`❌ ${this.errors.length} errors found:`);
      this.errors.forEach((error, i) => {
        console.log(`\n  ${i + 1}. ${error.text}`);
        if (error.location) {
          console.log(`     Location: ${error.location.url}:${error.location.lineNumber}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warnings found:`);
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning.text}`);
      });
    }

    console.log(`\n📁 Full log saved to: ${this.logFile}`);
    console.log('═══════════════════════════════════════\n');
  }
}

// Usage example
async function main() {
  // Test a local development server
  const tester = new WebAppTester('http://localhost:3000');
  
  // Or test the example page
  // const tester = new WebAppTester(`file://${path.join(__dirname, 'test-page.html')}`);

  try {
    const results = await tester.runTests();
    
    if (results.passed) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Tests failed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = WebAppTester; 