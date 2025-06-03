const ChromeConsoleCapture = require('../index');
const path = require('path');

async function runDemo() {
  // Create a capture instance with custom options
  const capture = new ChromeConsoleCapture({
    headless: false, // Show the browser
    outputFile: path.join(__dirname, 'console-output.log'),
    colorize: true,
    timestamp: true,
    includeStackTrace: true,
    format: 'default' // or 'json', 'raw'
  });

  // Register a custom message handler
  capture.onMessage((messageData) => {
    // You can process messages here
    if (messageData.type === 'error') {
      console.log('🚨 Custom handler: Error detected!');
    }
  });

  try {
    // Start capturing from a test page
    const testPageUrl = `file://${path.join(__dirname, 'test-page.html')}`;
    console.log(`Starting console capture for: ${testPageUrl}`);
    console.log('Check the browser window and watch the console output...');
    console.log('Press Ctrl+C to stop.\n');
    
    await capture.start(testPageUrl);

    // You can also execute code in the page context
    await capture.evaluate(() => {
      console.log('Hello from injected code!');
      console.info('This is an info message');
      console.warn('This is a warning');
      console.error('This is an error');
      
      // Test object logging
      console.log('Object:', { name: 'Test', value: 42, nested: { key: 'value' } });
      
      // Test array logging
      console.log('Array:', [1, 2, 3, 'four', { five: 5 }]);
      
      // Test multiple arguments
      console.log('Multiple', 'arguments', 'test', 123, true);
      
      // Create an error
      setTimeout(() => {
        throw new Error('Test error with stack trace');
      }, 1000);
    });

    // Keep running until interrupted
    await new Promise((resolve) => {
      process.on('SIGINT', resolve);
    });

  } catch (error) {
    console.error('Demo error:', error);
  } finally {
    // Clean up
    await capture.stop();
    console.log('\nCapture stopped.');
  }
}

// Run the demo
runDemo(); 