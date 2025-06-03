#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ChromeConsole = require('../lib/chrome-console');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --url <url> --execute <command>')
  .option('url', {
    alias: 'u',
    describe: 'URL to open in Chrome',
    type: 'string',
    demandOption: true
  })
  .option('execute', {
    alias: 'e',
    describe: 'Command to execute',
    type: 'string',
    demandOption: true
  })
  .option('delay', {
    alias: 'd',
    describe: 'Delay in ms before opening Chrome tab',
    type: 'number',
    default: 2000
  })
  .help()
  .alias('help', 'h')
  .argv;

const chromeConsole = new ChromeConsole({
  url: argv.url,
  command: argv.execute,
  delay: argv.delay
});

chromeConsole.start().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
}); 